import { Task } from '@/types/task';
import { CodingAgent, AgentSkillMatch, AgentAssignmentSuggestion } from '@/types/agent';

/**
 * Agent Assignment Service
 * Automatically assigns tasks to agents based on skills, performance, and workload
 */

/**
 * Calculate skill match score between an agent and a task
 */
function calculateSkillMatch(agent: CodingAgent, task: Task): {
  score: number;
  matchedSkills: string[];
  missingSkills: string[];
} {
  const agentSkills = new Set(agent.skills || []);
  const requiredSkills = task.requiredSkills || [];

  if (requiredSkills.length === 0) {
    return { score: 75, matchedSkills: [], missingSkills: [] };
  }

  const matchedSkills: string[] = [];
  const missingSkills: string[] = [];

  for (const skill of requiredSkills) {
    if (agentSkills.has(skill)) {
      matchedSkills.push(skill);
    } else {
      missingSkills.push(skill);
    }
  }

  const matchScore = requiredSkills.length > 0
    ? (matchedSkills.length / requiredSkills.length) * 100
    : 0;

  return { score: matchScore, matchedSkills, missingSkills };
}

/**
 * Calculate agent workload based on assigned tasks
 */
function calculateWorkload(agent: CodingAgent, allTasks: Task[]): number {
  const assignedTasks = allTasks.filter(
    task => task.assignedAgentId === agent.id && task.status !== 'done'
  );

  const totalEstimatedHours = assignedTasks.reduce(
    (sum, task) => sum + (task.estimatedHours || 8),
    0
  );

  return totalEstimatedHours;
}

/**
 * Generate recommendation reason
 */
function generateRecommendationReason(
  agent: CodingAgent,
  skillMatch: ReturnType<typeof calculateSkillMatch>,
  performanceScore: number,
  workload: number
): string {
  const reasons: string[] = [];

  if (skillMatch.score === 100) {
    reasons.push('Perfect skill match');
  } else if (skillMatch.score >= 75) {
    reasons.push('Strong skill match');
  } else if (skillMatch.score >= 50) {
    reasons.push('Good skill match');
  }

  if (performanceScore >= 90) {
    reasons.push('excellent track record');
  } else if (performanceScore >= 75) {
    reasons.push('good performance history');
  }

  if (workload === 0) {
    reasons.push('currently available');
  } else if (workload < 40) {
    reasons.push('light workload');
  } else if (workload < 80) {
    reasons.push('moderate workload');
  }

  if (skillMatch.matchedSkills.length > 0) {
    const topSkills = skillMatch.matchedSkills.slice(0, 2).join(', ');
    reasons.push(`experienced in ${topSkills}`);
  }

  return reasons.join('; ') || 'General availability';
}

/**
 * Find best agent match for a task
 */
export function findBestAgentMatch(
  task: Task,
  agents: CodingAgent[],
  allTasks: Task[]
): AgentSkillMatch[] {
  const matches: AgentSkillMatch[] = [];

  for (const agent of agents) {
    const skillMatch = calculateSkillMatch(agent, task);
    const performanceScore = agent.performanceScore || 75;
    const workload = calculateWorkload(agent, allTasks);

    // Calculate composite score
    // 50% skill match, 30% performance, 20% workload availability
    const workloadScore = Math.max(0, 100 - workload);
    const compositeScore =
      (skillMatch.score * 0.5) +
      (performanceScore * 0.3) +
      (workloadScore * 0.2);

    const recommendationReason = generateRecommendationReason(
      agent,
      skillMatch,
      performanceScore,
      workload
    );

    matches.push({
      agentId: agent.id,
      matchScore: Math.round(compositeScore),
      matchedSkills: skillMatch.matchedSkills,
      missingSkills: skillMatch.missingSkills,
      performanceScore,
      currentWorkload: workload,
      recommendationReason
    });
  }

  // Sort by composite score
  matches.sort((a, b) => b.matchScore - a.matchScore);

  return matches;
}

/**
 * Auto-assign tasks based on agent availability and skills
 */
