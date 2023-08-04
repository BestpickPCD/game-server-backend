import { Users, Roles, Agents, Transactions } from '@prisma/client';
import { Request } from 'express';

export interface RequestWithUser extends Request {
  user?: Users | null;
  transaction?: Transactions | null;
}

export interface UserAll extends Users {
  role?: Roles | null;
  agent?: Agents | null;
}

export interface TransactionAll extends Transactions {
  role?: Roles | null;
  agent?: Agents | null;
}
