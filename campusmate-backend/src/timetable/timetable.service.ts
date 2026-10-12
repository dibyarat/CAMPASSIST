import { Injectable, ConflictException, NotFoundException, ForbiddenException, Logger } from '@nestjs/common';
import { PrismaService } from '../common/prisma.service';
import { FirebaseAdminService } from '../common/firebase/firebase-admin.service';

@Injectable()
export class TimetableService {
  private readonly logger = new Logger(TimetableService.name);

  constructor(
    private prisma: PrismaService,
    private firebase: FirebaseAdminService,
  ) {}

  async create(data: {
    subjectId: string;
    sectionId: string;
    roomId?: string;
    termId: string;
    facultyRef?: string;
    dayOfWeek: number;
    startTime: string;
    endTime: string;
  }) {
    if (data.roomId) {
      const roomConflict = await this.prisma.timetableEntry.findFirst({
        where: {
          roomId: data.roomId,
          dayOfWeek: data.dayOfWeek,
          termId: data.termId,
          status: 'ACTIVE',
          OR: [
            { startTime: { lte: data.startTime }, endTime: { gt: data.startTime } },
            { startTime: { lt: data.endTime }, endTime: { gte: data.endTime } },
          ],
        },
      });
      if (roomConflict) throw new ConflictException('Room is already booked for this time slot');
    }

    const sectionConflict = await this.prisma.timetableEntry.findFirst({
      where: {
        sectionId: data.sectionId,
        dayOfWeek: data.dayOfWeek,
        termId: data.termId,
        status: 'ACTIVE',
        OR: [
          { startTime: { lte: data.startTime }, endTime: { gt: data.startTime } },
          { startTime: { lt: data.endTime }, endTime: { gte: data.endTime } },
        ],
      },
    });
    if (sectionConflict) throw new ConflictException('Section already has a class scheduled at this time');

    const entry = await this.prisma.timetableEntry.create({ data, include: { subject: true, room: true } });

    try {
      await this.firebase.firestore.collection('timetable').doc(entry.id).set({
        ...entry,
        createdAt: new Date().toISOString(),
      });
    } catch (err: any) {
      this.logger.warn(`Failed syncing timetable entry to Firestore: ${err?.message}`);
    }

    return entry;
  }

  async findForSection(sectionId: string, termId: string) {
    try {
      const snap = await this.firebase.firestore
        .collection('timetable')
        .where('sectionId', '==', sectionId)
        .where('status', '==', 'ACTIVE')
        .get();

      if (!snap.empty) {
        return snap.docs
          .map((doc) => doc.data())
          .sort((a: any, b: any) => a.dayOfWeek - b.dayOfWeek || a.startTime.localeCompare(b.startTime));
      }
    } catch (err: any) {
      this.logger.warn(`Failed reading timetable from Firestore: ${err?.message}`);
    }

    return this.prisma.timetableEntry.findMany({
      where: { sectionId, termId, status: 'ACTIVE' },
      include: { subject: true, room: true },
      orderBy: [{ dayOfWeek: 'asc' }, { startTime: 'asc' }],
    });
  }

  async getSubjects() {
    try {
      const snap = await this.firebase.firestore.collection('subjects').get();
      if (!snap.empty) return snap.docs.map((doc) => doc.data());
    } catch {}

    return this.prisma.subject.findMany();
  }

  // CR Actions

  async createDynamic(data: any, sectionId: string) {
    let subject = await this.prisma.subject.findFirst({ where: { name: data.subjectName } });
    if (!subject) {
      subject = await this.prisma.subject.create({
        data: {
          name: data.subjectName,
          code: data.subjectName.substring(0, 3).toUpperCase() + Math.floor(Math.random() * 1000),
          credits: 3,
          type: 'Theory',
        },
      });
    }

    let room = null;
    if (data.roomNumber && data.roomNumber.trim() !== '') {
      room = await this.prisma.room.findFirst({ where: { roomNumber: data.roomNumber } });
      if (!room) {
        room = await this.prisma.room.create({
          data: { roomNumber: data.roomNumber },
        });
      }
    }

    const entry = await this.prisma.timetableEntry.create({
      data: {
        subjectId: subject.id,
        sectionId: sectionId,
        roomId: room ? room.id : null,
        termId: data.termId || 'TERM-1',
        dayOfWeek: parseInt(data.dayOfWeek.toString()),
        startTime: data.startTime,
        endTime: data.endTime,
        status: 'ACTIVE',
      },
      include: { subject: true, room: true },
    });

    try {
      await this.firebase.firestore.collection('timetable').doc(entry.id).set({
        ...entry,
        createdAt: new Date().toISOString(),
      });
    } catch {}

    return entry;
  }

