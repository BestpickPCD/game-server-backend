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

  await prisma.users.createMany({
    data: [
      {
        name: 'admin',
        username: 'admin',
        type: 'agent',
        password: await bcrypt.hash('admin.master.1', 10),
        email: 'admin@master.com',
        roleId: 1,
        currencyId: 1
      },
      {
        name: 'pngyn',
        username: 'pngyn',
        type: 'agent',
        password: await bcrypt.hash('nguyen123!', 10),
        email: 'pngyn@pngyn.com',
        roleId: 1,
        currencyId: 1
      },
      {
        name: 'User Master',
        username: 'user',
        type: 'player',
        password: await bcrypt.hash('user.master.1', 10),
        email: 'user@master.com',
        roleId: 1,
        currencyId: 1
      }
    ]
  });
  
  await prisma.agents.createMany({
    data:[
      { id: 1, level:1, parentAgentId: null}, 
      { id: 2, level:2, parentAgentId: 1, parentAgentIds:[1] }
    ]
  })

  await prisma.players.createMany({
    data:[
      { id: 3, agentId: 1 }
    ]
  })

}

main()
  .catch((error) => {
    console.error(error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
