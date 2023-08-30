import { NextFunction, Request, Response } from 'express';
import Redis, { removeRedisKeys } from '../config/redis/index.ts';
import { defaultPermission } from '../models/permission.ts';
import { message } from '../utilities/constants/index.ts';
const redisKey = 'permissions';

export const getPermission = async (
  _: Request,
  res: Response,
  next: NextFunction
): Promise<any> => {
  try {
    const redisData = await Redis.get(redisKey);
    let data = {};
    if (redisData) {
      data = JSON.parse(redisData);
    } else {
      data = defaultPermission;
      await Redis.set(redisKey, JSON.stringify(data));
    }
    return res.status(200).json({ data, message: message.SUCCESS });
  } catch (error) {
    return next(error);
  }
};

export const updatePermission = async (
  _: Request,
  res: Response,
  next: NextFunction
): Promise<any> => {
  try {
    await removeRedisKeys('roles');
    await Redis.set(redisKey, JSON.stringify(defaultPermission));

    return res
      .status(200)
      .json({ data: defaultPermission, message: message.SUCCESS });
  } catch (error) {
    return next(error);
  }
};
