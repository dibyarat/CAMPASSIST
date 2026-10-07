import { Controller, Get, Post, Body, UseGuards, Param, Delete } from '@nestjs/common';
import { SectionsService } from './sections.service';
import { SupabaseAuthGuard } from '../common/guards/supabase-auth.guard';
import { RolesGuard } from '../common/guards/roles.guard';
import { Roles } from '../common/decorators/roles.decorator';

@Controller('sections')
@UseGuards(SupabaseAuthGuard, RolesGuard)
export class SectionsController {
  constructor(private readonly sectionsService: SectionsService) {}

  @Post()
  @Roles('DEVELOPER')
  create(@Body() createSectionDto: { name: string; departmentId: string; semesterId: string }) {
    return this.sectionsService.create(createSectionDto);
  }

  @Get()
  findAll() {
    return this.sectionsService.findAll();
  }

  @Post('assign-cr')
  @Roles('DEVELOPER')
  assignCr(@Body() assignCrDto: { userId: string; sectionId: string; termId: string }) {
    return this.sectionsService.assignCr(assignCrDto);
  }

  @Delete('assign-cr/:id')
  @Roles('DEVELOPER')
  removeCr(@Param('id') assignmentId: string) {
    return this.sectionsService.removeCrAssignment(assignmentId);
  }
}

