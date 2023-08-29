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
const router = express.Router();

router.get('', authentication, permission('agents', 'get'), getAllAgents);
router.get(
  '/:id',
  authentication,
  permission('agents', 'getById'),
  getAgentById
);
router.put('/:id', permission('agents', 'update'), updateAgent);
router.delete('/:id', permission('agents', 'delete'), deleteAgent);
// router.post('', createAgent);
// router.get('/:id/users', permission('roles', 'get'), getUsersByAgentId);

export default router;
