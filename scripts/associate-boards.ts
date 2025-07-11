// scripts/associate-boards.ts
import { PrismaClient, Board } from '../src/shared/generated/prisma';

const prisma = new PrismaClient();

const TARGET_USER_ID = '8ZWIzPZiEPbW4xlsIJFGawyHc7b2';

async function main() {
  console.log(`Associating unassigned boards with user ID: ${TARGET_USER_ID}`);

  // First, ensure the user exists in the database.
  // The auth middleware should have created this user on first login,
  // but it's good practice to check.
  let user = await prisma.user.findUnique({
    where: { id: TARGET_USER_ID },
  });

  if (!user) {
    console.log(`User with ID ${TARGET_USER_ID} not found. Creating...`);
    user = await prisma.user.create({
      data: {
        id: TARGET_USER_ID,
        // You might want to fill this in manually or leave as placeholder
        email: 'xraysmalevich@gmail.com',
        name: 'Michael Paulukonis',
      },
    });
    console.log(`User ${user.name} (${user.email}) created.`);
  } else {
    console.log(`Found existing user: ${user.name} (${user.email})`);
  }

  // Find all boards that do not have a userId using a raw query
  // to bypass the strictness of the generated client after the schema change.
  // const unassignedBoards: Board[] =
  //   await prisma.$queryRaw`SELECT * FROM boards WHERE userId IS NULL`;

  // if (unassignedBoards.length === 0) {
  //   console.log('No unassigned boards found. Nothing to do.');
  //   return;
  // }

  // console.log(`Found ${unassignedBoards.length} unassigned boards. Updating...`);

  // Update the boards with the new user ID using a raw execute
  const updateResult =
    await prisma.$executeRaw`UPDATE boards SET userId = ${TARGET_USER_ID} WHERE userId <> ${TARGET_USER_ID}`;

  console.log(`Successfully updated ${updateResult} boards.`);
}

main()
  .catch((e) => {
    console.error('An error occurred while associating boards:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
