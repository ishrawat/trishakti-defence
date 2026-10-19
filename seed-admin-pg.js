const { PrismaClient } = require('@prisma/client');
const { PrismaPg } = require('@prisma/adapter-pg');
const bcrypt = require('bcryptjs');
require('dotenv').config();

const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL });
const prisma = new PrismaClient({ adapter });

async function seedAdmin() {
  const email = 'admin@institute.com';
  const password = 'admin123';
  
  const existing = await prisma.user.findUnique({ where: { email } });
  if (existing) {
    console.log("✅ Admin account already exists in Supabase.");
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

  console.log(`🎉 Admin created in Supabase! Email: ${email} | Password: ${password}`);
}

seedAdmin().catch(console.error).finally(() => prisma.$disconnect());