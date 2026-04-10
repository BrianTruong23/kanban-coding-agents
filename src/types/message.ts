export interface AgentMessage {
  id: string;
  userId: string;
  fromAgentId?: string;
  toAgentId?: string;
  taskId?: string;
  body: string;
  channel: 'global' | 'direct' | 'task';
  createdBy: 'user' | 'agent' | 'system';
  metadata?: Record<string, unknown>;
  createdAt: number;
}
