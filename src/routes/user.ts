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
  checkUser,
  getAllSums
} from '../controllers/userController/index.ts';
import { authentication } from '../middleware/authentication.ts';
import { permission } from '../middleware/permission.ts';

const router = express.Router();

// GET
router.get(
  '/users',
  authentication,
  permission('players', 'get'),
  getAllUsersWithBalances
);
router.get('/dashboard', authentication, getDashboard);
router.get('/user/:userIds', authentication, getUserById);
router.get('/user-affiliated-agents', authentication, getAllAffiliatedAgents);
router.get('/user/balances/:userIds', authentication, getAllSums);
// POST
router.post('/user/check-user', authentication, checkUser);
// UPDATE
router.put('/blockUser', authentication, blockUser);
router.patch('/user/:userId', authentication, updateUser);
router.patch('/user', authentication, updatePassword);
// DELETE
router.delete('/user/:userId', authentication, deleteUser);
export default router;
