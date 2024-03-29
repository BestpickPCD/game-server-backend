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
  getBalance,
  transactionAction,
  getCallbackTransaction,
  getBettingList
} from '../controllers/transactionController/index.ts';
import { authentication } from '../middleware/authentication.ts';
import { permission } from '../middleware/permission.ts';
import { asyncHandler } from '../utilities/helpers/asyncHandler.ts';

const router = express.Router();
router.get('/callback/balance', asyncHandler(getBalance));
router.post('/callback/changeBalance', asyncHandler(changeBalance));
router.get(
  '/callback-transaction/:id',
  authentication,
  asyncHandler(getCallbackTransaction)
);
router.get(
  '/transactions',
  authentication,
  permission('transactions', 'get'),
  asyncHandler(getTransactions)
);
router.get(
  '/betting-list',
  authentication,
  permission('transactions', 'get'),
  asyncHandler(getBettingList)
);
router.get(
  '/transactions/:id',
  authentication,
  permission('transactions', 'getById'),
  asyncHandler(getTransactionDetail)
);
router.post(
  '/transaction',
  authentication,
  permission('transactions', 'create'),
  asyncHandler(addTransaction)
);
router.patch(
  '/transaction-action/:id',
  authentication,
  permission('transactions', 'update'),
  asyncHandler(transactionAction)
);
router.get(
  '/transaction-details/:userId',
  authentication,
  permission('transactions', 'get'),
  asyncHandler(getTransactionDetailsByUserId)
);
router.get(
  '/bet-limit',
  authentication,
  permission('transactions', 'get'),
  asyncHandler(getBetLimitations)
);
router.get(
  '/bet-limit/:id',
  authentication,
  permission('transactions', 'getById'),
  asyncHandler(getBetLimitById)
);
router.post(
  '/bet-limit',
  authentication,
  permission('transactions', 'create'),
  asyncHandler(addBetLimit)
);
router.patch(
  '/bet-limit/:id',
  authentication,
  permission('transactions', 'update'),
  asyncHandler(updateBetLimit)
);
router.delete(
  '/bet-limit/:id',
  authentication,
  permission('transactions', 'delete'),
  asyncHandler(deleteBetLimit)
);
router.get('/landing-page', landingPage);

export default router;
