import express from 'express';
import {
  getUserById,
  // getAllUsers,
  deleteUser,
  updateUser,
  getAllUsersWithBalances,
  getDashboard,
  getAllAffiliatedAgents,
  blockUser,
  updatePassword,
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
router.get('/user-affiliated-agents', authentication, getAllAffiliatedAgents);
router.put('/user/:userId', authentication, updateUser);
router.delete('/user/:userId', authentication, deleteUser);
router.put('/blockUser', authentication, blockUser);
router.patch('/user', authentication, updatePassword);
router.get('/dashboard', authentication, getDashboard);

export default router;
