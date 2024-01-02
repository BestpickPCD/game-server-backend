import { NextFunction, Response } from 'express';
import jwt, { JwtPayload } from 'jsonwebtoken';
import { PrismaClient } from '../config/prisma/generated/base-default/index.js';
import redisClient from '../config/redis/index.ts';
import { RequestWithUser } from '../models/customInterfaces.ts';
import bcrypt from 'bcrypt';

const prisma = new PrismaClient();
const ACCESS_TOKEN_KEY = process.env.ACCESS_TOKEN_KEY ?? '';
const REFRESH_TOKEN_KEY = process.env.REFRESH_TOKEN_KEY ?? '';

const message = {
  KEY_NOT_VALID: 'Key is not valid',
  TOKEN_NOT_VALID: 'Token is not valid',
  TOKEN_MISSING: 'Token is missing',
  TOKEN_EXPIRED: 'Token is expired'
};

const verifyToken = async (key: string, secretKey: string) => {
  return (await jwt.verify(key, secretKey)) as Promise<{ userId: string }>;
};

const findUser = async (id: string) => {

  const user = await prisma.users.findUnique({
    select: {
      id: true,
      name: true,
      email: true,
      apiKey: true,
      roleId: true,
      currencyId: true,
      parentAgentId: true,
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
    try {
      if (req.body?.refreshToken) {
        const { userId } = (await verifyToken(
          req.body?.refreshToken,
          REFRESH_TOKEN_KEY
        )) as JwtPayload;
        const user = await findUser(String(userId));
        (req as any).user = user;
        return next();
      }
      return res.status(401).json({
        data: null,
        message: error.message,
        subMessage: 'UNAUTHORIZED'
      });
    } catch (error: any) {
      return res.status(401).json({
        data: null,
        message: error.message,
        subMessage: 'UNAUTHORIZED'
      });
    }
  }
};

export const keyApi = async (
  req: RequestWithUser,
  res: Response,
  next: NextFunction
): Promise<any> => {
  try {
    const apiKey = String(req?.header('api-key'));

    if(!apiKey) {
      throw new Error(message.TOKEN_MISSING);
    }

    const { userId } = req.body;
    const result = await bcrypt.compare(userId, apiKey);
    if(!result) {
      throw new Error(message.TOKEN_NOT_VALID);
    }
    const user = await findUser(String(userId)); 
    (req as any).user = user;
    
    next();

  } catch (error: any) {
    return res.status(401).json({
      data: null,
      message: error.message,
      subMessage: 'UNAUTHORIZED'
    });
  }
}