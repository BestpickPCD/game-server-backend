import { Roles } from '../config/prisma/generated/base-default/index.js';
import { NextFunction, Request, Response } from 'express';
import Redis from '../config/redis/index.ts';
import { AsyncResponse } from '../models/type.ts';
import {
  create,
  deleteRole as deleteRoleService,
  getById,
  update,
  getAll
} from '../services/roleService.ts';
import { OK } from '../core/success.response.ts';
import { BAD_REQUEST } from '../core/error.response.ts';

const redisKey = 'roles';
const INVALID = 'Invalid Role Id';

const message = {
  GET_ALL: 'Get all roles success',
  GET_BY_ID: 'Get role success',
  CREATED: 'Create role success',
  UPDATED: 'Update role success',
  DELETED: 'Delete role success'
};

export const getRoles = async (
  _: Request,
  res: Response
): Promise<AsyncResponse<Roles[]> | void> => {
  let data: Roles[] = [];
  const redisData = await Redis.get(redisKey);
  if (redisData) {
    data = JSON.parse(redisData);
  } else {
    data = await getAll();
    await Redis.set(redisKey, JSON.stringify(data));
  }
  return new OK({ data, message: message.GET_ALL }).send(res);
};

export const getRolesById = async (
  req: Request,
  res: Response
): Promise<AsyncResponse<Roles> | void> => {
  const id = Number(req.params.id);
  const roleId = Number((req as any).user.roleId);

  if (!id || !roleId) {
    throw Error(INVALID);
  }

  const redisKeyWithId = `${redisKey}-${id || roleId}`;
  const redisData = await Redis.get(redisKeyWithId);
  let data: Roles;
  if (redisData) {
    data = JSON.parse(redisData);
  } else {
    data = (await getById(id)) as Roles;
  }
  data = (await getById(id)) as Roles;
  !redisData && (await Redis.set(redisKeyWithId, JSON.stringify(data)));
  return new OK({ data, message: message.GET_BY_ID }).send(res);
};

export const addRole = async (
  req: Request,
  res: Response
): Promise<AsyncResponse<Roles> | void> => {
  const { name, permissions } = req.body;
  if (!name) {
    throw Error('Name is required');
  }
  const newRoles = await create(name, permissions);
  const redisData = await Redis.get(redisKey);
  await Redis.set(`${redisKey}-${newRoles.id}`, JSON.stringify(newRoles));
  if (redisData) {
    const parseRedisData = JSON.parse(redisData);
    const updatedRedisData = [newRoles, ...parseRedisData];
    await Redis.set(redisKey, JSON.stringify(updatedRedisData));
  }
  return new OK({ data: newRoles, message: message.CREATED }).send(res);
};

export const updateRole = async (
  req: Request,
  res: Response
): Promise<AsyncResponse<Roles> | void> => {
  const { roleId } = req.params;
  const { name = '', permissions } = req.body;
  if (!Number(roleId)) {
    throw new BAD_REQUEST(INVALID);
  }
  const updatedRole = await update(Number(roleId), name, permissions);
  const redisKeyWithId = `${redisKey}-${roleId}`;
  const redisDataById = await Redis.get(redisKeyWithId);
  if (redisDataById) {
    await Redis.set(redisKeyWithId, JSON.stringify(updatedRole));
  }
  const redisData = await Redis.get(redisKey);
  if (redisData) {
    const updatedRedisData = await JSON.parse(redisData).map((role: Roles) => {
      if (Number(role.id) === Number(roleId)) {
        return updatedRole;
      }
      return role;
    });
    await Redis.set(redisKey, JSON.stringify(updatedRedisData));
  }

  return new OK({ data: updatedRole, message: message.UPDATED }).send(res);
};

export const deleteRole = async (
  req: Request,
  res: Response
): Promise<AsyncResponse<Roles> | void> => {
  const { roleId } = req.params;
  if (!Number(roleId)) {
    throw new BAD_REQUEST(INVALID);
  }
  await deleteRoleService(Number(roleId));
  const redisKeyWithId = `${redisKey}-${roleId}`;
  await Redis.del(redisKeyWithId);
  const redisData = await Redis.get(redisKey);
  if (redisData) {
    const updatedRedisData = await JSON.parse(redisData).filter(
      (role: Roles) => Number(role.id) !== Number(roleId)
    );
    await Redis.set(redisKey, JSON.stringify(updatedRedisData));
  }
  return new OK({ message: message.DELETED }).send(res);
};
