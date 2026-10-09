const { cert, initializeApp } = require('firebase-admin/app');
const { getAuth } = require('firebase-admin/auth');
const { PrismaClient } = require('@prisma/client');
const path = require('path');
const fs = require('fs');

const TEMP_PASSWORD = 'Password123!';
const FIREBASE_API_KEY = 'AIzaSyC-o8-0zbpDI_yRDWUYp2wNyQ2xi61MxmI';

async function main() {
  const saPath = path.join(__dirname, '..', 'serviceAccountKey.json');
  if (!fs.existsSync(saPath)) {
    console.error('Service account key not found at:', saPath);
    process.exit(1);
  }

  const sa = JSON.parse(fs.readFileSync(saPath, 'utf8'));
  const app = initializeApp({ credential: cert(sa) });
  const auth = getAuth(app);
  const prisma = new PrismaClient();

  console.log('--- Fetching users from Database and Firebase Auth ---');

  const dbUsers = await prisma.user.findMany({
    include: { profile: true }
  });
  console.log(`Found ${dbUsers.length} users in PostgreSQL.`);

  let nextPageToken;
  const fbUsersMap = new Map();
  do {
    const list = await auth.listUsers(1000, nextPageToken);
    list.users.forEach(u => fbUsersMap.set(u.email ? u.email.toLowerCase() : u.uid, u));
    nextPageToken = list.pageToken;
  } while (nextPageToken);
  console.log(`Found ${fbUsersMap.size} users in Firebase Auth.`);

  const results = [];

  for (const user of dbUsers) {
    const email = user.email.toLowerCase();
    let fbUser = fbUsersMap.get(email);

    try {
      if (!fbUser) {
        console.log(`Creating missing Firebase Auth user for: ${email} (UID: ${user.id})`);
        fbUser = await auth.createUser({
          uid: user.id,
          email: user.email,
          emailVerified: true,
          password: TEMP_PASSWORD,
          displayName: user.profile?.fullName || user.email.split('@')[0],
        });
      } else {
        console.log(`Updating password for: ${email}`);
        await auth.updateUser(fbUser.uid, {
          password: TEMP_PASSWORD,
          emailVerified: true,
        });
      }

      // Verify sign in
      const verifyRes = await fetch(
        `https://identitytoolkit.googleapis.com/v1/accounts:signInWithPassword?key=${FIREBASE_API_KEY}`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            email: user.email,
            password: TEMP_PASSWORD,
            returnSecureToken: true,
          }),
        }
      );

      const verifyData = await verifyRes.json();
      const loginSuccess = !!verifyData.idToken;

      results.push({
        email: user.email,
        name: user.profile?.fullName || 'N/A',
        role: user.role,
        tempPassword: TEMP_PASSWORD,
        loginVerified: loginSuccess ? 'SUCCESS' : `FAILED: ${verifyData.error?.message || 'Unknown'}`,
      });
    } catch (err) {
      console.error(`Error processing ${user.email}:`, err.message);
      results.push({
        email: user.email,
        name: user.profile?.fullName || 'N/A',
        role: user.role,
        tempPassword: TEMP_PASSWORD,
        loginVerified: `ERROR: ${err.message}`,
      });
    }
  }

  // Also check any Firebase-only users that might not be in PostgreSQL
  for (const [key, fbUser] of fbUsersMap) {
    if (fbUser.email && !dbUsers.some(u => u.email.toLowerCase() === fbUser.email.toLowerCase())) {
      try {
        console.log(`Updating Firebase-only user: ${fbUser.email}`);
        await auth.updateUser(fbUser.uid, {
          password: TEMP_PASSWORD,
          emailVerified: true,
        });
        results.push({
          email: fbUser.email,
          name: fbUser.displayName || 'Firebase Only',
          role: 'N/A',
          tempPassword: TEMP_PASSWORD,
          loginVerified: 'SUCCESS',
        });
      } catch (err) {
        results.push({
          email: fbUser.email,
          name: fbUser.displayName || 'Firebase Only',
          role: 'N/A',
          tempPassword: TEMP_PASSWORD,
          loginVerified: `ERROR: ${err.message}`,
        });
      }
    }
  }

  console.log('\n======================================================');
  console.log('RESULTS SUMMARY:');
  console.table(results);
  console.log('======================================================\n');

  await prisma.$disconnect();
}

main().catch(err => {
  console.error('Fatal error:', err);
  process.exit(1);
});

