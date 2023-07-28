import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcrypt';

const prisma = new PrismaClient();

async function main() {
  await prisma.roles.createMany({
    data: [{ name: 'admin' }, { name: 'user' }],
    skipDuplicates: true
  });

  // await prisma.currencies.create({
  //   data: {
  //     name: 'Korean Won',
  //     code: 'KRW'
  //   }
  // });
  const hashedPassword = await bcrypt.hash('master', 10);
  const hashedPasswordUser = await bcrypt.hash('user.master.1', 10);

  await prisma.users.createMany({
    data: [
      {
        name: 'admin',
        username: 'admin1',
        type: 'admin',
        password: hashedPassword,
        email: 'admin@master.com1',
        roleId: 1,
        currencyId: 1
      },
      {
        name: 'pngyn',
        username: 'pngyn1',
        type: 'user',
        password: await bcrypt.hash('nguyen123!', 10),
        email: 'pngyn@pngyn.com1',
        roleId: 1,
        currencyId: 1
      },
      {
        name: 'User Master',
        username: 'user1',
        type: 'user',
        password: hashedPasswordUser,
        email: 'user@master.com12',
        roleId: 1,
        currencyId: 1
      },
      {
        name: 'User Master',
        username: 'user3',
        type: 'user',
        password: hashedPasswordUser,
        email: 'user@master.com13',
        roleId: 1,
        currencyId: 1
      },
      {
        name: 'admin',
        username: 'admin1',
        type: 'admin',
        password: hashedPassword,
        email: 'admin@master.com1',
        roleId: 1,
        currencyId: 1
      },
      {
        name: 'pngyn',
        username: 'pngyn1',
        type: 'user',
        password: await bcrypt.hash('nguyen123!', 10),
        email: 'pngyn@pngyn.com1',
        roleId: 1,
        currencyId: 1
      },
      {
        name: 'User Master',
        username: 'user1',
        type: 'user',
        password: hashedPasswordUser,
        email: 'user@master.com12',
        roleId: 1,
        currencyId: 1
      },
      {
        name: 'User Master',
        username: 'user3',
        type: 'user',
        password: hashedPasswordUser,
        email: 'user@master.com13',
        roleId: 1,
        currencyId: 1
      }
    ]
  });

  await prisma.agents.createMany({
    data: [
      {
        id: 1,
        level: 1,
        parentAgentId: null,
        parentAgentIds: [],
        rate: 10
      },
      {
        id: 2,
        level: 2,
        parentAgentId: 1,
        parentAgentIds: [1],
        rate: 10
      },
      {
        id: 3,
        level: 2,
        parentAgentId: 1,
        parentAgentIds: [1],
        rate: 10
      },
      {
        id: 4,
        level: 2,
        parentAgentId: null,
        parentAgentIds: [],
        rate: 10
      },
      {
        id: 5,
        level: 2,
        parentAgentId: 1,
        parentAgentIds: [1],
        rate: 10
      },
      {
        id: 6,
        level: 2,
        parentAgentId: 1,
        parentAgentIds: [1],
        rate: 10
      },
      {
        id: 7,
        level: 2,
        parentAgentId: 1,
        parentAgentIds: [1],
        rate: 10
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
