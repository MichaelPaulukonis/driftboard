import { PrismaClient } from '../src/shared/generated/prisma';

const prisma = new PrismaClient();

async function main() {
  console.log('🔄 Migrating board memberships...');

  const boards = await prisma.board.findMany({
    include: { memberships: true },
  });

  let created = 0;
  for (const board of boards) {
    if (!board.userId) continue;

    const alreadyHasOwner = board.memberships.some(
      (membership) => membership.userId === board.userId,
    );

    if (!alreadyHasOwner) {
      await prisma.boardMembership.create({
        data: {
          boardId: board.boardId,
          userId: board.userId,
          role: 'OWNER',
        },
      });
      created += 1;
    }
  }

  console.log(`✅ Migration complete. Added ${created} owner membership(s).`);
}

main()
  .catch((error) => {
    console.error('❌ Failed to migrate board memberships', error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
