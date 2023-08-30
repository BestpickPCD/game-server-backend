import { Prisma, PrismaClient, Users } from '@prisma/client';
const prisma = new PrismaClient();

export const getAllWithBalance = async (userId: number) => {
  try {
    const users = (await prisma.$queryRaw`SELECT * FROM 
    (SELECT id, name, email, username, type, balance, currencyId, isActive, updatedAt FROM Users users WHERE deletedAt IS NULL) AS users JOIN 
    (SELECT players.agentId, players.id, agents.parentAgentIds FROM Players players JOIN Agents agents ON agents.id = players.agentId WHERE ( JSON_CONTAINS(agents.parentAgentIds, JSON_ARRAY(${userId})) OR players.agentId = ${userId})) AS players ON players.id = users.id LEFT JOIN 
    (SELECT SUM(amount) AS amountSentOut, senderId FROM Transactions transactions WHERE TYPE IN ('add') GROUP BY senderId ) AS senders ON senders.senderId = users.id LEFT JOIN 
    (SELECT SUM(amount) AS amountReceived, receiverId FROM Transactions transactions WHERE TYPE IN ('add') GROUP BY receiverId ) AS receivers ON receivers.receiverId = users.id LEFT JOIN 
    (SELECT SUM(amount) AS winGameAmount, receiverId FROM Transactions transactions WHERE TYPE IN ('win') GROUP BY receiverId ) AS winGamers ON winGamers.receiverId = users.id LEFT JOIN 
    (SELECT SUM(amount) AS betGameAmount, senderId FROM Transactions transactions WHERE TYPE IN ('bet') GROUP BY senderId ) AS betGamers ON betGamers.senderId = users.id LEFT JOIN 
    (SELECT SUM(amount) AS chargeGameAmount, receiverId FROM Transactions transactions WHERE TYPE IN ('charge') GROUP BY receiverId ) AS chargeGamers ON chargeGamers.receiverId = users.id 
    ORDER BY users.updatedAt DESC`) as any;

    const userDetails = users.map((row: any) => {
      const data = {
        ...row,
        user: {
          name: row.name,
          username: row.username,
          betGameAmount:
            ((row.winGameAmount as number) ?? 0) -
              ((row.betGameAmount as number) ?? 0) -
              ((row.chargeGameAmount as number) ?? 0) ?? 0,
          amountReceived: row.amountReceived ?? 0,
          winGameAmount: row.winGameAmount ?? 0,
          chargeGameAmount: row.chargeGameAmount ?? 0,
          balance: row.balance ?? 0,
          updatedAt: row.updatedAt
        }
      };
      return data;
    });

    return userDetails;
  } catch (error) {
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

    const filter: Prisma.PlayersFindManyArgs = {
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
      prisma.players.count({
        where: filter.where
      }),
      prisma.players.findMany(filter)
    ]);

    return { data, totalItems, page, size };
  } catch (error) {
    throw Error(error);
  }
};

export const getById = async (id: number) => {
  try {
    const user = (await prisma.users.findUnique({
      where: {
        id
      }
    })) as Users;

    return user;
  } catch (error) {
    throw Error(error);
  }
};

export const getPlayerById = async (id: number, userId: number) => {
  try {
    const user = (await prisma.users.findUnique({
      where: {
        id: Number(userId),
        Players: {
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
        Players: {
          select: {
            agent: {
              select: {
                id: true,
                user: true
              }
            }
          }
        }
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
  } catch (error) {
    console.log(error);
    throw Error(error);
  }
};

export const getDashboardData = async (userId: number) => {
  try {
    const dashboard = (await prisma.$queryRaw`
      SELECT * FROM  
        (SELECT id, balance, name, type FROM Users WHERE id = ${userId}) AS USER LEFT JOIN 
        (SELECT COUNT(id) AS subAgent, parentAgentId FROM Agents WHERE parentAgentId = ${userId} GROUP BY parentAgentId) AS subAgent ON subAgent.parentAgentId = User.id LEFT JOIN
        (SELECT COUNT(id) AS players, agentId FROM Players WHERE agentId = ${userId} GROUP BY agentId) AS players ON players.agentId = User.id LEFT JOIN
        (SELECT IFNULL(SUM(amount),0) AS sendOut, senderId FROM Transactions WHERE senderId = ${userId} AND type = 'add' GROUP BY senderId) AS sendOut ON sendOut.senderId = User.id LEFT JOIN
        (SELECT IFNULL(SUM(amount),0) AS receive, receiverId FROM Transactions WHERE receiverId = ${userId} AND type = 'add' GROUP BY receiverId) AS receive ON receive.receiverId = User.id LEFT JOIN
        (SELECT IFNULL(SUM(amount),0) AS bet, senderId FROM Transactions WHERE senderId = ${userId} AND type = 'bet' GROUP BY senderId) AS bet ON bet.senderId = User.id LEFT JOIN
        (SELECT IFNULL(SUM(amount),0) AS win, receiverId FROM Transactions WHERE receiverId = ${userId} AND type = 'win' GROUP BY receiverId) AS win ON win.receiverId = User.id LEFT JOIN
        (SELECT IFNULL(SUM(amount),0) AS charge, receiverId FROM Transactions WHERE receiverId = ${userId} AND type = 'charge' GROUP BY receiverId) AS charge ON charge.receiverId = User.id 
    `) as any;

    const item = dashboard[0];
    const data = {
      userId: item.id,
      name: item.name,
      type: item.type,
      subAgent: parseInt(item.subAgent),
      parentAgentId: item.parentAgentId,
      players: parseInt(item.players),
      agentId: item.agentId,
      balance: {
        balance: item.balance ?? 0,
        calculatedBalance:
          (item.receive ?? 0 + item.win ?? 0) -
          (item.sendOut ?? 0 + item.bet ?? 0 + item.charge ?? 0),
        sendOut: item.sendOut ?? 0,
        receive: item.receive ?? 0,
        bet: item.bet ?? 0,
        win: item.win ?? 0,
        charge: item.charge ?? 0
      }
    };

    return data;
  } catch (error) {
    console.log(error);
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
              Agents: {
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
            {
              Players: {
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
  } catch (error) {
    console.log(error);
    throw Error(error);
  }
};
