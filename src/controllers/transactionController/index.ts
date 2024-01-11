import { Request, Response } from 'express';
import {
  PrismaClient,
  TransactionLimits,
  Users
} from '../../config/prisma/generated/base-default/index.js';
import { Decimal } from '../../config/prisma/generated/base-default/runtime/library';
import {
  CallbackTransactions,
  PrismaClient as PrismaClientTransaction,
  Transactions
} from '../../config/prisma/generated/transactions/index.js';
import { BAD_REQUEST, NOT_FOUND } from '../../core/error.response.ts';
import { CREATED, DELETED, OK, UPDATED } from '../../core/success.response.ts';
import { RequestWithUser } from '../../models/customInterfaces.ts';
import {
  create,
  getAllById,
  getByIdWithType,
  getDetailsById,
  getBettingList as getBettingListService
} from '../../services/transactionsService.ts';
import { message } from '../../utilities/constants/index.ts';
import {
  checkTransferAbility,
  recalculateBalance,
  updateBalance
} from './utilities.ts';
const prisma = new PrismaClient();
import { io } from '../../app.ts';
const prismaTransaction = new PrismaClientTransaction();

interface usernameIds {
  id: string;
  parentAgentId: string;
  username: string;
  balance: Decimal | null;
  currency: {
    name: string;
    code: string;
  };
  parent: {
    username: string;
    id: string;
  } | null;
}

export const getTransactions = async (
  req: Request,
  res: Response
): Promise<any> => {
  const { id } = (req as any).user;
  const data = (await getAllById(req.query, id)) as any;

  const { transactions, count, page, size } = data;

  return new OK({
    data: {
      data: transactions,
      page: Number(page || 0),
      size: Number(size || 10),
      totalItems: Number(count)
    }
  }).send(res);
};

export const getBettingList = async (
  req: Request,
  res: Response
): Promise<any> => {
  const { id } = (req as any).user;
  const data = (await getBettingListService(req.query, id)) as any;

  const { betList, count, page, size } = data;

  return new OK({
    data: {
      data: betList,
      page: Number(page || 0),
      size: Number(size || 10),
      totalItems: Number(count)
    }
  }).send(res);
};

export const getCallbackTransaction = async (req: Request, res: Response) => {
  const { id: callbackId } = req.params;
  const { username, amount, transaction } =
    (await prismaTransaction.callbackTransactions.findUnique({
      where: {
        id: callbackId
      }
    })) as CallbackTransactions;

  return new OK({ data: { username, amount, transaction } }).send(res);
};

export const getBalance = async (req: Request, res: Response) => {
  const { username } = req.query;

  if (!username) {
    throw new BAD_REQUEST(message.INVALID_CREDENTIALS);
  } else {
    const { balance } = (await prisma.users.findUnique({
      where: {
        username: username as string
      }
    })) as Users;

    return new OK({ data: balance }).send(res);
  }
};

