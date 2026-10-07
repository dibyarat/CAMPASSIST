import { Controller, Get, Post, Body, Param, UseGuards, ForbiddenException } from '@nestjs/common';
import { PollsService } from './polls.service';
import { SupabaseAuthGuard } from '../common/guards/supabase-auth.guard';
import { RolesGuard } from '../common/guards/roles.guard';
import { Roles } from '../common/decorators/roles.decorator';
import { CurrentUser } from '../common/decorators/current-user.decorator';

@Controller('polls')
@UseGuards(SupabaseAuthGuard, RolesGuard)
export class PollsController {
  constructor(private readonly pollsService: PollsService) {}

  @Post()
  @Roles('CR', 'DEVELOPER')
  createPoll(@Body() data: any, @CurrentUser() user: any) {
    return this.pollsService.createPoll(user.id, data);
  }

  @Post(':pollId/vote')
  @Roles('STUDENT', 'CR', 'DEVELOPER')
  vote(@Param('pollId') pollId: string, @Body('optionId') optionId: string, @CurrentUser() user: any) {
    return this.pollsService.vote(user.id, pollId, optionId);
  }

  @Get()
  getActivePolls() {
    return this.pollsService.getActivePolls();
  }
}

