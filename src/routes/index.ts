import express from 'express';
import { authentication } from '../middleware/authentication.ts';
import agentRouter from './agent.js';
import authenticationRouter from './authentication.ts';
import currencyRouter from './currency.js';
import gameRouter from './game.ts';
import permissionRouter from './permission.ts';
import roleRouter from './role.js';
import transactionRouter from './transaction.js';
import userRouter from './user.js';
import vendorRouter from './vendor.js';
import keyApiRouter from './key-api.ts'

const router = express.Router();

router.use('', authenticationRouter);
router.use('/api', keyApiRouter)

router.use('', currencyRouter);
router.use('', userRouter);
router.use('', transactionRouter);
router.use('', gameRouter);
router.use('', vendorRouter);
router.use('/agents', authentication, agentRouter);

router.use('/roles', roleRouter);
router.use('/permissions', permissionRouter);

export default router;
