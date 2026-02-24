import { CodingAgent, AgentSkill } from '@/types/agent';
import { Task } from '@/types/task';

/**
 * Auto-assignment service for matching tasks to agents
 *
 * This service considers:
 * - Agent skills and proficiency levels
 * - Agent performance metrics (task completion rate, average time)
 * - Current workload (tasks in progress)
 * - Task requirements (suggested skills, priority, risk level)
 */

interface AgentScore {
  agentId: string;
  score: number;
  reasons: string[];
}

interface AssignmentOptions {
  considerWorkload?: boolean;
  considerPerformance?: boolean;
  prioritizeExpertise?: boolean;
}

/**
 * Calculate skill match score between task requirements and agent skills
 */
function calculateSkillScore(
  taskSkills: string[],
  agentSkills: AgentSkill[]
): { score: number; matchedSkills: string[] } {
  if (taskSkills.length === 0) {
    return { score: 0.5, matchedSkills: [] }; // Neutral score if no specific skills required
  }

  const matchedSkills: string[] = [];
  let totalScore = 0;

  for (const taskSkill of taskSkills) {
    const agentSkill = agentSkills.find(
      s => s.skillName.toLowerCase() === taskSkill.toLowerCase()
    );

    if (agentSkill) {
      matchedSkills.push(taskSkill);
      // Proficiency level contributes to score (1-5 -> 0.2-1.0)
      totalScore += agentSkill.proficiencyLevel / 5;
    }
  }

  // Normalize score: (matched skills / required skills) * average proficiency
  const matchRatio = matchedSkills.length / taskSkills.length;
  const avgProficiency = matchedSkills.length > 0 ? totalScore / matchedSkills.length : 0;

  return {
    score: matchRatio * avgProficiency,
    matchedSkills
  };
}

/**
 * Calculate workload score (lower workload = higher score)
 */
function calculateWorkloadScore(agent: CodingAgent): number {
  const tasksInProgress = agent.performance?.tasksInProgress || 0;

  // Score decreases as workload increases
  if (tasksInProgress === 0) return 1.0;
  if (tasksInProgress === 1) return 0.8;
  if (tasksInProgress === 2) return 0.6;
  if (tasksInProgress === 3) return 0.4;
  return 0.2; // 4+ tasks
}

/**
 * Calculate performance score based on historical metrics
 */
function calculatePerformanceScore(agent: CodingAgent): number {
  const perf = agent.performance;
  if (!perf) return 0.5; // Neutral score if no performance data

  const successRate = perf.successRate || 50;
  const normalizedSuccessRate = successRate / 100;

  // Consider completion time efficiency
  let timeEfficiency = 0.5;
  if (perf.averageCompletionTime !== undefined) {
    // Assume optimal time is around 8 hours, penalize if much higher
    const optimalTime = 8;
    if (perf.averageCompletionTime <= optimalTime) {
      timeEfficiency = 1.0;
    } else if (perf.averageCompletionTime <= optimalTime * 2) {
      timeEfficiency = 0.8;
    } else {
      timeEfficiency = 0.6;
    }
  }

  // Weighted combination
  return normalizedSuccessRate * 0.7 + timeEfficiency * 0.3;
}

/**
 * Find the best agent for a task based on skills, workload, and performance
 */
export function findBestAgentForTask(
  task: Task,
  agents: CodingAgent[],
  taskSkills: string[] = [],
  options: AssignmentOptions = {}
): string | null {
  const {
    considerWorkload = true,
    considerPerformance = true,
    prioritizeExpertise = true
  } = options;

  if (agents.length === 0) return null;

  const scores: AgentScore[] = [];

  for (const agent of agents) {
    const reasons: string[] = [];
    let totalScore = 0;
    let weights = 0;

    // 1. Skill matching (weight: 40% or 60% if prioritizing expertise)
    const skillWeight = prioritizeExpertise ? 0.6 : 0.4;
    const { score: skillScore, matchedSkills } = calculateSkillScore(
      taskSkills,
      agent.skills || []
    );
    totalScore += skillScore * skillWeight;
    weights += skillWeight;

    if (matchedSkills.length > 0) {
      reasons.push(`Matches ${matchedSkills.length}/${taskSkills.length} required skills`);
    }

    // 2. Workload (weight: 30%)
    if (considerWorkload) {
      const workloadScore = calculateWorkloadScore(agent);
      totalScore += workloadScore * 0.3;
      weights += 0.3;

      const tasksInProgress = agent.performance?.tasksInProgress || 0;
      if (tasksInProgress === 0) {
        reasons.push('Available (no current tasks)');
      } else if (tasksInProgress <= 2) {
        reasons.push(`Light workload (${tasksInProgress} tasks)`);
      }
    }

    // 3. Performance history (weight: 30%)
    if (considerPerformance) {
      const perfScore = calculatePerformanceScore(agent);
      totalScore += perfScore * 0.3;
      weights += 0.3;

      if (agent.performance?.successRate && agent.performance.successRate >= 80) {
        reasons.push(`High success rate (${agent.performance.successRate.toFixed(0)}%)`);
      }
    }

    // Normalize final score
    const finalScore = weights > 0 ? totalScore / weights : 0;

    scores.push({
      agentId: agent.id,
      score: finalScore,
      reasons
    });
  }

  // Sort by score descending
  scores.sort((a, b) => b.score - a.score);

  // Return the best agent (highest score)
  return scores[0].score > 0 ? scores[0].agentId : null;
}

