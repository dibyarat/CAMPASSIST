import { Controller, Get, Post, Body, Param, Patch, UseGuards } from '@nestjs/common';
import { MapService } from './map.service';
import { FirebaseAuthGuard } from '../common/guards/firebase-auth.guard';
import { RolesGuard } from '../common/guards/roles.guard';
import { Roles } from '../common/decorators/roles.decorator';
import { CurrentUser } from '../common/decorators/current-user.decorator';

@Controller('map')
@UseGuards(FirebaseAuthGuard, RolesGuard)
export class MapController {
  constructor(private readonly mapService: MapService) {}

  @Get()
  // All authenticated users can see approved map locations
  getLocations() {
    return this.mapService.getApprovedLocations();
  }

  @Get('moderation')
  @Roles('DEVELOPER')
  getModerationQueue() {
    return this.mapService.getModerationQueue();
  }

  @Post('submit')
  @Roles('STUDENT', 'CR', 'DEVELOPER')
  submitLocation(@Body() data: any, @CurrentUser() user: any) {
    return this.mapService.submitLocation(user.id, data);
  }

  @Patch(':id/moderate')
  @Roles('DEVELOPER') // Strict Developer-only moderation
  moderateLocation(@Param('id') locationId: string, @Body('status') status: 'APPROVED' | 'REJECTED' | 'HIDDEN') {
    return this.mapService.moderateLocation(locationId, status);
  }
}

