// Task Breakdown Types for Automated Issue Processing

export type TaskType = 'epic' | 'ticket' | 'subtask';
export type RiskLevel = 'low' | 'medium' | 'high' | 'critical';
export type SkillCategory = 'frontend' | 'backend' | 'database' | 'devops' | 'mobile' | 'testing' | 'design' | 'ai-ml';

// Epic represents a large body of work
export interface Epic {
  id: string;
  userId: string;
  title: string;
  description: string;
  objectives: string[];
  acceptanceCriteria: string[];
  riskLevel: RiskLevel;
  riskNotes?: string;
  estimatedEffort: number; // in hours
  status: 'planning' | 'in-progress' | 'review' | 'done';
  createdAt: number;
  updatedAt: number;
}

// Ticket represents a medium-sized piece of work
export interface Ticket {
  id: string;
  epicId?: string;
  userId: string;
  ticketId: string; // Display ID like "TKT-1"
  title: string;
  description: string;
  definitionOfDone: string[];
  testNotes: string[];
  technicalNotes?: string;
  riskLevel: RiskLevel;
  riskFlags: string[];
  assignedAgentId?: string;
  estimatedEffort: number; // in hours
  actualEffort?: number; // in hours
  priority: 1 | 2 | 3 | 4 | 5;
  requiredSkills: SkillCategory[];
  status: 'backlog' | 'in-progress' | 'review' | 'done';
  tags: string[];
  createdAt: number;
  updatedAt: number;
}

// Subtask represents a small unit of work
export interface Subtask {
  id: string;
  ticketId: string;
  userId: string;
  title: string;
  description?: string;
  assignedAgentId?: string;
  estimatedEffort: number; // in hours
  actualEffort?: number;
  completed: boolean;
  createdAt: number;
  updatedAt: number;
}

// Task Dependency for visualizing relationships
export interface TaskDependency {
  id: string;
  userId: string;
  sourceId: string;
  sourceType: TaskType;
  targetId: string;
  targetType: TaskType;
  dependencyType: 'blocks' | 'blocked-by' | 'relates-to';
  createdAt: number;
}

// Agent Skills for matching tasks to agents
export interface AgentSkill {
  id: string;
  agentId: string;
  userId: string;
  skillCategory: SkillCategory;
  proficiencyLevel: 1 | 2 | 3 | 4 | 5; // 1 = Beginner, 5 = Expert
  createdAt: number;
  updatedAt: number;
}

// Agent Performance Metrics
export interface AgentPerformance {
  id: string;
  agentId: string;
  userId: string;
  tasksCompleted: number;
  averageCompletionTime: number; // in hours
  qualityScore: number; // 0-100
  onTimeDelivery: number; // percentage
  lastUpdated: number;
}

// Task Breakdown Request (for AI processing)
export interface BreakdownRequest {
  source: 'issue' | 'prd' | 'screenshot' | 'text';
  content: string;
  imageUrl?: string; // For screenshot analysis
  context?: string;
}

// Task Breakdown Result
export interface BreakdownResult {
  epics: Epic[];
  tickets: Ticket[];
  subtasks: Subtask[];
  dependencies: TaskDependency[];
  suggestions: {
    agentAssignments: Array<{
      taskId: string;
      taskType: TaskType;
      recommendedAgentId: string;
      reason: string;
      confidence: number;
    }>;
    riskMitigation: Array<{
      taskId: string;
      risk: string;
      mitigation: string;
    }>;
  };
}
