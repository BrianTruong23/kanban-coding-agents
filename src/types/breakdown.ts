export interface TaskBreakdownInput {
  source: 'issue' | 'prd' | 'screenshot' | 'text';
  content: string;
  imageUrl?: string; // For screenshots
  additionalContext?: string;
}

export interface GeneratedEpic {
  title: string;
  description: string;
  businessValue: string;
  estimatedStoryPoints: number;
  stories: GeneratedStory[];
}

export interface GeneratedStory {
  title: string;
  description: string;
  acceptanceCriteria: string[];
  definitionOfDone: string[];
  testNotes: string;
  riskFlags: {
    level: 'low' | 'medium' | 'high' | 'critical';
    description: string;
    mitigation?: string;
  }[];
  estimatedStoryPoints: number;
  requiredSkills: string[];
  priority: 1 | 2 | 3 | 4 | 5;
  subtasks: GeneratedSubtask[];
  dependencies?: string[]; // references to other story titles
}

export interface GeneratedSubtask {
  title: string;
  description: string;
  estimatedHours: number;
  requiredSkills: string[];
}

export interface TaskBreakdownResult {
  epics: GeneratedEpic[];
  suggestedSprints?: {
    sprintName: string;
    stories: string[]; // story titles
  }[];
  overallRisks: string[];
  recommendedTeamSize: number;
}
