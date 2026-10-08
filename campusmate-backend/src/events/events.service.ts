import { ConflictException, Injectable } from '@nestjs/common';
import { PrismaService } from '../common/prisma.service';

@Injectable()
export class EventsService {
  constructor(private prisma: PrismaService) {}

  list(includeAll = false) {
    return this.prisma.campusEvent.findMany({
      where: includeAll ? {} : { OR: [{ endDate: null }, { endDate: { gte: new Date() } }] },
      include: { _count: { select: { registrations: true } } },
      orderBy: { startDate: 'asc' }
    });
  }

  create(createdBy: string, data: any) {
    return this.prisma.campusEvent.create({
      data: {
        title: data.title,
        description: data.description,
        startDate: new Date(data.startDate),
        endDate: data.endDate ? new Date(data.endDate) : null,
        location: data.location,
        organizer: data.organizer,
        imageUrl: data.imageUrl,
        tags: data.tags,
        createdBy
      }
    });
  }

  async register(eventId: string, userId: string) {
    try {
      return await this.prisma.eventRegistration.create({ data: { eventId, userId } });
    } catch {
      throw new ConflictException('You are already registered for this event');
    }
  }

  remove(eventId: string) {
    return this.prisma.campusEvent.delete({ where: { id: eventId } });
  }
}