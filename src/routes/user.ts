import express from "express";
import {
  getAllUsers,
  deleteUser,
  updateUser,
  register,
  login,
} from "../controllers/userController.ts";
const router = express.Router();

router.get("/users", getAllUsers);
router.put("/user/:userId", updateUser);
router.delete("/user/:userId", deleteUser);
router.post("/register", register);
router.post("/login", login);

export default router;
