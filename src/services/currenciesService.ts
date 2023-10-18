import {
  Currencies,
  PrismaClient
} from '../config/prisma/generated/base-default/index.js';
import { BAD_REQUEST, NOT_FOUND, CONFLICT } from '../core/error.response.js';
const prisma = new PrismaClient();

const message = {
  NOT_FOUND: 'Currency not found',
  EXITED: 'Currency existed'
};

export const getAll = async (): Promise<Currencies[]> => {
  const currencies = await prisma.currencies.findMany({
    where: { deletedAt: null },
    orderBy: { updatedAt: 'asc' }
  });
  return currencies;
};

export const getById = async (id: number) => {
  const currency = await prisma.currencies.findUnique({
    where: { deletedAt: null, id }
  });
  if (!currency) {
    return new NOT_FOUND(message.NOT_FOUND);
  }
  return currency;
};

const getByWithNameOrCode = async (name: string, code: string) => {
  const currencyWithNameOrCode = await prisma.currencies.findMany({
    where: { OR: [{ name }, { code }] }
  });
  if (currencyWithNameOrCode.length) {
    return new CONFLICT(message.EXITED);
  }
  return currencyWithNameOrCode;
};

export const create = async (
  name: string,
  code: string
): Promise<Currencies> => {
  await getByWithNameOrCode(name, code);
  const newCurrency = await prisma.currencies.create({
    data: { name, code }
  });
  return newCurrency;
};

export const update = async (
  name: string,
  code: string,
  id: number
): Promise<Currencies> => {
  await getById(id);
  await getByWithNameOrCode(name, code);
  const updatedCurrency = await prisma.currencies.update({
    where: { id },
    data: { ...(name && { name }), ...(code && { code }) }
  });
  return updatedCurrency;
};

export const deleteCurrency = async (id: number) => {
  const deleteCurrency = await prisma.currencies.update({
    where: { id },
    data: { deletedAt: new Date() }
  });
  if (!deleteCurrency) {
    return new NOT_FOUND(message.NOT_FOUND);
  }
};
