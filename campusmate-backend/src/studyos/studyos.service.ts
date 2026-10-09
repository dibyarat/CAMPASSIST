import { Injectable, BadRequestException, Logger } from '@nestjs/common';
import { PrismaService } from '../common/prisma.service';
import { FirebaseAdminService } from '../common/firebase/firebase-admin.service';
import { CloudinaryService } from '../common/cloudinary/cloudinary.service';

@Injectable()
export class StudyosService {
  private readonly logger = new Logger(StudyosService.name);

  constructor(
    private prisma: PrismaService,
    private firebase: FirebaseAdminService,
    private cloudinary: CloudinaryService,
  ) {}

  // --- ACADEMIC RESOURCES ---

  async uploadAcademicResource(data: {
    title: string;
    type: string;
    subjectId?: string;
    fileReference: string;
    uploaderId: string;
  }) {
    const resource = await this.prisma.academicResource.create({ data });

    try {
      await this.firebase.firestore.collection('academic_resources').doc(resource.id).set({
        ...resource,
        createdAt: new Date().toISOString(),
      });
    } catch (err: any) {
      this.logger.warn(`Failed writing academic resource to Firestore: ${err?.message}`);
    }

    return resource;
  }

  async getAcademicResources(subjectId?: string) {
    try {
      let query: any = this.firebase.firestore.collection('academic_resources');
      if (subjectId) {
        query = query.where('subjectId', '==', subjectId);
      }
      const snap = await query.get();
      if (!snap.empty) {
        return snap.docs.map((doc: any) => doc.data());
      }
    } catch {}

    const where = subjectId ? { subjectId } : {};
    return this.prisma.academicResource.findMany({ where, orderBy: { createdAt: 'desc' } });
  }

  async getDownloadUrl(fileReference: string) {
    return { url: fileReference };
  }
}
