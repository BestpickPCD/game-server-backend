import {
  gameLaunchLink,
  gameContract,
  getGameContractByAgentId,
  getGameUrl,
  getGamesByPlayerId,
  gameList,
  openGame,
  updateVendor
} from '../controllers/gameController/index.ts';
import express from 'express';
import { authentication } from '../middleware/authentication.ts';
import { permission } from '../middleware/permission.ts';

const router = express.Router();

router.get(
  '/game-list',
  authentication,
  permission('games', 'get'),
  gameList
);
router.post('/game/open', authentication, openGame);
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
router.get(
  '/games',
  authentication,
  permission('games', 'get'),
  getGamesByPlayerId
);
router.put(
  '/games/vendors/:id',
  authentication,
  permission('games', 'update'),
  updateVendor
);
export default router;
