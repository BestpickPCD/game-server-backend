import { PrismaClient, Permissions } from '@prisma/client';
const prisma = new PrismaClient();

export const getAll = async (): Promise<Permissions[]> => {
  try {
    const permissions: Permissions[] = await prisma.permissions.findMany({
      where: { deletedAt: null },
      orderBy: { updatedAt: 'asc' }
    });
    return permissions;
  } catch (error) {
    throw Error(error.message);
  }
};
