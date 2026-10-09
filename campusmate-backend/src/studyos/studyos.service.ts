import { Injectable, BadRequestException, Logger } from '@nestjs/common';
import { PrismaService } from '../common/prisma.service';
import { FirebaseAdminService } from '../common/firebase/firebase-admin.service';
import { CloudinaryService } from '../common/cloudinary/cloudinary.service';
import { createClient } from '@supabase/supabase-js';

@Injectable()
export class StudyosService {
  private readonly logger = new Logger(StudyosService.name);
  private supabase;

  constructor(
    private prisma: PrismaService,
    private firebase: FirebaseAdminService,
    private cloudinary: CloudinaryService,
  ) {
    this.supabase = createClient(
      process.env.SUPABASE_URL || 'mock',
      process.env.SUPABASE_SERVICE_ROLE_KEY || 'mock',
    );
  }

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
    // If stored in Cloudinary directly, return secure URL
    if (fileReference.startsWith('http://') || fileReference.startsWith('https://')) {
      return { url: fileReference };
    }

    // Supabase fallback
    const bucket = process.env.STORAGE_BUCKET || 'campusmate-assets';
    const { data, error } = await this.supabase.storage.from(bucket).createSignedUrl(fileReference, 60);

    if (error || !data) {
      // Return direct fileReference if signed URL generation fails
      return { url: fileReference };
    }

    return { url: data.signedUrl };
  }
}
