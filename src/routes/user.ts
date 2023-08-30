import express from 'express';
import {
  getUserById,
  // getAllUsers,
  deleteUser,
  updateUser,
  getAllUsersWithBalances
} from '../controllers/userController/index.ts';
import { authentication } from '../middleware/authentication.ts';
import { permission } from '../middleware/permission.ts';

const router = express.Router();

router.get(
  '/users',
  authentication,
  permission('players', 'get'),
  getAllUsersWithBalances
);
router.get('/user/:userId', authentication, getUserById);
router.put('/user/:userId', authentication, updateUser);
router.delete('/user/:userId', authentication, deleteUser);

export default router;
