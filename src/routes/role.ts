import express from 'express';
import {
  addRole,
  deleteRole,
  getRoles,
  updateRole
} from '../controllers/roleController.ts';
import { authentication } from '../middleware/authentication.ts';
import { permission } from '../middleware/permission.ts';

const router = express.Router();

router.get('/roles', authentication, permission('roles', 'get'), getRoles);
router.post('/role', authentication, permission('roles', 'create'), addRole);
router.put(
  '/role/:roleId',
  authentication,
  permission('roles', 'update'),
  updateRole
);
router.delete(
  '/role/:roleId',
  authentication,
  permission('roles', 'delete'),
  deleteRole
);

export default router;
