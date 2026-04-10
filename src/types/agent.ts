export interface CodingAgent {
  id: string;
  name: string;
  slug?: string;
  description?: string;
  avatar?: string;
  avatarColor?: string; // For colored avatar circles
  agentType?: 'manual' | 'external';
  transport?: 'web' | 'telegram' | 'http';
  runtimeLocation?: string;
  telegramBot?: string;
  status?: 'offline' | 'online' | 'idle' | 'busy';
  apiKeyPreview?: string;
  lastSeenAt?: number;
  metadata?: Record<string, unknown>;
  createdAt: number;
}
