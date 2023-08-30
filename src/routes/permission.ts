import express from 'express';
import {
  getPermission,
  updatePermission
} from '../controllers/permissionController.ts';
import { permission } from '../middleware/permission.ts';
import { authentication } from '../middleware/authentication.ts';

const router = express.Router();
router.get('', authentication, permission('permissions', 'get'), getPermission);
router.put(
  '',
  authentication,
  permission('permissions', 'update'),
  updatePermission
);
export default router;
