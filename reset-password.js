const { PrismaClient } = require('@prisma/client');
const { PrismaPg } = require('@prisma/adapter-pg');
const { Pool } = require('pg');
const bcrypt = require('bcryptjs');
require('dotenv').config();

const pool = new Pool({ connectionString: process.env.DATABASE_URL });
const adapter = new PrismaPg(pool);
const prisma = new PrismaClient({ adapter });

async function main() {
  // Hash the password "password123"
  const hash = await bcrypt.hash('password123', 10);
  
  // Update Vijay's password
  const updated = await prisma.user.update({
    where: { email: 'vijay@test.com' },
    data: { password: hash }
  });
  
  console.log('✅ Password reset successful!');
  console.log('Email: ' + updated.email);
  console.log('Password: password123');
}
main().catch(console.error).finally(() => prisma.$disconnect());