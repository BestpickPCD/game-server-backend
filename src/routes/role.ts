import express from 'express';
import {
  addRole,
  deleteRole,
  getRoles,
  updateRole,
  getRolesById
} from '../controllers/roleController.ts';
import { authentication } from '../middleware/authentication.ts';
import { permission } from '../middleware/permission.ts';
import { asyncHandler } from '../utilities/helpers/asyncHandler.ts';

const router = express.Router();

router.use(authentication);
router.get('', permission('roles', 'get'), asyncHandler(getRoles));
router.get('/:id', permission('roles', 'get'), asyncHandler(getRolesById));
router.post('', permission('roles', 'create'), asyncHandler(addRole));
router.put('/:roleId', permission('roles', 'update'), asyncHandler(updateRole));
router.delete(
  '/:roleId',
  permission('roles', 'delete'),
  asyncHandler(deleteRole)
);

export default router;
