import { CodingAgent, AgentSkill, AgentPerformance } from '@/types/agent';

export interface AssignmentCandidate {
  agent: CodingAgent;
  score: number;
  matchedSkills: string[];
  reasoning: string;
}

export interface TaskRequirements {
  requiredSkills: string[];
  priority: 1 | 2 | 3 | 4 | 5;
  estimatedHours?: number;
}

/**
 * Intelligently assigns the best agent to a task based on:
 * 1. Skill matching and proficiency
 * 2. Current workload and availability
 * 3. Past performance and success rate
 * 4. Task priority
 */
export function assignBestAgent(
  agents: CodingAgent[],
  requirements: TaskRequirements,
  currentAssignments: Map<string, number> = new Map()
): AssignmentCandidate | null {
  if (agents.length === 0) {
    return null;
  }

  const candidates: AssignmentCandidate[] = agents.map((agent) => {
    let score = 0;
    const matchedSkills: string[] = [];
    const reasons: string[] = [];

    // 1. Skill Matching (40% weight)
    const skillScore = calculateSkillScore(agent, requirements.requiredSkills, matchedSkills);
    score += skillScore * 0.4;
    if (skillScore > 0) {
      reasons.push(`${matchedSkills.length}/${requirements.requiredSkills.length} skills matched`);
    }

    // 2. Performance History (30% weight)
    const performanceScore = calculatePerformanceScore(agent);
    score += performanceScore * 0.3;
    if (agent.performance) {
      reasons.push(`${agent.performance.successRate.toFixed(0)}% success rate`);
    }

    // 3. Workload Balance (20% weight)
    const workloadScore = calculateWorkloadScore(agent.id, currentAssignments);
    score += workloadScore * 0.2;
    const currentLoad = currentAssignments.get(agent.id) || 0;
    if (currentLoad > 0) {
      reasons.push(`${currentLoad} current tasks`);
    }

    // 4. Availability (10% weight)
    const availabilityScore = calculateAvailabilityScore(agent, currentAssignments);
    score += availabilityScore * 0.1;

    // Bonus: Perfect skill match
    if (matchedSkills.length === requirements.requiredSkills.length) {
      score += 10;
      reasons.push('perfect skill match');
    }

    // Priority multiplier for high-priority tasks
    if (requirements.priority >= 4) {
      score *= 1.2;
    }

    return {
      agent,
      score,
      matchedSkills,
      reasoning: reasons.join(', '),
    };
  });

  // Sort by score descending
  candidates.sort((a, b) => b.score - a.score);

  // Return the best candidate
  return candidates[0];
}

/**
 * Calculate how well an agent's skills match the requirements
 * Returns a score from 0-100
 */
function calculateSkillScore(
  agent: CodingAgent,
  requiredSkills: string[],
  matchedSkills: string[]
): number {
  if (requiredSkills.length === 0) {
    return 50; // Neutral score if no specific skills required
  }

  if (!agent.skills || agent.skills.length === 0) {
    return 0; // No skills defined
  }

  let totalScore = 0;
  const skillMap = new Map(agent.skills.map((s) => [s.skillName.toLowerCase(), s]));

  for (const requiredSkill of requiredSkills) {
    const normalizedSkill = requiredSkill.toLowerCase();
    const agentSkill = skillMap.get(normalizedSkill);

    if (agentSkill) {
      // Skill found - score based on proficiency (1-5 maps to 10-50 points)
      totalScore += agentSkill.proficiency * 10;
      matchedSkills.push(requiredSkill);
    } else {
      // Check for partial matches (e.g., "react" matches "react-native")
      for (const [skillName, skill] of skillMap.entries()) {
        if (
          skillName.includes(normalizedSkill) ||
          normalizedSkill.includes(skillName)
        ) {
          totalScore += skill.proficiency * 5; // Half points for partial match
          matchedSkills.push(requiredSkill);
          break;
        }
      }
    }
  }

  // Normalize to 0-100 scale
  return Math.min(100, (totalScore / requiredSkills.length));
}

/**
 * Calculate performance score based on past history
 * Returns a score from 0-100
 */
function calculatePerformanceScore(agent: CodingAgent): number {
  if (!agent.performance) {
    return 50; // Neutral score for agents without history
  }

  const perf = agent.performance;

  // Base score from success rate
  let score = perf.successRate;

  // Bonus for experience (more tasks completed)
  if (perf.tasksCompleted > 10) {
    score += 5;
  }
  if (perf.tasksCompleted > 50) {
    score += 5;
  }

  // Penalty for slow completion (if average time is very high)
  if (perf.averageCompletionTimeHours > 40) {
    score -= 10;
  }

  return Math.max(0, Math.min(100, score));
}

/**
 * Calculate workload score - agents with fewer assignments score higher
 * Returns a score from 0-100
 */
function calculateWorkloadScore(
  agentId: string,
  currentAssignments: Map<string, number>
): number {
  const currentLoad = currentAssignments.get(agentId) || 0;

  // Score decreases as workload increases
  // 0 tasks = 100, 1 task = 80, 2 tasks = 60, 3 tasks = 40, 4+ tasks = 20
  if (currentLoad === 0) return 100;
  if (currentLoad === 1) return 80;
  if (currentLoad === 2) return 60;
  if (currentLoad === 3) return 40;
  return 20;
}

/**
 * Calculate availability score
 * Returns a score from 0-100
 */
function calculateAvailabilityScore(
  agent: CodingAgent,
  currentAssignments: Map<string, number>
): number {
  const currentLoad = currentAssignments.get(agent.id) || 0;

  // Simple availability: agents with >5 tasks are considered at capacity
  if (currentLoad >= 5) return 0;
  if (currentLoad >= 3) return 50;
  return 100;
}

/**
 * Get current workload map from tasks
 */
export function getWorkloadMap(
  tasks: Array<{ assignedAgentId?: string; status: string }>
): Map<string, number> {
  const workloadMap = new Map<string, number>();

  for (const task of tasks) {
    // Only count active tasks (not done)
    if (task.assignedAgentId && task.status !== 'done' && task.status !== 'completed') {
      const current = workloadMap.get(task.assignedAgentId) || 0;
      workloadMap.set(task.assignedAgentId, current + 1);
    }
  }

  return workloadMap;
}

/**
 * Batch assign agents to multiple tasks optimally
 */
export function batchAssignAgents(
  agents: CodingAgent[],
  tasks: Array<TaskRequirements & { id: string }>,
  existingTasks: Array<{ assignedAgentId?: string; status: string }>
): Map<string, string> {
  const assignments = new Map<string, string>();
  const workloadMap = getWorkloadMap(existingTasks);

  // Sort tasks by priority (high to low)
  const sortedTasks = [...tasks].sort((a, b) => b.priority - a.priority);

  for (const task of sortedTasks) {
    const candidate = assignBestAgent(agents, task, workloadMap);

    if (candidate) {
      assignments.set(task.id, candidate.agent.id);

      // Update workload map
      const current = workloadMap.get(candidate.agent.id) || 0;
      workloadMap.set(candidate.agent.id, current + 1);
    }
  }

  return assignments;
}
