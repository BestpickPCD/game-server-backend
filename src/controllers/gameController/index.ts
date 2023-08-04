import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();
import { Request, Response } from 'express';


export const getGameVendors = async (_: Request, res: Response): Promise<any> => { 
  try {
    const transactions = await prisma.transactions.findMany({
      where: { deletedAt: null },
      orderBy: { createdAt: 'asc' }
    });

    return res
      .status(200)
      .json({ message: 'Transactions retrieved successfully', transactions });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ message: 'Something went wrong', error });
  }
};