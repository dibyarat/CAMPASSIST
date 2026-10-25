import { Injectable, NotFoundException, Logger } from '@nestjs/common';
import { PrismaService } from '../common/prisma.service';
import { FirebaseAdminService } from '../common/firebase/firebase-admin.service';
import { RoomStatus } from '../common/enums';

@Injectable()
export class RoomsService {
  private readonly logger = new Logger(RoomsService.name);

  constructor(
    private prisma: PrismaService,
    private firebase: FirebaseAdminService,
  ) {}

  async create(data: { roomNumber: string; building?: string; capacity: number; isAC: boolean; isLab: boolean }) {
    const room = await this.prisma.room.create({ data });
    try {
      await this.firebase.firestore.collection('rooms').doc(room.id).set({
        ...room,
        createdAt: new Date().toISOString(),
      });
    } catch {}
    return room;
  }

  async findAll() {
    let prismaRooms: any[] = [];
    try {
      prismaRooms = await this.prisma.room.findMany({
        orderBy: { roomNumber: 'asc' },
      });
    } catch (err: any) {
      this.logger.warn(`Prisma findMany rooms error: ${err?.message}`);
    }

    try {
      const snap = await this.firebase.firestore.collection('rooms').get();
      const firestoreMap = new Map<string, any>();
      snap.docs.forEach((doc) => {
        firestoreMap.set(doc.id, doc.data());
      });

      if (prismaRooms.length > 0) {
        // Merge latest status and backfill any missing full records to Firestore
        const merged = prismaRooms.map((room) => {
          const fData = firestoreMap.get(room.id);
          const finalRoom = {
            ...room,
            status: fData?.status || room.status || RoomStatus.FREE_BY_TIMETABLE,
            notes: fData?.notes !== undefined ? fData.notes : room.notes,
          };
          if (!fData || !fData.roomNumber) {
            this.firebase.firestore.collection('rooms').doc(room.id).set(finalRoom, { merge: true }).catch(() => {});
          }
          return finalRoom;
        });
        return merged;
      }

      // If Prisma had no records, use valid Firestore room docs
      if (!snap.empty) {
        return snap.docs
          .map((doc) => ({ id: doc.id, ...doc.data() }))
          .filter((r: any) => r.roomNumber);
      }
    } catch (err: any) {
      this.logger.warn(`Firestore rooms query error: ${err?.message}`);
    }

    return prismaRooms;
  }

  async update(id: string, data: any) {
    const room = await this.prisma.room.findUnique({ where: { id } });
    if (!room) throw new NotFoundException('Room not found');

    const updatePayload: any = {};
    if (data.roomNumber !== undefined) updatePayload.roomNumber = data.roomNumber;
    if (data.building !== undefined) updatePayload.building = data.building;
    if (data.block !== undefined) updatePayload.block = data.block;
    if (data.floor !== undefined) updatePayload.floor = data.floor;
    if (data.capacity !== undefined) updatePayload.capacity = Number(data.capacity);
    if (data.isAC !== undefined) updatePayload.isAC = Boolean(data.isAC);
    if (data.isLab !== undefined) updatePayload.isLab = Boolean(data.isLab);
    if (data.equipment !== undefined) updatePayload.equipment = data.equipment;
    if (data.status !== undefined) updatePayload.status = data.status;
    if (data.notes !== undefined) updatePayload.notes = data.notes;

    const updated = await this.prisma.room.update({
      where: { id },
      data: updatePayload,
    });

    try {
      await this.firebase.firestore.collection('rooms').doc(id).set(
        {
          ...updated,
          updatedAt: new Date().toISOString(),
        },
        { merge: true },
      );
    } catch {}

    return updated;
  }

  async remove(id: string) {
    try {
      this.firebase.firestore.collection('rooms').doc(id).delete().catch(() => {});
    } catch {}
    return this.prisma.room.delete({ where: { id } });
  }

  async updateStatus(id: string, status: RoomStatus, reportedBy: string, notes?: string) {
    const room = await this.prisma.room.findUnique({ where: { id } });
    if (!room) throw new NotFoundException('Room not found');

    const cleanNotes = notes === '' ? null : (notes ?? null);

    await this.prisma.roomReport.create({
      data: { roomId: id, status, reportedBy, notes: cleanNotes },
    });

    const updated = await this.prisma.room.update({
      where: { id },
      data: { status, notes: cleanNotes },
    });

    try {
      await this.firebase.firestore.collection('rooms').doc(id).set(
        {
          ...updated,
          notes: cleanNotes,
          updatedAt: new Date().toISOString(),
        },
        { merge: true },
      );
    } catch {}

    return updated;
  }

  async getAvailableRooms() {
    const all = await this.findAll();
    return all.filter(
      (r: any) => r.status === RoomStatus.FREE_BY_TIMETABLE || r.status === RoomStatus.REPORTED_FREE
    );
  }
}
