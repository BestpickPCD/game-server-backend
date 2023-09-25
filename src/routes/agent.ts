import express from 'express';
import {
  deleteAgent,
  getAgentById,
  getAllAgents,
  updateAgent
  // getUsersByAgentId,
  // createAgent,
} from '../controllers/agentController.ts';
import { authentication } from '../middleware/authentication.ts';
import { permission } from '../middleware/permission.ts';
import { asyncHandler } from '../utilities/helpers/asyncHandler.ts';
const router = express.Router();

router.get(
  '',
  authentication,
  permission('agents', 'get'),
  asyncHandler(getAllAgents)
);
router.get(
  '/:id',
  authentication,
  permission('agents', 'getById'),
  asyncHandler(getAgentById)
);
router.put('/:id', permission('agents', 'update'), asyncHandler(updateAgent));
router.delete(
  '/:id',
  permission('agents', 'delete'),
  asyncHandler(deleteAgent)
);

export default router;
