// Types for automated task breakdown and orchestration

export type TaskType = 'epic' | 'story' | 'task' | 'subtask';
export type RiskLevel = 'low' | 'medium' | 'high' | 'critical';

export interface DefinitionOfDone {
  criteria: string[];
  testNotes?: string[];
}

export interface TaskDependency {
  id: string;
  taskId: string; // The dependent task's ID
  dependsOn: string; // The task ID this depends on
  type: 'blocks' | 'relates-to' | 'required-by';
  createdAt: number;
}

export interface Epic {
  id: string;
  title: string;
  description: string;
  acceptanceCriteria: string[];
  stories: Story[];
  createdAt: number;
  updatedAt: number;
}

export interface Story {
  id: string;
  epicId?: string;
  title: string;
  description: string;
  acceptanceCriteria: string[];
  tasks: TaskBreakdown[];
  createdAt: number;
  updatedAt: number;
}

export interface TaskBreakdown {
  id: string;
  storyId?: string;
  taskId: string; // Display ID like "TASK-1"
  title: string;
  description: string;
  type: TaskType;
  priority: 1 | 2 | 3 | 4 | 5;
  estimatedHours?: number;
  definitionOfDone: DefinitionOfDone;
  testNotes: string[];
  riskLevel: RiskLevel;
  riskDescription?: string;
  dependencies: string[]; // Array of task IDs this task depends on
  subtasks?: TaskBreakdown[];
  requiredSkills: string[]; // Skills needed to complete this task
  suggestedAgentId?: string; // AI-suggested agent based on skills
  assignedAgentId?: string;
  tags: string[];
  createdAt: number;
  updatedAt: number;
}

export interface BreakdownInput {
  type: 'issue' | 'prd' | 'screenshot' | 'text';
  content: string;
  attachments?: {
    type: string;
    url?: string;
    data?: string;
  }[];
  context?: string; // Additional context for the breakdown
}

export interface BreakdownResult {
  epics: Epic[];
  stories: Story[];
  tasks: TaskBreakdown[];
  dependencies: TaskDependency[];
  summary: {
    totalEpics: number;
    totalStories: number;
    totalTasks: number;
    totalSubtasks: number;
    estimatedHours: number;
    highRiskTasks: number;
  };
  generatedAt: number;
}
