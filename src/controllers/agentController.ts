import { NextFunction, Request, Response } from 'express';
import Redis, { removeRedisKeys } from '../config/redis/index.ts';
import {
  deleteAgent as deleteAgentService,
  getAll,
  getById,
  update
} from '../services/agentsService.ts';
import { message } from '../utilities/constants/index.ts';
interface AgentParams {
  page?: number;
  size?: number;
  search?: string;
  level?: number;
  dateFrom?: string;
  dateTo?: string;
  id?: number;
}

const getUserId = (req: Request) =>
  Number((req as any).user.id || (req as any).user[0].id);

const defaultKey = 'agents';

const removedKey = (req: Request | number) => {
  if (typeof req === 'number') {
    return `${defaultKey}:${req}`;
  }
  return `${defaultKey}:${getUserId(req)}`;
};

export const getAllAgents = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<any> => {
  try {
    const {
      page = 0,
      size = 10,
      search = '',
      level,
      dateFrom,
      dateTo
    }: AgentParams = req.query;
    const id = getUserId(req);
    const redisKey = `${defaultKey}:${id}:${id}:${page}:${size}:${search}:${level}:${dateFrom}:${dateTo}`;
    const redisData = await Redis.get(redisKey);
    if (!redisData) {
      if (!Number(page) || !Number(size)) {
        throw Error('Invalid page or size');
      }
      const { users, totalItems } = await getAll({
        id: Number(id),
        level: Number(null),
        page: Number(page),
        size: Number(size),
        search,
        dateFrom,
        dateTo
      });
      const response = {
        data: {
          data: users,
          page: Number(page),
          size: Number(size),
          totalItems
        },
        message: message.SUCCESS
      };
      await Redis.setex(redisKey, 300, JSON.stringify(response));
      return res.status(200).json(response);
    }
    return res.status(200).json({ ...JSON.parse(redisData) });
  } catch (error) {
    return next(error);
  }
};

export const getAgentById = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const { id } = req.params;
    if (!id || !Number(id)) {
      throw Error('Invalid Id');
    }
    const userId = getUserId(req);
    const redisKey = `${defaultKey}:${userId}:${id}`;
    const redisData = await Redis.get(redisKey);
    if (!redisData) {
      const agent = await getById({
        id: Number(id),
        userId
      });
      await Redis.setex(
        redisKey,
        300,
        JSON.stringify({ data: agent, message: message.SUCCESS })
      );
      return res.status(200).json({ data: agent, message: message.SUCCESS });
    }
    return res.status(200).json({ ...JSON.parse(redisData) });
  } catch (error) {
    return next(error);
  }
};

export const updateAgent = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<any> => {
  try {
    const { id } = req.params;
    const { parentAgentId, currencyId, name, roleId } = req.body;

    const agentId = Number(id);

    const updatedAgent = await update({
      agentId,
      parentAgentId,
      currencyId,
      roleId,
      name
    });

    await removeRedisKeys(removedKey(req));
    await removeRedisKeys(removedKey(Number(id)));
    return res.status(200).json({
      data: {
        id: updatedAgent.id,
        level: updatedAgent.level,
        parentAgentIds: updatedAgent.parentAgentIds,
        name
      },
      message: message.UPDATED
    });
  } catch (error) {
    return next(error);
  }
};

export const deleteAgent = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<any> => {
  try {
    const { id } = req.params;
    const { id: userId } = (req as any).user.id;
    if (!Number(id)) {
      throw Error('Invalid Agent Id');
    }
    await deleteAgentService(Number(id), Number(userId));
    await removeRedisKeys(removedKey(req));
    await removeRedisKeys(removedKey(Number(id)));
    return res.status(200).json({ message: message.DELETED });
  } catch (error) {
    return next(error);
  }
};

// export const getUsersByAgentId = async (
//   req: Request,
//   res: Response,
//   next: NextFunction
// ): Promise<any> => {
//   try {
//     const agentId = parseInt(req.params.id);
//     if (!agentId && Number(agentId)) {
//       return res
//         .status(400)
//         .json({ message: message.INVALID, subMessage: 'Invalid Id' });
//     }
//     const users = await prisma.players.findMany({
//       where: { agentId },
//       include: {
//         user: {
//           select: {
//             name: true,
//             email: true,
//             username: true,
//             currency: {
//               select: {
//                 name: true
//               }
//             },
//             role: {
//               select: {
//                 name: true,
//                 permissions: true
//               }
//             }
//           }
//         }
//       }
//     });

//     const usersList = users.map((userEntry) => {
//       const {
//         user: {
//           name,
//           email,
//           username,
//           currency: { name: currencyName },
//           role: { name: roleName, permissions }
//         }
//       } = userEntry as any;
//       return { name, email, username, currencyName, roleName, permissions };
//     });

//     return res.status(200).json(usersList);
//   } catch (error) {
//     return next(error);
//   }
// };

// let levelString = '';
// if (level) {
//   levelString = `AND ah.level = ${Number(level)}`;
// }
// let dayBetween = '';
// dayBetween = `AND ah.updatedAt BETWEEN '${dateFrom}' AND '${dateTo}'`;
// const agents = await prisma.$queryRawUnsafe(
//   `
//   WITH RECURSIVE AgentHierarchy AS (
//     SELECT id, name, username, level, parentAgentId, createdAt, updatedAt
//     FROM Agents
//     WHERE id = ${parentAgentId}
//     UNION ALL
//     SELECT a.id, a.name, a.username, a.level, a.parentAgentId, a.createdAt, a.updatedAt
//     FROM Agents a
//     JOIN AgentHierarchy h ON a.parentAgentId = h.id
//   )
//   SELECT * FROM AgentHierarchy ah
//   WHERE (ah.username LIKE "%${search}%" OR ah.name LIKE "%${search}%")
//   ${levelString}
//   ${dayBetween}
//   LIMIT ${Number(size)}
//   OFFSET ${Number(size) * Number(page)};
// `
// );
