import express from 'express';
import {
  getUserById,
  getAllUsers,
  deleteUser,
  updateUser,
  register,
  login
} from '../controllers/userController.ts';
import { authentication } from '../middleware/authentication.ts';
import { permission } from '../middleware/permission.ts';

/**
 * @swagger
 * /login:
 *   post:
 *     summary: Login
 *     tags: [Users]
 *     requestBody:
 *       description: User data to be created
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               username:
 *                 type: string
 *               password:
 *                 type: string
 *             required:
 *               - username
 *               - password
 *     responses:
 *       200:
 *         description: Success
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 token:
 *                   type: string
 *                 refreshToken:
 *                   type: string
 *       404:
 *         description: NOT_FOUND
 *       500:
 *         description: Internal server error
 *
 * /users:
 *   get:
 *     security:             # <--- ADD THIS IF WE WANT TO CALL API WITH HEADER
 *      - bearerAuth: []     # <--- ADD THIS IF WE WANT TO CALL API WITH HEADER
 *     summary: Get users based on query parameters
 *     tags: [Users]
 *     description: Get users based on query parameters.
 *     parameters:
 *       - in: query
 *         name: page
 *         required: false
 *         schema:
 *           type: number
 *       - in: query
 *         name: size
 *         required: false
 *         schema:
 *           type: number
 *       - in: query
 *         name: search
 *         required: false
 *         schema:
 *           type: string
 *       - in: query
 *         name: dateFrom
 *         required: false
 *         schema:
 *           type: string
 *       - in: query
 *         name: dateTo
 *         required: false
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Success
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 data:
 *                   type: object
 *                   properties:
 *                     data:
 *                       type: array
 *                       items:
 *                         type: object
 *                 page:
 *                   type: number
 *                 limit:
 *                   type: number
 *       500:
 *         description: Internal server error

 */

const router = express.Router();

router.get('/users', authentication, getAllUsers);
router.get('/user/:userId', getUserById);
router.put(
  '/user/:userId',
  authentication,
  permission('admin') as any,
  updateUser
);
router.delete(
  '/user/:userId',
  authentication,
  permission('admin') as any,
  deleteUser
);
router.post('/register', register);
router.post('/login', login);

export default router;
