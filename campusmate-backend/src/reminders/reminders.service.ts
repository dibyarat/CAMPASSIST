import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../common/prisma.service';

@Injectable()
export class RemindersService {
  constructor(private prisma: PrismaService) {}

  findMine(creatorId: string) {
    return this.prisma.reminder.findMany({
      where: { creatorId },
      orderBy: { dueDate: 'asc' }
    });
  }

  create(creatorId: string, data: {
    category: string;
    priority?: string;
    schedule?: string;
    title: string;
    description?: string;
    dueDate: string;
  }) {
    return this.prisma.reminder.create({
      data: {
        creatorId,
        category: data.category as any,
        priority: (data.priority || 'NORMAL') as any,
        schedule: (data.schedule || 'CUSTOM') as any,
        target: 'INDIVIDUAL',
        title: data.title,
        description: data.description,
        dueDate: new Date(data.dueDate)
      }
    });
  }

  async remove(creatorId: string, id: string) {
    const reminder = await this.prisma.reminder.findUnique({ where: { id } });
    if (!reminder || reminder.creatorId !== creatorId) {
      throw new NotFoundException('Reminder not found');
    }
    return this.prisma.reminder.delete({ where: { id } });
  }
}