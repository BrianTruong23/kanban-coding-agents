import { CodingAgent } from '@/types/agent';
import { Task } from '@/types/task';
import {
  AgentSkill,
  AgentPerformance,
  AgentRecommendation,
  AgentRosterFilter,
  SkillLevel,
} from '@/types/breakdown';

/**
 * Agent Orchestration Service
 *
 * Handles agent roster management, skill-based assignment, and performance tracking.
 */

// Skill level weights for scoring
const SKILL_LEVEL_WEIGHTS: Record<SkillLevel, number> = {
  beginner: 25,
  intermediate: 50,
  advanced: 75,
  expert: 100,
};

/**
 * Calculate match score between an agent and required skills
 */
export function calculateMatchScore(
  agent: CodingAgent,
  requiredSkills: string[]
): { score: number; reasons: string[] } {
  if (!agent.skills || agent.skills.length === 0) {
    return { score: 0, reasons: ['Agent has no defined skills'] };
  }

  if (requiredSkills.length === 0) {
    return { score: 50, reasons: ['No specific skills required'] };
  }

  let totalScore = 0;
  const reasons: string[] = [];
  const matchedSkills: string[] = [];
  const missingSkills: string[] = [];

  // Check each required skill
  for (const requiredSkill of requiredSkills) {
    const agentSkill = agent.skills.find(
      (s) => s.skillName.toLowerCase() === requiredSkill.toLowerCase()
    );

    if (agentSkill) {
      const skillScore = SKILL_LEVEL_WEIGHTS[agentSkill.level];
      totalScore += skillScore;
      matchedSkills.push(`${requiredSkill} (${agentSkill.level})`);
    } else {
      missingSkills.push(requiredSkill);
    }
  }

  // Calculate average score
  const maxPossibleScore = requiredSkills.length * 100;
  const matchScore = Math.round((totalScore / maxPossibleScore) * 100);

  // Build reasons
  if (matchedSkills.length > 0) {
    reasons.push(`Has skills: ${matchedSkills.join(', ')}`);
  }
  if (missingSkills.length > 0) {
    reasons.push(`Missing: ${missingSkills.join(', ')}`);
  }

  // Factor in performance if available
  let finalScore = matchScore;
  if (agent.performance) {
    const performanceBonus = Math.round(agent.performance.qualityScore * 0.2); // Up to 20% bonus
    finalScore = Math.min(100, matchScore + performanceBonus);
    if (performanceBonus > 0) {
      reasons.push(`+${performanceBonus}% performance bonus (quality: ${agent.performance.qualityScore})`);
    }
  }

  return { score: finalScore, reasons };
}

/**
 * Get agent availability status
 */
export function getAgentAvailability(
  agent: CodingAgent,
  allTasks: Task[]
): { status: 'available' | 'busy'; estimatedAvailableAt?: number } {
  // Count active tasks (not done)
  const activeTasks = allTasks.filter(
    (task) => task.assignedAgentId === agent.id && task.status !== 'done'
  );

  if (activeTasks.length === 0) {
    return { status: 'available' };
  }

  // Agent is busy if they have 3+ active tasks
  if (activeTasks.length >= 3) {
    // Estimate when they'll be available (rough estimate based on oldest task)
    const oldestTask = activeTasks.sort((a, b) => a.createdAt - b.createdAt)[0];
    const estimatedAvailableAt = oldestTask.createdAt + 7 * 24 * 60 * 60 * 1000; // 7 days
    return { status: 'busy', estimatedAvailableAt };
  }

  return { status: 'available' };
}

/**
 * Find best agents for a task
 */
export function recommendAgents(
  task: Task,
  requiredSkills: string[],
  agents: CodingAgent[],
  allTasks: Task[],
  maxRecommendations: number = 5
): AgentRecommendation[] {
  const recommendations: AgentRecommendation[] = [];

  for (const agent of agents) {
    const { score, reasons } = calculateMatchScore(agent, requiredSkills);
    const availability = getAgentAvailability(agent, allTasks);

    // Boost score slightly for available agents
    let finalScore = score;
    if (availability.status === 'available') {
      finalScore = Math.min(100, score + 5);
      reasons.push('Currently available');
    } else {
      reasons.push(`Busy with ${allTasks.filter(t => t.assignedAgentId === agent.id && t.status !== 'done').length} tasks`);
    }

    recommendations.push({
      agentId: agent.id,
      matchScore: finalScore,
      reasons,
      availability: availability.status,
      estimatedAvailableAt: availability.estimatedAvailableAt,
    });
  }

  // Sort by score (descending) and return top N
  return recommendations
    .sort((a, b) => {
      // Prioritize available agents, then by score
      if (a.availability === 'available' && b.availability !== 'available') return -1;
      if (a.availability !== 'available' && b.availability === 'available') return 1;
      return b.matchScore - a.matchScore;
    })
    .slice(0, maxRecommendations);
}

/**
 * Auto-assign an agent to a task based on skills and availability
 */
export function autoAssignAgent(
  task: Task,
  requiredSkills: string[],
  agents: CodingAgent[],
  allTasks: Task[]
): { agentId: string; matchScore: number; reasons: string[] } | null {
  const recommendations = recommendAgents(task, requiredSkills, agents, allTasks, 1);

  if (recommendations.length === 0) {
    return null;
  }

  const best = recommendations[0];

  // Only auto-assign if match score is above 60%
  if (best.matchScore < 60) {
    return null;
  }

  return {
    agentId: best.agentId,
    matchScore: best.matchScore,
    reasons: best.reasons,
  };
}

