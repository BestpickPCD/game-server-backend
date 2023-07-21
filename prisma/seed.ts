import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcrypt'

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

    const hashedPassword = await bcrypt.hash('master', 10);
    
    await prisma.users.create({
        data: {
            name: 'admin',
            username: 'admin',
            password: hashedPassword,
            email: 'admin@master.com',
            roleId: 1,
            currencyId: 1,
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