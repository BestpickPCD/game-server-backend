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

const router = express.Router();

router.get('/roles', authentication, permission('roles', 'get'), getRoles);
router.get(
  '/roles/:id',
  authentication,
  permission('roles', 'get'),
  getRolesById
);
router.post('/roles', authentication, permission('roles', 'create'), addRole);
router.put(
  '/roles/:roleId',
  authentication,
  permission('roles', 'update'),
  updateRole
);
router.delete(
  '/roles/:roleId',
  authentication,
  permission('roles', 'delete'),
  deleteRole
);

export default router;
