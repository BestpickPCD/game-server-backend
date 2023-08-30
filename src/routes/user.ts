import express from 'express';
import {
  getUserById,
  // getAllUsers,
  deleteUser,
  updateUser,
  getAllUsersWithBalances,
  getDashboard
} from '../controllers/userController/index.ts';
import { authentication } from '../middleware/authentication.ts';

const router = express.Router();

// router.get('/users', authentication, getAllUsers);
router.get('/users', authentication, getAllUsersWithBalances);
router.get('/dashboard', authentication, getDashboard);
router.get('/user/:userId', authentication, getUserById);
router.put('/user/:userId', authentication, updateUser);
router.delete('/user/:userId', authentication, deleteUser);

export default router;
