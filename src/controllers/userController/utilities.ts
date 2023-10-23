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
