import { Controller, Get, Post, Body, UseGuards, Param, Delete } from '@nestjs/common';
import { SectionsService } from './sections.service';
import { FirebaseAuthGuard } from '../common/guards/firebase-auth.guard';
import { RolesGuard } from '../common/guards/roles.guard';
import { Roles } from '../common/decorators/roles.decorator';

@Controller('sections')
export class SectionsController {
  constructor(private readonly sectionsService: SectionsService) {}

  @Post()
  @UseGuards(FirebaseAuthGuard, RolesGuard)
  @Roles('DEVELOPER')
  create(@Body() createSectionDto: {
    name: string;
    departmentCode: string;
    departmentName: string;
    semesterNumber: number;
    semesterName: string;
    institutionId?: string | null;
  }) {
    return this.sectionsService.create(createSectionDto);
  }

  @Get()
  findAll() {
    return this.sectionsService.findAll();
  }

  @Post('assign-cr')
  @UseGuards(FirebaseAuthGuard, RolesGuard)
  @Roles('DEVELOPER')
  assignCr(@Body() assignCrDto: { userId: string; sectionId: string; termId: string }) {
    return this.sectionsService.assignCr(assignCrDto);
  }

  @Delete(':id')
  @UseGuards(FirebaseAuthGuard, RolesGuard)
  @Roles('DEVELOPER')
  remove(@Param('id') id: string) {
    return this.sectionsService.remove(id);
  }

  @Delete('assign-cr/:id')
  @UseGuards(FirebaseAuthGuard, RolesGuard)
  @Roles('DEVELOPER')
  removeCr(@Param('id') assignmentId: string) {
    return this.sectionsService.removeCrAssignment(assignmentId);
  }
}


