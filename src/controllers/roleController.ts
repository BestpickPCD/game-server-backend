import { PrismaClient } from '@prisma/client';
import { Request, Response } from 'express';
const prisma = new PrismaClient();

export const getRoles = async (_: Request, res: Response) => {
  try {
    const roles = await prisma.roles.findMany({
      where: { deletedAt: null },
      orderBy: { name: 'asc' }
    });
    res.status(200).json(roles);
  } catch (error) {
    console.log(error);
    res.status(500).json({ message: 'something went wrong', error });
  }
};

export const addRole = async (req: Request, res: Response) => {
  try {
    const { name, permissions } = req.body;
    const roleCheck = await prisma.roles.findMany({
      where: { name, permissions }
    });

    if (roleCheck.length == 0) {
      const role = await prisma.roles.create({
        data: { name, permissions }
      });

      role && res.status(201).json({ message: 'role created' });
    } else {
      res.status(500).json({ message: 'role exists' });
    }
  } catch (error) {
    console.log(error);
    res.status(500).json({ message: 'something went wrong', error });
  }
};

export const updateRole = async (req: Request, res: Response): Promise<any> => {
  try {
    const roleId = parseInt(req.params.roleId);
    const { name } = req.body;

    const updatedRole = await prisma.roles.update({
      where: { id: roleId },
      data: { name }
    });

    if (!updatedRole) {
      return res.status(404).json({ message: 'Role not found' });
    }
    res.status(200).json({ message: 'Role updated' });
  } catch (error) {
    console.log(error);
    res.status(500).json({ message: 'something went wrong', error });
  }
};

export const deleteRole = async (req: Request, res: Response): Promise<any> => {
  try {
    const roleId = parseInt(req.params.roleId);
    const updatedRole = await prisma.roles.update({
      where: { id: roleId },
      data: { deletedAt: new Date() }
    });

    if (!updatedRole) {
      return res.status(404).json({ message: 'Role not found' });
    }
    res.status(404).json({ message: 'Role soft-deleted' });
  } catch (error) {
    console.log(error);
    res.status(500).json({ message: 'something went wrong', error });
  }
};
