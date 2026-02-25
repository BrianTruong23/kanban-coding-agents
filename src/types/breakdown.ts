// Types for automated task breakdown and orchestration

export type RiskLevel = 'low' | 'medium' | 'high' | 'critical';
export type TaskType = 'epic' | 'ticket' | 'subtask';

export interface Risk {
  id: string;
  level: RiskLevel;
  description: string;
  mitigation?: string;
  createdAt: number;
}

export interface Dependency {
  id: string;
  fromTaskId: string;
  toTaskId: string;
  type: 'blocks' | 'depends-on' | 'related-to';
  createdAt: number;
}

export interface DefinitionOfDone {
  id: string;
  description: string;
  completed: boolean;
  order: number;
}

export interface TestNote {
  id: string;
  description: string;
  testType: 'unit' | 'integration' | 'e2e' | 'manual';
  completed: boolean;
}

export interface TaskBreakdown {
  id: string;
  taskId: string; // Reference to the main task
  type: TaskType;
  parentId?: string; // For hierarchical structure (epic -> ticket -> subtask)
  risks: Risk[];
  dependencies: string[]; // Array of task IDs this depends on
  definitionOfDone: DefinitionOfDone[];
  testNotes: TestNote[];
  estimatedHours?: number;
  createdAt: number;
  updatedAt: number;
}

export interface BreakdownRequest {
  type: 'issue' | 'prd' | 'screenshot';
  content: string; // Text content or URL/path to screenshot
  title: string;
  additionalContext?: string;
}

export interface BreakdownResponse {
  epics: Array<{
    title: string;
    description: string;
    tickets: Array<{
      title: string;
      description: string;
      priority: 1 | 2 | 3 | 4 | 5;
      estimatedHours?: number;
      tags: string[];
      subtasks: Array<{
        title: string;
        description: string;
        estimatedHours?: number;
      }>;
      definitionOfDone: string[];
      testNotes: Array<{
        description: string;
        testType: 'unit' | 'integration' | 'e2e' | 'manual';
      }>;
      risks: Array<{
        level: RiskLevel;
        description: string;
        mitigation?: string;
      }>;
    }>;
  }>;
  dependencies: Array<{
    from: string; // task title
    to: string; // task title
    type: 'blocks' | 'depends-on' | 'related-to';
  }>;
}
