const { PrismaClient } = require('@prisma/client');
const { PrismaBetterSqlite3 } = require('@prisma/adapter-better-sqlite3');
const adapter = new PrismaBetterSqlite3({ url: 'file:./dev.db' });
const prisma = new PrismaClient({ adapter });

async function check() {
  try {
    const result = await prisma.$queryRaw`PRAGMA table_info(User);`;
    console.log("User Table Columns:");
    result.forEach(col => console.log(`- ${col.name} (${col.type})`));
  } catch (e) {
    console.error("Error reading table info:", e);
  } finally {
    await prisma.$disconnect();
  }
}
check();