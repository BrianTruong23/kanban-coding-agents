export type BreakdownRequestType = 'prd' | 'issue' | 'screenshot';
export type BreakdownStatus = 'pending' | 'processing' | 'completed' | 'failed';

export interface TaskBreakdownRequest {
  id: string;
  requestType: BreakdownRequestType;
  inputText?: string;
  inputUrl?: string;
  screenshotData?: string;
  status: BreakdownStatus;
  resultEpicId?: string;
  aiModel?: string;
  errorMessage?: string;
  createdAt: number;
  processedAt?: number;
}

export interface BreakdownResult {
  epic: {
    title: string;
    description: string;
    priority: 1 | 2 | 3 | 4 | 5;
  };
  tasks: Array<{
    title: string;
    description: string;
    priority: 1 | 2 | 3 | 4 | 5;
    tags: string[];
    estimatedHours?: number;
    requiredSkills: string[];
    subtasks: Array<{
      title: string;
      description: string;
      definitionOfDone: string;
      testNotes: string;
      riskLevel: 'low' | 'medium' | 'high' | 'critical';
      estimatedHours?: number;
      requiredSkills: string[];
    }>;
  }>;
  dependencies: Array<{
    taskIndex: number;
    dependsOnTaskIndex: number;
    type: 'finish_to_start' | 'start_to_start' | 'finish_to_finish' | 'start_to_finish';
  }>;
}
