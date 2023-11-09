import {
  PrismaClient,
  Roles
} from '../config/prisma/generated/base-default/index.js';
import { CONFLICT, NOT_FOUND } from '../core/error.response.js';
const prisma = new PrismaClient();

const message = {
  NOT_FOUND: 'Roles not found',
  EXISTED: 'Roles existed'
};

export const getAll = async (): Promise<Roles[]> => {
  const roles = await prisma.roles.findMany({
    where: { deletedAt: null },
    orderBy: { name: 'asc' }
  });
  return roles;
};

export const getById = async (
  id: number
): Promise<Roles | null | undefined> => {
  const role = await prisma.roles.findUnique({
    where: { deletedAt: null, id }
  });

  if (!role) {
    throw new NOT_FOUND(message.NOT_FOUND);
  }

  return role;
};

export const getByName = async (name: string): Promise<Roles | null> => {
  const role = await prisma.roles.findUnique({
    where: { deletedAt: null, name }
  });
  return role;
};

export const create = async (
  name: string,
  permissions: any
): Promise<Roles> => {
  const role = await getByName(name);
  if (role) {
    throw new CONFLICT(message.EXISTED);
  }

  const newRole = await prisma.roles.create({
    data: { name, permissions }
  });
  return newRole;
};

export const update = async (
  id: number,
  name: string,
  permissions: any
): Promise<Roles> => {
  await getById(id);
  const updatedRole = await prisma.roles.update({
    where: { id },
    data: { name, permissions }
  });

  return updatedRole;
};

export const deleteRole = async (id: number): Promise<Roles> => {
  await getById(id);
  const updatedRole = await prisma.roles.update({
    where: { id, deletedAt: null },
    data: { deletedAt: new Date() }
  });
  if (!updatedRole) {
    throw new NOT_FOUND(message.NOT_FOUND);
  }
  return updatedRole;
};
