import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../common/prisma.service';
import { Role } from '@prisma/client';

@Injectable()
export class UsersService {
  constructor(private prisma: PrismaService) {}

  async onboardUser(id: string, email: string, fullName: string, role: Role, rollNumber: string, section: string, institutionCode?: string) {
    let institutionId = null;
    if (institutionCode) {
      const inst = await this.prisma.institution.findUnique({ where: { code: institutionCode } });
      if (inst) institutionId = inst.id;
      else throw new NotFoundException('Invalid Institution Code');
    }

    const sectionRecord = section
      ? await this.prisma.section.findFirst({
          where: {
            name: section,
            ...(institutionId ? { institutionId } : {})
          }
        })
      : null;

    const user = await this.prisma.user.upsert({
      where: { id },
      update: { email, role, institutionId },
      create: { id, email, role, institutionId }
    });
    
    const student = await this.prisma.student.upsert({
      where: { userId: id },
      update: { sectionId: sectionRecord?.id },
      create: { userId: id, sectionId: sectionRecord?.id }
    });
    
    const profile = await this.prisma.profile.upsert({
      where: { userId: id },
      update: { fullName, rollNumber, section },
      create: { userId: id, studentId: student.id, fullName, rollNumber, section }
    });
    
    return { user, profile };
  }

  async getProfile(userId: string) {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      include: {
        profile: true,
        crAssignment: true,
        student: { include: { section: { include: { department: true } } } }
      }
    });
    
    if (!user) throw new NotFoundException('User not found');
    return user;
  }

  async updateProfile(userId: string, data: any) {
    return this.prisma.profile.upsert({
      where: { userId },
      update: data,
      create: { ...data, userId }
    });
  }

    async getAllUsers() {
    return this.prisma.user.findMany({
      include: {
        profile: true,
        student: true,
        crAssignment: { include: { section: true } },
          Institution: true
      }
    });
  }

  async updateUserRole(id: string, role: string, sectionId?: string) {
    const user = await this.prisma.user.update({
      where: { id },
      data: { role: role as any }
    });

    if (role === 'CR' && sectionId) {
      const currentTerm = await this.prisma.academicTerm.findFirst({
        where: { isCurrent: true },
        orderBy: { startDate: 'desc' }
      }) || await this.prisma.academicTerm.findUnique({ where: { id: 'TERM-1' } });

      if (!currentTerm) throw new NotFoundException('No academic term is configured');

      // Upsert CR assignment
      await this.prisma.crAssignment.upsert({
        where: { userId: id },
        create: { userId: id, sectionId, termId: currentTerm.id, isActive: true },
        update: { sectionId, termId: currentTerm.id, isActive: true }
      });
    } else {
      // If no longer CR, deactivate or delete assignment
      await this.prisma.crAssignment.updateMany({
        where: { userId: id },
        data: { isActive: false }
      });
    }

    return user;
  }

  async getAllUsersByRole(role: Role) {
    return this.prisma.user.findMany({
      where: { role },
      include: { profile: true }
    });
  }

  async deleteUser(id: string) {
    return this.prisma.user.delete({ where: { id } });
  }
}
