import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();

export const findById = async (roleId: number) => {
  const role = await prisma.roles.findUnique({
    where: {
      id: roleId
    }
  });

  return role;
};
