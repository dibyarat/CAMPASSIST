import { PrismaClient } from '@prisma/client';
import { initializeApp, cert } from 'firebase-admin/app';
import { getFirestore } from 'firebase-admin/firestore';
import { getAuth } from 'firebase-admin/auth';
import * as fs from 'fs';
import * as path from 'path';
import dotenv from 'dotenv';

// Load .env
dotenv.config();

const serviceAccountPath = process.env.FIREBASE_SERVICE_ACCOUNT_PATH || './serviceAccountKey.json';
if (!fs.existsSync(serviceAccountPath)) {
  console.error(`❌ Service account key not found at: ${serviceAccountPath}`);
  process.exit(1);
}

const serviceAccount = JSON.parse(fs.readFileSync(serviceAccountPath, 'utf8'));
const app = initializeApp({ credential: cert(serviceAccount) });
const db = getFirestore(app);
const auth = getAuth(app);
const prisma = new PrismaClient();

async function batchCommit(collectionName, items, idKey = 'id') {
  if (!items || items.length === 0) return 0;
  
  const batchSize = 400;
  let count = 0;
  
  for (let i = 0; i < items.length; i += batchSize) {
    const chunk = items.slice(i, i + batchSize);
    const batch = db.batch();
    
    for (const item of chunk) {
      const docId = String(item[idKey]);
      const ref = db.collection(collectionName).doc(docId);
      
      // Clean undefined and format dates
      const serialized = JSON.parse(JSON.stringify(item, (key, value) => {
        if (value instanceof Date) return value.toISOString();
        return value;
      }));
      
      batch.set(ref, serialized, { merge: true });
    }
    
    await batch.commit();
    count += chunk.length;
  }
  
  return count;
}

async function migrate() {
  console.log('🚀 Starting Data Migration: Supabase PostgreSQL ➔ Firebase Firestore...\n');

  try {
    // 1. Users & Profiles
    console.log('📦 Migrating Users and Profiles...');
    const users = await prisma.user.findMany({
      include: {
        profile: true,
        student: { include: { section: true } },
        crAssignment: { include: { section: true } },
        Institution: true,
      },
    });
    
    // Also sync users into Firebase Authentication if they have passwords or emails
    for (const u of users) {
      if (u.email) {
        try {
          await auth.getUserByEmail(u.email);
        } catch (e) {
          if (e.code === 'auth/user-not-found') {
            try {
              await auth.createUser({
                uid: u.id,
                email: u.email,
                displayName: u.profile?.fullName || undefined,
              });
              console.log(`  ➕ Provisioned Firebase Auth user: ${u.email}`);
            } catch (err) {
              // Ignore uid collision or format issues
            }
          }
        }
      }
    }

    const migratedUsers = await batchCommit('users', users, 'id');
    console.log(`  ✅ Migrated ${migratedUsers} users to Firestore 'users' collection.\n`);

    // 2. Institutions
    console.log('📦 Migrating Institutions...');
    const institutions = await prisma.institution.findMany();
    const migratedInst = await batchCommit('institutions', institutions, 'id');
    console.log(`  ✅ Migrated ${migratedInst} institutions.\n`);

    // 3. Departments & Sections
    console.log('📦 Migrating Departments and Sections...');
    const departments = await prisma.department.findMany();
    await batchCommit('departments', departments, 'id');
    const sections = await prisma.section.findMany({ include: { department: true } });
    const migratedSections = await batchCommit('sections', sections, 'id');
    console.log(`  ✅ Migrated ${migratedSections} sections and ${departments.length} departments.\n`);

    // 4. Subjects
    console.log('📦 Migrating Subjects...');
    const subjects = await prisma.subject.findMany();
    const migratedSubjects = await batchCommit('subjects', subjects, 'id');
    console.log(`  ✅ Migrated ${migratedSubjects} subjects.\n`);

    // 5. Timetable & Rooms
    console.log('📦 Migrating Timetable Entries and Rooms...');
    const rooms = await prisma.room.findMany();
    await batchCommit('rooms', rooms, 'id');
    const timetable = await prisma.timetableEntry.findMany();
    const migratedTimetable = await batchCommit('timetable', timetable, 'id');
    console.log(`  ✅ Migrated ${migratedTimetable} timetable entries and ${rooms.length} rooms.\n`);

    // 6. Attendance Records
    console.log('📦 Migrating Attendance Records...');
    const attendance = await prisma.attendanceRecord.findMany();
    const migratedAttendance = await batchCommit('attendance_records', attendance, 'id');
    console.log(`  ✅ Migrated ${migratedAttendance} attendance records.\n`);

    // 7. Feedback
    console.log('📦 Migrating Feedbacks...');
    const feedbacks = await prisma.feedback.findMany();
    const migratedFeedbacks = await batchCommit('feedbacks', feedbacks, 'id');
    console.log(`  ✅ Migrated ${migratedFeedbacks} feedbacks.\n`);

    // 8. Notifications
    console.log('📦 Migrating Notifications...');
    const notifications = await prisma.notification.findMany();
    const migratedNotifications = await batchCommit('notifications', notifications, 'id');
    console.log(`  ✅ Migrated ${migratedNotifications} notifications.\n`);

    // 9. Exams & Grades
    console.log('📦 Migrating Exams, Grades, and Submissions...');
    const exams = await prisma.exam.findMany();
    await batchCommit('exams', exams, 'id');
    const grades = await prisma.grade.findMany();
    await batchCommit('grades', grades, 'id');
    const submissions = await prisma.submission.findMany();
    await batchCommit('submissions', submissions, 'id');
    console.log(`  ✅ Migrated ${exams.length} exams, ${grades.length} grades, and ${submissions.length} submissions.\n`);

    console.log('🎉 Full Migration to Cloud Firestore Completed Successfully!');
  } catch (error) {
    console.error('❌ Migration failed:', error);
  } finally {
    await prisma.$disconnect();
  }
}

migrate();

