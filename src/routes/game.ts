import {
  getGameVendors,
  gameLaunchLink,
  gameContract,
  getGameUrl
} from '../controllers/gameController/index.ts';
import express from 'express';
import { authentication } from '../middleware/authentication.ts';

const router = express.Router();

router.get('/game-list', authentication, getGameVendors);
router.post('/game-contract', authentication, gameContract);
router.get('/game-launch-link', gameLaunchLink);
router.get('/game-game-url', getGameUrl);

export default router;
