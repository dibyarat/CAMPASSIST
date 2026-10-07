import { Controller, Get, Post, Body, Patch, Param, Delete, UseGuards } from '@nestjs/common';
import { DepartmentsService } from './departments.service';
import { SupabaseAuthGuard } from '../common/guards/supabase-auth.guard';
import { RolesGuard } from '../common/guards/roles.guard';
import { Roles } from '../common/decorators/roles.decorator';

@Controller('departments')
@UseGuards(SupabaseAuthGuard, RolesGuard)
export class DepartmentsController {
  constructor(private readonly departmentsService: DepartmentsService) {}

  @Post()
  @Roles('DEVELOPER')
  create(@Body() createDepartmentDto: { name: string; code: string }) {
    return this.departmentsService.create(createDepartmentDto);
  }

  @Get()
  // All authenticated users can read master data
  findAll() {
    return this.departmentsService.findAll();
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.departmentsService.findOne(id);
  }

  @Patch(':id')
  @Roles('DEVELOPER')
  update(@Param('id') id: string, @Body() updateDepartmentDto: { name?: string; code?: string }) {
    return this.departmentsService.update(id, updateDepartmentDto);
  }

  @Delete(':id')
  @Roles('DEVELOPER')
  remove(@Param('id') id: string) {
    return this.departmentsService.remove(id);
  }
}

