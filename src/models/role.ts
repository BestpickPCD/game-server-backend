import { PrismaClient } from '../config/prisma/generated/base-default/index.js';
const prisma = new PrismaClient();

export const findById = async (roleId: number) => {
  const role = await prisma.roles.findUnique({
    where: {
      id: roleId
    }
  });

  return role;
};
