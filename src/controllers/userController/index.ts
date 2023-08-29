import { Prisma, PrismaClient } from '@prisma/client';
import { Request, Response } from 'express';
import { message } from '../../utilities/constants/index.ts';
import {
  getParentAgentIdsByParentAgentId
  // getBalanceSummariesByIds
} from './utilities.ts';
import { RequestWithUser } from '../../models/customInterfaces.ts';
const prisma = new PrismaClient();

export const getAllUsersWithBalances = async (
  // Only used until can merge this raw query in prisma ORM
  req: RequestWithUser,
  res: Response
): Promise<any> => {
  try {
    const users = (await prisma.$queryRaw`SELECT * FROM 
    (SELECT id, name, email, username, type, balance, currencyId, isActive, updatedAt FROM Users users WHERE deletedAt IS NULL) AS users JOIN 
    (SELECT players.agentId, players.id, agents.parentAgentIds FROM Players players JOIN Agents agents ON agents.id = players.agentId WHERE ( JSON_CONTAINS(agents.parentAgentIds, JSON_ARRAY(${req.user?.id})) OR players.agentId = ${req.user?.id})) AS players ON players.id = users.id LEFT JOIN 
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

    return res.status(200).json({
      data: {
        data: userDetails,
        totalItems: users.length,
        page: Number(1),
        size: Number(200)
      },
      message: message.SUCCESS
    });
  } catch (error) {
    console.log(error);
    return res.status(500).json({ message: message.INTERNAL_SERVER_ERROR });
  }
};

export const getAllUsers = async (
  req: RequestWithUser,
  res: Response
): Promise<any> => {
  const { id } = (req as any).user;

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
    } = req.query;

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

    return res.status(200).json({
      data: {
        data,
        totalItems,
        page: Number(page),
        size: Number(size)
      },
      message: message.SUCCESS
    });
  } catch (error) {
    console.log(error);
    return res.status(500).json({ message: message.INTERNAL_SERVER_ERROR });
  }
};

export const updateUser = async (req: Request, res: Response): Promise<any> => {
  try {
    const userId = parseInt(req.params.userId);
    const user = await prisma.users.findUnique({
      where: {
        id: userId,
        Agents: {
          parentAgentIds: {
            array_contains: [Number(userId)]
          }
        }
      }
    });
    if (!user) {
      return res.status(404).json({ message: message.NOT_FOUND });
    }
    const { name, email, roleId, currencyId, agentId, parentAgentId } =
      req.body;
    const updatedUser = {
      ...(name && { name }),
      ...(email && { email }),
      ...(roleId && { roleId }),
      ...(currencyId && { currencyId })
    };
    const newUser = await prisma.users.update({
      where: { id: userId },
      data: { ...user, ...updatedUser }
    });

    if (newUser && newUser.type == 'player') {
      return _updatePlayer(newUser, agentId, res);
    } else if (newUser && newUser.type == 'agent') {
      return _updateAgent(newUser, parentAgentId, res);
    }
    return res.status(404).json({ message: message.USER_TYPE_NOT_FOUND });
  } catch (error) {
    if (error.code === 'P2002') {
      return res.status(400).json({
        message: message.DUPLICATE,
        subMessage: 'Email already exists'
      });
    } else if (error.code === 'P2003') {
      if (error.meta.field_name === 'roleId') {
        return res.status(404).json({
          message: message.NOT_FOUND,
          subMessage: 'RoleId not found'
        });
      }
      if (error.meta.field_name === 'currencyId') {
        return res.status(404).json({
          message: message.NOT_FOUND,
          subMessage: 'CurrencyId not found'
        });
      }
    }
    return res
      .status(500)
      .json({ message: message.INTERNAL_SERVER_ERROR, error });
  }
};

export const getUserById = async (
  req: Request,
  res: Response
): Promise<any> => {
  const { userId } = req.params;

  try {
    const { id } = (req as any).user;
    const user = await prisma.users.findUnique({
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
    });

    if (!user) {
      return res.status(404).json({ message: message.NOT_FOUND });
    }

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

    return res.status(200).json({ message: message.SUCCESS, data });
  } catch (error) {
    return res
      .status(500)
      .json({ message: message.INTERNAL_SERVER_ERROR, error });
  }
};

export const deleteUser = async (req: Request, res: Response): Promise<any> => {
  try {
    const { id } = (req as any).user;
    const userId = parseInt(req.params.userId);

    const deleteUser = await prisma.users.findUnique({
      where: {
        id: Number(userId),
        deletedAt: null,
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
    });
    if (deleteUser) {
      await prisma.users.update({
        where: { id: userId },
        data: { deletedAt: new Date() }
      });
      return res.status(200).json({ message: message.DELETED });
    }
    return res.status(404).json({ message: message.NOT_FOUND });
  } catch (error) {
    return res
      .status(500)
      .json({ message: message.INTERNAL_SERVER_ERROR, error });
  }
};

export const dashboard = async (req:RequestWithUser, res:Response):Promise<any> => {
  try {
    const userId = req.user?.id 
    const dashboard = await prisma.$queryRaw`
      SELECT * FROM  
        (SELECT id, balance, name, type FROM Users WHERE id = ${userId}) AS USER LEFT JOIN 
        (SELECT COUNT(id) AS subAgent, parentAgentId FROM Agents WHERE parentAgentId = ${userId} GROUP BY parentAgentId) AS subAgent ON subAgent.parentAgentId = User.id LEFT JOIN
        (SELECT COUNT(id) AS players, agentId FROM Players WHERE agentId = ${userId} GROUP BY agentId) AS players ON players.agentId = User.id LEFT JOIN
        (SELECT IFNULL(SUM(amount),0) AS sendOut, senderId FROM Transactions WHERE senderId = ${userId} AND type = 'add' GROUP BY senderId) AS sendOut ON sendOut.senderId = User.id LEFT JOIN
        (SELECT IFNULL(SUM(amount),0) AS receive, receiverId FROM Transactions WHERE receiverId = ${userId} AND type = 'add' GROUP BY receiverId) AS receive ON receive.receiverId = User.id LEFT JOIN
        (SELECT IFNULL(SUM(amount),0) AS bet, senderId FROM Transactions WHERE senderId = ${userId} AND type = 'bet' GROUP BY senderId) AS bet ON bet.senderId = User.id LEFT JOIN
        (SELECT IFNULL(SUM(amount),0) AS win, receiverId FROM Transactions WHERE receiverId = ${userId} AND type = 'win' GROUP BY receiverId) AS win ON win.receiverId = User.id LEFT JOIN
        (SELECT IFNULL(SUM(amount),0) AS charge, receiverId FROM Transactions WHERE receiverId = ${userId} AND type = 'charge' GROUP BY receiverId) AS charge ON charge.receiverId = User.id 
    ` as any
    const { ...data } = { ...dashboard[0] }
    return res.status(200).json(data)
  } catch (error) {
    console.log(error)
  }
}

const _updateAgent = async (
  user: any,
  parentAgentId: number,
  res: Response
) => {
  try {
    if (parentAgentId == user.id) {
      return res
        .status(400)
        .json({ message: 'Parent agent cannot be yourself' });
    }

    const details: any = await getParentAgentIdsByParentAgentId(parentAgentId);
    const agent = await prisma.agents.update({
      where: { id: user.id },
      data: {
        parentAgentId,
        parentAgentIds: details.parentAgentIds,
        level: details.level
      }
    });
    return res.status(200).json({ message: message.SUCCESS, data: agent });
  } catch (error) {
    console.log(error);
    return res.status(500).json({ message: 'Internal server error' });
  }
};

const _updatePlayer = async (user: any, agentId: number, res: Response) => {
  try {
    const player = await prisma.players.update({
      where: { id: user.id },
      data: { agentId }
    });
    return res.status(200).json({ data: player, message: message.UPDATED });
  } catch (error) {
    console.log(error);
    return res.status(500).json({ message: 'Internal server error' });
  }
};

export const getAllUsersByAgentId = async (
  req: Request,
  res: Response
): Promise<any> => {
  const { id } = (req as any).user;
  try {
    const {
      page = 0,
      size = 10,
      search = ''
    }: {
      page?: number;
      size?: number;
      search?: string;
    } = req.query;

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

    return res.status(200).json({
      data: {
        data,
        totalItems,
        page: Number(page),
        size: Number(size)
      },
      message: message.SUCCESS
    });
  } catch (error) {
    return res.status(500).json({ message: message.INTERNAL_SERVER_ERROR });
  }
};
