import { ConflictException, Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../common/prisma.service';
import { FirebaseAdminService } from '../common/firebase/firebase-admin.service';

@Injectable()
export class OffersService {
  private readonly logger = new Logger(OffersService.name);

  constructor(
    private prisma: PrismaService,
    private firebase: FirebaseAdminService,
  ) {}

  list() {
    return this.prisma.offer.findMany({
      where: { OR: [{ expiresAt: null }, { expiresAt: { gte: new Date() } }] },
      orderBy: { createdAt: 'desc' },
    });
  }

  async create(createdBy: string, data: any) {
    const offer = await this.prisma.offer.create({
      data: { ...data, createdBy, expiresAt: data.expiresAt ? new Date(data.expiresAt) : null },
    });

    try {
      await this.firebase.firestore.collection('offers').doc(offer.id).set({
        ...offer,
        expiresAt: data.expiresAt ? new Date(data.expiresAt).toISOString() : null,
        createdAt: new Date().toISOString(),
      });
    } catch {}

    return offer;
  }

  async claim(offerId: string, userId: string) {
    try {
      const claim = await this.prisma.offerClaim.create({ data: { offerId, userId } });
      try {
        await this.firebase.firestore.collection('offer_claims').doc(`${offerId}_${userId}`).set({
          offerId,
          userId,
          createdAt: new Date().toISOString(),
        });
      } catch {}
      return claim;
    } catch {
      throw new ConflictException('You have already claimed this offer');
    }
  }
}