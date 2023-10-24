import {
  PrismaClient,
  TransactionLimits,
  Users
} from '../../config/prisma/generated/base-default/index.js';
const prisma = new PrismaClient();
import { Request, Response } from 'express';
import { RequestWithUser } from '../../models/customInterfaces.ts';
import { message } from '../../utilities/constants/index.ts';
import { checkTransactionType } from './transactionTypes.ts';
import { checkTransferAbility, recalculateBalance, updateBalance } from './utilities.ts';
import Redis, { getRedisData } from '../../config/redis/index.ts';
import {
  create,
  getAllById,
  getByIdWithType,
  getDetailsById
} from '../../services/transactionsService.ts';
import { CallbackTransactions, PrismaClient as PrismaClientTransaction, Transactions } from '../../config/prisma/generated/transactions/index.js';
import { BAD_REQUEST } from '../../core/error.response.ts';
import { Decimal } from '../../config/prisma/generated/base-default/runtime/library';

const prismaTransaction = new PrismaClientTransaction();

interface usernameIds {
  id: string,
  parentAgentId: string,
  username: string,
  balance: Decimal | null;
  parent: {
    username: string,
    id: string
  } | null
}

export const getTransactions = async (
  req: Request,
  res: Response
): Promise<any> => {
  try {
    const { id } = (req as any).user;
    const data = (await getAllById(req.query, id)) as any;

    const { transactions, count, page, size } = data;

    return res.status(200).json({
      message: message.SUCCESS,
      data: {
        data: transactions,
        page: Number(page || 0),
        size: Number(size || 10),
        totalItems: Number(count)
      }
    });
  } catch (error) {
    return res
      .status(500)
      .json({ message: message.INTERNAL_SERVER_ERROR, error });
  }
};

export const getBalance = async (
  req: Request,
  res: Response
) => {
  try {
    const { username } = req.query;
    if (!username) {
      throw new BAD_REQUEST(message.INVALID_CREDENTIALS);
    } else {
      const { balance } = await prisma.users.findUnique({
        where: {
          username: username as string
        }
      }) as Users;

      return res.status(200).json({ balance });
    }
  } catch (error) {
    throw new BAD_REQUEST(message.INVALID_CREDENTIALS);
  }
}

// Seamless method
export const changeBalance = async (
  req: Request,
  res: Response
) => {
  try {
    const { username, amount, transaction } = req.body;
    const data = { username, amount, transaction } as CallbackTransactions;
    try {
      const { username, amount, transaction, id: callbackId } = await prismaTransaction.callbackTransactions.create({ data }) as CallbackTransactions;

      if(username) {

        let user
        user = await prisma.users.findUnique({
          where: {
            username
          },
          select: {
            id: true,
            parentAgentId: true,
            username: true,
            balance: true,
            parent: {
              select: {
                id: true,
                username: true
              }
            }
          }
        }) as usernameIds;

        if(!user) {
          user = await prisma.users.create({
            data: {
              username,
              name: username,
              type: "player",
              balance: (transaction as any)?.target?.balance ?? 0
            },
            select: {
              id: true,
              parentAgentId: true,
              username: true,
              balance: true,
              parent: {
                select: {
                  id: true,
                  username: true
                }
              }
            }
          }) as usernameIds;
        }

        const data = {
          userId: user.id,
          callbackId,
          username: username,
          agentId: user.parentAgentId ? user.parentAgentId : null,
          agentUsername: user?.parent?.username ? user?.parent?.username : null,
          type: (transaction as any).type,
          amount,
          method: "seamless",
          updateBy: "seamless",
        }

        const { type, agentId } = await create(data) as Transactions;
        await updateBalance(data.userId, amount, type, agentId, data.method );

        if((user as any).balance === 0) {
          try {
            await recalculateBalance(data.userId);
          } catch (error) {
            throw new BAD_REQUEST(message.FAILED);
          }
        }

        return res.status(200).json({message: "SUCCESS_CALLBACK"});

      }

      return res.status(200).json({message: "CALLBACK_STAMPLED"})

    } catch (error) {
      throw new BAD_REQUEST(message.FAILED);
    }
  } catch (error) {
    return res.status(500).json({ message: message.INTERNAL_SERVER_ERROR, error });
  }
};

// Transfer method
export const addTransaction = async (
  req: RequestWithUser,
  res: Response
): Promise<any> => {
  try {
    const { id: userSessionId } = req.user as Users;
    const { userId, type: transactionType, amount, currencyCode, agentId: parentId } = req.body;

    if(transactionType === 'user.add_balance' && !(await checkTransferAbility(parentId, userId))) {
      return res.status(500).json({ message: `The transfer cannot be made.` });
    }

    const { parentAgentId, parent, username } = await prisma.users.findUnique({
      where: {
        id: userId
      },
      select: {
        id: true,
        parentAgentId: true,
        username: true,
        balance: true,
        parent: {
          select: {
            id: true,
            username: true
          }
        }
      }
    }) as usernameIds

    const data = {
      userId,
      username,
      agentId:  parentAgentId ?? null,
      agentUsername: parent?.username ?? null,
      type: transactionType,
      amount,
      currencyCode: currencyCode ?? null,
      method: "transfer",
      updateBy: userSessionId ?? null,
    }
    const { type, agentId } = await create(data) as Transactions;
    const { balance } = await updateBalance(userId, amount, type, agentId, data.method );

    return res
      .status(201)
      .json({ message: 'Transaction created successfully', balance });

  } catch (error) {
    return res
      .status(500)
      .json({ message: message.INTERNAL_SERVER_ERROR, error });
  }
};

