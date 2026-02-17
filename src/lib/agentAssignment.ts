import { CodingAgent, AgentSkill, AgentPerformance, AgentAssignmentScore } from '@/types/agent';
import { Task } from '@/types/task';

/**
 * Agent Assignment Service
 * Handles automatic agent assignment based on skills and performance
 */

interface AssignmentContext {
  task: Task;
  agents: CodingAgent[];
  agentSkills: Map<string, AgentSkill[]>;
  agentPerformance: Map<string, AgentPerformance[]>;
  currentWorkload: Map<string, number>; // agentId -> number of active tasks
}

/**
 * Calculate how well an agent's skills match a task
 */
function calculateSkillMatch(task: Task, agentSkills: AgentSkill[]): {
  score: number;
  matches: string[];
} {
  if (agentSkills.length === 0) {
    return { score: 0, matches: [] };
  }

  const taskText = `${task.title} ${task.description} ${task.tags.join(' ')}`.toLowerCase();
  let totalScore = 0;
  const matches: string[] = [];

  agentSkills.forEach(skill => {
    const skillName = skill.skillName.toLowerCase();

    // Check if skill is relevant to the task
    if (taskText.includes(skillName)) {
      // Weight by proficiency level (1-5)
      const skillScore = skill.proficiencyLevel * 20; // Max 100 per skill
      totalScore += skillScore;
      matches.push(`${skill.skillName} (L${skill.proficiencyLevel})`);
    }

    // Check by category
    if (task.tags.some(tag => tag.toLowerCase() === skill.skillCategory)) {
      const categoryScore = skill.proficiencyLevel * 10; // Max 50 per category
      totalScore += categoryScore;
      if (!matches.includes(`${skill.skillName} (L${skill.proficiencyLevel})`)) {
        matches.push(`${skill.skillName} (L${skill.proficiencyLevel})`);
      }
    }
  });

  // Normalize score to 0-100 scale
  const normalizedScore = Math.min(100, totalScore);

  return {
    score: normalizedScore,
    matches,
  };
}

/**
 * Calculate agent performance metrics
 */
function calculatePerformanceScore(performances: AgentPerformance[]): {
  qualityScore: number;
  efficiencyScore: number;
  onTimeRate: number;
  totalTasks: number;
} {
  if (performances.length === 0) {
    return {
      qualityScore: 3, // Default neutral score
      efficiencyScore: 3,
      onTimeRate: 1.0,
      totalTasks: 0,
    };
  }

  const completed = performances.filter(p => p.completedAt);
  const totalTasks = completed.length;

  if (totalTasks === 0) {
    return {
      qualityScore: 3,
      efficiencyScore: 3,
      onTimeRate: 1.0,
      totalTasks: 0,
    };
  }

  // Calculate averages
  const avgQuality = completed.reduce((sum, p) => sum + (p.qualityScore || 3), 0) / totalTasks;
  const avgEfficiency = completed.reduce((sum, p) => sum + (p.efficiencyScore || 3), 0) / totalTasks;
  const onTimeCount = completed.filter(p => p.onTime).length;
  const onTimeRate = onTimeCount / totalTasks;

  return {
    qualityScore: avgQuality,
    efficiencyScore: avgEfficiency,
    onTimeRate,
    totalTasks,
  };
}

/**
 * Calculate agent availability score based on current workload
 */
function calculateAvailabilityScore(currentWorkload: number): number {
  // The more tasks an agent has, the lower their availability
  // 0 tasks = 100% available, 5+ tasks = 20% available
  if (currentWorkload === 0) return 100;
  if (currentWorkload === 1) return 80;
  if (currentWorkload === 2) return 60;
  if (currentWorkload === 3) return 40;
  if (currentWorkload === 4) return 30;
  return 20; // 5+ tasks
}

/**
 * Calculate overall assignment score for an agent
 */
