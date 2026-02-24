import { Epic } from './epic';
import { Task } from './task';
import { TaskDependency } from './dependency';

export interface TaskBreakdownInput {
  type: 'issue' | 'prd' | 'screenshot';
  content: string;
  imageUrl?: string; // For screenshots
}

export interface TaskBreakdownResult {
  epic: Omit<Epic, 'id' | 'epicId' | 'createdAt' | 'updatedAt'>;
  tasks: Omit<Task, 'id' | 'taskId' | 'createdAt' | 'updatedAt'>[];
  dependencies: Omit<TaskDependency, 'id' | 'createdAt'>[];
  suggestedAgentAssignments: Record<number, string>; // task index -> agent ID
}

export interface BreakdownStrategy {
  identify_epic: boolean;
  create_subtasks: boolean;
  generate_dod: boolean;
  assess_risks: boolean;
  find_dependencies: boolean;
  suggest_assignments: boolean;
}
