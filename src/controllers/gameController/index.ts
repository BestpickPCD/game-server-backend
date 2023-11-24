import {
  PrismaClient,
  Vendors
} from '../../config/prisma/generated/base-default/index.js';
import axios from 'axios';
import { NextFunction, Response } from 'express';
import { RequestWithUser } from '../../models/customInterfaces.ts';
// import agent from 'src/swagger/agent';
import { getGamesByPlayerId as getGamesByPlayerIdService } from '../../services/vendorService.ts';
import { message } from '../../utilities/constants/index.ts';
const prisma = new PrismaClient();

export const openGame = async (
  req: RequestWithUser,
  res: Response
): Promise<any> => {
  try {
    const { gameId } = req.body;
    const username = req.user?.username;
    const url = 'http://157.230.251.158:6175/v1/game/open';
    
    const gameOpenResponse = await axios.post(url, {
      game_id: gameId,
      user_id: 'dev2',
      ag_code: 'dev2',
      currency: 'usd',
      language: 'en',
      cash: 1000,
    }, { 
      headers: {
        'ag-token': 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiIxMjM0NTY3ODkwIiwibmFtZSI6ImNyeXB0byIsImlhdCI6MTUxNjIzOTAyMn0.ZAGAuEn3ifbPB37oVc1NtqcgQAo6xOu_MLXqN6smdro',
        'ag-code': 'A01',
      } 
    });

    // Extract only the necessary data from the response
    const responseData = {
      status: gameOpenResponse.status,
      data: gameOpenResponse.data,
    }; 

    return res.status(200).json(responseData);
  } catch (error) {
    console.error('Error in openGame:', error);
    return res.status(500).json({ error: 'Internal Server Error' });
  }
};

export const gameList = async (
  req: RequestWithUser,
  res: Response
): Promise<any> => {
  try { 
    const vendor = req.query.vendors as string;
    const vendors : string[] = vendor.split(',');
    console.log(vendors,'vendors')
    const vendorsNoNull = vendors.filter(item => item !== '');
    const getVendors = await prisma.vendors.findMany({
      where: {
        name: {
          in: vendorsNoNull
        }
      }
    }) as Vendors[];
    let list = [] as any[]
    await Promise.all(getVendors.map( async (vendor) => {
      const { url, apiKey } = vendor as any;
      const gameList = await axios.get(`${url}:6195/api/game_list`, {
        headers: {
            'api-key': apiKey,
        }
      }); 

      list = list.concat(gameList.data.data);
      
    }));
    console.log(list,'list')

    return res.status(200).json( list )

  } catch (error) {
    console.log(error)
  }
}

export const getVendors = async (
  req: RequestWithUser,
  res: Response
): Promise<any> => {
  try {
    const vendors = await prisma.vendors.findMany({
      select: {
        id: true,
        name: true,
        url: true,
        fetchGames: true,
        agents: {
          select: {
            vendorId: true
          },
          where: {
            agentId: req.user?.id
          }
        }
      },
      where: {
        deletedAt: null
      }
    });

    const rearrangedVendors = vendors.map((vendor) => {
      const canSee = vendor.agents.length == 1 ? true : false; // Check if there agent is linked to vendor
      const { fetchGames, agents, ...data } = {
        ...vendor,
        gamesTotal: (vendor.fetchGames as [])?.length ?? 0,
        canSee
      };
      return data;
    });

    return res.status(200).json(rearrangedVendors);
  } catch (error) {
    return res.status(500).json(error);
  }
};

export const getGameVendors = async (
  req: RequestWithUser,
  res: Response
): Promise<any> => {
  try {
    const queryParams = req.query;
    const vendorStr = queryParams.vendors as string;
    const vendors: string[] = vendorStr.split(',') ?? [];
    const games = await prisma.agentVendor.findMany({
      where: {
        agentId: req.user?.id,
        vendor: {
          name: {
            in: vendors
          }
        }
      },
      select: {
        vendor: true
      }
    });

    if (!games.length) {
      return res
        .status(400)
        .json({ message: 'No contract with the vendors selected' });
    }

    const gamesDetails = await Promise.all(
      games.map(async (game) => {
        if (!game) {
          return null;
        }
        try {
          return game.vendor?.fetchGames;
        } catch (error) {
          console.log(error);
          return null;
        }
      })
    );

    return res.status(200).json(gamesDetails.flat());
  } catch (error) {
    console.error(error);
    return res.status(500).json({ message: 'Something went wrong', error });
  }
};

export const getGameContractByAgentId = async (
  req: RequestWithUser,
  res: Response
): Promise<any> => {
  try {
    const agentId = req.params.agentId;
    const contracts = await prisma.agentVendor.findMany({
      where: {
        agentId
      },
      select: {
        vendor: {
          select: {
            id: true,
            name: true,
            fetchGames: true,
            createdAt: true
          }
        }
      }
    });

    return res.status(200).json(contracts);
  } catch (error) {
    console.log(error);
    return res.status(500).json({ message: error });
  }
};

export const gameContract = async (
  req: RequestWithUser,
  res: Response
): Promise<any> => {
  try {
    const { agentId, vendorId } = req.body;
    const data = { agentId, vendorId };
    await prisma.agentVendor.create({
      data
    });
    return res.status(200).json({ message: 'Contract created' });
  } catch (error) {
    console.log(error);
    return res.status(500).json(error);
  }
};

export const gameLaunchLink = async (
  req: RequestWithUser,
  res: Response
): Promise<any> => {
  try {
    const queryParams = req.query;
    const vendor = queryParams.vendor as string;
    // const gameId = queryParams.gameId as string;

    const game = (await prisma.vendors.findFirst({
      where: {
        name: vendor
      }
    })) as Vendors;

    const data = {
      user: req.user,
      link: game.url
    };
    return res.status(200).json(data);
  } catch (error) {
    console.log(error);
    return res.status(500).json(error);
  }
};

export const getGameUrl = async (
  req: RequestWithUser,
  res: Response
): Promise<any> => {
  try {
    const queryParams = req.query;
    const vendor = queryParams.vendor as string;
    // const gameId = queryParams.gameId as string;

    const game = (await prisma.vendors.findFirst({
      where: {
        name: vendor
      }
    })) as Vendors;

    const data = {
      user: req.user,
      link: game.url
    };
    return res.status(200).json(data);
  } catch (error) {
    console.log(error);
    return res.status(500).json(error);
  }
};

export const getGamesByPlayerId = async (
  req: RequestWithUser,
  res: Response,
  next: NextFunction
): Promise<any> => {
  try {
    const playerId = req?.user?.id;
    const games = await getGamesByPlayerIdService(playerId as string);
    return res.status(200).json({
      data: {
        data: games,
        totalItems: games.length
      },
      message: message.SUCCESS
    });
  } catch (error) {
    console.log(error);
    return next(error);
  }
};
