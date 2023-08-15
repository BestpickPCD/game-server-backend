import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();
import { Request, Response } from 'express';
import { message } from '../utilities/constants/index.ts';
import connectToRedis from '../config/redis/index.ts';
import { permissions } from '../middleware/permission.ts';
import { RoleType } from '../models/customInterfaces.ts';

export const getAllPermission = async (
  req: Request,
  res: Response
): Promise<any> => {
  try {
    const redisClient = await connectToRedis();
    const roleName = (req as any)?.user?.role?.name as RoleType;
    const data = await redisClient.get(`${roleName}-permissions`);
    if (!data) {
      const userPermission = permissions[roleName];
      await redisClient.set(
        `${roleName}-permissions`,
        JSON.stringify(userPermission)
      );
      return res.status(200).json({ data: userPermission });
    }
    return res.status(200).json({ data: JSON.parse(data) });
  } catch (error) {
    return res.status(500).json({
      message: message.INTERNAL_SERVER_ERROR,
      error
    });
  }
};

export const getPermissionById = async (
  req: Request,
  res: Response
): Promise<any> => {
  try {
    const { id } = req.params;
    const table = await prisma.tables.findUnique({
      where: { id: Number(id) }
    });
    return res.status(200).json({
      data: table,
      message: message.SUCCESS
    });
  } catch (error) {
    if (error.code === 'P2025') {
      return res.status(404).json({
        message: message.NOT_FOUND,
        subMessage: 'Table not found'
      });
    }
    return res.status(500).json({
      message: message.INTERNAL_SERVER_ERROR
    });
  }
};

export const createPermission = async (
  req: Request,
  res: Response
): Promise<any> => {
  try {
    const { name, permissions } = req.body;

    const newTable = await prisma.tables.create({
      data: { name, permissions }
    });
    return res.status(200).json({
      message: message.CREATED,
      data: newTable
    });
  } catch (error) {
    if (error.code === 'P2002') {
      return res.status(400).json({
        message: message.DUPLICATE,
        subMessage: 'Duplicated Name'
      });
    }
    return res.status(500).json({
      message: message.INTERNAL_SERVER_ERROR
    });
  }
};

export const updatePermission = async (
  req: Request,
  res: Response
): Promise<any> => {
  try {
    const { id } = req.params;
    const { name, permissions } = req.body;
    const updateTable = await prisma.tables.update({
      where: { id: Number(id) },
      data: { name, permissions }
    });
    return res.status(200).json({
      message: message.UPDATED,
      data: updateTable
    });
  } catch (error) {
    if (error.code === 'P2025') {
      return res.status(404).json({
        message: message.NOT_FOUND,
        subMessage: 'Table not found'
      });
    } else if (error.code === 'P2002') {
      return res.status(400).json({
        message: message.DUPLICATE,
        subMessage: 'Table name already exists'
      });
    }
    return res.status(500).json({ message: message.INTERNAL_SERVER_ERROR });
  }
};

export const deletePermission = async (
  req: Request,
  res: Response
): Promise<any> => {
  try {
    const { id } = req.params;
    await prisma.tables.delete({
      where: { id: Number(id) }
    });
    return res.status(200).json({ message: message.DELETED });
  } catch (error) {
    if (error.code === 'P2025') {
      return res.status(404).json({
        message: message.NOT_FOUND,
        subMessage: 'Table not found'
      });
    }
    return res.status(500).json({ message: message.INTERNAL_SERVER_ERROR });
  }
};
