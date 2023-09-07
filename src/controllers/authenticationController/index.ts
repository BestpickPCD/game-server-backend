import { PrismaClient, Users } from '@prisma/client';
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
import { checkUserExist, generateApiKey } from './utilities.ts';
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

    const token = await generateApiKey(req.user.id);

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
        currencyId: true,
        isActive: true,
        username: true,
        type: true,
        role: true,
        password: true
      },
      where: {
        username: username
      }
    });

    if (!user) {
      return res.status(400).json({ message: message.NOT_FOUND });
    } else if (user) {
      // check Password
      const isValid = await bcrypt.compare(password, user.password);

      if (isValid) {
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
    console.log(error);
    res.status(500).json({ message: message.INTERNAL_SERVER_ERROR });
  }
};

export const register = async (req: Request, res: Response): Promise<any> => {
  try {
    const {
      firstName,
      lastName,
      username,
      nickname,
      email,
      password,
      confirmPassword,
      roleId,
      type,
      parentAgentId
    } = req.body;

    const can = await checkUserExist(req.body);

    if (!can) {
      return res.status(400).json({
        message: message.DUPLICATE,
        subMessage: 'Email or Username already exists'
      });
    }
    try {
      if (type == 'agent') {
        if (password !== confirmPassword) {
          return res.status(400).json({
            message: message.INVALID,
            subMessage: "Password and Confirm Password did't match"
          });
        }
        const hashedPassword = await bcrypt.hash(password, 10);
        const userSchema = {
          name: `${firstName} ${lastName}`,
          username,
          email,
          type,
          roleId,
          password: hashedPassword,
          currencyId: 1
        };
        return _agentInsert(userSchema, parentAgentId, res);
      } else if (type == 'player') {
        const userSchema = {
          username,
          nickname
        };
        return _playerInsert(userSchema, parentAgentId, res);
      }
    } catch (error) {
      return res
        .status(500)
        .json({ message: message.INTERNAL_SERVER_ERROR, error });
    }
  } catch (error) {
    res.status(500).json({ message: message.INTERNAL_SERVER_ERROR, error });
  }
};

const _playerInsert = async (
  userSchema: any,
  userId: number,
  res: Response
) => {
  try {
    const { username, nickname } = userSchema;
    const userInsert = (await prisma.players.create({
      data: {
        userId,
        username,
        nickname
      }
    })) as any;
    return res.status(201).json({
      data: userInsert,
      message: message.CREATED
    });
  } catch (error) {
    console.log(error);
    return res.status(500).json({
      message: 'Internal server error'
    });
  }
};

const _agentInsert = async (
  userSchema: any,
  parentAgentId: number,
  res: Response
) => {
  try {
    const newUser: any = await _userInsert(userSchema);
    const details: any = await getParentAgentIdsByParentAgentId(parentAgentId);
    const userInsert = (await prisma.users.update({
      where: { id: newUser.id },
      data: {
        parentAgentId,
        parentAgentIds: details.parentAgentIds,
        level: details.level
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
    console.log(error);
    return res.status(500).json({
      message: 'Internal server error'
    });
  }
};

const _userInsert = async (userSchema: any) => {
  const newUser = await prisma.users.create({
    data: userSchema
  });

  const token = await generateApiKey(newUser.id);
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
    id: user.id,
    username: user.username,
    type: user.type,
    currency: (currency as number) && currency.code,
    rate: currencyRate.data,
    tokens
  };
  return data;
};