// Seamless method
export const changeBalance = async (req: Request, res: Response) => {
  try {
    // console.log('Request URL:', req.url);
    // console.log('Request Method:', req.method);
    // console.log('Request Headers:', req.headers);
    // console.log('Request Body:', req.body);

    const { username, amount, transaction } = req.body;
    const data = { username, amount, transaction } as CallbackTransactions;

    try {
      const {
        username,
        amount,
        transaction,
        id: callbackId
      } = (await prismaTransaction.callbackTransactions.create({
        data
      })) as CallbackTransactions;

      if (username) {
        let user;
        user = (await prisma.users.findUnique({
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
        })) as usernameIds;

        if (!user) {
          user = (await prisma.users.create({
            data: {
              username,
              name: username,
              type: 'player',
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
          })) as usernameIds;
        }

        if (user.parentAgentId) {
          const agent = await prisma.users.findUnique({
            where: {
              id: user.parentAgentId as string
            }
          });
          if (
            agent &&
            !['win', 'agent.add_balance'].includes((transaction as any).type)
          ) {
            if (
              !checkBalance(
                user as unknown as Users,
                agent,
                Math.abs(Number(amount)),
                (transaction as any).type
              )
            ) {
              throw new BAD_REQUEST(`'Not enough money'`);
            }
          }
        }

        const data = {
          userId: user.id,
          callbackId,
          username: username,
          agentId: user.parentAgentId ? user.parentAgentId : null,
          agentUsername: user?.parent?.username ? user?.parent?.username : null,
          type: (transaction as any).type,
          amount,
          method: 'seamless',
          updateBy: 'seamless'
        };

        const { type, agentId } = (await create(data)) as Transactions;
        const { balance } = await updateBalance(
          data.userId,
          amount,
          type,
          agentId,
          data.method
        );

        if ((user as any).balance === 0) {
          try {
            await recalculateBalance(data.userId);
          } catch (error) {
            throw new BAD_REQUEST(message.FAILED);
          }
        }

        return res.status(200).json({ message: 'SUCCESS_CALLBACK', balance });
      }

      return res.status(200).json({ message: 'CALLBACK_STAMPLED' });
    } catch (error) {
      throw new BAD_REQUEST(message.FAILED);
    }
  } catch (error) {
    return res
      .status(500)
      .json({ message: message.INTERNAL_SERVER_ERROR, error });
  }
};
// Transfer method
export const addTransaction = async (
  req: RequestWithUser,
  res: Response
): Promise<any> => {
  let status: string | null = 'approved';

  const {
    id: userSessionId,
    roleId: userSessionRoleId,
    type: userSessionType
  } = req.user as Users;

  const {
    userId,
    roundId,
    details,
    type: transactionType,
    amount: transactionAmount,
    currencyCode
  } = req.body;

  let amount = transactionAmount;

  if (
    userSessionId === userId &&
    userSessionRoleId !== 1 &&
    userSessionType !== 'player' &&
    transactionType !== 'agent.add_balance'
  ) {
    throw new BAD_REQUEST('Cannot add money to yourself');
  }

  if (
    transactionType === 'user.add_balance' &&
    !(await checkTransferAbility(userSessionId, userId))
  ) {
    throw new BAD_REQUEST(`The transfer cannot be made.`);
  }

  if (
    ['deposit', 'user.add_balance', 'bet'].includes(transactionType) &&
    amount > 0
  ) {
    amount = -1 * amount;
  }

  if (
    [/*'deposit',*/ 'agent.add_balance' /*,'withdraw'*/].includes(
      transactionType
    )
  ) {
    status = 'pending';
  }

  const user = (await prisma.users.findUnique({
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
      },
      currency: {
        select: {
          code: true
        }
      }
    }
  })) as usernameIds;

  if (user) {
    if (user.parentAgentId) {
      const agent = await prisma.users.findUnique({
        where: {
          id: user.parentAgentId as string
        }
      });
      if (
        agent &&
        ['deposit', 'withdraw', 'user.add_balance', 'bet'].includes(
          transactionType
        )
      ) {
        if (
          !checkBalance(
            user as unknown as Users,
            agent,
            Math.abs(amount),
            transactionType
          )
        ) {
          return res.status(500).json({
            message: message.BAD_REQUEST,
            subMessage: 'not enough balance to play'
          });
        }
      }
    }

    const data = {
      userId,
      username: user.username,
      agentId: user.parentAgentId ?? null,
      agentUsername: user.parent?.username ?? null,
      balance: user.balance ?? null,
      type: transactionType,
      roundId,
      details,
      status,
      amount,
      currencyCode: currencyCode ?? user.currency.code,
      method: 'transfer',
      updateBy: userSessionId ?? null
    };

    const {
      type,
      agentId,
      status: transactionStatus
    } = (await create(data)) as Transactions;

    if (transactionStatus != 'pending') {
      const { balance } = await updateBalance(
        userId,
        amount,
        type,
        agentId,
        data.method
      );
      io.emit(`${req?.user?.id}-played`, { userId, amount, type, agentId });
      return new CREATED({
        data: Number(balance),
        message: 'Transaction created successfully'
      }).send(res);
    } else {
      io.emit(`${req?.user?.id}-played`, { userId, amount, type, agentId });
      return res
        .status(200)
        .json({ message: 'Transaction created, status pending ' });
    }
  }

  throw new NOT_FOUND(message.INVALID_CREDENTIALS);
};

