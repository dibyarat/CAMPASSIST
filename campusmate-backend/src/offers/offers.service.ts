import { ConflictException, Injectable } from '@nestjs/common';
import { PrismaService } from '../common/prisma.service';

@Injectable()
export class OffersService {
  constructor(private prisma: PrismaService) {}

  list() {
    return this.prisma.offer.findMany({
      where: { OR: [{ expiresAt: null }, { expiresAt: { gte: new Date() } }] },
      orderBy: { createdAt: 'desc' }
    });
  }

  create(createdBy: string, data: any) {
    return this.prisma.offer.create({
      data: { ...data, createdBy, expiresAt: data.expiresAt ? new Date(data.expiresAt) : null }
    });
  }

  async claim(offerId: string, userId: string) {
    try {
      return await this.prisma.offerClaim.create({ data: { offerId, userId } });
    } catch {
      throw new ConflictException('You have already claimed this offer');
    }
  }
}