import express from 'express';
import {
  getPermission,
  getAllPermission
} from '../controllers/permissionController.ts';
import { permission } from '../middleware/permission.ts';
import { authentication } from '../middleware/authentication.ts';

const router = express.Router();
router.get('', authentication, permission('permissions', 'get'), getPermission);
router.get('/get-all', getAllPermission);
export default router;
