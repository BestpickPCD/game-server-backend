import {
  PrismaClient,
  Users
} from '../config/prisma/generated/base-default/index.js';
const prisma = new PrismaClient();

export const getAgentByPlayerId = async (
  playerId: string
): Promise<Users | null> => {
  try {
    const player: Users | null = await prisma.users.findUnique({
      where: {
        deletedAt: null,
        id: playerId
      }
    });

    if (!player) {
      throw Error('Player not found');
    }
    return player;
  } catch (error: any) {
    throw Error(error.message);
  }
};

export const getGamesByPlayerId = async (
  playerId: string
) => {
  try {
    const player = await getAgentByPlayerId(playerId);
    const games = await prisma.agentVendor.findMany({
      select: {
        directUrl: true,
        vendor: {
          select: {
            name: true,
            url: true
          }
        }
      },
      where: {
        agentId: (player as any)?.parentAgentId,
        deletedAt: null
      }
    });

    const data = games.map((game) => { 
      return {
        directUrl: game?.directUrl,
        name: game?.vendor?.name,
        url: game?.vendor?.url
      }
    });

    return data;
  } catch (error: any) {
    throw Error(error.message);
  }
};
