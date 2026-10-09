import { Injectable, ForbiddenException, Logger } from '@nestjs/common';
import { PrismaService } from '../common/prisma.service';
import { FirebaseAdminService } from '../common/firebase/firebase-admin.service';

@Injectable()
export class SubmissionsService {
  private readonly logger = new Logger(SubmissionsService.name);

  constructor(
    private prisma: PrismaService,
    private firebase: FirebaseAdminService,
  ) {}

  async createOrUpdateSubmission(studentId: string, data: any) {
    if (data.id) {
      const existing = await this.prisma.submission.findUnique({ where: { id: data.id } });
      if (!existing || existing.studentId !== studentId) {
        throw new ForbiddenException('Cannot modify a submission that does not belong to you');
      }

      const updated = await this.prisma.submission.update({ where: { id: data.id }, data });
      try {
        await this.firebase.firestore.collection('submissions').doc(data.id).set(data, { merge: true });
      } catch {}

      return updated;
    }

    const created = await this.prisma.submission.create({
      data: { ...data, studentId },
    });

    try {
      await this.firebase.firestore.collection('submissions').doc(created.id).set({
        ...created,
        deadline: created.deadline ? new Date(created.deadline).toISOString() : null,
        createdAt: new Date().toISOString(),
      });
    } catch (err: any) {
      this.logger.warn(`Failed writing submission to Firestore: ${err?.message}`);
    }

    return created;
  }

  async getMySubmissions(studentId: string) {
    try {
      const snap = await this.firebase.firestore
        .collection('submissions')
        .where('studentId', '==', studentId)
        .orderBy('deadline', 'asc')
        .get();

      if (!snap.empty) {
        return snap.docs.map((doc) => doc.data());
      }
    } catch {}

    return this.prisma.submission.findMany({
      where: { studentId },
      orderBy: { deadline: 'asc' },
      include: { subject: true },
    });
  }
}
