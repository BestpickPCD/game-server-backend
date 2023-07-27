import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcrypt';
import { Request, Response } from 'express';
import { message } from '../utilities/constants/index.ts';
import { Agent } from '../models/type.ts';
const prisma = new PrismaClient();
interface AgentParams {
  page?: number;
  size?: number;
  search?: string;
  level?: number | string;
  dateFrom?: string;
  dateTo?: string;
  id?: number;
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

const filterArrays = (a: any[], b: number[]) =>
  a.filter((aItem) => !b.some((bItem) => aItem === bItem));
const mergeArrays = (a: any[], b: number[]) => [...a, ...b];

const resultArray = (a: any[], b: number[], c: any[]) =>
  mergeArrays(filterArrays(a, b), c);

// const { id } = req.user;
// !id && res.status(400).json({ message: message.INVALID });

export const getAllAgents = async (req: Request, res: Response) => {
  try {
    const {
      page = 0,
      size = 10,
      search = '',
      level,
      dateFrom = '1970-01-01T00:00:00.000Z',
      dateTo = '2100-01-01T00:00:00.000Z',
      id
    }: AgentParams = req.query;
    const pageNumber = Number(page);
    const sizeNumber = Number(size);
    const filter: any = {
      select: {
        id: true,
        username: true,
        name: true,
        level: true,
        currencyId: true,
        rate: true,
        parentAgentIds: true,
        isActive: true,
        createdAt: true,
        updatedAt: true,
        deletedAt: true
      },
      where: {
        ...(level && { level: Number(level) }),
        deletedAt: null,
        parentAgentIds: {
          array_contains: [Number(id)]
        },
        OR: [
          {
            name: {
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
      skip: pageNumber * sizeNumber,
      take: sizeNumber
    };

    const { select, skip, take, ...countFilter } = filter;
    const [agents, count] = await prisma.$transaction([
      prisma.agents.findMany(filter),
      prisma.agents.count(countFilter)
    ]);

    return res.status(200).send({
      data: {
        data: agents,
        page: pageNumber,
        size: sizeNumber,
        totalItem: count
      },
      message: message.SUCCESS
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
        parentAgentIds: [
          ((parentAgent.parentAgentIds || []) as number[]).push(
            Number(parentAgent.id)
          ) || []
        ],
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
export const updateAgent = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { name, parentAgentId, currencyId } = req.body;

    const agentId = Number(id);
    const parentAgentIdNumber = parentAgentId && Number(parentAgentId);
    const currencyIdNumber = currencyId && Number(currencyId);

    const agent = await prisma.agents.findUnique({
      where: {
        id: agentId
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

    if (parentAgentIdNumber) {
      parentAgent = await prisma.agents.findUnique({
        where: { id: parentAgentIdNumber }
      });
      if (!parentAgent) {
        return res.status(404).json({
          message: message.NOT_FOUND,
          subMessage: 'Parent agent not found'
        });
      }
    }
    if (currencyIdNumber) {
      currency = await prisma.currencies.findUnique({
        where: { id: currencyIdNumber }
      });
      if (!currency) {
        return res.status(404).json({
          message: message.NOT_FOUND,
          subMessage: 'Currency not found'
        });
      }
    }
    const updatedAgentParentIds =
      parentAgent &&
      ([...(parentAgent?.parentAgentIds as any), parentAgent.id] as any);
    const updatedAgent: Agent = await prisma.agents.update({
      where: { id: agentId },
      data: {
        name: name || agent.name,
        parentAgentId: parentAgentId || agent.parentAgentId,
        parentAgentIds: parentAgent
          ? updatedAgentParentIds
          : agent.parentAgentIds,
        currencyId: currencyId || agent.currencyId,
        level: parentAgent ? updatedAgentParentIds.length + 1 : agent.level
      }
    });
    const agentChildren: Agent[] = await prisma.agents.findMany({
      where: {
        parentAgentIds: {
          array_contains: [agentId]
        }
      }
    });
    if (agentChildren.length > 0) {
      for (let i = 0; i < agentChildren.length; i++) {
        const parentAgentIds: any[] = resultArray(
          agentChildren[i]?.parentAgentIds as number[],
          agent.parentAgentIds as number[],
          parentAgent
            ? ([...(parentAgent?.parentAgentIds as any), parentAgent.id] as any)
            : agent.parentAgentIds
        ) as any;
        await prisma.agents.update({
          where: {
            id: agentChildren[i].id
          },
          data: {
            parentAgentIds,
            level: parentAgentIds.length + 1
          }
        });
      }
    }
    return res.status(200).json({
      data: {
        id: updatedAgent.id,
        username: updatedAgent.username,
        level: updatedAgent.level,
        name: updatedAgent.name,
        parentAgentIds: updatedAgent.parentAgentIds
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

// let levelString = '';
// if (level) {
//   levelString = `AND ah.level = ${Number(level)}`;
// }
// let dayBetween = '';
// dayBetween = `AND ah.updatedAt BETWEEN '${dateFrom}' AND '${dateTo}'`;
// const agents = await prisma.$queryRawUnsafe(
//   `
//   WITH RECURSIVE AgentHierarchy AS (
//     SELECT id, name, username, level, parentAgentId, createdAt, updatedAt
//     FROM Agents
//     WHERE id = ${parentAgentId}
//     UNION ALL
//     SELECT a.id, a.name, a.username, a.level, a.parentAgentId, a.createdAt, a.updatedAt
//     FROM Agents a
//     JOIN AgentHierarchy h ON a.parentAgentId = h.id
//   )
//   SELECT * FROM AgentHierarchy ah
//   WHERE (ah.username LIKE "%${search}%" OR ah.name LIKE "%${search}%")
//   ${levelString}
//   ${dayBetween}
//   LIMIT ${Number(size)}
//   OFFSET ${Number(size) * Number(page)};
// `
// );
