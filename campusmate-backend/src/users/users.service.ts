import { Injectable, NotFoundException, Logger } from '@nestjs/common';
import { PrismaService } from '../common/prisma.service';
import { FirebaseAdminService } from '../common/firebase/firebase-admin.service';
import { Role, StudentType } from '../common/enums';
import { UpdateUserDetailsDto } from './update-user-details.dto';

@Injectable()
export class UsersService {
  private readonly logger = new Logger(UsersService.name);

  constructor(
    private prisma: PrismaService,
    private firebase: FirebaseAdminService,
  ) {}

  async onboardUser(
    id: string,
    email: string,
    fullName: string,
    role: Role | string,
    rollNumber: string,
    section: string,
    institutionCode?: string,
  ) {
    let institutionId: string | null = null;
    let institutionName: string | null = null;
    if (institutionCode) {
      const inst = await this.prisma.institution.findUnique({ where: { code: institutionCode } });
      if (inst) {
        institutionId = inst.id;
        institutionName = inst.name;
      } else {
        throw new NotFoundException('Invalid Institution Code');
      }
    }

    const sectionRecord = section
      ? await this.prisma.section.findFirst({
          where: {
            name: section,
            ...(institutionId ? { institutionId } : {}),
          },
          include: { department: true },
        })
      : null;

    // 1. Dual-write to Prisma during migration
    const user = await this.prisma.user.upsert({
      where: { id },
      update: { email, role: role as any, institutionId },
      create: { id, email, role: role as any, institutionId },
    });

    const student = await this.prisma.student.upsert({
      where: { userId: id },
      update: { sectionId: sectionRecord?.id },
      create: { userId: id, sectionId: sectionRecord?.id },
    });

    const profile = await this.prisma.profile.upsert({
      where: { userId: id },
      update: { fullName, rollNumber, section },
      create: { userId: id, studentId: student.id, fullName, rollNumber, section },
    });

    // 2. Write to Firestore `users` collection
    try {
      const userDoc = {
        id,
        email,
        role,
        institutionId,
        institution: institutionName ? { id: institutionId, name: institutionName, code: institutionCode } : null,
        profile: {
          fullName,
          rollNumber,
          section,
          studentType: 'DAY_SCHOLAR',
        },
        student: {
          id: student.id,
          sectionId: sectionRecord?.id || null,
          section: sectionRecord
            ? {
                name: sectionRecord.name,
                department: sectionRecord.department ? { name: sectionRecord.department.name } : null,
              }
            : null,
        },
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };

      await this.firebase.firestore.collection('users').doc(id).set(userDoc, { merge: true });
      this.logger.log(`User onboarded and synced to Firestore: ${id}`);
    } catch (err: any) {
      this.logger.warn(`Failed syncing onboarded user to Firestore: ${err?.message}`);
    }

    return { user, profile };
  }

