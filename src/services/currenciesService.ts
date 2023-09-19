import {
  Currencies,
  PrismaClient
} from '../config/prisma/generated/base-default/index.js';
const prisma = new PrismaClient();

const NOT_FOUND = 'Currency not found';
const EXITED = 'Currency existed';

export const getAll = async (): Promise<Currencies[]> => {
  try {
    const currencies = await prisma.currencies.findMany({
      where: { deletedAt: null },
      orderBy: { updatedAt: 'asc' }
    });
    return currencies;
  } catch (error: any) {
    throw Error(error.message);
  }
};

export const getById = async (id: number): Promise<Currencies | null> => {
  try {
    const currency = await prisma.currencies.findUnique({
      where: { deletedAt: null, id }
    });
    if (!currency) {
      throw Error(NOT_FOUND);
    }
    return currency;
  } catch (error: any) {
    throw Error(error.message);
  }
};

const getByWithNameOrCode = async (
  name: string,
  code: string
): Promise<Currencies[]> => {
  try {
    const currencyWithNameOrCode = await prisma.currencies.findMany({
      where: { OR: [{ name }, { code }] }
    });
    if (currencyWithNameOrCode.length) {
      throw Error(EXITED);
    }
    return currencyWithNameOrCode;
  } catch (error: any) {
    throw Error(error.message);
  }
};

export const create = async (
  name: string,
  code: string
): Promise<Currencies> => {
  try {
    await getByWithNameOrCode(name, code);
    const newCurrency = await prisma.currencies.create({
      data: { name, code }
    });
    return newCurrency;
  } catch (error: any) {
    throw Error(error.message);
  }
};

export const update = async (
  name: string,
  code: string,
  id: number
): Promise<Currencies> => {
  try {
    await getById(id);
    await getByWithNameOrCode(name, code);
    const updatedCurrency = await prisma.currencies.update({
      where: { id },
      data: { ...(name && { name }), ...(code && { code }) }
    });
    return updatedCurrency;
  } catch (error: any) {
    throw Error(error.message);
  }
};

export const deleteCurrency = async (id: number): Promise<void> => {
  try {
    const deleteCurrency = await prisma.currencies.update({
      where: { id },
      data: { deletedAt: new Date() }
    });
    if (!deleteCurrency) {
      throw Error(NOT_FOUND);
    }
  } catch (error: any) {
    throw Error(error.message);
  }
};
