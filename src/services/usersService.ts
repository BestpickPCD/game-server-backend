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

    const rawQuery = `SELECT * FROM
    (SELECT id, name, email, username, type, balance, currencyId, isActive, updatedAt FROM Users users WHERE deletedAt IS NULL) AS users JOIN
    (SELECT players.parentAgentId, players.id, agents.parentAgentIds FROM Users players JOIN Agents agents ON agents.id = players.agentId 
      WHERE ( JSON_CONTAINS(agents.parentAgentIds, JSON_ARRAY(${userId})) 
      OR players.parentAgentId = ${userId})) 
      AS players ON players.id = users.id 
    WHERE 1=1
    ${agentId ? `AND players.parentAgentId = ${agentId}` : ``}
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

    const winGame = await _getSumTransaction('win', 'receiverUsername');
    const betGame = await _getSumTransaction('bet', 'senderUsername');
    const chargeGame = await _getSumTransaction('charge', 'receiverUsername');
    const received = await _getSumTransaction('add', 'receiverUsername');

    const userDetails = users.map((row: any) => {
      const data = {
        ...row,
        user: {
          name: row.name,
          username: row.username,
          betGameAmount:
            ((winGame[`${row.username}`]?._sum.amount as number) ?? 0) -
              ((betGame[`${row.username}`]?._sum.amount as number) ?? 0) -
              ((chargeGame[`${row.username}`]?._sum.amount as number) ?? 0) ??
            0,
          amountReceived: received[`${row.username}`]?._sum.amount ?? 0,
          winGameAmount: winGame[`${row.username}`]?._sum.amount ?? 0,
          chargeGameAmount: row.chargeGameAmount ?? 0,
          balance: row.balance ?? 0,
          updatedAt: row.updatedAt
        }
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

export const getById = async (id: number) => {
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
            name:true,
            code:true,
          }
        },
        parentAgent: true,
        role: {
          select: {
            name: true,
            id: true
          }
        },
      }
    })) as any;

    return user;
  } catch (error: any) {
    throw Error(error);
  }
};

export const getPlayerById = async (id: number, userId: number) => {
  try {
    const user = (await prisma.users.findUnique({
      where: {
        id: Number(userId),
        parentAgent: {
          OR: [
            {
              id: Number(id)
            },
            { 
              parentAgentIds: {
                array_contains: [Number(id)]
              } 
            }
          ]
        }
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
        parentAgent: true
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
        (SELECT COUNT(id) AS subAgent, parentAgentId FROM Agents WHERE parentAgentId = ${userId} GROUP BY parentAgentId) AS subAgent ON subAgent.parentAgentId = User.id LEFT JOIN
        (SELECT COUNT(id) AS players, parentAgentId FROM Users WHERE agentId = ${userId} AND type = 'player' GROUP BY parentAgentId) AS players ON players.agentId = User.id
    `) as any;

    return data;
  } catch (error: any) {
    throw Error(error);
  }
};

export const getDashboardData = async (userId: number) => {
  try {
    const item = (await prisma.users.findUnique({
      where: {
        id: userId,
        deletedAt: null,
        isActive: true
      },
      include: {
        parentAgent: { 
          select: {
            user: {
              select: {
                username: true,
                name: true
              }
            },
            parentAgentIds: true 
          } 
        }
      }
    })) as any;

    const {affiliatedAgents, affiliatedUsernames} = await getAffiliatedAgentsByUserId(userId);
    const affiliatedSums = await _getAllSumsByUsername(affiliatedUsernames);

    affiliatedAgents.map((affiliatedAgent: any) => {
      const winGame = affiliatedSums.winGame[affiliatedAgent.username]
      const betGame = affiliatedSums.betGame[affiliatedAgent.username]
      const chargeGame = affiliatedSums.chargeGame[affiliatedAgent.username]
      const sentOut = affiliatedSums.sentOut[affiliatedAgent.username]
      const received = affiliatedSums.received[affiliatedAgent.username]
      const allSums = { winGame, betGame, chargeGame, sentOut, received }

      affiliatedAgent.allSums = allSums

    })
    
    const { winGame, betGame, chargeGame, sentOut, received } =
      await _getAllSumsByUsername([item.username]);
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
          (received[`${item.username}`]?._sum.amount ??
            0 + winGame[`${item.username}`]?._sum.amount ??
            0) -
          (sentOut[`${item.username}`]?._sum.amount ??
            0 + betGame[`${item.username}`]?._sum.amount ??
            0 + chargeGame[`${item.username}`]?._sum.amount ??
            0),
        sendOut: sentOut[`${item.username}`]?._sum.amount ?? 0,
        receive: received[`${item.username}`]?._sum.amount ?? 0,
        bet: betGame[`${item.username}`]?._sum.amount ?? 0,
        win: winGame[`${item.username}`]?._sum.amount ?? 0,
        charge: chargeGame[`${item.username}`]?._sum.amount ?? 0
      }
    };

    return data;
  } catch (error: any) {
    throw Error(error);
  }
};

export const getAllByAgentId = async (query: any, id: number) => {
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
        AND: {
          OR: [
            {
              parentAgent: {
                OR: [
                  {
                    id: Number(id)
                  },
                  {
                    parentAgentIds: {
                      array_contains: [Number(id)]
                    }
                  }
                ]
              }
            }
          ]
        },
        OR: [
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

const _getAllSumsByUsername = async (username: string[]) => {
  try {
    const winGame = await _getSumTransactionByUsername(
      'win',
      'receiverUsername',
      username
    );
    const betGame = await _getSumTransactionByUsername(
      'bet',
      'senderUsername',
      username
    );
    const chargeGame = await _getSumTransactionByUsername(
      'charge',
      'receiverUsername',
      username
    );
    const sentOut = await _getSumTransactionByUsername(
      'add',
      'senderUsername',
      username
    );
    const received = await _getSumTransactionByUsername(
      'add',
      'receiverUsername',
      username
    );

    const balance = { winGame, betGame, chargeGame, sentOut, received };

    return balance;
  } catch (error: any) {
    throw Error(error);
  }
};

const _getSumTransaction = async (type: string, groupBy: any) => {
  const sumBalance = (await prismaTransaction.transactions.groupBy({
    by: [groupBy],
    _sum: {
      amount: true
    },
    where: {
      type
    }
  })) as any;

  const formattedResult = sumBalance.reduce((acc: any, item: any) => {
    acc[item.senderUsername ?? item.receiverUsername] = item;
    return acc;
  }, {});

  return formattedResult;
};

const _getSumTransactionByUsername = async (
  type: string,
  groupBy: any,
  usernames: string[]
) => {
  const sumBalance = (await prismaTransaction.transactions.groupBy({
    by: [groupBy],
    _sum: {
      amount: true
    },
    where: {
      type,
      [`${groupBy}`]: {
        in: usernames
      }
    }
  })) as any;

  const formattedResult = sumBalance.reduce((acc: any, item: any) => {
    acc[item.senderUsername ?? item.receiverUsername] = item;
    return acc;
  }, {});

  return formattedResult;
};