  async getProfile(userId: string) {
    // 1. Check Firestore first
    try {
      const doc = await this.firebase.firestore.collection('users').doc(userId).get();
      if (doc.exists) {
        return doc.data();
      }
    } catch (err: any) {
      this.logger.warn(`Firestore getProfile error: ${err?.message}`);
    }

    // 2. Fallback to Prisma
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      include: {
        profile: true,
        crAssignment: true,
        Institution: true,
        student: { include: { section: { include: { department: true } } } },
      },
    });

    if (!user) throw new NotFoundException('User not found');

    // 3. Auto-backfill to Firestore for future instant reads
    try {
      await this.firebase.firestore.collection('users').doc(userId).set(
        {
          id: user.id,
          email: user.email,
          role: user.role,
          institutionId: user.institutionId,
          Institution: user.Institution,
          profile: user.profile,
          student: user.student,
          crAssignment: user.crAssignment,
          updatedAt: new Date().toISOString(),
        },
        { merge: true },
      );
    } catch {
      // Ignore background backfill errors
    }

    return user;
  }

  async updateProfile(userId: string, data: any) {
    try {
      await this.firebase.firestore.collection('users').doc(userId).set(
        {
          profile: data,
          updatedAt: new Date().toISOString(),
        },
        { merge: true },
      );
    } catch (err: any) {
      this.logger.warn(`Failed updating profile in Firestore: ${err?.message}`);
    }

    return this.prisma.profile.upsert({
      where: { userId },
      update: data,
      create: { ...data, userId },
    });
  }

  async updateUserDetails(userId: string, data: UpdateUserDetailsDto) {
    return this.prisma.$transaction(async (transaction) => {
      const user = await transaction.user.findUnique({ where: { id: userId } });
      if (!user) throw new NotFoundException('User not found');

      let sectionName: string | null | undefined;
      if (data.sectionId !== undefined) {
        if (data.sectionId) {
          const section = await transaction.section.findUnique({ where: { id: data.sectionId } });
          if (!section) throw new NotFoundException('Section not found');
          sectionName = section.name;
        } else {
          sectionName = null;
        }
      }

      if (data.institutionId) {
        const institution = await transaction.institution.findUnique({ where: { id: data.institutionId } });
        if (!institution) throw new NotFoundException('Institution not found');
      }

      const student = await transaction.student.upsert({
        where: { userId },
        update: data.sectionId === undefined ? {} : { sectionId: data.sectionId || null },
        create: { userId, sectionId: data.sectionId || null },
      });

      const profileData = {
        fullName: data.fullName.trim(),
        ...(data.rollNumber !== undefined && { rollNumber: data.rollNumber?.trim() || null }),
        ...(data.department !== undefined && { department: data.department?.trim() || null }),
        ...(data.semester !== undefined && { semester: data.semester?.trim() || null }),
        ...(data.studentType !== undefined && { studentType: data.studentType as StudentType }),
        ...(data.hostelName !== undefined && { hostelName: data.hostelName?.trim() || null }),
        ...(data.hostelBlock !== undefined && { hostelBlock: data.hostelBlock?.trim() || null }),
        ...(data.hostelRoom !== undefined && { hostelRoom: data.hostelRoom?.trim() || null }),
        ...(data.github !== undefined && { github: data.github?.trim() || null }),
        ...(data.linkedin !== undefined && { linkedin: data.linkedin?.trim() || null }),
        ...(data.portfolio !== undefined && { portfolio: data.portfolio?.trim() || null }),
        ...(sectionName !== undefined && { section: sectionName }),
      };

      const updatedUser = await transaction.user.update({
        where: { id: userId },
        data: data.institutionId === undefined ? {} : { institutionId: data.institutionId || null },
      });
      const profile = await transaction.profile.upsert({
        where: { userId },
        update: profileData,
        create: { userId, studentId: student.id, ...profileData },
      });

      // Sync to Firestore
      try {
        await this.firebase.firestore.collection('users').doc(userId).set(
          {
            profile: profileData,
            institutionId: data.institutionId || user.institutionId,
            updatedAt: new Date().toISOString(),
          },
          { merge: true },
        );
      } catch (err: any) {
        this.logger.warn(`Failed syncing updated user details to Firestore: ${err?.message}`);
      }

      return { ...updatedUser, profile, student };
    });
  }

  async getAllUsers() {
    try {
      const snapshot = await this.firebase.firestore.collection('users').get();
      if (!snapshot.empty) {
        return snapshot.docs.map((doc) => doc.data());
      }
    } catch (err: any) {
      this.logger.warn(`Failed reading all users from Firestore: ${err?.message}`);
    }

    return this.prisma.user.findMany({
      include: {
        profile: true,
        student: { include: { section: true } },
        crAssignment: { include: { section: true } },
        Institution: true,
      },
    });
  }

  async updateUserRole(id: string, role: string, sectionId?: string) {
    const user = await this.prisma.user.update({
      where: { id },
      data: { role: role as any },
    });

    if (role === 'CR' && sectionId) {
      const currentTerm =
        (await this.prisma.academicTerm.findFirst({
          where: { isCurrent: true },
          orderBy: { startDate: 'desc' },
        })) || (await this.prisma.academicTerm.findUnique({ where: { id: 'TERM-1' } }));

      if (!currentTerm) throw new NotFoundException('No academic term is configured');

      await this.prisma.crAssignment.upsert({
        where: { userId: id },
        create: { userId: id, sectionId, termId: currentTerm.id, isActive: true },
        update: { sectionId, termId: currentTerm.id, isActive: true },
      });
    } else {
      await this.prisma.crAssignment.updateMany({
        where: { userId: id },
        data: { isActive: false },
      });
    }

    try {
      await this.firebase.firestore.collection('users').doc(id).set(
        {
          role,
          updatedAt: new Date().toISOString(),
        },
        { merge: true },
      );
    } catch (err: any) {
      this.logger.warn(`Failed syncing updated role to Firestore: ${err?.message}`);
    }

    return user;
  }

  async getAllUsersByRole(role: Role | string) {
    try {
      const snapshot = await this.firebase.firestore.collection('users').where('role', '==', role).get();
      if (!snapshot.empty) {
        return snapshot.docs.map((doc) => doc.data());
      }
    } catch (err: any) {
      this.logger.warn(`Failed reading users by role from Firestore: ${err?.message}`);
    }

    return this.prisma.user.findMany({
      where: { role: role as any },
      include: { profile: true, crAssignment: { include: { section: true } } },
    });
  }

  async deleteUser(id: string) {
    try {
      await this.firebase.firestore.collection('users').doc(id).delete();
      await this.firebase.auth.deleteUser(id).catch(() => {});
    } catch (err: any) {
      this.logger.warn(`Failed deleting user from Firebase: ${err?.message}`);
    }

    return this.prisma.user.delete({ where: { id } });
  }
}