function calculateAssignmentScore(context: AssignmentContext, agent: CodingAgent): AgentAssignmentScore {
  const agentSkills = context.agentSkills.get(agent.id) || [];
  const agentPerformances = context.agentPerformance.get(agent.id) || [];
  const workload = context.currentWorkload.get(agent.id) || 0;

  // Calculate component scores
  const skillMatch = calculateSkillMatch(context.task, agentSkills);
  const performance = calculatePerformanceScore(agentPerformances);
  const availability = calculateAvailabilityScore(workload);

  // Weights for different factors
  const SKILL_WEIGHT = 0.5; // 50% - most important
  const QUALITY_WEIGHT = 0.15; // 15%
  const EFFICIENCY_WEIGHT = 0.1; // 10%
  const ON_TIME_WEIGHT = 0.1; // 10%
  const AVAILABILITY_WEIGHT = 0.15; // 15%

  // Calculate weighted score (0-100)
  const score =
    skillMatch.score * SKILL_WEIGHT +
    (performance.qualityScore / 5) * 100 * QUALITY_WEIGHT +
    (performance.efficiencyScore / 5) * 100 * EFFICIENCY_WEIGHT +
    performance.onTimeRate * 100 * ON_TIME_WEIGHT +
    availability * AVAILABILITY_WEIGHT;

  // Generate reasons for the assignment
  const reasons: string[] = [];

  if (skillMatch.score > 60) {
    reasons.push(`Strong skill match (${Math.round(skillMatch.score)}%)`);
  } else if (skillMatch.score > 30) {
    reasons.push(`Moderate skill match (${Math.round(skillMatch.score)}%)`);
  }

  if (performance.totalTasks > 5) {
    if (performance.qualityScore >= 4) {
      reasons.push(`High quality track record (${performance.qualityScore.toFixed(1)}/5)`);
    }
    if (performance.onTimeRate >= 0.8) {
      reasons.push(`Reliable delivery (${Math.round(performance.onTimeRate * 100)}% on time)`);
    }
  }

  if (availability >= 80) {
    reasons.push('High availability');
  } else if (availability < 40) {
    reasons.push('Currently busy');
  }

  if (reasons.length === 0) {
    reasons.push('Available agent');
  }

  return {
    agentId: agent.id,
    score: Math.round(score),
    reasons,
    skillMatches: skillMatch.matches,
    performanceFactors: {
      qualityScore: performance.qualityScore,
      efficiencyScore: performance.efficiencyScore,
      onTimeRate: performance.onTimeRate,
      availability: availability / 100,
    },
  };
}

/**
 * Find the best agent for a task
 */
export function findBestAgent(context: AssignmentContext): AgentAssignmentScore | null {
  if (context.agents.length === 0) {
    return null;
  }

  const scores = context.agents.map(agent => calculateAssignmentScore(context, agent));

  // Sort by score descending
  scores.sort((a, b) => b.score - a.score);

  return scores[0];
}

/**
 * Rank all agents for a task
 */
export function rankAgentsForTask(context: AssignmentContext): AgentAssignmentScore[] {
  const scores = context.agents.map(agent => calculateAssignmentScore(context, agent));

  // Sort by score descending
  scores.sort((a, b) => b.score - a.score);

  return scores;
}

/**
 * Auto-assign a task to the best agent
 */
export function autoAssignTask(
  task: Task,
  agents: CodingAgent[],
  agentSkills: Map<string, AgentSkill[]>,
  agentPerformance: Map<string, AgentPerformance[]>,
  currentWorkload: Map<string, number>
): string | null {
  const context: AssignmentContext = {
    task,
    agents,
    agentSkills,
    agentPerformance,
    currentWorkload,
  };

  const bestMatch = findBestAgent(context);

  // Only auto-assign if the score is above a threshold
  const MIN_SCORE_THRESHOLD = 30;

  if (bestMatch && bestMatch.score >= MIN_SCORE_THRESHOLD) {
    return bestMatch.agentId;
  }

  return null;
}

/**
 * Suggest agents for a task with explanations
 */
export function suggestAgents(
  task: Task,
  agents: CodingAgent[],
  agentSkills: Map<string, AgentSkill[]>,
  agentPerformance: Map<string, AgentPerformance[]>,
  currentWorkload: Map<string, number>,
  topN: number = 3
): AgentAssignmentScore[] {
  const context: AssignmentContext = {
    task,
    agents,
    agentSkills,
    agentPerformance,
    currentWorkload,
  };

  const rankings = rankAgentsForTask(context);

  return rankings.slice(0, topN);
}

/**
 * Batch assign multiple tasks to agents
 */
export function batchAssignTasks(
  tasks: Task[],
  agents: CodingAgent[],
  agentSkills: Map<string, AgentSkill[]>,
  agentPerformance: Map<string, AgentPerformance[]>
): Map<string, string> {
  const assignments = new Map<string, string>(); // taskId -> agentId
  const workload = new Map<string, number>(); // agentId -> count

  // Initialize workload
  agents.forEach(agent => workload.set(agent.id, 0));

  // Sort tasks by priority (high to low)
  const sortedTasks = [...tasks].sort((a, b) => b.priority - a.priority);

  sortedTasks.forEach(task => {
    const agentId = autoAssignTask(task, agents, agentSkills, agentPerformance, workload);

    if (agentId) {
      assignments.set(task.id, agentId);
      // Update workload
      workload.set(agentId, (workload.get(agentId) || 0) + 1);
    }
  });

  return assignments;
}
