import { PrismaClient, Vendors } from '@prisma/client';
// import axios from 'axios';
import { Response } from 'express';
import { RequestWithUser } from '../../models/customInterfaces';
// import agent from 'src/swagger/agent';
const prisma = new PrismaClient();

export const getVendors = async (_:RequestWithUser, res:Response): Promise<any> => {
  try {
    const vendors = await prisma.vendors.findMany({
      where: {
        deletedAt: null
      }
    })

    const rearrangedVendors = vendors.map((vendor) => { 
      const { fetchGames, deletedAt, createdAt, updatedAt , ...data } = { ...vendor, gamesTotal: (vendor.fetchGames as [])?.length ?? 0 } 
      return data
    }) 

    return res.status(200).json(rearrangedVendors)
  } catch (error) {
    console.log(error)
    return res.status(500).json(error)
  }
}

export const getGameVendors = async (
  req: RequestWithUser,
  res: Response
): Promise<any> => {
  try {
    const queryParams = req.query;
    const vendorStr = queryParams.vendors as string;
    const vendors: string[] = vendorStr.split(',');
    const games = await prisma.agentVendorTokens.findMany({
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

        // const gameUrl = `${game.url}/api/game-list`;
        // const bearerToken = `SN5VfYimhHZ5mzYxC2h9TeePNOo7YzsU6SOlmsld`;
        // const config = {
        //   headers: {
        //     Authorization: `Bearer ${bearerToken}`
        //   }
        // };

        try {
          // const response = await axios.get(gameUrl, config);
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
    const agentId = parseInt(req.params.agentId);
    const contracts = await prisma.agentVendorTokens.findMany({
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
    await prisma.agentVendorTokens.create({
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
