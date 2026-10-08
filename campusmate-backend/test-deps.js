const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();
async function main() {
  const deps = await prisma.department.findMany();
  console.log(deps);
  await prisma.$disconnect();
}
main();
