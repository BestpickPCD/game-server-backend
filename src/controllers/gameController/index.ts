import {
  PrismaClient,
  Users,
  Vendors
} from '../../config/prisma/generated/base-default/index.js';
import { NextFunction, Response } from 'express';
import { RequestWithUser } from '../../models/customInterfaces.ts';
import { getGamesByPlayerId as getGamesByPlayerIdService } from '../../services/vendorService.ts';
import { message } from '../../utilities/constants/index.ts';
import { getGameLaunch, getGameList } from './utilities.ts';
import { OK } from '../../core/success.response.ts';  
import { __bestpickGameLaunch } from './launch.ts';
import { _userInsert } from '../authenticationController/index.ts';
const prisma = new PrismaClient();

export const openGame = async (
  req: RequestWithUser,
  res: Response
): Promise<any> => {

  const { gameId, vendor, directUrl, username, nickname } = req.body;
 
  const user = await prisma.users.findUnique({
    where: {
      username
    }
  }) as Users;

  if(!user) { 
    const create = await _userInsert({
      name: username,
      username,
      type: 'player'
    });
    if(!create)
      throw new Error('User not found, cant create new user')
  }

  const responseData = await getGameLaunch(gameId, vendor, directUrl, username, nickname);
  return new OK({message:"Game open", data:responseData}).send(res);

};

export const updateVendor = async (
  req: RequestWithUser,
  res: Response,
  next: NextFunction
) => {
  try {
    const agentVendorId = Number(req.params.id);

    if (!agentVendorId) {
      throw new Error('VendorId is required');
    }

    const foundAgentVendor = await prisma.agentVendor.findFirst({
      where: {
        id: agentVendorId
      }
    });

    if (!foundAgentVendor) {
      throw new Error('Vendor not found');
    } 

    const vendor = await prisma.agentVendor.updateMany({
      data: {
        directUrl: !foundAgentVendor.directUrl
      },
      where: {
        id: agentVendorId
      }
    });

    return res
      .status(200)
      .json({ data: vendor, message: 'Vendor updated successfully' });
  } catch (error) {
    console.log(error)
    return next(error);
  }
};

export const gameList = async (
  req: RequestWithUser,
  res: Response
): Promise<any> => {
  try {
    const agentId = req.user?.parentAgentId;
    const vendor = req.query.vendors as string;

    let whereVendor;
    if (vendor) {
      const vendors: string[] = vendor.split(',');
      const vendorsNoNull = vendors.filter((item) => item !== '');
      whereVendor = {
        name: {
          in: vendorsNoNull
        }
      };
    }

    const getVendors = await prisma.vendors.findMany({
      where: whereVendor,
      select: {
        id: true,
        name: true,
        url: true,
        keys: true,
        agents: {
          where: {
            agentId: agentId ?? req.user?.id
          },
          select: {
            directUrl: true
          }
        }
      }
    });

    const list = await getGameList(getVendors);

    return res.status(200).json(list);
  } catch (error) {
    return res.status(500).json(error);
  }
};

export const getVendors = async (
  req: RequestWithUser,
  res: Response
): Promise<any> => {
  try {
    const agentId = req.query.agentId;
    const vendors = await prisma.vendors.findMany({
      select: {
        id: true,
        name: true,
        url: true,
        fetchGames: true,
        agents: {
          select: {
            id: true,
            directUrl: true
          },
          where: {
            agentId: agentId ? `${agentId}` : req.user?.id
          }
        }
      },
      where: {
        deletedAt: null
      }
    });

    const rearrangedVendors = vendors.map((vendor) => {
      const canSee = vendor.agents.length == 1 ? true : false; // Check if there agent is linked to vendor
      const { fetchGames, ...data } = {
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
    return res.status(500).json(error);
  }
};
