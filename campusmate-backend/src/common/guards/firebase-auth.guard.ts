import { Injectable, CanActivate, ExecutionContext, UnauthorizedException } from '@nestjs/common';
import { FirebaseAdminService } from '../firebase/firebase-admin.service';

@Injectable()
export class FirebaseAuthGuard implements CanActivate {
  constructor(
    private firebase: FirebaseAdminService,
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
        return true;
      }

      // If doc not stored with uid key, look up by email
      if (email) {
        const snap = await this.firebase.firestore
          .collection('users')
          .where('email', '==', email)
          .limit(1)
          .get();
        if (!snap.empty) {
          const doc = snap.docs[0];
          request.user = { id: doc.id, ...doc.data() };
          return true;
        }
      }
    } catch {}

    request.user = { id: userId, email };
    return true;
  }
}

// Export SupabaseAuthGuard alias for backwards compatibility
@Injectable()
export class SupabaseAuthGuard extends FirebaseAuthGuard {}

