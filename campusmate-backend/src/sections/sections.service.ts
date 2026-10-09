import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../common/prisma.service';
import { FirebaseAdminService } from '../common/firebase/firebase-admin.service';

@Injectable()
export class SectionsService {
  private readonly logger = new Logger(SectionsService.name);

  constructor(
    private prisma: PrismaService,
    private firebase: FirebaseAdminService,
  ) {}

  async create(data: {
    name: string;
    departmentCode: string;
    departmentName: string;
    semesterNumber: number;
    semesterName: string;
    institutionId?: string | null;
  }) {
    // Upsert Department
    let department = await this.prisma.department.findFirst({
      where: { code: data.departmentCode },
    });
    if (!department) {
      department = await this.prisma.department.create({
        data: { name: data.departmentName, code: data.departmentCode },
      });
    }

    // Upsert Semester
    let semester = await this.prisma.semester.findFirst({
      where: { number: data.semesterNumber },
    });
    if (!semester) {
      semester = await this.prisma.semester.create({
        data: { name: data.semesterName, number: data.semesterNumber },
      });
    }

    const section = await this.prisma.section.create({
      data: {
        name: data.name,
        departmentId: department.id,
        semesterId: semester.id,
        institutionId: data.institutionId ?? null,
      },
      include: { department: true, semester: true },
    });

    try {
      await this.firebase.firestore.collection('sections').doc(section.id).set({
        id: section.id,
        name: section.name,
        departmentId: section.departmentId,
        department: { name: department.name, code: department.code },
        semesterId: section.semesterId,
        semester: { number: semester.number, name: semester.name },
        institutionId: section.institutionId,
        createdAt: new Date().toISOString(),
      });
    } catch (err: any) {
      this.logger.warn(`Failed writing section to Firestore: ${err?.message}`);
    }

    return section;
  }

  async findAll() {
    try {
      const snap = await this.firebase.firestore.collection('sections').get();
      if (!snap.empty) {
        return snap.docs.map((doc) => doc.data());
      }
    } catch (err: any) {
      this.logger.warn(`Failed fetching sections from Firestore: ${err?.message}`);
    }

    return this.prisma.section.findMany({
      include: { department: true, semester: true, institution: true },
    });
  }

  async update(id: string, data: {
    name?: string;
    departmentCode?: string;
    departmentName?: string;
    semesterNumber?: number;
    semesterName?: string;
    institutionId?: string | null;
  }) {
    let departmentId: string | undefined;
    let semesterId: string | undefined;

    if (data.departmentCode) {
      let dept = await this.prisma.department.findFirst({ where: { code: data.departmentCode } });
      if (!dept && data.departmentName) {
        dept = await this.prisma.department.create({
          data: { name: data.departmentName, code: data.departmentCode },
        });
      }
      if (dept) departmentId = dept.id;
    }

    if (data.semesterNumber !== undefined) {
      let sem = await this.prisma.semester.findFirst({ where: { number: data.semesterNumber } });
      if (!sem && data.semesterName) {
        sem = await this.prisma.semester.create({
          data: { name: data.semesterName, number: data.semesterNumber },
        });
      }
      if (sem) semesterId = sem.id;
    }

    const updateData: any = {};
    if (data.name) updateData.name = data.name;
    if (departmentId) updateData.departmentId = departmentId;
    if (semesterId) updateData.semesterId = semesterId;
    if (data.institutionId !== undefined) updateData.institutionId = data.institutionId;

    const section = await this.prisma.section.update({
      where: { id },
      data: updateData,
      include: { department: true, semester: true, institution: true },
    });

    try {
      await this.firebase.firestore.collection('sections').doc(id).set(
        {
          ...section,
          updatedAt: new Date().toISOString(),
        },
        { merge: true },
      );
    } catch (err: any) {
      this.logger.warn(`Failed updating section in Firestore: ${err?.message}`);
    }

    return section;
  }

  async remove(id: string) {
    try {
      await this.firebase.firestore.collection('sections').doc(id).delete();
    } catch {}

    return this.prisma.section.delete({ where: { id } });
  }

  async assignCr(data: { userId: string; sectionId: string; termId: string }) {
    const assignment = await this.prisma.crAssignment.create({
      data: {
        userId: data.userId,
        sectionId: data.sectionId,
        termId: data.termId,
        isActive: true,
      },
    });

    try {
      await this.firebase.firestore.collection('users').doc(data.userId).set(
        {
          crAssignment: {
            id: assignment.id,
            sectionId: data.sectionId,
            termId: data.termId,
            isActive: true,
          },
        },
        { merge: true },
      );
    } catch {}

    return assignment;
  }

  async removeCrAssignment(assignmentId: string) {
    const assignment = await this.prisma.crAssignment.update({
      where: { id: assignmentId },
      data: { isActive: false, endDate: new Date() },
    });

    try {
      await this.firebase.firestore.collection('users').doc(assignment.userId).set(
        {
          crAssignment: {
            isActive: false,
          },
        },
        { merge: true },
      );
    } catch {}

    return assignment;
  }
}
