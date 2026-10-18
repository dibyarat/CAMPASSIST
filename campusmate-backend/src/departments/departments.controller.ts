import { Controller, Get, Post, Body, Patch, Param, Delete, UseGuards } from '@nestjs/common';
import { DepartmentsService } from './departments.service';
import { FirebaseAuthGuard } from '../common/guards/firebase-auth.guard';
import { RolesGuard } from '../common/guards/roles.guard';
import { Roles } from '../common/decorators/roles.decorator';

@Controller('departments')
export class DepartmentsController {
  constructor(private readonly departmentsService: DepartmentsService) {}

  @Post()
  @UseGuards(FirebaseAuthGuard, RolesGuard)
  @Roles('DEVELOPER')
  create(@Body() createDepartmentDto: { name: string; code: string }) {
    return this.departmentsService.create(createDepartmentDto);
  }

  @Get()
  // All users can read master data
  findAll() {
    return this.departmentsService.findAll();
  }

  @Get(':id')
  @UseGuards(FirebaseAuthGuard, RolesGuard)
  findOne(@Param('id') id: string) {
    return this.departmentsService.findOne(id);
  }

  @Patch(':id')
  @UseGuards(FirebaseAuthGuard, RolesGuard)
  @Roles('DEVELOPER')
  update(@Param('id') id: string, @Body() updateDepartmentDto: { name?: string; code?: string }) {
    return this.departmentsService.update(id, updateDepartmentDto);
  }

  @Delete(':id')
  @UseGuards(FirebaseAuthGuard, RolesGuard)
  @Roles('DEVELOPER')
  remove(@Param('id') id: string) {
    return this.departmentsService.remove(id);
  }
}

