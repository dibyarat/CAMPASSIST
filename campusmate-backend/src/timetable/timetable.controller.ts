import { Controller, Get, Post, Body, Param, Patch, Delete, UseGuards, Req, ForbiddenException } from '@nestjs/common';
import { TimetableService } from './timetable.service';
import { FirebaseAuthGuard } from '../common/guards/firebase-auth.guard';
import { RolesGuard } from '../common/guards/roles.guard';
import { Roles } from '../common/decorators/roles.decorator';
import { CurrentUser } from '../common/decorators/current-user.decorator';

@Controller('timetable')
@UseGuards(FirebaseAuthGuard, RolesGuard)
export class TimetableController {
  constructor(private readonly timetableService: TimetableService) {}

  @Post()
  @Roles('DEVELOPER')
  create(@Body() createDto: any) {
    return this.timetableService.create(createDto);
  }

  @Get('section/:sectionId/term/:termId')
  // Students and CRs can view timetables
  getSectionTimetable(@Param('sectionId') sectionId: string, @Param('termId') termId: string) {
    return this.timetableService.findForSection(sectionId, termId);
  }

  // --- CR Operations with Section Scope Authorization ---

  @Get('subjects')
  getSubjects() {
    return this.timetableService.getSubjects();
  }

  @Post('cr')
  @Roles('CR')
  async crCreate(@Body() data: any, @CurrentUser() user: any) {
    if (!user.crAssignment || !user.crAssignment.isActive) {
      throw new ForbiddenException('No active CR assignment found');
    }
    const crSectionId = user.crAssignment.sectionId;
    return this.timetableService.createDynamic(data, crSectionId);
  }

  @Patch(':id/cr-update')
  @Roles('CR')
  async crUpdateEntry(@Param('id') entryId: string, @Body() data: any, @CurrentUser() user: any) {
    if (!user.crAssignment || !user.crAssignment.isActive) {
      throw new ForbiddenException('No active CR assignment found');
    }
    // Need to verify it belongs to their section
    return this.timetableService.updateForCr(entryId, user.crAssignment.sectionId, data);
  }

  @Delete(':id/cr-delete')
  @Roles('CR')
  async crDeleteEntry(@Param('id') entryId: string, @CurrentUser() user: any) {
    if (!user.crAssignment || !user.crAssignment.isActive) {
      throw new ForbiddenException('No active CR assignment found');
    }
    return this.timetableService.deleteForCr(entryId, user.crAssignment.sectionId);
  }

  @Patch(':id/cancel')
  @Roles('CR')
  async crReportCancellation(
    @Param('id') entryId: string,
    @Body('note') note: string,
    @CurrentUser() user: any
  ) {
    if (!user.crAssignment || !user.crAssignment.isActive) {
      throw new ForbiddenException('No active CR assignment found');
    }
    const crSectionId = user.crAssignment.sectionId;
    return this.timetableService.reportCancellation(entryId, crSectionId, note);
  }

  @Patch(':id/room-change')
  @Roles('CR')
  async crReportRoomChange(
    @Param('id') entryId: string,
    @Body('newRoomId') newRoomId: string,
    @CurrentUser() user: any
  ) {
    if (!user.crAssignment || !user.crAssignment.isActive) {
      throw new ForbiddenException('No active CR assignment found');
    }
    const crSectionId = user.crAssignment.sectionId;
    return this.timetableService.reportRoomChange(entryId, newRoomId, crSectionId);
  }
}




