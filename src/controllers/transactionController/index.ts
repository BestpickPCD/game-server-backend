import {
  PrismaClient,
  Users
} from '../../config/prisma/generated/base-default/index.js';
const prisma = new PrismaClient();
import { Request, Response } from 'express';
import { RequestWithUser } from '../../models/customInterfaces.ts';
import { message } from '../../utilities/constants/index.ts';
import { checkTransactionType } from './transactionTypes.ts';
import {
  arrangeTransactionDetails,
  arrangeTransactions,
  checkTransferAbility
  // updateBalance
} from './utilities.ts';
import Redis, { getRedisData } from '../../config/redis/index.ts';
import {
  getAllById,
  getByIdWithType,
  getDetailsById
} from '../../services/transactionsService.ts';
import { PrismaClient as PrismaClientTransaction } from '@prisma/client';
const prismaTransaction = new PrismaClientTransaction();

export const getTransactions = async (
  req: Request,
  res: Response
): Promise<any> => {
  try {
    const { id } = (req as any).user;
    const redisKey = 'transactions';
    const { redisData, redisKeyWithId } = await getRedisData(
      id,
      redisKey,
      'Invalid users Id'
    );
    let data: any;
    if (redisData) {
      data = JSON.parse(redisData);
    } else {
      data = (await getAllById(req.query, id)) as any;
    }
    !redisData && (await Redis.set(redisKeyWithId, JSON.stringify(data)));

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
    const senderUsername = req.body.senderUsername ?? (req as any).user.id;

    if (senderUsername && receiverUsername) {
      if (!(await checkTransferAbility(senderUsername, receiverUsername))) {
        return res
          .status(500)
          .json({ message: `The transfer cannot be made.` });
      }
    }

    const data: any = { type, note, token, status, amount, gameId };
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
            // OR: [
            //   {
            //     Players: {
            //       OR: [
            //         {
            //           agentId: Number(senderId)
            //         },
            //         {
            //           agent: {
            //             parentAgentIds: {
            //               array_contains: [Number(senderId)]
            //             }
            //           }
            //         }
            //       ]
            //     }
            //   },
            //   {
            //     Agents: {
            //       parentAgentIds: {
            //         array_contains: [Number(senderId)]
            //       }
            //     }
            //   }
            // ]
          },
          select: {
            id: true,
            Players: {
              select: {
                agent: {
                  select: {
                    id: true,
                    user: true
                  }
                }
              }
            },
            Agents: {
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
            updateUserId: Number(req?.user?.id),
            ...(senderUsername && { senderUsername }),
            ...(receiverUsername && { receiverUsername })
          }
        });

        const redisKey = 'transactions';
        await Redis.del(redisKey);
        await Redis.del(`${redisKey}-${req?.user?.id}`);
        // if (senderUsername) {
        //   await updateBalance(senderUsername);
        // }
        // if (receiverUsername) {
        //   await updateBalance(receiverUsername);
        // }

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

// export const addTransaction = async (
//   req: RequestWithUser,
//   res: Response
// ): Promise<any> => {
//   try {
//     const {
//       receiverId,
//       type,
//       note,
//       token,
//       status,
//       amount,
//       currencyId,
//       gameId
//     } = req.body;

//     const senderId = req.body.senderId ?? (req as any).user.id;

//     if (senderId && receiverId) {
//       if (!(await checkTransferAbility(senderId, receiverId))) {
//         return res
//           .status(500)
//           .json({ message: `The transfer cannot be made.` });
//       }
//     }

