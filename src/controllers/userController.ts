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
            gte: dateFrom || '1970-01-01T00:00:00.000Z',
            lte: dateTo || '2100-01-01T00:00:00.000Z'
          }
        },
        orderBy: {
          updatedAt: 'desc'
        },
        skip: Number(page * size),
        take: Number(size)
      })
    ]);

    res.status(200).json({
      data: {
        data: usersData[1],
        totalItems: usersData[0],
        page: Number(page),
        size: Number(size)
      },
      message: message.SUCCESS
    });
  } catch (error) {
    res.status(500).json({ message: message.INTERNAL_SERVER_ERROR });
  }
};

export const updateUser = async (req: Request, res: Response): Promise<any> => {
  try {
    const userId = parseInt(req.params.userId);
    const { name, email, roleId, currencyId } = req.body;
    try {
      const newUser = await prisma.users.update({
        where: { id: userId },
        data: { email, name, roleId, currencyId }
      });
      return res.status(200).json({ message: message.UPDATED, user: newUser });
    } catch (error) {
      if (error.code === 'P2025') {
        return res.status(404).json({ message: message.NOT_FOUND });
      } else if (error.code === 'P2002') {
        return res.status(400).json({
          message: message.DUPLICATE,
          subMessage: 'Email already exists'
        });
      }
      return res
        .status(500)
        .json({ message: message.INTERNAL_SERVER_ERROR, error });
    }
  } catch (error) {
    console.log(error);
    res.status(500).json({ message: message.INTERNAL_SERVER_ERROR, error });
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
    return res.status(200).json({ message: message.SUCCESS, data: user });
  } catch (error) {
    return res
      .status(500)
      .json({ message: message.INTERNAL_SERVER_ERROR, error });
  }
};
export const register = async (req: Request, res: Response): Promise<any> => {
  try {
    const { firstName, lastName, username, email, password, confirmPassword } =
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
      return res.status(400).json({ message: message.DUPLICATE });
    } else {
      if (password !== confirmPassword) {
        return res.status(400).json({
          message: message.INVALID,
          subMessage: "Password and Confirm Password did't match"
        });
      } else {
        const hashedPassword = await bcrypt.hash(password, 10);
        try {
          const newSchema = {
            name: `${firstName} ${lastName}`,
            username,
            email,
            roleId: 2,
            password: hashedPassword,
            currencyId: 1
          };

          const newUser = await prisma.users.create({
            data: newSchema
          });
          const userResponse = {
            userId: newUser.id,
            username: newUser.username
          };
          return res.status(201).json({
            data: userResponse,
            message: message.CREATED
          });
        } catch (error) {
          return res
            .status(500)
            .json({ message: message.INTERNAL_SERVER_ERROR, error });
        }
      }
    }
  } catch (error) {
    res.status(500).json({ message: message.INTERNAL_SERVER_ERROR, error });
  }
};

export const deleteUser = async (req: Request, res: Response) => {
  try {
    const userId = parseInt(req.params.userId);
    const findUser = await prisma.users.findUnique({
      where: { id: userId }
    });

    if (findUser) {
      const user = await prisma.users.update({
        where: { id: userId },
        data: { deletedAt: new Date() }
      });

      // if there is user -> delete
      user && res.status(200).json({ message: 'user deleted' });
    } else res.status(400).json({ message: 'cant find the user' });
  } catch (error) {
    console.log(error);
    res.status(500).json({ message: 'something went wrong', error });
  }
};

export const login = async (req: Request, res: Response): Promise<any> => {
  try {
    const { username, password } = req.body;
    const user = await prisma.users.findUnique({
      where: {
        username: username
      }
    });
    if (user) {
      const isValid = await bcrypt.compare(password, user.password);
      if (isValid) {
        const currency = await findById(user.currencyId as number);
        const currencyFrom = 'USD';

        const currencyCode = currency?.code || 'KRW';
        const currencyRate = await axios.get(
          `https://api.frankfurter.app/latest?from=${currencyFrom}&to=${currencyCode}`
        );

        const tokens = getTokens(user.id);
        const data = {
          userId: user.id,
          username: user.username,
          currency: currency && currency.code,
          rate: currencyRate.data,
          tokens
        };
        return res.status(200).json({ message: message.SUCCESS, data });
      }
    }
    return res.status(400).json({ message: message.NOT_FOUND });
  } catch (error) {
    res.status(500).json({ message: message.INTERNAL_SERVER_ERROR });
  }
};
