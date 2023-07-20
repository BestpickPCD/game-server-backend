import { PrismaClient } from "@prisma/client";
const prisma = new PrismaClient();
import { Request, Response } from "express";

export const getTransactions = async (_: Request, res: Response) => {
  try {
    const transactions = await prisma.transactions.findMany({
      where: { deletedAt: null },
      orderBy: { createdAt: 'asc' }
    }); 
    return res.status(200).json({ message: 'Transactions retrieved successfully', transactions });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ message: 'Something went wrong', error });
  }
};

export const addTransaction = async (req: Request, res: Response) => {
  try {
    const { amount, type, currencyId, userId } = req.body;

    const newTransaction = await prisma.transactions.create({
      data: {
        amount,
        type,
        currencyId,
        userId,
      },
    });

    return res.status(201).json({ message: 'Transaction created successfully', transaction: newTransaction });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ message: 'Something went wrong', error });
  }
};
