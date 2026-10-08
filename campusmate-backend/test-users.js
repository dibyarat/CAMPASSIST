const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();
async function main() {
  try {
    const res = await prisma.user.findMany({
      include: {
        profile: true,
        student: true,
        crAssignment: { include: { section: true } },
        Institution: true
      }
    });
    console.log(res);
  } catch(e) {
    console.error(e);
  } finally {
    await prisma.$disconnect();
  }
}
main();
