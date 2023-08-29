import { NextFunction, Request, Response } from 'express';
import Redis from '../config/redis/index.ts';
import {
  create,
  deleteCurrency as deleteCurrencyService,
  getAll,
  getById,
  update
} from '../services/currenciesService.ts';
import { message } from './../utilities/constants/index.ts';
import { Currencies } from '@prisma/client';

const redisKey = 'currencies';
const INVALID = 'Invalid Currency Id';

export const getCurrencies = async (
  _: Request,
  res: Response,
  next: NextFunction
): Promise<any> => {
  try {
    const redisData = await Redis.get(redisKey);
    if (redisData) {
      return res.status(200).json({
        data: JSON.parse(redisData),
        message: message.SUCCESS
      });
    }
    const currencies = await getAll();
    const data = {
      data: currencies,
      totalItems: currencies.length
    };
    await Redis.set(redisKey, JSON.stringify(data));
    return res.status(200).json({
      data,
      message: message.SUCCESS
    });
  } catch (error) {
    return next(error);
  }
};

export const getCurrencyById = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<any> => {
  try {
    const { currencyId } = req.params;
    if (!Number(currencyId)) {
      throw Error(INVALID);
    }
    const redisKeyWithId = `${redisKey}-${currencyId}`;
    const redisData = await Redis.get(redisKeyWithId);
    if (redisData) {
      return res.status(200).json(JSON.parse(redisData));
    }
    const currency = await getById(Number(currencyId));
    await Redis.set(redisKeyWithId, JSON.stringify(currency));
    return res.status(200).json({
      data: currency,
      message: message.SUCCESS
    });
  } catch (error) {
    return next(error);
  }
};

export const addCurrency = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<any> => {
  try {
    const { name, code } = req.body;
    if (!name || !code) {
      throw Error(`Code and name is required`);
    }
    const newCurrency = await create(name, code);
    const redisData = await Redis.get(redisKey);
    if (redisData) {
      const data = {
        data: [newCurrency, ...JSON.parse(redisData).data],
        totalItems: Number(JSON.parse(redisData).totalItems) + 1
      };
      await Redis.set(redisKey, JSON.stringify(data));
    }
    return res
      .status(200)
      .json({ data: newCurrency, message: message.CREATED });
  } catch (error) {
    return next(error);
  }
};

export const updateCurrency = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<any> => {
  try {
    const { name = '', code = '' } = req.body;
    const currencyId = Number(req.params.currencyId);
    if (!currencyId) {
      throw Error(INVALID);
    }

    const updatedCurrency = await update(name, code, currencyId);
    const redisKeyWithId = `${redisKey}-${currencyId}`;
    const redisDataById = await Redis.get(redisKeyWithId);
    if (redisDataById) {
      await Redis.set(redisKeyWithId, JSON.stringify(updatedCurrency));
    }

    const redisData = await Redis.get(redisKey);
    if (redisData) {
      const parseRedisData = JSON.parse(redisData) as {
        data: Currencies[];
        totalItems: number;
      };
      const updatedRedisData = parseRedisData.data.map((role: Currencies) => {
        if (role.id === Number(currencyId)) {
          return updatedCurrency;
        }
        return role;
      });
      await Redis.set(
        redisKey,
        JSON.stringify({
          ...parseRedisData,
          data: updatedRedisData
        })
      );
    }
    return res
      .status(200)
      .json({ data: updatedCurrency, message: message.UPDATED });
  } catch (error) {
    return next(error);
  }
};

export const deleteCurrency = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<any> => {
  try {
    const currencyId = Number(req.params.currencyId);
    if (currencyId) {
      throw Error(INVALID);
    }
    await deleteCurrencyService(currencyId);
    await Redis.del(redisKey);
    await Redis.del(`${redisKey}-${currencyId}`);
    return res.status(200).json({ message: message.DELETED });
  } catch (error) {
    return next(error);
  }
};
