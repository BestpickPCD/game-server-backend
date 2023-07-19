import {
  addCurrency,
  deleteCurrency,
  getCurrencies,
  updateCurrency,
} from "../controllers/currencyController.ts";
import express from "express";
const router = express.Router();

router.get("/currencies", getCurrencies);
router.post("/currency", addCurrency);
router.put("/currency/:currencyId", updateCurrency);
router.delete("/currency/:currencyId", deleteCurrency);

export default router;
