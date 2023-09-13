import {
  Prisma,
  PrismaClient,
  Transactions
} from '../../config/prisma/generated/base-default/index.js';
import { balanceSummary } from 'src/models/customInterfaces';
const prisma = new PrismaClient();

export const checkTransferAbility = async (
  senderUsername: string,
  receiverUsername: string
): Promise<any> => {

  let result = false;  
  const reveiver = (await prisma.$queryRawUnsafe(` SELECT Users.username FROM 
    ( SELECT Users.username, Agents.parentAgentId AS agentId FROM Users JOIN Agents ON Agents.id = Users.id WHERE Users.type = "agent" AND Users.username = "${receiverUsername}"
      UNION
      SELECT Users.username, Players.agentId FROM Users JOIN Players ON Players.id = Users.id WHERE Users.type = "player" AND Users.username = "${receiverUsername}"
    ) AS Agent
    JOIN Users ON Users.id = Agent.agentId
  `)) as any; 
  
  if (reveiver[0]?.username === senderUsername) {
    result = true;
  }
  return result;
};

export const arrangeTransactionDetails = async (
  transactions: Transactions[],
  userId: number
): Promise<any> => {
  let balance = 0;
  const receive = {
    from: {
      agent: 0,
      win: 0
    },
    total: 0
  };
  const lose = {
    from: {
      transfer: 0,
      bet: 0,
      charge: 0
    },
    total: 0
  };

  const details = transactions.map((transaction: any) => {
    const data: any = {};
    const {
      id,
      type,
      amount,
      status,
      createdAt,
      updatedUser,
      sender,
      receiver,
      gameId
    } = transaction;

    data.id = id;
    data.type = type;
    data.status = status;
    data.createdAt = createdAt;
    data.refererId = updatedUser;
    data.before = 0;

    if (sender?.id == userId && sender?.type == 'agent') {
      data.user = {
        id: sender.id,
        name: sender.username,
        type: sender.type
      };

      if (transaction.type == 'add') {
        data.amount = -parseFloat(amount);
        data.action = 'adds to';
        data.receiver = {
          id: receiver.id,
          name: receiver.username,
          type: receiver.type
        };
        // agent transfer -> money out
        lose.from.transfer += data.amount;
      }

      if (data.amount >= 0) {
        receive.total += data.amount;
      } else {
        lose.total += data.amount;
      }
    } else if (receiver?.id == userId && receiver?.type == 'agent') {
      data.user = {
        id: receiver.id,
        name: receiver.username,
        type: receiver.type
      };

      if (transaction.type == 'add') {
        data.amount = parseFloat(amount);
        data.action = 'received from';
        data.sender = {
          id: sender.id,
          name: sender.username,
          type: sender.type
        };
        // Agent receives from agent -> money in
        receive.from.agent += data.amount;
      }

      if (data.amount >= 0) {
        receive.total += data.amount;
      } else {
        lose.total += data.amount;
      }
    } else if (
      receiver?.id == userId &&
      receiver?.type == 'player' &&
      sender?.type == 'agent'
    ) {
      data.user = {
        id: receiver.id,
        name: receiver.username,
        type: receiver.type
      };

      if (transaction.type == 'add') {
        data.amount = parseFloat(amount);
        data.action = 'received from';
        data.sender = {
          id: sender.id,
          name: sender.username,
          type: sender.type
        };
        // user recieves from agent -> money in
        receive.from.agent += data.amount;
      }

      if (data.amount >= 0) {
        receive.total += data.amount;
      } else {
        lose.total += data.amount;
      }
    } else if (
      receiver?.id == userId &&
      receiver?.type == 'player' &&
      gameId != null
    ) {
      data.user = {
        id: receiver.id,
        name: receiver.username,
        type: receiver.type
      };

      if (transaction.type == 'win') {
        data.amount = parseFloat(amount);
        data.action = 'wins on';
        data.details = {
          game: {
            id: gameId,
            type: 'baccarat',
            round: 0,
            title: 'Speed Baccarat J',
            vendor: 'evolution'
          }
        };
        // player wins from game -> money in
        receive.from.win += data.amount;
      } else if (transaction?.type == 'charge' || transaction?.type == 'lose') {
        // LOSE
        data.amount = -parseFloat(amount);
        data.action = 'lost and charged from';
        data.details = {
          game: {
            id: gameId,
            type: 'baccarat',
            round: 0,
            title: 'Speed Baccarat J',
            vendor: 'evolution'
          }
        };
        // player gets charged when lose from game -> money out
        lose.from.charge += data.amount;
      }

      if (data.amount >= 0) {
        receive.total += data.amount;
      } else {
        lose.total += data.amount;
      }
    } else if (
      sender?.id == userId &&
      sender?.type == 'player' &&
      gameId != null
    ) {
      data.user = {
        id: sender.id,
        name: sender.username,
        type: sender.type
      };

      if (transaction.type == 'bet') {
        data.amount = -parseFloat(amount);
        data.action = 'bets on';
        data.details = {
          game: {
            id: gameId,
            type: 'baccarat',
            round: 0,
            title: 'Speed Baccarat J',
            vendor: 'evolution'
          }
        };
        // player bets on a game -> money out
        lose.from.bet += data.amount;
      }

      if (data.amount >= 0) {
        receive.total += data.amount;
      } else {
        lose.total += data.amount;
      }
    } else {
      data.error = { message: 'error' };
    }
    balance += data.amount;
    return data;
  }) as any;

  return { details, receive, lose, balance };
};

