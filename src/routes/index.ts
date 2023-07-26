import express from 'express';
import currencyRouter from './currency.js';
import roleRouter from './role.js';
import userRouter from './user.js';
import transactionRouter from './transaction.js';
import agentRouter from './agent.js';

const router = express.Router();

router.use('', currencyRouter);
router.use('', roleRouter);
router.use('', userRouter);
router.use('', transactionRouter);
router.use('/agents', agentRouter);

export default router;
