import { PrismaClient } from '../../config/prisma/generated/base-default/index.js';
const prisma = new PrismaClient();

export const getParentAgentIdsByParentAgentId = async (
  parentAgentId: number
): Promise<any> => {
  const agent = (await prisma.agents.findUnique({
    where: {
      id: parentAgentId
    }
  })) as any;

  const level = agent.level ? agent.level + 1 : 1;
  const parentAgentIds = agent.parentAgentIds
    ? [...agent.parentAgentIds, agent.id]
    : [agent.id];

  const details = {
    parentAgentIds,
    level
  };

  return details;
};

export const findCurrencyById = async (currencyId: number): Promise<any> => {
  const currency = await prisma.currencies.findFirst({
    where: {
      id: currencyId
    }
  });

  return currency;
};

export const getBalanceSummariesByIds = async (
  userIds: number[]
): Promise<any> => {
  const stringIds = userIds.join(',');

  const usersWithBalances = await prisma.$queryRaw`
    SELECT
      sender.id AS senderId, receiver.id AS receiverId, Users.id AS userGameId,
      IFNULL(sender.out, 0) AS \`out\`,
      IFNULL(receiver.in, 0) AS \`in\`,
      IFNULL(gameResult.gameOut, 0) AS gameOut,
      IFNULL((IFNULL(receiver.in, 0) - IFNULL(sender.out, 0) - IFNULL(gameResult.gameOut, 0)), 0) AS balance
    FROM Users
    LEFT JOIN (
      SELECT SUM(IFNULL(amount, 0)) AS \`out\`, senderId AS id
      FROM Transactions
      WHERE TYPE IN ('add', 'lose', 'charge', 'bet') AND senderId IN (${stringIds})
      GROUP BY senderId
    ) AS sender ON sender.id = Users.id
    LEFT JOIN (
      SELECT SUM(IFNULL(amount, 0)) AS \`in\`, receiverId AS id
      FROM Transactions
      WHERE TYPE IN ('add', 'win') AND receiverId IN (${stringIds})
      GROUP BY receiverId
    ) AS receiver ON receiver.id = Users.id
    LEFT JOIN (
      SELECT SUM(IFNULL(amount, 0)) AS gameOut, receiverId AS id
      FROM Transactions
      WHERE TYPE IN ('lose', 'charge') AND receiverId IN (${stringIds})
      GROUP BY receiverId
    ) AS gameResult ON gameResult.id = Users.id
    WHERE Users.id IN (${stringIds})
  `;

  return usersWithBalances;
};

export const getAffiliatedAgentsByUserId = async (userId: number) => {
  try {
    const affiliatedAgents = (await prisma.$queryRaw`
      SELECT Users.id, Users.name, Users.username, Users.email
      FROM Agents
      JOIN Users ON Users.id = Agents.id
      WHERE JSON_CONTAINS(Agents.parentAgentIds, JSON_ARRAY(${userId}))
    `) as any;

    return affiliatedAgents;
  } catch (error) {
    throw Error(error);
  }
};
