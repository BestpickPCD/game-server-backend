
import express from "express";
import { getTransactions, addTransaction, getBalance } from "../controllers/transactionController.ts";

const router = express.Router()

    router.get("/transactions", getTransactions)
    router.get("/transaction/:userId", getBalance)
    router.post("/transaction", addTransaction)

export default router