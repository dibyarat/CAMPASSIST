import { Controller, Get, Post, Body, Param, Patch, Delete, UseGuards, Req, ForbiddenException } from '@nestjs/common';
import { Throttle } from '@nestjs/throttler';
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
  @Roles('CR', 'DEVELOPER')
  async crCreate(@Body() data: any, @CurrentUser() user: any) {
    let crSectionId = user.crAssignment?.isActive ? user.crAssignment.sectionId : null;
    if (!crSectionId && user.id) {
      const dbCr = await this.timetableService.findCrAssignment(user.id);
      if (dbCr?.isActive) {
        crSectionId = dbCr.sectionId;
      }
    }
    if (!crSectionId) {
      if ((user.roles?.includes('DEVELOPER') || user.role === 'DEVELOPER') && data.sectionId) {
        crSectionId = data.sectionId;
      } else {
        throw new ForbiddenException('No active CR assignment found');
      }
    }
    return this.timetableService.createDynamic(data, crSectionId);
  }

  @Throttle({ default: { limit: 15, ttl: 60000 } })
  @Post('cr/import-csv')
  @Roles('CR', 'DEVELOPER')
  async crImportCsv(
    @Body() body: { entries: any[]; termId?: string; replaceExisting?: boolean; sectionId?: string },
    @CurrentUser() user: any
  ) {
    let crSectionId = user.crAssignment?.isActive ? user.crAssignment.sectionId : null;
    if (!crSectionId && user.id) {
      const dbCr = await this.timetableService.findCrAssignment(user.id);
      if (dbCr?.isActive) {
        crSectionId = dbCr.sectionId;
      }
    }
    if (!crSectionId) {
      if ((user.roles?.includes('DEVELOPER') || user.role === 'DEVELOPER') && (body.sectionId || body.entries?.[0]?.sectionId)) {
        crSectionId = body.sectionId || body.entries?.[0]?.sectionId;
      } else {
        throw new ForbiddenException('No active CR assignment found');
      }
    }
    const termId = body.termId || user.crAssignment?.termId || 'TERM-1';
    return this.timetableService.importEntriesForCr(body.entries, crSectionId, termId, {
      replaceExisting: Boolean(body.replaceExisting),
    });
  }

  @Patch(':id/cr-update')
  @Roles('CR', 'DEVELOPER')
  async crUpdateEntry(@Param('id') entryId: string, @Body() data: any, @CurrentUser() user: any) {
    let crSectionId = user.crAssignment?.isActive ? user.crAssignment.sectionId : null;
    if (!crSectionId && (user.roles?.includes('DEVELOPER') || user.role === 'DEVELOPER')) {
      const entry = await this.timetableService.findById(entryId);
      crSectionId = entry?.sectionId;
    }
    if (!crSectionId) {
      throw new ForbiddenException('No active CR assignment found');
    }
    // Need to verify it belongs to their section
    return this.timetableService.updateForCr(entryId, crSectionId, data);
  }

  @Delete(':id/cr-delete')
  @Roles('CR', 'DEVELOPER')
  async crDeleteEntry(@Param('id') entryId: string, @CurrentUser() user: any) {
    let crSectionId = user.crAssignment?.isActive ? user.crAssignment.sectionId : null;
    if (!crSectionId && (user.roles?.includes('DEVELOPER') || user.role === 'DEVELOPER')) {
      const entry = await this.timetableService.findById(entryId);
      crSectionId = entry?.sectionId;
    }
    if (!crSectionId) {
      throw new ForbiddenException('No active CR assignment found');
    }
    return this.timetableService.deleteForCr(entryId, crSectionId);
  }

  @Patch(':id/cancel')
  @Roles('CR', 'DEVELOPER')
  async crReportCancellation(
    @Param('id') entryId: string,
    @Body('note') note: string,
    @CurrentUser() user: any
  ) {
    let crSectionId = user.crAssignment?.isActive ? user.crAssignment.sectionId : null;
    if (!crSectionId && (user.roles?.includes('DEVELOPER') || user.role === 'DEVELOPER')) {
      const entry = await this.timetableService.findById(entryId);
      crSectionId = entry?.sectionId;
    }
    if (!crSectionId) {
      throw new ForbiddenException('No active CR assignment found');
    }
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




