import express, { Request, Response } from 'express';
import { authentication } from '../middleware/authentication.ts';
import { permission } from '../middleware/permission.ts';
import { addVendor, getVendors, updateVendor, getVendorList, addVendorAgent, removeVendorAgent, updateVendorAgent } from '../controllers/vendorController/index.ts';
import multer from 'multer';

const router = express.Router();

const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        cb(null, 'public/logos/vendors/');
    },
    filename: (req, file, cb) => {
        const fileName = `${req.body.name}.png`;
        cb(null, fileName);
    },
});

const upload = multer({ storage });

router.get(
    '/game-vendors',
    authentication,
    permission('games', 'get'),
    getVendors
);

router.get(
    '/vendors',
    authentication,
    permission('games', 'get'),
    getVendorList
)

router.post(
    '/vendor',
    authentication,
    upload.single('img'),
    addVendor
);

router.patch(
    '/vendor/:vendorId',
    authentication,
    upload.single('img'),
    updateVendor
);

router.post(
    '/agent-vendor',
    authentication,
    addVendorAgent
);

router.patch(
    '/agent-vendor/:id',
    authentication,
    updateVendorAgent
)

router.delete(
    '/agent-vendor/:id',
    authentication,
    removeVendorAgent
)

export default router;