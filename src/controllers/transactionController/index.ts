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
import { checkTransferAbility, updateBalance } from './utilities.ts';
import Redis, { getRedisData } from '../../config/redis/index.ts';
import {
  create,
  getAllById,
  getByIdWithType,
  getDetailsById
} from '../../services/transactionsService.ts';
import { CallbackTransactions, PrismaClient as PrismaClientTransaction, Transactions } from '../../config/prisma/generated/transactions/index.js';
import { BAD_REQUEST } from '../../core/error.response.ts';
 
const prismaTransaction = new PrismaClientTransaction();

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

export const changeBalance = async (
  req: Request,
  res: Response
) => { 
  try {
    const { username, amount, transaction } = req.body;
    const data = { username, amount, transaction } as CallbackTransactions;
    try {
      const { username, amount, transaction } = await prismaTransaction.callbackTransactions.create({ data });
      
      if(username) { 

        let newUser
        const user = await prisma.users.findUnique({
          where: {
            username
          }
        }) as Users;

        if(!user) { 
          newUser = await prisma.users.create({
            data: {
              username,
              name: username,
              type: "player",
              balance: (transaction as any)?.target?.balance ?? 0
            }
          })
        }

        const data = {
          userId: username ?? (newUser as Users).username,
          agentId: (user as Users)?.parentAgentId,
          type: (transaction as any).type,
          amount,
          method: "seamless",
          updateBy: "seamless",
        }

        const createTransaction = await create(data) as Transactions;
        if(createTransaction && ((user as any).balance === 0 || (newUser as any).balance === 0)) {
          try {
            await updateBalance((createTransaction as any).userId);
          } catch (error) {
            throw new BAD_REQUEST(message.FAILED);
          }
        }

        return res.status(200).json({message: "SUCCESS_CALLBACK", createTransaction});

      }

      return res.status(200).json({message: "CALLBACK_STAMPLED"}) 

    } catch (error) {
      console.log(error)
      throw new BAD_REQUEST(message.FAILED);
    }
  } catch (error) {
    return res.status(500).json({ message: message.INTERNAL_SERVER_ERROR, error });
  } 
};

export const addTransaction = async (
  req: RequestWithUser,
  res: Response
): Promise<any> => {
  try {
    const { id: userSessionId } = req.user as Users;
    const { userId, type: transactionType, amount, currencyCode } = req.body 

    const { parentAgentId, balance, type: userType } = await prisma.users.findUnique({
      where: {
        id: userId
      }
    }) as Users

    const data = {
      userId,
      agentId:  parentAgentId ?? null,
      type: transactionType,
      amount,
      currencyCode: currencyCode ?? null,
      method: "transfer",
      updateBy: userSessionId ?? null,
    }
    const transcation = await create(data) as Transactions;

    if(userType === "player") {
      try {
        if(['bet', 'win', 'cancel'].includes(transactionType)) {

          const updateUsers = await prisma.$transaction([
            prisma.users.update({
              where: {
                id: userId as string
              },
              data: {
                balance: balance + amount
              }
            }),
            prisma.users.update({
              where: {
                id: parentAgentId as string
              },
              data: {
                balance: balance + amount
              }
            })
          ]); 

        } else if(['deposit', 'withdraw'].includes(transactionType)) {

          let userAmt
          let agentAmt

          if(transactionType === "deposit") {
            userAmt = amount
            agentAmt = -1 * amount
          } else if(transactionType === "withdraw") {
            userAmt = -1 * amount
            agentAmt = amount
          }

          const updateUsers = await prisma.$transaction([
            prisma.users.update({
              where: {
                id: userId as string
              },
              data: {
                balance: balance + userAmt
              }
            }),
            prisma.users.update({
              where: {
                id: parentAgentId as string
              },
              data: {
                balance: balance + agentAmt
              }
            })
          ]); 

          console.log(updateUsers)

        }
      } catch (error) {
        console.log(error)
      }
    }



    if(transcation && !balance ) {
      const balanceUpdate = await updateBalance(userId);
      return res.status(201).json({ message: 'Transaction created successfully', balanceUpdate });
    } else {
      const balanceUpdate = await prisma.users.update({
        where: {
          id: userId
        },
        data: {
          balance: balance + amount
        }
      });
      return res.status(201).json({ message: 'Transaction created successfully', balanceUpdate });
    }

    // if (senderUsername && receiverUsername) {
    //   if (!(await checkTransferAbility(senderUsername, receiverUsername))) {
    //     return res
    //       .status(500)
    //       .json({ message: `The transfer cannot be made.` });
    //   }
    // }
    // checkTransactionType(type)
 
    return res
      .status(201)
      .json({ message: 'Transaction created successfully',transcation });
 
  } catch (error) {
    console.log(error);
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
