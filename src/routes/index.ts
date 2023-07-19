import express from "express";
import currencyRouter from "./currency.js";
import roleRouter from "./role.js";
import userRouter from "./user.js";

const router = express.Router();

router.use("", currencyRouter);
router.use("", roleRouter);
router.use("", userRouter);

export default router;
