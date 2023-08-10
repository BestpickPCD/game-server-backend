import { Users, Roles, Agents, Transactions } from '@prisma/client';
import { Request } from 'express';

export interface balanceSummary {
  out?: number | null;
  in?: number | null;
  gameOut?: number | null;
  balance?: number | null;
}

export interface balanceSummary {
  out?: number | null;
  in?: number | null;
  gameOut?: number | null;
  balance?: number | null;
}

export interface RequestWithUser extends Request {
  user?: Users | null;
  balanceSummary?: balanceSummary | null;
}

export interface UserAll extends Users {
  role?: Roles | null;
  agent?: Agents | null;
}

export interface TransactionAll extends Transactions {
  role?: Roles | null;
  agent?: Agents | null;
}

export type RouteType =
  | 'users'
  | 'permissions'
  | 'agents'
  | 'roles'
  | 'transactions'
  | 'players'
  | 'currencies'
  | 'games';
export type PermissionType = 'get' | 'getById' | 'update' | 'create' | 'delete';

export interface Permissions {
  admin: RolePermissions;
  distributor: RolePermissions;
  operator: RolePermissions;
}

export const commonPermissions: PermissionType[] = [
  'get',
  'getById',
  'update',
  'create',
  'delete'
];

export type RoleType = 'admin' | 'distributor' | 'operator';

export const roles: RoleType[] = ['admin', 'distributor', 'operator'];

export type RolePermissions = {
  [key in RouteType]: PermissionType[];
};
