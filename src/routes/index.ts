import express from 'express';
import currencyRouter from './currency.js';
import roleRouter from './role.js';
import userRouter from './user.js';
import transactionRouter from './transaction.js';

const router = express.Router();

// routes/sample.js (Example route file)

/**
 * @swagger
 * tags:
 *   name: Sample
 *   description: Sample API endpoints
 */

/**
 * @swagger
 * /api/sample:
 *   get:
 *     summary: Get a sample message
 *     tags: [Sample]
 *     responses:
 *       200:
 *         description: Success
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 */

router.use('', currencyRouter);
router.use('', roleRouter);
router.use('', userRouter);
router.use('', transactionRouter);

export default router;
