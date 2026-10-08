import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../common/prisma.service';

@Injectable()
export class NotificationsService {
  constructor(private prisma: PrismaService) {}

  // Standard creation (internal service use)
  async createNotification(data: {
    recipientId: string;
    type: string;
    title: string;
    message: string;
    relatedEntityType?: string;
    relatedEntityId?: string;
  }) {
    return this.prisma.notification.create({ data });
  }

  // --- STUDENT APIs ---

  async getUserNotifications(userId: string, limit = 20, page = 1) {
    const skip = (page - 1) * limit;
    
    return this.prisma.notification.findMany({
      where: { recipientId: userId },
      orderBy: { createdAt: 'desc' },
      take: limit,
      skip
    });
  }

  async getUnreadCount(userId: string) {
    return this.prisma.notification.count({
      where: { recipientId: userId, isRead: false }
    });
  }

  async markAsRead(userId: string, notificationId: string) {
    const notification = await this.prisma.notification.findUnique({ where: { id: notificationId } });
    if (!notification || notification.recipientId !== userId) {
      throw new NotFoundException('Notification not found or unauthorized');
    }

    return this.prisma.notification.update({
      where: { id: notificationId },
      data: { isRead: true }
    });
  }

  async createAnnouncement(crUserId: string, title: string, message: string) {
    const cr = await this.prisma.user.findUnique({ where: { id: crUserId }, include: { crAssignment: true } });
    if (!cr || !cr.crAssignment || !cr.crAssignment.isActive) throw new Error('Not an active CR');
    
    const studentsInSection = await this.prisma.student.findMany({
      where: { sectionId: cr.crAssignment.sectionId },
      select: { userId: true }
    });
    
    const notifications = studentsInSection.map((s: any) => ({
      recipientId: s.userId,
      title,
      message,
      type: 'GENERAL_ANNOUNCEMENT' as any
    }));
    
    if (notifications.length > 0) {
      await this.prisma.notification.createMany({ data: notifications });
    }
    return { success: true };
  }

  async markAllAsRead(userId: string) {
    return this.prisma.notification.updateMany({
      where: { recipientId: userId, isRead: false },
      data: { isRead: true }
    });
  }
}


