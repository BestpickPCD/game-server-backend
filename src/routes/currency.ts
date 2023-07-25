import {
  addCurrency,
  deleteCurrency,
  getCurrencies,
  updateCurrency,
  getCurrencyById,
} from "../controllers/currencyController.ts";
import express from "express";
import { authentication } from "../middleware/authentication.ts";
import { permission } from "../middleware/permission.ts";

const router = express.Router();
 
router.get("/currencies", getCurrencies);
router.get("/currency/:currencyId", getCurrencyById);
router.post("/currency", authentication, permission('admin') as any, addCurrency);
router.put("/currency/:currencyId", authentication, permission('admin') as any, updateCurrency);
router.delete("/currency/:currencyId", authentication, permission('admin') as any, deleteCurrency);

export default router;
