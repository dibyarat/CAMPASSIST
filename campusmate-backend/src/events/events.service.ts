import { ConflictException, Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../common/prisma.service';
import { FirebaseAdminService } from '../common/firebase/firebase-admin.service';

@Injectable()
export class EventsService {
  private readonly logger = new Logger(EventsService.name);

  constructor(
    private prisma: PrismaService,
    private firebase: FirebaseAdminService,
  ) {}

  list(includeAll = false) {
    return this.prisma.campusEvent.findMany({
      where: includeAll ? {} : { OR: [{ endDate: null }, { endDate: { gte: new Date() } }] },
      include: { _count: { select: { registrations: true } } },
      orderBy: { startDate: 'asc' },
    });
  }

  async create(createdBy: string, data: any) {
    const event = await this.prisma.campusEvent.create({
      data: {
        title: data.title,
        description: data.description,
        startDate: new Date(data.startDate),
        endDate: data.endDate ? new Date(data.endDate) : null,
        location: data.location,
        organizer: data.organizer,
        imageUrl: data.imageUrl,
        tags: data.tags,
        createdBy,
      },
    });

    try {
      await this.firebase.firestore.collection('events').doc(event.id).set({
        ...event,
        startDate: new Date(data.startDate).toISOString(),
        endDate: data.endDate ? new Date(data.endDate).toISOString() : null,
        createdAt: new Date().toISOString(),
      });
    } catch {}

    return event;
  }

  async register(eventId: string, userId: string) {
    try {
      const reg = await this.prisma.eventRegistration.create({ data: { eventId, userId } });
      try {
        await this.firebase.firestore.collection('event_registrations').doc(`${eventId}_${userId}`).set({
          eventId,
          userId,
          createdAt: new Date().toISOString(),
        });
      } catch {}
      return reg;
    } catch {
      throw new ConflictException('You are already registered for this event');
    }
  }

  remove(eventId: string) {
    try {
      this.firebase.firestore.collection('events').doc(eventId).delete().catch(() => {});
    } catch {}
    return this.prisma.campusEvent.delete({ where: { id: eventId } });
  }
}