import { PrismaClient } from '../src/shared/generated/prisma/index.js';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Seeding database...');
  
  // Create a test user (you'll replace this with actual Firebase users)
  const testUser = await prisma.user.upsert({
    where: { email: 'test@example.com' },
    update: {},
    create: {
      id: 'test-user-id',
      email: 'test@example.com',
      name: 'Test User',
    },
  });

  console.log('✅ Created test user:', testUser);

  // Create a sample board
  const sampleBoard = await prisma.board.create({
    data: {
      name: 'My First Board',
      description: 'A sample board to get started',
      userId: testUser.id,
      position: 0,
      lists: {
        create: [
          {
            name: 'To Do',
            position: 0,
            cards: {
              create: [
                {
                  title: 'Welcome to DriftBoard!',
                  description: 'This is your first card. You can edit, move, or delete it.',
                  position: 0,
                },
                {
                  title: 'Learn React and TypeScript',
                  description: 'Build amazing applications with modern web technologies.',
                  position: 1,
                },
              ],
            },
          },
          {
            name: 'In Progress',
            position: 1,
            cards: {
              create: [
                {
                  title: 'Set up development environment',
                  description: 'Install Node.js, npm, and configure your IDE.',
                  position: 0,
                },
              ],
            },
          },
          {
            name: 'Done',
            position: 2,
            cards: {
              create: [
                {
                  title: 'Create project structure',
                  description: 'Initial project setup with TypeScript and Prisma.',
                  position: 0,
                },
              ],
            },
          },
        ],
      },
    },
  });

  console.log('✅ Created sample board:', sampleBoard);

  console.log('🎉 Database seeded successfully!');
}

main()
  .catch((e) => {
    console.error('❌ Error seeding database:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
