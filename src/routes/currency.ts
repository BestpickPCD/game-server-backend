import express from 'express';
import {
  addCurrency,
  deleteCurrency,
  getCurrencies,
  getCurrencyById,
  updateCurrency
} from '../controllers/currencyController.ts';
import { authentication } from '../middleware/authentication.ts';
import { permission } from '../middleware/permission.ts';
import { asyncHandler } from '../utilities/helpers/asyncHandler.ts';

const router = express.Router();

router.get('/currencies', asyncHandler(getCurrencies));

router.get(
  '/currency/:currencyId',
  authentication,
  permission('currencies', 'getById'),
  asyncHandler(getCurrencyById)
);
router.post(
  '/currency',
  authentication,
  permission('currencies', 'create'),
  asyncHandler(addCurrency)
);
router.put(
  '/currency/:currencyId',
  authentication,
  permission('currencies', 'update'),
  asyncHandler(updateCurrency)
);
router.delete(
  '/currency/:currencyId',
  authentication,
  permission('currencies', 'delete'),
  asyncHandler(deleteCurrency)
);

export default router;
