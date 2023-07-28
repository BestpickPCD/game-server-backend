export interface Agent {
  id: number;
  level?: number | null;
  currencyId?: number | null;
  parentAgentId?: number | null;
  parentAgentIds?: any; // Assuming you want to use JSON data
  rate?: number | null | any;
  isActive?: boolean | null;
  parentAgent?: Agent | null;
  // childAgents: Agent[];
  // users: AgentUser[];
  createdAt: Date | string;
  updatedAt: Date | string;
  deletedAt: Date | string | null;
}
