
import express from "express";
import { 
    getTransactions, 
    addTransaction, 
    getBalance,
    getTransactionDetailsByUserId 
} from "../controllers/transactionController/index.ts";

const router = express.Router()

    router.get("/transactions", getTransactions)
    router.get("/transaction/:userId", getBalance)
    router.post("/transaction", addTransaction)
    router.get("/transaction-details/:userId", getTransactionDetailsByUserId)

export default router