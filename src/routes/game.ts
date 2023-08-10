import {
  getGameVendors,
  gameLaunchLink,
  gameContract,
  getGameContractByAgentId,
  getVendors,
  getGameUrl
} from '../controllers/gameController/index.ts';
import express from 'express';
import { authentication } from '../middleware/authentication.ts';

const router = express.Router();

router.get('/game-list', authentication, getGameVendors);
router.get('/game-vendors', authentication, getVendors);
router.get('/game-contract/:agentId', authentication, getGameContractByAgentId);
router.post('/game-contract', authentication, gameContract);
router.get('/game-launch-link', gameLaunchLink);
router.get('/game-game-url', getGameUrl);

export default router;
