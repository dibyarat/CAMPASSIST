import { Body, Controller, Get, Param, Post, UseGuards } from '@nestjs/common';
import { OffersService } from './offers.service';
import { SupabaseAuthGuard } from '../common/guards/supabase-auth.guard';
import { RolesGuard } from '../common/guards/roles.guard';
import { Roles } from '../common/decorators/roles.decorator';
import { CurrentUser } from '../common/decorators/current-user.decorator';

@Controller('offers')
@UseGuards(SupabaseAuthGuard, RolesGuard)
export class OffersController {
  constructor(private readonly offersService: OffersService) {}

  @Get()
  list() { return this.offersService.list(); }

  @Post()
  @Roles('DEVELOPER')
  create(@CurrentUser() user: any, @Body() data: any) { return this.offersService.create(user.id, data); }

  @Post(':id/claim')
  @Roles('STUDENT', 'CR', 'DEVELOPER')
  claim(@Param('id') offerId: string, @CurrentUser() user: any) { return this.offersService.claim(offerId, user.id); }
}