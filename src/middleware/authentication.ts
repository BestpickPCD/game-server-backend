import { PrismaClient, Prisma } from '@prisma/client';
import { Response, NextFunction } from 'express';
import jwt, { JwtPayload } from 'jsonwebtoken';
import { RequestWithUser } from "../models/customInterfaces.ts";

const prisma = new PrismaClient();
const ACCESS_TOKEN_KEY = process.env.ACCESS_TOKEN_KEY ?? '';

 
export const authentication = async (
  req: RequestWithUser,
  res: Response,
  next: NextFunction
): Promise<any> => {
  try {
    if (!ACCESS_TOKEN_KEY) {
      return res.status(500).json({ message: 'No token' })
    }

    const token = req.header('Authorization')?.replace('Bearer ', '');
    if (!token) {
      return res.status(401).json({ message: 'Unauthorized' });
    }
    
    try {
      const decoded = await jwt.verify(token, ACCESS_TOKEN_KEY) as JwtPayload; 
      const rawQuery = Prisma.sql`
        SELECT Users.*, sender.\`out\`, receiver.\`in\`, gameResult.gameOut, (receiver.\`in\` - sender.\`out\` - gameResult.gameOut) AS balance
        FROM Users
        LEFT JOIN (
            SELECT SUM(amount) AS \`out\`, senderId AS id
            FROM Transactions
            WHERE TYPE IN ('add', 'lose', 'charge', 'bet') AND senderId = ${decoded.userId}
            GROUP BY senderId
        ) AS sender ON sender.id = Users.id
        LEFT JOIN (
            SELECT SUM(amount) AS \`in\`, receiverId AS id
            FROM Transactions
            WHERE TYPE IN ('add', 'win') AND receiverId = ${decoded.userId}
            GROUP BY receiverId
        ) AS receiver ON receiver.id = Users.id
        LEFT JOIN (
            SELECT SUM(amount) AS gameOut, receiverId AS id
            FROM Transactions
            WHERE TYPE IN ('lose', 'charge') AND receiverId = ${decoded.userId}
            GROUP BY receiverId
        ) AS gameResult ON gameResult.id = Users.id
        WHERE Users.id = ${decoded.userId};`;
  
      const user = await prisma.$queryRaw(rawQuery) as any;

      if (!user) {
        return res.status(401).json({ message: 'User not found' });
      }

      // eslint-disable-next-line no-param-reassign
      req.user = user;
      
      return next();

    } catch (error) {
      console.log(error)
      return res.status(401).json({ message: 'Invalid token' });
    }
  } catch (error) {
    console.log(error)
    return res.status(500).json({ message: 'No token ' });
  }
};
 