export const arrangeTransactions = async (
  transactions: Transactions[]
): Promise<any> => {
  const details = transactions.map((transaction: any) => {
    const data: any = {};
    const {
      id,
      type,
      amount,
      status,
      createdAt,
      updatedUser,
      sender,
      receiver,
      gameId
    } = transaction;

    data.id = id;
    data.type = type;
    data.status = status;
    data.createdAt = createdAt;
    data.refererId = updatedUser;
    data.before = 0;
    data.amount = parseFloat(amount);
    if (type == 'bet' || type == 'win' || type == 'charge' || type == 'lose') {
      data.from = {
        id: sender ? sender.id : receiver.id,
        name: sender ? sender.username : receiver.username,
        type: sender ? sender.type : receiver.type
      };
      data.to = {
        id: gameId ? gameId : '',
        title: 'Speed Baccarat J',
        type: 'baccarat',
        round: 0,
        vendor: 'evolution'
      };
    } else {
      data.from = {
        id: sender ? sender.id : '',
        name: sender ? sender.username : '',
        type: sender ? sender.type : ''
      };
      data.to = {
        id: receiver ? receiver.id : '',
        name: receiver ? receiver.username : '',
        type: receiver ? receiver.type : ''
      };
    }
    return data;
  }) as any;

  return details;
};

export const getBalances = async (userUsername: string): Promise<any> => {
  try {
    const rawQuery = Prisma.sql`
      SELECT
        IFNULL(sender.out, 0) AS \`out\`,
        IFNULL(receiver.in, 0) AS \`in\`,
        IFNULL(gameResult.gameOut, 0) AS gameOut,
        IFNULL((IFNULL(receiver.in, 0) - IFNULL(sender.out, 0) - IFNULL(gameResult.gameOut, 0)), 0) AS balance
      FROM Users
      LEFT JOIN (
        SELECT SUM(IFNULL(amount, 0)) AS \`out\`, senderId AS id
        FROM Transactions
        WHERE TYPE IN ('add', 'lose', 'charge', 'bet') AND senderId = ${userUsername ?? 1}
        GROUP BY senderId
      ) AS sender ON sender.id = Users.id
      LEFT JOIN (
        SELECT SUM(IFNULL(amount, 0)) AS \`in\`, receiverId AS id
        FROM Transactions
        WHERE TYPE IN ('add', 'win') AND receiverId = ${userUsername ?? 1}
        GROUP BY receiverId
      ) AS receiver ON receiver.id = Users.id
      LEFT JOIN (
        SELECT SUM(IFNULL(amount, 0)) AS gameOut, receiverId AS id
        FROM Transactions
        WHERE TYPE IN ('lose', 'charge') AND receiverId = ${userUsername ?? 1}
        GROUP BY receiverId
      ) AS gameResult ON gameResult.id = Users.id
      WHERE Users.id = ${userUsername ?? 1};`;

    return (await prisma.$queryRaw(rawQuery)) as balanceSummary;
  } catch (error) {
    console.log(error);
  }
};

export const paramsToArray = async (params: string): Promise<any> => {
  const array = params.split(',');
  const formattedParams = `('${array.join("','")}')`;
  return formattedParams;
};

export const updateBalance = async (userUsername: string): Promise<any> => {
  try {
    const balances = await getBalances(userUsername);
    const { balance } = balances[0];

    const result = await prisma.users.update({
      data: {
        balance
      },
      where: {
        username: userUsername
      }
    });

    return result;
  } catch (error) {
    console.log(error);
  }
};
