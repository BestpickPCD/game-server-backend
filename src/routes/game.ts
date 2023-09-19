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
import { permission } from '../middleware/permission.ts';

const router = express.Router();

router.get(
  '/game-list',
  authentication,
  permission('games', 'get'),
  getGameVendors
);
router.get(
  '/game-list-test',
  authentication,
  permission('games', 'get'),
  getGameVendors
);
router.get(
  '/game-vendors',
  authentication,
  permission('games', 'get'),
  getVendors
);
router.get(
  '/game-contract/:agentId',
  authentication,
  permission('games', 'getById'),
  getGameContractByAgentId
);
router.post(
  '/game-contract',
  authentication,
  permission('games', 'create'),
  gameContract
);
router.get('/game-launch-link', permission('games', 'get'), gameLaunchLink);
router.get('/game-game-url', permission('games', 'get'), getGameUrl);

export default router;
