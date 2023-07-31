import { PrismaClient } from '@prisma/client';
import { Request, Response, NextFunction } from 'express';
import jwt, { JwtPayload } from 'jsonwebtoken';

const prisma = new PrismaClient();
const ACCESS_TOKEN_KEY = process.env.ACCESS_TOKEN_KEY || '';

export const authentication = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  if (!ACCESS_TOKEN_KEY) {
    return res.status(500).json({ message: 'No token' });
  }

  try {
    const token = req.header('Authorization')?.replace('Bearer ', ''); 
    if (!token) {
return res.status(401).json({ message: 'Unauthorized' });
}
    
    try {
      const decoded = (await jwt.verify(token, ACCESS_TOKEN_KEY)) as JwtPayload;
      // Fetch the user from the database using Prisma
      const user = await prisma.users.findUnique({
        select: {
          id: true,
          name: true,
          type: true,
          username: true,
          createdAt: true,
          updatedAt: true
        },
        where: { id: decoded.userId }
      });

      if (!user) {
        return res.status(401).json({ message: 'User not found' });
      }

      // eslint-disable-next-line no-param-reassign
      (req as any).user = user;
      return next();
    } catch (error) {
      return res.status(401).json({ message: 'Invalid token' });
    }
  } catch (error) {
    return res.status(500).json({ message: 'No token ' });
  }
};
