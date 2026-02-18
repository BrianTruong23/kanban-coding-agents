/**
 * Agent orchestration service for automatic task assignment
 * based on agent skills, performance, and availability
 */

import { CodingAgent, AgentStats, AgentPerformance } from '@/types/agent';
import { Task } from '@/types/task';

export interface AssignmentScore {
  agentId: string;
  score: number;
  reasons: string[];
}

export interface AssignmentRecommendation {
  taskId: string;
  recommendations: AssignmentScore[];
  autoAssignedAgentId?: string;
}

/**
 * Calculate agent suitability score for a task
 */
export function calculateAgentScore(
  agent: CodingAgent,
  task: Task,
  agentStats?: AgentStats,
  allAgentStats?: AgentStats[]
): AssignmentScore {
  let score = 50; // Base score
  const reasons: string[] = [];

  // 1. Skill matching (up to +30 points)
  if (task.requiredSkills && task.requiredSkills.length > 0 && agent.skills) {
    const matchingSkills = task.requiredSkills.filter(skill =>
      agent.skills?.some(agentSkill =>
        agentSkill.toLowerCase().includes(skill.toLowerCase()) ||
        skill.toLowerCase().includes(agentSkill.toLowerCase())
      )
    );

    const skillMatchRatio = matchingSkills.length / task.requiredSkills.length;
    const skillPoints = Math.round(skillMatchRatio * 30);
    score += skillPoints;

    if (skillMatchRatio > 0.8) {
      reasons.push(`Excellent skill match (${matchingSkills.length}/${task.requiredSkills.length} skills)`);
    } else if (skillMatchRatio > 0.5) {
      reasons.push(`Good skill match (${matchingSkills.length}/${task.requiredSkills.length} skills)`);
    } else if (skillMatchRatio > 0) {
      reasons.push(`Partial skill match (${matchingSkills.length}/${task.requiredSkills.length} skills)`);
    }

    // Skill proficiency bonus (up to +10 points)
    if (agent.skillLevels && matchingSkills.length > 0) {
      const avgProficiency = matchingSkills.reduce((sum, skill) => {
        const matchingAgentSkill = agent.skills?.find(s =>
          s.toLowerCase().includes(skill.toLowerCase()) ||
          skill.toLowerCase().includes(s.toLowerCase())
        );
        return sum + (agent.skillLevels?.[matchingAgentSkill || ''] || 3);
      }, 0) / matchingSkills.length;

      const proficiencyPoints = Math.round((avgProficiency / 5) * 10);
      score += proficiencyPoints;

      if (avgProficiency >= 4) {
        reasons.push('Expert level proficiency');
      }
    }
  } else if (!task.requiredSkills || task.requiredSkills.length === 0) {
    // No specific skills required
    score += 15;
    reasons.push('No specific skills required');
  }

  // 2. Performance history (up to +20 points)
  if (agentStats) {
    // Quality score bonus
    if (agentStats.averageQualityScore >= 4.5) {
      score += 10;
      reasons.push(`Excellent quality score (${agentStats.averageQualityScore.toFixed(1)}/5)`);
    } else if (agentStats.averageQualityScore >= 4.0) {
      score += 7;
      reasons.push(`High quality score (${agentStats.averageQualityScore.toFixed(1)}/5)`);
    } else if (agentStats.averageQualityScore >= 3.5) {
      score += 4;
    }

    // On-time delivery bonus
    if (agentStats.onTimePercentage >= 90) {
      score += 10;
      reasons.push(`Excellent on-time delivery (${agentStats.onTimePercentage.toFixed(0)}%)`);
    } else if (agentStats.onTimePercentage >= 75) {
      score += 5;
      reasons.push(`Good on-time delivery (${agentStats.onTimePercentage.toFixed(0)}%)`);
    }
  }

  // 3. Availability (up to +15 points, or penalty)
  const availability = agent.availability ?? 100;
  if (availability >= 80) {
    score += 15;
    reasons.push('High availability');
  } else if (availability >= 50) {
    score += 8;
    reasons.push('Moderate availability');
  } else if (availability >= 25) {
    score += 3;
    reasons.push('Limited availability');
  } else {
    score -= 10;
    reasons.push('Very limited availability');
  }

  // 4. Current workload (up to -20 points penalty)
  const maxTasks = agent.maxConcurrentTasks ?? 5;
  const currentTasks = agent.currentTaskCount ?? 0;
  const workloadRatio = currentTasks / maxTasks;

  if (workloadRatio >= 1.0) {
    score -= 30;
    reasons.push('At capacity');
  } else if (workloadRatio >= 0.8) {
    score -= 15;
    reasons.push('High workload');
  } else if (workloadRatio >= 0.5) {
    score -= 8;
    reasons.push('Moderate workload');
  } else if (workloadRatio <= 0.2) {
    score += 10;
    reasons.push('Low workload');
  }

  // 5. Task priority adjustment
  if (task.priority >= 4 && agentStats) {
    // Prefer high performers for high priority tasks
    if (agentStats.averageQualityScore >= 4.5) {
      score += 5;
      reasons.push('Top performer for high priority task');
    }
  }

  // 6. Specialization bonus for task type
  if (task.tags && agent.skills) {
    const tagSkillMatches = task.tags.filter(tag =>
      agent.skills?.some(skill =>
        skill.toLowerCase().includes(tag.toLowerCase())
      )
    );
    if (tagSkillMatches.length > 0) {
      score += tagSkillMatches.length * 2;
    }
  }

  return {
    agentId: agent.id,
    score: Math.max(0, Math.min(100, score)), // Clamp between 0-100
    reasons,
  };
}

