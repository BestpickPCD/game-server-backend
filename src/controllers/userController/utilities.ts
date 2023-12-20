import { PrismaClient } from '../../config/prisma/generated/base-default/index.js';
const prisma = new PrismaClient();
import { PrismaClient as PrismaClientTransaction } from '../../config/prisma/generated/transactions/index.js';
const prismaTransaction = new PrismaClientTransaction();

export const getParentAgentIdsByParentAgentId = async (
  parentAgentId: string
): Promise<any> => {
  
  const agent = (await prisma.users.findUnique({
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

export const getAffiliatedAgentsByUserId = async (userId: string) => {
  try { 
    const affiliatedAgents = await prisma.users.findMany({
      where: {
        parentAgentIds: {
          array_contains: [String(userId)]
        }
      }
    });

    const affiliatedUserId = affiliatedAgents.map(({ id }:{id:string}) => id);

    return { affiliatedAgents, affiliatedUserId };
  } catch (error: any) {
    throw Error(error);
  }
};

export const subBalancesByUserIds =  async (userIds: string[]) => {

  try {
    const transactions = await prismaTransaction.transactions.findMany({
      where: {
        userId: {
          in: userIds
        }
      },
      select: {
        userId: true,
        type: true,
        amount: true
      },
      orderBy: {
        userId: 'asc'
      }
    });
  
    const transformedData: Record<string, Record<string, number>> = {};
  
    transactions.forEach((transaction) => {
      const { userId, type, amount } = transaction;
  
      if (!transformedData[userId as string]) {
        transformedData[userId as string] = {};
      }
  
      if (!transformedData[userId as string][type]) {
        transformedData[userId as string][type] = 0;
      }
  
      transformedData[userId as string][type] += amount;
    });
  
    return transformedData;
    
  } catch (error: any) {
    throw Error(error);
  }

}
