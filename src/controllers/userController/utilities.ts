import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();

export const getParentAgentIdsByParentAgentId = async ( parentAgentId: number ): Promise<any> => {
    const agent = await prisma.agents.findUnique({
        where: {
            id: parentAgentId
        }
    }) as any 
    
    const details = {
        parentAgentIds: agent.parentAgentIds ? [...agent.parentAgentIds, agent.id] : [agent.id],
        level: agent.level ? agent.level + 1 : 1
    }
    
    return details 
    
} 

export const findCurrencyById = async (currencyId: number): Promise<any> => {
  const currency = await prisma.currencies.findFirst({
    where: {
      id: currencyId,
    },
  });

  return currency;
};