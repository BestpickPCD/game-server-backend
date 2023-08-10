import express from 'express';
import {
  gameLaunchLink,
  getGameUrl,
  getGameVendors
} from '../controllers/gameController/index.ts';
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
  '/game-launch-link',
  authentication,
  permission('games', 'get'),
  gameLaunchLink
);
router.get(
  '/game-game-url',
  authentication,
  permission('games', 'get'),
  getGameUrl
);

export default router;
