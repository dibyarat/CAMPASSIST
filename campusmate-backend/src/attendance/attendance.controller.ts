import { Controller, Get, Post, Patch, Param, Body, UseGuards, Req, ForbiddenException } from '@nestjs/common';
import { AttendanceService } from './attendance.service';
import { SupabaseAuthGuard } from '../common/guards/supabase-auth.guard';
import { RolesGuard } from '../common/guards/roles.guard';
import { Roles } from '../common/decorators/roles.decorator';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import { AttendanceState } from '@prisma/client';

@Controller('attendance')
@UseGuards(SupabaseAuthGuard, RolesGuard)
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

  @Get('cr-queue')
  @Roles('CR')
  @Patch('cr-queue/:id')
  @Roles('CR')
  resolveRequest(@Param('id') id: string, @Body('status') status: 'APPROVED' | 'REJECTED', @CurrentUser() user: any) {
    if (!user.crAssignment || !user.crAssignment.isActive) throw new ForbiddenException('No active CR assignment');
    return this.attendanceService.resolveRequest(id, user.crAssignment.sectionId, status);
  }

  getRequestsQueue(@CurrentUser() user: any) {
    if (!user.crAssignment || !user.crAssignment.isActive) {
      throw new ForbiddenException('No active CR assignment found');
    }
    return this.attendanceService.getPendingRequestsForCr(user.crAssignment.sectionId);
  }
}



