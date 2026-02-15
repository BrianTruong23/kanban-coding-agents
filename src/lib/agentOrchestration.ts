import { CodingAgent, AgentSkill } from '@/types/agent';
import { BreakdownTask } from '@/types/breakdown';

/**
 * Agent Orchestration Service
 * Handles intelligent agent assignment based on skills, performance, and availability
 */

interface AgentScore {
  agent: CodingAgent;
  score: number;
  reasons: string[];
}

/**
 * Calculate a match score between an agent and a task
 */
function calculateAgentTaskScore(
  agent: CodingAgent,
  task: BreakdownTask
): AgentScore {
  let score = 0;
  const reasons: string[] = [];

  // 1. Skill matching (40% of score)
  const taskSkills = task.tags.filter((tag) =>
    ['frontend', 'backend', 'fullstack', 'devops', 'mobile', 'testing', 'ui-ux', 'database', 'api-design', 'security'].includes(tag)
  ) as AgentSkill[];

  const matchingSkills = taskSkills.filter((skill) => agent.skills.includes(skill));
  const skillScore = (matchingSkills.length / Math.max(taskSkills.length, 1)) * 40;
  score += skillScore;

  if (matchingSkills.length > 0) {
    reasons.push(`Has ${matchingSkills.length}/${taskSkills.length} required skills: ${matchingSkills.join(', ')}`);
  } else if (taskSkills.length > 0) {
    reasons.push(`Missing key skills: ${taskSkills.join(', ')}`);
  }

  // 2. Performance metrics (30% of score)
  const performanceScore = (agent.performance.successRate / 100) * 30;
  score += performanceScore;

  if (agent.performance.successRate >= 90) {
    reasons.push(`Excellent track record (${agent.performance.successRate}% success)`);
  } else if (agent.performance.successRate >= 70) {
    reasons.push(`Good track record (${agent.performance.successRate}% success)`);
  } else {
    reasons.push(`Developing track record (${agent.performance.successRate}% success)`);
  }

  // 3. Availability (20% of score)
  let availabilityScore = 0;
  if (agent.availability === 'available') {
    availabilityScore = 20;
    reasons.push('Currently available');
  } else if (agent.availability === 'busy') {
    availabilityScore = 10;
    reasons.push('Currently busy with other tasks');
  } else {
    availabilityScore = 0;
    reasons.push('Currently offline');
  }
  score += availabilityScore;

  // 4. Workload balance (10% of score)
  // Lower completion time is better (faster agent)
  const avgTimeScore = Math.max(0, 10 - (agent.performance.averageCompletionTime / 10));
  score += avgTimeScore;

  if (agent.performance.averageCompletionTime < 5) {
    reasons.push('Fast completion times');
  } else if (agent.performance.averageCompletionTime < 10) {
    reasons.push('Good completion times');
  }

  // 5. Priority bonus - high priority tasks prefer high performers
  if (task.priority >= 4 && agent.performance.successRate >= 85) {
    score += 5;
    reasons.push('High performer suitable for high-priority task');
  }

  return { agent, score, reasons };
}

/**
 * Find the best agent for a specific task
 */
export function findBestAgent(
  task: BreakdownTask,
  agents: CodingAgent[]
): CodingAgent | null {
  if (agents.length === 0) return null;

  const scoredAgents = agents
    .map((agent) => calculateAgentTaskScore(agent, task))
    .sort((a, b) => b.score - a.score);

  const bestMatch = scoredAgents[0];

  // Only return an agent if the score is above a threshold (e.g., 30)
  if (bestMatch.score >= 30) {
    return bestMatch.agent;
  }

  return null;
}

/**
 * Auto-assign multiple tasks to agents based on optimal distribution
 */
