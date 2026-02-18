// Types for automated task breakdown and agent orchestration

export type TaskStatus = 'backlog' | 'in-progress' | 'review' | 'done';
export type RiskLevel = 'low' | 'medium' | 'high' | 'critical';
export type DependencyType = 'blocks' | 'related' | 'requires';
export type TaskType = 'epic' | 'ticket' | 'subtask' | 'task';

// =====================
// EPIC
// =====================
export interface Epic {
  id: string;
  epicId: string; // Display ID like "EPIC-1"
  title: string;
  description?: string;
  status: TaskStatus;
  priority: 1 | 2 | 3 | 4 | 5;
  tags: string[];
  createdAt: number;
  updatedAt: number;
}

// =====================
// TICKET
// =====================
export interface DoDCriteria {
  id: string;
  description: string;
  completed: boolean;
}

export interface Ticket {
  id: string;
  epicId?: string; // Reference to parent epic
  ticketId: string; // Display ID like "TICKET-1"
  title: string;
  description?: string;
  status: TaskStatus;
  priority: 1 | 2 | 3 | 4 | 5;
  assignedAgentId?: string;
  tags: string[];

  // Definition of Done
  definitionOfDone: DoDCriteria[];

  // Test notes and risk flags
  testNotes?: string;
  riskLevel?: RiskLevel;
  riskDescription?: string;

  // Effort estimation
  storyPoints?: number;
  estimatedHours?: number;

  // Skills needed for this ticket
  suggestedSkills?: string[];

  createdAt: number;
  updatedAt: number;
}

// =====================
// SUBTASK
// =====================
export interface Subtask {
  id: string;
  ticketId: string; // Reference to parent ticket
  subtaskId: string; // Display ID like "SUB-1"
  title: string;
  description?: string;
  status: TaskStatus;
  assignedAgentId?: string;
  orderIndex: number; // For ordering within a ticket
  estimatedMinutes?: number;
  createdAt: number;
  updatedAt: number;
}

// =====================
// TASK DEPENDENCY
// =====================
export interface TaskDependency {
  id: string;
  sourceType: TaskType;
  sourceId: string;
  targetType: TaskType;
  targetId: string;
  dependencyType: DependencyType;
  createdAt: number;
}

// =====================
// AGENT SKILLS
// =====================
export interface AgentSkill {
  id: string;
  agentId: string;
  skillName: string;
  skillCategory?: string; // e.g., "frontend", "backend", "devops"
  proficiencyLevel: 1 | 2 | 3 | 4 | 5;
  createdAt: number;
  updatedAt: number;
}

// =====================
// AGENT PERFORMANCE
// =====================
export interface AgentPerformance {
  id: string;
  agentId: string;
  tasksCompleted: number;
  tasksOnTime: number;
  tasksDelayed: number;
  averageCompletionTimeHours?: number;
  successRate?: number; // Percentage
  currentAssignedTasks: number;
  currentWorkloadHours: number;
  periodStart?: number;
  periodEnd?: number;
  createdAt: number;
  updatedAt: number;
}

// =====================
// AI BREAKDOWN
// =====================
export type InputType = 'issue' | 'prd' | 'screenshot' | 'text';

export interface BreakdownInput {
  type: InputType;
  content: string;
  imageUrl?: string; // For screenshot type
}

export interface BreakdownResult {
  epics: GeneratedEpic[];
  tickets: GeneratedTicket[];
  subtasks: GeneratedSubtask[];
  dependencies: GeneratedDependency[];
}

export interface GeneratedEpic {
  title: string;
  description: string;
  priority: 1 | 2 | 3 | 4 | 5;
  tags: string[];
}

export interface GeneratedTicket {
  epicIndex?: number; // Index in the epics array (if linked to an epic)
  title: string;
  description: string;
  priority: 1 | 2 | 3 | 4 | 5;
  tags: string[];
  definitionOfDone: string[];
  testNotes?: string;
  riskLevel?: RiskLevel;
  riskDescription?: string;
  storyPoints?: number;
  estimatedHours?: number;
  suggestedSkills?: string[]; // Skills needed for this ticket
}

export interface GeneratedSubtask {
  ticketIndex: number; // Index in the tickets array
  title: string;
  description?: string;
  orderIndex: number;
  estimatedMinutes?: number;
}

export interface GeneratedDependency {
  sourceType: TaskType;
  sourceIndex: number; // Index in the respective array
  targetType: TaskType;
  targetIndex: number; // Index in the respective array
  dependencyType: DependencyType;
  reason?: string; // Why this dependency exists
}

export interface BreakdownHistory {
  id: string;
  inputType: InputType;
  inputContent: string;
  generatedEpics?: GeneratedEpic[];
  generatedTickets?: GeneratedTicket[];
  generatedSubtasks?: GeneratedSubtask[];
  generatedDependencies?: GeneratedDependency[];
  modelUsed?: string;
  processingTimeMs?: number;
  userAccepted: boolean;
  userFeedback?: string;
  createdAt: number;
}

// =====================
// AUTO-ASSIGNMENT
// =====================
export interface AssignmentRecommendation {
  agentId: string;
  agentName: string;
  score: number; // 0-100
  reasons: string[];
  matchedSkills: string[];
  currentWorkload: number;
  successRate?: number;
}

export interface AutoAssignmentConfig {
  prioritizeSkillMatch: boolean; // vs. workload balancing
  skillMatchWeight: number; // 0-1
  workloadWeight: number; // 0-1
  performanceWeight: number; // 0-1
  maxTasksPerAgent?: number;
  maxHoursPerAgent?: number;
}

// =====================
// DEPENDENCY GRAPH
// =====================
export interface DependencyNode {
  id: string;
  type: TaskType;
  displayId: string;
  title: string;
  status: TaskStatus;
  priority?: number;
  assignedAgentId?: string;
}

export interface DependencyEdge {
  id: string;
  source: string; // Node ID
  target: string; // Node ID
  type: DependencyType;
}

export interface DependencyGraph {
  nodes: DependencyNode[];
  edges: DependencyEdge[];
}
