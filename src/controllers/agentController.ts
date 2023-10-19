import { NextFunction, Request, Response } from 'express';
import Redis, { removeRedisKeys } from '../config/redis/index.ts';
import {
  deleteAgent as deleteAgentService,
  getAll,
  getById,
  update
} from '../services/agentsService.ts';
import { DELETED, OK, UPDATED } from '../core/success.response.ts';
import { BAD_REQUEST } from '../core/error.response.ts';
interface AgentParams {
  page?: number;
  size?: number;
  search?: string;
  level?: number;
  dateFrom?: string;
  dateTo?: string;
  id?: number;
}

const message = {
  GET_ALL: 'Get all agents success',
  GET_BY_ID: 'Get agent success',
  CREATED: 'Create agent success',
  UPDATED: 'Update agent success',
  DELETED: 'Delete agent success',
  INVALID_ID: 'Invalid Agent Id'
};

const getUserId = (req: Request): string =>
  (req as any).user.id || (req as any).user[0].id;

export const getAllAgents = async (req: Request, res: Response) => {
  const {
    page = 0,
    size = 10,
    search = '',
    level,
    dateFrom,
    dateTo
  }: AgentParams = req.query;
  const id = getUserId(req);

  const { users, totalItems } = await getAll({
    id,
    level: Number(level),
    page: Number(page),
    size: Number(size),
    search,
    dateFrom,
    dateTo
  });
  const data = {
    data: users,
    page: Number(page),
    size: Number(size),
    totalItems
  };
  return new OK({ data, message: message.GET_ALL }).send(res);
};

export const getAgentById = async (req: Request, res: Response) => {
  const { id } = req.params;
  if (!id) {
    throw new BAD_REQUEST(message.INVALID_ID);
  }
  const userId = getUserId(req);
  const agent = await getById({
    id,
    userId
  });
  const data = agent;
  return new OK({ data, message: message.GET_BY_ID }).send(res);
};

export const updateAgent = async (req: Request, res: Response) => {
  const agentId = req.params.id;
  const { parentAgentId, currencyId, name, roleId, rate } = req.body;

  const updatedAgent = await update({
    agentId,
    parentAgentId,
    currencyId,
    roleId,
    rate,
    name
  });

  return new UPDATED({
    data: updatedAgent,
    message: message.UPDATED
  }).send(res);
};

export const deleteAgent = async (req: Request, res: Response) => {
  const id = req.params.id;
  const userId = (req as any).user.id as string;
  if (!id) {
    throw new BAD_REQUEST(message.INVALID_ID);
  }
  await deleteAgentService(id, userId);

  return new DELETED({ message: message.DELETED }).send(res);
};
