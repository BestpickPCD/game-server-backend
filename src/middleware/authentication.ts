import { PrismaClient } from '@prisma/client';
import { NextFunction, Response } from 'express';
import jwt, { JwtPayload } from 'jsonwebtoken';
import redisClient from '../config/redis/index.ts';
import { RequestWithUser } from '../models/customInterfaces.ts';
import { message } from '../utilities/constants/index.ts';

const prisma = new PrismaClient();
const ACCESS_TOKEN_KEY = process.env.ACCESS_TOKEN_KEY ?? '';
const REFRESH_TOKEN_KEY = process.env.REFRESH_TOKEN_KEY ?? '';

const findUser = async (id: number) => {
  const user = await prisma.users.findUnique({
    select: {
      id: true,
      name: true,
      email: true,
      apiKey: true,
      roleId: true,
      currencyId: true,
      isActive: true,
      username: true,
      type: true,
      role: true
    },
    where: {
      id
    }
  });
  return user;
};
export const authentication = async (
  req: RequestWithUser,
  res: Response,
  next: NextFunction
): Promise<any> => {
  if (!ACCESS_TOKEN_KEY) {
    return res.status(500).json({ message: 'No token' });
  }
  const token = req.header('Authorization')?.replace('Bearer ', '');
  try {
    if (!token) {
      return res.status(401).json({ message: 'Unauthorized' });
    }

    try {
      const decoded = (await jwt.verify(token, ACCESS_TOKEN_KEY)) as JwtPayload;
      const result = await redisClient.get(`user-${decoded.userId}-tokens`);
      const parsedResult = JSON.parse(result ?? '');
      if (parsedResult) {
        if (parsedResult.tokens.accessToken !== token) {
          return res.status(401).json({
            message: message.BAD_REQUEST,
            subMessage: 'Token is expired'
          });
        }
        // eslint-disable-next-line no-param-reassign
        req.user = parsedResult;
        return next();
      }
      const user = await findUser(Number(decoded.id));
      if (!user) {
        return res
          .status(401)
          .json({ message: message.NOT_FOUND, subMessage: 'User not found' });
      }
      // eslint-disable-next-line no-param-reassign
      (req as any).user = user;
      return next();
    } catch (error) {
      if (req.body?.refreshToken) {
        try {
          const decoded = (await jwt.verify(
            req.body?.refreshToken,
            REFRESH_TOKEN_KEY
          )) as JwtPayload;
          const user = await findUser(Number(decoded.userId));
          // eslint-disable-next-line no-param-reassign
          (req as any).user = user;
          return next();
        } catch (error) {
          return res.status(401).json({
            message: message.BAD_REQUEST,
            subMessage: 'Token is expired'
          });
        }
      }
      return res
        .status(401)
        .json({ message: message.BAD_REQUEST, subMessage: 'Token is expired' });
    }
  } catch (error) {
    return res.status(500).json({ message: message.INTERNAL_SERVER_ERROR });
  }
};
