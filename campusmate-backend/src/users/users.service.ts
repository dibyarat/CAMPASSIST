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
    _role: Role | string,
    rollNumber: string,
    section: string,
    institutionCode?: string,
    department?: string,
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

    const resolvedDepartment = department || sectionRecord?.department?.name || null;

    // Enforce least privilege: normal self-service onboarding MUST always assign STUDENT role.
    // Privileged roles (CR, DEVELOPER) are strictly assigned via dedicated administrative workflows.
    const assignedRole = Role.STUDENT;

    // 1. Dual-write to Prisma during migration
    const user = await this.prisma.user.upsert({
      where: { id },
      update: { email, role: assignedRole, institutionId },
      create: { id, email, role: assignedRole, institutionId },
    });

    const student = await this.prisma.student.upsert({
      where: { userId: id },
      update: { sectionId: sectionRecord?.id },
      create: { userId: id, sectionId: sectionRecord?.id },
    });

    const profile = await this.prisma.profile.upsert({
      where: { userId: id },
      update: { fullName, rollNumber, section, ...(resolvedDepartment ? { department: resolvedDepartment } : {}) },
      create: { userId: id, studentId: student.id, fullName, rollNumber, section, ...(resolvedDepartment ? { department: resolvedDepartment } : {}) },
    });

    // 2. Write to Firestore `users` collection
    try {
      const userDoc = {
        id,
        email,
        role: assignedRole,
        institutionId,
        institution: institutionName ? { id: institutionId, name: institutionName, code: institutionCode } : null,
        profile: {
          fullName,
          rollNumber,
          section,
          department: resolvedDepartment,
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

        // Hydrate tonePreference and gender from Firestore to maintain cross-app sync
        try {
          const doc = await this.firebase.firestore.collection('users').doc(userId).get();
          if (doc.exists) {
            const d = doc.data() || {};
            const tonePref = d.tonePreference || d.profile?.tonePreference || d.academicIdentity?.tonePreference || 'buddy';
            const genderVal = d.gender || d.profile?.gender || d.academicIdentity?.gender || 'Prefer not to say';
            if (user.profile) {
              (user.profile as any).tonePreference = tonePref;
              (user.profile as any).gender = (user.profile as any).gender || genderVal;
            } else {
              (user as any).profile = { tonePreference: tonePref, gender: genderVal };
            }
            (user as any).tonePreference = tonePref;
          }
        } catch {}

        return user;
      }
    } catch (err: any) {
      this.logger.warn(`Prisma getProfile error: ${err?.message}`);
    }

    // Fallback to Firestore if Prisma failed or user is not in Prisma yet
    try {
      const doc = await this.firebase.firestore.collection('users').doc(userId).get();
      if (doc.exists) {
        const firestoreData = doc.data() || {};
        
        // Auto-provision user into Prisma if missing so future operations work seamlessly
        try {
          const email = firestoreData.email;
          const rawName = firestoreData.name || firestoreData.fullName || firestoreData.profile?.fullName || (email ? email.split('@')[0] : 'Student');
          const rollMatch = email ? email.match(/^(\d{8,16})@/) : null;
          const rollNumber = rollMatch ? rollMatch[1] : (firestoreData.profile?.rollNumber || null);

          const institution = await this.prisma.institution.findFirst({
            where: { code: 'CUTM' },
          }) || await this.prisma.institution.findFirst();

          const section = await this.prisma.section.findFirst({
            where: {
              ...(institution ? { institutionId: institution.id } : {}),
              name: { equals: 'CT-A', mode: 'insensitive' },
            },
          }) || await this.prisma.section.findFirst({
            where: institution ? { institutionId: institution.id } : {},
          }) || await this.prisma.section.findFirst();

          const dbUser = await this.prisma.user.upsert({
            where: { id: userId },
            update: { email: email || undefined },
            create: {
              id: userId,
              email: email || `${userId}@campusmate.local`,
              role: (firestoreData.role as any) || 'STUDENT',
              institutionId: institution?.id || null,
            },
          });

          const student = await this.prisma.student.upsert({
            where: { userId },
            update: { sectionId: section?.id || null },
            create: {
              userId,
              sectionId: section?.id || null,
            },
          });

          const profile = await this.prisma.profile.upsert({
            where: { userId },
            update: {
              fullName: rawName,
              rollNumber,
              section: section?.name || null,
            },
            create: {
              userId,
              studentId: student.id,
              fullName: rawName,
              rollNumber,
              section: section?.name || null,
              studentType: 'DAY_SCHOLAR',
            },
          });

          return {
            ...dbUser,
            profile,
            student: { ...student, section },
            Institution: institution,
            institution,
            crAssignment: null,
          };
        } catch (provErr: any) {
          this.logger.warn(`Failed inline auto-provision from Firestore doc: ${provErr?.message}`);
        }

        return {
          id: userId,
          role: 'STUDENT',
          ...firestoreData,
          profile: firestoreData.profile || { fullName: firestoreData.name || 'Student' },
          student: firestoreData.student || null,
        };
      }
    } catch (err: any) {
      this.logger.warn(`Firestore getProfile error: ${err?.message}`);
    }

    throw new NotFoundException('User not found');
  }

  async updateProfile(userId: string, data: any) {
    const tonePreference = data.tonePreference || 'buddy';
    const gender = data.gender || 'Prefer not to say';

    try {
      await this.firebase.firestore.collection('users').doc(userId).set(
        {
          profile: {
            ...data,
            tonePreference,
            gender,
          },
          tonePreference,
          gender,
          academicIdentity: {
            tonePreference,
            gender,
          },
          updatedAt: new Date().toISOString(),
        },
        { merge: true },
      );
    } catch (err: any) {
      this.logger.warn(`Failed updating profile in Firestore: ${err?.message}`);
    }

    const prismaAllowed = [
      'fullName', 'avatarUrl', 'studentId', 'rollNumber', 'department',
      'semester', 'section', 'studentType', 'hostelName', 'hostelBlock',
      'hostelRoom', 'github', 'linkedin', 'portfolio'
    ];
    const prismaData: any = {};
    for (const key of prismaAllowed) {
      if (data[key] !== undefined) {
        prismaData[key] = data[key];
      }
    }

    try {
      const updated = await this.prisma.profile.upsert({
        where: { userId },
        update: prismaData,
        create: {
          ...prismaData,
          userId,
          studentId: prismaData.studentId || userId,
          fullName: prismaData.fullName || 'Student',
        },
      });
      return { ...updated, ...data, tonePreference, gender };
    } catch (err: any) {
      this.logger.warn(`Prisma profile upsert error: ${err?.message}`);
      return { id: userId, userId, ...data, tonePreference, gender };
    }
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

  async getClassRepresentatives(requestingUser?: { id: string; role?: string; institutionId?: string | null }) {
    const isDeveloper = requestingUser?.role === 'DEVELOPER';
    let institutionScope = requestingUser?.institutionId;

    if (!isDeveloper && !institutionScope && requestingUser?.id) {
      try {
        const caller = await this.prisma.user.findUnique({
          where: { id: requestingUser.id },
          select: { institutionId: true },
        });
        institutionScope = caller?.institutionId || null;
      } catch {}
    }

    try {
      const crUsers = await this.prisma.user.findMany({
        where: {
          role: 'CR',
          ...(!isDeveloper && institutionScope ? { institutionId: institutionScope } : {}),
        },
        include: {
          profile: {
            select: {
              fullName: true,
              section: true,
              department: true,
            },
          },
          crAssignment: {
            where: { isActive: true },
            include: {
              section: {
                select: {
                  id: true,
                  name: true,
                  department: { select: { id: true, name: true, code: true } },
                },
              },
            },
          },
          Institution: {
            select: {
              id: true,
              name: true,
              code: true,
            },
          },
        },
        orderBy: { createdAt: 'desc' },
      });

      return crUsers.map((user) => {
        const activeAssignment = Array.isArray(user.crAssignment) ? user.crAssignment[0] : user.crAssignment;
        const sectionName = activeAssignment?.section?.name || user.profile?.section || null;

        return {
          id: user.id,
          email: user.email,
          role: 'CR',
          institutionId: user.institutionId,
          Institution: user.Institution ? { id: user.Institution.id, name: user.Institution.name, code: user.Institution.code } : null,
          profile: {
            fullName: user.profile?.fullName || null,
            section: sectionName,
            department: activeAssignment?.section?.department?.name || user.profile?.department || null,
          },
          crAssignment: activeAssignment
            ? {
                id: activeAssignment.id,
                sectionId: activeAssignment.sectionId,
                section: activeAssignment.section ? { id: activeAssignment.section.id, name: activeAssignment.section.name } : null,
              }
            : null,
        };
      });
    } catch (err: any) {
      this.logger.warn(`Failed reading scoped CRs from Prisma: ${err?.message}`);
      return [];
    }
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

  private async executeCascadeUserDeletion(tx: any, userId: string) {
    // 1. Student & child records
    if (tx.student) {
      const student = await tx.student.findUnique({ where: { userId } }).catch(() => null);
      if (student) {
        if (tx.academicRecord) {
          const academicRecords = await tx.academicRecord
            .findMany({
              where: { studentId: student.id },
              select: { id: true },
            })
            .catch(() => []);
          if (academicRecords.length > 0 && tx.grade) {
            await tx.grade
              .deleteMany({
                where: { academicRecordId: { in: academicRecords.map((a: any) => a.id) } },
              })
              .catch(() => {});
          }
          await tx.academicRecord.deleteMany({ where: { studentId: student.id } }).catch(() => {});
        }
        if (tx.attendanceRecord) {
          await tx.attendanceRecord.deleteMany({ where: { studentId: student.id } }).catch(() => {});
        }
        if (tx.attendanceRequest) {
          await tx.attendanceRequest.deleteMany({ where: { studentId: student.id } }).catch(() => {});
        }
        if (tx.submission) {
          await tx.submission.deleteMany({ where: { studentId: student.id } }).catch(() => {});
        }
        await tx.student.delete({ where: { id: student.id } }).catch(() => {});
      }
    }

    // 2. Attendance requests where user was the reviewer
    if (tx.attendanceRequest) {
      await tx.attendanceRequest
        .updateMany({
          where: { reviewerId: userId },
          data: { reviewerId: null },
        })
        .catch(() => {});
    }

    // 3. Virtual Study Classes & Topics created by user
    if (tx.virtualStudyClass) {
      const userClasses = await tx.virtualStudyClass
        .findMany({
          where: { creatorId: userId },
          select: { id: true },
        })
        .catch(() => []);
      if (userClasses.length > 0) {
        const classIds = userClasses.map((c: any) => c.id);
        if (tx.virtualStudyTopic) {
          const topics = await tx.virtualStudyTopic
            .findMany({
              where: { classId: { in: classIds } },
              select: { id: true },
            })
            .catch(() => []);
          if (topics.length > 0 && tx.virtualStudyResource) {
            await tx.virtualStudyResource
              .deleteMany({
                where: { topicId: { in: topics.map((t: any) => t.id) } },
              })
              .catch(() => {});
          }
          await tx.virtualStudyTopic.deleteMany({ where: { classId: { in: classIds } } }).catch(() => {});
        }
        await tx.virtualStudyClass.deleteMany({ where: { creatorId: userId } }).catch(() => {});
      }
    }

    // 4. Resources created by user
    if (tx.resource) {
      const userResources = await tx.resource
        .findMany({
          where: { creatorId: userId },
          select: { id: true },
        })
        .catch(() => []);
      if (userResources.length > 0) {
        const resIds = userResources.map((r: any) => r.id);
        if (tx.virtualStudyResource) {
          await tx.virtualStudyResource
            .deleteMany({
              where: { resourceId: { in: resIds } },
            })
            .catch(() => {});
        }
        if (tx.resourceFile) await tx.resourceFile.deleteMany({ where: { resourceId: { in: resIds } } }).catch(() => {});
        if (tx.resourceLink) await tx.resourceLink.deleteMany({ where: { resourceId: { in: resIds } } }).catch(() => {});
        if (tx.resourceRating) await tx.resourceRating.deleteMany({ where: { resourceId: { in: resIds } } }).catch(() => {});
        if (tx.resourceReport) await tx.resourceReport.deleteMany({ where: { resourceId: { in: resIds } } }).catch(() => {});
        if (tx.resourceSave) await tx.resourceSave.deleteMany({ where: { resourceId: { in: resIds } } }).catch(() => {});
        if (tx.resourceTag) await tx.resourceTag.deleteMany({ where: { resourceId: { in: resIds } } }).catch(() => {});
        await tx.resource.deleteMany({ where: { id: { in: resIds } } }).catch(() => {});
      }
    }

    // 5. Projects created by user
    if (tx.project) {
      const userProjects = await tx.project
        .findMany({
          where: { creatorId: userId },
          select: { id: true },
        })
        .catch(() => []);
      if (userProjects.length > 0) {
        const projIds = userProjects.map((p: any) => p.id);
        if (tx.projectFile) await tx.projectFile.deleteMany({ where: { projectId: { in: projIds } } }).catch(() => {});
        if (tx.projectTag) await tx.projectTag.deleteMany({ where: { projectId: { in: projIds } } }).catch(() => {});
        await tx.project.deleteMany({ where: { id: { in: projIds } } }).catch(() => {});
      }
    }

    // 6. Help Services & Requests
    if (tx.helpService) {
      const userServices = await tx.helpService
        .findMany({
          where: { providerId: userId },
          select: { id: true },
        })
        .catch(() => []);
      if (userServices.length > 0) {
        const servIds = userServices.map((s: any) => s.id);
        if (tx.serviceReview) await tx.serviceReview.deleteMany({ where: { serviceId: { in: servIds } } }).catch(() => {});
        if (tx.helpRequest) await tx.helpRequest.deleteMany({ where: { serviceId: { in: servIds } } }).catch(() => {});
        await tx.helpService.deleteMany({ where: { id: { in: servIds } } }).catch(() => {});
      }
    }
    if (tx.serviceReview) {
      await tx.serviceReview
        .deleteMany({
          where: { OR: [{ reviewerId: userId }, { providerId: userId }] },
        })
        .catch(() => {});
    }
    if (tx.helpRequest) {
      await tx.helpRequest
        .deleteMany({
          where: { OR: [{ requesterId: userId }, { providerId: userId }] },
        })
        .catch(() => {});
    }

    // 7. Teams
    if (tx.teamPost) {
      const userTeams = await tx.teamPost
        .findMany({
          where: { creatorId: userId },
          select: { id: true },
        })
        .catch(() => []);
      if (userTeams.length > 0) {
        const teamIds = userTeams.map((t: any) => t.id);
        if (tx.teamJoinRequest) await tx.teamJoinRequest.deleteMany({ where: { teamId: { in: teamIds } } }).catch(() => {});
        if (tx.teamMembership) await tx.teamMembership.deleteMany({ where: { teamId: { in: teamIds } } }).catch(() => {});
        await tx.teamPost.deleteMany({ where: { id: { in: teamIds } } }).catch(() => {});
      }
    }
    if (tx.teamJoinRequest) await tx.teamJoinRequest.deleteMany({ where: { userId } }).catch(() => {});
    if (tx.teamMembership) await tx.teamMembership.deleteMany({ where: { userId } }).catch(() => {});

    // 8. User-level child tables
    if (tx.resourceRating) await tx.resourceRating.deleteMany({ where: { userId } }).catch(() => {});
    if (tx.resourceReport) await tx.resourceReport.deleteMany({ where: { userId } }).catch(() => {});
    if (tx.resourceSave) await tx.resourceSave.deleteMany({ where: { userId } }).catch(() => {});
    if (tx.studentSkill) await tx.studentSkill.deleteMany({ where: { userId } }).catch(() => {});
    if (tx.academicIdentity) await tx.academicIdentity.deleteMany({ where: { userId } }).catch(() => {});
    if (tx.crAssignment) await tx.crAssignment.deleteMany({ where: { userId } }).catch(() => {});
    if (tx.profile) await tx.profile.deleteMany({ where: { userId } }).catch(() => {});
    if (tx.notification) await tx.notification.deleteMany({ where: { recipientId: userId } }).catch(() => {});
    if (tx.pollVote) await tx.pollVote.deleteMany({ where: { userId } }).catch(() => {});
    if (tx.auditLog) await tx.auditLog.deleteMany({ where: { userId } }).catch(() => {});
    if (tx.message) await tx.message.deleteMany({ where: { senderId: userId } }).catch(() => {});
    if (tx.conversationMember) await tx.conversationMember.deleteMany({ where: { userId } }).catch(() => {});
    if (tx.feedback) await tx.feedback.deleteMany({ where: { userId } }).catch(() => {});
    if (tx.eventRegistration) await tx.eventRegistration.deleteMany({ where: { userId } }).catch(() => {});
    if (tx.offerClaim) await tx.offerClaim.deleteMany({ where: { userId } }).catch(() => {});

    // 9. Finally delete the user
    return tx.user.delete({ where: { id: userId } });
  }

  private async cleanupUserDatabaseRecords(userId: string) {
    if (typeof this.prisma.$transaction === 'function') {
      return this.prisma.$transaction(
        async (tx) => this.executeCascadeUserDeletion(tx, userId),
        { maxWait: 10000, timeout: 30000 }
      );
    }
    return this.prisma.user.delete({ where: { id: userId } });
  }

  async deleteUser(id: string) {
    try {
      await this.firebase.firestore.collection('users').doc(id).delete();
      await this.firebase.auth.deleteUser(id).catch(() => {});
    } catch (err: any) {
      this.logger.warn(`Failed deleting user from Firebase: ${err?.message}`);
    }

    return this.cleanupUserDatabaseRecords(id);
  }

  async deleteSelfAccount(userId: string) {
    const result: {
      success: boolean;
      userId: string;
      steps: {
        firebaseAuth: 'deleted' | 'failed' | 'not_found';
        firestore: 'deleted' | 'failed';
        database: 'deleted' | 'failed';
      };
      errors: string[];
    } = {
      success: false,
      userId,
      steps: {
        firebaseAuth: 'not_found',
        firestore: 'failed',
        database: 'failed',
      },
      errors: [],
    };

    // 1. Delete Firestore user document
    try {
      await this.firebase.firestore.collection('users').doc(userId).delete();
      result.steps.firestore = 'deleted';
    } catch (err: any) {
      result.steps.firestore = 'failed';
      result.errors.push(`Firestore deletion: ${err?.message}`);
      this.logger.warn(`Failed deleting user ${userId} from Firestore: ${err?.message}`);
    }

    // 2. Delete PostgreSQL records (cascades via Prisma foreign keys)
    try {
      await this.cleanupUserDatabaseRecords(userId);
      result.steps.database = 'deleted';
    } catch (err: any) {
      result.steps.database = 'failed';
      result.errors.push(`Database deletion: ${err?.message}`);
      this.logger.warn(`Failed deleting user ${userId} from PostgreSQL: ${err?.message}`);
    }

    // 3. Delete Firebase Auth account
    try {
      await this.firebase.auth.deleteUser(userId);
      result.steps.firebaseAuth = 'deleted';
    } catch (err: any) {
      if (err?.code === 'auth/user-not-found') {
        result.steps.firebaseAuth = 'not_found';
      } else {
        result.steps.firebaseAuth = 'failed';
        result.errors.push(`Firebase Auth deletion: ${err?.message}`);
        this.logger.warn(`Failed deleting user ${userId} from Firebase Auth: ${err?.message}`);
      }
    }

    result.success = result.steps.database === 'deleted' || result.steps.firestore === 'deleted';
    return result;
  }
}
