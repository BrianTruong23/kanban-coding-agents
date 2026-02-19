import { Epic } from './epic';
import { Task } from './task';
import { Subtask } from './subtask';
import { TaskDependency } from './dependency';
import { DefinitionOfDone } from './definitionOfDone';
import { TestNote } from './testNote';
import { RiskFlag } from './riskFlag';

export interface TaskBreakdownInput {
  type: 'issue' | 'prd' | 'screenshot';
  content: string;
  imageUrl?: string; // For screenshots
}

export interface TaskBreakdownResult {
  epics: Epic[];
  tasks: Task[];
  subtasks: Subtask[];
  dependencies: TaskDependency[];
  definitionsOfDone: DefinitionOfDone[];
  testNotes: TestNote[];
  riskFlags: RiskFlag[];
}

export interface ParsedTaskItem {
  title: string;
  description: string;
  priority: 1 | 2 | 3 | 4 | 5;
  tags: string[];
  subtasks: string[];
  definitionOfDone: string[];
  testNotes: { note: string; testType?: string }[];
  riskFlags: { level: string; description: string; mitigation?: string }[];
  estimatedHours?: number;
  dependencies?: string[]; // References to other task titles
}
