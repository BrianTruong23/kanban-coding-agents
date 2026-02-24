// Agent Orchestration Service - Manages agent skills, performance, and auto-assignment

import { CodingAgent } from '@/types/agent';
import { Task } from '@/types/task';
import {
  AgentExtended,
  AgentSkill,
  PerformanceMetric,
  AgentMatchScore,
  AssignmentHistory,
} from '@/types/agentExtended';

/**
 * Default skills for common agent types
 */
const DEFAULT_AGENT_SKILLS: Record<string, AgentSkill[]> = {
  'Alex Chen': [
    { name: 'React', level: 5, category: 'frontend' },
    { name: 'Next.js', level: 5, category: 'frontend' },
    { name: 'TypeScript', level: 4, category: 'frontend' },
    { name: 'UI/UX', level: 4, category: 'design' },
    { name: 'Tailwind CSS', level: 5, category: 'frontend' },
  ],
  'Sarah Johnson': [
    { name: 'Node.js', level: 5, category: 'backend' },
    { name: 'API Development', level: 5, category: 'backend' },
    { name: 'PostgreSQL', level: 4, category: 'database' },
    { name: 'Database Design', level: 4, category: 'database' },
    { name: 'TypeScript', level: 4, category: 'backend' },
  ],
  'Mike Rodriguez': [
    { name: 'React', level: 4, category: 'frontend' },
    { name: 'Node.js', level: 4, category: 'backend' },
    { name: 'TypeScript', level: 5, category: 'other' },
    { name: 'API Development', level: 3, category: 'backend' },
    { name: 'Testing', level: 4, category: 'testing' },
  ],
  'Emma Wilson': [
    { name: 'Docker', level: 5, category: 'devops' },
    { name: 'CI/CD', level: 5, category: 'devops' },
    { name: 'AWS', level: 4, category: 'devops' },
    { name: 'Kubernetes', level: 3, category: 'devops' },
    { name: 'Database', level: 3, category: 'database' },
  ],
  'David Kim': [
    { name: 'React Native', level: 5, category: 'mobile' },
    { name: 'Mobile UI/UX', level: 4, category: 'design' },
    { name: 'TypeScript', level: 4, category: 'frontend' },
    { name: 'API Integration', level: 4, category: 'backend' },
    { name: 'Testing', level: 3, category: 'testing' },
  ],
};

/**
 * Extends a basic agent with skills and performance tracking
 */
export function extendAgent(agent: CodingAgent): AgentExtended {
  // Get default skills or empty array
  const skills = DEFAULT_AGENT_SKILLS[agent.name] || [];

  // Initialize performance metrics
  const performance: PerformanceMetric = {
    tasksCompleted: 0,
    tasksAssigned: 0,
    averageCompletionTime: 0,
    successRate: 1.0,
    onTimeDeliveryRate: 1.0,
    lastUpdated: Date.now(),
  };

  return {
    ...agent,
    skills,
    performance,
    assignmentHistory: [],
    availability: 'available',
    currentWorkload: 0,
    maxWorkload: 5, // Default max 5 concurrent tasks
  };
}

/**
 * Calculate how well an agent matches a task based on required skills
 */
