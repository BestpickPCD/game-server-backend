import { PrismaClient } from '@prisma/client';
import { Request, Response } from 'express';
const prisma = new PrismaClient();

export const getCurrencies = async ( _: Request, res: Response ) : Promise<any> => {
  try {
    const currencies = await prisma.currencies.findMany({
      where: { deletedAt: null },
      orderBy: { name: 'asc' }
    });

    return res.status(200).json(currencies);

  } catch (error) {  
    return res.status(500).json({ message: 'something went wrong', error }); 
  }
};

export const getCurrencyById = async ( req: Request, res: Response ) : Promise<any> => {
  try {
    const currencyId = parseInt(req.params.currencyId)
    const currency = await prisma.currencies.findUnique({
      where: { deletedAt: null, id: currencyId },
    }); 
    return res.status(200).json(currency);

  } catch (error) {  
    return res.status(500).json({ message: 'something went wrong', error }); 
  }
};

export const addCurrency = async (req: Request, res: Response) : Promise<any> => {
  try {  
    const { name, code } = req.body; 
    const findCurrency = await prisma.currencies.findUnique({
      where: { name, code }
    });

    if (!findCurrency) {
      await prisma.currencies.create({
        data: { name, code }
      });
      return res.status(201).json({ message: 'currency created' });
    } 
    else 
      res.status(400).json({ message: 'currency exists' });
  } catch (error) { 
    console.log(error)
    return res.status(500).json({ message: 'something went wrong', error });
  }
};

export const updateCurrency = async (
  req: Request,
  res: Response
): Promise<any> => {
  try {
    const { name, code } = req.body;
    const currencyId = parseInt(req.params.currencyId);

    const updatedCurrency = await prisma.currencies.update({
      where: { id: currencyId },
      data: { name, code }
    });

    if (!updatedCurrency)
      return res.status(404).json({ message: 'Currency not found' });
    else 
      return res.status(200).json({ message: 'Currency updated' });

  } catch (error) { 
    return res.status(500).json({ message: 'something went wrong', error });
  }
};
export const deleteCurrency = async (
  req: Request,
  res: Response
): Promise<any> => {
  try {
    const currencyId = parseInt(req.params.currencyId);
    const deleteCurrency = await prisma.currencies.update({
      where: { id: currencyId },
      data: { deletedAt: new Date() }
    });

    if (!deleteCurrency)
      return res.status(404).json({ message: 'Currency not found' });
    else 
      return res.status(404).json({ message: 'Currency soft-deleted' });

  } catch (error) {
    return res.status(500).json({ message: 'something went wrong', error });
  }
};
