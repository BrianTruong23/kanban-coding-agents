export type TaskType = 'epic' | 'ticket' | 'subtask';
export type RiskLevel = 'low' | 'medium' | 'high' | 'critical';

export interface TaskDependency {
  id: string;
  fromTaskId: string; // Task that depends on another
  toTaskId: string;   // Task that is depended upon
  type: 'blocks' | 'requires' | 'relates-to';
  createdAt: number;
}

export interface DefinitionOfDone {
  id: string;
  criteria: string;
  completed: boolean;
}

export interface TestNote {
  id: string;
  description: string;
  type: 'unit' | 'integration' | 'e2e' | 'manual' | 'performance';
  priority: number;
}

export interface RiskFlag {
  id: string;
  description: string;
  level: RiskLevel;
  mitigation?: string;
  status: 'open' | 'mitigated' | 'accepted';
}

export interface TaskBreakdown {
  id: string;
  userId: string;
  parentTaskId?: string; // For hierarchical structure
  taskType: TaskType;
  title: string;
  description: string;
  definitionOfDone: DefinitionOfDone[];
  testNotes: TestNote[];
  riskFlags: RiskFlag[];
  estimatedHours?: number;
  actualHours?: number;
  skillsRequired: string[];
  suggestedAgentId?: string;
  createdAt: number;
  updatedAt: number;
}

export interface BreakdownInput {
  type: 'issue' | 'prd' | 'screenshot' | 'text';
  content: string;
  imageUrl?: string; // For screenshot type
  context?: string; // Additional context
}

export interface BreakdownResult {
  epics: TaskBreakdown[];
  tickets: TaskBreakdown[];
  subtasks: TaskBreakdown[];
  dependencies: TaskDependency[];
  summary: string;
}

export interface AgentSkill {
  id: string;
  agentId: string;
  skill: string;
  proficiency: 1 | 2 | 3 | 4 | 5; // 1=beginner, 5=expert
  yearsExperience?: number;
}

export interface AgentPerformance {
  id: string;
  agentId: string;
  tasksCompleted: number;
  tasksOnTime: number;
  averageCompletionTime: number; // in hours
  qualityScore: number; // 0-100
  lastUpdated: number;
}

export interface AgentAvailability {
  agentId: string;
  currentLoad: number; // Current number of assigned tasks
  capacity: number; // Maximum concurrent tasks
  isAvailable: boolean;
}
