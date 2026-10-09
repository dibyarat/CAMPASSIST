import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import { initializeApp, getApps, getApp, cert, App } from 'firebase-admin/app';
import { getAuth, Auth } from 'firebase-admin/auth';
import { getFirestore, Firestore } from 'firebase-admin/firestore';
import { getStorage, Storage } from 'firebase-admin/storage';
import * as fs from 'fs';

@Injectable()
export class FirebaseAdminService implements OnModuleInit {
  private readonly logger = new Logger(FirebaseAdminService.name);
  private app: App;

  onModuleInit() {
    this.initFirebase();
  }

  private initFirebase() {
    const apps = getApps();
    if (apps.length > 0) {
      this.app = apps[0]!;
      return;
    }

    try {
      const serviceAccountKeyJson = process.env.FIREBASE_SERVICE_ACCOUNT_KEY;
      const serviceAccountPath = process.env.FIREBASE_SERVICE_ACCOUNT_PATH;

      if (serviceAccountKeyJson) {
        const credentials = JSON.parse(serviceAccountKeyJson);
        this.app = initializeApp({
          credential: cert(credentials),
          storageBucket: process.env.FIREBASE_STORAGE_BUCKET,
        });
        this.logger.log('Firebase Admin initialized with FIREBASE_SERVICE_ACCOUNT_KEY JSON string.');
      } else if (serviceAccountPath && fs.existsSync(serviceAccountPath)) {
        const credentials = JSON.parse(fs.readFileSync(serviceAccountPath, 'utf8'));
        this.app = initializeApp({
          credential: cert(credentials),
          storageBucket: process.env.FIREBASE_STORAGE_BUCKET,
        });
        this.logger.log(`Firebase Admin initialized with service account from: ${serviceAccountPath}`);
      } else if (process.env.FIREBASE_PROJECT_ID && process.env.FIREBASE_CLIENT_EMAIL && process.env.FIREBASE_PRIVATE_KEY) {
        this.app = initializeApp({
          credential: cert({
            projectId: process.env.FIREBASE_PROJECT_ID,
            clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
            privateKey: process.env.FIREBASE_PRIVATE_KEY.replace(/\\n/g, '\n'),
          }),
          storageBucket: process.env.FIREBASE_STORAGE_BUCKET,
        });
        this.logger.log('Firebase Admin initialized with individual FIREBASE_* env variables.');
      } else {
        this.logger.warn(
          'No Firebase Service Account credentials found. Falling back to default app initialization.',
        );
        this.app = initializeApp({
          projectId: process.env.FIREBASE_PROJECT_ID || 'campassist-dev',
          storageBucket: process.env.FIREBASE_STORAGE_BUCKET,
        });
      }
    } catch (error) {
      this.logger.error('Failed to initialize Firebase Admin SDK:', error);
      const apps = getApps();
      if (apps.length === 0) {
        this.app = initializeApp({
          projectId: 'campassist-dev',
        });
      } else {
        this.app = apps[0]!;
      }
    }
  }

  get auth(): Auth {
    return getAuth(this.app);
  }

  get firestore(): Firestore {
    return getFirestore(this.app);
  }

  get storage(): Storage {
    return getStorage(this.app);
  }
}

