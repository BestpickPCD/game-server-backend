import {
  PrismaClient
} from '../../config/prisma/generated/base-default/index.js';
import { balanceSummary } from 'src/models/customInterfaces';
const prisma = new PrismaClient();
import { PrismaClient as PrismaClientTransaction } from '../../config/prisma/generated/transactions/index.js';
const prismaTransaction = new PrismaClientTransaction();

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



export const arrangeTransactions = async (
  transactions: any
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

    const sender = await prismaTransaction.transactions.aggregate({
      where: {
        senderUsername: userUsername,
        type: { in: ['add', 'lose', 'charge', 'bet'] }, // Adjust types as needed
      },
      _sum: { amount: true },
    });

    const receiver = await prismaTransaction.transactions.aggregate({
      where: {
        receiverUsername: userUsername,
        type: { in: ['add', 'win'] }, // Adjust types as needed
      },
      _sum: { amount: true },
    });

    const gameResult = await prismaTransaction.transactions.aggregate({
      where: {
        receiverUsername: userUsername,
        type: { in: ['lose', 'charge'] }, // Adjust types as needed
      },
      _sum: { amount: true },
    });

    const balance = {
      out: sender._sum?.amount || 0,
      in: receiver._sum?.amount || 0,
      gameOut: gameResult._sum?.amount || 0,
      balance: (receiver._sum?.amount || 0) - (sender._sum?.amount || 0) - (gameResult._sum?.amount || 0),
    } as balanceSummary;

    return balance;
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
    const { balance } = balances;

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
