import { PrismaClient } from '../src/shared/generated/prisma';

const prisma = new PrismaClient();

async function main() {
  console.log('Start seeding...');

  // Populate boardId for existing boards
  const boards = await prisma.board.findMany({
    where: {
      boardId: null,
    },
  });
  for (const board of boards) {
    await prisma.board.update({
      where: { id: board.id },
      data: { boardId: board.id },
    });
  }
  console.log(`${boards.length} boards updated.`);

  // Populate listId for existing lists
  const lists = await prisma.list.findMany({
    where: {
      listId: null,
    },
  });
  for (const list of lists) {
    await prisma.list.update({
      where: { id: list.id },
      data: { listId: list.id },
    });
  }
  console.log(`${lists.length} lists updated.`);

  // Populate cardId for existing cards
  const cards = await prisma.card.findMany({
    where: {
      cardId: null,
    },
  });
  for (const card of cards) {
    await prisma.card.update({
      where: { id: card.id },
      data: { cardId: card.id },
    });
  }
  console.log(`${cards.length} cards updated.`);

  // Populate userId for existing users
  const users = await prisma.user.findMany({
    where: {
      userId: null,
    },
  });
  for (const user of users) {
    await prisma.user.update({
      where: { id: user.id },
      data: { userId: user.id },
    });
  }
  console.log(`${users.length} users updated.`);

  console.log('Seeding finished.');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
