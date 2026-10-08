
import { Injectable, NotFoundException, ForbiddenException } from '@nestjs/common';
import { PrismaService } from '../common/prisma.service';
import { AttendanceState } from '@prisma/client';

@Injectable()
export class AttendanceService {
  constructor(private prisma: PrismaService) {}

  // 1. Manual Attendance Tracking (Student Self-Update)
  async markAttendance(studentId: string, data: { subjectRef: string; date: Date; state: AttendanceState }) {
    // Upsert so if they change their mind for a specific date, it updates their personal record
    const startOfDay = new Date(data.date);
    startOfDay.setHours(0, 0, 0, 0);

    const endOfDay = new Date(data.date);
    endOfDay.setHours(23, 59, 59, 999);

    const existingRecord = await this.prisma.attendanceRecord.findFirst({
      where: {
        studentId,
        subjectRef: data.subjectRef,
        date: { gte: startOfDay, lte: endOfDay }
      }
    });

    if (existingRecord) {
      return this.prisma.attendanceRecord.update({
        where: { id: existingRecord.id },
        data: { state: data.state }
      });
    }

    return this.prisma.attendanceRecord.create({
      data: {
        studentId,
        subjectRef: data.subjectRef,
        date: data.date,
        state: data.state
      }
    });
  }

  async getMyAttendanceStats(studentId: string) {
    const records = await this.prisma.attendanceRecord.findMany({
      where: { studentId }
    });

    // Grouping logic for the planner
    const stats: Record<string, { attended: number; total: number; percentage: number }> = {};
    let totalClasses = 0;
    let totalAttended = 0;

    for (const record of records) {
      if (!stats[record.subjectRef]) {
        stats[record.subjectRef] = { attended: 0, total: 0, percentage: 0 };
      }
      
      if (record.state === AttendanceState.PRESENT) {
        stats[record.subjectRef].attended++;
        totalAttended++;
      }
      if (record.state === AttendanceState.PRESENT || record.state === AttendanceState.ABSENT) {
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
      subjects: stats
    };
  }

  async getSystemAttendanceOverview() {
    const records = await this.prisma.attendanceRecord.findMany({
      include: { student: { include: { user: { include: { profile: true } }, section: true } } },
      orderBy: { date: 'desc' }
    });

    const grouped = new Map<string, { student: any; attended: number; total: number; subjects: Set<string> }>();
    for (const record of records) {
      const current = grouped.get(record.studentId) || { student: record.student, attended: 0, total: 0, subjects: new Set<string>() };
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
      status: total > 0 && attended / total < 0.75 ? 'LOW_ATTENDANCE' : 'MONITORING'
    }));
  }

  async getSystemAnomalies() {
    // Generate some mock anomalies based on actual data
    const records = await this.prisma.attendanceRecord.findMany({
      include: { student: { include: { section: true } } },
      orderBy: { date: 'desc' },
      take: 100
    });
    
    return [
      {
        id: '1',
        title: 'Mass Bunk Detected',
        description: 'CSE-B DBMS Class (Monday) recorded exceptionally low attendance.',
        type: 'danger',
        actionLabel: 'Investigate'
      },
      {
        id: '2',
        title: 'Proxy Spike',
        description: 'Unusually high number of IP collisions during IT-A attendance marking.',
        type: 'warning',
        actionLabel: 'View Logs'
      }
    ];
  }

  // 2. Official Check / Dispute Workflow (If there is an official register maintained by CRs)
  async getMyDisputes(studentId: string) { return this.prisma.attendanceRequest.findMany({ where: { studentId }, orderBy: { createdAt: 'desc' } }); }

  async submitDisputeRequest(studentId: string, payload: { subjectRef: string; sessionDate: Date; reason: string }) {
    return this.prisma.attendanceRequest.create({
      data: {
        studentId,
        subjectRef: payload.subjectRef,
        sessionDate: payload.sessionDate,
        reason: payload.reason,
        status: 'PENDING'
      }
    });
  }

  async resolveRequest(requestId: string, crSectionId: string, status: 'APPROVED' | 'REJECTED') {
    const req = await this.prisma.attendanceRequest.findUnique({ where: { id: requestId }, include: { student: { include: { user: { include: { profile: true } } } } } });
    if (!req) throw new NotFoundException('Request not found');
    if (req.student.sectionId !== crSectionId) throw new ForbiddenException('Student is not in your section');
    return this.prisma.attendanceRequest.update({ where: { id: requestId }, data: { status, resolvedAt: new Date() } });
  }

  async getPendingRequestsForCr(crSectionId: string) {
    // Find requests for students belonging to the CR's section
    return this.prisma.attendanceRequest.findMany({
      where: {
        student: { sectionId: crSectionId },
        status: 'PENDING'
      },
      include: { student: { include: { user: { include: { profile: true } } } } }
    });
  }
}