  async updateForCr(entryId: string, crSectionId: string, data: any) {
    const entry = await this.prisma.timetableEntry.findUnique({ where: { id: entryId } });
    if (!entry) throw new NotFoundException('Entry not found');
    if (entry.sectionId !== crSectionId) throw new ForbiddenException('Cannot edit another section');

    try {
      await this.firebase.firestore.collection('timetable').doc(entryId).set(data, { merge: true });
    } catch {}

    return this.prisma.timetableEntry.update({ where: { id: entryId }, data });
  }

  async deleteForCr(entryId: string, crSectionId: string) {
    const entry = await this.prisma.timetableEntry.findUnique({ where: { id: entryId } });
    if (!entry) throw new NotFoundException('Entry not found');
    if (entry.sectionId !== crSectionId) throw new ForbiddenException('Cannot delete another section');

    try {
      await this.firebase.firestore.collection('timetable').doc(entryId).delete();
    } catch {}

    return this.prisma.timetableEntry.delete({ where: { id: entryId } });
  }

  async reportCancellation(entryId: string, crSectionId: string, note?: string) {
    const entry = await this.prisma.timetableEntry.findUnique({ where: { id: entryId } });

    if (!entry) throw new NotFoundException('Timetable entry not found');
    if (entry.sectionId !== crSectionId)
      throw new ConflictException('CR can only cancel classes for their assigned section');

    try {
      await this.firebase.firestore
        .collection('timetable')
        .doc(entryId)
        .set({ status: 'CANCELLED', notes: note }, { merge: true });
    } catch {}

    return this.prisma.timetableEntry.update({
      where: { id: entryId },
      data: { status: 'CANCELLED', notes: note },
    });
  }

  async reportRoomChange(entryId: string, newRoomId: string, crSectionId: string) {
    const entry = await this.prisma.timetableEntry.findUnique({ where: { id: entryId } });
    if (!entry) throw new NotFoundException('Timetable entry not found');
    if (entry.sectionId !== crSectionId)
      throw new ConflictException('CR can only change rooms for their assigned section');

    const roomConflict = await this.prisma.timetableEntry.findFirst({
      where: {
        roomId: newRoomId,
        dayOfWeek: entry.dayOfWeek,
        termId: entry.termId,
        status: 'ACTIVE',
        id: { not: entryId },
        OR: [
          { startTime: { lte: entry.startTime }, endTime: { gt: entry.startTime } },
          { startTime: { lt: entry.endTime }, endTime: { gte: entry.endTime } },
        ],
      },
    });
    if (roomConflict) throw new ConflictException('The new room is already booked for this time slot');

    try {
      await this.firebase.firestore
        .collection('timetable')
        .doc(entryId)
        .set({ roomId: newRoomId }, { merge: true });
    } catch {}

    return this.prisma.timetableEntry.update({
      where: { id: entryId },
      data: { roomId: newRoomId },
    });
  }

