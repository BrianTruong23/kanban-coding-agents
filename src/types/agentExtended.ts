// Extended agent types with skills, performance tracking, and assignment capabilities

import { CodingAgent } from './agent';

export interface AgentSkill {
  name: string;
  level: 1 | 2 | 3 | 4 | 5; // 1=Beginner, 5=Expert
  category: 'frontend' | 'backend' | 'database' | 'devops' | 'testing' | 'design' | 'mobile' | 'other';
}

export interface PerformanceMetric {
  tasksCompleted: number;
  tasksAssigned: number;
  averageCompletionTime: number; // in hours
  successRate: number; // 0-1
  onTimeDeliveryRate: number; // 0-1
  lastUpdated: number;
}

export interface AssignmentHistory {
  taskId: string;
  taskTitle: string;
  assignedAt: number;
  completedAt?: number;
  status: 'assigned' | 'completed' | 'cancelled';
  rating?: 1 | 2 | 3 | 4 | 5; // Task completion quality rating
}

export interface AgentExtended extends CodingAgent {
  skills: AgentSkill[];
  performance: PerformanceMetric;
  assignmentHistory: AssignmentHistory[];
  availability: 'available' | 'busy' | 'unavailable';
  currentWorkload: number; // Number of active tasks
  maxWorkload: number; // Maximum concurrent tasks
}

export interface AgentMatchScore {
  agentId: string;
  agentName: string;
  score: number; // 0-100
  reasoning: {
    skillMatch: number; // 0-100
    performanceScore: number; // 0-100
    availabilityScore: number; // 0-100
    workloadScore: number; // 0-100
  };
  matchedSkills: string[];
  missingSkills: string[];
}
