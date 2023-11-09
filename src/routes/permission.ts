import express from 'express';
import {
  getPermission,
  updatePermission
} from '../controllers/permissionController.ts';
import { permission } from '../middleware/permission.ts';
import { authentication } from '../middleware/authentication.ts';
import { asyncHandler } from '../utilities/helpers/asyncHandler.ts';
const router = express.Router();

router.use(authentication);
router.get('', permission('permissions', 'get'), asyncHandler(getPermission));
router.put(
  '',
  permission('permissions', 'update'),
  asyncHandler(updatePermission)
);
export default router;