  async importEntriesForCr(
    entries: Array<{
      dayOfWeek: number | string;
      startTime: string;
      endTime: string;
      subjectName: string;
      subjectCode?: string;
      roomNumber?: string;
      classType?: string;
      termId?: string;
    }>,
    crSectionId: string,
    termId: string,
    options?: { replaceExisting?: boolean }
  ) {
    if (!Array.isArray(entries) || entries.length === 0) {
      throw new ConflictException('No timetable entries provided for import');
    }

    if (options?.replaceExisting) {
      const existing = await this.prisma.timetableEntry.findMany({
        where: { sectionId: crSectionId, termId },
      });

      if (existing.length > 0) {
        await this.prisma.timetableEntry.deleteMany({
          where: { sectionId: crSectionId, termId },
        });

        for (const entry of existing) {
          try {
            await this.firebase.firestore.collection('timetable').doc(entry.id).delete();
          } catch (err: any) {
            this.logger.warn(`Failed removing deleted entry ${entry.id} from Firestore: ${err?.message}`);
          }
        }
      }
    }

    const createdEntries: any[] = [];
    const errors: string[] = [];

    for (let i = 0; i < entries.length; i++) {
      const item = entries[i];
      const rowNum = i + 1;
      const day = parseInt(String(item.dayOfWeek), 10);
      const subjectName = String(item.subjectName || '').trim();
      const startTime = String(item.startTime || '').trim();
      const endTime = String(item.endTime || '').trim();

      if (!subjectName) {
        errors.push(`Row ${rowNum}: Subject name is missing`);
        continue;
      }
      if (isNaN(day) || day < 1 || day > 7) {
        errors.push(`Row ${rowNum}: Invalid day of week '${item.dayOfWeek}' (expected 1-7 or Monday-Sunday)`);
        continue;
      }
      if (!startTime || !endTime) {
        errors.push(`Row ${rowNum}: Start time and end time are required`);
        continue;
      }
      if (startTime >= endTime) {
        errors.push(`Row ${rowNum}: Start time (${startTime}) must be earlier than end time (${endTime})`);
        continue;
      }

      try {
        let subject = await this.prisma.subject.findFirst({
          where: {
            OR: [
              { name: { equals: subjectName, mode: 'insensitive' as const } },
              ...(item.subjectCode ? [{ code: { equals: item.subjectCode.trim(), mode: 'insensitive' as const } }] : []),
            ],
          },
        });

        if (!subject) {
          const generatedCode = (item.subjectCode && item.subjectCode.trim()) ||
            (subjectName.replace(/[^A-Za-z0-9]/g, '').substring(0, 4).toUpperCase() || 'SUB') + Math.floor(100 + Math.random() * 900);

          subject = await this.prisma.subject.create({
            data: {
              name: subjectName,
              code: generatedCode,
              credits: 3,
              type: item.classType || 'Theory',
            },
          });
        }

        try {
          const subjectSectionExists = await this.prisma.subjectSection.findFirst({
            where: { subjectId: subject.id, sectionId: crSectionId },
          });
          if (!subjectSectionExists) {
            await this.prisma.subjectSection.create({
              data: { subjectId: subject.id, sectionId: crSectionId },
            });
          }
        } catch {}

        let room = null;
        const roomNumber = item.roomNumber ? String(item.roomNumber).trim() : '';
        if (roomNumber) {
          room = await this.prisma.room.findFirst({
            where: { roomNumber: { equals: roomNumber, mode: 'insensitive' as const } },
          });
          if (!room) {
            room = await this.prisma.room.create({
              data: { roomNumber },
            });
          }
        }

        const entry = await this.prisma.timetableEntry.create({
          data: {
            subjectId: subject.id,
            sectionId: crSectionId,
            roomId: room ? room.id : null,
            termId,
            dayOfWeek: day,
            startTime,
            endTime,
            status: 'ACTIVE',
          },
          include: { subject: true, room: true },
        });

        try {
          await this.firebase.firestore.collection('timetable').doc(entry.id).set({
            ...entry,
            createdAt: new Date().toISOString(),
          });
        } catch (err: any) {
          this.logger.warn(`Failed syncing imported entry to Firestore: ${err?.message}`);
        }

        createdEntries.push(entry);
      } catch (err: any) {
        this.logger.error(`Failed to import row ${rowNum}: ${err.message}`);
        errors.push(`Row ${rowNum}: ${err.message}`);
      }
    }

    return {
      success: createdEntries.length > 0,
      importedCount: createdEntries.length,
      totalRows: entries.length,
      entries: createdEntries,
      errors,
    };
  }
}
