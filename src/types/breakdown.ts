export type TaskType = 'epic' | 'ticket' | 'subtask';
export type RiskLevel = 'low' | 'medium' | 'high' | 'critical';

export interface DefinitionOfDone {
  id: string;
  description: string;
  completed: boolean;
}

export interface TestNote {
  id: string;
  type: 'unit' | 'integration' | 'e2e' | 'manual';
  description: string;
  testCase?: string;
}

export interface RiskFlag {
  id: string;
  level: RiskLevel;
  description: string;
  mitigation?: string;
}

export interface TaskDependency {
  id: string;
  sourceTaskId: string; // Task that depends on another
  targetTaskId: string; // Task that must be completed first
  dependencyType: 'blocks' | 'relates-to' | 'duplicates';
  createdAt: number;
}

export interface Epic {
  id: string;
  epicId: string; // Display ID like "EPIC-1"
  title: string;
  description: string;
  status: 'planning' | 'in-progress' | 'review' | 'completed' | 'cancelled';
  priority: 1 | 2 | 3 | 4 | 5;
  sprint?: string;
  tags: string[];
  estimatedStoryPoints?: number;
  actualStoryPoints?: number;
  startDate?: number;
  endDate?: number;
  createdAt: number;
  updatedAt: number;
  userId: string;
}

export interface Ticket {
  id: string;
  ticketId: string; // Display ID like "TICKET-1"
  epicId?: string; // Parent epic if any
  title: string;
  description: string;
  taskType: TaskType;
  status: 'backlog' | 'in-progress' | 'review' | 'done' | 'blocked';
  priority: 1 | 2 | 3 | 4 | 5;
  sprint?: string;
  assignedAgentId?: string;
  tags: string[];
  estimatedHours?: number;
  actualHours?: number;
  definitionOfDone: DefinitionOfDone[];
  testNotes: TestNote[];
  riskFlags: RiskFlag[];
  createdAt: number;
  updatedAt: number;
  userId: string;
}

export interface Subtask {
  id: string;
  subtaskId: string; // Display ID like "SUB-1"
  parentTicketId: string; // Parent ticket
  title: string;
  description: string;
  status: 'todo' | 'in-progress' | 'done';
  assignedAgentId?: string;
  estimatedMinutes?: number;
  actualMinutes?: number;
  createdAt: number;
  updatedAt: number;
  userId: string;
}

// Input types for automated breakdown
export interface BreakdownInput {
  type: 'github-issue' | 'prd-text' | 'screenshot';
  content: string; // GitHub issue URL, PRD text, or base64 screenshot
  context?: string; // Additional context
}

export interface BreakdownResult {
  epic?: Epic;
  tickets: Ticket[];
  subtasks: Subtask[];
  dependencies: TaskDependency[];
  summary: string;
  aiConfidence: number; // 0-1 score
}

// Agent skill types
export interface AgentSkill {
  id: string;
  name: string;
  category: 'frontend' | 'backend' | 'database' | 'devops' | 'mobile' | 'testing' | 'design';
  proficiency: 1 | 2 | 3 | 4 | 5; // 1=beginner, 5=expert
}

export interface AgentPerformanceMetrics {
  agentId: string;
  tasksCompleted: number;
  tasksInProgress: number;
  averageCompletionTime: number; // in hours
  successRate: number; // 0-1
  lastActive: number;
  skillRatings: { [skillName: string]: number }; // skill name -> proficiency
}

// Extended agent with skills and performance
export interface ExtendedAgent {
  id: string;
  name: string;
  description?: string;
  avatar?: string;
  avatarColor?: string;
  skills: AgentSkill[];
  performance: AgentPerformanceMetrics;
  availability: 'available' | 'busy' | 'offline';
  currentLoad: number; // 0-100 percentage
  createdAt: number;
}
