import express from 'express';
import {
  addTransaction,
  getTransactionDetail,
  getTransactionDetailsByUserId,
  getTransactions,
  landingPage
} from '../controllers/transactionController/index.ts';
import { authentication } from '../middleware/authentication.ts';
import { permission } from '../middleware/permission.ts';
import { Transaction } from '../middleware/transaction.ts';

const router = express.Router();

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
router.post(
  '/transaction',
  authentication,
  permission('transactions', 'create'),
  addTransaction
);
router.get(
  '/transaction-details/:username',
  authentication,
  permission('transactions', 'get'),
  getTransactionDetailsByUserId
);
router.get('/landing-page', landingPage);

export default router;
