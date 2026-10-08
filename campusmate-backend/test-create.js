const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();
async function main() {
  try {
    const data = {
      name: 'CT-A',
      departmentCode: 'CSE',
      departmentName: 'Computer Science and Engineering',
      semesterNumber: 2,
      semesterName: 'Second Semester'
    };
    
    let department = await prisma.department.findFirst({
      where: { code: data.departmentCode }
    });
    if (!department) {
      department = await prisma.department.create({
        data: { name: data.departmentName, code: data.departmentCode }
      });
    }

    let semester = await prisma.semester.findFirst({
      where: { number: data.semesterNumber }
    });
    if (!semester) {
      semester = await prisma.semester.create({
        data: { name: data.semesterName, number: data.semesterNumber }
      });
    }

    const res = await prisma.section.create({
      data: {
        name: data.name,
        departmentId: department.id,
        semesterId: semester.id
      }
    });
    console.log('Success', res);
  } catch (e) {
    console.error('Error:', e);
  } finally {
    await prisma.$disconnect();
  }
}
main();
