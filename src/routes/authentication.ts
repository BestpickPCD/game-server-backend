import express from 'express';
import {
  apiToken,
  login,
  refreshToken,
  register
} from '../controllers/authenticationController/index.ts';
import { authentication } from '../middleware/authentication.ts';

const router = express.Router();

router.get('/get-refresh-token', authentication, refreshToken);
router.post('/get-api-key', authentication, apiToken);
router.post('/register', register);
router.post('/login', login);

export default router;
