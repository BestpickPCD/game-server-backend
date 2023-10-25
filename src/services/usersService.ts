import { getAffiliatedAgentsByUserId } from '../controllers/userController/utilities.js';
import {
  Prisma,
  PrismaClient,
  Users
} from '../config/prisma/generated/base-default/index.js';
const prisma = new PrismaClient();
import { PrismaClient as PrismaClientTransaction } from '../config/prisma/generated/transactions/index.js';
const prismaTransaction = new PrismaClientTransaction();

export const getAllWithBalance = async (query: any, userId: number) => {
  try {
    const {
      page = 1,
      size = 10,
      search = '',
      dateFrom,
      dateTo,
      agentId
    }: {
      page?: number;
      size?: number;
      search?: string;
      dateFrom?: string;
      dateTo?: string;
      isActive?: true | false | null;
      agentId?: number;
    } = query;

    const rawQuery = `SELECT 
    users.id, users.name, users.email, users.username, 
    users.type, users.balance, users.currencyId, users.isActive, 
    users.updatedAt, users.parentAgentIds, parentAgentId AS agentId,
    users.balance
    FROM Users users
    WHERE
      users.deletedAt IS NULL
      AND users.type = 'player'
      AND (users.parentAgentId IN (
        SELECT id
        FROM Users
        WHERE TYPE = 'agent'
          AND JSON_CONTAINS(parentAgentIds, JSON_ARRAY('${userId}'))
      )OR users.parentAgentId = '${userId}')
    ${agentId ? `AND agent.id = '${agentId}'` : ``}
    ${
      search
        ? `AND (
        users.name LIKE '%${search}%' OR
        users.username LIKE '%${search}%' OR
        users.email LIKE '%${search}%'
      )`
        : ``
    }
    ${
      dateFrom && dateTo
        ? `AND (
      users.updatedAt >= ${dateFrom} OR ${dateFrom} IS NULL
      AND users.updatedAt <= ${dateTo} OR ${dateTo} IS NULL
    )`
        : ``
    }
    ORDER BY users.updatedAt DESC
    LIMIT ${size} OFFSET ${page * size}
    `;

    const users = (await prisma.$queryRawUnsafe(`${rawQuery}`)) as any; 

    const allUsers = users.map((user: Users) => user.id);  
 
    const transactions = await prismaTransaction.transactions.findMany({
      where: {
        userId: {
          in: allUsers
        }
      },
      select: {
        userId: true,
        type: true,
        amount: true,
      },
      orderBy: {
        userId: 'asc',
      },
    });
    
    const transformedData: Record<string, Record<string, number>> = {};
    
    transactions.forEach((transaction) => {
      const { userId, type, amount } = transaction;
    
      if (!transformedData[userId as string]) {
        transformedData[userId as string] = {};
      }
    
      if (!transformedData[userId as string][type]) {
        transformedData[userId as string][type] = 0;
      }
    
      transformedData[userId as string][type] += amount;
    });

    const userDetails = users.map((row: any) => {
      const data = {
        ...row,
        balances: transformedData[`${row.id}`]
      };
      return data;
    });

    return { userDetails, page, size };
  } catch (error: any) {
    throw Error(error);
  }
};

export const getAll = async (query: any, id: number) => {
  try {
    const {
      page = 0,
      size = 10,
      search = '',
      dateFrom,
      dateTo,
      agentId
    }: {
      page?: number;
      size?: number;
      search?: string;
      dateFrom?: string;
      dateTo?: string;
      isActive?: true | false | null;
      agentId?: number;
    } = query;

    const filter: any = {
      select: {
        id: true,
        agentId: true,
        user: {
          select: {
            balance: true,
            email: true,
            name: true,
            currency: {
              select: {
                id: true,
                code: true,
                name: true
              }
            },
            username: true,
            createdAt: true,
            updatedAt: true
          }
        }
      },
      where: {
        deletedAt: null,
        user: {
          type: 'player'
        },
        OR: [
          {
            agentId: Number(id)
          },
          {
            agent: {
              parentAgentIds: {
                array_contains: [Number(id)]
              }
            }
          }
        ],
        AND: {
          user: {
            OR: [
              {
                name: {
                  contains: search
                }
              },
              {
                email: {
                  contains: search
                }
              },
              {
                username: {
                  contains: search
                }
              }
            ]
          },
          OR: [
            {
              agent: {
                parentAgentIds: {
                  array_contains: [Number(agentId ?? id)]
                }
              }
            },
            {
              agentId: Number(agentId ?? id)
            }
          ]
        },
        updatedAt: {
          gte: dateFrom || '1970-01-01T00:00:00.000Z',
          lte: dateTo || '2100-01-01T00:00:00.000Z'
        }
      },
      orderBy: {
        updatedAt: 'desc'
      },
      skip: Number(page * size),
      take: Number(size)
    };

    const [totalItems, data] = await prisma.$transaction([
      prisma.users.count({
        where: filter.where
      }),
      prisma.users.findMany(filter)
    ]);

    return { data, totalItems, page, size };
  } catch (error: any) {
    throw Error(error);
  }
};

