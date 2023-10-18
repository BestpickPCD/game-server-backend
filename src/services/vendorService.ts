import { PrismaClient, Users } from '../config/prisma/generated/base-default/index.js';
const prisma = new PrismaClient();

export const getAgentByPlayerId = async (
  playerId: number
): Promise<Users | null> => {
  try {
    const player: Users | null = await prisma.users.findUnique({
      where: {
        deletedAt: null,
        id: playerId, 
      }
    });

    if (!player) {
      throw Error('Player not found');
    }
    return player;
  } catch (error: any) {
    console.log(error)
    throw Error(error.message);
  }
};

export const getGamesByPlayerId = async (
  playerId: number
): Promise<
  ({
    fetchGames: any;
    name: string;
    url: string | null;
  } | null)[]
> => {
  try {
    const player = await getAgentByPlayerId(playerId);
    const games = await prisma.agentVendor.findMany({
      select: {
        vendor: {
          select: {
            fetchGames: true,
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
    const data = games.map((game) => game?.vendor);
    return data;
  } catch (error: any) {
    throw Error(error.message);
  }
};
