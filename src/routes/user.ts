import express from 'express';
import {
  getUserById,
  getAllUsersByAgentId,
  getAllUsers,
  deleteUser,
  updateUser
} from '../controllers/userController/index.ts';
import { authentication } from '../middleware/authentication.ts';

const router = express.Router();

router.get('/users', authentication, getAllUsers);
router.get('/users-by-agent', authentication, getAllUsersByAgentId);
router.get('/user/:userId', authentication, getUserById);
router.put('/user/:userId', authentication, updateUser);
router.delete('/user/:userId', authentication, deleteUser);

export default router;
