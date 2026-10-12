import { Injectable, NotFoundException, ForbiddenException, Logger } from '@nestjs/common';
import { PrismaService } from '../common/prisma.service';
import { FirebaseAdminService } from '../common/firebase/firebase-admin.service';
import { AttendanceState } from '../common/enums';

export interface RegisterComponent {
  key: string;
  base: { p: number; a: number };
}

export interface RegisterSubject {
  id: string;
  name: string;
  code?: string;
  components: RegisterComponent[];
  createdAt: string;
}

export interface RegisterLog {
  id: string;
  sid: string;
  comp: string;
  status: 'p' | 'a' | 'c';
  date: string;
  at: string;
}

export interface AttendanceRegisterStore {
  target: number;
  subjects: RegisterSubject[];
  logs: RegisterLog[];
}

export function seedAttendanceRegister(): AttendanceRegisterStore {
  return {
    target: 75,
    subjects: [],
    logs: [],
  };
}

@Injectable()
export class AttendanceService {
  private readonly logger = new Logger(AttendanceService.name);

  constructor(
    private prisma: PrismaService,
    private firebase: FirebaseAdminService,
  ) {}

  // --- Attendance Register Methods (matching AttendanceRegister.apk logic) ---
  async getAttendanceRegister(studentId: string): Promise<AttendanceRegisterStore> {
    try {
      const doc = await this.firebase.firestore.collection('attendance_registers').doc(studentId).get();
      if (doc.exists) {
        const data = doc.data() as AttendanceRegisterStore;
        if (data && Array.isArray(data.subjects) && Array.isArray(data.logs)) {
          return {
            target: typeof data.target === 'number' ? data.target : 75,
            subjects: data.subjects,
            logs: data.logs,
          };
        }
      }
    } catch (err: any) {
      this.logger.warn(`Failed reading register from Firestore for student ${studentId}: ${err?.message}`);
    }

    return seedAttendanceRegister();
  }

  async saveAttendanceRegister(studentId: string, store: AttendanceRegisterStore) {
    if (!store || !Array.isArray(store.subjects) || !Array.isArray(store.logs)) {
      throw new Error('Invalid attendance register payload');
    }

    const payload: AttendanceRegisterStore = {
      target: typeof store.target === 'number' ? Math.min(100, Math.max(1, store.target)) : 75,
      subjects: store.subjects,
      logs: store.logs,
    };

    try {
      await this.firebase.firestore.collection('attendance_registers').doc(studentId).set({
        ...payload,
        updatedAt: new Date().toISOString(),
      });
    } catch (err: any) {
      this.logger.warn(`Failed saving register to Firestore for student ${studentId}: ${err?.message}`);
    }

    return payload;
  }

  // 1. Manual Attendance Tracking (Student Self-Update)
  async markAttendance(studentId: string, data: { subjectRef: string; date: Date; state: AttendanceState }) {
    const startOfDay = new Date(data.date);
    startOfDay.setHours(0, 0, 0, 0);

    const endOfDay = new Date(data.date);
    endOfDay.setHours(23, 59, 59, 999);

    const existingRecord = await this.prisma.attendanceRecord.findFirst({
      where: {
        studentId,
        subjectRef: data.subjectRef,
        date: { gte: startOfDay, lte: endOfDay },
      },
    });

    let record;
    if (existingRecord) {
      record = await this.prisma.attendanceRecord.update({
        where: { id: existingRecord.id },
        data: { state: data.state },
      });
    } else {
      record = await this.prisma.attendanceRecord.create({
        data: {
          studentId,
          subjectRef: data.subjectRef,
          date: data.date,
          state: data.state,
        },
      });
    }

    // Sync to Firestore
    try {
      await this.firebase.firestore.collection('attendance_records').doc(record.id).set({
        id: record.id,
        studentId,
        subjectRef: data.subjectRef,
        date: new Date(data.date).toISOString(),
        state: data.state,
        updatedAt: new Date().toISOString(),
      });
    } catch (err: any) {
      this.logger.warn(`Failed syncing attendance record to Firestore: ${err?.message}`);
    }

    return record;
  }

