import express from 'express';
import {
  deleteAgent,
  getAgentById,
  getAllAgents,
  getUsersByAgentId,
  // createAgent,
  updateAgent
} from '../controllers/agentController.ts';
import { authentication } from '../middleware/authentication.ts';
import { permission } from '../middleware/permission.ts';

const router = express.Router();

router.get('', authentication, permission('roles', 'get'), getAllAgents);
router.get(
  '/:id',
  authentication,
  permission('transactions', 'get'),
  getAgentById
);
// router.post('', createAgent);
router.put('/:id', permission('roles', 'update'), updateAgent);
router.delete('/:id', permission('roles', 'delete'), deleteAgent);
router.get('/:id/users', permission('roles', 'get'), getUsersByAgentId);

export default router;
