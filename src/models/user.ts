import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();

export const getParentAgentIdsByParentAgentId = async ( parentAgentId: number ) => {
    const agent = await prisma.agents.findUnique({
        where: {
            id: parentAgentId
        }
    }) as any
 
    const level = agent.level ? agent.level + 1 : 1

    if(!agent.parentAgentIds) { 
        const details = {
            parentAgentIds: [agent.id],
            level
        }
        return details
    } 
        const details = {
            parentAgentIds: [...agent.parentAgentIds, agent.id],
            level
        }
        return details 
     
}