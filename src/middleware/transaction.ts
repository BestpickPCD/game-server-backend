import { Response, NextFunction } from 'express';
import { PrismaClient, Prisma } from '@prisma/client';
import { RequestWithUser, balanceSummary } from '../models/customInterfaces.ts';
const prisma = new PrismaClient();

export const Transaction = async (
  req: RequestWithUser,
  res: Response,
  next: NextFunction
): Promise<any> => {
  try {
    if (!req.user) {
      return res.status(404).json({ message: 'User not found' });
    }

    const rawQuery = Prisma.sql`
        SELECT
          IFNULL(sender.out, 0) AS \`out\`,
          IFNULL(receiver.in, 0) AS \`in\`,
          IFNULL(gameResult.gameOut, 0) AS gameOut,
          IFNULL((IFNULL(receiver.in, 0) - IFNULL(sender.out, 0) - IFNULL(gameResult.gameOut, 0)), 0) AS balance
        FROM Users
        LEFT JOIN (
          SELECT SUM(IFNULL(amount, 0)) AS \`out\`, senderId AS id
          FROM Transactions
          WHERE TYPE IN ('add', 'lose', 'charge', 'bet') AND senderId = ${req.user.id}
          GROUP BY senderId
        ) AS sender ON sender.id = Users.id
        LEFT JOIN (
          SELECT SUM(IFNULL(amount, 0)) AS \`in\`, receiverId AS id
          FROM Transactions
          WHERE TYPE IN ('add', 'win') AND receiverId = ${req.user.id}
          GROUP BY receiverId
        ) AS receiver ON receiver.id = Users.id
        LEFT JOIN (
          SELECT SUM(IFNULL(amount, 0)) AS gameOut, receiverId AS id
          FROM Transactions
          WHERE TYPE IN ('lose', 'charge') AND receiverId = ${req.user.id}
          GROUP BY receiverId
        ) AS gameResult ON gameResult.id = Users.id
        WHERE Users.id = ${req.user.id};`;

    const balanceSummary = (await prisma.$queryRaw(rawQuery)) as balanceSummary;

    // eslint-disable-next-line no-param-reassign
    req.balanceSummary = balanceSummary;

    return next();
  } catch (error) {
    console.log(error);
    return res.status(500).json({ message: error });
  }
};
