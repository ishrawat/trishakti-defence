const { PrismaClient } = require('@prisma/client');
const { PrismaPg } = require('@prisma/adapter-pg');
const { Pool } = require('pg');
require('dotenv').config();

const pool = new Pool({ connectionString: process.env.DATABASE_URL });
const adapter = new PrismaPg(pool);
const prisma = new PrismaClient({ adapter });

async function main() {
  const users = await prisma.user.findMany();
  console.log('Total Users Found:', users.length);
  users.forEach(u => console.log('Email:', u.email, '| Role:', u.role));
}
main().catch(console.error).finally(() => prisma.$disconnect());