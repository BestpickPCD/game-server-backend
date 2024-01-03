import bcrypt from 'bcrypt';
import { faker } from '@faker-js/faker';
import { PrismaClient, Users } from '../../config/prisma/generated/base-default/index.js';
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

  await prisma.vendors.createMany({
    data: vendors
  });

  await prisma.currencies.create({
    data: {
      name: 'Korean Won',
      code: 'KRW'
    }
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
      level: 1,
      apiKey: await bcrypt.hash(user.id, 10),
      parentAgentIds: []
    }
  });

  const agent_1 = await prisma.users.create({
    data: {
      name: faker.person.fullName(),
      username: `agent1.agent1`,
      type: 'agent',
      password: await bcrypt.hash(`agent1.agent1`, 10),
      email: `agent1@agent1.com`,
      parentAgentId: user.id,
      roleId: 3,
      currencyId: 1
    }
  });
  await prisma.users.update({
    where: {
      id: agent_1.id
    },
    data: {
      id: agent_1.id,
      level: 2,
      apiKey: await bcrypt.hash(agent_1.id, 10),
      parentAgentIds: [user.id]
    }
  });

  for (let i = 0; i < 20; i++) {
    const createdUser = await prisma.users.create({
      data: {
        name: faker.person.fullName(),
        username: `user${i}.agent1`,
        type: 'player',
        password: await bcrypt.hash(`user${i}.agent1`, 10),
        email: `user${i}@agent1.com`,
        parentAgentId: agent_1.id,
        roleId: 3,
        apiKey: await bcrypt.hash(agent_1.id, 10),
        parentAgentIds: [agent_1.id],
        currencyId: 1
      }
    });
    
    await prisma.users.update({
      where: {
        id: createdUser.id
      },
      data: {
        apiKey: await bcrypt.hash(createdUser.id, 10)
      }
    });
  }

  const agentVendor = [];
  for (let i = 1; i <= vendors.length; i++) {
    agentVendor.push(
      {
        agentId: user.id,
        directUrl: false,
        vendorId: i
      }, {
        agentId: agent_1.id,
        directUrl: false,
        vendorId: i
      }
    );
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
