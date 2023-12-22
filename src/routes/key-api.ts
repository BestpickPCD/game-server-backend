import express from 'express'; 
import { gameList, openGame } from '../controllers/gameController/index.ts';
import { keyApi } from '../middleware/authentication.ts';
import { getVendors } from '../controllers/vendorController/index.ts';
import { register } from '../controllers/authenticationController/index.ts';
import { addTransaction } from '../controllers/transactionController/index.ts';

const router = express.Router();

router.get(
    '/game-list',
    keyApi, 
    gameList
);
router.get(
    '/game-launch-link',
    keyApi, 
    openGame
);
router.get(
    '/game-vendors',
    keyApi, 
    getVendors
);
router.post(
    '/user/create',
    keyApi, 
    register
);
router.post(
    '/user/add-balance',
    keyApi, 
    addTransaction
);




export default router;