export const getById = async (id: string) => {
  try {
    const user = (await prisma.users.findUnique({
      where: {
        id
      },
      select: {
        id: true,
        name: true,
        username: true,
        type: true,
        email: true,
        apiKey: true,
        balance: true,
        createdAt: true,
        updatedAt: true,
        currency: {
          select: {
            id: true,
            name: true,
            code: true
          }
        },
        parentAgentId: true,
        role: {
          select: {
            name: true,
            id: true
          }
        }
      }
    })) as any;

    return user;
  } catch (error: any) {
    throw Error(error);
  }
};

export const getPlayerById = async (id: string, userId: string) => {
  try {
    const user = (await prisma.users.findUnique({
      where: {
        id: String(userId),
        OR: [
          {
            id: String(id)
          },
          {
            parentAgentIds: {
              array_contains: [String(id)]
            }
          }
        ]
      },
      select: {
        id: true,
        name: true,
        username: true,
        email: true,
        type: true,
        roleId: true,
        role: {
          select: {
            name: true
          }
        },
        currencyId: true,
        currency: {
          select: {
            name: true
          }
        },
        parentAgentId: true
      }
    })) as any;

    const data = {
      id: user.id,
      name: user.name,
      username: user.username,
      email: user.email,
      type: user.type,
      role: user.role?.name,
      currency: user.currency?.name,
      agent: user.Players?.agent?.user?.name ?? null,
      roleId: user.roleId,
      currencyId: user.currencyId
    };
    return data;
  } catch (error: any) {
    throw Error(error);
  }
};

export const getUserProfile = async (userId: number) => {
  try {
    const data = (await prisma.$queryRaw`
      SELECT * FROM
        (SELECT id, balance, name, type, username, currencyId FROM Users WHERE id = ${userId}) AS USER LEFT JOIN
        (SELECT id, name AS currencyName, code AS currencyCode FROM Currencies WHERE deletedAt IS NULL) AS Currency ON Currency.id = USER.currencyId LEFT JOIN
        (SELECT COUNT(id) AS subAgent, parentAgentId FROM Users WHERE parentAgentId = ${userId} AND type = 'agent' GROUP BY parentAgentId) AS subAgent ON subAgent.parentAgentId = User.id LEFT JOIN
        (SELECT COUNT(id) AS players, parentAgentId FROM Users WHERE parentAgentId = ${userId} AND type = 'player' GROUP BY parentAgentId) AS player ON player.parentAgentId = User.id
    `) as any;

    return data;
  } catch (error: any) {
    throw Error(error);
  }
};

