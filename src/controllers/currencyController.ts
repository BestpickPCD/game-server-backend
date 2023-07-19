import { PrismaClient } from "@prisma/client";
import { Request, Response } from "express";
const prisma = new PrismaClient();

export const getCurrencies = async (req: Request, res: Response) => {
  try {
    const currencies = await prisma.currencies.findMany({
      where: { deletedAt: null },
      orderBy: { name: "asc" },
    });
    res.status(200).json(currencies);
  } catch (error) {
    res.status(500).json({ message: "something went wrong", error });
    console.log(error);
  }
};

export const addCurrency = async (req: Request, res: Response) => {
  try {
    const { name, code } = req.body;
    const findCurrency = await prisma.currencies.findUnique({
      where: { name, code },
    });

    if (!findCurrency) {
      await prisma.currencies.create({
        data: { name, code },
      });
      res.status(201).json({ message: "currency created" });
    } else res.status(400).json({ message: "currency exists" });
  } catch (error) {
    res.status(500).json({ message: "something went wrong", error });
    console.log(error);
  }
};
export const updateCurrency = async (req: Request, res: Response) => {
  try {
    const { name, code } = req.body;
    const currencyId = parseInt(req.params.currencyId);

    const updatedCurrency = await prisma.currencies.update({
      where: { id: currencyId },
      data: { name, code },
    });

    if (!updatedCurrency)
      return res.status(404).json({ message: "Currency not found" });
    else res.status(200).json({ message: "Currency updated" });
  } catch (error) {
    console.log(error);
    res.status(500).json({ message: "something went wrong", error });
  }
};
export const deleteCurrency = async (req: Request, res: Response) => {
  try {
    const currencyId = parseInt(req.params.currencyId);
    const deleteCurrency = await prisma.currencies.update({
      where: { id: currencyId },
      data: { deletedAt: new Date() },
    });

    if (!deleteCurrency)
      return res.status(404).json({ message: "Currency not found" });
    else res.status(404).json({ message: "Currency soft-deleted" });
  } catch (error) {
    console.log(error);
    res.status(500).json({ message: "something went wrong", error });
  }
};
