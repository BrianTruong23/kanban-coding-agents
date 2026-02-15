export type TaskType = 'epic' | 'story' | 'task' | 'subtask' | 'bug';
export type RiskLevel = 'low' | 'medium' | 'high' | 'critical';

export interface Epic {
  id: string;
  epicId: string; // e.g., "EPIC-1"
  title: string;
  description: string;
  goals: string[];
  userId: string;
  createdAt: number;
  updatedAt: number;
}

export interface Subtask {
  id: string;
  parentTaskId: string;
  title: string;
  description: string;
  completed: boolean;
  assignedAgentId?: string;
  estimatedHours?: number;
  actualHours?: number;
  createdAt: number;
  updatedAt: number;
}

export interface DefinitionOfDone {
  id: string;
  taskId: string;
  criteria: string[];
  createdAt: number;
  updatedAt: number;
}

export interface TestNotes {
  id: string;
  taskId: string;
  testScenarios: string[];
  testData?: string;
  expectedResults?: string;
  actualResults?: string;
  createdAt: number;
  updatedAt: number;
}

export interface RiskFlag {
  id: string;
  taskId: string;
  level: RiskLevel;
  category: string; // e.g., "technical", "deadline", "dependencies", "resources"
  description: string;
  mitigation?: string;
  createdAt: number;
  updatedAt: number;
}

export interface TaskDependency {
  id: string;
  taskId: string; // The task that depends on another
  dependsOnTaskId: string; // The task it depends on
  dependencyType: 'blocks' | 'relates_to' | 'duplicates' | 'clones';
  createdAt: number;
}

export interface TaskBreakdownInput {
  source: string; // Issue description, PRD, screenshot URL, etc.
  sourceType: 'github_issue' | 'prd' | 'screenshot' | 'text';
  context?: string; // Additional context
}

export interface TaskBreakdownResult {
  epic?: Epic;
  stories: Array<{
    title: string;
    description: string;
    priority: 1 | 2 | 3 | 4 | 5;
    tags: string[];
    estimatedHours?: number;
    subtasks: Array<{
      title: string;
      description: string;
      estimatedHours?: number;
    }>;
    definitionOfDone: string[];
    testScenarios: string[];
    risks: Array<{
      level: RiskLevel;
      category: string;
      description: string;
      mitigation?: string;
    }>;
    dependencies: string[]; // Task titles it depends on
  }>;
}
