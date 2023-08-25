import { NextFunction, Request, Response } from 'express';
import { message } from '../utilities/constants/index.ts';
import Redis from '../config/redis/index.ts';
import { permissions, RoleType } from '../models/permission.ts';
import { getAll } from '../services/permissionsService.ts';
import { AsyncResponse } from '../models/type.ts';
import { Permissions } from '@prisma/client';

const redisKey = 'permissions';
export const getAllPermission = async (
  req: Request,
  res: Response
): Promise<any> => {
  try {
    const roleName = (req as any)?.user?.role?.name as RoleType;
    const data = await Redis.get(`${roleName}-permissions`);
    if (!data) {
      const userPermission = permissions[roleName];
      await Redis.set(
        `${roleName}-permissions`,
        JSON.stringify(userPermission)
      );
      return res.status(200).json({ data: userPermission });
    }
    return res.status(200).json({ data: JSON.parse(data) });
  } catch (error) {
    return res.status(500).json({
      message: message.INTERNAL_SERVER_ERROR,
      error
    });
  }
};

export const getPermissions = async (
  _: Request,
  res: Response,
  next: NextFunction
): Promise<AsyncResponse<Permissions[]> | void> => {
  try {
    let data: Permissions[];
    const redisData = await Redis.get(redisKey);
    if (redisData) {
      data = JSON.parse(redisData);
    }
    data = await getAll();
    return res.status(200).json({ data });
  } catch (error) {
    return next(error);
  }
};

export const getPermissionById = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<AsyncResponse<Permissions> | void> => {
  try {
    const { id } = req.params;
    const redisData = await Redis.get(redisKey);
    let data: Permissions;
    // if (redisData) {
    //   const permissions = JSON.parse(redisData);
    //   data = permissions.find((item: Permissions) => item.id === id);
    // }
    // data = await getAll();
    // data = data.find((item: Permissions) => item.id === id);
    // return res.status(200).json({ data });
  } catch (error) {
    return next(error);
  }
};
