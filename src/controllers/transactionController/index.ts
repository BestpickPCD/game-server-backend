import { PrismaClient, Users, Prisma } from '@prisma/client';
import { Request, Response } from 'express';
import { RequestWithUser } from '../../models/customInterfaces.ts';
import { message } from '../../utilities/constants/index.ts';
import { checkTransactionType } from './transactionTypes.ts';
import { arrangeTransactionDetails, arrangeTransactions } from './utilities.ts';
const prisma = new PrismaClient();

export const getTransactions = async (
  req: Request,
  res: Response
): Promise<any> => {
  try {
    const {
      page = 0,
      size = 10,
      dateFrom,
      dateTo,
      agentId,
      type,
      gameId,
      search
    } = req.query;
    const { id } = (req as any).user;

    const filterParentAgentIds = {
      parentAgentIds: {
        array_contains: [Number(id)]
      }
    };

    const orFilter: any = {
      Agents: {
        ...(!agentId && !Number(agentId)
          ? {
              id: agentId,
              ...filterParentAgentIds
            }
          : { ...filterParentAgentIds })
      }
    };

    const filter: Prisma.TransactionsFindManyArgs = {
      select: {
        id: true,
        senderId: true,
        receiverId: true,
        amount: true,
        type: true,
        status: true,
        updatedAt: true,
        sender: {
          select: {
            name: true,
            username: true
          }
        },
        receiver: {
          select: {
            name: true,
            username: true
          }
        }
      },
      where: {
        deletedAt: null,
        OR: [
          {
            sender: orFilter
          },
          {
            receiver: orFilter
          }
        ],
        AND: {
          ...(type && { type: String(type) }),
          ...(gameId && { gameId: Number(gameId) }),
          OR: [
            {
              receiver: {
                name: {
                  contains: String(search)
                }
              }
            },
            {
              sender: {
                name: {
                  contains: String(search)
                }
              }
            }
          ]
        },
        updatedAt: {
          gte: (dateFrom as string) || '1970-01-01T00:00:00.000Z',
          lte: (dateTo as string) || '2100-01-01T00:00:00.000Z'
        }
      },
      orderBy: {
        updatedAt: 'desc'
      },
      skip: Number(page) * Number(size),
      take: Number(size)
    };

    const [transactions, count] = await prisma.$transaction([
      prisma.transactions.findMany(filter),
      prisma.transactions.count({
        where: filter.where
      })
    ]);
    return res.status(200).json({
      message: message.SUCCESS,
      data: {
        data: transactions,
        page: Number(page),
        size: Number(size),
        totalItems: Number(count)
      }
    });
  } catch (error) {
    return res.status(500).json({ message: 'Something went wrong', error });
  }
};

export const addTransaction = async (
  req: RequestWithUser,
  res: Response
): Promise<any> => {
  try {
    const {
      // senderId,
      receiverId,
      type,
      note,
      token,
      status,
      amount,
      currencyId,
      gameId
    } = req.body;

    const { id: senderId } = (req as any).user;
    const data: any = { type, note, token, status, amount, gameId };

    const sender = await prisma.users.findUnique({
      where: {
        id: (req as any).user.id
      }
    });
    if ((sender as Users).type == 'player' && type == 'add') {
      return res
        .status(400)
        .json({ message: 'Users cannot add or transfer money' });
    }

    if (currencyId) {
      const currency = await prisma.currencies.findUnique({
        where: {
          id: currencyId
        }
      });
      if (!currency) {
        return res.status(404).json({
          message: message.NOT_FOUND,
          subMessage: 'Currency not found'
        });
      }
    }

    if (checkTransactionType(type)) {
      await prisma.transactions.create({
        data: {
          ...data,
          currencyId,
          updateUserId: Number(req?.user?.id),
          ...(senderId && { senderId }),
          ...(receiverId && { receiverId })
        }
      });

      return res
        .status(201)
        .json({ message: 'Transaction created successfully' });
    }
    return res.status(400).json({ message: 'Transaction type does not exist' });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ message: 'Something went wrong', error });
  }
};