export const transactionAction = async (
  req: RequestWithUser,
  res: Response
): Promise<any> => {
  let balance = req.user?.balance;
  const { id: updateBy } = req.user as Users;
  const { id } = req.params;
  const { action } = req.body;

  const { userId, amount, type, agentId, method, status } =
    (await prismaTransaction.transactions.update({
      where: {
        id
      },
      data: {
        status: action,
        updateBy
      }
    })) as {
      userId: string;
      status: string;
      amount: number;
      type: string;
      agentId: string | null;
      method: string;
    };

  if (status === 'approved') {
    const { balance: updatedBalance } = await updateBalance(
      userId,
      amount,
      type,
      agentId,
      method
    );

    balance = updatedBalance;
  }

  return new UPDATED({
    data: { balance, action },
    message: 'Transaction Approved'
  }).send(res);
};

export const getTransactionDetailsByUserId = async (
  req: Request,
  res: Response
): Promise<any> => {
  const { userId } = req.params;
  const { dateFrom, dateTo, status, page, size } = req.query;
  let type = req.query?.type as string | string[];
  if (type) {
    type = (type as string).split(',');
  }

  const { transactions, countTransactions } = (await getByIdWithType(userId, {
    dateFrom: dateFrom as string,
    dateTo: dateTo as string,
    status: status as string,
    type: type as string[],
    page: Number(page) || 0,
    size: Number(size) || 10
  })) as any;
  return new OK({
    data: {
      data: transactions,
      page: Number(page),
      size: Number(size),
      totalItems: countTransactions
    }
  }).send(res);
};

export const getTransactionDetail = async (
  req: Request,
  res: Response
): Promise<any> => {
  const { id } = req.params;
  const { id: userId } = (req as any).user;
  const data = (await getDetailsById(id, userId)) as any;

  return new OK({ message: message.SUCCESS, data }).send(res);
};

export const landingPage = async (_: Request, res: Response): Promise<any> => {
  try {
    return res.render('landingPage');
  } catch (error) {
    console.log(error);
  }
};

export const getBetLimitations = async (req: Request, res: Response) => {
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

  return new OK({ data: betLimits }).send(res);
};

export const getBetLimitById = async (req: Request, res: Response) => {
  const { id: userId } = (req as any).user;
  const { id } = req.params;

  const betLimit = (await prisma.transactionLimits.findUnique({
    where: {
      id: parseInt(id),
      agentId: userId
    }
  })) as TransactionLimits;
  if (betLimit) {
    throw new NOT_FOUND('Bet Limit not found');
  }
  return new OK({ data: betLimit }).send(res);
};

export const addBetLimit = async (req: Request, res: Response) => {
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
    return new OK({ data: response }).send(res);
  }

  throw new BAD_REQUEST('An error occurred. No transaction limit added');
};

export const updateBetLimit = async (req: Request, res: Response) => {
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
    return new UPDATED({ data: userId }).send(res);

  throw new BAD_REQUEST('An error occurred. No transaction limit added');
};

export const deleteBetLimit = async (req: Request, res: Response) => {
  const { id: userId } = (req as any).user;
  const { id } = req.params;

  await prisma.transactionLimits.delete({
    where: {
      agentId: userId,
      id: parseInt(id)
    }
  });

  return new DELETED({ message: 'Deleted' }).send(res);
};

type type = 'deposit' | 'withdraw' | 'user.add_balance' | 'bet';
const checkBalance = (
  user: Users,
  agent: Users,
  amount: number,
  type: type
) => {
  const allTypes = {
    ['deposit']: check(Number(agent.balance), Number(amount)),
    ['user.add_balance']: check(Number(agent.balance), Number(amount)),
    ['withdraw']: check(Number(user.balance), Number(amount)),
    ['bet']: {
      agent: check(Number(agent.balance), Number(amount)),
      user: check(Number(user.balance), Number(amount))
    }
  };
  if (type === 'bet') {
    if (allTypes['bet'].agent && allTypes['bet'].user) {
      return true;
    }
    return false;
  }

  return allTypes[type];
};

const check = (amountFirst: number, amountSecond: number) => {
  if (amountFirst > amountSecond) {
    return true;
  }
  return false;
};

export const getBalanceByApiKey = async (req: Request, res: Response) => {
  const { id } = (req as any).user;
  const foundUser = await prisma.users.findUnique({
    select: {
      balance: true
    },
    where: {
      id
    }
  });
  if (!foundUser) {
    throw new BAD_REQUEST('User not found');
  }
  return new OK({ data: { balance: Number(foundUser?.balance) } }).send(res);
};
