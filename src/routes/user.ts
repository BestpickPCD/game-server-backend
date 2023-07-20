import express from "express";
import {
  getAllUsers,
  deleteUser,
  updateUser,
  register,
  login,
} from "../controllers/userController.ts";
import { authentication } from "../middleware/authentication.ts";
import { permission } from "../middleware/permission.ts";

const router = express.Router();

router.get("/users", authentication, getAllUsers);
router.put("/user/:userId", authentication, permission('admin') as any, updateUser);
router.delete("/user/:userId", authentication, permission('admin') as any, deleteUser);
router.post("/register", register);
router.post("/login", login);

export default router;
