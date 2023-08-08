import {
  addRole,
  deleteRole,
  getRoles,
  updateRole
} from '../controllers/roleController.ts';
import express from 'express';
import { authentication } from '../middleware/authentication.ts';
import { permission } from '../middleware/permission.ts';

const router = express.Router();

router.get('/roles', getRoles);
router.post('/role', authentication, permission('admin') as any, addRole);
router.put(
  '/role/:roleId',
  authentication,
  permission('admin') as any,
  updateRole
);
router.delete(
  '/role/:roleId',
  authentication,
  permission('admin') as any,
  deleteRole
);

export default router;
