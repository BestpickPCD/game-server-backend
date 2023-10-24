import {
  Prisma,
  PrismaClient,
  Users
} from '../../config/prisma/generated/base-default/index.js';
import { Request, Response } from 'express';
import bcrypt from 'bcrypt';
import { message } from '../../utilities/constants/index.ts';
import {
  getAffiliatedAgentsByUserId,
  getParentAgentIdsByParentAgentId
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

export const getAllAffiliatedAgents = async (
  req: RequestWithUser,
  res: Response
): Promise<any> => {
  try {
    const { id } = (req as any).user;
    const affiliatedAgents = await getAffiliatedAgentsByUserId(id);
    return res.status(200).json(affiliatedAgents);
  } catch (error) {
    console.log(error);
    return res.status(500).json({ message: message.INTERNAL_SERVER_ERROR });
  }
};

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
      data: data.data,
      totalItems: data.totalItems,
      page: Number(data.page),
      size: Number(data.size)
    });
  } catch (error) {
    return res.status(500).json({ message: message.INTERNAL_SERVER_ERROR });
  }
};

export const updateUser = async (req: Request, res: Response): Promise<any> => {
  try {
    const { userId } = req.params;
    // const redisKey = 'userById';
    // const { redisData, redisKeyWithId } = await getRedisData(
    //   userId,
    //   redisKey,
    //   'Invalid users Id'
    // );
    // let data: any;
    // if (redisData) {
    //   data = JSON.parse(redisData);
    // } else {
    const data = (await getById(userId)) as any;
    // }
    // !redisData && (await Redis.set(redisKeyWithId, JSON.stringify(data)));

    if (!data) {
      return res.status(404).json({ message: message.NOT_FOUND });
    }

    const {
      name,
      email,
      roleId,
      currencyId,
      agentId,
      rate,
      parentAgentId,
      accountNumber,
      callbackUrl,
      apiCall
    } = req.body;
    const updatedUser = {
      ...(name && { name }),
      ...(email && { email }),
      ...(roleId && { roleId }),
      ...(currencyId && { currencyId }),
      ...(parentAgentId && { parentAgentId }),
      ...(accountNumber && { accountNumber }),
      ...(callbackUrl && { callbackUrl }),
      ...(rate && { rate }),
      ...(apiCall && { apiCall })
    };

    const newUser = await prisma.users.update({
      where: { id: userId },
      data: updatedUser
    });

    // await Redis.del(redisKey);
    // await Redis.del(redisKeyWithId);
    if (agentId) {
      if (newUser && newUser.type == 'agent') {
        return _updateAgent(newUser, parentAgentId, res);
      } else if (newUser && newUser.type == 'player') {
        return res.status(404).json({ message: message.SUCCESS });
      }
      return res.status(404).json({ message: message.USER_TYPE_NOT_FOUND });
    }

    return res.status(200).json({ message: message.SUCCESS });
  } catch (error: any) {
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

export const updatePassword = async (
  req: Request,
  res: Response
): Promise<any> => {
  try {
    const { userId, password, passwordConfirm, oldPassword } = req.body;
    const user = await prisma.users.findUnique({
      where: {
        id: userId
      }
    });
    if (!user || !password) {
      return res.status(404).json({ message: message.NOT_FOUND });
    } else if (user && password && oldPassword && passwordConfirm) {
      const isValid = await bcrypt.compare(oldPassword, (user as any).password);

      if (isValid && password == passwordConfirm) {
        const newPassword = await prisma.users.update({
          where: { id: userId },
          data: { password: await bcrypt.hash(password, 10) }
        });

        return res
          .status(200)
          .json({ message: message.SUCCESS, data: newPassword });
      } else {
        return res
          .status(400)
          .json({ message: 'Your old or new passwords are not matching' });
      }
    }
    return res.status(400).json({ message: message.NOT_FOUND });
  } catch (error) {
    return res
      .status(500)
      .json({ message: message.INTERNAL_SERVER_ERROR, error });
  }
};

export const blockUser = async (req: Request, res: Response): Promise<any> => {
  try {
    const { userId } = req.body;
    const user = await prisma.users.findUnique({
      where: {
        id: userId
      }
    });
    if (!user) {
      return res.status(404).json({ message: message.NOT_FOUND });
    }

    const block = (await prisma.users.update({
      where: { id: userId },
      data: {
        isActive: false,
        lockedAt: new Date()
      }
    })) as Users;

    return res.status(200).json({ message: message.SUCCESS, data: block });
  } catch (error) {
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
    // const { redisData, redisKeyWithId } = await getRedisData(
    //   userId,
    //   'userById',
    //   'Invalid users Id'
    // );
    // let data: any;
    // if (redisData) {
    //   data = JSON.parse(redisData);
    // } else {
    const data = (await getById(userId)) as any;
    // }
    // !redisData && (await Redis.set(redisKeyWithId, JSON.stringify(data)));

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
      userId,
      redisKey,
      'Invalid users Id'
    );
    let data: any;
    if (redisData) {
      data = JSON.parse(redisData);
    } else {
      data = (await getById(userId)) as any;
    }
    !redisData && (await Redis.set(redisKeyWithId, JSON.stringify(data)));

    if (data) {
      await prisma.users.update({
        where: { id: userId },
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
    const data = (await getDashboardData(id)) as any;
    return res.status(200).json(data);
  } catch (error) {
    return res
      .status(500)
      .json({ message: message.INTERNAL_SERVER_ERROR, error });
  }
};

const _updateAgent = async (
  user: Users,
  parentAgentId: string | null,
  res: Response
) => {
  try {
    if (parentAgentId == user.id) {
      return res
        .status(400)
        .json({ message: 'Parent agent cannot be yourself' });
    }

    let details: any;

    if (parentAgentId) {
      details = await getParentAgentIdsByParentAgentId(parentAgentId);
    }
    const agent = await prisma.users.update({
      where: { id: user.id },
      data: {
        parentAgentIds: parentAgentId ? details.parentAgentIds : [],
        level: parentAgentId ? details.level : null
      }
    });
    return res.status(200).json({ message: message.SUCCESS, data: agent });
  } catch (error) {
    return res.status(500).json({ message: 'Internal server error' });
  }
};

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

export const checkUser = async (req: Request, res: Response) => {
  try {
    const foundUser = await prisma.users.findUnique({
      select: {
        id: true,
        type: true,
        name: true,
        parentAgentId: true,
        parent: {
          select: {
            id: true,
            name: true,
            username: true
          }
        }
      },
      where: {
        id: req.body.id
      }
    });
    if (!foundUser) {
      return res.status(404).json({ message: 'User not found' });
    }
    return res.status(200).json({ data: foundUser });
  } catch (error) {
    return res.status(500).json({ message: message.INTERNAL_SERVER_ERROR });
  }
};
