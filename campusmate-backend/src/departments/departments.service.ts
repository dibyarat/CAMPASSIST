import { Injectable, NotFoundException, ConflictException, Logger } from '@nestjs/common';
import { PrismaService } from '../common/prisma.service';
import { FirebaseAdminService } from '../common/firebase/firebase-admin.service';

@Injectable()
export class DepartmentsService {
  private readonly logger = new Logger(DepartmentsService.name);

  constructor(
    private prisma: PrismaService,
    private firebase: FirebaseAdminService,
  ) {}

  async create(data: { name: string; code: string }) {
    try {
      const dept = await this.prisma.department.create({ data });
      try {
        await this.firebase.firestore.collection('departments').doc(dept.id).set(dept);
      } catch (err: any) {
        this.logger.warn(`Failed writing department to Firestore: ${err?.message}`);
      }
      return dept;
    } catch {
      throw new ConflictException('Department with this code or name already exists');
    }
  }

  async findAll() {
    try {
      const snap = await this.firebase.firestore.collection('departments').get();
      if (!snap.empty) {
        return snap.docs.map((doc) => doc.data());
      }
    } catch (err: any) {
      this.logger.warn(`Failed fetching departments from Firestore: ${err?.message}`);
    }

    return this.prisma.department.findMany({
      include: { sections: true },
    });
  }

  async findOne(id: string) {
    try {
      const doc = await this.firebase.firestore.collection('departments').doc(id).get();
      if (doc.exists) return doc.data();
    } catch {}

    const dept = await this.prisma.department.findUnique({ where: { id } });
    if (!dept) throw new NotFoundException('Department not found');
    return dept;
  }

  async update(id: string, data: { name?: string; code?: string }) {
    try {
      await this.firebase.firestore.collection('departments').doc(id).set(data, { merge: true });
    } catch {}

    return this.prisma.department.update({
      where: { id },
      data,
    });
  }

  async remove(id: string) {
    try {
      await this.firebase.firestore.collection('departments').doc(id).delete();
    } catch {}

    return this.prisma.department.delete({ where: { id } });
  }
}
