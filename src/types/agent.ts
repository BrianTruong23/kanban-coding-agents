export interface CodingAgent {
  id: string;
  name: string;
  description?: string;
  avatar?: string;
  avatarColor?: string; // For colored avatar circles
  createdAt: number;
}
