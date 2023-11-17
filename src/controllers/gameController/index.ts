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

export const gameList = async (
  req: RequestWithUser,
  res: Response
): Promise<any> => {
  try { 
    const vendor = req.query.vendors as string;
    const vendors : string[] = vendor.split(','); 

    const getVendors = await prisma.vendors.findMany({
      where: {
        name: {
          in: vendors
        }
      }
    })

    let list = [] as any[]

    await Promise.all(getVendors.map( async (vendor) => {
      const { url, apiKey } = vendor
      const gameList = await axios.get(`${url}/api/game_list`, {
        headers: {
            'api-key': apiKey,
        }
      });
      console.log(gameList.data.data)
      list = list.concat(gameList.data.data);
    }));

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
