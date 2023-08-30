import { PrismaClient, Roles } from '@prisma/client';
const prisma = new PrismaClient();

const NOT_FOUND = 'Roles not found';
const EXISTED = 'Roles existed';

export const getAll = async (): Promise<Roles[]> => {
  try {
    const roles = await prisma.roles.findMany({
      where: { deletedAt: null },
      orderBy: { name: 'asc' }
    });
    return roles;
  } catch (error) {
    throw Error(error.message);
  }
};

export const getById = async ({
  id,
  name
}: {
  id?: number;
  name?: string;
}): Promise<Roles | boolean> => {
  try {
    const filter = {
      ...(id ? { id } : { name })
    };

    const role = await prisma.roles.findUnique({
      where: { deletedAt: null, ...filter }
    });

    if ((name && role) || (id && role)) {
      return role;
    } else if (name && !role) {
      return false;
    }

    throw Error(NOT_FOUND);
  } catch (error) {
    throw Error(error.message);
  }
};

export const create = async (
  name: string,
  permissions: any
): Promise<Roles> => {
  try {
    const role = await getById({ name });
    if (role) {
      throw Error(EXISTED);
    }

    const newRole = await prisma.roles.create({
      data: { name, permissions }
    });
    return newRole;
  } catch (error) {
    throw Error(error.message);
  }
};

export const update = async (
  id: number,
  name: string,
  permissions: any
): Promise<Roles> => {
  try {
    await getById({ id });
    const updatedRole = await prisma.roles.update({
      where: { id },
      data: { name, permissions }
    });

    return updatedRole;
  } catch (error) {
    throw Error(error.message);
  }
};

export const deleteRole = async (id: number): Promise<Roles> => {
  try {
    await getById({ id });
    const updatedRole = await prisma.roles.update({
      where: { id, deletedAt: null },
      data: { deletedAt: new Date() }
    });
    if (!updatedRole) {
      throw Error(NOT_FOUND);
    }
    return updatedRole;
  } catch (error) {
    throw Error(error.message);
  }
};
