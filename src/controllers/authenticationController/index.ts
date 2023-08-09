import { Response, Request } from 'express';
import jwt from 'jsonwebtoken';
import bcrypt from 'bcrypt';
import { message } from '../../utilities/constants/index.ts';
import { PrismaClient, Users } from '@prisma/client';
const prisma = new PrismaClient();
import { RequestWithUser } from '../../models/customInterfaces.ts';
import { getTokens } from '../../utilities/getTokens.ts';
import { generateApiKey } from './utilities.ts';
import {
  findCurrencyById,
  getParentAgentIdsByParentAgentId
} from '../userController/utilities.ts';
import axios from 'axios';

const REFRESH_TOKEN_KEY = process.env.REFRESH_TOKEN_KEY ?? '';

export const refreshToken = async (
  req: RequestWithUser,
  res: Response
): Promise<any> => {
  try {
    const refreshToken = localStorage.getItem('refreshToken');

    if (!refreshToken) {
      return res.status(401).json({ message: 'Refresh token not provided' });
    }

    let decoded: any;
    try {
      decoded = jwt.verify(refreshToken, REFRESH_TOKEN_KEY);
    } catch (error) {
      return res.status(401).json({ message: 'Invalid refresh token' });
    }

    if (req.user?.id === decoded.userId) {
      try {
        const tokens = await getTokens(req.user as Users);
        return res.status(200).json({
          message: 'New refresh token generated successfully',
          tokens
        });
      } catch (error) {
        console.log(error);
        return res.status(500).json(error);
      }
    }
  } catch (error) {
    console.error(error);
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
        const currency = await findCurrencyById(user.currencyId as number);
        const currencyFrom = 'USD';
        const currencyCode = currency?.code ?? 'KRW';
        const currencyRate = await axios.get(
          `https://api.frankfurter.app/latest?from=${currencyFrom}&to=${currencyCode}`
        );

        const tokens = getTokens(user as Users);
        const data = {
          userId: user.id,
          username: user.username,
          type: user.type,
          currency: (currency as number) && currency.code,
          rate: currencyRate.data,
          tokens
        };
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
      email,
      password,
      confirmPassword,
      roleId,
      type,
      agentId,
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
    const hashedPassword = await bcrypt.hash(password, 10);
    try {
      const userSchema = {
        name: `${firstName} ${lastName}`,
        username,
        email,
        type,
        roleId,
        password: hashedPassword,
        currencyId: 1
      };
      if (type == 'player') {
        return _playerInsert(userSchema, agentId, res);
      } else if (type == 'agent') {
        return _agentInsert(userSchema, parentAgentId, res);
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
  agentId: number,
  res: Response
) => {
  try {
    const newUser: any = await _userInsert(userSchema);
    const userInsert = (await prisma.players.create({
      data: {
        id: newUser.id,
        agentId
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

const _agentInsert = async (
  userSchema: any,
  parentAgentId: number,
  res: Response
) => {
  try {
    const newUser: any = await _userInsert(userSchema);
    const details: any = await getParentAgentIdsByParentAgentId(parentAgentId);
    const userInsert = (await prisma.agents.create({
      data: {
        id: newUser.id,
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
