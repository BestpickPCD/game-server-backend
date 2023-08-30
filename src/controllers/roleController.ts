import { Roles } from '@prisma/client';
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
import { message } from '../utilities/constants/index.ts';

const redisKey = 'roles';
const INVALID = 'Invalid Role Id';

export const getRoles = async (
  _: Request,
  res: Response,
  next: NextFunction
): Promise<AsyncResponse<Roles[]> | void> => {
  try {
    let data: Roles[] = [];
    const redisData = await Redis.get(redisKey);
    if (redisData) {
      data = JSON.parse(redisData);
    } else {
      data = await getAll();
      await Redis.set(redisKey, JSON.stringify(data));
    }
    return res.status(200).json({
      data: {
        data,
        page: 0,
        size: data.length,
        totalItems: data.length
      },
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
    const { roleId } = (req as any).user;
    const { id: roleIdUrl } = req.params;

    if (!Number(roleIdUrl || roleId)) {
      throw Error(INVALID);
    }
    const redisKeyWithId = `${redisKey}-${roleIdUrl || roleId}`;
    const redisData = await Redis.get(redisKeyWithId);
    let data: Roles;
    if (redisData) {
      data = JSON.parse(redisData);
    }
    data = (await getById({ id: Number(roleIdUrl || roleId) })) as Roles;
    !redisData && (await Redis.set(redisKeyWithId, JSON.stringify(data)));
    return res.status(200).json({ data, message: message.SUCCESS });
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
    const { name = '', permissions } = req.body;
    if (!Number(roleId)) {
      throw Error(INVALID);
    }
    const updatedRole = await update(Number(roleId), name, permissions);
    const redisKeyWithId = `${redisKey}-${roleId}`;
    const redisDataById = await Redis.get(redisKeyWithId);
    if (redisDataById) {
      await Redis.set(redisKeyWithId, JSON.stringify(updatedRole));
    }
    const redisData = await Redis.get(redisKey);
    if (redisData) {
      const updatedRedisData = await JSON.parse(redisData).map(
        (role: Roles) => {
          if (Number(role.id) === Number(roleId)) {
            return updatedRole;
          }
          return role;
        }
      );
      await Redis.set(redisKey, JSON.stringify(updatedRedisData));
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
    const redisKeyWithId = `${redisKey}-${roleId}`;
    await Redis.del(redisKeyWithId);
    const redisData = await Redis.get(redisKey);
    if (redisData) {
      const updatedRedisData = await JSON.parse(redisData).filter(
        (role: Roles) => Number(role.id) !== Number(roleId)
      );
      await Redis.set(redisKey, JSON.stringify(updatedRedisData));
    }
    return res.status(200).json({ message: message.DELETED });
  } catch (error) {
    return next(error);
  }
};
