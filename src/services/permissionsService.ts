import { PrismaClient, Permissions } from '@prisma/client';
const prisma = new PrismaClient();

const NOT_FOUND = 'Permissions not found';
const EXISTED = 'Permissions existed';
export const getAll = async (): Promise<Permissions[]> => {
  try {
    const permissions: Permissions[] = await prisma.permissions.findMany({
      where: { deletedAt: null }
    });
    return permissions;
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
}): Promise<Permissions | boolean> => {
  try {
    const filter = {
      ...(id ? { id } : { name })
    };
    const permissions = await prisma.permissions.findUnique({
      where: { deletedAt: null, ...filter }
    });
    if ((name && permissions) || (id && permissions)) {
      return permissions;
    } else if (name && !permissions) {
      return false;
    }
    throw Error(NOT_FOUND);
  } catch (error) {
    throw Error(error.message);
  }
};

export const create = async (
  name: string,
  permissions: string[]
): Promise<Permissions> => {
  try {
    const permission = await getById({ name });
    if (permission) {
      throw Error(EXISTED);
    }
    const defaultPermissions = ['get', 'getById', 'create', 'update', 'delete'];
    const newPermission = await prisma.permissions.create({
      data: {
        name,
        permissions: permissions || defaultPermissions
      }
    });
    return newPermission;
  } catch (error) {
    throw Error(error.message);
  }
};

export const update = async (
  id: number,
  name: string,
  permissions: string[]
) => {
  try {
    await getById({ id });
    const updatedPermission = await prisma.permissions.update({
      data: {
        name,
        permissions
      },
      where: {
        id
      }
    });
    return updatedPermission;
  } catch (error) {
    throw Error(error.message);
  }
};

export const deletePermission = async (id: number) => {
  try {
    await getById({ id });
    const deletedPermission = await prisma.permissions.update({
      data: {
        deletedAt: new Date()
      },
      where: {
        id
      }
    });
    return deletedPermission;
  } catch (error) {
    throw Error(error.message);
  }
};
