
import express from "express";
import { getTransactions, addTransaction } from "../controllers/transactionController.ts";

const router = express.Router()

    router.get("/transactions", getTransactions)
    router.post("/transaction", addTransaction)

export default router