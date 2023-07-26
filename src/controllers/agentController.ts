import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcrypt';
import { Request, Response } from 'express';
import { message } from '../utilities/constants/index.ts';
const prisma = new PrismaClient();
interface AgentParams {
  page?: number;
  size?: number;
  search?: string;
  parentAgentId?: number;
  level?: number | string;
  dateFrom?: string;
  dateTo?: string;
}
interface AgentBody {
  username: string;
  password: string;
  confirmPassword: string;
  name: string;
  currencyId: number;
  parentAgentId: number;
  rate: number;
}

export const getAllAgents = async (req: Request, res: Response) => {
  try {
    let {
      page = 0,
      size = 10,
      search = '',
      parentAgentId = 1,
      level,
      dateFrom = '1970-01-01T00:00:00.000Z',
      dateTo = '2100-01-01T00:00:00.000Z'
    }: AgentParams = req.query;

    let levelString = '';
    if (level) {
      levelString = `AND ah.level = ${Number(level)}`;
    }
    let dayBetween = '';
    dayBetween = `AND ah.updatedAt BETWEEN '${dateFrom}' AND '${dateTo}'`;
    const agents = await prisma.$queryRawUnsafe(
      `
      WITH RECURSIVE AgentHierarchy AS (
        SELECT id, name, username, level, parentAgentId, createdAt, updatedAt
        FROM Agents
        WHERE id = ${parentAgentId}
        UNION ALL
        SELECT a.id, a.name, a.username, a.level, a.parentAgentId, a.createdAt, a.updatedAt
        FROM Agents a
        JOIN AgentHierarchy h ON a.parentAgentId = h.id
      )
      SELECT * FROM AgentHierarchy ah
      WHERE (ah.username LIKE "%${search}%" OR ah.name LIKE "%${search}%") 
      ${levelString}
      ${dayBetween}
      LIMIT ${Number(size)}
      OFFSET ${Number(size) * Number(page)};
    `
    );
    return res.status(200).send({
      data: { data: agents, message: message.SUCCESS }
    });
  } catch (error) {
    return res
      .status(500)
      .json({ message: message.INTERNAL_SERVER_ERROR, error });
  }
};
export const getAgentById = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    if (!id || !Number(id)) {
      return res
        .status(400)
        .json({ message: message.INVALID, subMessage: 'Invalid Id' });
    }
    const agent = await prisma.agents.findUnique({
      select: {
        id: true,
        username: true,
        isActive: true,
        level: true,
        name: true,
        parentAgentId: true,
        rate: true,
        updatedAt: true
      },
      where: { id: Number(id) }
    });
    if (!agent) {
      return res.status(404).json({ message: message.NOT_FOUND });
    }
    return res.status(200).json({ data: agent, message: message.SUCCESS });
  } catch (error) {
    return res
      .status(500)
      .json({ message: message.INTERNAL_SERVER_ERROR, error: error });
  }
};
export const createAgent = async (req: Request, res: Response) => {
  const {
    username,
    password,
    confirmPassword,
    name,
    currencyId = 1,
    parentAgentId,
    rate = 0
  }: AgentBody = req.body;
  if (!username || !password || !confirmPassword || !name) {
    return res.status(400).json({
      message: message.INVALID,
      subMessage: 'Missing required fields.'
    });
  }
  if (password !== confirmPassword) {
    return res.status(400).json({
      message: message.INVALID,
      subMessage: "Password and Confirm Password didn't match."
    });
  }

  try {
    const [existingUser, existingAgent] = await prisma.$transaction([
      prisma.users.findUnique({
        where: {
          username
        }
      }),
      prisma.agents.findUnique({
        where: {
          username
        }
      })
    ]);
    if (existingUser || existingAgent) {
      return res.status(400).json({
        message: message.DUPLICATE,
        subMessage: 'Username already exists'
      });
    }
    const parentAgent = await prisma.agents.findUnique({
      where: {
        id: Number(parentAgentId) || 0
      }
    });
    if (!parentAgent) {
      return res.status(404).json({
        message: message.NOT_FOUND,
        subMessage: 'Parent agent not found'
      });
    }
    const currency = await prisma.currencies.findUnique({
      where: {
        id: Number(currencyId)
      }
    });
    if (!currency) {
      return res.status(404).json({
        message: message.NOT_FOUND,
        subMessage: 'Currency not found'
      });
    }
    const hashedPassword = await bcrypt.hash(password, 10);
    if (rate < 0 || rate > 100) {
      return res
        .status(400)
        .json({ message: message.INVALID, subMessage: 'Invalid rate' });
    }
    const newAgent = await prisma.agents.create({
      data: {
        username,
        password: hashedPassword,
        name,
        level: (parentAgent?.level || 0) + 1 || 1,
        currencyId,
        parentAgentId: parentAgentId || 0,
        rate
      }
    });
    return res.status(201).send({
      data: {
        id: newAgent.id,
        username: newAgent.username,
        level: newAgent.level
      },
      message: message.CREATED
    });
  } catch (error) {
    return res.status(500).json({
      message: message.INTERNAL_SERVER_ERROR,
      error
    });
  }
};
export const updateAgent = async (
  req: Request,
  res: Response
): Promise<any> => {
  try {
    const { id } = req.params;
    const { name, parentAgentId, currencyId } = req.body;
    const agent = await prisma.agents.findUnique({
      where: {
        id: Number(id)
      }
    });
    if (!agent) {
      return res.status(404).json({
        message: message.NOT_FOUND,
        subMessage: 'Agent not found'
      });
    }
    let parentAgent;
    let currency;
    if (parentAgentId) {
      parentAgent = await prisma.agents.findUnique({
        where: { id: Number(parentAgentId) }
      });
      !parentAgent &&
        res.status(404).json({
          message: message.NOT_FOUND,
          subMessage: 'Parent agent not found'
        });
    }
    if (currencyId) {
      currency = await prisma.currencies.findUnique({
        where: { id: Number(currencyId) }
      });
      !currency &&
        res.status(404).json({
          message: message.NOT_FOUND,
          subMessage: 'Currency not found'
        });
    }
    const updatedAgent = await prisma.agents.update({
      where: { id: Number(id) },
      data: {
        name: name || agent.name,
        parentAgentId: parentAgentId || agent.parentAgentId,
        currencyId: currencyId || agent.currencyId,
        level: parentAgent ? (parentAgent.level ?? 0) + 1 : agent.level
      }
    });
    return res.status(200).json({
      data: {
        id: updatedAgent.id,
        username: updatedAgent.username,
        level: updatedAgent.level
      },
      message: message.UPDATED
    });
  } catch (error) {
    return res.status(500).json({
      message: message.INTERNAL_SERVER_ERROR,
      error
    });
  }
};
export const deleteAgent = async (
  req: Request,
  res: Response
): Promise<any> => {
  try {
    const { id } = req.params;

    if (!Number.isInteger(Number(id))) {
      return res
        .status(400)
        .json({ message: message.INVALID, subMessage: 'Invalid Id' });
    }
    const agent = await prisma.agents.findUnique({
      where: {
        id: Number(id)
      }
    });
    if (!agent) {
      return res.status(404).json({ message: message.NOT_FOUND });
    }
    await prisma.agents.update({
      where: {
        id: Number(id)
      },
      data: {
        deletedAt: new Date()
      }
    });
    return res.status(200).json({ message: message.UPDATED });
  } catch (error) {
    return res
      .status(500)
      .json({ message: message.INTERNAL_SERVER_ERROR, error });
  }
};
