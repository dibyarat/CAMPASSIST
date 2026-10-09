import { Injectable, NotFoundException, Logger } from '@nestjs/common';
import { PrismaService } from '../common/prisma.service';
import { FirebaseAdminService } from '../common/firebase/firebase-admin.service';
import { CreateFeedbackDto, UpdateFeedbackStatusDto } from './dto/create-feedback.dto';

@Injectable()
export class FeedbackService {
  private readonly logger = new Logger(FeedbackService.name);

  constructor(
    private prisma: PrismaService,
    private firebase: FirebaseAdminService,
  ) {}

  async create(userId: string, createFeedbackDto: CreateFeedbackDto) {
    let userEmail = '';
    let fullName = '';

    // Fetch user details to denormalize in NoSQL document
    try {
      const userDoc = await this.firebase.firestore.collection('users').doc(userId).get();
      if (userDoc.exists) {
        const u = userDoc.data();
        userEmail = u?.email || '';
        fullName = u?.profile?.fullName || u?.fullName || '';
      } else {
        const pUser = await this.prisma.user.findUnique({
          where: { id: userId },
          include: { profile: true },
        });
        if (pUser) {
          userEmail = pUser.email;
          fullName = pUser.profile?.fullName || '';
        }
      }
    } catch {
      // Ignore lookup errors
    }

    try {
      const docRef = this.firebase.firestore.collection('feedbacks').doc();
      const feedbackData = {
        id: docRef.id,
        ...createFeedbackDto,
        userId,
        userEmail,
        userName: fullName,
        status: 'PENDING',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };

      await docRef.set(feedbackData);
      this.logger.log(`Feedback created in Firestore with ID: ${docRef.id}`);
      return feedbackData;
    } catch (err: any) {
      this.logger.warn(`Failed writing to Firestore, falling back to Prisma: ${err.message}`);
      return this.prisma.feedback.create({
        data: {
          ...createFeedbackDto,
          userId,
        },
      });
    }
  }

  async findAll() {
    try {
      const snapshot = await this.firebase.firestore
        .collection('feedbacks')
        .orderBy('createdAt', 'desc')
        .get();

      if (!snapshot.empty) {
        return snapshot.docs.map((doc) => {
          const data = doc.data();
          return {
            id: doc.id,
            ...data,
            user: {
              email: data.userEmail || 'Unknown',
              profile: {
                fullName: data.userName || 'Anonymous',
              },
            },
          };
        });
      }
    } catch (err: any) {
      this.logger.warn(`Failed reading from Firestore, falling back to Prisma: ${err.message}`);
    }

    // Fallback to Prisma
    return this.prisma.feedback.findMany({
      include: {
        user: {
          select: {
            email: true,
            profile: {
              select: {
                fullName: true,
              },
            },
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  async updateStatus(id: string, updateDto: UpdateFeedbackStatusDto) {
    try {
      const docRef = this.firebase.firestore.collection('feedbacks').doc(id);
      const doc = await docRef.get();

      if (doc.exists) {
        if (updateDto.status === 'RESOLVED') {
          await docRef.delete();
          return { deleted: true, id };
        }

        await docRef.update({
          status: updateDto.status,
          updatedAt: new Date().toISOString(),
        });

        const updatedDoc = await docRef.get();
        return updatedDoc.data();
      }
    } catch (err: any) {
      this.logger.warn(`Failed updating Firestore document, checking Prisma: ${err.message}`);
    }

    // Fallback to Prisma
    const feedback = await this.prisma.feedback.findUnique({ where: { id } });
    if (!feedback) {
      throw new NotFoundException('Feedback not found');
    }

    if (updateDto.status === 'RESOLVED') {
      await this.prisma.feedback.delete({ where: { id } });
      return { deleted: true, id };
    }

    return this.prisma.feedback.update({
      where: { id },
      data: { status: updateDto.status },
    });
  }
}
