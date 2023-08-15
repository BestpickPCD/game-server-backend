// eslint-disable-next-line @typescript-eslint/ban-ts-comment
// @ts-nocheck
import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();
import { Request, Response } from 'express';

export const getTransactions = async (_: Request, res: Response) => {
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

export const addTransaction = async (req: Request, res: Response) => {
  try {
    const {
      senderId,
      receiverId,
      type,
      note,
      token,
      status,
      amount,
      currencyId
    } = req.body;
    const data = {
      type,
      note,
      token,
      status,
      amount,
      sender: {
        connect: { id: senderId }
      },
      receiver: {
        connect: { id: receiverId }
      },
      currency: {
        connect: { id: currencyId }
      },
      updatedUser: {
        connect: { id: req.userId ? req.userId : 1 }
      }
    };

    await prisma.transactions.create({
      data: data
    });

    return res
      .status(201)
      .json({ message: 'Transaction created successfully' });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ message: 'Something went wrong', error });
  }
};

export const getTransactionDetailsByUserId = async (
  req: Request,
  res: Response
) => {
  const transactions = await prisma.transactions.findMany({
    where: {
      OR: [
        { senderId: parseInt(req.params.userId) },
        { receiverId: parseInt(req.params.userId) }
      ]
    },
    orderBy: { id: 'asc' }
  });

  res.json(transactions);
};

export const getBalance = async (req: Request, res: Response) => {
  const userId = parseInt(req.params.userId);
  try {
    const depositQuery = prisma.transactions.aggregate({
      _sum: { amount: true },
      where: { action: 1, userId }
    });

    const withdrawQuery = prisma.transactions.aggregate({
      _sum: { amount: true },
      where: { action: 2, userId }
    });

    const [depositResult, withdrawResult] = await prisma.$transaction([
      depositQuery,
      withdrawQuery
    ]);

    const depositAmount = depositResult._sum?.amount ?? 0;
    const withdrawAmount = withdrawResult._sum?.amount ?? 0;
    const balance = Number(depositAmount) - Number(withdrawAmount);

    return res.status(200).json({
      totalDepositAmount: Number(depositAmount),
      totalWithdrawAmount: Number(withdrawAmount),
      balance
    });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ error: 'Unable to fetch balance' });
  }
};