export function calculateAgentMatch(
  agent: AgentExtended,
  task: Task
): AgentMatchScore {
  const requiredSkills = task.suggestedAgentSkills || [];
  const agentSkillMap = new Map(agent.skills.map(s => [s.name.toLowerCase(), s]));

  let skillMatchScore = 0;
  let performanceScore = 0;
  let availabilityScore = 0;
  let workloadScore = 0;
  const matchedSkills: string[] = [];
  const missingSkills: string[] = [];

  // 1. Skill matching (0-100)
  if (requiredSkills.length > 0) {
    let totalSkillScore = 0;
    for (const requiredSkill of requiredSkills) {
      const skillLower = requiredSkill.toLowerCase();
      const agentSkill = agentSkillMap.get(skillLower);

      if (agentSkill) {
        matchedSkills.push(requiredSkill);
        // Level 5 = 100%, Level 1 = 20%
        totalSkillScore += agentSkill.level * 20;
      } else {
        missingSkills.push(requiredSkill);
      }
    }
    skillMatchScore = totalSkillScore / requiredSkills.length;
  } else {
    // No specific skills required, all agents match equally
    skillMatchScore = 75;
  }

  // 2. Performance score (0-100)
  const perf = agent.performance;
  if (perf.tasksCompleted > 0) {
    performanceScore =
      (perf.successRate * 50) +
      (perf.onTimeDeliveryRate * 30) +
      (Math.min(perf.tasksCompleted / 20, 1) * 20); // Experience bonus
  } else {
    // New agent, give average score
    performanceScore = 70;
  }

  // 3. Availability score (0-100)
  switch (agent.availability) {
    case 'available':
      availabilityScore = 100;
      break;
    case 'busy':
      availabilityScore = 50;
      break;
    case 'unavailable':
      availabilityScore = 0;
      break;
  }

  // 4. Workload score (0-100)
  const workloadRatio = agent.currentWorkload / agent.maxWorkload;
  workloadScore = Math.max(0, 100 - (workloadRatio * 100));

  // Calculate overall score with weighted factors
  const overallScore =
    (skillMatchScore * 0.4) +       // 40% weight on skill match
    (performanceScore * 0.3) +      // 30% weight on performance
    (availabilityScore * 0.2) +     // 20% weight on availability
    (workloadScore * 0.1);          // 10% weight on workload

  return {
    agentId: agent.id,
    agentName: agent.name,
    score: Math.round(overallScore),
    reasoning: {
      skillMatch: Math.round(skillMatchScore),
      performanceScore: Math.round(performanceScore),
      availabilityScore: Math.round(availabilityScore),
      workloadScore: Math.round(workloadScore),
    },
    matchedSkills,
    missingSkills,
  };
}

/**
 * Find the best agent for a task
 */
export function findBestAgent(
  agents: AgentExtended[],
  task: Task
): AgentMatchScore | null {
  if (agents.length === 0) return null;

  const scores = agents.map(agent => calculateAgentMatch(agent, task));

  // Sort by score (highest first)
  scores.sort((a, b) => b.score - a.score);

  return scores[0];
}

/**
 * Auto-assign tasks to agents based on skills and availability
 */
export function autoAssignTasks(
  tasks: Task[],
  agents: AgentExtended[],
  minScoreThreshold: number = 50
): Map<string, string> {
  const assignments = new Map<string, string>(); // taskId -> agentId
  const extendedAgents = [...agents]; // Clone to track workload changes

  // Sort tasks by priority (highest first) and risk level (highest first)
  const sortedTasks = [...tasks].sort((a, b) => {
    // First by priority
    if (b.priority !== a.priority) {
      return b.priority - a.priority;
    }
    // Then by risk level
    const riskOrder = { critical: 4, high: 3, medium: 2, low: 1 };
    const aRisk = riskOrder[a.riskLevel || 'low'];
    const bRisk = riskOrder[b.riskLevel || 'low'];
    return bRisk - aRisk;
  });

  for (const task of sortedTasks) {
    // Skip if already assigned
    if (task.assignedAgentId) continue;

    // Find best available agent
    const match = findBestAgent(extendedAgents, task);

    if (match && match.score >= minScoreThreshold) {
      assignments.set(task.id, match.agentId);

      // Update agent workload
      const agent = extendedAgents.find(a => a.id === match.agentId);
      if (agent) {
        agent.currentWorkload++;
        if (agent.currentWorkload >= agent.maxWorkload) {
          agent.availability = 'busy';
        }
      }
    }
  }

  return assignments;
}

/**
 * Update agent performance after task completion
 */
