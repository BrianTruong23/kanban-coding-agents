// Task Breakdown and Orchestration Types

export type TaskType = 'epic' | 'ticket' | 'subtask';
export type RiskLevel = 'low' | 'medium' | 'high' | 'critical';
export type DependencyType = 'blocks' | 'blocked-by' | 'related-to';

export interface DefinitionOfDone {
  id: string;
  description: string;
  completed: boolean;
}

export interface TestNote {
  id: string;
  description: string;
  type: 'unit' | 'integration' | 'e2e' | 'manual';
  completed: boolean;
}

export interface RiskFlag {
  id: string;
  description: string;
  level: RiskLevel;
  mitigation?: string;
  resolved: boolean;
}

export interface TaskDependency {
  id: string;
  sourceTaskId: string; // The task that has the dependency
  targetTaskId: string; // The task it depends on
  type: DependencyType;
  createdAt: number;
}

export interface TaskBreakdown {
  taskId: string;
  type: TaskType;
  parentTaskId?: string; // For subtasks and tickets under epics
  childTaskIds: string[]; // For epics and tickets with subtasks
  definitionOfDone: DefinitionOfDone[];
  testNotes: TestNote[];
  riskFlags: RiskFlag[];
  estimatedHours?: number;
  actualHours?: number;
}

// Agent Skills and Performance

export type SkillLevel = 'beginner' | 'intermediate' | 'advanced' | 'expert';

export interface AgentSkill {
  id: string;
  agentId: string;
  skillName: string; // e.g., "React", "Node.js", "Database Design", "Testing"
  level: SkillLevel;
  yearsOfExperience?: number;
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

export interface AgentAssignment {
  id: string;
  taskId: string;
  agentId: string;
  assignedAt: number;
  startedAt?: number;
  completedAt?: number;
  estimatedHours?: number;
  actualHours?: number;
  autoAssigned: boolean; // Whether it was auto-assigned by the system
  matchScore?: number; // 0-100, how well the agent matches the task requirements
}

// Task Breakdown Input/Output

export interface BreakdownInput {
  type: 'issue' | 'prd' | 'screenshot' | 'text';
  content: string;
  imageUrl?: string; // For screenshot type
  context?: string; // Additional context
}

export interface BreakdownResult {
  epic: {
    title: string;
    description: string;
    priority: 1 | 2 | 3 | 4 | 5;
    tags: string[];
    estimatedHours: number;
  };
  tickets: Array<{
    title: string;
    description: string;
    priority: 1 | 2 | 3 | 4 | 5;
    tags: string[];
    estimatedHours: number;
    definitionOfDone: string[];
    testNotes: Array<{ description: string; type: 'unit' | 'integration' | 'e2e' | 'manual' }>;
    riskFlags: Array<{ description: string; level: RiskLevel; mitigation?: string }>;
    requiredSkills: string[]; // Skills needed for this ticket
    dependencies: Array<{ targetTicketIndex: number; type: DependencyType }>; // Dependencies within this breakdown
  }>;
  subtasks?: Array<{
    parentTicketIndex: number;
    title: string;
    description: string;
    estimatedHours: number;
    requiredSkills: string[];
  }>;
}

// Agent Roster Management

export interface AgentRosterFilter {
  skills?: string[];
  minQualityScore?: number;
  availability?: 'available' | 'busy' | 'all';
}

export interface AgentRecommendation {
  agentId: string;
  matchScore: number; // 0-100
  reasons: string[]; // Why this agent is recommended
  availability: 'available' | 'busy';
  estimatedAvailableAt?: number; // Timestamp when they'll be available if busy
}
