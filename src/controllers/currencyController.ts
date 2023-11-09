import { NextFunction, Request, Response } from 'express';
import Redis from '../config/redis/index.ts';
import {
  create,
  deleteCurrency as deleteCurrencyService,
  getAll,
  getById,
  update
} from '../services/currenciesService.ts';
import { Currencies } from '../config/prisma/generated/base-default/index.js';
import { BAD_REQUEST } from '../core/error.response.ts';
import { CREATED, DELETED, OK, UPDATED } from '../core/success.response.ts';

const redisKey = 'currencies';

const message = {
  GET_ALL: 'Get all currencies success',
  GET_BY_ID: 'Get currency success',
  CREATED: 'Create currency success',
  UPDATED: 'Update currency success',
  DELETED: 'Delete currency success',
  INVALID: 'Invalid Currency Id',
  REQUIRED: 'Code and name is required'
};

export const getCurrencies = async (_: Request, res: Response) => {
  let data: any;
  const redisData = await Redis.get(redisKey);
  if (redisData) {
    data = JSON.parse(redisData);
  } else {
    const currencies = await getAll();
    data = {
      data: currencies,
      totalItems: currencies.length
    };
    await Redis.set(redisKey, JSON.stringify(data));
  }
  return new OK({ data }).send(res);
};

export const getCurrencyById = async (req: Request, res: Response) => {
  const { currencyId } = req.params;
  if (!Number(currencyId)) {
    throw new BAD_REQUEST(message.INVALID);
  }
  let data: any;
  const redisKeyWithId = `${redisKey}-${currencyId}`;
  const redisData = await Redis.get(redisKeyWithId);
  if (redisData) {
    data = JSON.parse(redisData);
  } else {
    data = await getById(Number(currencyId));
    await Redis.set(redisKeyWithId, JSON.stringify(data));
  }
  return new OK({ data, message: message.GET_BY_ID }).send(res);
};

export const addCurrency = async (req: Request, res: Response) => {
  const { name, code } = req.body;
  if (!name || !code) {
    throw new BAD_REQUEST(message.REQUIRED);
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
  return new CREATED({ data: newCurrency, message: message.CREATED }).send(res);
};

export const updateCurrency = async (
  req: Request,
  res: Response
): Promise<any> => {
  const { name = '', code = '' } = req.body;
  const currencyId = Number(req.params.currencyId);
  if (!currencyId) {
    throw new BAD_REQUEST(message.INVALID);
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
  return new UPDATED({ data: updatedCurrency, message: message.UPDATED }).send(
    res
  );
};

export const deleteCurrency = async (req: Request, res: Response) => {
  const currencyId = Number(req.params.currencyId);
  if (currencyId) {
    throw new BAD_REQUEST(message.INVALID);
  }
  await deleteCurrencyService(currencyId);
  await Redis.del(redisKey);
  await Redis.del(`${redisKey}-${currencyId}`);
  return new DELETED({ message: message.DELETED }).send(res);
};
