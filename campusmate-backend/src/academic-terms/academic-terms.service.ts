import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../common/prisma.service';
import { FirebaseAdminService } from '../common/firebase/firebase-admin.service';

@Injectable()
export class AcademicTermsService {
  private readonly logger = new Logger(AcademicTermsService.name);

  constructor(
    private prisma: PrismaService,
    private firebase: FirebaseAdminService,
  ) {}

  async getCurrent() {
    try {
      let term = await this.prisma.academicTerm.findFirst({
        where: { isCurrent: true },
      });

      if (!term) {
        term = await this.prisma.academicTerm.findFirst({
          orderBy: { startDate: 'desc' },
        });
      }

      if (!term) {
        term = await this.prisma.academicTerm.create({
          data: {
            id: 'TERM-1',
            name: 'Fall 2026',
            startDate: new Date(),
            endDate: new Date(Date.now() + 180 * 24 * 60 * 60 * 1000),
            isCurrent: true,
          },
        });
      }

      try {
        await this.firebase.firestore.collection('academic_terms').doc(term.id).set({
          name: term.name,
          startDate: term.startDate.toISOString(),
          endDate: term.endDate.toISOString(),
          isCurrent: term.isCurrent,
        }, { merge: true });
      } catch (err: any) {
        this.logger.warn(`Failed syncing academic term to Firestore: ${err?.message}`);
      }

      return {
        id: term.id,
        name: term.name,
        startDate: term.startDate.toISOString(),
        endDate: term.endDate.toISOString(),
        isCurrent: term.isCurrent,
      };
    } catch (e: any) {
      this.logger.error(`Error querying Prisma for current term: ${e?.message}`);
      try {
        const snap = await this.firebase.firestore.collection('academic_terms').where('isCurrent', '==', true).limit(1).get();
        if (!snap.empty) {
          return { id: snap.docs[0].id, ...snap.docs[0].data() };
        }
      } catch {}

      return {
        id: 'TERM-1',
        name: 'Fall 2026',
        isCurrent: true,
        startDate: new Date().toISOString(),
        endDate: new Date(Date.now() + 180 * 24 * 60 * 60 * 1000).toISOString(),
      };
    }
  }
}