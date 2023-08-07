import { PrismaClient } from '@prisma/client';
import axios from 'axios';
import { Request, Response } from 'express'; 
const prisma = new PrismaClient();

export const getGameVendors = async (_: Request, res: Response): Promise<any> => {
  console.log(123);
  try { 
    // const parsedUrl = req.url;  
    // const vendors = vendorStr ? vendorStr.split(',') : ['evolution'];
    const games = await prisma.vendors.findMany({
      where: {
        name: {
          in: ['evolution']
        }
      }
    });

    let gameList: string[] = [];
    const gamesDetails = await Promise.all(games.map(async (game) => {
      if (game.url === null) {
        return null; // Skip this iteration
      }
      const gameUrl = game.url;
      const bearerToken = `SN5VfYimhHZ5mzYxC2h9TeePNOo7YzsU6SOlmsld`;
      const config = {
        headers: {
          Authorization: `Bearer ${bearerToken}`
        }
      };
      try {
        const response = await axios.get(gameUrl, config);
        gameList = [...gameList, ...response.data];
        return response.data;
      } catch (error) {
        console.error(`Error fetching game details for URL: ${gameUrl}`);
        return null;
      }
    }));

    console.log(gamesDetails);
    return res.status(200).json(gamesDetails);
  } catch (error) {
    console.error(error);
    return res.status(500).json({ message: 'Something went wrong', error });
  }
};
