import express from 'express';
import {
  addTransaction,
  getTransactionDetail,
  // getBalance,
  getTransactionDetailsByUserId,
  getTransactionDetailsByUserIdView,
  getTransactions,
  getTransactionsView,
  landingPage,
  testTransaction
} from '../controllers/transactionController/index.ts';
import { authentication } from '../middleware/authentication.ts';
import { permission } from '../middleware/permission.ts';
import { Transaction } from '../middleware/transaction.ts';

const router = express.Router();

router.get('/test-transaction', testTransaction);
router.get(
  '/transactions',
  authentication,
  permission('transactions', 'get'),
  Transaction,
  getTransactions
);
router.get(
  '/transactions/:id',
  authentication,
  permission('transactions', 'getById'),
  getTransactionDetail
);
// router.get("/transaction/:userId", getBalance)
router.post(
  '/transaction',
  authentication,
  permission('transactions', 'create'),
  addTransaction
);
router.get(
  '/transaction-details/:userId',
  authentication,
  permission('transactions', 'get'),
  getTransactionDetailsByUserId
);
router.get(
  '/transaction-details/view/:userId',
  getTransactionDetailsByUserIdView
);
router.get('/transactions/view', getTransactionsView);
router.get('/landing-page', landingPage);

export default router;