  async getMyAttendanceStats(studentId: string) {
    // 1. Try reading from Firestore Attendance Register first
    try {
      const doc = await this.firebase.firestore.collection('attendance_registers').doc(studentId).get();
      if (doc.exists) {
        const reg = doc.data() as AttendanceRegisterStore;
        if (reg && Array.isArray(reg.subjects)) {
          let overallAttended = 0;
          let overallTotal = 0;
          let overallCancelled = 0;
          const subjectsStats: Record<string, { attended: number; total: number; percentage: number; cancelled?: number; code?: string; name?: string }> = {};

          for (const s of reg.subjects) {
            let sp = 0;
            let sa = 0;
            let sc = 0;
            for (const comp of s.components || []) {
              let cp = comp.base ? (comp.base.p || 0) : 0;
              let ca = comp.base ? (comp.base.a || 0) : 0;
              let cc = 0;
              for (const l of reg.logs || []) {
                if (l.sid !== s.id || l.comp !== comp.key) continue;
                if (l.status === 'p') cp++;
                else if (l.status === 'a') ca++;
                else cc++;
              }
              sp += cp;
              sa += ca;
              sc += cc;
            }
            const stotal = sp + sa;
            const spct = stotal > 0 ? (sp / stotal) * 100 : 0;
            const refKey = s.code || s.name;
            subjectsStats[refKey] = {
              attended: sp,
              total: stotal,
              percentage: spct,
              cancelled: sc,
              code: s.code,
              name: s.name,
            };
            overallAttended += sp;
            overallTotal += stotal;
            overallCancelled += sc;
          }

          const overallPercentage = overallTotal > 0 ? (overallAttended / overallTotal) * 100 : 0;
          return {
            overallPercentage,
            overallAttended,
            overallTotal,
            overallCancelled,
            target: reg.target || 75,
            subjects: subjectsStats,
          };
        }
      }
    } catch (err: any) {
      this.logger.warn(`Failed reading register stats from Firestore: ${err?.message}`);
    }

    let records: any[] = [];

    // Try reading from Firestore individual records
    try {
      const snap = await this.firebase.firestore
        .collection('attendance_records')
        .where('studentId', '==', studentId)
        .get();

      if (!snap.empty) {
        records = snap.docs.map((doc) => doc.data());
      }
    } catch (err: any) {
      this.logger.warn(`Failed reading attendance stats from Firestore: ${err?.message}`);
    }

    // Fallback to Prisma
    if (records.length === 0) {
      records = await this.prisma.attendanceRecord.findMany({
        where: { studentId },
      });
    }

    // Grouping logic for the planner
    const stats: Record<string, { attended: number; total: number; percentage: number }> = {};
    let totalClasses = 0;
    let totalAttended = 0;

    for (const record of records) {
      if (!stats[record.subjectRef]) {
        stats[record.subjectRef] = { attended: 0, total: 0, percentage: 0 };
      }

      if (record.state === 'PRESENT' || record.state === AttendanceState.PRESENT) {
        stats[record.subjectRef].attended++;
        totalAttended++;
      }
      if (
        record.state === 'PRESENT' ||
        record.state === 'ABSENT' ||
        record.state === AttendanceState.PRESENT ||
        record.state === AttendanceState.ABSENT
      ) {
        stats[record.subjectRef].total++;
        totalClasses++;
      }
    }

    // Calculate percentages
    for (const sub in stats) {
      stats[sub].percentage = stats[sub].total > 0 ? (stats[sub].attended / stats[sub].total) * 100 : 0;
    }

    const overallPercentage = totalClasses > 0 ? (totalAttended / totalClasses) * 100 : 0;

    return {
      overallPercentage,
      overallAttended: totalAttended,
      overallTotal: totalClasses,
      subjects: stats,
    };
  }