export const getTransactionDetailsByUserId = async (
  req: Request,
  res: Response
): Promise<any> => {
  try {
    const { username } = req.params;
    const type = req.query.type as string;
    let arrayTypes: string[];
    if (type) {
      arrayTypes = type.split(',');
    } else {
      arrayTypes = [];
    }
    const data = (await getByIdWithType(username, arrayTypes)) as any;
    return res.status(200).json(data);
  } catch (error) {
    return res.status(500).json({
      message: message.INTERNAL_SERVER_ERROR
    });
  }
};

export const getTransactionDetail = async (
  req: Request,
  res: Response
): Promise<any> => {
  try {
    const { id } = req.params;
    const { id: userId } = (req as any).user;
    const data = (await getDetailsById(id, userId)) as any;

    return res.status(200).json({ message: message.SUCCESS, data });
  } catch (error: any) {
    if (error.message) {
      return res.status(404).json({ message: error.message });
    }
    return res.status(500).json({ message: message.INTERNAL_SERVER_ERROR });
  }
};

export const landingPage = async (_: Request, res: Response): Promise<any> => {
  try {
    return res.render('landingPage');
  } catch (error) {
    console.log(error);
  }
};

export const getBetLimitations = async (req: Request, res: Response) => {
  try {
    const { id: userId } = (req as any).user;
    const { page, size, search, type } = req.query;

    const filter = {
      agentId: userId,
      type: type,
      page: page,
      size: size,
      search: search
    };

    const betLimits = (await prisma.transactionLimits.findMany({
      where: filter
    })) as TransactionLimits[];

    return res.status(200).json({ data: betLimits });
  } catch (error: any) {
    if (error.message) {
      return res.status(404).json({ message: error.message });
    }
    return res.status(500).json({ message: message.INTERNAL_SERVER_ERROR });
  }
};

export const getBetLimitById = async (req: Request, res: Response) => {
  try {
    const { id: userId } = (req as any).user;
    const { id } = req.params;

    const betLimit = (await prisma.transactionLimits.findUnique({
      where: {
        id: parseInt(id),
        agentId: userId
      }
    })) as TransactionLimits;

    return res.status(200).json({ data: betLimit });
  } catch (error: any) {
    if (error.message) {
      return res.status(404).json({ message: error.message });
    }
    return res.status(500).json({ message: message.INTERNAL_SERVER_ERROR });
  }
};

export const addBetLimit = async (req: Request, res: Response) => {
  try {
    const { id: userId } = (req as any).user;

    const { limitType, limitTypeId, limit } = req.body;
    const data = {
      agentId: userId,
      limitType,
      limitTypeId,
      limit
    } as {
      agentId: string;
      limitType: string;
      limitTypeId: string;
      limit: number;
    };

    const response = (await prisma.transactionLimits.create({
      data
    })) as TransactionLimits;
    if (Object.keys(response).length != 0) {
      return res.status(200).json({ response });
    }

    throw new Error('An error occurred. No transaction limit added');
  } catch (error: any) {
    if (error.message) {
      return res.status(404).json({ message: error.message });
    }
    return res.status(500).json({ message: message.INTERNAL_SERVER_ERROR });
  }
};

export const updateBetLimit = async (req: Request, res: Response) => {
  try {
    const { id: userId } = (req as any).user;
    const { id } = req.params;
    req.body.agentId = userId;
    const data = req.body;

    const update = (await prisma.transactionLimits.update({
      where: {
        id: parseInt(id),
        agentId: userId
      },
      data
    })) as TransactionLimits;

    if (Object.keys(update).length != 0)
      return res.status(200).json({ data: userId });

    throw new Error('An error occurred. No transaction limit updated');
  } catch (error: any) {
    if (error.message) {
      return res.status(404).json({ message: error.message });
    }
    return res.status(500).json({ message: message.INTERNAL_SERVER_ERROR });
  }
};

export const deleteBetLimit = async (req: Request, res: Response) => {
  try {
    const { id: userId } = (req as any).user;
    const { id } = req.params;

    try {
      await prisma.transactionLimits.delete({
        where: {
          agentId: userId,
          id: parseInt(id)
        }
      });

      return res.status(200).json({ message: 'Deleted' });
    } catch (error) {
      throw new Error('An error occurred. No transaction limit deleted');
    }
  } catch (error: any) {
    if (error.message) {
      return res.status(404).json({ message: error.message });
    }
    return res.status(500).json({ message: message.INTERNAL_SERVER_ERROR });
  }
};
