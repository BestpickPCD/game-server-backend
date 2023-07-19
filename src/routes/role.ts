import {
  addRole,
  deleteRole,
  getRoles,
  updateRole,
} from "../controllers/roleController.ts";
import express from "express";
const router = express.Router();

router.get("/roles", getRoles);
router.post("/role", addRole);
router.put("/role/:roleId", updateRole);
router.delete("/role/:roleId", deleteRole);

export default router;
