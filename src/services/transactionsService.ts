import {
  Prisma,
  PrismaClient as PrismaClientTransaction,
  Transactions
} from '../config/prisma/generated/transactions/index.js';
const prismaTransaction = new PrismaClientTransaction();
import {
  PrismaClient,
  Users
} from '../config/prisma/generated/base-default/index.js';

const prisma = new PrismaClient();

export const getAllById = async (queryParams: any, userId: string | null) => {
  try {
    const {
      page = 1,
      size = 10,
      dateFrom,
      dateTo,
      type,
      status
      // search
    } = queryParams;

    const filter: any = {
      OR: [
        {
          agentId: userId
        },
        {
          userId
        }
      ]
    };

    if (dateFrom) {
      filter.createdAt = { gte: new Date(dateFrom) };
    }
    if (dateTo) {
      filter.createdAt = { ...filter.createdAt, lte: new Date(dateTo) };
    }
    if (type) {
      filter.type = { in: type.split(',') };
    }
    if (status) {
      filter.status = status;
    }

    const  transactions = await prismaTransaction.transactions.findMany({
        where: filter,
        skip: page * size,
        take: Number(size),
        orderBy: {
          createdAt: 'desc'
        }
      }) as Transactions[];

    const count = await prismaTransaction.transactions.count({
      where: filter
    });

    return { transactions, count, page, size };
  } catch (error: any) {
    throw Error(error);
  }
};

export const getBettingList = async (queryParams: any, userId: string | null) => {
  try { 
    const {
      page = 1,
      size = 10,
      dateFrom,
      dateTo,
      status
    } = queryParams;

    const filter: any = {
      OR: [
        {
          agentId: userId
        },
        {
          userId
        }
      ]
    };
    filter.type = { in: ['bet', 'win'] };
    if (dateFrom) {
      filter.createdAt = { gte: new Date(dateFrom) };
    }
    if (dateTo) {
      filter.createdAt = { ...filter.createdAt, lte: new Date(dateTo) };
    } 
    if (status) {
      filter.status = status;
    }

    const transactions = await prismaTransaction.transactions.findMany({
      where: filter,
      orderBy: {
        createdAt: 'desc'
      }
    }) as Transactions[];

    interface GroupedTransaction {
      roundId: string;
      details: any;
      betAmount: number;
      totalAmount: number;
      createdAt: Date;
      transactions: any[];
    }
    
    const groupedTransactions = transactions.reduce((acc: Record<string, GroupedTransaction>, transaction) => {
      const roundId = transaction.roundId;
      const details = transaction.details;
      const createdAt = transaction.createdAt;
      if (!roundId) {
        return acc;
      }
    
      if (!acc[roundId]) {
        acc[roundId] = {
          roundId: roundId,
          details,
          betAmount: 0,
          totalAmount: 0,
          createdAt,
          transactions: [],
        };
      } 
      if(transaction.type === "bet") { 
        acc[roundId].betAmount += transaction.amount
      }
      acc[roundId].totalAmount += transaction.amount;
      acc[roundId].transactions.push(transaction);
    
      return acc;
    }, {});

    const pageStart = Math.max(((page > 0 ? page : 1) - 1) * size, 0);
    const bettingTransactions = Object.values(groupedTransactions); // make obj -> array
    const pageEnd = Math.min((page > 0 ? page : 1) * size, bettingTransactions.length);
    const betList = bettingTransactions.slice(pageStart, pageEnd).sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()); // .sort to rearrange dates
  
    return { betList, count:  bettingTransactions.length, page, size };
    
  } catch (error: any) {
    throw Error(error);
  }
}

export const create = async (data: any) => {
  try {
    const transcation = await prismaTransaction.transactions.create({ data });

    return transcation;
  } catch (error: any) {
    throw Error(error);
  }
};

export const getByIdWithType = async (
  userId: string,
  params: {
    dateFrom: string;
    dateTo: string;
    status: string;
    type: string[];
    page: number;
    size: number;
  }
) => {
  try {
    const filter: Prisma.TransactionsFindManyArgs = {
      where: {
        OR: [{ agentId: userId }, { userId: userId }],
        updatedAt: {
          gte: params?.dateFrom || '1970-01-01T00:00:00.000Z',
          lte: params?.dateTo || '2100-01-01T00:00:00.000Z'
        },
        ...(params?.status && { status: params.status }),
        ...((params?.type.length as number) > 0 && {
          type: {
            in: params?.type
          }
        })
      }
    };

    const [transactions, countTransactions] =
      await prismaTransaction.$transaction([
        prismaTransaction.transactions.findMany({
          where: { ...filter.where },
          orderBy: {
            updatedAt: 'desc'
          },
          skip: params.page * params.size,
          take: params.size,
          select: {
            id: true,
            agentId: true,
            agentUsername: true,
            userId: true,
            username: true,
            amount: true,
            roundId: true,
            details: true,
            type: true,
            status: true,
            createdAt: true
          }
        }),
        prismaTransaction.transactions.count({ where: filter.where })
      ]);

    return { transactions, countTransactions };
  } catch (error: any) {
    throw Error(error);
  }
};

export const getDetailsById = async (id: string, userId: string) => {
  try {
    let agentName;
    const transaction = await prismaTransaction.transactions.findUnique({
      select: {
        id: true,
        amount: true,
        token: true,
        agentId: true,
        agentUsername: true,
        userId: true,
        username: true,
        type: true,
        status: true,
        updatedAt: true,
        createdAt: true,
        currencyCode: true
      },
      where: {
        id
      }
    });

    if (transaction?.agentId) {
      const { name } = (await prisma.users.findUnique({
        where: {
          id: transaction?.agentId
        }
      })) as Users;
      agentName = name ?? null;
    }

    return { agentName, ...transaction };
  } catch (error: any) {
    throw Error(error);
  }
};
