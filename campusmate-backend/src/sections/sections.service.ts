import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../common/prisma.service';

@Injectable()
export class SectionsService {
  constructor(private prisma: PrismaService) {}

  async create(data: { name: string; departmentCode: string; departmentName: string; semesterNumber: number; semesterName: string }) {
    // Upsert Department
    let department = await this.prisma.department.findFirst({
      where: { code: data.departmentCode }
    });
    if (!department) {
      department = await this.prisma.department.create({
        data: { name: data.departmentName, code: data.departmentCode }
      });
    }

    // Upsert Semester
    let semester = await this.prisma.semester.findFirst({
      where: { number: data.semesterNumber }
    });
    if (!semester) {
      semester = await this.prisma.semester.create({
        data: { name: data.semesterName, number: data.semesterNumber }
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

  async remove(id: string) {
    return this.prisma.section.delete({ where: { id } });
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



