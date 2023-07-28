import { Agents, PrismaClient } from '@prisma/client';
import { Request, Response } from 'express';
import { message } from '../utilities/constants/index.ts';
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
        level: true,
        parentAgentId: true,
        rate: true,
        updatedAt: true,
        createdAt: true,
        user: {
          where: {}
        }
      },
      where: { deletedAt: null, id: Number(id) }
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
export const updateAgent = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { parentAgentId, currencyId } = req.body;

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
    const updatedAgentParentIds = parentAgent && [
      ...(parentAgent?.parentAgentIds as any),
      parentAgent.id
    ];
    const updatedAgent: Agents = await prisma.agents.update({
      where: { id: agentId },
      data: {
        parentAgentId: parentAgentId || agent.parentAgentId,
        parentAgentIds: parentAgent
          ? (updatedAgentParentIds as any)
          : agent.parentAgentIds,
        level: parentAgent
          ? (updatedAgentParentIds as any)?.length + 1
          : agent.level
      }
    });
    const agentChildren: Agents[] = await prisma.agents.findMany({
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
        level: updatedAgent.level,
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

export const getUsersByAgentId = async (
  req: Request,
  res: Response
): Promise<any> => {
  try {
    const agentId = parseInt(req.params.id);
    const users = await prisma.players.findMany({
      where: { agentId },
      include: {
        user: {
          select: {
            name: true,
            email: true,
            username: true,
            currency: {
              select: {
                name: true
              }
            },
            role: {
              select: {
                name: true,
                permissions: true
              }
            }
          }
        }
      }
    });

    const usersList = users.map((userEntry) => {
      const {
        user: {
          name,
          email,
          username,
          currency: { name: currencyName },
          role: { name: roleName, permissions }
        }
      } = userEntry as any;
      return { name, email, username, currencyName, roleName, permissions };
    });

    res.status(200).json(usersList);
  } catch (error) {
    console.log(error);
    return res.status(500).json({ message: error });
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
