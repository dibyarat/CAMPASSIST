import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../common/prisma.service';
import { FirebaseAdminService } from '../common/firebase/firebase-admin.service';

@Injectable()
export class MapService {
  private readonly logger = new Logger(MapService.name);

  constructor(
    private prisma: PrismaService,
    private firebase: FirebaseAdminService,
  ) {}

  async submitLocation(creatorId: string, data: any) {
    const loc = await this.prisma.mapLocation.create({ data: { ...data, creatorId } });
    try {
      await this.firebase.firestore.collection('map_locations').doc(loc.id).set({
        ...loc,
        createdAt: new Date().toISOString(),
      });
    } catch {}
    return loc;
  }

  // Developer Moderation
  async moderateLocation(locationId: string, status: 'APPROVED' | 'REJECTED' | 'HIDDEN') {
    try {
      await this.firebase.firestore.collection('map_locations').doc(locationId).set({ status }, { merge: true });
    } catch {}
    return this.prisma.mapLocation.update({ where: { id: locationId }, data: { status } });
  }

  // Fetch approved locations for students
  async getApprovedLocations() {
    try {
      const snap = await this.firebase.firestore
        .collection('map_locations')
        .where('status', '==', 'APPROVED')
        .get();

      if (!snap.empty) return snap.docs.map((doc) => doc.data());
    } catch {}
    return this.prisma.mapLocation.findMany({ where: { status: 'APPROVED' }, orderBy: { name: 'asc' } });
  }

  async getModerationQueue() {
    return this.prisma.mapLocation.findMany({ where: { status: 'PENDING' }, orderBy: { createdAt: 'asc' } });
  }
}
