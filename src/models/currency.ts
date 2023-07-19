import { PrismaClient } from "@prisma/client";
const prisma = new PrismaClient();

export const findById = async (currencyId: number) => {
  const currency = await prisma.currencies.findFirst({
    where: {
      id: currencyId,
    },
  });

  return currency;
};