export const getDashboardData = async (userId: string) => {
  try {
    const item = (await prisma.users.findUnique({
      where: {
        id: userId,
        deletedAt: null,
        isActive: true
      }
    })) as any;

    const { affiliatedAgents, affiliatedUserId } =
      await getAffiliatedAgentsByUserId(userId);
      
    const affiliatedSums = await _getAllSumsByUserId(affiliatedUserId); 
    
    affiliatedAgents.map((affiliatedAgent: any) => {
      const winGame = affiliatedSums.winGame[affiliatedAgent.id];
      const betGame = affiliatedSums.betGame[affiliatedAgent.id];
      const chargeGame = affiliatedSums.chargeGame[affiliatedAgent.id];
      const userReceived = affiliatedSums.userReceived[affiliatedAgent.id];
      const agentReceived = affiliatedSums.agentReceived[affiliatedAgent.id];
      const deposit = affiliatedSums.deposit[affiliatedAgent.id];
      const withdraw = affiliatedSums.withdraw[affiliatedAgent.id];
      const allSums = { winGame, betGame, chargeGame, userReceived, agentReceived, deposit, withdraw };

      affiliatedAgent.allSums = allSums;
    }); 

    const { winGame, betGame, chargeGame, userReceived, agentReceived, deposit, withdraw } =
      await _getAllSumsByUserId([item.id]);
 
    const data = {
      userId: item.id,
      name: item.name,
      username: item.username,
      currency: {
        name: item.currencyName,
        code: item.currencyCode
      },
      affiliatedAgents,
      type: item.type,
      accountNumber: item.accountNumber,
      callbackUrl: item.callbackUrl,
      apiCall: item.apiCall,
      subAgent: parseInt(item.subAgent),
      parentAgentId: item.parentAgentId,
      players: parseInt(item.players),
      agentId: item.agentId,
      balance: {
        balance: item.balance ?? 0,
        calculatedBalance:
          (agentReceived[`${item.id}`]?._sum.amount ??
            0 + winGame[`${item.id}`]?._sum.amount ??
            0) -
          (userReceived[`${item.id}`]?._sum.amount ??
            0 + betGame[`${item.id}`]?._sum.amount ??
            0 + chargeGame[`${item.id}`]?._sum.amount ??
            0),
        userReceived: userReceived[`${item.id}`]?._sum.amount ?? 0,
        agentReceived: agentReceived[`${item.id}`]?._sum.amount ?? 0,
        bet: betGame[`${item.id}`]?._sum.amount ?? 0,
        win: winGame[`${item.id}`]?._sum.amount ?? 0,
        charge: chargeGame[`${item.id}`]?._sum.amount ?? 0
      }
    }; 

    return data;
  } catch (error: any) {
    throw Error(error);
  }
};

export const getAllByAgentId = async (query: any, id: string) => {
  try {
    const {
      page = 0,
      size = 10,
      search = ''
    }: {
      page?: number;
      size?: number;
      search?: string;
    } = query;

    const filter: Prisma.UsersFindManyArgs = {
      select: {
        id: true,
        name: true,
        username: true
      },
      where: {
        deletedAt: null,
        OR: [
          {
            id: String(id)
          },
          {
            parentAgentIds: {
              array_contains: [String(id)]
            }
          },
          {
            name: {
              contains: search
            }
          },
          {
            username: {
              contains: search
            }
          }
        ]
      },
      orderBy: {
        updatedAt: 'desc'
      },
      skip: Number(page * size),
      take: Number(size)
    };

    const [totalItems, data] = await prisma.$transaction([
      prisma.users.count({
        where: filter.where
      }),
      prisma.users.findMany(filter)
    ]);

    return { totalItems, data, page, size };
  } catch (error: any) {
    throw Error(error);
  }
};

const _getAllSumsByUserId = async (userIds: string[]) => {
  try {
    const winGame = await _getSumTransactionByUserIds(
      'win',
      'userId',
      userIds
    );
    const betGame = await _getSumTransactionByUserIds(
      'bet',
      'userId',
      userIds
    );
    const chargeGame = await _getSumTransactionByUserIds(
      'cancel',
      'userId',
      userIds
    );
    const userReceived = await _getSumTransactionByUserIds(
      'user.add_balance',
      'userId',
      userIds
    );
    const deposit = await _getSumTransactionByUserIds(
      'deposit',
      'userId',
      userIds
    );
    const withdraw = await _getSumTransactionByUserIds(
      'withdraw',
      'userId',
      userIds
    );
    const agentReceived = await _getSumTransactionByUserIds(
      'agent.add_balance',
      'userId',
      userIds
    );

    const balance = { winGame, betGame, chargeGame, userReceived, agentReceived, deposit, withdraw };

    return balance;
  } catch (error: any) {
    throw Error(error);
  }
};

const _getSumTransactionByUserIds = async (
  type: string,
  groupBy: any,
  userIds: string[]
) => {
  const sumBalance = (await prismaTransaction.transactions.groupBy({
    by: [groupBy],
    _sum: {
      amount: true
    },
    where: {
      type,
      [`${groupBy}`]: {
        in: userIds
      }
    }
  })) as any;

  const formattedResult = sumBalance.reduce((acc: any, item: any) => {
    acc[item.userId] = item;
    return acc;
  }, {});

  return formattedResult;
};
