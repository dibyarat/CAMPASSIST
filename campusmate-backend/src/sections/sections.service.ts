import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../common/prisma.service';

@Injectable()
export class SectionsService {
  constructor(private prisma: PrismaService) {}

  async create(data: { name: string; departmentId: string; semesterId: string }) {
    return this.prisma.section.create({ data });
  }

  async findAll() {
    return this.prisma.section.findMany({
      include: { department: true, semester: true }
    });
  }

  async assignCr(data: { userId: string; sectionId: string; termId: string }) {
    return this.prisma.crAssignment.create({
      data: {
        userId: data.userId,
        sectionId: data.sectionId,
        termId: data.termId,
        isActive: true
      }
    });
  }

  async removeCrAssignment(assignmentId: string) {
    return this.prisma.crAssignment.update({
      where: { id: assignmentId },
      data: { isActive: false, endDate: new Date() }
    });
  }
}
