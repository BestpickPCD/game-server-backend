import bcrypt from 'bcrypt';
import { faker } from '@faker-js/faker';
import { PrismaClient } from '../../config/prisma/generated/base-default/index.js';
import {
  vendors,
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
    data: vendors
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
        level: 1,
        parentAgentIds: []
      }
    });

    const agentVendor = []
    for(let i = 1; i <= vendors.length; i++ ) {
      agentVendor.push({
        agentId: user.id,
        directUrl: false,
        vendorId: i
      })
    }

    await prisma.agentVendor.createMany({
      data: agentVendor
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
