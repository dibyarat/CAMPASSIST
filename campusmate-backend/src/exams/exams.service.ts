import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../common/prisma.service';

@Injectable()
export class ExamsService {
  constructor(private prisma: PrismaService) {}

  async createExam(data: {
    subjectId: string;
    roomId?: string;
    termId: string;
    examType: string;
    date: Date;
    startTime: string;
    endTime: string;
    notes?: string;
  }) {
    return this.prisma.exam.create({ data });
  }

  async getAllExamsForTerm(termId: string) {
    return this.prisma.exam.findMany({
      where: { termId },
      include: { subject: true, room: true }
    });
  }

  // --- SEATING MANAGEMENT ---

  // Represents the end of the import pipeline (Save & Publish)
  async saveSeatingImport(examId: string, seatingData: any[]) {
    // seatingData is an array of objects mapped from the CSV/XLSX
    // Ensure we process this in a transaction to prevent partial corrupt state
    return this.prisma.$transaction(async (prisma) => {
      // 1. Clear old seating for this exam if necessary (or update)
      await prisma.examSeating.deleteMany({ where: { examId } });
      
      // 2. Insert new seating
      return prisma.examSeating.createMany({
        data: seatingData.map((seat) => ({
          examId,
          rollNumber: seat.rollNumber,
          studentName: seat.name,
          roomHall: seat.roomHall,
          seat: seat.seat,
          row: seat.row,
          column: seat.column
        }))
      });
    });
  }

  // Students can only fetch their own seat
  async getMyExamSeat(examId: string, rollNumber: string) {
    const seat = await this.prisma.examSeating.findUnique({
      where: {
        examId_rollNumber: {
          examId,
          rollNumber
        }
      },
      include: { exam: { include: { subject: true } } }
    });

    if (!seat) throw new NotFoundException('Exam seating not found for your Roll Number');
    return seat;
  }
}
