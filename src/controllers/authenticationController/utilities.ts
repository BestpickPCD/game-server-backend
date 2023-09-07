import jwt from 'jsonwebtoken';
import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();

export const generateApiKey = async (userId: number): Promise<any> => {
  const secretKey = process.env.SECRET_KEY ?? '';
  const payload = {
    userId
  };

  const token = jwt.sign(payload, secretKey);

  return token;
};

export const checkUserExist = async (checks: any): Promise<any> => {
  try {
    const {
      firstName,
      lastName,
      username,
      nickname,
      email,
      type,
      parentAgentId
    } = checks;

    let canCreate = false;
    let rawQuery = ``;
    let select = ``;
    let where = ``;

    if (firstName) {
      select += `, firstname`;
      where += ` AND firstname = '${firstName}'`;
    } else if (lastName) {
      select += `, lastName`;
      where += ` AND lastName = '${lastName}'`;
    } else if (username) {
      select += `, username`;
      where += ` AND username = '${username}'`;
    } else if (nickname) {
      select += `, nickname`;
      where += ` AND nickname = '${nickname}'`;
    } else if (email) {
      select += `, email`;
      where += ` AND email = '${email}'`;
    } else if (parentAgentId) {
      select += `, parentAgentId`;
      where += ` AND parentAgentId = '${parentAgentId}'`;
    }

    if (type == 'agent') {
      rawQuery = `SELECT id ${select} FROM Users WHERE 1=1 ${where} `;
    } else {
      rawQuery = `SELECT id ${select} FROM Players WHERE 1=1 ${where} `;
    }
    const users = (await prisma.$queryRawUnsafe(`${rawQuery}`)) as any;
    if (users.length == 0) {
      canCreate = true;
    }

    return canCreate;
  } catch (error) {
    console.log(error);
  }
};
