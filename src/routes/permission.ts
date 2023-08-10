import express from 'express';
import {
  createPermission,
  deletePermission,
  getAllPermission,
  getPermissionById,
  updatePermission
} from '../controllers/permissionController.ts';

const router = express.Router();
router.get('/list', getAllPermission);
router.get('/detail/:id', getPermissionById);
router.post('/create', createPermission);
router.put('/update/:id', updatePermission);
router.delete('/delete/:id', deletePermission);

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
