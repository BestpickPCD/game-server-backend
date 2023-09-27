import { Players, PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();

export const getAgentByPlayerId = async (
  playerId: number
): Promise<Players | null> => {
  try {
    const player: Players | null = await prisma.players.findUnique({
      where: {
        deletedAt: null,
        id: playerId,
        agent: {
          deletedAt: null
        }
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
        agentId: player?.agentId,
        deletedAt: null
      }
    });
    const data = games.map((game) => game?.vendor);
    return data;
  } catch (error: any) {
    throw Error(error.message);
  }
};
