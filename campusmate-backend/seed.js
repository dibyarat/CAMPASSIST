const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  await prisma.room.createMany({
    data: [
      { roomNumber: 'Room 101', capacity: 60, building: 'A' },
      { roomNumber: 'Room 102', capacity: 30, building: 'B', isLab: true },
      { roomNumber: 'Room 103', capacity: 100, building: 'Main Building' }
    ],
    skipDuplicates: true
  });
  
  await prisma.academicTerm.createMany({
    data: [
      { id: 'TERM-1', name: 'Fall 2026', startDate: new Date(), endDate: new Date() }
    ],
    skipDuplicates: true
  });

  console.log('Successfully seeded mock data');
}

main().catch(console.error).finally(() => prisma.$disconnect());
