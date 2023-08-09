import {
  getGameVendors,
  gameLaunchLink,
  getGameUrl
} from '../controllers/gameController/index.ts';
import express from 'express';
import { authentication } from "../middleware/authentication.ts";

const router = express.Router();

router.get('/game-list', authentication, getGameVendors);
router.get('/game-launch-link', gameLaunchLink);
router.get('/game-game-url', getGameUrl);

export default router;
