import { Response, NextFunction } from 'express';
import { PrismaClient, Prisma } from '@prisma/client'
import { RequestWithUser } from "../models/customInterfaces.ts";
const prisma = new PrismaClient();

export const Transaction = async (req:RequestWithUser, res:Response, next: NextFunction): Promise<any> => {
    try {
        if(!req.user) {
            return res.status(404).json({message:'User not found'})
        }

        const rawQuery = Prisma.sql`
        SELECT sender.\`out\`, receiver.\`in\`, gameResult.gameOut, (receiver.\`in\` - sender.\`out\` - gameResult.gameOut) AS balance
        FROM Users
        LEFT JOIN (
            SELECT SUM(amount) AS \`out\`, senderId AS id
            FROM Transactions
            WHERE TYPE IN ('add', 'lose', 'charge', 'bet') AND senderId = ${req.user.id}
            GROUP BY senderId
        ) AS sender ON sender.id = Users.id
        LEFT JOIN (
            SELECT SUM(amount) AS \`in\`, receiverId AS id
            FROM Transactions
            WHERE TYPE IN ('add', 'win') AND receiverId = ${req.user.id}
            GROUP BY receiverId
        ) AS receiver ON receiver.id = Users.id
        LEFT JOIN (
            SELECT SUM(amount) AS gameOut, receiverId AS id
            FROM Transactions
            WHERE TYPE IN ('lose', 'charge') AND receiverId = ${req.user.id}
            GROUP BY receiverId
        ) AS gameResult ON gameResult.id = Users.id
        WHERE Users.id = ${req.user.id};`;
  
        const transactions = await prisma.$queryRaw(rawQuery) as any;

        // eslint-disable-next-line no-param-reassign
        req.transaction = transactions

        return next()
    } catch (error) {
        console.log(error)
        return res.status(500).json({})
    }
}