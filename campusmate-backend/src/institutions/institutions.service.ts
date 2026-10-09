import { Injectable, ConflictException, Logger } from '@nestjs/common';
import { PrismaService } from '../common/prisma.service';
import { FirebaseAdminService } from '../common/firebase/firebase-admin.service';

@Injectable()
export class InstitutionsService {
  private readonly logger = new Logger(InstitutionsService.name);

  constructor(
    private prisma: PrismaService,
    private firebase: FirebaseAdminService,
  ) {}

  async create(data: { name: string; code: string }) {
    const existing = await this.prisma.institution.findUnique({ where: { code: data.code } });
    if (existing) {
      throw new ConflictException('Institution code already exists');
    }

    const inst = await this.prisma.institution.create({ data });

    try {
      await this.firebase.firestore.collection('institutions').doc(inst.id).set({
        id: inst.id,
        name: inst.name,
        code: inst.code,
        createdAt: new Date().toISOString(),
      });
    } catch (err: any) {
      this.logger.warn(`Failed writing institution to Firestore: ${err?.message}`);
    }

    return inst;
  }

  async findAll() {
    try {
      const institutions = await this.prisma.institution.findMany({
        include: {
          _count: {
            select: { users: true, sections: true },
          },
        },
        orderBy: { createdAt: 'desc' },
      });

      // Update Firestore cache in background
      try {
        for (const inst of institutions) {
          await this.firebase.firestore.collection('institutions').doc(inst.id).set(
            {
              id: inst.id,
              name: inst.name,
              code: inst.code,
              _count: inst._count,
              createdAt: inst.createdAt.toISOString(),
            },
            { merge: true },
          );
        }
      } catch {}

      return institutions;
    } catch (err: any) {
      this.logger.warn(`Failed fetching institutions from Prisma, falling back to Firestore: ${err?.message}`);
      const snap = await this.firebase.firestore.collection('institutions').get();
      if (!snap.empty) {
        return snap.docs.map((doc) => doc.data());
      }
      return [];
    }
  }

  async findOne(id: string) {
    try {
      const doc = await this.firebase.firestore.collection('institutions').doc(id).get();
      if (doc.exists) return doc.data();
    } catch {}

    return this.prisma.institution.findUnique({ where: { id } });
  }

  async update(id: string, data: { name?: string; code?: string }) {
    try {
      await this.firebase.firestore.collection('institutions').doc(id).set(data, { merge: true });
    } catch {}

    return this.prisma.institution.update({
      where: { id },
      data,
    });
  }

  async remove(id: string) {
    try {
      await this.firebase.firestore.collection('institutions').doc(id).delete();
    } catch {}

    return this.prisma.$transaction(async (transaction) => {
      await transaction.user.updateMany({
        where: { institutionId: id },
        data: { institutionId: null },
      });
      await transaction.section.updateMany({
        where: { institutionId: id },
        data: { institutionId: null },
      });
      return transaction.institution.delete({ where: { id } });
    });
  }
}
