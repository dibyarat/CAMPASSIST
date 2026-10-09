import { Controller, Get, Patch, Post, Body, Param, UseGuards, Query, ForbiddenException } from '@nestjs/common';
import { NotificationsService } from './notifications.service';
import { FirebaseAuthGuard } from '../common/guards/firebase-auth.guard';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import { RolesGuard } from '../common/guards/roles.guard';
import { Roles } from '../common/decorators/roles.decorator';

@Controller('notifications')
@UseGuards(FirebaseAuthGuard)
export class NotificationsController {
  constructor(private readonly notificationsService: NotificationsService) {}

  @Get()
  getNotifications(@CurrentUser() user: any, @Query('page') page: string, @Query('limit') limit: string) {
    return this.notificationsService.getUserNotifications(
      user.id, 
      limit ? parseInt(limit, 10) : 20, 
      page ? parseInt(page, 10) : 1
    );
  }

  @Post('announcement')
  @UseGuards(RolesGuard)
  @Roles('CR')
  createAnnouncement(@CurrentUser() user: any, @Body() body: { title: string, message: string }) {
    return this.notificationsService.createAnnouncement(user.id, body.title, body.message);
  }

  @Get('unread-count')
  getUnreadCount(@CurrentUser() user: any) {
    return this.notificationsService.getUnreadCount(user.id);
  }

  @Patch(':id/read')
  markRead(@Param('id') notificationId: string, @CurrentUser() user: any) {
    return this.notificationsService.markAsRead(user.id, notificationId);
  }

  @Patch('mark-all-read')
  markAllRead(@CurrentUser() user: any) {
    return this.notificationsService.markAllAsRead(user.id);
  }
}

