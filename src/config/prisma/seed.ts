import bcrypt from 'bcrypt';
import { faker } from '@faker-js/faker';
import { PrismaClient } from '@prisma/client';
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
  for (let i = 1; i <= 400; i++) {
    await prisma.users.create({
      data: {
        name: faker.person.fullName(),
        username: String(i),
        type: i % 2 === 0 ? 'player' : 'agent',
        password: await bcrypt.hash('admin.master.1', 10),
        email: `admin@master.com${i}`,
        roleId: 1,
        currencyId: 1
      }
    });
    if (i % 2 !== 0) {
      await prisma.agents.create({
        data: {
          id: i,
          level: i === 1 ? 1 : 2,
          parentAgentId: null,
          parentAgentIds: i === 1 ? [] : [1]
        }
      });
    } else if (i % 2 === 0) {
      await prisma.players.createMany({
        data: [{ id: i, agentId: 1 }]
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
