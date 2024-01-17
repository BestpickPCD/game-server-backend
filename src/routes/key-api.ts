import express from 'express';
import { gameList, openGame } from '../controllers/gameController/index.ts';
import { keyApi } from '../middleware/authentication.ts';
import { getVendors } from '../controllers/vendorController/index.ts';
import { register } from '../controllers/authenticationController/index.ts';
import {
  addTransaction,
  getTransactions,
  getBalanceByApiKey,
  getBettingList
} from '../controllers/transactionController/index.ts';
import { verifyUser } from '../controllers/userController/index.ts';

const router = express.Router();

router.post('/user/verify', verifyUser); 

router.get('/game-list', keyApi, gameList);
router.get('/game-vendors', keyApi, getVendors);
router.get('/transactions', keyApi, getTransactions);
router.get('/betting-list', keyApi, getBettingList);
router.post('/game-launch-link', keyApi, openGame);
router.post('/user/create', keyApi, register);
router.post('/user/add-balance', keyApi, addTransaction);
router.post('/balance', keyApi, getBalanceByApiKey);

export default router;
