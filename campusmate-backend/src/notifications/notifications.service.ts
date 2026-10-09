import { Injectable, NotFoundException, Logger } from '@nestjs/common';
import { PrismaService } from '../common/prisma.service';
import { FirebaseAdminService } from '../common/firebase/firebase-admin.service';

@Injectable()
export class NotificationsService {
  private readonly logger = new Logger(NotificationsService.name);

  constructor(
    private prisma: PrismaService,
    private firebase: FirebaseAdminService,
  ) {}

  // Standard creation (internal service use)
  async createNotification(data: {
    recipientId: string;
    type: string;
    title: string;
    message: string;
    relatedEntityType?: string;
    relatedEntityId?: string;
  }) {
    // 1. Write to Firestore
    try {
      const docRef = this.firebase.firestore.collection('notifications').doc();
      const notifData = {
        id: docRef.id,
        ...data,
        isRead: false,
        readAt: null,
        createdAt: new Date().toISOString(),
      };
      await docRef.set(notifData);
    } catch (err: any) {
      this.logger.warn(`Failed writing notification to Firestore: ${err?.message}`);
    }

    // 2. Dual-write to Prisma during transition
    return this.prisma.notification.create({ data });
  }

  // --- STUDENT APIs ---

  async getUserNotifications(userId: string, limit = 20, page = 1) {
    const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000);

    // Try reading from Firestore
    try {
      const snapshot = await this.firebase.firestore
        .collection('notifications')
        .where('recipientId', '==', userId)
        .orderBy('createdAt', 'desc')
        .limit(limit * page)
        .get();

      if (!snapshot.empty) {
        const notifs = snapshot.docs
          .map((doc) => doc.data())
          .filter((n) => {
            if (!n.isRead) return true;
            if (n.readAt && new Date(n.readAt) > oneHourAgo) return true;
            return false;
          });

        const skip = (page - 1) * limit;
        return notifs.slice(skip, skip + limit);
      }
    } catch (err: any) {
      this.logger.warn(`Failed reading notifications from Firestore, using Prisma: ${err?.message}`);
    }

    // Fallback to Prisma
    const skip = (page - 1) * limit;
    return this.prisma.notification.findMany({
      where: {
        recipientId: userId,
        OR: [{ isRead: false }, { readAt: { gt: oneHourAgo } }],
      },
      orderBy: { createdAt: 'desc' },
      take: limit,
      skip,
    });
  }

  async getUnreadCount(userId: string) {
    try {
      const snapshot = await this.firebase.firestore
        .collection('notifications')
        .where('recipientId', '==', userId)
        .where('isRead', '==', false)
        .count()
        .get();

      return snapshot.data().count;
    } catch {
      // Fallback to Prisma
      return this.prisma.notification.count({
        where: { recipientId: userId, isRead: false },
      });
    }
  }

  async markAsRead(userId: string, notificationId: string) {
    // Try updating in Firestore
    try {
      const docRef = this.firebase.firestore.collection('notifications').doc(notificationId);
      const doc = await docRef.get();
      if (doc.exists) {
        await docRef.update({
          isRead: true,
          readAt: new Date().toISOString(),
        });
      }
    } catch (err: any) {
      this.logger.warn(`Failed marking notification read in Firestore: ${err?.message}`);
    }

    // Also update in Prisma
    const notification = await this.prisma.notification.findUnique({ where: { id: notificationId } });
    if (!notification || notification.recipientId !== userId) {
      throw new NotFoundException('Notification not found or unauthorized');
    }

    return this.prisma.notification.update({
      where: { id: notificationId },
      data: { isRead: true, readAt: new Date() },
    });
  }

  async createAnnouncement(crUserId: string, title: string, message: string) {
    const cr = await this.prisma.user.findUnique({ where: { id: crUserId }, include: { crAssignment: true } });
    if (!cr || !cr.crAssignment || !cr.crAssignment.isActive) throw new Error('Not an active CR');

    const studentsInSection = await this.prisma.student.findMany({
      where: { sectionId: cr.crAssignment.sectionId },
      select: { userId: true },
    });

    const notifications = [
      ...studentsInSection.map((student: { userId: string }) => ({
        recipientId: student.userId,
        title,
        message,
        type: 'GENERAL_ANNOUNCEMENT',
      })),
      {
        recipientId: crUserId,
        title,
        message,
        type: 'GENERAL_ANNOUNCEMENT',
      },
    ];

    if (notifications.length > 0) {
      // Batch write to Firestore
      try {
        const batch = this.firebase.firestore.batch();
        notifications.forEach((n) => {
          const ref = this.firebase.firestore.collection('notifications').doc();
          batch.set(ref, {
            id: ref.id,
            ...n,
            isRead: false,
            readAt: null,
            createdAt: new Date().toISOString(),
          });
        });
        await batch.commit();
      } catch (err: any) {
        this.logger.warn(`Batch writing announcements to Firestore failed: ${err?.message}`);
      }

      await this.prisma.notification.createMany({ data: notifications });
    }
    return { success: true };
  }

  async markAllAsRead(userId: string) {
    try {
      const snapshot = await this.firebase.firestore
        .collection('notifications')
        .where('recipientId', '==', userId)
        .where('isRead', '==', false)
        .get();

      if (!snapshot.empty) {
        const batch = this.firebase.firestore.batch();
        snapshot.docs.forEach((doc) => {
          batch.update(doc.ref, {
            isRead: true,
            readAt: new Date().toISOString(),
          });
        });
        await batch.commit();
      }
    } catch (err: any) {
      this.logger.warn(`Failed batch marking all read in Firestore: ${err?.message}`);
    }

    return this.prisma.notification.updateMany({
      where: { recipientId: userId, isRead: false },
      data: { isRead: true, readAt: new Date() },
    });
  }
}
