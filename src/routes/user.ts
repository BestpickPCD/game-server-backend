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

const router = express.Router();

router.get('/users', authentication, getAllUsers);
router.get('/user/:userId', authentication, getUserById);
router.put('/user/:userId', authentication, updateUser);
router.delete('/user/:userId', authentication, deleteUser);
router.post('/register', register);
router.post('/login', login);

export default router;
