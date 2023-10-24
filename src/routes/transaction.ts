import express from 'express';
import {
  addBetLimit,
  addTransaction,
  deleteBetLimit,
  getBetLimitById,
  getBetLimitations,
  getTransactionDetail,
  getTransactionDetailsByUserId,
  getTransactions,
  landingPage,
  changeBalance,
  updateBetLimit,
  getBalance
} from '../controllers/transactionController/index.ts';
import { authentication } from '../middleware/authentication.ts';
import { permission } from '../middleware/permission.ts';

const router = express.Router();
router.get('/callback/balance', getBalance)
router.post('/callback/changeBalance', changeBalance)
router.get(
  '/transactions',
  authentication,
  permission('transactions', 'get'),
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
  '/transaction-details/:userId',
  authentication,
  permission('transactions', 'get'),
  getTransactionDetailsByUserId
);
router.get(
  '/bet-limit',
  authentication,
  permission('transactions', 'get'),
  getBetLimitations
);
router.get(
  '/bet-limit/:id',
  authentication,
  permission('transactions', 'getById'),
  getBetLimitById
);
router.post(
  '/bet-limit',
  authentication,
  permission('transactions', 'create'),
  addBetLimit
);
router.patch(
  '/bet-limit/:id',
  authentication,
  permission('transactions', 'update'),
  updateBetLimit
)
router.delete(
  '/bet-limit/:id',
  authentication,
  permission('transactions', 'delete'),
  deleteBetLimit
)
router.get('/landing-page', landingPage);

export default router;
