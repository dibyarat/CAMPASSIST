import { Injectable } from '@nestjs/common';
import { PrismaService } from '../common/prisma.service';

@Injectable()
export class AuditService {
  constructor(private prisma: PrismaService) {}

  async logAction(data: {
    userId?: string;
    userRole?: string;
    action: string;
    entityType: string;
    entityId: string;
    metadata?: any;
    status: 'SUCCESS' | 'FAILURE';
    ipAddress?: string;
  }) {
    // Fire and forget, don't await so it doesn't block the main request
    this.prisma.auditLog.create({
      data: {
        userId: data.userId,
        userRole: data.userRole,
        action: data.action,
        entityType: data.entityType,
        entityId: data.entityId,
        metadata: data.metadata || {},
        status: data.status,
        ipAddress: data.ipAddress
      }
    }).catch(err => console.error('Failed to write audit log', err));
  }

  async getRecentLogs(limit = 50) {
    return this.prisma.auditLog.findMany({
      orderBy: { timestamp: 'desc' },
      take: limit,
      include: { user: { select: { email: true, profile: { select: { fullName: true } } } } }
    });
  }
}
