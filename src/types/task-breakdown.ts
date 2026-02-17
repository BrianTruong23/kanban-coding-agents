import { Task } from './task';
import { Epic, Subtask, DefinitionOfDone, TestNote, RiskFlag } from './epic';
import { TaskRequirement } from './agent-skills';

export interface TaskBreakdownInput {
  type: 'issue' | 'prd' | 'screenshot' | 'text';
  content: string;
  imageUrl?: string; // For screenshot analysis
  context?: string; // Additional context about the project
}

export interface TaskBreakdownResult {
  epic?: Epic;
  tasks: Task[];
  subtasks: Subtask[];
  definitionsOfDone: DefinitionOfDone[];
  testNotes: TestNote[];
  riskFlags: RiskFlag[];
  requirements: TaskRequirement[];
  suggestedAssignments: {
    taskId: string;
    agentId: string;
    confidence: number; // 0-1 score
    reasoning: string;
  }[];
}

export interface BreakdownAnalysis {
  complexity: 'simple' | 'moderate' | 'complex' | 'very-complex';
  estimatedEffort: number; // in story points or hours
  recommendedSplit: {
    epicCount: number;
    taskCount: number;
    subtaskCount: number;
  };
  technicalStack: string[];
  requiredSkills: {
    category: string;
    skills: string[];
    proficiency: number;
  }[];
}
