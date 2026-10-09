import { Injectable, NotFoundException, Logger } from '@nestjs/common';
import { PrismaService } from '../common/prisma.service';
import { FirebaseAdminService } from '../common/firebase/firebase-admin.service';

@Injectable()
export class ExamsService {
  private readonly logger = new Logger(ExamsService.name);

  constructor(
    private prisma: PrismaService,
    private firebase: FirebaseAdminService,
  ) {}

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
    const exam = await this.prisma.exam.create({ data });

    try {
      await this.firebase.firestore.collection('exams').doc(exam.id).set({
        ...exam,
        date: new Date(exam.date).toISOString(),
        createdAt: new Date().toISOString(),
      });
    } catch (err: any) {
      this.logger.warn(`Failed writing exam to Firestore: ${err?.message}`);
    }

    return exam;
  }

  async getAllExamsForTerm(termId: string) {
    try {
      const snap = await this.firebase.firestore
        .collection('exams')
        .where('termId', '==', termId)
        .get();

      if (!snap.empty) {
        return snap.docs.map((doc) => doc.data());
      }
    } catch {}

    return this.prisma.exam.findMany({
      where: { termId },
      include: { subject: true, room: true },
    });
  }

  async saveSeatingImport(examId: string, seatingData: any[]) {
    try {
      const batch = this.firebase.firestore.batch();
      seatingData.forEach((seat) => {
        const ref = this.firebase.firestore.collection('exam_seating').doc(`${examId}_${seat.rollNumber}`);
        batch.set(ref, {
          examId,
          rollNumber: seat.rollNumber,
          studentName: seat.name,
          roomHall: seat.roomHall,
          seat: seat.seat,
          row: seat.row,
          column: seat.column,
          updatedAt: new Date().toISOString(),
        });
      });
      await batch.commit();
    } catch (err: any) {
      this.logger.warn(`Failed writing exam seating to Firestore: ${err?.message}`);
    }

    return this.prisma.$transaction(async (prisma) => {
      await prisma.examSeating.deleteMany({ where: { examId } });
      return prisma.examSeating.createMany({
        data: seatingData.map((seat) => ({
          examId,
          rollNumber: seat.rollNumber,
          studentName: seat.name,
          roomHall: seat.roomHall,
          seat: seat.seat,
          row: seat.row,
          column: seat.column,
        })),
      });
    });
  }

  async getMyExamSeat(examId: string, rollNumber: string) {
    try {
      const doc = await this.firebase.firestore.collection('exam_seating').doc(`${examId}_${rollNumber}`).get();
      if (doc.exists) return doc.data();
    } catch {}

    const seat = await this.prisma.examSeating.findUnique({
      where: {
        examId_rollNumber: {
          examId,
          rollNumber,
        },
      },
      include: { exam: { include: { subject: true } } },
    });

    if (!seat) throw new NotFoundException('Exam seating not found for your Roll Number');
    return seat;
  }
}
