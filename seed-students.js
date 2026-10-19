const { PrismaClient } = require('@prisma/client');
const { PrismaBetterSqlite3 } = require('@prisma/adapter-better-sqlite3');
const adapter = new PrismaBetterSqlite3({ url: 'file:./dev.db' });
const prisma = new PrismaClient({ adapter });

async function seed() {
  console.log("🚀 Seeding dummy students for testing...");

  // 1. Get a real mock test to link the attempts to
  const mockTest = await prisma.mockTest.findFirst({
    include: { sections: { include: { questions: true } } }
  });
  
  if (!mockTest) {
    console.log("❌ No mock tests found! Please create a test first.");
    return;
  }

  const students = [
    { name: 'Rahul Sharma', email: 'rahul@test.com', batch: 'SSC CGL Batch A' },
    { name: 'Priya Patel', email: 'priya@test.com', batch: 'SSC CGL Batch A' },
    { name: 'Amit Kumar', email: 'amit@test.com', batch: 'Banking Batch B' }
  ];

  for (const s of students) {
    // Check if user already exists to prevent duplicate key errors
    let user = await prisma.user.findUnique({ where: { email: s.email } });
    if (!user) {
      user = await prisma.user.create({
        data: { ...s, password: 'password', role: 'STUDENT' }
      });
      console.log(`✅ Created student: ${user.name} (${user.batch})`);
    } else {
      console.log(`ℹ️ Student already exists: ${user.name}`);
    }

    // Create 2 Attempts for each user with different scores
    for (let i = 1; i <= 2; i++) {
      await prisma.attempt.create({
        data: {
          userId: user.id,
          mockTestId: mockTest.id,
          status: 'COMPLETED',
          totalScore: Math.floor(Math.random() * 50) + 10, // Random score between 10 and 60
          endTime: new Date(),
          tabSwitchCount: Math.floor(Math.random() * 3),
          responses: {
            create: [
              { questionId: mockTest.sections[0].questions[0]?.id || 'dummy', selectedOption: 'A', status: 'ANSWERED', timeSpent: 45 },
              { questionId: mockTest.sections[0].questions[1]?.id || 'dummy', selectedOption: 'B', status: 'ANSWERED', timeSpent: 60 }
            ]
          }
        }
      });
    }
  }
  
  console.log("🎉 Done! Go to the Teacher Dashboard to see them.");
}

seed().catch(console.error).finally(() => prisma.$disconnect());