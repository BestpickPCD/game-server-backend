import {
  Prisma,
  PrismaClient,
  Users
} from '../config/prisma/generated/base-default/index.js';
import { BAD_REQUEST, NOT_FOUND } from '../core/error.response.js';
const prisma = new PrismaClient();

const message = {
  NOT_FOUND: 'Agent not found',
  CANT_DELETE: "You cant't delete your self",
  HAVE_SUB_AGENT: 'Agent still has their agents'
};
interface AgentsParams {
  id?: string;
  level?: number | null;
  page?: number;
  size?: number;
  search?: string;
  dateFrom?: string;
  dateTo?: string;
  userId?: string;
}

interface AgentUpdateParams {
  agentId: string;
  parentAgentId: string | null;
  currencyId: number | null;
  roleId: number | null;
  rate?: number | null;
  name?: string;
}

const filterArrays = (a: any[], b: string[]) =>
  a.filter((aItem) => !b.some((bItem) => aItem === bItem));

const mergeArrays = (a: any[], b: string[]) => [...a, ...b];

const resultArray = (a: any[], b: string[], c: any[]) =>
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
      loggedIn: true,
      balance: true,
      rate: true,
      level: true,
      parent: {
        select: {
          name: true,
          id: true
        }
      },
      parentAgentIds: true,
      parentAgentId: true
    },
    where: {
      deletedAt: null,
      type: 'agent',
      ...(level && { level }),
      AND: {
        OR: [
          {
            parentAgentIds: {
              array_contains: [id] as string[]
            }
          },
          {
            id
          }
        ]
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
};

export const getById = async ({ id, userId }: AgentsParams): Promise<any> => {
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
      balance: true,
      level: true,
      rate: true,
      parentAgentId: true,
      parentAgentIds: true,
      parent: {
        select: {
          name: true,
          id: true
        }
      }
    },
    where: {
      id,
      deletedAt: null,
      type: 'agent',
      OR: [
        {
          parentAgentIds: {
            array_contains: [userId] as string[]
          }
        },
        { id: userId }
      ]
    }
  });
  if (!agent) {
    throw new NOT_FOUND(message.NOT_FOUND);
  }
  return agent;
};

const getAgentById = async (agentId: string): Promise<any> => {
  try {
    const agent = await prisma.users.findUnique({
      select: {
        parentAgentId: true,
        parentAgentIds: true,
        level: true,
        currencyId: true,
        roleId: true
      },
      where: {
        type: 'agent',
        id: agentId
      }
    });
    if (!agent) {
      throw new NOT_FOUND(message.NOT_FOUND);
    }
    return agent;
  } catch (error: any) {
    throw Error(error.message);
  }
};

const validateUpdateData = async ({
  agentId,
  parentAgentId,
  currencyId,
  roleId
}: AgentUpdateParams): Promise<any> => {
  if (agentId === parentAgentId) {
    console.log('true');

    throw new BAD_REQUEST("Cannot be one's own agent");
  }
  const agent = await getAgentById(agentId);

  const parentAgentIdNumber = parentAgentId
    ? parentAgentId
    : agent.parentAgentId;

  const currencyIdNumber = currencyId
    ? Number(currencyId)
    : agent.user?.currencyId;

  const roleIdNumber = roleId ? Number(roleId) : agent.user?.roleId;

  if (!parentAgentIdNumber || !currencyIdNumber || !roleIdNumber) {
    const missingItem = !roleIdNumber
      ? 'Role'
      : !currencyIdNumber && 'Currency';
    if (parentAgentIdNumber && parentAgentIdNumber === agentId) {
      throw new BAD_REQUEST(`Parent Agent not valid`);
    }
    if (missingItem) {
      throw new BAD_REQUEST(`${missingItem} not valid`);
    }
  }

  let result;
  await Promise.all([
    parentAgentIdNumber && agent.parentAgentId
      ? prisma.users.findUnique({ where: { id: parentAgentIdNumber } })
      : null,
    roleIdNumber && roleIdNumber !== agent.user?.roleId
      ? prisma.roles.findUnique({ where: { id: roleIdNumber } })
      : null,
    currencyIdNumber && roleIdNumber !== agent.user?.currencyId
      ? prisma.currencies.findUnique({ where: { id: currencyIdNumber } })
      : null
  ]).then(async ([parentAgent, role, currency]) => {
    if (!parentAgent && agent.parentAgentId) {
      throw new NOT_FOUND('Parent Agent not found');
    }
    if (!role && roleIdNumber && roleIdNumber !== agent.user?.roleId) {
      throw new NOT_FOUND('Role not found');
    }
    if (!currency && roleIdNumber && roleIdNumber !== agent.user?.currencyId) {
      throw new NOT_FOUND('Currency not found');
    }

    const updatedAgentParentIds = parentAgent && [
      ...((parentAgent?.parentAgentIds as any) || []),
      parentAgent?.id
    ];

    await updateChildAgent({ agentId, agent, parentAgent });
    result = { agent, parentAgent, role, currency, updatedAgentParentIds };
  });
  return result;
};

const updateChildAgent = async ({
  agentId,
  agent,
  parentAgent
}: {
  agentId: string;
  agent: Users;
  parentAgent: Users | null;
}) => {
  const agentChildren: Users[] = await prisma.users.findMany({
    where: {
      type: 'agent',
      parentAgentIds: {
        array_contains: [agentId]
      }
    }
  });

  if (agentChildren.length > 0) {
    for (let i = 0; i < agentChildren.length; i++) {
      const parentAgentIds: string[] = resultArray(
        agentChildren[i]?.parentAgentIds as string[],
        agent.parentAgentIds as string[],
        parentAgent
          ? ([...(parentAgent?.parentAgentIds as any), parentAgent.id] as any)
          : agent.parentAgentIds
      ) as any;

      await prisma.users.update({
        where: {
          type: 'agent',
          id: agentChildren[i].id
        },
        data: {
          parentAgentIds,
          level: parentAgentIds.length + 1
        }
      });
    }
  }
};

export const update = async ({
  agentId,
  parentAgentId,
  currencyId,
  roleId,
  rate,
  name
}: AgentUpdateParams) => {
  const { updatedAgentParentIds, agent, parentAgent, role, currency } =
    await validateUpdateData({
      agentId,
      parentAgentId,
      currencyId,
      roleId
    });

  const [updatedAgent] = await prisma.$transaction([
    prisma.users.update({
      where: { id: agentId },
      data: {
        parentAgentId: parentAgentId || agent.parentAgentId,
        name,
        roleId: role?.id,
        currencyId: currency?.id
      }
    }),
    prisma.users.update({
      where: {
        type: 'agent',
        id: agentId
      },
      data: {
        rate: Number(rate),
        parentAgentIds: parentAgent
          ? (updatedAgentParentIds as any)
          : agent.parentAgentIds,
        level: parentAgent
          ? (updatedAgentParentIds as any)?.length + 1
          : agent.level
      }
    })
  ]);

  return updatedAgent;
};

export const deleteAgent = async (id: string, userId: string) => {
  if (userId === id) {
    throw new BAD_REQUEST(message.CANT_DELETE);
  }
  const users = await getById({ id, userId });
  if (!users) {
    throw new NOT_FOUND(message.NOT_FOUND);
  }

  const childAgent = await prisma.users.findFirst({
    where: {
      parentAgentId: id,
      deletedAt: null
    }
  });

  if (childAgent) {
    throw new BAD_REQUEST(message.HAVE_SUB_AGENT);
  }

  await prisma.users.update({
    where: {
      id
    },
    data: {
      parentAgentIds: [],
      deletedAt: new Date()
    }
  });
};