/**
 * Filter agents based on criteria
 */
export function filterAgents(
  agents: CodingAgent[],
  allTasks: Task[],
  filter: AgentRosterFilter
): CodingAgent[] {
  let filtered = [...agents];

  // Filter by skills
  if (filter.skills && filter.skills.length > 0) {
    filtered = filtered.filter((agent) => {
      if (!agent.skills) return false;
      return filter.skills!.some((requiredSkill) =>
        agent.skills!.some(
          (s) => s.skillName.toLowerCase() === requiredSkill.toLowerCase()
        )
      );
    });
  }

  // Filter by quality score
  if (filter.minQualityScore !== undefined) {
    filtered = filtered.filter(
      (agent) =>
        agent.performance && agent.performance.qualityScore >= filter.minQualityScore!
    );
  }

  // Filter by availability
  if (filter.availability && filter.availability !== 'all') {
    filtered = filtered.filter((agent) => {
      const availability = getAgentAvailability(agent, allTasks);
      return availability.status === filter.availability;
    });
  }

  return filtered;
}

/**
 * Update agent performance after task completion
 */
export function updatePerformanceAfterTask(
  currentPerformance: AgentPerformance,
  task: Task,
  completedOnTime: boolean,
  actualHours: number
): AgentPerformance {
  const newTasksCompleted = currentPerformance.tasksCompleted + 1;
  const newTasksOnTime = completedOnTime
    ? currentPerformance.tasksOnTime + 1
    : currentPerformance.tasksOnTime;

  // Calculate new average completion time
  const totalHours =
    currentPerformance.averageCompletionTime * currentPerformance.tasksCompleted;
  const newAverageCompletionTime =
    (totalHours + actualHours) / newTasksCompleted;

  // Calculate quality score (simple heuristic)
  // Quality = (on-time rate * 0.7) + (speed bonus * 0.3)
  const onTimeRate = (newTasksOnTime / newTasksCompleted) * 100;
  const speedBonus = actualHours <= newAverageCompletionTime ? 100 : 80;
  const newQualityScore = Math.round(onTimeRate * 0.7 + speedBonus * 0.3);

  return {
    ...currentPerformance,
    tasksCompleted: newTasksCompleted,
    tasksOnTime: newTasksOnTime,
    averageCompletionTime: newAverageCompletionTime,
    qualityScore: Math.min(100, Math.max(0, newQualityScore)),
    lastUpdated: Date.now(),
  };
}

/**
 * Get agent leaderboard
 */
export function getAgentLeaderboard(
  agents: CodingAgent[]
): Array<{
  agent: CodingAgent;
  rank: number;
  score: number;
  stats: {
    tasksCompleted: number;
    qualityScore: number;
    onTimeRate: number;
  };
}> {
  const agentsWithPerformance = agents.filter((a) => a.performance);

  const leaderboard = agentsWithPerformance
    .map((agent) => {
      const perf = agent.performance!;
      const onTimeRate =
        perf.tasksCompleted > 0
          ? Math.round((perf.tasksOnTime / perf.tasksCompleted) * 100)
          : 0;

      // Overall score: weighted average of quality and on-time rate
      const score = Math.round(perf.qualityScore * 0.6 + onTimeRate * 0.4);

      return {
        agent,
        rank: 0, // Will be set below
        score,
        stats: {
          tasksCompleted: perf.tasksCompleted,
          qualityScore: perf.qualityScore,
          onTimeRate,
        },
      };
    })
    .sort((a, b) => b.score - a.score);

  // Assign ranks
  leaderboard.forEach((item, index) => {
    item.rank = index + 1;
  });

  return leaderboard;
}

/**
 * Get suggested skill improvements for an agent
 */
export function suggestSkillImprovements(
  agent: CodingAgent,
  allTasks: Task[],
  requiredSkillsAcrossTasks: string[][]
): string[] {
  const suggestions: string[] = [];

  // Count skill frequency across all tasks
  const skillFrequency: Record<string, number> = {};
  for (const skills of requiredSkillsAcrossTasks) {
    for (const skill of skills) {
      skillFrequency[skill] = (skillFrequency[skill] || 0) + 1;
    }
  }

  // Get agent's current skills
  const agentSkillNames = agent.skills?.map((s) => s.skillName.toLowerCase()) || [];

  // Find top missing skills
  const missingSkills = Object.entries(skillFrequency)
    .filter(([skill]) => !agentSkillNames.includes(skill.toLowerCase()))
    .sort(([, a], [, b]) => b - a)
    .slice(0, 3)
    .map(([skill]) => skill);

  if (missingSkills.length > 0) {
    suggestions.push(`Consider learning: ${missingSkills.join(', ')}`);
  }

  // Find skills to upgrade (beginner/intermediate -> advanced/expert)
  const skillsToUpgrade = agent.skills?.filter(
    (s) => s.level === 'beginner' || s.level === 'intermediate'
  );

  if (skillsToUpgrade && skillsToUpgrade.length > 0) {
    suggestions.push(
      `Consider advancing: ${skillsToUpgrade.map((s) => s.skillName).join(', ')}`
    );
  }

  return suggestions;
}
