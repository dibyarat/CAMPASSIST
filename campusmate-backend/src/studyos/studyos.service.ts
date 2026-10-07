import { Injectable, NotFoundException, ForbiddenException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../common/prisma.service';
import { createClient } from '@supabase/supabase-js';

@Injectable()
export class StudyosService {
  private supabase;

  constructor(private prisma: PrismaService) {
    // Required to generate signed URLs from Supabase Storage
    this.supabase = createClient(
      process.env.SUPABASE_URL || 'mock',
      process.env.SUPABASE_SERVICE_ROLE_KEY || 'mock'
    );
  }

  // --- ACADEMIC RESOURCES ---

  async uploadAcademicResource(data: { title: string; type: string; subjectId?: string; fileReference: string; uploaderId: string }) {
    return this.prisma.academicResource.create({ data });
  }

  async getAcademicResources(subjectId?: string) {
    const where = subjectId ? { subjectId } : {};
    return this.prisma.academicResource.findMany({ where, orderBy: { createdAt: 'desc' } });
  }

  async getDownloadUrl(fileReference: string) {
    const bucket = process.env.STORAGE_BUCKET || 'campusmate-assets';
    // Generate a secure signed URL valid for 60 seconds
    const { data, error } = await this.supabase.storage
      .from(bucket)
      .createSignedUrl(fileReference, 60);

    if (error || !data) throw new BadRequestException('Could not generate secure download link');
    
    return { url: data.signedUrl };
  }
}