export function updateAgentPerformance(
  agent: AgentExtended,
  assignment: AssignmentHistory
): AgentExtended {
  const updatedAgent = { ...agent };
  const perf = { ...updatedAgent.performance };

  // Add to assignment history
  updatedAgent.assignmentHistory = [...updatedAgent.assignmentHistory, assignment];

  // Update metrics
  if (assignment.status === 'completed' && assignment.completedAt) {
    perf.tasksCompleted++;

    // Calculate completion time
    const completionTimeHours =
      (assignment.completedAt - assignment.assignedAt) / (1000 * 60 * 60);

    // Update average completion time
    if (perf.averageCompletionTime === 0) {
      perf.averageCompletionTime = completionTimeHours;
    } else {
      perf.averageCompletionTime =
        (perf.averageCompletionTime * (perf.tasksCompleted - 1) + completionTimeHours) /
        perf.tasksCompleted;
    }

    // Update success rate based on rating
    if (assignment.rating) {
      const taskSuccess = assignment.rating >= 3 ? 1 : 0;
      perf.successRate =
        (perf.successRate * (perf.tasksCompleted - 1) + taskSuccess) /
        perf.tasksCompleted;
    }
  }

  perf.lastUpdated = Date.now();
  updatedAgent.performance = perf;

  // Update workload
  updatedAgent.currentWorkload = Math.max(
    0,
    updatedAgent.assignmentHistory.filter(a => a.status === 'assigned').length
  );

  // Update availability
  if (updatedAgent.currentWorkload >= updatedAgent.maxWorkload) {
    updatedAgent.availability = 'busy';
  } else if (updatedAgent.currentWorkload === 0) {
    updatedAgent.availability = 'available';
  }

  return updatedAgent;
}

/**
 * Get agent roster summary
 */
export function getAgentRosterSummary(agents: AgentExtended[]): {
  totalAgents: number;
  availableAgents: number;
  busyAgents: number;
  unavailableAgents: number;
  totalCapacity: number;
  currentWorkload: number;
  utilizationRate: number;
} {
  const totalAgents = agents.length;
  const availableAgents = agents.filter(a => a.availability === 'available').length;
  const busyAgents = agents.filter(a => a.availability === 'busy').length;
  const unavailableAgents = agents.filter(a => a.availability === 'unavailable').length;
  const totalCapacity = agents.reduce((sum, a) => sum + a.maxWorkload, 0);
  const currentWorkload = agents.reduce((sum, a) => sum + a.currentWorkload, 0);
  const utilizationRate = totalCapacity > 0 ? (currentWorkload / totalCapacity) * 100 : 0;

  return {
    totalAgents,
    availableAgents,
    busyAgents,
    unavailableAgents,
    totalCapacity,
    currentWorkload,
    utilizationRate,
  };
}

// Singleton instance (if needed)
export class AgentOrchestrationService {
  private extendedAgents: Map<string, AgentExtended> = new Map();

  /**
   * Initialize or update extended agents from basic agents
   */
  initializeAgents(agents: CodingAgent[]): void {
    for (const agent of agents) {
      if (!this.extendedAgents.has(agent.id)) {
        this.extendedAgents.set(agent.id, extendAgent(agent));
      }
    }
  }

  /**
   * Get extended agent by ID
   */
  getExtendedAgent(agentId: string): AgentExtended | undefined {
    return this.extendedAgents.get(agentId);
  }

  /**
   * Get all extended agents
   */
  getAllExtendedAgents(): AgentExtended[] {
    return Array.from(this.extendedAgents.values());
  }

  /**
   * Auto-assign a task to the best agent
   */
  autoAssignTask(task: Task): AgentMatchScore | null {
    const agents = this.getAllExtendedAgents();
    return findBestAgent(agents, task);
  }

  /**
   * Update agent after task completion
   */
  completeTaskAssignment(agentId: string, assignment: AssignmentHistory): void {
    const agent = this.extendedAgents.get(agentId);
    if (agent) {
      const updatedAgent = updateAgentPerformance(agent, assignment);
      this.extendedAgents.set(agentId, updatedAgent);
    }
  }
}

export const agentOrchestrationService = new AgentOrchestrationService();
