import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../common/prisma.service';
import { FirebaseAdminService } from '../common/firebase/firebase-admin.service';

@Injectable()
export class SubjectsService {
  private readonly logger = new Logger(SubjectsService.name);

  constructor(
    private prisma: PrismaService,
    private firebase: FirebaseAdminService,
  ) {}

  async create(data: { code: string; name: string; credits: number; type: string }) {
    const subject = await this.prisma.subject.create({ data });
    try {
      await this.firebase.firestore.collection('subjects').doc(subject.id).set(subject);
    } catch (err: any) {
      this.logger.warn(`Failed writing subject to Firestore: ${err?.message}`);
    }
    return subject;
  }

  async findAll() {
    try {
      const snap = await this.firebase.firestore.collection('subjects').get();
      if (!snap.empty) {
        return snap.docs.map((doc) => doc.data());
      }
    } catch (err: any) {
      this.logger.warn(`Failed fetching subjects from Firestore: ${err?.message}`);
    }
    return this.prisma.subject.findMany();
  }

  async update(id: string, data: any) {
    try {
      await this.firebase.firestore.collection('subjects').doc(id).set(data, { merge: true });
    } catch {}
    return this.prisma.subject.update({ where: { id }, data });
  }

  async remove(id: string) {
    try {
      await this.firebase.firestore.collection('subjects').doc(id).delete();
    } catch {}
    return this.prisma.subject.delete({ where: { id } });
  }
}