//     const data: any = { type, note, token, status, amount, gameId };
//     const sender = await prisma.users.findUnique({
//       where: {
//         id: (req as any).user.id
//       }
//     });
//     if ((sender as Users).type == 'player' && type == 'add') {
//       throw Error(
//         JSON.stringify({
//           message: message.INVALID,
//           subMessage: 'Users cannot add or transfer money'
//         })
//       );
//     }
//     if (currencyId) {
//       const currency = await prisma.currencies.findUnique({
//         where: {
//           id: currencyId
//         }
//       });
//       if (!currency) {
//         throw Error(
//           JSON.stringify({
//             message: message.NOT_FOUND,
//             subMessage: 'Currency not found'
//           })
//         );
//       }
//     }
//     //*: check receiverId is our child player or child agent (done)
//     if (checkTransactionType(type)) {
//       if (receiverId) {
//         const user = await prisma.users.findUnique({
//           where: {
//             id: Number(receiverId),
//             OR: [
//               {
//                 Players: {
//                   OR: [
//                     {
//                       agentId: Number(senderId)
//                     },
//                     {
//                       agent: {
//                         parentAgentIds: {
//                           array_contains: [Number(senderId)]
//                         }
//                       }
//                     }
//                   ]
//                 }
//               },
//               {
//                 Agents: {
//                   parentAgentIds: {
//                     array_contains: [Number(senderId)]
//                   }
//                 }
//               }
//             ]
//           },
//           select: {
//             id: true,
//             Players: {
//               select: {
//                 agent: {
//                   select: {
//                     id: true,
//                     user: true
//                   }
//                 }
//               }
//             },
//             Agents: {
//               select: {
//                 parentAgentIds: true
//               }
//             }
//           }
//         });

//         if (!user) {
//           throw Error(
//             JSON.stringify({
//               message: message.NOT_FOUND,
//               subMessage: 'User not found'
//             })
//           );
//         }
//       }

//       try {
//         await prismaTransaction.transactions.create({
//           data: {
//             ...data,
//             currencyId,
//             updateUserId: Number(req?.user?.id),
//             ...(senderId && { senderId }),
//             ...(receiverId && { receiverId })
//           }
//         });

//         const redisKey = 'transactions';
//         await Redis.del(redisKey);
//         await Redis.del(`${redisKey}-${req?.user?.id}`);
//         if (senderId) {
//           await updateBalance(senderId);
//         }
//         if (receiverId) {
//           await updateBalance(receiverId);
//         }

//         return res
//           .status(201)
//           .json({ message: 'Transaction created successfully' });
//       } catch (error) {
//         console.log(error);
//       }
//     }
//     throw Error(
//       JSON.stringify({
//         message: message.NOT_FOUND,
//         subMessage: 'Invalid transaction type'
//       })
//     );
//   } catch (error) {
//     if (error.message) {
//       return res.status(400).json(...JSON.parse(error.message));
//     }
//     return res.status(500).json({ message: message.INTERNAL_SERVER_ERROR });
//   }
// };

export const getTransactionDetailsByUserId = async (
  req: Request,
  res: Response
): Promise<any> => {
  try {
    const userId = parseInt(req.params.userId);
    const type = req.query.type as string;
    let arrayTypes: string[];
    if (type) {
      arrayTypes = type.split(',');
    } else {
      arrayTypes = [];
    }
    const redisKey = 'transactionById';
    const { redisData, redisKeyWithId } = await getRedisData(
      userId,
      redisKey,
      'Invalid users Id'
    );
    await Redis.del(redisKey);
    await Redis.del(redisKeyWithId);
    let data: any;
    if (redisData) {
      data = JSON.parse(redisData);
    } else {
      data = (await getByIdWithType(userId, arrayTypes)) as any;
    }
    !redisData && (await Redis.set(redisKeyWithId, JSON.stringify(data)));

    res.status(200).json(data);
  } catch (error) {
    console.log(error);
    res.status(500).json({
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
    const redisKey = 'transactionDetails';
    const { redisData, redisKeyWithId } = await getRedisData(
      parseInt(id),
      redisKey,
      'Invalid users Id'
    );
    let data: any;
    if (redisData) {
      data = JSON.parse(redisData);
    } else {
      data = (await getDetailsById(parseInt(id), userId)) as any;
    }
    !redisData && (await Redis.set(redisKeyWithId, JSON.stringify(data)));
    if (!data) {
      throw Error(message.NOT_FOUND);
    }
    return res.status(200).json({ message: message.SUCCESS, data });
  } catch (error) {
    if (error.message) {
      return res.status(404).json({ message: error.message });
    }
    return res.status(500).json({ message: message.INTERNAL_SERVER_ERROR });
  }
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
    return res.status(500).json({ message: 'Something went wrong', error });
  }
};

export const landingPage = async (_: Request, res: Response): Promise<any> => {
  try {
    return res.render('landingPage');
  } catch (error) {
    console.log(error);
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

// };
