import { Roles } from '@prisma/client';
import { NextFunction, Request, Response } from 'express';
import Redis from '../config/redis/index.ts';
import { AsyncResponse } from '../models/type.ts';
import {
  create,
  deleteRole as deleteRoleService,
  getAll,
  getById,
  update
} from '../services/roleService.ts';
import { message } from '../utilities/constants/index.ts';

const redisKey = 'roles';
const INVALID = 'Invalid Role Id';
export const getRoles = async (
  _: Request,
  res: Response,
  next: NextFunction
): Promise<AsyncResponse<Roles[]> | void> => {
  try {
    const redisData = await Redis.get(redisKey);
    let data = [];
    if (redisData) {
      data = JSON.parse(redisData);
    }
    data = await getAll();
    await Redis.set(redisKey, JSON.stringify(data));
    return res.status(200).json({
      data,
      message: message.SUCCESS
    });
  } catch (error) {
    return next(error);
  }
};

export const getRolesById = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<AsyncResponse<Roles> | void> => {
  try {
    const { id } = req.params;
    if (!Number(id)) {
      throw Error(INVALID);
    }
    const redisKeyWithId = `${redisKey}-${id}`;
    const redisData = await Redis.get(redisKeyWithId);
    let data: Roles;
    if (redisData) {
      data = JSON.parse(redisData);
    }
    data = await getById({
      id: Number(id)
    });
    !redisData && (await Redis.set(redisKeyWithId, JSON.stringify(data)));
    return res.status(200).json({
      data,
      message: message.SUCCESS
    });
  } catch (error) {
    return next(error);
  }
};

export const addRole = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<AsyncResponse<Roles> | void> => {
  try {
    const { name, permissions } = req.body;
    const newRoles = await create(name, permissions);
    if (await Redis.get(redisKey)) {
      await Redis.lpush(redisKey, JSON.stringify(newRoles));
    }
    return res.status(201).json({ data: newRoles, message: message.CREATED });
  } catch (error) {
    return next(error);
  }
};

export const updateRole = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<any> => {
  try {
    const { roleId } = req.params;
    const { name = '', permissions = [] } = req.body;
    if (!Number(roleId)) {
      throw Error(INVALID);
    }
    const updatedRole = await update(Number(roleId), name, permissions);
    const redisData = await Redis.get(redisKey);
    if (redisData) {
      const parseRedisData = JSON.parse(redisData) as Roles[];
      const updatedRedisData = parseRedisData.map((role: Roles) => {
        if (role.id === Number(roleId)) {
          return updatedRole;
        }
        return role;
      });
      await Redis.set(redisKey, JSON.stringify(updatedRedisData));
    }
    const redisKeyWithId = `${redisKey}-${roleId}`;
    const redisDataById = await Redis.get(redisKeyWithId);
    if (redisDataById) {
      await Redis.set(redisKeyWithId, JSON.stringify(updatedRole));
    }
    return res
      .status(200)
      .json({ data: updatedRole, message: message.UPDATED });
  } catch (error) {
    return next(error);
  }
};

export const deleteRole = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<AsyncResponse<null> | void> => {
  try {
    const { roleId } = req.params;
    if (!Number(roleId)) {
      throw Error(INVALID);
    }
    await deleteRoleService(Number(roleId));
    const redisData = await Redis.get(redisKey);
    if (redisData) {
      const parseRedisData = JSON.parse(redisData) as Roles[];
      const deleteRedisData = parseRedisData.filter(
        (role: Roles) => role.id !== Number(roleId)
      );
      await Redis.set(redisKey, JSON.stringify(deleteRedisData));
    }
    const redisKeyWithId = `${redisKey}-${roleId}`;
    const redisDataById = await Redis.get(redisKeyWithId);
    if (redisDataById) {
      await Redis.del(redisKeyWithId);
    }
    return res.status(200).json({ message: message.DELETED });
  } catch (error) {
    return next(error);
  }
};
