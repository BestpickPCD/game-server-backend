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

export const permissions: Permissions = {
  admin: {
    users: [...commonPermissions],
    permissions: [...commonPermissions],
    agents: [...commonPermissions],
    roles: [...commonPermissions],
    transactions: [...commonPermissions],
    players: [...commonPermissions],
    currencies: [...commonPermissions],
    games: [...commonPermissions]
  },
  distributor: {
    users: ['get', 'getById'],
    permissions: ['get', 'getById'],
    agents: ['get', 'getById'],
    roles: ['get', 'getById'],
    transactions: [...commonPermissions],
    players: ['get', 'getById'],
    currencies: ['get', 'getById'],
    games: ['get', 'getById']
  },
  operator: {
    users: ['get', 'getById'],
    permissions: ['get', 'getById'],
    agents: ['get', 'getById'],
    roles: ['get', 'getById'],
    transactions: ['get', 'getById'],
    players: ['get', 'getById'],
    currencies: ['get', 'getById'],
    games: ['get', 'getById']
  }
};

export const defaultPermission = {
  users: [...commonPermissions],
  permissions: [...commonPermissions],
  agents: [...commonPermissions],
  roles: [...commonPermissions],
  transactions: [...commonPermissions],
  players: [...commonPermissions],
  currencies: [...commonPermissions],
  games: [...commonPermissions]
};
