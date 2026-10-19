const { PrismaClient } = require('@prisma/client');
const { PrismaBetterSqlite3 } = require('@prisma/adapter-better-sqlite3');
const adapter = new PrismaBetterSqlite3({ url: 'file:./dev.db' });
const prisma = new PrismaClient({ adapter });

async function checkDB() {
  console.log("\n--- STUDENTS & BATCHES ---");
  const users = await prisma.user.findMany({ where: { role: 'STUDENT' }, include: { batch: true } });
  users.forEach(u => console.log(`Student: ${u.name} | Batch: ${u.batch?.name || 'NONE'}`));

  console.log("\n--- TESTS & THEIR ACCESS ---");
  const tests = await prisma.mockTest.findMany({ include: { batches: true } });
  tests.forEach(t => {
    const batchNames = t.batches.map(b => b.name).join(', ');
    console.log(`Test: "${t.title}" | Assigned to: [${batchNames || 'PUBLIC (No Batches)'}]`);
  });
  
  await prisma.$disconnect();
}
checkDB().catch(console.error);