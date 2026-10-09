import { Injectable } from '@nestjs/common';
import { FirebaseAdminService } from '../common/firebase/firebase-admin.service';

@Injectable()
export class AcademicTermsService {
  constructor(private firebase: FirebaseAdminService) {}

  async getCurrent() {
    try {
      const snap = await this.firebase.firestore.collection('academic_terms').where('isCurrent', '==', true).limit(1).get();
      if (!snap.empty) {
        return { id: snap.docs[0].id, ...snap.docs[0].data() };
      }
      const anySnap = await this.firebase.firestore.collection('academic_terms').limit(1).get();
      if (!anySnap.empty) {
        return { id: anySnap.docs[0].id, ...anySnap.docs[0].data() };
      }
    } catch {}

    return {
      id: 'default-term',
      name: 'Spring 2026',
      isCurrent: true,
      startDate: new Date().toISOString(),
      endDate: new Date(Date.now() + 180 * 24 * 60 * 60 * 1000).toISOString(),
    };
  }
}