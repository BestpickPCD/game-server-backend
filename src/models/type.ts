import { Response } from 'express';
export interface Agent {
  id: number;
  username: string;
  password: string;
  name: string;
  level?: number | null;
  currencyId?: number | null;
  parentAgentId?: number | null;
  parentAgentIds?: any; // Assuming you want to use JSON data
  rate?: number | null | any;
  isActive?: boolean | null;
  parentAgent?: Agent | null;
  // childAgents: Agent[];
  // users: AgentUser[];
  createdAt: Date;
  updatedAt: Date;
  deletedAt?: Date | null;
}

export interface Pagination<T> {
  data: T[];
  page: number;
  size: number;
  totalItems: number;
}

export interface ResponsePagination<T> {
  data: Pagination<T>;
  message?: string;
  subMessage?: string;
}

export interface ResponseWithoutPagination<T> {
  data: T;
  message?: string;
  subMessage?: string;
}

export interface AsyncResponse<T> extends Response {
  data?: T;
  message?: string;
  subMessage?: string;
}
