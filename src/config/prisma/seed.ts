import bcrypt from 'bcrypt';
import { faker } from '@faker-js/faker';
import { PrismaClient } from '../../config/prisma/generated/base-default/index.js';
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
    const user = await prisma.users.create({
      data: {
        name: faker.person.fullName(),
        username: `user.master.1`,
        type: 'agent',
        password: await bcrypt.hash(`user.master.1`, 10),
        email: `admin1@master.com`,
        roleId: 1,
        currencyId: 1
      }
    });
    await prisma.users.update({
      where: {
        id: user.id
      },
      data: {
        id: user.id,
        parentAgentId: user.id,
        level: 1,
        parentAgentIds: []
      }
    });

    await prisma.agentVendor.create({
      data: {
        agentId: user.id,
        vendorId: 1
      }
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
