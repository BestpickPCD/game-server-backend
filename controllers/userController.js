const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();
const bcrypt = require('bcrypt');
const { getTokens } = require('../utilities/getTokens');
const currencyModel = require('../models/currency');
const roleModel = require('../models/role');

// Define your route handler to get all users
const getAllUsers = async (req, res) => {
  const { page = 0, size = 10, search = '' } = req.query;
  try {
    const usersData = await prisma.$transaction([
      prisma.users.count(),
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
        totalUsers: usersData[0],
        size: Number(size),
        page: Number(page)
      },
      message: 'SUCCESS'
    });
  } catch (error) {
    console.error('Error retrieving users:', error);
    res.status(500).json({
      message: 'An error occurred while retrieving users.'
    });
  }
};

const updateUser = async (req, res) => {
  try {
    const userId = parseInt(req.params.userId);
    const { name, email, username, roleId, currencyId } = req.body;
    try {
      const updatedUser = await prisma.users.update({
        where: {
          id: userId
        },
        data: {
          email,
          name,
          roleId,
          currencyId
        }
      });
      return res.status(200).json({ data: updatedUser, message: 'UPDATED' });
    } catch (error) {
      return res
        .status(404)
        .json({ message: 'NOTFOUND', subMessage: 'User not found' });
    }
  } catch (error) {
    res.status(500).json({ message: error });
  }
};

const register = async (req, res) => {
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

    // Check if password and confirm password match
    if (password !== confirmPassword)
      return res
        .status(400)
        .json({ message: 'Password and confirm password do not match' });

    // Hash the password
    const hashedPassword = await bcrypt.hash(password, 10);

    try {
      // Create the new user
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
      console.log(error);
      res.status(500).json({ message: 'something went wrong', error });
    }
  } catch (error) {
    console.log(error);
    res.status(500).json({ message: 'something went wrong', error });
  }
};

const deleteUser = async (req, res) => {
  try {
    const userId = parseInt(req.params.userId);
    const findUser = await prisma.users.findUnique({
      where: { id: userId }
    });

    if (findUser) {
      if (findUser) {
        const user = await prisma.users.update({
          where: { id: userId },
          data: { deletedAt: new Date() }
        });

        // if there is user -> delete
        user && res.status(200).json({ message: 'user deleted' });
      } else res.status(400).json({ message: 'cant find the user' });

      if (user) res.status(200).json({ message: 'user deleted' });
    } else res.status(400).json({ message: 'cant find the user' });
  } catch (error) {
    console.log(error);
    res.status(500).json({ message: 'something went wrong', error });
  }
};

const login = async (req, res) => {
  try {
    const { username, password } = req.body;
    const user = await prisma.users.findUnique({
      where: {
        username: username
      }
    });
    const isValid = await bcrypt.compare(password, user.password);

    if (isValid) {
      const currency = await currencyModel.findById(user.currencyId);
      const tokens = getTokens(user.id);
      const data = {
        userId: user.id,
        username: user.username,
        currency: currency.code,
        tokens
      };
      res.status(200).json({ message: 'logged in', data });
    } else res.status(400).json({ message: 'user not found' });
  } catch (error) {
    console.log(error);
    res.status(500).json({ message: 'something went wrong', error });
  }
};

module.exports = { getAllUsers, register, login, updateUser, deleteUser };
