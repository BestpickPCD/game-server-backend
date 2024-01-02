import {
  PrismaClient,
  Users
} from '../../config/prisma/generated/base-default/index.js';
import axios from 'axios';
import bcrypt from 'bcrypt';
import { Request, Response } from 'express';
import Redis from '../../config/redis/index.ts';
import { RequestWithUser } from '../../models/customInterfaces.ts';
import { message } from '../../utilities/constants/index.ts';
import { getTokens } from '../../utilities/index.ts';
import {
  findCurrencyById,
  getParentAgentIdsByParentAgentId
} from '../userController/utilities.ts';
const prisma = new PrismaClient();

export const refreshToken = async (
  req: RequestWithUser,
  res: Response
): Promise<any> => {
  try {
    const user = (req as any)?.user;
    if (user) {
      const data = await formatUser(user);
      const tokens = getTokens({ ...user, id: user.id } as any as Users);
      await Redis.setex(
        `user-${user.id}-tokens`,
        7200,
        JSON.stringify({ ...data })
      );
      return res.status(200).json({ ...tokens });
    }
  } catch (error) {
    return res.status(500).json({ message: 'Something went wrong', error });
  }
};

export const apiToken = async (
  req: RequestWithUser,
  res: Response
): Promise<any> => {
  try {
    if (!req.user) {
      return res.status(404).json({ message: message.UNAUTHORIZED });
    } 

    const token = await bcrypt.hash(req.user.id, 10);

    try {
      (await prisma.users.update({
        where: { id: req.user?.id },
        data: {
          apiKey: token
        }
      })) as Users;
      return res.status(200).json({ token });
    } catch (error) {
      console.log(error);
      return res.status(500).json({ message: 'cannot update API key', error });
    }
  } catch (error) {
    console.log(error);
    return res.status(500).json(error);
  }
};

export const login = async (req: Request, res: Response): Promise<any> => {
  try {
    const { username, password } = req.body as any;
    const user = await prisma.users.findUnique({
      select: {
        id: true,
        name: true,
        email: true,
        apiKey: true,
        roleId: true,
        parentAgentId: true,
        currencyId: true,
        isActive: true,
        lockedAt: true,
        username: true,
        type: true,
        role: true,
        password: true,
        level: true
      },
      where: {
        username
      }
    });

    if (!user) {
      return res.status(400).json({ message: message.NOT_FOUND });
    } else if (user) {
      // check Password
      let isValid: boolean = false;
      if (password) {
        isValid = await bcrypt.compare(password, (user as any).password);
      }

      if (isValid) {
        const loginDate = new Date();
        const lockDate = user.lockedAt;

        await prisma.users.update({
          where: {
            id: user.id
          },
          data: { loggedIn: loginDate }
        });

        lockDate?.setDate(lockDate.getDate() + 3);
        if (!user.isActive) { 
          return res.status(500).json({ message: 'your account is not valid' });
        }

        const data = await formatUser(user);
        await Redis.setex(
          `user-${user.id}-tokens`,
          7200,
          JSON.stringify({ ...data })
        );

        return res.status(200).json({ message: message.SUCCESS, data });
      }
      // Password is incorrect
      return res.status(401).json({ message: message.INVALID_CREDENTIALS });
    }
    // Neither user nor agent exists with the given username
    return res.status(400).json({ message: message.NOT_FOUND });
  } catch (error) {
    res.status(500).json({ message: message.INTERNAL_SERVER_ERROR });
  }
};

export const register = async (req: RequestWithUser, res: Response): Promise<any> => {
  try {
    const {
      name,
      username,
      email,
      password,
      rate,
      confirmPassword,
      roleId,
      type,
      parentAgentId
    } = req.body;

    const existingUser = await prisma.users.findMany({
      select: {
        email: true,
        username: true
      },
      where: {
        OR: [{ email }, { username }]
      }
    });

    if (existingUser.length > 0) {
      return res.status(400).json({
        message: message.DUPLICATE,
        subMessage: 'Email or Username already exists'
      });
    }

    if (password !== confirmPassword) {
      return res.status(400).json({
        message: message.INVALID,
        subMessage: "Password and Confirm Password did't match"
      });
    }

    let userSchema = {
      name,
      username,
      parentAgentId: parentAgentId ?? req.user?.id ?? null,
      type,
      roleId,
      currencyId: 1
    } as any;

    if (password) {
      const hashedPassword = await bcrypt.hash(password, 10);
      userSchema = { password: hashedPassword, ...userSchema };
    }
    if (email) {
      userSchema = { email, ...userSchema };
    }
    try {
      if (type == 'player') {
        return _playerInsert(userSchema, res);
      } else if (type == 'agent') {
        if (rate) {
          userSchema = { rate, ...userSchema };
        }
        return _agentInsert(userSchema, res);
      }
    } catch (error) {
      return res
        .status(500)
        .json({ message: message.INTERNAL_SERVER_ERROR, error });
    }
  } catch (error) {
    return res
      .status(500)
      .json({ message: message.INTERNAL_SERVER_ERROR, error });
  }
};

const _playerInsert = async (userSchema: any, res: Response) => {
  try {
    const newUser: any = await _userInsert(userSchema);

    return res.status(201).json({
      data: newUser,
      message: message.CREATED
    });
  } catch (error) {
    return res.status(500).json({
      message: 'Internal server error'
    });
  }
};

const _agentInsert = async (userSchema: any, res: Response) => {
  try {
    let details;
    const newUser: any = await _userInsert(userSchema);
    if (newUser.parentAgentId) {
      details = await getParentAgentIdsByParentAgentId(newUser.parentAgentId);
    }
    const userInsert = (await prisma.users.update({
      where: {
        id: newUser.id
      },
      data: {
        rate: userSchema?.rate ?? 0,
        parentAgentIds: newUser.parentAgentId ? details.parentAgentIds : [],
        level: newUser.parentAgentId ? details.level : null
      }
    })) as any;

    const userResponse = {
      userId: userInsert.id,
      username: newUser.username
    };

    return res.status(201).json({
      data: userResponse,
      message: message.CREATED
    });
  } catch (error) {
    return res.status(500).json({
      message: 'Internal server error'
    });
  }
};

export const _userInsert = async (userSchema: any) => {
  const data = userSchema;
  const newUser = await prisma.users.create({
    data
  });
  const token = await bcrypt.hash(newUser.id, 10);
  try {
    await prisma.users.update({
      where: { id: newUser.id },
      data: { apiKey: token }
    });
  } catch (error) {
    console.log(error);
  }
  return newUser;
};

const formatUser = async (user: any) => {
  const currency = await findCurrencyById(user.currencyId as number);
  const currencyFrom = 'USD';
  const currencyCode = currency?.code ?? 'KRW';
  const currencyRate = await axios.get(
    `https://api.frankfurter.app/latest?from=${currencyFrom}&to=${currencyCode}`
  );

  const tokens = getTokens(user as any as Users);
  const data = {
    name: user.name,
    email: user.email,
    apiKey: user.apiKey,
    roleId: user.roleId,
    role: user.role,
    currencyId: user.currencyId,
    isActive: user.isActive,
    parentAgentId: user.parentAgentId,
    id: user.id,
    username: user.username,
    type: user.type,
    currency: (currency as number) && currency.code,
    rate: currencyRate.data,
    tokens,
    level: user.level
  };
  return data;
};
