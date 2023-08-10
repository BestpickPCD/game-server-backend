import express from 'express';
import {
  createPermission,
  deletePermission,
  getAllPermission,
  getPermissionById,
  updatePermission
} from '../controllers/permissionController.ts';
import { permission } from '../middleware/permission.ts';
import { authentication } from '../middleware/authentication.ts';

const router = express.Router();
router.get('', authentication, getAllPermission);
router.get(
  '/:id',
  authentication,
  permission('permissions', 'getById'),
  getPermissionById
);
router.post(
  '',
  authentication,
  permission('permissions', 'create'),
  createPermission
);
router.put(
  '/:id',
  authentication,
  permission('permissions', 'update'),
  updatePermission
);
router.delete(
  '/:id',
  authentication,
  permission('permissions', 'delete'),
  deletePermission
);

export default router;

// const permissions = [
//   {
//     admin: []
//   }
// ];

// function superDigit(n: number, k: number): number {
//   let sum = 0;
//   let string = '';
//   for (let i = 0; i < k; i++) {
//     string += String(n);
//   }
//   const split = string.split('');
//   if (split.length < 1) {
//     return split.reduce((acc, cur) => acc + Number(cur), 0);
//   }
//   console.log(split);

//   for (let i = 0; i < split.length - 1; i++) {
//     let sumInside = 0;
//     do {
//       sumInside += Number(split[i]) + Number(split[i + 1]);
//       sum += sumInside;
//     } while (sum > 9);
//   }
//   return sum;
// }
// console.log(superDigit(14, 3));
