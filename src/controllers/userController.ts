 
import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();
import bcrypt from 'bcrypt';
import { getTokens } from '../utilities/getTokens.ts';
import { findById } from '../models/currency.ts';
import { Response, Request } from 'express';
import axios from 'axios';
import { message } from '../utilities/constants/index.ts';

// Define your route handler to get all users
export const getAllUsers = async (req: Request, res: Response) => {
  try {
    const {
      page = 0,
      size = 10,
      search = '',
      dateFrom = '1970-01-01T00:00:00.000Z',
      dateTo = '2100-01-01T00:00:00.000Z'
    }: {
      page?: number;
      size?: number;
      search?: string;
      dateFrom?: string;
      dateTo?: string;
      isActive?: true | false | null;
    } = req.query;

    const usersData = await prisma.$transaction([
      prisma.users.count({
        where: {
          deletedAt: null
        }
      }),
      prisma.users.findMany({
        select: {
          id: true,
          name: true,
          email: true,
          username: true,
          roleId: true,
          createdAt: true,
          updatedAt: true,
          currency: {
            select: {
              code: true
            }
          },
          role: {
            select: {
              id: true,
              name: true
            }
          }
        },
        where: {
          deletedAt: null,
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
          ],
          updatedAt: {
            gte: dateFrom,
            lte: dateTo
          }
        },
        orderBy: {
          updatedAt: 'desc'
        },
        skip: Number(page * size),
        take: Number(size)
      })
    ]);

    return res.status(200).json({
      data: {
        data: usersData[1],
        totalItems: usersData[0],
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
    const { name, email, roleId, currencyId } = req.body;
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
    return res.status(200).json({ data: newUser, message: message.UPDATED });
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
export const getUserById = async (req: Request, res: Response) => {
  const { userId } = req.params;
  try {
    const user = await prisma.users.findUnique({
      select: {
        id: true,
        name: true,
        email: true,
        username: true,
        roleId: true,
        currencyId: true,
        createdAt: true,
        updatedAt: true
      },
      where: {
        id: parseInt(userId)
      }
    });
    if (!user) {
      return res.status(404).json({ message: message.NOT_FOUND });
    }
    return res.status(200).json({ message: message.SUCCESS, data: user });
  } catch (error) {
    return res
      .status(500)
      .json({ message: message.INTERNAL_SERVER_ERROR, error });
  }
};
export const register = async (req: Request, res: Response): Promise<any> => {
  try {
    const { firstName, lastName, username, email, password, confirmPassword, type, agentId } =
      req.body;

    // Check if the user already exists
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
      const newSchema = {
        name: `${firstName} ${lastName}`,
        username,
        email,
        type,
        password: hashedPassword,
        currencyId: 1
      };

      const newUser = await prisma.users.create({
        data: newSchema
      });
      

      if(newUser && type == "player") {
        return _playerInsert(newUser, agentId, res)
      } else if(newUser && type == "agent") {
        return _agentInsert(newUser, res)
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
export const deleteUser = async (req: Request, res: Response): Promise<any> => {
  try {
    const userId = parseInt(req.params.userId);
    await prisma.users.update({
      where: { id: userId },
      data: { deletedAt: new Date() }
    });
    return res.status(200).json({ message: message.DELETED });
  } catch (error) {
    if (error.code === 'P2025') {
      return res.status(404).json({ message: message.NOT_FOUND });
    }
    return res
      .status(500)
      .json({ message: message.INTERNAL_SERVER_ERROR, error });
  }
};
export const login = async (req: Request, res: Response): Promise<any> => {
  try {
    const { username, password } = req.body;

    // Check what table the username is in
    const position = await prisma.$queryRaw<any>`SELECT
        (SELECT COUNT(*) AS userCount FROM users WHERE username = ${username}) AS userCount,
        (SELECT COUNT(*) AS agentCount FROM agents WHERE username = ${username}) AS agentCount`;

    // Access the counts from the first object in the array
    const userCount = position[0].userCount;
    const agentCount = position[0].agentCount;

    let response: any;
    if (userCount) {
      response = await prisma.users.findUnique({
        where: { username }
      });
      response = { position: 'user', ...response };
    } else if (agentCount) {
      response = await prisma.agents.findUnique({
        where: { username }
      });
      response = { position: 'agent', ...response };
    } else {
      return res.status(400).json({ message: message.NOT_FOUND });
    }

    if (response) {
      // check Password
      const isValid = await bcrypt.compare(password, response.password);

      if (isValid) {
        const currency = await findById(response.currencyId as number);
        const currencyFrom = 'USD';
        const currencyCode = currency?.code || 'KRW';
        const currencyRate = await axios.get(
          `https://api.frankfurter.app/latest?from=${currencyFrom}&to=${currencyCode}`
        );

        const tokens = getTokens(response);
        const data = {
          userId: response.id,
          username: response.username,
          position: response.position,
          currency: currency && currency.code,
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
    res.status(500).json({ message: message.INTERNAL_SERVER_ERROR });
  }
}


const _playerInsert = async (user:any, agentId:number, res:Response) => {
  try { 

    const userInsert = await prisma.players.create({
      data: {
        id: user.id,
        agentId 
      }
    });

    const userResponse = {
      userId: userInsert.id,
      username: user.username
    }; 

    return res.status(201).json({
      data: userResponse,
      message: message.CREATED
    });
  } catch (error) {
    console.log(error);
    return res.status(500).json({
      message: "Internal server error"
    });
  }
}

const _agentInsert = async (agent:any, res: Response) => {
  try { 

    const userInsert = await prisma.players.create({
      data: {
        id: agent.id 
      }
    });

    const userResponse = {
      userId: userInsert.id,
      username: agent.username
    }; 

    return res.status(201).json({
      data: userResponse,
      message: message.CREATED
    });
  } catch (error) {
    console.log(error);
    return res.status(500).json({
      message: "Internal server error"
    });
  }
}