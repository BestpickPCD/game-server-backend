import { PrismaClient, Users } from '@prisma/client';
const prisma = new PrismaClient();
import { Request, Response } from 'express';
import { arrangeTransactionDetails, arrangeTransactions } from './utilities.ts'
import { checkTransactionType, } from './transactionTypes.ts'
import { RequestWithUser } from "../../models/customInterfaces.ts";


export const getTransactions = async (_: Request, res: Response): Promise<any> => { 
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

export const getTransactionsView = async (_: Request, res: Response): Promise<any> => {
  try {
    const transactions = await prisma.transactions.findMany({
      where: { deletedAt: null },
      orderBy: { createdAt: 'asc' },
      select: {
          receiver: {
              select: {
                  id: true,
                  username: true,
                  type: true,
              },
          },
          sender: {
              select: {
                  id: true,
                  username: true,
                  type: true,
              },
          },
          updatedUser: {
              select: {
                  id: true,
                  username: true,
                  type: true,
              },
          }, 
          id: true,
          amount: true,
          gameId: true,
          type: true,
          note: true,
          status: true,
          createdAt: true,
      },
    }) as any ;
    const details = await arrangeTransactions(transactions)
    return res.render('transactions',{ data:details });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ message: 'Something went wrong', error });
  }
};

export const addTransaction = async (req: RequestWithUser, res: Response): Promise<any> => {
  try {
    const { senderId, receiverId, type, note, token, status, amount, currencyId, gameId } = req.body; 
    const data: any = { type, note, token, status, amount, gameId }  
    
    if (senderId) {
      data.sender = {
        connect: { id: senderId },
      }
    }
    if (receiverId) {
      data.receiver = {
        connect: { id: receiverId },
      }
    }
    if (currencyId) {
      data.currency = {
        connect: { id: currencyId }
      }
    }
    if (req.user?.id) {
      data.updatedUser = {
        connect: { id: req.user.id ? req.user.id : 1 }
      }
    }

    if(senderId) {
      const sender = await prisma.users.findUnique({
          where: {
              id: senderId
          } 
      }) 

      if((sender as Users ).type == "player" && type == "add") {
        return res.status(500).json({ message: 'Users cannot add or transfer money' });
      } 
    } 

    if(checkTransactionType(type)) {
      await prisma.transactions.create({
        data: data 
      });
      return res.status(201).json({ message: 'Transaction created successfully' }); 
    }
    return res.status(500).json({ message: 'Transaction type does not exist' }); 

    
  } catch (error) {
    console.error(error);
    return res.status(500).json({ message: 'Something went wrong', error });
  }
}

export const getTransactionDetailsByUserIdView = async (req:Request, res:Response): Promise<any> => {
  try {
    const userId = parseInt(req.params.userId)
    const transactions = await prisma.transactions.findMany({ 
        where: {
            OR: [{ senderId: userId }, { receiverId: userId }],
        },
        orderBy: {
            createdAt: 'asc',
        },
        select: {
            receiver: {
                select: {
                    id: true,
                    username: true,
                    type: true,
                },
            },
            sender: {
                select: {
                    id: true,
                    username: true,
                    type: true,
                },
            },
            updatedUser: {
                select: {
                    id: true,
                    username: true,
                    type: true,
                },
            },
            amount: true,
            gameId: true,
            type: true,
            note: true,
            status: true,
            createdAt: true,
        },
    }) as any; 
  
    const userDetails = await arrangeTransactionDetails(transactions, userId)
    res.render('transactionDetails',{data: userDetails})

  } catch (error) {
      console.log(error)
      res.status(500).json(error) 
  }
}


export const getTransactionDetailsByUserId = async (req:Request, res:Response): Promise<any> => {

    try {
        const userId = parseInt(req.params.userId)
        const transactions = await prisma.transactions.findMany({ 
            where: {
                OR: [{ senderId: userId }, { receiverId: userId }],
            },
            orderBy: {
                createdAt: 'asc',
            },
            select: {
                receiver: {
                    select: {
                        id: true,
                        username: true,
                        type: true,
                    },
                },
                sender: {
                    select: {
                        id: true,
                        username: true,
                        type: true,
                    },
                },
                updatedUser: {
                    select: {
                        id: true,
                        username: true,
                        type: true,
                    },
                },
                amount: true,
                gameId: true,
                type: true,
                note: true,
                status: true,
                createdAt: true,
            },
        }) as any; 
      
        const userDetails = await arrangeTransactionDetails(transactions, userId)
        res.status(200).json(userDetails) 

    } catch (error) {
        console.log(error)
        res.status(500).json(error) 
    }
 
}

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
