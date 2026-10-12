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
            name: { equals: section, mode: 'insensitive' },
            ...(institutionId ? { OR: [{ institutionId }, { institutionId: null }] } : {}),
          },
          include: { department: true, institution: true },
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
    try {
      const user = await this.prisma.user.findUnique({
        where: { id: userId },
        include: {
          profile: true,
          crAssignment: { include: { section: true } },
          Institution: true,
          student: { include: { section: { include: { department: true, institution: true } } } },
        },
      });

      if (user) {
        // Auto-heal CR: if user has role CR but lacks an active crAssignment, automatically resolve & activate it
        if (user.role === 'CR' && (!user.crAssignment || !user.crAssignment.isActive)) {
          let sectionId = user.student?.sectionId;
          if (!sectionId && user.profile?.section) {
            const matchedSection = await this.prisma.section.findFirst({
              where: { name: { equals: user.profile.section, mode: 'insensitive' } },
            });
            sectionId = matchedSection?.id;
          }
          if (!sectionId) {
            const firstSection = await this.prisma.section.findFirst();
            sectionId = firstSection?.id;
          }
          if (sectionId) {
            let term =
              (await this.prisma.academicTerm.findFirst({ where: { isCurrent: true }, orderBy: { startDate: 'desc' } })) ||
              (await this.prisma.academicTerm.findFirst({ orderBy: { startDate: 'desc' } })) ||
              (await this.prisma.academicTerm.findUnique({ where: { id: 'TERM-1' } }));

            if (!term) {
              term = await this.prisma.academicTerm.create({
                data: {
                  id: 'TERM-1',
                  name: 'Current Term',
                  isCurrent: true,
                  startDate: new Date(),
                  endDate: new Date(Date.now() + 180 * 24 * 60 * 60 * 1000),
                },
              }).catch(async () => this.prisma.academicTerm.findFirst());
            }

            if (term) {
              const healedAssignment = await this.prisma.crAssignment.upsert({
                where: { userId },
                create: { userId, sectionId, termId: term.id, isActive: true },
                update: { sectionId, termId: term.id, isActive: true },
                include: { section: true },
              });
              (user as any).crAssignment = healedAssignment;
            }
          }
        }

        // Auto-backfill to Firestore for future instant reads
        try {
          await this.firebase.firestore.collection('users').doc(userId).set(
            {
              id: user.id,
              email: user.email,
              role: user.role,
              institutionId: user.institutionId,
              Institution: user.Institution ? { id: user.Institution.id, name: user.Institution.name, code: user.Institution.code } : null,
              institution: user.Institution ? { id: user.Institution.id, name: user.Institution.name, code: user.Institution.code } : null,
              profile: user.profile,
              student: user.student,
              crAssignment: user.crAssignment,
              updatedAt: new Date().toISOString(),
            },
            { merge: true },
          );
        } catch {}

        return user;
      }
    } catch (err: any) {
      this.logger.warn(`Prisma getProfile error: ${err?.message}`);
    }

    // Fallback to Firestore if Prisma failed
    try {
      const doc = await this.firebase.firestore.collection('users').doc(userId).get();
      if (doc.exists) {
        return doc.data();
      }
    } catch (err: any) {
      this.logger.warn(`Firestore getProfile error: ${err?.message}`);
    }

    throw new NotFoundException('User not found');
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

      if (user.role === 'CR' && data.sectionId) {
        let currentTerm =
          (await transaction.academicTerm.findFirst({ where: { isCurrent: true }, orderBy: { startDate: 'desc' } })) ||
          (await transaction.academicTerm.findFirst({ orderBy: { startDate: 'desc' } })) ||
          (await transaction.academicTerm.findUnique({ where: { id: 'TERM-1' } }));

        if (!currentTerm) {
          currentTerm = await transaction.academicTerm.create({
            data: { id: 'TERM-1', name: 'Current Term', isCurrent: true, startDate: new Date(), endDate: new Date(Date.now() + 180 * 24 * 60 * 60 * 1000) },
          }).catch(async () => transaction.academicTerm.findFirst());
        }

        if (currentTerm) {
          await transaction.crAssignment.upsert({
            where: { userId },
            create: { userId, sectionId: data.sectionId, termId: currentTerm.id, isActive: true },
            update: { sectionId: data.sectionId, termId: currentTerm.id, isActive: true },
          });
        }
      }

      const fullUpdated = await transaction.user.findUnique({
        where: { id: userId },
        include: {
          profile: true,
          student: { include: { section: { include: { department: true, institution: true } } } },
          crAssignment: { include: { section: true } },
          Institution: true,
        },
      });

      // Sync to Firestore
      try {
        await this.firebase.firestore.collection('users').doc(userId).set(
          {
            ...fullUpdated,
            institution: fullUpdated?.Institution,
            updatedAt: new Date().toISOString(),
          },
          { merge: true },
        );
      } catch (err: any) {
        this.logger.warn(`Failed syncing updated user details to Firestore: ${err?.message}`);
      }

      return fullUpdated;
    });
  }

  async getAllUsers() {
    try {
      const users = await this.prisma.user.findMany({
        include: {
          profile: true,
          student: { include: { section: { include: { department: true, institution: true } } } },
          crAssignment: { include: { section: true } },
          Institution: true,
        },
        orderBy: { createdAt: 'desc' },
      });

      // Update Firestore cache in background
      try {
        for (const u of users) {
          await this.firebase.firestore.collection('users').doc(u.id).set(
            {
              id: u.id,
              email: u.email,
              role: u.role,
              institutionId: u.institutionId,
              Institution: u.Institution ? { id: u.Institution.id, name: u.Institution.name, code: u.Institution.code } : null,
              institution: u.Institution ? { id: u.Institution.id, name: u.Institution.name, code: u.Institution.code } : null,
              profile: u.profile,
              student: u.student,
              crAssignment: u.crAssignment,
              updatedAt: new Date().toISOString(),
            },
            { merge: true },
          );
        }
      } catch {}

      return users;
    } catch (err: any) {
      this.logger.warn(`Failed reading all users from Prisma, falling back to Firestore: ${err?.message}`);
      const snapshot = await this.firebase.firestore.collection('users').get();
      if (!snapshot.empty) {
        return snapshot.docs.map((doc) => doc.data());
      }
      return [];
    }
  }

  async updateUserRole(id: string, role: string, sectionId?: string) {
    const user = await this.prisma.user.update({
      where: { id },
      data: { role: role as any },
    });

    let crAssignmentData: any = null;

    if (role === 'CR') {
      let effectiveSectionId = sectionId;
      if (!effectiveSectionId) {
        const student = await this.prisma.student.findUnique({ where: { userId: id } });
        effectiveSectionId = student?.sectionId || undefined;
      }

      if (!effectiveSectionId) {
        const profile = await this.prisma.profile.findUnique({ where: { userId: id } });
        if (profile?.section) {
          const matchedSection = await this.prisma.section.findFirst({
            where: { name: { equals: profile.section, mode: 'insensitive' } },
          });
          effectiveSectionId = matchedSection?.id;
        }
      }

      if (!effectiveSectionId) {
        const firstSection = await this.prisma.section.findFirst();
        effectiveSectionId = firstSection?.id;
      }

      let currentTerm =
        (await this.prisma.academicTerm.findFirst({
          where: { isCurrent: true },
          orderBy: { startDate: 'desc' },
        })) ||
        (await this.prisma.academicTerm.findFirst({ orderBy: { startDate: 'desc' } })) ||
        (await this.prisma.academicTerm.findUnique({ where: { id: 'TERM-1' } }));

      if (!currentTerm) {
        currentTerm = await this.prisma.academicTerm.create({
          data: {
            id: 'TERM-1',
            name: 'Current Term',
            isCurrent: true,
            startDate: new Date(),
            endDate: new Date(Date.now() + 180 * 24 * 60 * 60 * 1000),
          },
        }).catch(async () => this.prisma.academicTerm.findFirst());
      }

      if (effectiveSectionId && currentTerm) {
        const assignment = await this.prisma.crAssignment.upsert({
          where: { userId: id },
          create: { userId: id, sectionId: effectiveSectionId, termId: currentTerm.id, isActive: true },
          update: { sectionId: effectiveSectionId, termId: currentTerm.id, isActive: true },
          include: { section: true },
        });

        crAssignmentData = {
          id: assignment.id,
          sectionId: assignment.sectionId,
          termId: assignment.termId,
          isActive: true,
          section: assignment.section ? { id: assignment.section.id, name: assignment.section.name } : null,
        };

        await this.prisma.student.upsert({
          where: { userId: id },
          update: { sectionId: effectiveSectionId },
          create: { userId: id, sectionId: effectiveSectionId },
        }).catch(() => {});
      }
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
          crAssignment: crAssignmentData,
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
