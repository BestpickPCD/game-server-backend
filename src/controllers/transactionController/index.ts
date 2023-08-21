import { PrismaClient, Users } from '@prisma/client';
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
      userId,
      type,
      gameId,
      search
    } = req.query;
    const { id } = (req as any).user;
    const normalSelect = `
    SELECT DISTINCT transactions.*, senderUser.name as senderUser, receiverUser.name as receiverUser
    `;
    const countSelect = `
    SELECT COUNT(DISTINCT transactions.id) as count
    `;
    const filter: any = `
       senderId IN (
        SELECT id
        FROM Agents
        WHERE JSON_CONTAINS(parentAgentIds, JSON_ARRAY(${Number(id)}))) 
          OR receiverId IN (
            SELECT id
            FROM Agents
            WHERE JSON_CONTAINS(parentAgentIds, JSON_ARRAY(${Number(id)}))
          )
          OR senderId IN (
            SELECT id
            FROM Players
            WHERE agentId = ${Number(id)}
          OR agentId IN (
            SELECT u.id
            FROM Users u
            JOIN Agents a ON u.id = a.id
            WHERE JSON_CONTAINS(a.parentAgentIds, JSON_ARRAY(${Number(id)}))))
          OR receiverId IN (
          SELECT id
          FROM Players
          WHERE agentId = ${Number(id)}
          OR agentId IN (
              SELECT u.id
              FROM Users u
              JOIN Agents a ON u.id = a.id
              WHERE JSON_CONTAINS(a.parentAgentIds, JSON_ARRAY(${Number(id)}))
          )
      ) `;
    const pageSize = `
      order By id
      LIMIT ${Number(size || 10)} 
      OFFSET ${Number(size || 10) * Number(page || 0)}
    `;
    const query = `
      FROM Transactions transactions
      JOIN (
        SELECT id
        FROM Users
        WHERE id = ${Number(userId || id)}
        OR id IN (
            SELECT id
            FROM Agents agents
            WHERE JSON_CONTAINS(parentAgentIds, JSON_ARRAY(${Number(
              userId || id
            )}))
        )
        OR id IN (
          SELECT id
          FROM Players player
          WHERE agentId = ${Number(userId || id)}
          OR agentId IN (
              SELECT u.id
              FROM Users u
              JOIN Agents a ON u.id = a.id
              WHERE JSON_CONTAINS(a.parentAgentIds, JSON_ARRAY(${Number(
                userId || id
              )}))
          )
        )
      ) filtered_users 
      ON transactions.senderId = filtered_users.id OR transactions.receiverId = filtered_users.id
      JOIN Users senderUser ON senderUser.id = transactions.senderId
      JOIN Users receiverUser ON receiverUser.id = transactions.receiverId
      WHERE ((senderUser.name LIKE '%${search}%') OR 
      (receiverUser.name LIKE '%${search}%')) 
      AND ((transactions.updatedAt >= '${
        dateFrom || '1970-01-01T00:00:00.000Z'
      }') 
      AND (transactions.updatedAt <= '${dateTo || '2100-01-01T00:00:00.000Z'}'))
      ${type && `AND transactions.type = '${String(type)}'`}
      ${userId ? ` AND ${filter}` : ''}
      ${gameId ? ` AND ${gameId}` : ''}
    `;
    const [transactions, [{ count }]]: any = await prisma.$transaction([
      prisma.$queryRawUnsafe(`${normalSelect} ${query} ${pageSize}`),
      prisma.$queryRawUnsafe(`${countSelect} ${query}`)
    ]);
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
      if (receiverId) {
        const user = await prisma.users.findUnique({
          where: {
            id: Number(receiverId),
            OR: [
              {
                Players: {
                  OR: [
                    {
                      agentId: Number(senderId)
                    },
                    {
                      agent: {
                        parentAgentIds: {
                          array_contains: [Number(senderId)]
                        }
                      }
                    }
                  ]
                }
              },
              {
                Agents: {
                  parentAgentIds: {
                    array_contains: [Number(senderId)]
                  }
                }
              }
            ]
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
    throw Error(
      JSON.stringify({
        message: message.NOT_FOUND,
        subMessage: 'Invalid transaction type'
      })
    );
  } catch (error) {
    if (error.message) {
      return res.status(400).json(...JSON.parse(error.message));
    }
    return res.status(500).json({ message: message.INTERNAL_SERVER_ERROR });
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
    //* check userId of transaction is in senderId or receiverId to avoid exceptions
    const filterOr = {
      OR: [
        {
          Agents: {
            OR: [
              {
                parentAgentIds: {
                  array_contains: [Number(userId)]
                }
              },
              {
                id: Number(userId)
              }
            ]
          }
        },
        {
          Players: {
            OR: [
              {
                agentId: Number(userId)
              },
              {
                agent: {
                  parentAgentIds: {
                    array_contains: [Number(userId)]
                  }
                }
              }
            ]
          }
        }
      ]
    };
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
        OR: [
          {
            sender: filterOr
          },
          { receiver: filterOr }
        ]
      }
    });
    if (!transaction) {
      throw Error(message.NOT_FOUND);
    }
    return res
      .status(200)
      .json({ message: message.SUCCESS, data: transaction });
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
