import { ForbiddenException, Injectable, Logger, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../common/prisma.service';
import { FirebaseAdminService } from '../common/firebase/firebase-admin.service';

@Injectable()
export class RemindersService {
  private readonly logger = new Logger(RemindersService.name);

  constructor(
    private prisma: PrismaService,
    private firebase: FirebaseAdminService,
  ) {}

  findMine(creatorId: string) {
    return this.prisma.reminder.findMany({
      where: { creatorId },
      orderBy: { dueDate: 'asc' },
    });
  }

  findRelevant(user: any) {
    return this.prisma.reminder.findMany({
      where: {
        OR: [{ creatorId: user.id }, ...(user.student?.sectionId ? [{ sectionId: user.student.sectionId }] : [])],
      },
      orderBy: { dueDate: 'asc' },
    });
  }

  async create(
    creatorId: string,
    data: {
      category: string;
      priority?: string;
      schedule?: string;
      title: string;
      description?: string;
      dueDate: string;
    },
  ) {
    const reminder = await this.prisma.reminder.create({
      data: {
        creatorId,
        category: data.category as any,
        priority: (data.priority || 'NORMAL') as any,
        schedule: (data.schedule || 'CUSTOM') as any,
        target: 'INDIVIDUAL',
        title: data.title,
        description: data.description,
        dueDate: new Date(data.dueDate),
      },
    });

    try {
      await this.firebase.firestore.collection('reminders').doc(reminder.id).set({
        ...reminder,
        dueDate: new Date(data.dueDate).toISOString(),
        createdAt: new Date().toISOString(),
      });
    } catch {}

    return reminder;
  }

  async createForSection(
    creatorId: string,
    sectionId: string,
    data: {
      category: string;
      priority?: string;
      schedule?: string;
      title: string;
      description?: string;
      dueDate: string;
    },
  ) {
    const reminder = await this.prisma.reminder.create({
      data: {
        creatorId,
        sectionId,
        category: data.category as any,
        priority: (data.priority || 'NORMAL') as any,
        schedule: (data.schedule || 'CUSTOM') as any,
        target: 'SECTION',
        title: data.title,
        description: data.description,
        dueDate: new Date(data.dueDate),
      },
    });

    try {
      await this.firebase.firestore.collection('reminders').doc(reminder.id).set({
        ...reminder,
        dueDate: new Date(data.dueDate).toISOString(),
        createdAt: new Date().toISOString(),
      });
    } catch {}

    return reminder;
  }

  async remove(userId: string, id: string) {
    const reminder = await this.prisma.reminder.findUnique({
      where: { id },
    });

    if (!reminder) {
      throw new NotFoundException(`Reminder with ID ${id} not found`);
    }

    if (reminder.creatorId !== userId) {
      throw new ForbiddenException('You do not have permission to delete this reminder');
    }

    try {
      await this.firebase.firestore.collection('reminders').doc(id).delete();
    } catch (err: any) {
      this.logger.warn(`Failed deleting reminder from Firestore: ${err?.message}`);
    }

    return this.prisma.reminder.delete({
      where: { id },
    });
  }
}