import bcrypt from 'bcrypt';
import { faker } from '@faker-js/faker';
import { PrismaClient } from '@prisma/client';
import {
  evolution,
  PragmaticPlay,
  Habanero,
  ezugi,
  permissions
} from './fakedData.ts';
const prisma = new PrismaClient();

async function main() {
  await prisma.roles.createMany({
    data: [
      {
        name: 'admin',
        permissions
      },
      {
        name: 'operator',
        permissions
      },
      {
        name: 'distributor',
        permissions
      }
    ],
    skipDuplicates: true
  });
  await prisma.currencies.create({
    data: {
      name: 'Korean Won',
      code: 'KRW'
    }
  });
  await prisma.vendors.createMany({
    data: [
      {
        name: 'evolution',
        url: `https://api.honorlink.org`,
        fetchGames: evolution
      },
      {
        name: 'PragmaticPlay',
        url: `https://api.pragmaticplay.org`,
        fetchGames: PragmaticPlay
      },
      {
        name: 'Habanero',
        url: `https://api.Habanero.org`,
        fetchGames: Habanero
      },
      {
        name: 'ezugi',
        url: `https://api.ezugi.org`,
        fetchGames: ezugi
      }
    ]
  });
  for (let i = 1; i <= 100; i++) {
    await prisma.users.create({
      data: {
        name: faker.person.fullName(),
        username: `user.master.${String(i)}`,
        type: 'agent',
        level: i === 1 ? 1 : 2,
        parentAgentId: i === 1 ? null : 1,
        parentAgentIds: i === 1 ? [] : [1],
        password: await bcrypt.hash('admin.master.1', 10),
        email: `admin@master.com${i}`,
        roleId: 1,
        currencyId: 1
      }
    });
    await prisma.userVendor.create({
      data: {
        userId: i,
        vendorId: 1
      }
    });
  }
  for (let a = 1; a <= 100; a++) {
    for (let b = 0; b < 3; b++) {
      await prisma.players.create({
        data: {
          userId: a,
          username: `${faker.person.firstName()}_${faker.person.lastName()}`
        }
      });
    }
  }
}

main()
  .catch((error) => {
    console.error(error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