export function autoAssignTasks(
  tasks: Task[],
  agents: CodingAgent[],
  threshold = 70
): AgentAssignmentSuggestion[] {
  const suggestions: AgentAssignmentSuggestion[] = [];
  const unassignedTasks = tasks.filter(task => !task.assignedAgentId);

  for (const task of unassignedTasks) {
    const matches = findBestAgentMatch(task, agents, tasks);
    const bestMatch = matches[0];

    suggestions.push({
      taskId: task.id,
      suggestedAgents: matches.slice(0, 3), // Top 3 suggestions
      autoAssignBestMatch: bestMatch && bestMatch.matchScore >= threshold
    });
  }

  return suggestions;
}

/**
 * Update agent performance based on task completion
 */
export function updateAgentPerformance(
  agent: CodingAgent,
  task: Task,
  quality: 'excellent' | 'good' | 'average' | 'poor' = 'good'
): Partial<CodingAgent> {
  const qualityScores = {
    excellent: 100,
    good: 85,
    average: 70,
    poor: 50
  };

  const currentScore = agent.performanceScore || 75;
  const currentCompleted = agent.tasksCompleted || 0;
  const currentAvgTime = agent.averageCompletionTime || 24;

  // Calculate new performance score (weighted average)
  const newScore = Math.round(
    (currentScore * currentCompleted + qualityScores[quality]) /
    (currentCompleted + 1)
  );

  // Calculate new average completion time
  const actualHours = task.actualHours || task.estimatedHours || 24;
  const newAvgTime =
    (currentAvgTime * currentCompleted + actualHours) /
    (currentCompleted + 1);

  return {
    performanceScore: Math.min(100, Math.max(0, newScore)),
    tasksCompleted: currentCompleted + 1,
    averageCompletionTime: Math.round(newAvgTime * 10) / 10
  };
}

/**
 * Suggest skill improvements for agents based on task requirements
 */
export function suggestSkillImprovements(
  agent: CodingAgent,
  recentTasks: Task[]
): string[] {
  const agentSkills = new Set(agent.skills || []);
  const skillGaps: Record<string, number> = {};

  // Track skills that were required but missing
  for (const task of recentTasks) {
    if (task.assignedAgentId === agent.id) {
      for (const skill of task.requiredSkills || []) {
        if (!agentSkills.has(skill)) {
          skillGaps[skill] = (skillGaps[skill] || 0) + 1;
        }
      }
    }
  }

  // Return top 3 most frequently needed skills
  return Object.entries(skillGaps)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 3)
    .map(([skill]) => skill);
}

/**
 * Balance workload across agents
 */
export function balanceWorkload(
  tasks: Task[],
  agents: CodingAgent[]
): Record<string, number> {
  const workloadByAgent: Record<string, number> = {};

  for (const agent of agents) {
    workloadByAgent[agent.id] = calculateWorkload(agent, tasks);
  }

  return workloadByAgent;
}

/**
 * Recommend task reassignment to balance workload
 */
export function recommendReassignments(
  tasks: Task[],
  agents: CodingAgent[],
  threshold = 40
): Array<{ taskId: string; fromAgentId: string; toAgentId: string; reason: string }> {
  const workload = balanceWorkload(tasks, agents);
  const recommendations: Array<{ taskId: string; fromAgentId: string; toAgentId: string; reason: string }> = [];

  const overloadedAgents = agents.filter(agent => workload[agent.id] > threshold * 2);
  const availableAgents = agents.filter(agent => workload[agent.id] < threshold);

  for (const overloadedAgent of overloadedAgents) {
    const agentTasks = tasks.filter(
      task => task.assignedAgentId === overloadedAgent.id && task.status === 'backlog'
    );

    for (const task of agentTasks.slice(0, 2)) {
      const matches = findBestAgentMatch(task, availableAgents, tasks);
      if (matches.length > 0 && matches[0].matchScore >= 60) {
        recommendations.push({
          taskId: task.id,
          fromAgentId: overloadedAgent.id,
          toAgentId: matches[0].agentId,
          reason: `Balance workload: ${overloadedAgent.name} (${Math.round(workload[overloadedAgent.id])}h) → available agent`
        });
      }
    }
  }

  return recommendations;
}
