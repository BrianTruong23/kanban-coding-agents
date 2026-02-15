// Agent Roster Types with Skills and Performance Tracking

export type SkillLevel = 'beginner' | 'intermediate' | 'advanced' | 'expert';
export type SkillCategory = 'frontend' | 'backend' | 'database' | 'devops' | 'testing' | 'design' | 'mobile' | 'security' | 'performance';

export interface Skill {
  name: string;
  category: SkillCategory;
  level: SkillLevel;
  yearsOfExperience?: number;
}

export interface PerformanceMetrics {
  tasksCompleted: number;
  tasksInProgress: number;
  averageCompletionTime?: number; // in hours
  onTimeDeliveryRate?: number; // percentage
  qualityScore?: number; // 0-100
  collaborationScore?: number; // 0-100
  lastUpdated: number;
}

export interface Availability {
  status: 'available' | 'busy' | 'offline';
  currentWorkload: number; // number of active tasks
  maxCapacity: number; // max concurrent tasks
  hoursPerWeek?: number;
  timezone?: string;
}

export interface AgentPreferences {
  preferredTaskTypes: string[]; // e.g., ['bug-fix', 'feature', 'refactor']
  avoidTaskTypes?: string[];
  preferredTechnologies: string[];
  workingHours?: {
    start: string; // e.g., "09:00"
    end: string; // e.g., "17:00"
  };
}

export interface AgentRoster {
  id: string;
  userId: string;
  name: string;
  description?: string;
  avatar?: string;
  avatarColor?: string;
  email?: string;

  // Skills and expertise
  skills: Skill[];
  specializations: string[];

  // Performance tracking
  performanceMetrics: PerformanceMetrics;

  // Availability
  availability: Availability;

  // Preferences
  preferences?: AgentPreferences;

  // Assignment history
  assignmentHistory: AssignmentRecord[];

  createdAt: number;
  updatedAt: number;
}

export interface AssignmentRecord {
  taskId: string;
  taskTitle: string;
  assignedAt: number;
  completedAt?: number;
  duration?: number; // in hours
  quality?: number; // 0-100
  notes?: string;
}

export interface AssignmentScore {
  agentId: string;
  score: number; // 0-100
  reasons: string[];
  skillMatch: number; // 0-100
  availabilityMatch: number; // 0-100
  performanceMatch: number; // 0-100
  preferenceMatch: number; // 0-100
}

export interface AssignmentRecommendation {
  taskId: string;
  recommendations: AssignmentScore[];
  autoAssigned?: string; // Agent ID if auto-assigned
  confidence: number; // 0-100
}

export interface TeamComposition {
  totalAgents: number;
  availableAgents: number;
  busyAgents: number;
  offlineAgents: number;
  skillCoverage: {
    category: SkillCategory;
    agentCount: number;
    averageLevel: SkillLevel;
  }[];
  workloadDistribution: {
    agentId: string;
    currentTasks: number;
    capacityUtilization: number; // percentage
  }[];
}
