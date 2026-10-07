import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../common/prisma.service';

@Injectable()
export class SectionsService {
  constructor(private prisma: PrismaService) {}

  async create(data: { name: string; departmentName: string; semesterName: string }) {
    // Upsert Department
    let department = await this.prisma.department.findFirst({
      where: { name: data.departmentName }
    });
    if (!department) {
      department = await this.prisma.department.create({
        data: { name: data.departmentName, code: data.departmentName.substring(0,3).toUpperCase() }
      });
    }

    // Upsert Semester
    let semester = await this.prisma.semester.findFirst({
      where: { name: data.semesterName }
    });
    if (!semester) {
      semester = await this.prisma.semester.create({
        data: { name: data.semesterName, number: parseInt(data.semesterName.replace(/[^0-9]/g, '')) || Math.floor(Math.random() * 1000) }
      });
    }

    return this.prisma.section.create({
      data: {
        name: data.name,
        departmentId: department.id,
        semesterId: semester.id
      }
    });
  }

  async findAll() {
    return this.prisma.section.findMany({
      include: { department: true, semester: true }
    });
  }

  async assignCr(data: { userId: string; sectionId: string; termId: string }) {
    return this.prisma.crAssignment.create({
      data: {
        userId: data.userId,
        sectionId: data.sectionId,
        termId: data.termId,
        isActive: true
      }
    });
  }

  async removeCrAssignment(assignmentId: string) {
    return this.prisma.crAssignment.update({
      where: { id: assignmentId },
      data: { isActive: false, endDate: new Date() }
    });
  }
}

