import { Injectable, ForbiddenException, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../common/prisma.service';

@Injectable()
export class SubmissionsService {
  constructor(private prisma: PrismaService) {}

  async createOrUpdateSubmission(studentId: string, data: any) {
    // Ensures a student can only update their own submission tracking
    if (data.id) {
      const existing = await this.prisma.submission.findUnique({ where: { id: data.id } });
      if (!existing || existing.studentId !== studentId) {
        throw new ForbiddenException('Cannot modify a submission that does not belong to you');
      }
      return this.prisma.submission.update({ where: { id: data.id }, data });
    }
    
    return this.prisma.submission.create({
      data: { ...data, studentId }
    });
  }

  async getMySubmissions(studentId: string) {
    return this.prisma.submission.findMany({
      where: { studentId },
      orderBy: { deadline: 'asc' },
      include: { subject: true }
    });
  }
}
