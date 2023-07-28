import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcrypt';

const prisma = new PrismaClient();

async function main() {
  await prisma.roles.createMany({
    data: [{ name: 'admin' }, { name: 'user' }],
    skipDuplicates: true
  });

  await prisma.currencies.create({
    data: {
      name: 'Korean Won',
      code: 'KRW'
    }
  });
  const hashedPassword = await bcrypt.hash('master', 10);
  const hashedPasswordUser = await bcrypt.hash('user.master.1', 10);

  await prisma.users.createMany({
    data: [
      {
        name: 'admin',
        username: 'admin',
        type: 'admin',
        password: hashedPassword,
        email: 'admin@master.com',
        roleId: 1,
        currencyId: 1
      },
      {
        name: 'pngyn',
        username: 'pngyn',
        type: 'user',
        password: await bcrypt.hash('nguyen123!', 10),
        email: 'pngyn@pngyn.com',
        roleId: 1,
        currencyId: 1
      },
      {
        name: 'User Master',
        username: 'user',
        type: 'user',
        password: hashedPasswordUser,
        email: 'user@master.com',
        roleId: 1,
        currencyId: 1
      }
    ]
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