export const getTransactionDetailsByUserId = async (
  req: Request,
  res: Response
): Promise<any> => {
  try {
    const userId = parseInt(req.params.userId);
    const transactions = (await prisma.transactions.findMany({
      where: {
        OR: [{ senderId: userId }, { receiverId: userId }]
      },
      orderBy: {
        createdAt: 'asc'
      },
      select: {
        receiver: {
          select: {
            id: true,
            username: true,
            type: true
          }
        },
        sender: {
          select: {
            id: true,
            username: true,
            type: true
          }
        },
        updatedUser: {
          select: {
            id: true,
            username: true,
            type: true
          }
        },
        amount: true,
        gameId: true,
        type: true,
        note: true,
        status: true,
        createdAt: true
      }
    })) as any;

    const userDetails = await arrangeTransactionDetails(transactions, userId);
    res.status(200).json(userDetails);
  } catch (error) {
    console.log(error);
    res.status(500).json(error);
  }
};

export const getTransactionDetail = async (
  req: Request,
  res: Response
): Promise<any> => {
  const { id } = req.params;
  const { id: userId } = (req as any).user;
  //* check userId of transaction is in senderId or receiverId to avoid exceptions
  const transaction = await prisma.transactions.findUnique({
    select: {
      id: true,
      amount: true,
      token: true,
      receiverId: true,
      senderId: true,
      note: true,
      type: true,
      status: true,
      updatedAt: true,
      createdAt: true,
      currencyId: true,
      receiver: {
        select: {
          name: true
        }
      },
      sender: {
        select: {
          name: true
        }
      }
    },
    where: {
      id: Number(id),
      OR: [{ senderId: userId }, { receiverId: userId }]
    }
  });
  if (!transaction) {
    return res.status(404).json({ message: message.NOT_FOUND });
  }
  return res.status(200).json({ message: message.SUCCESS, data: transaction });
};

export const getTransactionsView = async (
  _: Request,
  res: Response
): Promise<any> => {
  try {
    const transactions = (await prisma.transactions.findMany({
      where: { deletedAt: null },
      orderBy: { createdAt: 'asc' },
      select: {
        receiver: {
          select: {
            id: true,
            username: true,
            type: true
          }
        },
        sender: {
          select: {
            id: true,
            username: true,
            type: true
          }
        },
        updatedUser: {
          select: {
            id: true,
            username: true,
            type: true
          }
        },
        id: true,
        amount: true,
        gameId: true,
        type: true,
        note: true,
        status: true,
        createdAt: true
      }
    })) as any;
    const details = await arrangeTransactions(transactions);
    return res.render('transactions', { data: details });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ message: 'Something went wrong', error });
  }
};

export const getTransactionDetailsByUserIdView = async (
  req: Request,
  res: Response
): Promise<any> => {
  try {
    const userId = parseInt(req.params.userId);
    const transactions = (await prisma.transactions.findMany({
      where: {
        OR: [{ senderId: userId }, { receiverId: userId }]
      },
      orderBy: {
        createdAt: 'asc'
      },
      select: {
        receiver: {
          select: {
            id: true,
            username: true,
            type: true
          }
        },
        sender: {
          select: {
            id: true,
            username: true,
            type: true
          }
        },
        updatedUser: {
          select: {
            id: true,
            username: true,
            type: true
          }
        },
        amount: true,
        gameId: true,
        type: true,
        note: true,
        status: true,
        createdAt: true
      }
    })) as any;

    const userDetails = await arrangeTransactionDetails(transactions, userId);
    res.render('transactionDetails', { data: userDetails });
  } catch (error) {
    res.status(500).json(error);
  }
};

// export const getBalance = async (req: Request, res: Response) => {
//   const userId = parseInt(req.params.userId);
//   try {
//     const depositQuery = prisma.transactions.aggregate({
//       _sum: { amount: true },
//       where: { action: 1, userId }
//     });

//     const withdrawQuery = prisma.transactions.aggregate({
//       _sum: { amount: true },
//       where: { action: 2, userId }
//     });

//     const [depositResult, withdrawResult] = await prisma.$transaction([
//       depositQuery,
//       withdrawQuery
//     ]);

//     const depositAmount = depositResult._sum?.amount ?? 0;
//     const withdrawAmount = withdrawResult._sum?.amount ?? 0;
//     const balance = Number(depositAmount) - Number(withdrawAmount);

//     return res.status(200).json({
//       totalDepositAmount: Number(depositAmount),
//       totalWithdrawAmount: Number(withdrawAmount),
//       balance
//     });
//   } catch (error) {
//     console.error(error);
//     return res.status(500).json({ error: 'Unable to fetch balance' });
//   }
// };
