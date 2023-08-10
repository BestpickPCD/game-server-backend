import { PrismaClient } from '@prisma/client';
import { NextFunction, Response } from 'express';
import jwt, { JwtPayload } from 'jsonwebtoken';
import { RequestWithUser } from '../models/customInterfaces.ts';

const prisma = new PrismaClient();
const ACCESS_TOKEN_KEY = process.env.ACCESS_TOKEN_KEY ?? '';

export const authentication = async (
  req: RequestWithUser,
  res: Response,
  next: NextFunction
): Promise<any> => {
  try {
    if (!ACCESS_TOKEN_KEY) {
      return res.status(500).json({ message: 'No token' });
    }

    const token = req.header('Authorization')?.replace('Bearer ', '');
    if (!token) {
      return res.status(401).json({ message: 'Unauthorized' });
    }

    try {
      const decoded = (await jwt.verify(token, ACCESS_TOKEN_KEY)) as JwtPayload;

      const user = await prisma.users.findUnique({
        select: {
          id: true,
          name: true,
          email: true,
          username: true,
          type: true,
          apiKey: true,
          roleId: true,
          currencyId: true,
          isActive: true,
          role: true
        },
        where: {
          id: decoded.userId
        }
      });

      if (!user) {
        return res.status(401).json({ message: 'User not found' });
      }

      // eslint-disable-next-line no-param-reassign
      (req as any).user = user;

      return next();
    } catch (error) {
      console.log(error);
      return res.status(401).json({ message: 'Invalid token' });
    }
  } catch (error) {
    console.log(error);
    return res.status(500).json({ message: 'No token ' });
  }
};