export function autoAssignTasks(
  tasks: BreakdownTask[],
  agents: CodingAgent[]
): Map<string, string> {
  const assignments = new Map<string, string>(); // taskId -> agentId

  if (agents.length === 0) return assignments;

  // Create a workload tracker for each agent
  const agentWorkload = new Map<string, number>();
  agents.forEach((agent) => {
    agentWorkload.set(agent.id, 0);
  });

  // Sort tasks by priority (highest first)
  const sortedTasks = [...tasks].sort((a, b) => b.priority - a.priority);

  sortedTasks.forEach((task) => {
    // Score all agents for this task
    const scoredAgents = agents
      .map((agent) => {
        const baseScore = calculateAgentTaskScore(agent, task);

        // Adjust score based on current workload
        const currentWorkload = agentWorkload.get(agent.id) || 0;
        const workloadPenalty = currentWorkload * 2; // Penalize agents with more tasks

        return {
          ...baseScore,
          score: baseScore.score - workloadPenalty,
        };
      })
      .sort((a, b) => b.score - a.score);

    const bestMatch = scoredAgents[0];

    if (bestMatch.score >= 20) {
      assignments.set(task.id, bestMatch.agent.id);

      // Update workload
      const currentWorkload = agentWorkload.get(bestMatch.agent.id) || 0;
      const taskHours = task.estimatedHours || 4;
      agentWorkload.set(bestMatch.agent.id, currentWorkload + taskHours);
    }
  });

  return assignments;
}

/**
 * Get detailed agent recommendations for a task
 */
export function getAgentRecommendations(
  task: BreakdownTask,
  agents: CodingAgent[],
  limit: number = 3
): AgentScore[] {
  if (agents.length === 0) return [];

  const scoredAgents = agents
    .map((agent) => calculateAgentTaskScore(agent, task))
    .sort((a, b) => b.score - a.score)
    .slice(0, limit);

  return scoredAgents;
}

/**
 * Update agent performance based on task completion
 */
export function updateAgentPerformance(
  agent: CodingAgent,
  taskCompleted: boolean,
  hoursSpent: number
): CodingAgent {
  const updatedPerformance = { ...agent.performance };

  // Update tasks completed
  updatedPerformance.tasksCompleted += 1;

  // Update success rate (moving average)
  const totalTasks = updatedPerformance.tasksCompleted;
  const currentSuccessCount = (agent.performance.successRate / 100) * (totalTasks - 1);
  const newSuccessCount = currentSuccessCount + (taskCompleted ? 1 : 0);
  updatedPerformance.successRate = (newSuccessCount / totalTasks) * 100;

  // Update average completion time (moving average)
  const previousAvg = agent.performance.averageCompletionTime;
  updatedPerformance.averageCompletionTime =
    ((previousAvg * (totalTasks - 1)) + hoursSpent) / totalTasks;

  // Update last active
  updatedPerformance.lastActive = Date.now();

  return {
    ...agent,
    performance: updatedPerformance,
  };
}

/**
 * Check if an agent has the required skills for a task
 */
export function hasRequiredSkills(agent: CodingAgent, requiredSkills: AgentSkill[]): boolean {
  if (requiredSkills.length === 0) return true;

  return requiredSkills.some((skill) => agent.skills.includes(skill));
}

/**
 * Get agents by skill
 */
export function getAgentsBySkill(agents: CodingAgent[], skill: AgentSkill): CodingAgent[] {
  return agents.filter((agent) => agent.skills.includes(skill));
}

/**
 * Get available agents
 */
export function getAvailableAgents(agents: CodingAgent[]): CodingAgent[] {
  return agents.filter((agent) => agent.availability === 'available');
}

/**
 * Get agent utilization statistics
 */
export function getAgentUtilization(agents: CodingAgent[]): {
  totalAgents: number;
  availableAgents: number;
  busyAgents: number;
  offlineAgents: number;
  averageSuccessRate: number;
  averageCompletionTime: number;
} {
  const available = agents.filter((a) => a.availability === 'available').length;
  const busy = agents.filter((a) => a.availability === 'busy').length;
  const offline = agents.filter((a) => a.availability === 'offline').length;

  const avgSuccessRate =
    agents.reduce((sum, a) => sum + a.performance.successRate, 0) / agents.length || 0;
  const avgCompletionTime =
    agents.reduce((sum, a) => sum + a.performance.averageCompletionTime, 0) / agents.length || 0;

  return {
    totalAgents: agents.length,
    availableAgents: available,
    busyAgents: busy,
    offlineAgents: offline,
    averageSuccessRate: avgSuccessRate,
    averageCompletionTime: avgCompletionTime,
  };
}
