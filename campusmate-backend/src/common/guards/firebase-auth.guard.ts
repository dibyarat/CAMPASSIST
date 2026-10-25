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
    // Also auto-provision user in Prisma if verified in Firebase but missing from DB
    if (this.prisma) {
      try {
        const targetId = request.user.id || userId;
        let dbUser = await this.prisma.user.findUnique({
          where: { id: targetId },
          include: { crAssignment: { include: { section: true } } },
        });

        // Auto-provision if user exists in Firebase Auth / Firestore but not yet in PostgreSQL
        if (!dbUser && email) {
          try {
            const rawName = request.user.name || request.user.fullName || (request.user.profile && request.user.profile.fullName) || email.split('@')[0];
            const rollMatch = email.match(/^(\d{8,16})@/);
            const rollNumber = rollMatch ? rollMatch[1] : null;

            // Find default institution (CUTM or first) and section
            const institution = await this.prisma.institution.findFirst({
              where: { code: 'CUTM' },
            }) || await this.prisma.institution.findFirst();

            const section = await this.prisma.section.findFirst({
              where: {
                ...(institution ? { institutionId: institution.id } : {}),
                name: { equals: 'CT-A', mode: 'insensitive' },
              },
            }) || await this.prisma.section.findFirst({
              where: institution ? { institutionId: institution.id } : {},
            }) || await this.prisma.section.findFirst();

            dbUser = await this.prisma.user.upsert({
              where: { id: targetId },
              update: { email },
              create: {
                id: targetId,
                email,
                role: (request.user.role as any) || 'STUDENT',
                institutionId: institution?.id || null,
              },
              include: { crAssignment: { include: { section: true } } },
            });

            const student = await this.prisma.student.upsert({
              where: { userId: targetId },
              update: { sectionId: section?.id || null },
              create: {
                userId: targetId,
                sectionId: section?.id || null,
              },
            });

            await this.prisma.profile.upsert({
              where: { userId: targetId },
              update: {
                fullName: rawName,
                rollNumber,
                section: section?.name || null,
              },
              create: {
                userId: targetId,
                studentId: student.id,
                fullName: rawName,
                rollNumber,
                section: section?.name || null,
                studentType: 'DAY_SCHOLAR',
              },
            });
          } catch (provisionErr) {
            console.warn('Auto-provisioning user in PostgreSQL failed:', provisionErr);
          }
        }

        if (dbUser) {
          request.user.role = dbUser.role;
          if (dbUser.crAssignment && dbUser.crAssignment.isActive) {
            request.user.crAssignment = dbUser.crAssignment;
          }
        } else if (!request.user.role) {
          request.user.role = 'STUDENT';
        }
      } catch {}
    }

    return true;
  }
}

// Export SupabaseAuthGuard alias for backwards compatibility
@Injectable()
export class SupabaseAuthGuard extends FirebaseAuthGuard {}