/**
 * Get assignment recommendations for a task
 */
export function getAssignmentRecommendations(
  task: Task,
  agents: CodingAgent[],
  agentStatsMap?: Map<string, AgentStats>,
  autoAssignThreshold: number = 80
): AssignmentRecommendation {
  const recommendations: AssignmentScore[] = agents
    .map(agent => {
      const stats = agentStatsMap?.get(agent.id);
      const allStats = agentStatsMap ? Array.from(agentStatsMap.values()) : undefined;
      return calculateAgentScore(agent, task, stats, allStats);
    })
    .sort((a, b) => b.score - a.score); // Sort by score descending

  // Auto-assign if top score meets threshold and significantly better than second
  let autoAssignedAgentId: string | undefined;
  if (recommendations.length > 0) {
    const topScore = recommendations[0].score;
    const secondScore = recommendations.length > 1 ? recommendations[1].score : 0;
    const scoreDifference = topScore - secondScore;

    if (topScore >= autoAssignThreshold && scoreDifference >= 10) {
      autoAssignedAgentId = recommendations[0].agentId;
    }
  }

  return {
    taskId: task.id,
    recommendations,
    autoAssignedAgentId,
  };
}

/**
 * Batch assign tasks to agents optimally
 */
export function batchAssignTasks(
  tasks: Task[],
  agents: CodingAgent[],
  agentStatsMap?: Map<string, AgentStats>
): Map<string, string> {
  const assignments = new Map<string, string>(); // taskId -> agentId
  const agentWorkloads = new Map<string, number>();

  // Initialize workloads
  agents.forEach(agent => {
    agentWorkloads.set(agent.id, agent.currentTaskCount ?? 0);
  });

  // Sort tasks by priority (high to low)
  const sortedTasks = [...tasks].sort((a, b) => b.priority - a.priority);

  for (const task of sortedTasks) {
    // Get available agents (not at capacity)
    const availableAgents = agents.filter(agent => {
      const currentWorkload = agentWorkloads.get(agent.id) ?? 0;
      const maxTasks = agent.maxConcurrentTasks ?? 5;
      return currentWorkload < maxTasks;
    });

    if (availableAgents.length === 0) {
      continue; // Skip if no available agents
    }

    // Get recommendations for available agents only
    const recommendation = getAssignmentRecommendations(
      task,
      availableAgents,
      agentStatsMap,
      70 // Lower threshold for batch assignment
    );

    if (recommendation.recommendations.length > 0) {
      const bestAgent = recommendation.recommendations[0].agentId;
      assignments.set(task.id, bestAgent);

      // Update workload
      const currentWorkload = agentWorkloads.get(bestAgent) ?? 0;
      agentWorkloads.set(bestAgent, currentWorkload + 1);
    }
  }

  return assignments;
}

/**
 * Calculate agent statistics from performance data
 */
export function calculateAgentStats(
  agentId: string,
  performances: AgentPerformance[],
  currentTaskCount: number
): AgentStats {
  const agentPerformances = performances.filter(p => p.agentId === agentId);

  if (agentPerformances.length === 0) {
    return {
      agentId,
      totalTasksCompleted: 0,
      averageCompletionTime: 0,
      averageQualityScore: 0,
      onTimePercentage: 0,
      currentWorkload: currentTaskCount,
      skillAverages: {},
    };
  }

  const totalTasksCompleted = agentPerformances.length;

  const completionTimes = agentPerformances
    .filter(p => p.completionTime !== undefined)
    .map(p => p.completionTime!);
  const averageCompletionTime =
    completionTimes.length > 0
      ? completionTimes.reduce((a, b) => a + b, 0) / completionTimes.length
      : 0;

  const qualityScores = agentPerformances
    .filter(p => p.qualityScore !== undefined)
    .map(p => p.qualityScore!);
  const averageQualityScore =
    qualityScores.length > 0
      ? qualityScores.reduce((a, b) => a + b, 0) / qualityScores.length
      : 0;

  const onTimeCount = agentPerformances.filter(p => p.onTime).length;
  const onTimePercentage = (onTimeCount / totalTasksCompleted) * 100;

  return {
    agentId,
    totalTasksCompleted,
    averageCompletionTime,
    averageQualityScore,
    onTimePercentage,
    currentWorkload: currentTaskCount,
    skillAverages: {},
  };
}

/**
 * Suggest skills that need to be added to the agent roster
 */
export function suggestMissingSkills(
  tasks: Task[],
  agents: CodingAgent[]
): string[] {
  const requiredSkills = new Set<string>();
  const availableSkills = new Set<string>();

  // Collect all required skills from tasks
  tasks.forEach(task => {
    task.requiredSkills?.forEach(skill => requiredSkills.add(skill.toLowerCase()));
  });

  // Collect all available skills from agents
  agents.forEach(agent => {
    agent.skills?.forEach(skill => availableSkills.add(skill.toLowerCase()));
  });

  // Find skills that are required but not available
  const missingSkills: string[] = [];
  requiredSkills.forEach(skill => {
    if (!availableSkills.has(skill)) {
      missingSkills.push(skill);
    }
  });

  return missingSkills;
}
