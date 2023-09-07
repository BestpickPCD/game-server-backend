import { PrismaClient } from '@prisma/client';
import { Request, Response } from 'express';
import { message } from '../../utilities/constants/index.ts';
import {
  getParentAgentIdsByParentAgentId
  // getBalanceSummariesByIds
} from './utilities.ts';
import Redis, { getRedisData } from '../../config/redis/index.ts';
import { RequestWithUser } from '../../models/customInterfaces.ts';
import {
  getAll,
  getAllByAgentId,
  getAllWithBalance,
  getById,
  getDashboardData
} from '../../services/usersService.ts';
const prisma = new PrismaClient();

export const getAllUsersWithBalances = async (
  // Only used until can merge this raw query in prisma ORM
  req: RequestWithUser,
  res: Response
): Promise<any> => {
  try {
    const { id } = (req as any).user;
    // const { redisData, redisKeyWithId } = await getRedisData(
    //   id,
    //   'users',
    //   'Invalid users Id'
    // );
    // let data: any;
    // if (redisData) {
    //   data = JSON.parse(redisData);
    // } else {
    // data = (await getAllWithBalance(id)) as any;
    const { userDetails, page, size } = (await getAllWithBalance(
      req.query,
      id
    )) as any;
    // }
    // !redisData && (await Redis.set(redisKeyWithId, JSON.stringify(data)));

    return res.status(200).json({
      data: {
        data: userDetails,
        totalItems: 200,
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

export const getAllUsers = async (
  req: RequestWithUser,
  res: Response
): Promise<any> => {
  try {
    const { id } = (req as any).user;
    const { redisData, redisKeyWithId } = await getRedisData(
      id,
      'users',
      'Invalid users Id'
    );
    let data: any;
    if (redisData) {
      data = JSON.parse(redisData);
    } else {
      data = (await getAll(req.query, id)) as any;
    }
    !redisData && (await Redis.set(redisKeyWithId, JSON.stringify(data)));

    return res.status(200).json({
      data: {
        data: data.data,
        totalItems: data.totalItems,
        page: Number(data.page),
        size: Number(data.size)
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
    const { userId } = req.params;
    const redisKey = 'userById';
    const { redisData, redisKeyWithId } = await getRedisData(
      parseInt(userId),
      redisKey,
      'Invalid users Id'
    );
    let data: any;
    if (redisData) {
      data = JSON.parse(redisData);
    } else {
      data = (await getById(parseInt(userId))) as any;
    }
    !redisData && (await Redis.set(redisKeyWithId, JSON.stringify(data)));

    if (!data) {
      return res.status(404).json({ message: message.NOT_FOUND });
    }

    const { name, email, roleId, currencyId, parentAgentId } =
      req.body;
    const updatedUser = {
      ...(name && { name }),
      ...(email && { email }),
      ...(roleId && { roleId }),
      ...(currencyId && { currencyId })
    };

    const newUser = await prisma.users.update({
      where: { id: parseInt(userId) },
      data: { ...data, ...updatedUser }
    });

    await Redis.del(redisKey);
    await Redis.del(redisKeyWithId);
    if (newUser && newUser.type == 'agent') {
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
  try {
    const { userId } = req.params;
    const { redisData, redisKeyWithId } = await getRedisData(
      parseInt(userId),
      'userById',
      'Invalid users Id'
    );
    let data: any;
    if (redisData) {
      data = JSON.parse(redisData);
    } else {
      data = (await getById(parseInt(userId))) as any;
    }
    !redisData && (await Redis.set(redisKeyWithId, JSON.stringify(data)));

    if (!data) {
      return res.status(404).json({ message: message.NOT_FOUND });
    }

    return res.status(200).json({ message: message.SUCCESS, data });
  } catch (error) {
    return res
      .status(500)
      .json({ message: message.INTERNAL_SERVER_ERROR, error });
  }
};

export const deleteUser = async (req: Request, res: Response): Promise<any> => {
  try {
    const { userId } = req.params;
    const redisKey = 'userById';
    const { redisData, redisKeyWithId } = await getRedisData(
      parseInt(userId),
      redisKey,
      'Invalid users Id'
    );
    let data: any;
    if (redisData) {
      data = JSON.parse(redisData);
    } else {
      data = (await getById(parseInt(userId))) as any;
    }
    !redisData && (await Redis.set(redisKeyWithId, JSON.stringify(data)));

    if (data) {
      await prisma.users.update({
        where: { id: parseInt(userId) },
        data: { deletedAt: new Date() }
      });
      await Redis.del(redisKey);
      await Redis.del(redisKeyWithId);
      return res.status(200).json({ message: message.DELETED });
    }
    return res.status(404).json({ message: message.NOT_FOUND });
  } catch (error) {
    return res
      .status(500)
      .json({ message: message.INTERNAL_SERVER_ERROR, error });
  }
};

export const getDashboard = async (
  req: RequestWithUser,
  res: Response
): Promise<any> => {
  try {
    const { id } = (req as any).user;
    const { redisData, redisKeyWithId } = await getRedisData(
      id,
      'dashboard',
      'Invalid users Id'
    );
    let data: any;
    if (redisData) {
      data = JSON.parse(redisData);
    } else {
      data = (await getDashboardData(id)) as any;
    }
    !redisData && (await Redis.set(redisKeyWithId, JSON.stringify(data)));
    return res.status(200).json(data);
  } catch (error) {
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
    const agent = await prisma.users.update({
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

// const _updatePlayer = async (user: any, agentId: number, res: Response) => {
//   try {
//     const player = await prisma.players.update({
//       where: { id: user.id },
//       data: { agentId }
//     });
//     return res.status(200).json({ data: player, message: message.UPDATED });
//   } catch (error) {
//     console.log(error);
//     return res.status(500).json({ message: 'Internal server error' });
//   }
// };

export const getAllUsersByAgentId = async (
  req: Request,
  res: Response
): Promise<any> => {
  try {
    const { id } = (req as any).user;
    const { redisData, redisKeyWithId } = await getRedisData(
      id,
      'userByAgentId',
      'Invalid users Id'
    );
    let data: any;
    if (redisData) {
      data = JSON.parse(redisData);
    } else {
      data = (await getAllByAgentId(req.query, id)) as any;
    }
    !redisData && (await Redis.set(redisKeyWithId, JSON.stringify(data)));
    const { totalItems, page, size } = data;
    return res.status(200).json({
      data: {
        data: data.data,
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
