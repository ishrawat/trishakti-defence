const { PrismaClient } = require('@prisma/client');
const { PrismaBetterSqlite3 } = require('@prisma/adapter-better-sqlite3');
const adapter = new PrismaBetterSqlite3({ url: 'file:./dev.db' });
const prisma = new PrismaClient({ adapter });

async function check() {
  console.log("\n--- RAW JOIN TABLE DATA ---");
  const relations = await prisma.$queryRaw`SELECT * FROM _BatchToMockTest;`;
  console.log(relations);

  console.log("\n--- BATCH -> TESTS ---");
  const batches = await prisma.batch.findMany({ include: { mockTests: true } });
  batches.forEach(b => {
    console.log(`Batch: ${b.name}`);
    b.mockTests.forEach(t => console.log(`  - ${t.title}`));
  });
  
  await prisma.$disconnect();
}
check().catch(console.error);