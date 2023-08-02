
import express from "express";
import { 
    getTransactions, 
    addTransaction, 
    getBalance,
    getTransactionDetailsByUserId,
    getTransactionDetailsByUserIdView,
    getTransactionsView
} from "../controllers/transactionController/index.ts"; 

const router = express.Router()

    router.get("/transactions", getTransactions)
    router.get("/transaction/:userId", getBalance)
    router.post("/transaction", addTransaction)
    router.get("/transaction-details/:userId", getTransactionDetailsByUserId)
    router.get("/transaction-details/view/:userId", getTransactionDetailsByUserIdView)
    router.get("/transactions/view", getTransactionsView)

export default router