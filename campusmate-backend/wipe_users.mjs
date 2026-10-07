import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();
async function main() {
  await prisma.$executeRawUnsafe('DELETE FROM auth.users;');
  await prisma.user.deleteMany();
  console.log('Successfully wiped all users from Supabase Auth and Prisma DB!');
}
main().catch(console.error).finally(() => prisma.$disconnect());
