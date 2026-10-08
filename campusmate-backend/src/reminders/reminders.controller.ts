import { Body, Controller, Delete, Get, Param, Post, UseGuards } from '@nestjs/common';
import { RemindersService } from './reminders.service';
import { SupabaseAuthGuard } from '../common/guards/supabase-auth.guard';
import { RolesGuard } from '../common/guards/roles.guard';
import { CurrentUser } from '../common/decorators/current-user.decorator';

@Controller('reminders')
@UseGuards(SupabaseAuthGuard, RolesGuard)
export class RemindersController {
  constructor(private readonly remindersService: RemindersService) {}

  @Get('mine')
  findMine(@CurrentUser() user: any) {
    return this.remindersService.findMine(user.id);
  }

  @Post()
  create(@CurrentUser() user: any, @Body() data: {
    category: string;
    priority?: string;
    schedule?: string;
    title: string;
    description?: string;
    dueDate: string;
  }) {
    return this.remindersService.create(user.id, data);
  }

  @Delete(':id')
  remove(@CurrentUser() user: any, @Param('id') id: string) {
    return this.remindersService.remove(user.id, id);
  }
}