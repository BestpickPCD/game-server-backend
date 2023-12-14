import express, { Request, Response } from 'express';
import { authentication } from '../middleware/authentication.ts';
import { permission } from '../middleware/permission.ts';
import {
  addVendor,
  getVendors,
  updateVendor,
  getVendorList,
  addVendorAgent,
  removeVendorAgent,
  updateVendorAgent,
  getVendorById
} from '../controllers/vendorController/index.ts';
import multer from 'multer';
import { asyncHandler } from '../utilities/helpers/asyncHandler.ts';

const router = express.Router();

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, 'public/logos/vendors/');
  },
  filename: (req, file, cb) => {
    const fileName = `${req.body.name}.png`;
    cb(null, fileName);
  }
});

const upload = multer({ storage });

router.get(
  '/game-vendors',
  authentication,
  permission('games', 'get'),
  asyncHandler(getVendors)
);

router.get(
  '/vendors',
  authentication,
  permission('games', 'get'),
  asyncHandler(getVendorList)
);

router.get(
  '/vendor/:id',
  authentication,
  permission('games', 'getById'),
  asyncHandler(getVendorById)
);

router.post(
  '/vendor',
  authentication,
  upload.single('img'),
  asyncHandler(addVendor)
);

router.patch(
  '/vendor/:vendorId',
  authentication,
  upload.single('img'),
  asyncHandler(updateVendor)
);

router.post('/agent-vendor', authentication, asyncHandler(addVendorAgent));

router.patch(
  '/agent-vendor/:id',
  authentication,
  asyncHandler(updateVendorAgent)
);

router.delete(
  '/agent-vendor/:id',
  authentication,
  asyncHandler(removeVendorAgent)
);

export default router;
