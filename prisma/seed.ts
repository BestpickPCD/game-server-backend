import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  await prisma.roles.create({
    data: {
      name: 'admin',
    },
  });

  await prisma.currencies.create({
    data: {
      name: 'Korean Won',
      code: 'KRW',
    },
  });
}

main()
  .catch((error) => {
    console.error(error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