  async getSystemAttendanceOverview() {
    const records = await this.prisma.attendanceRecord.findMany({
      include: { student: { include: { user: { include: { profile: true } }, section: true } } },
      orderBy: { date: 'desc' },
    });

    const grouped = new Map<string, { student: any; attended: number; total: number; subjects: Set<string> }>();
    for (const record of records) {
      const current = grouped.get(record.studentId) || {
        student: record.student,
        attended: 0,
        total: 0,
        subjects: new Set<string>(),
      };
      if (record.state === AttendanceState.PRESENT) {
        current.attended++;
        current.total++;
      } else if (record.state === AttendanceState.ABSENT) {
        current.total++;
        current.subjects.add(record.subjectRef);
      }
      grouped.set(record.studentId, current);
    }

    return Array.from(grouped.values()).map(({ student, attended, total, subjects }) => ({
      id: student.id,
      name: student.user.profile?.fullName || student.user.email,
      section: student.section?.name || student.user.profile?.section || 'Unassigned',
      percentage: total > 0 ? (attended / total) * 100 : 0,
      criticalSubjects: Array.from(subjects),
      status: total > 0 && attended / total < 0.75 ? 'LOW_ATTENDANCE' : 'MONITORING',
    }));
  }

  async getSystemAnomalies() {
    return [
      {
        id: '1',
        title: 'Mass Bunk Detected',
        description: 'CSE-B DBMS Class (Monday) recorded exceptionally low attendance.',
        type: 'danger',
        actionLabel: 'Investigate',
      },
      {
        id: '2',
        title: 'Proxy Spike',
        description: 'Unusually high number of IP collisions during IT-A attendance marking.',
        type: 'warning',
        actionLabel: 'View Logs',
      },
    ];
  }

  // 2. Official Check / Dispute Workflow
  async getMyDisputes(studentId: string) {
    try {
      const snap = await this.firebase.firestore
        .collection('attendance_requests')
        .where('studentId', '==', studentId)
        .orderBy('createdAt', 'desc')
        .get();

      if (!snap.empty) return snap.docs.map((doc) => doc.data());
    } catch {}

    return this.prisma.attendanceRequest.findMany({
      where: { studentId },
      orderBy: { createdAt: 'desc' },
    });
  }

  async submitDisputeRequest(studentId: string, payload: { subjectRef: string; sessionDate: Date; reason: string }) {
    const req = await this.prisma.attendanceRequest.create({
      data: {
        studentId,
        subjectRef: payload.subjectRef,
        sessionDate: payload.sessionDate,
        reason: payload.reason,
        status: 'PENDING',
      },
    });

    try {
      await this.firebase.firestore.collection('attendance_requests').doc(req.id).set({
        id: req.id,
        studentId,
        subjectRef: payload.subjectRef,
        sessionDate: new Date(payload.sessionDate).toISOString(),
        reason: payload.reason,
        status: 'PENDING',
        createdAt: new Date().toISOString(),
      });
    } catch {}

    return req;
  }

  async resolveRequest(requestId: string, crSectionId: string, status: 'APPROVED' | 'REJECTED') {
    const req = await this.prisma.attendanceRequest.findUnique({
      where: { id: requestId },
      include: { student: { include: { user: { include: { profile: true } } } } },
    });
    if (!req) throw new NotFoundException('Request not found');
    if (req.student.sectionId !== crSectionId) throw new ForbiddenException('Student is not in your section');

    try {
      await this.firebase.firestore.collection('attendance_requests').doc(requestId).set(
        {
          status,
          resolvedAt: new Date().toISOString(),
        },
        { merge: true },
      );
    } catch {}

    return this.prisma.attendanceRequest.update({
      where: { id: requestId },
      data: { status, resolvedAt: new Date() },
    });
  }

  async getPendingRequestsForCr(crSectionId: string) {
    return this.prisma.attendanceRequest.findMany({
      where: {
        student: { sectionId: crSectionId },
        status: 'PENDING',
      },
      include: { student: { include: { user: { include: { profile: true } } } } },
    });
  }
}
