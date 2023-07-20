import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();
import bcrypt from 'bcrypt';
import { getTokens } from '../utilities/getTokens.ts';
import { findById } from '../models/currency.ts';
import { Response, Request } from 'express';

// Define your route handler to get all users
export const getAllUsers = async (req: Request, res: Response) => {
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

    const usersData = await prisma.$transaction([
      prisma.users.count(),
      prisma.users.findMany({
        select: {
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
          name: {
            contains: search
          },
          email: {
            contains: search
          },
          username: {
            contains: search
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
        totalItem: usersData[0],
        page,
        size
      },
      message: 'SUCCESS'
    });
  } catch (error) {
    res
      .status(500)
      .json({ error: 'An error occurred while retrieving users.' });
  }
};

export const updateUser = async (req: Request, res: Response): Promise<any> => {
  try {
    const userId = parseInt(req.params.userId);
    const { name, email, username, roleId, currencyId } = req.body;

    const user = await prisma.users.findUnique({
      where: {
        id: userId
      }
    });

    // if cant find user
    if (!user) return res.status(404).json({ message: 'User not found' });

    const updateUser = {
      ...user,
      email: email || user.email,
      name: name || user.name,
      username: username || user.username,
      roleId: roleId || user.roleId,
      currencyId: currencyId || user.currencyId
    };

    try {
      // Save the updated user
      const updatedUser = await prisma.users.update({
        where: {
          id: userId
        },
        data: updateUser
      });
      res.status(200).json({ message: 'user updated', user: updatedUser });
    } catch (error) {
      console.log(error);
      res.status(500).json({ message: 'something went wrong', error });
    }
  } catch (error) {
    console.log(error);
    return res.status(500).json({ message: 'something went wrong', error });
  }
};

export const register = async (req: Request, res: Response): Promise<any> => {
  try {
    const {
      name,
      username,
      email,
      roleId,
      password,
      confirmPassword,
      currencyId
    } = req.body;

    // Check if the user already exists
    const existingUser = await prisma.users.findUnique({
      where: {
        email: email,
        username: username
      }
    });

    if (existingUser)
      return res.status(400).json({ message: 'User already exists' });

    if (password !== confirmPassword)
      return res
        .status(400)
        .json({ message: 'Password and confirm password do not match' });

    const hashedPassword = await bcrypt.hash(password, 10);

    try {
      const newUser = await prisma.users.create({
        data: {
          name: name,
          username: username,
          email: email,
          roleId: roleId,
          password: hashedPassword,
          currencyId: currencyId
        }
      });

      const userResponse = {
        userId: newUser.id,
        username: newUser.username
      };
      res
        .status(201)
        .json({ message: 'User registered successfully', data: userResponse });
    } catch (error) {
      res.status(500).json({ message: 'something went wrong', error });
    }
  } catch (error) {
    console.log(error);
    res.status(500).json({ message: 'something went wrong', error });
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
        const tokens = getTokens(user.id);
        const data = {
          userId: user.id,
          username: user.username,
          currency: currency && currency.code,
          tokens
        };
        return res.status(200).json({ message: 'logged in', data });
      }
    }
    return res.status(400).json({ message: 'user not found' });
  } catch (error) {
    return res.status(500).json({ message: 'something went wrong', error });
  }
};
