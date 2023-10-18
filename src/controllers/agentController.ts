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

const getUserId = (req: Request) =>
  Number((req as any).user.id || (req as any).user[0].id);

const defaultKey = 'agents';

const removedKey = (req: Request | number) => {
  if (typeof req === 'number') {
    return `${defaultKey}:${req}`;
  }
  return `${defaultKey}:${getUserId(req)}`;
};

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
  // const redisKey = `${defaultKey}:${id}:${id}:${page}:${size}:${search}:${level}:${dateFrom}:${dateTo}`;
  // let data: any;
  // const redisData = await Redis.get(redisKey);
  // if (!redisData) {
    const { users, totalItems } = await getAll({
      id: Number(id),
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
  //   await Redis.setex(redisKey, 300, JSON.stringify(data));
  // } else {
  //   data = { ...JSON.parse(redisData) };
  // }
  return new OK({ data, message: message.GET_ALL }).send(res);
};

export const getAgentById = async (req: Request, res: Response) => {
  const { id } = req.params;
  if (!id || !Number(id)) {
    throw new BAD_REQUEST(message.INVALID_ID);
  }
  const userId = getUserId(req);
  // const redisKey = `${defaultKey}:${userId}:${id}`;
  // let data: any;
  // const redisData = await Redis.get(redisKey);
  // if (!redisData) {
    const agent = await getById({
      id: Number(id),
      userId
    });
    const data = agent;
  //   await Redis.setex(redisKey, 300, JSON.stringify({ data: agent }));
  // } else {
  //   data = { ...JSON.parse(redisData) };
  // }
  return new OK({ data, message: message.GET_BY_ID }).send(res);
};

export const updateAgent = async (req: Request, res: Response) => {
  const agentId = Number(req.params.id);
  const { parentAgentId, currencyId, name, roleId, rate } = req.body;

  const updatedAgent = await update({
    agentId,
    parentAgentId,
    currencyId,
    roleId,
    rate,
    name
  });

  // await removeRedisKeys(removedKey(req));
  // await removeRedisKeys(removedKey(agentId));
  return new UPDATED({
    data: {
      id: updatedAgent.id,
      rate,
      details: updatedAgent,
      name
    },
    message: message.UPDATED
  }).send(res);
};

export const deleteAgent = async (req: Request, res: Response) => {
  const id = Number(req.params.id);
  const userId = Number((req as any).user.id);
  if (!id) {
    throw new BAD_REQUEST(message.INVALID_ID);
  }
  await deleteAgentService(id, userId);
  // await removeRedisKeys(removedKey(req));
  // await removeRedisKeys(removedKey(id));
  return new DELETED({ message: message.DELETED }).send(res);
};
 