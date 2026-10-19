const { PrismaClient } = require('@prisma/client');
const { PrismaBetterSqlite3 } = require('@prisma/adapter-better-sqlite3');
const bcrypt = require('bcryptjs');

const adapter = new PrismaBetterSqlite3({ url: 'file:./dev.db' });
const prisma = new PrismaClient({ adapter });

async function seedAdmin() {
  const email = 'admin@institute.com';
  const password = 'admin123';
  
  const existing = await prisma.user.findUnique({ where: { email } });
  if (existing) {
    console.log("✅ Admin account already exists.");
    return;
  }

  const hashedPassword = await bcrypt.hash(password, 10);
  
  await prisma.user.create({
    data: {
      name: 'Admin User',
      email: email,
      password: hashedPassword,
      role: 'TEACHER'
    }
  });

  console.log(`🎉 Admin created! Email: ${email} | Password: ${password}`);
}

seedAdmin().catch(console.error).finally(() => prisma.$disconnect());