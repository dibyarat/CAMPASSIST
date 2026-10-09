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
    try {
      const snap = await this.firebase.firestore.collection('rooms').get();
      if (!snap.empty) return snap.docs.map((doc) => doc.data());
    } catch {}
    return this.prisma.room.findMany();
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

    await this.prisma.roomReport.create({
      data: { roomId: id, status, reportedBy, notes },
    });

    try {
      await this.firebase.firestore.collection('rooms').doc(id).set(
        {
          status,
          notes,
          updatedAt: new Date().toISOString(),
        },
        { merge: true },
      );
    } catch {}

    return this.prisma.room.update({
      where: { id },
      data: { status, notes },
    });
  }

  async getAvailableRooms() {
    return this.prisma.room.findMany({
      where: {
        OR: [{ status: RoomStatus.FREE_BY_TIMETABLE }, { status: RoomStatus.REPORTED_FREE }],
      },
    });
  }
}
