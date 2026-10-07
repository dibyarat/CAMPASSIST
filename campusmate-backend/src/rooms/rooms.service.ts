import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../common/prisma.service';
import { RoomStatus } from '@prisma/client';

@Injectable()
export class RoomsService {
  constructor(private prisma: PrismaService) {}

  async create(data: { roomNumber: string; building?: string; capacity: number; isAC: boolean; isLab: boolean }) {
    return this.prisma.room.create({ data });
  }

  async findAll() {
    return this.prisma.room.findMany();
  }

  async remove(id: string) {
    return this.prisma.room.delete({ where: { id } });
  }

  async updateStatus(id: string, status: RoomStatus, reportedBy: string, notes?: string) {
    const room = await this.prisma.room.findUnique({ where: { id } });
    if (!room) throw new NotFoundException('Room not found');

    // Create a room report for auditing/history
    await this.prisma.roomReport.create({
      data: { roomId: id, status, reportedBy, notes }
    });

    return this.prisma.room.update({
      where: { id },
      data: { status, notes }
    });
  }

  // Find currently empty rooms (Requires complex time-based query against Timetable in reality, 
  // but this uses the simplified status field + time logic for demonstration)
  async getAvailableRooms() {
    // A real implementation would query TimetableEntry for the current dayOfWeek and time.
    // For now, we return rooms explicitly marked as FREE or REPORTED_FREE
    return this.prisma.room.findMany({
      where: {
        OR: [
          { status: RoomStatus.FREE_BY_TIMETABLE },
          { status: RoomStatus.REPORTED_FREE }
        ]
      }
    });
  }
}

