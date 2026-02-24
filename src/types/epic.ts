export interface Epic {
  id: string;
  epicId: string; // Display ID like "EPIC-1"
  title: string;
  description: string;
  status: 'planning' | 'in-progress' | 'completed' | 'cancelled';
  priority: 1 | 2 | 3 | 4 | 5;
  tags: string[];
  sprint?: string;
  targetDate?: number;
  createdAt: number;
  updatedAt: number;
  taskIds: string[]; // IDs of tasks under this epic
}

export interface Subtask {
  id: string;
  parentTaskId: string; // Reference to parent task
  title: string;
  description: string;
  status: 'todo' | 'in-progress' | 'done';
  assignedAgentId?: string;
  definitionOfDone: string[]; // List of DoD criteria
  testNotes: string[]; // Testing considerations
  riskFlags: RiskFlag[];
  estimatedHours?: number;
  actualHours?: number;
  createdAt: number;
  updatedAt: number;
}

export interface RiskFlag {
  id: string;
  severity: 'low' | 'medium' | 'high' | 'critical';
  category: 'technical' | 'dependency' | 'resource' | 'timeline' | 'security';
  description: string;
  mitigation?: string;
  createdAt: number;
}

export interface TaskDependency {
  id: string;
  sourceTaskId: string; // Task that depends on another
  targetTaskId: string; // Task that must be completed first
  dependencyType: 'blocks' | 'requires' | 'related';
  description?: string;
  createdAt: number;
}

export interface TaskBreakdownRequest {
  type: 'issue' | 'prd' | 'screenshot';
  content: string;
  imageUrl?: string; // For screenshots
  context?: string; // Additional context
}

export interface TaskBreakdownResult {
  epic?: Epic;
  tasks: Array<{
    title: string;
    description: string;
    priority: 1 | 2 | 3 | 4 | 5;
    tags: string[];
    sprint?: string;
    estimatedHours?: number;
    subtasks: Array<{
      title: string;
      description: string;
      definitionOfDone: string[];
      testNotes: string[];
      riskFlags: Omit<RiskFlag, 'id' | 'createdAt'>[];
      estimatedHours?: number;
    }>;
    dependencies?: Array<{
      targetTaskIndex: number; // Index in the tasks array
      dependencyType: 'blocks' | 'requires' | 'related';
      description?: string;
    }>;
  }>;
  suggestedAgentAssignments?: Array<{
    taskIndex: number;
    agentId: string;
    reason: string;
    confidence: number; // 0-1
  }>;
}
