import {
  PrismaClient,
  Permissions
} from '../config/prisma/generated/base-default/index.js';
import { CONFLICT, NOT_FOUND } from '../core/error.response.js';
const prisma = new PrismaClient();

const message = {
  NOT_FOUND: 'Permissions not found',
  EXISTED: 'Permissions existed'
};

export const getAll = async (): Promise<Permissions[]> => {
  const permissions: Permissions[] = await prisma.permissions.findMany({
    where: { deletedAt: null }
  });
  return permissions;
};

export const getById = async (id: number): Promise<Permissions> => {
  const permissions = await prisma.permissions.findUnique({
    where: { deletedAt: null, id }
  });
  if (!permissions) {
    throw new NOT_FOUND(message.NOT_FOUND);
  }
  return permissions;
};

export const getByName = async (name: string): Promise<Permissions | null> => {
  return await prisma.permissions.findUnique({
    where: { deletedAt: null, name }
  });
};

export const create = async (
  name: string,
  permissions: string[]
): Promise<Permissions> => {
  const permission = await getByName(name);
  if (permission) {
    throw new CONFLICT(message.EXISTED);
  }
  const defaultPermissions = ['get', 'getById', 'create', 'update', 'delete'];
  const newPermission = await prisma.permissions.create({
    data: {
      name,
      permissions: permissions || defaultPermissions
    }
  });
  return newPermission;
};

export const update = async (
  id: number,
  name: string,
  permissions: string[]
) => {
  await getById(id);
  const updatedPermission = await prisma.permissions.update({
    data: { name, permissions },
    where: { id }
  });
  return updatedPermission;
};

export const deletePermission = async (id: number) => {
  await getById(id);
  const deletedPermission = await prisma.permissions.update({
    data: {
      deletedAt: new Date()
    },
    where: {
      id
    }
  });
  return deletedPermission;
};
