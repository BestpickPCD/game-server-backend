import { PrismaClient } from '@prisma/client';
import {
  arrangeTransactionDetails,
  paramsToArray
} from '../controllers/transactionController/utilities.ts';
const prisma = new PrismaClient();

export const getAllById = async (queryParams: any, id: number) => {
  try {
    const {
      page = 0,
      size = 10,
      dateFrom,
      dateTo,
      userId,
      type,
      gameId,
      search
    } = queryParams;
    const paramArray = !type ? '' : await paramsToArray(type as string);
    const normalSelect = `
          SELECT DISTINCT transactions.*, senderUser.name as senderUser, receiverUser.name as receiverUser
          `;
    const countSelect = `
          SELECT COUNT(DISTINCT transactions.id) as count
          `;
    const filter: any = `
             senderId IN (
              SELECT id
              FROM Agents
              WHERE JSON_CONTAINS(parentAgentIds, JSON_ARRAY(${Number(id)}))) 
                OR receiverId IN (
                  SELECT id
                  FROM Agents
                  WHERE JSON_CONTAINS(parentAgentIds, JSON_ARRAY(${Number(id)}))
                )
                OR senderId IN (
                  SELECT id
                  FROM Players
                  WHERE agentId = ${Number(id)}
                OR agentId IN (
                  SELECT u.id
                  FROM Users u
                  JOIN Agents a ON u.id = a.id
                  WHERE JSON_CONTAINS(a.parentAgentIds, JSON_ARRAY(${Number(
                    id
                  )}))))
                OR receiverId IN (
                SELECT id
                FROM Players
                WHERE agentId = ${Number(id)}
                OR agentId IN (
                    SELECT u.id
                    FROM Users u
                    JOIN Agents a ON u.id = a.id
                    WHERE JSON_CONTAINS(a.parentAgentIds, JSON_ARRAY(${Number(
                      id
                    )}))
                )
            ) `;
    const pageSize = `
            order By id
            LIMIT ${Number(size || 10)} 
            OFFSET ${Number(size ?? 10) * Number(page || 0)}
          `;
    const query = `
            FROM Transactions transactions
            JOIN (
              SELECT id
              FROM Users
              WHERE id = ${Number(userId ?? id)}
              OR id IN (
                  SELECT id
                  FROM Agents agents
                  WHERE JSON_CONTAINS(parentAgentIds, JSON_ARRAY(${Number(
                    userId ?? id
                  )}))
              )
              OR id IN (
                SELECT id
                FROM Players player
                WHERE agentId = ${Number(userId ?? id)}
                OR agentId IN (
                    SELECT u.id
                    FROM Users u
                    JOIN Agents a ON u.id = a.id
                    WHERE JSON_CONTAINS(a.parentAgentIds, JSON_ARRAY(${Number(
                      userId ?? id
                    )}))
                )
              )
            ) filtered_users 
            ON transactions.senderId = filtered_users.id OR transactions.receiverId = filtered_users.id
            JOIN Users senderUser ON senderUser.id = transactions.senderId
            JOIN Users receiverUser ON receiverUser.id = transactions.receiverId
            WHERE ${
              search
                ? `((senderUser.name LIKE '%${search}%') OR (receiverUser.name LIKE '%${search}%')) AND`
                : ''
            } 
            ((transactions.updatedAt >= '${
              dateFrom || '1970-01-01T00:00:00.000Z'
            }') 
            AND (transactions.updatedAt <= '${
              dateTo || '2100-01-01T00:00:00.000Z'
            }'))
            ${
              paramArray ? `AND transactions.type in ${String(paramArray)}` : ''
            }
            ${userId ? ` AND ${filter}` : ''}
            ${gameId ? ` AND ${gameId}` : ''}
          `;

    const [transactions, [{ count }]]: any = await prisma.$transaction([
      prisma.$queryRawUnsafe(`${normalSelect} ${query} ${pageSize}`),
      prisma.$queryRawUnsafe(`${countSelect} ${query}`)
    ]);
    return { transactions, count: parseInt(count), page, size };
  } catch (error) {
    console.log(error);
    throw Error(error);
  }
};

export const getByIdWithType = async (userId: number, arrayTypes: string[]) => {
  try {
    const transactions = (await prisma.transactions.findMany({
      where: {
        OR: [{ senderId: userId }, { receiverId: userId }],
        type: {
          in: arrayTypes
        }
      },
      orderBy: {
        createdAt: 'asc'
      },
      select: {
        receiver: {
          select: {
            id: true,
            username: true,
            type: true
          }
        },
        sender: {
          select: {
            id: true,
            username: true,
            type: true
          }
        },
        updatedUser: {
          select: {
            id: true,
            username: true,
            type: true
          }
        },
        id: true,
        amount: true,
        gameId: true,
        type: true,
        note: true,
        status: true,
        createdAt: true
      }
    })) as any;
    const userDetails = await arrangeTransactionDetails(transactions, userId);

    return userDetails;
  } catch (error) {
    console.log(error);
    throw Error(error);
  }
};

export const getDetailsById = async (id: number, userId: number) => {
  try {
    //* check userId of transaction is in senderId or receiverId to avoid exceptions
    const filterOr = {
      OR: [
        {
          parentAgentIds: { array_contains: [userId] }
        },
        {
          id: userId
        },
        {
          agentId: Number(userId)
        }
      ]
    };
    const transaction = await prisma.transactions.findUnique({
      select: {
        id: true,
        amount: true,
        token: true,
        receiverId: true,
        senderId: true,
        note: true,
        type: true,
        status: true,
        updatedAt: true,
        createdAt: true,
        currencyId: true,
        receiver: {
          select: {
            name: true
          }
        },
        sender: {
          select: {
            name: true
          }
        }
      },
      where: {
        id: Number(id),
        OR: [{ sender: filterOr }, { receiver: filterOr }]
      }
    });
    return transaction;
  } catch (error) {
    console.log(error);
    throw Error(error);
  }
};
