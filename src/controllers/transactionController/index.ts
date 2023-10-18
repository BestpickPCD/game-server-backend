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
  getAllById,
  getByIdWithType,
  getDetailsById
} from '../../services/transactionsService.ts';
import { PrismaClient as PrismaClientTransaction } from '../../config/prisma/generated/transactions/index.js';
const prismaTransaction = new PrismaClientTransaction();

export const getTransactions = async (
  req: Request,
  res: Response
): Promise<any> => {
  try {
    const { username } = (req as any).user;
    const data = (await getAllById(req.query, username)) as any;

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

export const addTransaction = async (
  req: RequestWithUser,
  res: Response
): Promise<any> => {
  try {
    const {
      receiverUsername,
      type,
      note,
      token,
      status,
      amount,
      currencyId,
      gameId
    } = req.body;
    const senderUsername =
      req.body.senderUsername ?? (req as any).user.username;

    if (senderUsername && receiverUsername) {
      if (!(await checkTransferAbility(senderUsername, receiverUsername))) {
        return res
          .status(500)
          .json({ message: `The transfer cannot be made.` });
      }
    }

    const data: any = {
      type,
      note,
      token,
      status,
      amount: parseFloat(amount),
      gameId
    };
    const sender = await prisma.users.findUnique({
      where: {
        id: (req as any).user.id
      }
    });
    if ((sender as Users).type == 'player' && type == 'add') {
      throw Error(
        JSON.stringify({
          message: message.INVALID,
          subMessage: 'Users cannot add or transfer money'
        })
      );
    }
    if (currencyId) {
      const currency = await prisma.currencies.findUnique({
        where: {
          id: currencyId
        }
      });
      if (!currency) {
        throw Error(
          JSON.stringify({
            message: message.NOT_FOUND,
            subMessage: 'Currency not found'
          })
        );
      }
    }
    //*: check receiverId is our child player or child agent (done)
    if (checkTransactionType(type)) {
      if (receiverUsername) {
        const user = await prisma.users.findUnique({
          where: {
            username: String(receiverUsername)
          },
          select: {
            id: true,
            parentAgent: {
              select: {
                parentAgentIds: true
              }
            }
          }
        });

        if (!user) {
          throw Error(
            JSON.stringify({
              message: message.NOT_FOUND,
              subMessage: 'User not found'
            })
          );
        }
      }

      try {
        await prismaTransaction.transactions.create({
          data: {
            ...data,
            currencyId,
            updateUserUsername: String(req?.user?.username),
            ...(senderUsername && { senderUsername }),
            ...(receiverUsername && { receiverUsername })
          }
        });
        const redisKey = 'transactions';
        await Redis.del(redisKey);
        await Redis.del(`${redisKey}-${req?.user?.id}`);
        if (senderUsername) {
          await updateBalance(senderUsername);
        }
        if (receiverUsername) {
          await updateBalance(receiverUsername);
        }

        return res
          .status(201)
          .json({ message: 'Transaction created successfully' });
      } catch (error) {
        console.log(error);
      }
    }
    throw Error(
      JSON.stringify({
        message: message.NOT_FOUND,
        subMessage: 'Invalid transaction type'
      })
    );
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


export const getBetLimitations = async (req:Request, res: Response) => {
  try {
    const { id: userId } = (req as any).user;
    const { page, size, search, type } = req.query

    const filter = {
      agentId: userId,
      type: type,
      page: page,
      size: size,
      search: search,
    }

    const betLimits = await prisma.transactionLimits.findMany({
      where: filter
    }) as TransactionLimits[]

    return res.status(200).json({ data: betLimits });
    
  } catch (error: any) {
    if (error.message) {
      return res.status(404).json({ message: error.message });
    }
    return res.status(500).json({ message: message.INTERNAL_SERVER_ERROR });
  }
}

export const getBetLimitById = async (req:Request, res: Response) => {
  try {

    const { id: userId } = (req as any).user;
    const { id } = req.params;

    const betLimit = await prisma.transactionLimits.findUnique({
      where: {
        id: parseInt(id),
        agentId: userId
      }
    }) as TransactionLimits

    return res.status(200).json({ data: betLimit });
    
  } catch (error: any) {
    if (error.message) {
      return res.status(404).json({ message: error.message });
    }
    return res.status(500).json({ message: message.INTERNAL_SERVER_ERROR });
  }
  
}

export const addBetLimit = async (req:Request, res:Response) => {
  try {
    const { id: userId } = (req as any).user;

    const { limitType, limitTypeId, limit } = req.body;
    const data = {
      agentId: userId, 
      limitType, 
      limitTypeId, 
      limit
    } as {
      agentId: number,
      limitType: string, 
      limitTypeId: string, 
      limit: number
    }

    const response = await prisma.transactionLimits.create({data}) as TransactionLimits
    if(Object.keys(response).length != 0) {
      return res.status(200).json({response})
    }

    throw new Error("An error occurred. No transaction limit added");
    
  } catch (error: any) {
    if (error.message) {
      return res.status(404).json({ message: error.message });
    }
    return res.status(500).json({ message: message.INTERNAL_SERVER_ERROR });
  }
}

export const updateBetLimit = async (req:Request, res:Response) => {
  try {

    const { id: userId } = (req as any).user
    const { id } = req.params
    req.body.agentId = userId
    const data = req.body

    const update = await prisma.transactionLimits.update({
      where: {
        id: parseInt(id),
        agentId: userId
      },
      data
    }) as TransactionLimits

    if(Object.keys(update).length != 0) 
      return res.status(200).json({data:userId})

    throw new Error("An error occurred. No transaction limit updated");

  } catch (error: any) {
    if (error.message) {
      return res.status(404).json({ message: error.message });
    }
    return res.status(500).json({ message: message.INTERNAL_SERVER_ERROR });
  }
}

export const deleteBetLimit = async (req:Request, res:Response) => {
  try {
    const { id: userId } = (req as any).user
    const { id } = req.params

    try {
      await prisma.transactionLimits.delete({
        where: {
          agentId: parseInt(userId),
          id: parseInt(id)
        }
      })

      return res.status(200).json({message:"Deleted"})
    } catch (error) {
      throw new Error("An error occurred. No transaction limit deleted");
    }

  } catch (error: any) {
    if (error.message) {
      return res.status(404).json({ message: error.message });
    }
    return res.status(500).json({ message: message.INTERNAL_SERVER_ERROR });
  }
}