import { PrismaClient } from '../../config/prisma/generated/base-default/index.js';
const prisma = new PrismaClient();
import { PrismaClient as PrismaClientTransaction } from '../../config/prisma/generated/transactions/index.js';
import { BAD_REQUEST } from '../../core/error.response.js';
import { message } from '../../utilities/constants/index.js';
const prismaTransaction = new PrismaClientTransaction();

export const checkTransferAbility = async (
  senderId: string,
  receiverId: string
): Promise<any> => {
  let result = false;
  const { parentAgentId } = await prisma.users.findUnique({
    where: {
      id: receiverId
    },
    select: {
      parentAgentId: true
    }
  }) as {parentAgentId: string}

  if (parentAgentId === senderId) {
    result = true;
  }
  return result;
};

export const updateBalance = async (userId: string, amount: number, type: string, agentId: string | null, method: string) => {
  try {

    let userUpdate: any
    let agentUpdate: any

    if(['bet', 'win', 'cancel'].includes(type)) {
      userUpdate = {
          where: {
            id: userId
          },
          data: {
            balance: {
              increment: amount
            }
          }
        }

      if( agentId && method === "seamless" ) {
        agentUpdate = {
          where: {
            id: agentId
          },
          data: {
            balance: {
              increment: amount
            }
          }
        }
      }

    } else if (['deposit','withdraw','user.add_balance'].includes(type)) {

      // if deposit amount has to be < 0 || withdraw amount > 0 || user.add_balance is the same as deposit < 0 happens when agents add_balance to users from backoffice

      userUpdate = {
        where: {
          id: userId
        },
        data: {
          balance: {
            increment: amount
          }
        }
      }

      if( agentId ) {
        agentUpdate = {
          where: {
            id: agentId
          },
          data: {
            balance: {
              increment: -(amount)
            }
          }
        }
      }

    } else if (['agent.add_balance'].includes(type)) {
      agentUpdate = {
        where: {
          id: userId
        },
        data: {
          balance: {
            increment: amount
          }
        }
      }
    }

    if (agentUpdate) {
      agentUpdate = await prisma.users.update(agentUpdate)
      agentUpdate.success = true
    } 
    if (userUpdate) {
      userUpdate = await prisma.users.update(userUpdate)
      userUpdate.success = true
    } 

    return { balance: userUpdate ? userUpdate.balance : agentUpdate.balance }

  } catch (error) {
    throw new BAD_REQUEST(message.FAILED);
  }
}

export const getBalances = async (userUsername: string): Promise<any> => {
  try {
    const sender = await prismaTransaction.transactions.aggregate({
      where: {
        userId: userUsername,
        type: { in: ['add', 'lose', 'charge', 'bet'] } // Adjust types as needed
      },
      _sum: { amount: true }
    });

    const receiver = await prismaTransaction.transactions.aggregate({
      where: {
        agentId: userUsername,
        type: { in: ['add', 'win'] } // Adjust types as needed
      },
      _sum: { amount: true }
    });

    const gameResult = await prismaTransaction.transactions.aggregate({
      where: {
        userId: userUsername,
        type: { in: ['lose', 'charge'] } // Adjust types as needed
      },
      _sum: { amount: true }
    });

    const balance = {
      out: sender._sum?.amount || 0,
      in: receiver._sum?.amount || 0,
      gameOut: gameResult._sum?.amount || 0,
      balance:
        (receiver._sum?.amount || 0) -
        (sender._sum?.amount || 0) -
        (gameResult._sum?.amount || 0)
    } as any;

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

export const recalculateBalance = async (userUsername: string): Promise<any> => {
  try {
    // const balances = await getBalances(userUsername);
    const balances = await sumBalances(userUsername) ;
    const balance = (balances as any)[0]._sum.amount;

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

export const sumBalances = async (userUsername: string) => {
  try {
    const userIdSums = await prismaTransaction.transactions.groupBy({
      where: {
        userId: userUsername
      },
      by: ['userId'],
      _sum: {
        amount: true,
      },
    });
    return userIdSums
  } catch (error) {
    console.log(error)
  }
}