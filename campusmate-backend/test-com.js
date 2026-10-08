const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();
async function main() {
  const dep = await prisma.department.findFirst({ where: { code: 'COM' } });
  console.log(dep);
  await prisma.$disconnect();
}
main();
