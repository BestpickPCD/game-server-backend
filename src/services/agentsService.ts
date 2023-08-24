import { Agents, Prisma, PrismaClient, Users } from '@prisma/client';
const prisma = new PrismaClient();

interface AgentsParams {
  id?: number;
  level?: number | null;
  page?: number;
  size?: number;
  search?: string;
  dateFrom?: string;
  dateTo?: string;
  userId?: number;
}

interface AgentUpdateParams {
  agentId: number;
  parentAgentId: number | null;
  currencyId: number | null;
  roleId: number | null;
  name?: string;
}

const filterArrays = (a: any[], b: number[]) =>
  a.filter((aItem) => !b.some((bItem) => aItem === bItem));

const mergeArrays = (a: any[], b: number[]) => [...a, ...b];

const resultArray = (a: any[], b: number[], c: any[]) =>
  mergeArrays(filterArrays(a, b), c);

export const getAll = async ({
  id,
  level,
  page = 0,
  size = 10,
  search,
  dateFrom,
  dateTo
}: AgentsParams): Promise<{
  users: Users[];
  totalItems: number;
}> => {
  try {
    const filter: Prisma.UsersFindManyArgs = {
      select: {
        id: true,
        username: true,
        name: true,
        type: true,
        currencyId: true,
        roleId: true,
        createdAt: true,
        updatedAt: true,
        balance: true,
        Agents: {
          select: {
            level: true,
            parentAgent: {
              select: {
                name: true,
                id: true
              }
            }
          }
        }
      },
      where: {
        deletedAt: null,
        type: 'agent',
        Agents: {
          parentAgentIds: {
            array_contains: [id] as number[]
          },
          ...(level && { level })
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
          gte: dateFrom || '1970-01-01T00:00:00.000Z',
          lte: dateTo || '2100-01-01T00:00:00.000Z'
        }
      },
      orderBy: {
        updatedAt: 'desc'
      },
      skip: page * size,
      take: size
    };

    const [users, totalItems] = await prisma.$transaction([
      prisma.users.findMany(filter),
      prisma.users.count({ where: filter.where })
    ]);

    return { users, totalItems };
  } catch (error) {
    throw Error(error.message);
  }
};

export const getById = async ({ id, userId }: AgentsParams): Promise<any> => {
  try {
    const agent = await prisma.users.findUnique({
      select: {
        id: true,
        username: true,
        name: true,
        type: true,
        currencyId: true,
        roleId: true,
        createdAt: true,
        updatedAt: true,
        Agents: {
          select: {
            level: true,
            parentAgent: {
              select: {
                name: true,
                id: true
              }
            }
          }
        }
      },
      where: {
        id,
        deletedAt: null,
        type: 'agent',
        Agents: {
          parentAgentIds: {
            array_contains: [userId] as number[]
          }
        }
      }
    });
    if (!agent) {
      throw Error('Agent not found');
    }
    return agent;
  } catch (error) {
    throw Error(error.message);
  }
};

const getAgentById = async (agentId: number): Promise<any> => {
  try {
    const agent = await prisma.agents.findUnique({
      select: {
        parentAgentIds: true,
        level: true,
        parentAgentId: true,
        user: {
          select: {
            currencyId: true,
            roleId: true
          }
        }
      },
      where: {
        id: agentId
      }
    });
    if (!agent) {
      throw new Error('Agent not found');
    }
    return agent;
  } catch (error) {
    throw Error(error.message);
  }
};

const validateUpdateData = async ({
  agentId,
  parentAgentId,
  currencyId,
  roleId
}: AgentUpdateParams): Promise<any> => {
  try {
    const agent = await getAgentById(agentId);
    const parentAgentIdNumber = parentAgentId
      ? Number(parentAgentId)
      : agent.parentAgentId;
    const currencyIdNumber = currencyId
      ? Number(currencyId)
      : agent.user?.currencyId;
    const roleIdNumber = roleId ? Number(roleId) : agent.user?.roleId;
    if (
      !parentAgentIdNumber ||
      !currencyIdNumber ||
      !roleIdNumber ||
      parentAgentIdNumber === agentId
    ) {
      const missingItem =
        !parentAgentIdNumber || parentAgentIdNumber === agentId
          ? 'Parent Agent'
          : !roleIdNumber
          ? 'Role'
          : 'Currency';
      throw new Error(`${missingItem} not valid`);
    }
    const [parentAgent, role, currency] = await Promise.all([
      parentAgentIdNumber && agent.parentAgentId
        ? prisma.agents.findUnique({ where: { id: parentAgentIdNumber } })
        : null,
      roleIdNumber && roleIdNumber !== agent.user?.roleId
        ? prisma.roles.findUnique({ where: { id: roleIdNumber } })
        : null,
      currencyIdNumber && roleIdNumber !== agent.user?.currencyId
        ? prisma.currencies.findUnique({ where: { id: currencyIdNumber } })
        : null
    ]);
    if (!parentAgent && parentAgentIdNumber && agent.parentAgentId) {
      throw new Error('Parent Agent not found');
    }
    if (!role && roleIdNumber && roleIdNumber !== agent.user?.roleId) {
      throw new Error('Role not found');
    }
    if (!currency && roleIdNumber && roleIdNumber !== agent.user?.currencyId) {
      throw new Error('Currency not found');
    }
    const updatedAgentParentIds = parentAgent && [
      ...(parentAgent?.parentAgentIds as any),
      parentAgent.id
    ];
    updateChildAgent({ agentId, agent, parentAgent });
    return { agent, parentAgent, role, currency, updatedAgentParentIds };
  } catch (error) {
    throw Error(error.message);
  }
};

const updateChildAgent = async ({
  agentId,
  agent,
  parentAgent
}: {
  agentId: number;
  agent: Agents;
  parentAgent: Agents | null;
}) => {
  try {
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
  } catch (error) {
    throw Error(error.message);
  }
};

export const update = async ({
  agentId,
  parentAgentId,
  currencyId,
  roleId,
  name
}: AgentUpdateParams) => {
  try {
    const { updatedAgentParentIds, agent, parentAgent, role, currency } =
      await validateUpdateData({
        agentId,
        parentAgentId,
        currencyId,
        roleId
      });
    const [updatedAgent] = await prisma.$transaction([
      prisma.agents.update({
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
      }),
      prisma.users.update({
        where: { id: agentId },
        data: {
          name,
          roleId: role?.id,
          currencyId: currency?.id
        }
      })
    ]);

    return updatedAgent;
  } catch (error) {
    throw Error(error.message);
  }
};

export const deleteAgent = async (id: number, userId: number) => {
  try {
    const users = await getById({ id, userId });
    if (!users) {
      throw Error('Agent not found');
    }
    await prisma.users.update({
      where: {
        id
      },
      data: {
        deletedAt: new Date()
      }
    });
  } catch (error) {
    throw Error(error.message);
  }
};
