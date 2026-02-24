// Task Breakdown and Orchestration Types

export type TaskType = 'epic' | 'task' | 'subtask';
export type RiskLevel = 'low' | 'medium' | 'high' | 'critical';

export interface TaskDependency {
  id: string;
  dependentTaskId: string; // Task that depends on another
  dependsOnTaskId: string; // Task that must be completed first
  type: 'blocks' | 'related' | 'prerequisite';
  createdAt: number;
}

export interface DefinitionOfDone {
  id: string;
  taskId: string;
  description: string;
  completed: boolean;
  order: number;
}

export interface TestNote {
  id: string;
  taskId: string;
  description: string;
  type: 'unit' | 'integration' | 'e2e' | 'manual';
  completed: boolean;
}

export interface RiskFlag {
  id: string;
  taskId: string;
  level: RiskLevel;
  description: string;
  mitigation?: string;
  resolved: boolean;
  createdAt: number;
}

export interface EnhancedTask {
  // Base task fields
  id: string;
  taskId: string;
  title: string;
  description: string;
  status: string;
  priority: 1 | 2 | 3 | 4 | 5;
  tags: string[];
  sprint?: string;
  assignedAgentId?: string;

  // Hierarchy fields
  type: TaskType;
  parentTaskId?: string; // For subtasks -> task, or task -> epic
  epicId?: string; // Quick reference to epic

  // Extended fields
  estimatedHours?: number;
  actualHours?: number;
  definitionOfDone: DefinitionOfDone[];
  testNotes: TestNote[];
  riskFlags: RiskFlag[];

  // Metadata
  createdAt: number;
  updatedAt: number;
  createdBy?: string;
}

export interface TaskBreakdownInput {
  source: 'issue' | 'prd' | 'screenshot' | 'text';
  content: string;
  imageUrl?: string; // For screenshot analysis
  additionalContext?: string;
}

export interface TaskBreakdownResult {
  epic: Partial<EnhancedTask>;
  tasks: Partial<EnhancedTask>[];
  subtasks: Partial<EnhancedTask>[];
  dependencies: Omit<TaskDependency, 'id' | 'createdAt'>[];
  suggestedAgentAssignments: {
    taskId: string;
    agentId: string;
    confidence: number;
  }[];
}

// Agent Skills and Performance
export interface AgentSkill {
  id: string;
  agentId: string;
  skillName: string;
  proficiencyLevel: 1 | 2 | 3 | 4 | 5; // 1=Beginner, 5=Expert
  createdAt: number;
}

export interface AgentPerformance {
  id: string;
  agentId: string;
  tasksCompleted: number;
  tasksOnTime: number;
  tasksLate: number;
  averageCompletionTime: number; // in hours
  qualityScore: number; // 0-100
  lastUpdated: number;
}

export interface EnhancedAgent {
  id: string;
  name: string;
  description?: string;
  avatar?: string;
  avatarColor?: string;
  skills: AgentSkill[];
  performance: AgentPerformance;
  availability: 'available' | 'busy' | 'offline';
  currentWorkload: number; // Number of active tasks
  createdAt: number;
}

export interface AssignmentRecommendation {
  agentId: string;
  agentName: string;
  confidence: number; // 0-1
  reasoning: string[];
  skillMatch: number; // 0-1
  availabilityScore: number; // 0-1
  performanceScore: number; // 0-1
}
