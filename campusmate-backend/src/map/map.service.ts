import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../common/prisma.service';

@Injectable()
export class MapService {
  constructor(private prisma: PrismaService) {}

  async submitLocation(creatorId: string, data: any) {
    return this.prisma.mapLocation.create({ data: { ...data, creatorId } });
  }

  // Developer Moderation
  async moderateLocation(locationId: string, status: 'APPROVED' | 'REJECTED' | 'HIDDEN') {
    return this.prisma.mapLocation.update({ where: { id: locationId }, data: { status } });
  }

  // Fetch approved locations for students
  async getApprovedLocations() {
    return this.prisma.mapLocation.findMany({ where: { status: 'APPROVED' }, orderBy: { name: 'asc' } });
  }

  async getModerationQueue() {
    return this.prisma.mapLocation.findMany({ where: { status: 'PENDING' }, orderBy: { createdAt: 'asc' } });
  }
}
