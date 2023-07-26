import express from 'express';
import {
  getAllAgents,
  getAgentById,
  createAgent,
  updateAgent,
  deleteAgent
} from '../controllers/agentController.ts';

const router = express.Router();

router.get('', getAllAgents);
router.get('/:id', getAgentById);
router.post('', createAgent);
router.put('/:id', updateAgent);
router.delete('/:id', deleteAgent);

export default router;
