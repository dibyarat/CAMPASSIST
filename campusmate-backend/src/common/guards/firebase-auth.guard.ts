import { Injectable, CanActivate, ExecutionContext, UnauthorizedException, Optional } from '@nestjs/common';
import { FirebaseAdminService } from '../firebase/firebase-admin.service';
import { PrismaService } from '../prisma.service';

@Injectable()
export class FirebaseAuthGuard implements CanActivate {
  constructor(
    private firebase: FirebaseAdminService,
    @Optional() private prisma?: PrismaService,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest();
    const authorization = request.headers.authorization;
    const token = authorization?.startsWith('Bearer ') ? authorization.slice(7) : undefined;

    if (!token) {
      throw new UnauthorizedException('Authentication token is missing');
    }

    let userId: string | null = null;
    let email: string | undefined = undefined;

    try {
      const decoded = await this.firebase.auth.verifyIdToken(token);
      userId = decoded.uid;
      email = decoded.email;
    } catch {
      throw new UnauthorizedException('Invalid or expired authentication token');
    }

    if (!userId) {
      throw new UnauthorizedException('Invalid or expired authentication token');
    }

    // Fetch user details from Firestore
    try {
      const userDoc = await this.firebase.firestore.collection('users').doc(userId).get();
      if (userDoc.exists) {
        request.user = { id: userId, ...userDoc.data() };
      } else if (email) {
        // If doc not stored with uid key, look up by email
        const snap = await this.firebase.firestore
          .collection('users')
          .where('email', '==', email)
          .limit(1)
          .get();
        if (!snap.empty) {
          const doc = snap.docs[0];
          request.user = { id: doc.id, ...doc.data() };
        }
      }
    } catch {}

    if (!request.user) {
      request.user = { id: userId, email };
    }

    // Fallback/enrichment with Prisma to ensure active crAssignment is always attached
    if (this.prisma) {
      try {
        const targetId = request.user.id || userId;
        const dbUser = await this.prisma.user.findUnique({
          where: { id: targetId },
          include: { crAssignment: { include: { section: true } } },
        });

        if (dbUser) {
          request.user.role = dbUser.role;
          if (dbUser.crAssignment && dbUser.crAssignment.isActive) {
            request.user.crAssignment = dbUser.crAssignment;
          }
        }
      } catch {}
    }

    return true;
  }
}

// Export SupabaseAuthGuard alias for backwards compatibility
@Injectable()
export class SupabaseAuthGuard extends FirebaseAuthGuard {}

