import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../common/prisma.service';
import { CreateAcademicRecordDto } from './grades.dto';

@Injectable()
export class GradesService {
  constructor(private prisma: PrismaService) {}

  async getMyRecords(studentId: string) {
    return this.prisma.academicRecord.findMany({
      where: { studentId },
      include: {
        term: true,
        grades: { include: { subject: true } }
      },
      orderBy: { term: { startDate: 'desc' } }
    });
  }

  async upsertAcademicRecord(dto: CreateAcademicRecordDto) {
    let totalCredits = 0;
    let totalGradePoints = 0;

    for (const g of dto.grades) {
      totalCredits += g.credits;
      totalGradePoints += (g.gradePoint * g.credits);
    }

    const calculatedSgpa = totalCredits > 0 ? (totalGradePoints / totalCredits) : 0;
    const finalSgpa = dto.sgpa ?? calculatedSgpa;

    const record = await this.prisma.academicRecord.upsert({
      where: {
        studentId_termId: {
          studentId: dto.studentId,
          termId: dto.termId
        }
      },
      update: {
        sgpa: finalSgpa,
        cgpa: dto.cgpa,
        totalCredits,
      },
      create: {
        studentId: dto.studentId,
        termId: dto.termId,
        sgpa: finalSgpa,
        cgpa: dto.cgpa,
        totalCredits,
      }
    });

    // Replace grades
    await this.prisma.grade.deleteMany({
      where: { academicRecordId: record.id }
    });

    if (dto.grades.length > 0) {
      await this.prisma.grade.createMany({
        data: dto.grades.map(g => ({
          academicRecordId: record.id,
          subjectId: g.subjectId,
          grade: g.grade,
          gradePoint: g.gradePoint,
          credits: g.credits
        }))
      });
    }

    // Recalculate CGPA for the student based on all records
    await this.recalculateCgpa(dto.studentId);

    return this.prisma.academicRecord.findUnique({
      where: { id: record.id },
      include: { grades: true }
    });
  }

  private async recalculateCgpa(studentId: string) {
    const records = await this.prisma.academicRecord.findMany({
      where: { studentId, sgpa: { not: null } }
    });

    if (records.length === 0) return;

    let totalCredits = 0;
    let totalScore = 0;

    for (const r of records) {
      if (r.totalCredits && r.sgpa) {
        totalCredits += r.totalCredits;
        totalScore += (r.sgpa * r.totalCredits);
      }
    }

    const cgpa = totalCredits > 0 ? (totalScore / totalCredits) : 0;

    // Update all records with the new overall CGPA for simplicity
    await this.prisma.academicRecord.updateMany({
      where: { studentId },
      data: { cgpa }
    });
  }
}
