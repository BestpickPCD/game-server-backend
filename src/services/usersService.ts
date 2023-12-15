import { getAffiliatedAgentsByUserId } from '../controllers/userController/utilities.js';
import {
  Prisma,
  PrismaClient,
  Users
} from '../config/prisma/generated/base-default/index.js';
const prisma = new PrismaClient();
import {
  PrismaClient as PrismaClientTransaction,
  Transactions
} from '../config/prisma/generated/transactions/index.js';
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
    `;

    const users = (await prisma.$queryRawUnsafe(`${rawQuery}
    LIMIT ${size} OFFSET ${page > 1 ? page * size : 0}
    `)) as any;
    const total = (await prisma.$queryRawUnsafe(`${rawQuery}`)) as any;

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
        amount: true
      },
      orderBy: {
        userId: 'asc'
      }
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

    return { userDetails, page, size, total: total.length };
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

export const getUsers = async (agentId: string) => {
  const users = await prisma.users.findMany({
    select: {
      id: true,
      username: true,
      name: true,
      balance: true,
      type: true,
      role: {
        select: {
          id: true,
          name: true
        }
      }
    },
    where: {
      parentAgentId: agentId
    }
  });
  return users;
};

export const getDashboardData = async (user: Users) => {
  try {
    const item = (await prisma.users.findUnique({
      select: {
        id: true,
        name: true,
        username: true,
        currency: {
          select: {
            name: true,
            code: true
          }
        },
        type: true,
        accountNumber: true,
        callbackUrl: true,
        apiCall: true,
        parentAgentId: true,
        balance: true
      },
      where: {
        id: user.id,
        deletedAt: null,
        isActive: true
      }
    })) as any;

    const users = await getUsers(user.id);
    const players = users.filter((item) => item.type === 'player');

    const balanceOfChildUsers = players.reduce(
      (acc, cur) => acc + Number(cur.balance),
      0
    );

    const distributionSubAgent = users.filter(
      (item) => item?.role?.id === 3 && item.type === 'agent'
    ).length;
    const operationSubAgent = users.filter(
      (item) => item?.role?.id === 2 && item.type === 'agent'
    ).length;
    const parallelSubAgent = users.filter(
      (item) => item?.role?.id === 4 && item.type === 'agent'
    ).length;

    const { affiliatedAgents, affiliatedUserId } =
      await getAffiliatedAgentsByUserId(user.id);

    const { sums: affiliatedSums, agentSums: agentAffiliatedSums } =
      await _getAllSumsByUserId(false, affiliatedUserId);

    affiliatedAgents.map((affiliatedAgent: any) => {
      affiliatedAgent.allSums = affiliatedSums[`${affiliatedAgent.id}`];
      affiliatedAgent.agentAllSums =
        agentAffiliatedSums[`${affiliatedAgent.id}`];
    });

    const { sums: balance, agentSums: agentSums } = await _getAllSumsByUserId(
      true,
      [item.id]
    );
    const userBalance = {
      ...balance[`${item.id}`],
      balance: parseFloat(item.balance) ?? 0
    };

    const balanceOfChildAgents = affiliatedAgents.reduce(
      (acc, cur) => acc + Number(cur.balance),
      0
    );

    const data = {
      userId: item.id,
      name: item.name,
      username: item.username,
      affiliatedAgents,
      currency: item.currency,
      type: item.type,
      accountNumber: item.accountNumber,
      callbackUrl: item.callbackUrl,
      apiCall: item.apiCall,
      parentAgentId: item.parentAgentId,
      balance: userBalance,
      balanceAsAgent: agentSums[`${item.id}`],
      totalSubAgent: affiliatedAgents.length,
      balanceOfChildAgents,
      balanceOfChildUsers,
      distributionSubAgent,
      operationSubAgent,
      parallelSubAgent
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

const _getAllSumsByUserId = async (isAgent: boolean, userIds: string[]) => {
  try {
    const balances = await _getSumTransactionByUserIds(isAgent, userIds);
    return balances;
  } catch (error: any) {
    throw Error(error);
  }
};

interface Sums {
  win: number;
  bet: number;
  deposit: number;
  withdraw: number;
  'user.add_balance': number;
  'agent.add_balance': number;
}

const _getSumTransactionByUserIds = async (
  isAgent: boolean,
  userIds: string[]
) => {
  let agentFilter: any;
  if (isAgent) {
    agentFilter = {
      agentId: {
        in: userIds
      }
    };
  }

  const sumBalance = (await prismaTransaction.transactions.findMany({
    where: {
      OR: [
        {
          userId: {
            in: userIds
          }
        },
        agentFilter
      ],
      NOT: {
        status: {
          in: ['pending', 'rejected']
        }
      }
    }
  })) as Transactions[];

  const sums: Record<string, Sums> = {};
  const agentSums: Record<string, Sums> = {};

  sumBalance.forEach((transaction: any) => {
    const { userId, type, amount, agentId } = transaction;

    if (!sums[userId]) {
      sums[userId] = {
        win: 0,
        bet: 0,
        deposit: 0,
        withdraw: 0,
        'user.add_balance': 0,
        'agent.add_balance': 0
      };
    }

    switch (type) {
      case 'win':
        sums[userId].win += amount;
        break;
      case 'bet':
        sums[userId].bet += amount;
        break;
      case 'deposit':
        sums[userId].deposit += amount;
        break;
      case 'user.add_balance':
        sums[userId]['user.add_balance'] += amount;
        break;
      case 'agent.add_balance':
        sums[userId]['agent.add_balance'] += amount;
        break;
      default:
    }

    if (agentId) {
      if (!agentSums[agentId]) {
        agentSums[agentId] = {
          win: 0,
          bet: 0,
          deposit: 0,
          withdraw: 0,
          'user.add_balance': 0,
          'agent.add_balance': 0
        };
      }

      switch (type) {
        case 'win':
          agentSums[agentId].win += amount;
          break;
        case 'bet':
          agentSums[agentId].bet += amount;
          break;
        case 'deposit':
          agentSums[agentId].deposit += amount;
          break;
        case 'withdraw':
          agentSums[agentId].withdraw += amount;
          break;
        case 'user.add_balance':
          agentSums[agentId]['user.add_balance'] += amount;
          break;
        case 'agent.add_balance':
          agentSums[agentId]['agent.add_balance'] += amount ?? 0;
          break;
        default:
      }
    }
  });

  const formattedResult = { sums, agentSums };
  return formattedResult;
};
