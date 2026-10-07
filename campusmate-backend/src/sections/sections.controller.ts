import { Controller, Get, Post, Body, UseGuards, Param, Delete } from '@nestjs/common';
import { SectionsService } from './sections.service';
import { SupabaseAuthGuard } from '../common/guards/supabase-auth.guard';
import { RolesGuard } from '../common/guards/roles.guard';
import { Roles } from '../common/decorators/roles.decorator';

@Controller('sections')
export class SectionsController {
  constructor(private readonly sectionsService: SectionsService) {}

  @Post()
  @UseGuards(SupabaseAuthGuard, RolesGuard)
  @Roles('DEVELOPER')
  create(@Body() createSectionDto: { name: string; departmentName: string; semesterName: string }) {
    return this.sectionsService.create(createSectionDto);
  }

  @Get()
  findAll() {
    return this.sectionsService.findAll();
  }

  @Post('assign-cr')
  @UseGuards(SupabaseAuthGuard, RolesGuard)
  @Roles('DEVELOPER')
  assignCr(@Body() assignCrDto: { userId: string; sectionId: string; termId: string }) {
    return this.sectionsService.assignCr(assignCrDto);
  }

  @Delete('assign-cr/:id')
  @UseGuards(SupabaseAuthGuard, RolesGuard)
  @Roles('DEVELOPER')
  removeCr(@Param('id') assignmentId: string) {
    return this.sectionsService.removeCrAssignment(assignmentId);
  }
}
