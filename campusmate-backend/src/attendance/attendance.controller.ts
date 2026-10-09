import { Controller, Get, Post, Patch, Param, Body, UseGuards, Req, ForbiddenException } from '@nestjs/common';
import { AttendanceService } from './attendance.service';
import { FirebaseAuthGuard } from '../common/guards/firebase-auth.guard';
import { RolesGuard } from '../common/guards/roles.guard';
import { Roles } from '../common/decorators/roles.decorator';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import { AttendanceState } from '../common/enums';

@Controller('attendance')
@UseGuards(FirebaseAuthGuard, RolesGuard)
export class AttendanceController {
  constructor(private readonly attendanceService: AttendanceService) {}

  // --- 1. Manual Tracking (Personal to Student) ---

  @Post('mark')
  @Roles('STUDENT', 'CR')
  markManualAttendance(
    @CurrentUser() user: any, 
    @Body() data: { subjectRef: string; date: Date; state: AttendanceState }
  ) {
    if (!user.student) throw new ForbiddenException('User must have a student profile setup to track attendance');
    return this.attendanceService.markAttendance(user.student.id, data);
  }

  @Get('my-attendance')
  @Roles('STUDENT', 'CR')
  getMyAttendanceStats(@CurrentUser() user: any) {
    if (!user.student) throw new ForbiddenException('User must have a student profile setup');
    return this.attendanceService.getMyAttendanceStats(user.student.id);
  }

  @Get('overview')
  @Roles('DEVELOPER')
  getSystemAttendanceOverview() {
    return this.attendanceService.getSystemAttendanceOverview();
  }

  @Get('anomalies')
  @Roles('DEVELOPER')
  getSystemAnomalies() {
    return this.attendanceService.getSystemAnomalies();
  }

  // --- 2. Official Checks / Disputes (CR Workflow) ---

  @Get('my-disputes')
  @Roles('STUDENT', 'CR')
  getMyDisputes(@CurrentUser() user: any) {
    if (!user.student) throw new ForbiddenException('User must have a student profile setup');
    return this.attendanceService.getMyDisputes(user.student.id);
  }

  @Post('dispute')
  @Roles('STUDENT', 'CR')
  submitDispute(
    @CurrentUser() user: any, 
    @Body() data: { subjectRef: string; sessionDate: Date; reason: string }
  ) {
    if (!user.student) throw new ForbiddenException('User must have a student profile setup');
    return this.attendanceService.submitDisputeRequest(user.student.id, data);
  }

  @Patch('cr-queue/:id')
  @Roles('CR')
  resolveRequest(@Param('id') id: string, @Body('status') status: 'APPROVED' | 'REJECTED', @CurrentUser() user: any) {
    if (!user.crAssignment || !user.crAssignment.isActive) throw new ForbiddenException('No active CR assignment');
    return this.attendanceService.resolveRequest(id, user.crAssignment.sectionId, status);
  }

  @Get('cr-queue')
  @Roles('CR')
  getRequestsQueue(@CurrentUser() user: any) {
    if (!user.crAssignment || !user.crAssignment.isActive) {
      throw new ForbiddenException('No active CR assignment found');
    }
    return this.attendanceService.getPendingRequestsForCr(user.crAssignment.sectionId);
  }
}



