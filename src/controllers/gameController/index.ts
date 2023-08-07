import { PrismaClient } from '@prisma/client';
import axios from 'axios';
import { Request, Response } from 'express';
const prisma = new PrismaClient();

export const getGameVendors = async (req: Request, res: Response): Promise<any> => {
  try { 
    const queryParams = req.query; 
    const vendorStr = queryParams.vendors as string; 
    const vendors = vendorStr.split(',');
    const games = await prisma.vendors.findMany({
      where: {
        name: {
          in: vendors
        }
      }
    });  

    const gamesDetails = await Promise.all(games.map( async (game) => {
      if (game.url === null) {
        return null; // Skip this iteration
      } 
      const gameUrl = `${game.url}/api/game-list`; 
      const bearerToken = `SN5VfYimhHZ5mzYxC2h9TeePNOo7YzsU6SOlmsld`;
      const config = {
        headers: {
          Authorization: `Bearer ${bearerToken}`
        }
      };
      try {
        const response = await axios.get(gameUrl, config);  
        return response.data;
      } catch (error) {
        console.error(`Error fetching game details for URL: ${gameUrl}`);
        return null;
      }
    })); 
    
    return res.status(200).json(gamesDetails.flat());

  } catch (error) {
    console.error(error);
    return res.status(500).json({ message: 'Something went wrong', error });
  }
};
