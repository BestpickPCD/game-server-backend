import { Prisma, PrismaClient } from '@prisma/client';
import { Request, Response } from 'express';
import { message } from '../../utilities/constants/index.ts';
import { getParentAgentIdsByParentAgentId } from './utilities.ts';
const prisma = new PrismaClient();

// Define your route handler to get all users
export const getAllUsers = async (
  req: Request,
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
                  array_contains: [Number(agentId || id)]
                }
              }
            },
            {
              agentId: Number(agentId || id)
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
    return res.status(500).json({ message: message.INTERNAL_SERVER_ERROR });
  }
};

export const updateUser = async (req: Request, res: Response): Promise<any> => {
  try {
    const userId = parseInt(req.params.userId);
    const user = await prisma.users.findUnique({
      where: {
        id: userId
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
    const user = await prisma.users.findUnique({
      where: {
        id: parseInt(userId)
      },
      select: {
        id: true,
        name: true,
        username: true,
        email: true,
        type: true,
        role: {
          select: {
            name: true
          }
        },
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
      agent: user.Players?.agent?.user?.name ?? null
    };

    return res.status(200).json({ message: message.SUCCESS, data: data });
  } catch (error) {
    console.log(error);
    return res
      .status(500)
      .json({ message: message.INTERNAL_SERVER_ERROR, error });
  }
};

export const deleteUser = async (req: Request, res: Response): Promise<any> => {
  try {
    const userId = parseInt(req.params.userId);

    const deleteUser = await prisma.users.findUnique({
      where: { id: userId }
    });
    if (deleteUser?.deletedAt == null) {
      await prisma.users.update({
        where: { id: userId },
        data: { deletedAt: new Date() }
      });
      return res.status(200).json({ message: message.DELETED });
    }
    return res.status(400).json({ message: 'User was already deleted' });
  } catch (error) {
    console.log(error);
    if (error.code === 'P2025') {
      return res.status(404).json({ message: message.NOT_FOUND });
    }
    return res
      .status(500)
      .json({ message: message.INTERNAL_SERVER_ERROR, error });
  }
};

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
