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

const router = express.Router();

router.get('/currencies', getCurrencies);
router.get(
  '/currency/:currencyId',
  authentication,
  permission('currencies', 'getById'),
  getCurrencyById
);
router.post(
  '/currency',
  authentication,
  permission('currencies', 'create'),

  addCurrency
);
router.put(
  '/currency/:currencyId',
  authentication,
  permission('currencies', 'update'),
  updateCurrency
);
router.delete(
  '/currency/:currencyId',
  authentication,
  permission('currencies', 'delete'),
  deleteCurrency
);

export default router;
