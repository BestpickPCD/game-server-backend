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
}): Promise<Roles> => {
  try {
    const filter = {
      ...(id ? { id } : { name })
    };
    const role = await prisma.roles.findFirst({
      where: { deletedAt: null, ...filter }
    });
    if (name && role) {
      throw new Error(EXISTED);
    } else if (!role && id) {
      throw new Error(NOT_FOUND);
    } else if (!role) {
      throw new Error(NOT_FOUND);
    }
    return role;
  } catch (error) {
    throw Error(error.message);
  }
};

export const create = async (
  name: string,
  permissions: string[]
): Promise<Roles> => {
  try {
    await getById({ name });
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
  permissions: string[]
): Promise<Roles> => {
  try {
    await getById({ id });
    await getById({ name });
    const updatedRole = await prisma.roles.update({
      where: { id },
      data: { ...(name && { name }), ...(permissions && { permissions }) }
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
      where: { id },
      data: { deletedAt: new Date() }
    });
    return updatedRole;
  } catch (error) {
    throw Error(error.message);
  }
};
