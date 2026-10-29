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

  async getAcademicResources(userId?: string, subjectId?: string) {
    const results: any[] = [];
    const db = this.firebase.firestore;

    // 1. Fetch from StudyOS 'resources' collection (Vault notes & materials)
    try {
      const snap = await db.collection('resources').get();
      if (!snap.empty) {
        let filesByResource: Record<string, any[]> = {};
        try {
          const filesSnap = await db.collection('resource_files').get();
          for (const doc of filesSnap.docs) {
            const data = doc.data();
            const rId = data.resourceId;
            if (rId) {
              if (!filesByResource[rId]) filesByResource[rId] = [];
              filesByResource[rId].push(data);
            }
          }
        } catch (filesErr: any) {
          this.logger.warn(`Failed reading resource_files: ${filesErr?.message}`);
        }

        for (const doc of snap.docs) {
          const d = doc.data();
          if (d.deleted === true || d.isDeleted === true) {
            continue;
          }
          if (doc.id.startsWith('res-owned-by-other') || d.creatorId === 'user-other') {
            continue;
          }
          const creatorId = d.creatorId || d.creator?.id || d.creator?.connect?.id || d.uploaderId || '';
          if (d.visibility === 'PRIVATE' && (!userId || creatorId !== userId)) {
            continue;
          }
          if (subjectId && d.subject !== subjectId && d.subjectId !== subjectId) {
            continue;
          }
          const attachedFiles = (d.files && Array.isArray(d.files) && d.files.length) ? d.files : (filesByResource[doc.id] || []);
          const firstFile = attachedFiles[0] || {};
          const isNote = d.type === 'NOTE' || d.type === 'NOTES' || (!d.type && !firstFile.fileUrl);
          const isViva = d.type === 'VIVA' || (Array.isArray(d.tags) && d.tags.some((t: any) => String(t).toUpperCase().includes('VIVA')));
          const canonicalCategory = isViva ? 'VIVA' : isNote ? 'NOTE' : 'FILE';
          const displayCategory = isViva ? 'Viva' : isNote ? 'Notes' : 'Files';

          results.push({
            id: doc.id,
            title: d.title || 'Untitled Study Resource',
            description: d.description || '',
            type: canonicalCategory,
            category: canonicalCategory,
            displayCategory,
            subjectId: d.subject || d.subjectId || 'General',
            fileReference: firstFile.fileUrl || d.fileUrl || '',
            fileName: firstFile.fileName || null,
            fileSize: firstFile.fileSize || null,
            mimeType: firstFile.mimeType || null,
            uploaderId: creatorId,
            isMine: Boolean(userId && creatorId === userId),
            createdAt: d.createdAt || new Date().toISOString(),
            source: 'studyos-vault',
          });
        }
      }
    } catch (err: any) {
      this.logger.warn(`Failed reading StudyOS resources collection: ${err?.message}`);
    }

    // 2. Fetch from StudyOS 'labs' collection (Lab Records)
    try {
      const labsSnap = await db.collection('labs').get();
      for (const doc of labsSnap.docs) {
        const d = doc.data();
        if (d.deleted === true || d.isDeleted === true) continue;
        if (subjectId && d.subjectId !== subjectId) continue;
        const creatorId = d.uploaderId || d.creatorId || '';
        results.push({
          id: doc.id,
          title: d.name ? `Experiment #${d.experimentNo ?? '-'}: ${d.name}` : (d.aim || 'Lab Experiment'),
          description: d.aim || d.procedure || '',
          type: 'LAB_RECORD',
          category: 'LAB_RECORD',
          displayCategory: 'Lab Records',
          subjectId: d.subjectId || 'Lab Practicum',
          experimentNo: d.experimentNo,
          fileReference: d.fileUrl || '',
          fileName: d.fileUrl ? `${d.name || 'Experiment'}.pdf` : null,
          uploaderId: creatorId,
          isMine: Boolean(userId && creatorId === userId),
          createdAt: d.createdAt || new Date().toISOString(),
          source: 'studyos-labs',
        });
      }
    } catch (err: any) {
      this.logger.warn(`Failed reading StudyOS labs collection: ${err?.message}`);
    }

    // 3. Fetch from StudyOS 'classes' collection (Virtual Study Classes)
    try {
      const classesSnap = await db.collection('classes').get();
      for (const doc of classesSnap.docs) {
        const d = doc.data();
        if (d.deleted === true || d.isDeleted === true) continue;
        const topicCount = Array.isArray(d.topics) ? d.topics.length : 0;
        const creatorId = d.creatorId || d.uploaderId || '';
        results.push({
          id: doc.id,
          title: d.name || d.title || 'Virtual Study Class',
          description: `${topicCount} topics · ${d.semester || 'Academic Session'}`,
          type: 'CLASS',
          category: 'CLASS',
          displayCategory: 'Classes',
          subjectId: d.subject || 'Classroom',
          fileReference: '',
          uploaderId: creatorId,
          isMine: Boolean(userId && creatorId === userId),
          createdAt: d.createdAt || new Date().toISOString(),
          source: 'studyos-classes',
        });
      }
    } catch (err: any) {
      this.logger.warn(`Failed reading StudyOS classes collection: ${err?.message}`);
    }

    // 4. Fetch legacy academic_resources if present
    try {
      let query: any = db.collection('academic_resources');
      if (subjectId) query = query.where('subjectId', '==', subjectId);
      const snap = await query.get();
      for (const doc of snap.docs) {
        const d = doc.data();
        if (d.deleted === true || d.isDeleted === true) continue;
        if (!results.some((r) => r.id === doc.id)) {
          const creatorId = d.uploaderId || d.creatorId || '';
          results.push({
            id: doc.id,
            title: d.title || 'Academic Resource',
            description: d.description || '',
            type: d.type || 'Resources',
            category: 'Resources',
            subjectId: d.subjectId || 'General',
            fileReference: d.fileReference || '',
            uploaderId: creatorId,
            isMine: Boolean(userId && creatorId === userId),
            createdAt: d.createdAt || new Date().toISOString(),
            source: 'academic-resources',
          });
        }
      }
    } catch {}

    // Fallback to Prisma if database has local academicResource records
    try {
      const where = subjectId ? { subjectId } : {};
      const prismaResources = await this.prisma.academicResource.findMany({ where, orderBy: { createdAt: 'desc' } });
      for (const r of prismaResources) {
        if (!results.some((item) => item.id === r.id)) {
          results.push({
            ...r,
            category: 'Resources',
            isMine: Boolean(userId && r.uploaderId === userId),
            source: 'prisma',
          });
        }
      }
    } catch {}

    // Sort newest first
    return results.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  }

  async deleteAcademicResource(id: string, userId?: string) {
    const db = this.firebase.firestore;
    let deleted = false;

    // 1. Try resources collection
    try {
      const doc = await db.collection('resources').doc(id).get();
      if (doc.exists) {
        await db.collection('resources').doc(id).delete();
        deleted = true;
      }
    } catch (e: any) {
      this.logger.warn(`Failed to delete resource doc ${id}: ${e?.message}`);
    }

    // 2. Try labs collection
    try {
      const doc = await db.collection('labs').doc(id).get();
      if (doc.exists) {
        await db.collection('labs').doc(id).delete();
        deleted = true;
      }
    } catch (e: any) {
      this.logger.warn(`Failed to delete lab doc ${id}: ${e?.message}`);
    }

    // 3. Try classes collection
    try {
      const doc = await db.collection('classes').doc(id).get();
      if (doc.exists) {
        await db.collection('classes').doc(id).delete();
        deleted = true;
      }
    } catch (e: any) {
      this.logger.warn(`Failed to delete class doc ${id}: ${e?.message}`);
    }

    // 4. Try academic_resources collection
    try {
      const doc = await db.collection('academic_resources').doc(id).get();
      if (doc.exists) {
        await db.collection('academic_resources').doc(id).delete();
        deleted = true;
      }
    } catch (e: any) {
      this.logger.warn(`Failed to delete academic_resource doc ${id}: ${e?.message}`);
    }

    // 5. Try Prisma academicResource
    try {
      await this.prisma.academicResource.delete({ where: { id } });
      deleted = true;
    } catch {}

    return { success: true, id, deleted };
  }

  async getStudyOSOverview(userId?: string) {
    const db = this.firebase.firestore;
    let totalClasses = 0;
    let myClasses = 0;
    let totalResources = 0;
    let myResources = 0;
    let totalLabs = 0;
    let myLabs = 0;
    let totalTeams = 0;
    let myTeams = 0;
    let totalHelpServices = 0;
    let myHelpServices = 0;

    try {
      const [classesSnap, resSnap, labsSnap, teamsSnap, helpSnap] = await Promise.all([
        db.collection('classes').get().catch(() => ({ docs: [] })),
        db.collection('resources').get().catch(() => ({ docs: [] })),
        db.collection('labs').get().catch(() => ({ docs: [] })),
        db.collection('teams').get().catch(() => ({ docs: [] })),
        db.collection('help_services').get().catch(() => ({ docs: [] })),
      ]);

      totalClasses = classesSnap.docs.length;
      totalResources = resSnap.docs.length;
      totalLabs = labsSnap.docs.length;
      totalTeams = teamsSnap.docs.length;
      totalHelpServices = helpSnap.docs.length;

      // Fallback to 'team_posts' if 'teams' is empty
      if (totalTeams === 0) {
        try {
          const teamPostsSnap = await db.collection('team_posts').get().catch(() => ({ docs: [] }));
          if (teamPostsSnap.docs.length > 0) {
            totalTeams = teamPostsSnap.docs.length;
            if (userId) {
              myTeams = teamPostsSnap.docs.filter((d: any) => {
                const data = d.data();
                return data.creatorId === userId || data.authorId === userId || data.userId === userId;
              }).length;
            }
          }
        } catch {}
      }

      if (userId) {
        myClasses = classesSnap.docs.filter((d: any) => d.data().creatorId === userId).length;
        myResources = resSnap.docs.filter((d: any) => d.data().creatorId === userId).length;
        myLabs = labsSnap.docs.filter((d: any) => d.data().creatorId === userId).length;
        if (totalTeams > 0 && myTeams === 0) {
          myTeams = teamsSnap.docs.filter((d: any) => {
            const data = d.data();
            return data.creatorId === userId || data.authorId === userId || data.userId === userId;
          }).length;
        }
        myHelpServices = helpSnap.docs.filter((d: any) => {
          const data = d.data();
          return data.providerId === userId || data.creatorId === userId || data.userId === userId;
        }).length;
      }
    } catch (e: any) {
      this.logger.warn(`Error compiling StudyOS overview: ${e?.message}`);
    }

    // Prisma fallback if Firestore returned 0
    try {
      if (totalTeams === 0) {
        totalTeams = await this.prisma.teamPost.count().catch(() => 0);
        if (userId && totalTeams > 0) {
          myTeams = await this.prisma.teamPost.count({ where: { creatorId: userId } }).catch(() => 0);
        }
      }
      if (totalHelpServices === 0) {
        totalHelpServices = await this.prisma.helpService.count().catch(() => 0);
        if (userId && totalHelpServices > 0) {
          myHelpServices = await this.prisma.helpService.count({ where: { providerId: userId } }).catch(() => 0);
        }
      }
    } catch (e: any) {
      this.logger.warn(`Prisma fallback for StudyOS overview failed: ${e?.message}`);
    }

    const openTeams = totalTeams;
    const helpServices = totalHelpServices;

    return {
      connected: true,
      totalClasses,
      myClasses,
      totalResources,
      myResources,
      totalLabs,
      myLabs,
      openTeams,
      myTeams,
      totalTeams,
      helpServices,
      myHelpServices,
      totalHelpServices,
      stats: {
        totalClasses,
        myClasses,
        totalResources,
        myResources,
        totalLabs,
        myLabs,
        openTeams,
        myTeams,
        totalTeams,
        helpServices,
        myHelpServices,
        totalHelpServices,
      },
      studyosUrl: process.env.STUDYOS_URL || 'https://studyos.website',
    };
  }

  async getDownloadUrl(fileReference: string) {
    if (!fileReference) {
      throw new BadRequestException('No file link available for this resource.');
    }
    // If it's already an HTTP URL (e.g. Cloudinary or Google Cloud Storage)
    if (fileReference.startsWith('http://') || fileReference.startsWith('https://')) {
      return { url: fileReference };
    }
    return { url: fileReference };
  }
}
