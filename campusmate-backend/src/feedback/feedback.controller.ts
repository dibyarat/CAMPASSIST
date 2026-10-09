import { Controller, Get, Post, Body, Patch, Param, UseGuards } from '@nestjs/common';
import { FeedbackService } from './feedback.service';
import { CreateFeedbackDto, UpdateFeedbackStatusDto } from './dto/create-feedback.dto';
import { FirebaseAuthGuard } from '../common/guards/firebase-auth.guard';
import { RolesGuard } from '../common/guards/roles.guard';
import { Roles } from '../common/decorators/roles.decorator';
import { CurrentUser } from '../common/decorators/current-user.decorator';

@Controller('feedback')
@UseGuards(FirebaseAuthGuard, RolesGuard)
export class FeedbackController {
  constructor(private readonly feedbackService: FeedbackService) {}

  @Post()
  create(@CurrentUser() user: any, @Body() createFeedbackDto: CreateFeedbackDto) {
    return this.feedbackService.create(user.id, createFeedbackDto);
  }

  @Get()
  @Roles('DEVELOPER')
  findAll() {
    return this.feedbackService.findAll();
  }

  @Patch(':id')
  @Roles('DEVELOPER')
  updateStatus(@Param('id') id: string, @Body() updateDto: UpdateFeedbackStatusDto) {
    return this.feedbackService.updateStatus(id, updateDto);
  }
}
