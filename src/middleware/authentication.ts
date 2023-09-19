import { NextFunction, Response } from 'express';
import jwt, { JwtPayload } from 'jsonwebtoken';
import { PrismaClient } from '../config/prisma/generated/base-default/index.js';
import redisClient from '../config/redis/index.ts';
import { UNAUTHORIZED } from '../core/error.response.ts';
import { RequestWithUser } from '../models/customInterfaces.ts';

const prisma = new PrismaClient();
const ACCESS_TOKEN_KEY = process.env.ACCESS_TOKEN_KEY ?? '';
const REFRESH_TOKEN_KEY = process.env.REFRESH_TOKEN_KEY ?? '';

const message = {
  KEY_NOT_VALID: 'Key is not valid',
  TOKEN_NOT_VALID: 'Token is not valid',
  TOKEN_MISSING: 'Token is missing',
  TOKEN_EXPIRED: 'Token is expired'
};

export const verifyToken = async (key: string, secretKey: string) => {
  return (await jwt.verify(key, secretKey)) as Promise<{ userId: string }>;
};

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
  _: Response,
  next: NextFunction
): Promise<any> => {
  try {
    if (!ACCESS_TOKEN_KEY) {
      throw new Error(message.KEY_NOT_VALID);
    }

    const token = String(req?.header('Authorization')).split(' ')[1];
    if (!token) {
      throw new Error(message.TOKEN_MISSING);
    }

    const { userId } = await verifyToken(token, ACCESS_TOKEN_KEY);
    const result = await redisClient.get(`user-${userId}-tokens`);
    const parsedResult = JSON.parse(result ?? '');

    if (parsedResult) {
      if (parsedResult.tokens.accessToken !== token) {
        throw new Error(message.TOKEN_EXPIRED);
      }
      (req as any).user = parsedResult;
      return next();
    }
    throw new Error(message.TOKEN_NOT_VALID);
  } catch (error: any) {
    if (req.body?.refreshToken) {
      const { userId } = (await verifyToken(
        req.body?.refreshToken,
        REFRESH_TOKEN_KEY
      )) as JwtPayload;
      const user = await findUser(Number(userId));
      (req as any).user = user;
      return next();
    }
    return next(new UNAUTHORIZED(error.message));
  }
};
