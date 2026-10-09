import { Injectable, CanActivate, ExecutionContext, UnauthorizedException } from '@nestjs/common';
import { PrismaService } from '../prisma.service';
import { FirebaseAdminService } from '../firebase/firebase-admin.service';
import { createClient } from '@supabase/supabase-js';

@Injectable()
export class SupabaseAuthGuard implements CanActivate {
  private supabase;

  constructor(
    private prisma: PrismaService,
    private firebase: FirebaseAdminService,
  ) {
    this.supabase = createClient(
      process.env.SUPABASE_URL || 'mock-url',
      process.env.SUPABASE_SERVICE_ROLE_KEY || 'mock-key',
    );
  }

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest();
    const authorization = request.headers.authorization;
    const token = authorization?.startsWith('Bearer ') ? authorization.slice(7) : undefined;

    if (!token) {
      throw new UnauthorizedException('Authentication token is missing');
    }

    let userId: string | null = null;
    let email: string | undefined = undefined;

    // 1. Try Firebase Auth verification first
    try {
      const decoded = await this.firebase.auth.verifyIdToken(token);
      userId = decoded.uid;
      email = decoded.email;
    } catch {
      // 2. Fallback to Supabase Auth verification
      try {
        const { data: { user }, error } = await this.supabase.auth.getUser(token);
        if (!error && user) {
          userId = user.id;
          email = user.email;
        }
      } catch {
        // Ignored, handled below
      }
    }

    if (!userId) {
      throw new UnauthorizedException('Invalid or expired authentication token');
    }

    // Try finding user in Prisma
    let dbUser = await this.prisma.user.findUnique({
      where: { id: userId },
      include: {
        profile: true,
        student: true,
        crAssignment: true,
      },
    });

    // If not found by ID (e.g. Firebase UID differs from Supabase UUID), try by email
    if (!dbUser && email) {
      dbUser = await this.prisma.user.findUnique({
        where: { email },
        include: {
          profile: true,
          student: true,
          crAssignment: true,
        },
      });
    }

    // Also check Firestore users collection if user wasn't in Prisma
    if (!dbUser) {
      try {
        const userDoc = await this.firebase.firestore.collection('users').doc(userId).get();
        if (userDoc.exists) {
          request.user = { id: userId, ...userDoc.data() };
          return true;
        }
      } catch {
        // Firestore may not be connected yet
      }
    }

    if (!dbUser) {
      request.user = { id: userId, email };
      return true;
    }

    request.user = dbUser;
    return true;
  }
}

// Export FirebaseAuthGuard alias for future migration
@Injectable()
export class FirebaseAuthGuard extends SupabaseAuthGuard {}
