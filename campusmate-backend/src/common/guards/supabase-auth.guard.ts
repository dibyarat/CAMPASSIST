import { Injectable, CanActivate, ExecutionContext, UnauthorizedException } from '@nestjs/common';
import { PrismaService } from '../prisma.service';
import { createClient } from '@supabase/supabase-js';

@Injectable()
export class SupabaseAuthGuard implements CanActivate {
  private supabase;

  constructor(private prisma: PrismaService) {
    this.supabase = createClient(
      process.env.SUPABASE_URL || 'mock-url',
      process.env.SUPABASE_SERVICE_ROLE_KEY || 'mock-key'
    );
  }

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest();
    const token = request.headers.authorization?.split('Bearer ')[1];
    
    if (!token) {
      throw new UnauthorizedException('Authentication token is missing');
    }
    
    // Verify JWT against Supabase Auth
    const { data: { user }, error } = await this.supabase.auth.getUser(token);
    
    if (error || !user) {
      throw new UnauthorizedException('Invalid or expired authentication token');
    }
    
    // Fetch the actual CampusMate role from DB, never trust frontend claims
    const dbUser = await this.prisma.user.findUnique({
      where: { id: user.id },
      include: { crAssignment: true }
    });
    
    if (!dbUser) { request.user = { id: user.id }; return true; }
    
    // Attach the fully populated user to the request
    request.user = dbUser;
    
    return true;
  }
}