/**
 * Auto-assign agents to multiple tasks based on optimal distribution
 */
export function autoAssignAgentsToTasks(
  tasks: Task[],
  agents: CodingAgent[],
  taskSkillsMap: Map<string, string[]> = new Map()
): Map<string, string> {
  const assignments = new Map<string, string>();
  const agentWorkload = new Map<string, number>();

  // Initialize workload from current performance
  agents.forEach(agent => {
    agentWorkload.set(agent.id, agent.performance?.tasksInProgress || 0);
  });

  // Sort tasks by priority (higher priority first)
  const sortedTasks = [...tasks].sort((a, b) => b.priority - a.priority);

  for (const task of sortedTasks) {
    if (task.assignedAgentId) {
      // Already assigned, skip
      continue;
    }

    const taskSkills = taskSkillsMap.get(task.id) || task.tags || [];

    // Create temporary agent copies with updated workload
    const agentsWithWorkload = agents.map(agent => ({
      ...agent,
      performance: {
        ...(agent.performance || {
          id: '',
          agentId: agent.id,
          tasksCompleted: 0,
          tasksInProgress: agentWorkload.get(agent.id) || 0,
          createdAt: Date.now(),
          updatedAt: Date.now()
        }),
        tasksInProgress: agentWorkload.get(agent.id) || 0
      }
    }));

    const bestAgentId = findBestAgentForTask(
      task,
      agentsWithWorkload,
      taskSkills,
      { considerWorkload: true, considerPerformance: true }
    );

    if (bestAgentId) {
      assignments.set(task.id, bestAgentId);
      // Update workload for next iteration
      agentWorkload.set(bestAgentId, (agentWorkload.get(bestAgentId) || 0) + 1);
    }
  }

  return assignments;
}

/**
 * Get assignment recommendations with explanations
 */
export function getAssignmentRecommendations(
  task: Task,
  agents: CodingAgent[],
  taskSkills: string[] = []
): Array<{ agent: CodingAgent; score: number; reasons: string[] }> {
  const scores: AgentScore[] = [];

  for (const agent of agents) {
    const reasons: string[] = [];
    let totalScore = 0;

    // Skill matching
    const { score: skillScore, matchedSkills } = calculateSkillScore(
      taskSkills,
      agent.skills || []
    );
    totalScore += skillScore * 0.5;

    if (matchedSkills.length > 0) {
      reasons.push(`Skills: ${matchedSkills.join(', ')}`);
    }

    // Workload
    const workloadScore = calculateWorkloadScore(agent);
    totalScore += workloadScore * 0.25;

    const tasksInProgress = agent.performance?.tasksInProgress || 0;
    reasons.push(`Workload: ${tasksInProgress} tasks`);

    // Performance
    const perfScore = calculatePerformanceScore(agent);
    totalScore += perfScore * 0.25;

    if (agent.performance?.successRate) {
      reasons.push(`Success rate: ${agent.performance.successRate.toFixed(0)}%`);
    }

    scores.push({
      agentId: agent.id,
      score: totalScore,
      reasons
    });
  }

  // Sort by score descending
  scores.sort((a, b) => b.score - a.score);

  return scores.map(s => ({
    agent: agents.find(a => a.id === s.agentId)!,
    score: s.score,
    reasons: s.reasons
  }));
}
