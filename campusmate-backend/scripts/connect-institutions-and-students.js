const { PrismaClient } = require('@prisma/client');
const { cert, initializeApp } = require('firebase-admin/app');
const { getFirestore } = require('firebase-admin/firestore');
const path = require('path');
const fs = require('fs');

async function main() {
  const prisma = new PrismaClient();

  const saPath = path.join(__dirname, '..', 'serviceAccountKey.json');
  let firestore = null;
  if (fs.existsSync(saPath)) {
    const sa = JSON.parse(fs.readFileSync(saPath, 'utf8'));
    const app = initializeApp({ credential: cert(sa) });
    firestore = getFirestore(app);
  }

  console.log('=== 1. FINDING MAIN INSTITUTION ===');
  let inst = await prisma.institution.findFirst({
    where: { code: 'CUTM' }
  });
  if (!inst) {
    inst = await prisma.institution.findFirst();
  }
  if (!inst) {
    console.log('Creating default institution CUTM...');
    inst = await prisma.institution.create({
      data: {
        name: 'Centurion University of Technology and Management',
        code: 'CUTM'
      }
    });
  }
  console.log(`Using Institution: ${inst.name} (${inst.code}) [${inst.id}]`);

  console.log('\n=== 2. CONNECTING ALL SECTIONS TO INSTITUTION ===');
  const sectionsUpdated = await prisma.section.updateMany({
    where: {
      OR: [
        { institutionId: null },
        { institutionId: { not: inst.id } }
      ]
    },
    data: {
      institutionId: inst.id
    }
  });
  console.log(`Updated ${sectionsUpdated.count} sections with institutionId = ${inst.id}`);

  const allSections = await prisma.section.findMany({
    include: { department: true, semester: true }
  });
  const secMap = new Map();
  allSections.forEach(s => {
    secMap.set(s.name.toLowerCase().trim(), s);
    console.log(`Section: "${s.name}" (ID: ${s.id}, Dept: ${s.department?.name}, Sem: ${s.semester?.name})`);
  });

  const secA = secMap.get('section a') || allSections[0];
  const secB = secMap.get('section b') || allSections[1] || allSections[0];
  const secCTA = secMap.get('ct-a') || allSections[2] || allSections[0];

  console.log('\n=== 3. CONNECTING ALL USERS & STUDENTS TO INSTITUTION & SECTIONS ===');
  const users = await prisma.user.findMany({
    include: { profile: true, student: true, crAssignment: true }
  });

  for (const user of users) {
    console.log(`\nProcessing user: ${user.email} (${user.role})`);

    // Ensure user has institutionId
    if (!user.institutionId) {
      await prisma.user.update({
        where: { id: user.id },
        data: { institutionId: inst.id }
      });
      console.log(`  -> Linked user to institution ${inst.code}`);
    }

    // Determine appropriate section
    let targetSectionId = null;
    const profSec = (user.profile?.section || '').toLowerCase().trim();

    if (profSec.includes('section b') || profSec === 'b') {
      targetSectionId = secB ? secB.id : null;
    } else if (profSec.includes('ct-a')) {
      targetSectionId = secCTA ? secCTA.id : null;
    } else if (user.crAssignment?.sectionId) {
      targetSectionId = user.crAssignment.sectionId;
    } else if (profSec.includes('section a') || profSec.includes('cs-a') || profSec === 'a') {
      targetSectionId = secA ? secA.id : null;
    } else {
      // Default to section A if student
      targetSectionId = secA ? secA.id : null;
    }

    // Ensure student record exists
    if (!user.student) {
      const newStudent = await prisma.student.create({
        data: {
          userId: user.id,
          sectionId: targetSectionId
        }
      });
      console.log(`  -> Created student record (${newStudent.id}) linked to section ${targetSectionId}`);
    } else if (user.student.sectionId !== targetSectionId && targetSectionId) {
      await prisma.student.update({
        where: { id: user.student.id },
        data: { sectionId: targetSectionId }
      });
      console.log(`  -> Updated student.sectionId to ${targetSectionId}`);
    }

    // Ensure profile exists and has section name matching
    const matchedSection = allSections.find(s => s.id === targetSectionId);
    if (!user.profile) {
      const studentRecord = await prisma.student.findUnique({ where: { userId: user.id } });
      await prisma.profile.create({
        data: {
          userId: user.id,
          studentId: studentRecord.id,
          fullName: user.name || user.email.split('@')[0],
          section: matchedSection ? matchedSection.name : 'Section A',
          rollNumber: `CUTM${Math.floor(1000 + Math.random() * 9000)}`,
        }
      });
      console.log(`  -> Created missing profile`);
    } else if (matchedSection && user.profile.section !== matchedSection.name) {
      await prisma.profile.update({
        where: { userId: user.id },
        data: { section: matchedSection.name }
      });
      console.log(`  -> Synced profile.section to "${matchedSection.name}"`);
    }

    // If CR, ensure crAssignment is connected
    if (user.role === 'CR') {
      const term = await prisma.academicTerm.findFirst();
      if (term) {
        await prisma.crAssignment.upsert({
          where: { userId: user.id },
          create: {
            userId: user.id,
            sectionId: targetSectionId || secA.id,
            termId: term.id,
            isActive: true
          },
          update: {
            sectionId: targetSectionId || secA.id,
            termId: term.id,
            isActive: true
          }
        });
        console.log(`  -> Synced crAssignment to section ${targetSectionId || secA.id}`);
      }
    }
  }

  console.log('\n=== 4. SYNCING EVERYTHING TO FIRESTORE ===');
  if (firestore) {
    // 1. Sync institution
    const instUsersCount = await prisma.user.count({ where: { institutionId: inst.id } });
    const instSectionsCount = await prisma.section.count({ where: { institutionId: inst.id } });

    await firestore.collection('institutions').doc(inst.id).set({
      id: inst.id,
      name: inst.name,
      code: inst.code,
      createdAt: inst.createdAt.toISOString(),
      _count: {
        users: instUsersCount,
        sections: instSectionsCount
      }
    }, { merge: true });
    console.log(`Synced institution to Firestore with ${instUsersCount} users and ${instSectionsCount} sections`);

    // 2. Sync sections
    const freshSections = await prisma.section.findMany({
      include: { department: true, semester: true, institution: true, students: true }
    });
    for (const sec of freshSections) {
      await firestore.collection('sections').doc(sec.id).set({
        id: sec.id,
        name: sec.name,
        departmentId: sec.departmentId,
        department: { name: sec.department.name, code: sec.department.code },
        semesterId: sec.semesterId,
        semester: { number: sec.semester.number, name: sec.semester.name },
        institutionId: sec.institutionId,
        institution: sec.institution ? { id: sec.institution.id, name: sec.institution.name, code: sec.institution.code } : null,
        studentCount: sec.students.length,
        createdAt: new Date().toISOString()
      }, { merge: true });
    }
    console.log(`Synced ${freshSections.length} sections to Firestore`);

    // 3. Sync users
    const freshUsers = await prisma.user.findMany({
      include: {
        profile: true,
        student: { include: { section: { include: { department: true } } } },
        crAssignment: { include: { section: true } },
        Institution: true
      }
    });
    for (const u of freshUsers) {
      await firestore.collection('users').doc(u.id).set({
        id: u.id,
        email: u.email,
        role: u.role,
        institutionId: u.institutionId,
        Institution: u.Institution ? { id: u.Institution.id, name: u.Institution.name, code: u.Institution.code } : null,
        institution: u.Institution ? { id: u.Institution.id, name: u.Institution.name, code: u.Institution.code } : null,
        profile: u.profile,
        student: u.student,
        crAssignment: u.crAssignment,
        updatedAt: new Date().toISOString()
      }, { merge: true });
    }
    console.log(`Synced ${freshUsers.length} users to Firestore`);
  }

  console.log('\n=== 5. VERIFICATION SUMMARY ===');
  const finalInst = await prisma.institution.findUnique({
    where: { id: inst.id },
    include: {
      _count: { select: { users: true, sections: true } }
    }
  });
  console.log(`Institution "${finalInst.name}" has:`);
  console.log(`  Users count: ${finalInst._count.users}`);
  console.log(`  Sections count: ${finalInst._count.sections}`);

  const finalSections = await prisma.section.findMany({
    include: { institution: true, students: true }
  });
  finalSections.forEach(s => {
    console.log(`Section "${s.name}": Institution="${s.institution?.name}" (${s.institution?.code}), Students=${s.students.length}`);
  });

  const finalStudents = await prisma.user.findMany({
    where: { role: { in: ['STUDENT', 'CR'] } },
    include: { profile: true, student: { include: { section: true } }, Institution: true }
  });
  console.log('\nStudents list:');
  finalStudents.forEach(s => {
    console.log(`  ${s.profile?.fullName || s.email} (${s.role}): Section="${s.student?.section?.name}", Institution="${s.Institution?.name}"`);
  });

  await prisma.$disconnect();
}

main().catch(console.error);
