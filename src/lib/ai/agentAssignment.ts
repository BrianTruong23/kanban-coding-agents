import { Task, TaskType } from '@/types/task';
import { CodingAgent, AgentSkill, SkillLevel } from '@/types/agent';

/**
 * Score representing how well an agent matches a task
 */
export interface AssignmentScore {
  agentId: string;
  agentName: string;
  score: number; // 0-100
  reasons: string[];
  availability: boolean;
}

/**
 * Calculate skill level score
 */
function getSkillLevelScore(level: SkillLevel): number {
  const scores: Record<SkillLevel, number> = {
    beginner: 25,
    intermediate: 50,
    advanced: 75,
    expert: 100,
  };
  return scores[level];
}

/**
 * Calculate how well an agent's skills match task requirements
 */
function calculateSkillMatch(agent: CodingAgent, task: Task): number {
  if (!agent.skills || agent.skills.length === 0) {
    return 50; // Neutral score if no skills defined
  }

  // Extract relevant keywords from task
  const taskKeywords = [
    ...task.title.toLowerCase().split(/\s+/),
    ...task.description.toLowerCase().split(/\s+/),
    ...task.tags.map(tag => tag.toLowerCase()),
  ];

  let totalScore = 0;
  let matchCount = 0;

  agent.skills.forEach(skill => {
    const skillName = skill.name.toLowerCase();
    // Check if skill is relevant to task
    const isRelevant = taskKeywords.some(keyword =>
      keyword.includes(skillName) || skillName.includes(keyword)
    );

    if (isRelevant) {
      totalScore += getSkillLevelScore(skill.level);
      matchCount++;
    }
  });

  // If no direct matches, use average skill level
  if (matchCount === 0) {
    const avgSkillScore = agent.skills.reduce((sum, skill) =>
      sum + getSkillLevelScore(skill.level), 0
    ) / agent.skills.length;
    return avgSkillScore * 0.5; // Reduced score for no direct match
  }

  return totalScore / matchCount;
}

/**
 * Calculate performance-based score
 */
function calculatePerformanceScore(agent: CodingAgent): number {
  if (!agent.performance) {
    return 70; // Default neutral-positive score
  }

  const { onTimeDeliveryRate, qualityScore, tasksCompleted } = agent.performance;

  // Weight factors
  const onTimeWeight = 0.4;
  const qualityWeight = 0.4;
  const experienceWeight = 0.2;

  // Experience bonus based on completed tasks
  const experienceScore = Math.min(100, tasksCompleted * 2);

  const score =
    (onTimeDeliveryRate * onTimeWeight) +
    (qualityScore * qualityWeight) +
    (experienceScore * experienceWeight);

  return score;
}

/**
 * Calculate workload score (inverse - lower workload = higher score)
 */
function calculateWorkloadScore(agent: CodingAgent): number {
  if (!agent.performance) {
    return 80; // Assume available
  }

  const { tasksInProgress } = agent.performance;
  const maxTasks = agent.maxConcurrentTasks || 3;

  if (tasksInProgress >= maxTasks) {
    return 0; // At capacity
  }

  // Linear decrease as workload increases
  const workloadRatio = tasksInProgress / maxTasks;
  return (1 - workloadRatio) * 100;
}

/**
 * Check if task type matches agent preferences
 */
function calculatePreferenceScore(agent: CodingAgent, task: Task): number {
  if (!agent.preferredTaskTypes || agent.preferredTaskTypes.length === 0) {
    return 70; // Neutral score
  }

  const taskType = task.type;
  const hasPreference = agent.preferredTaskTypes.includes(taskType);

  // Also check tags
  const hasTagMatch = task.tags.some(tag =>
    agent.preferredTaskTypes?.includes(tag.toLowerCase())
  );

  if (hasPreference || hasTagMatch) {
    return 100; // Strong match
  }

  return 40; // Doesn't match preferences
}

/**
 * Main function to recommend agent assignment
 */
export function recommendAgentAssignment(
  task: Task,
  agents: CodingAgent[],
  existingTasks: Task[]
): AssignmentScore[] {
  const scores: AssignmentScore[] = agents.map(agent => {
    const reasons: string[] = [];
    let totalScore = 0;

    // 1. Skill match (40% weight)
    const skillScore = calculateSkillMatch(agent, task);
    totalScore += skillScore * 0.4;
    if (skillScore > 70) {
      reasons.push(`Strong skill match (${Math.round(skillScore)}%)`);
    } else if (skillScore > 50) {
      reasons.push(`Good skill match (${Math.round(skillScore)}%)`);
    } else if (skillScore < 30) {
      reasons.push(`Limited skill match (${Math.round(skillScore)}%)`);
    }

    // 2. Performance history (25% weight)
    const performanceScore = calculatePerformanceScore(agent);
    totalScore += performanceScore * 0.25;
    if (performanceScore > 80) {
      reasons.push(`Excellent performance history`);
    } else if (performanceScore < 50) {
      reasons.push(`Needs improvement in delivery`);
    }

    // 3. Current workload (20% weight)
    const workloadScore = calculateWorkloadScore(agent);
    totalScore += workloadScore * 0.2;
    if (workloadScore === 0) {
      reasons.push(`At maximum capacity`);
    } else if (workloadScore > 80) {
      reasons.push(`Highly available`);
    } else if (workloadScore < 40) {
      reasons.push(`Heavy workload`);
    }

    // 4. Task type preference (15% weight)
    const preferenceScore = calculatePreferenceScore(agent, task);
    totalScore += preferenceScore * 0.15;
    if (preferenceScore > 80) {
      reasons.push(`Prefers this type of work`);
    }

    // 5. Availability status (bonus/penalty)
    const isAvailable = agent.availability !== 'offline';
    if (!isAvailable) {
      totalScore *= 0.5; // 50% penalty if offline
      reasons.push(`Currently offline`);
    } else if (agent.availability === 'available') {
      reasons.push(`Available now`);
    }

    return {
      agentId: agent.id,
      agentName: agent.name,
      score: Math.round(totalScore),
      reasons,
      availability: isAvailable,
    };
  });

  // Sort by score descending
  return scores.sort((a, b) => b.score - a.score);
}

/**
 * Auto-assign tasks to agents based on scores
 */
export function autoAssignTasks(
  tasks: Task[],
  agents: CodingAgent[],
  threshold: number = 70
): Map<string, string> {
  const assignments = new Map<string, string>(); // taskId -> agentId
  const agentWorkload = new Map<string, number>(); // agentId -> task count

  // Initialize workload
  agents.forEach(agent => {
    agentWorkload.set(agent.id, agent.performance?.tasksInProgress || 0);
  });

  // Sort tasks by priority (higher priority first)
  const sortedTasks = [...tasks]
    .filter(task => !task.assignedAgentId) // Only unassigned tasks
    .sort((a, b) => b.priority - a.priority);

  sortedTasks.forEach(task => {
    const recommendations = recommendAgentAssignment(task, agents, tasks);

    // Find the best available agent above threshold
    const bestMatch = recommendations.find(rec => {
      const currentLoad = agentWorkload.get(rec.agentId) || 0;
      const agent = agents.find(a => a.id === rec.agentId);
      const maxLoad = agent?.maxConcurrentTasks || 3;

      return rec.score >= threshold &&
             rec.availability &&
             currentLoad < maxLoad;
    });

    if (bestMatch) {
      assignments.set(task.id, bestMatch.agentId);
      const currentLoad = agentWorkload.get(bestMatch.agentId) || 0;
      agentWorkload.set(bestMatch.agentId, currentLoad + 1);
    }
  });

  return assignments;
}

/**
 * Balance workload across agents
 */
export function balanceWorkload(
  tasks: Task[],
  agents: CodingAgent[]
): Map<string, string> {
  const assignments = new Map<string, string>();
  const agentWorkload = new Map<string, number>();

  // Initialize
  agents.forEach(agent => {
    agentWorkload.set(agent.id, 0);
  });

  // Count current assignments
  tasks.forEach(task => {
    if (task.assignedAgentId) {
      const current = agentWorkload.get(task.assignedAgentId) || 0;
      agentWorkload.set(task.assignedAgentId, current + 1);
    }
  });

  // Get unassigned tasks
  const unassignedTasks = tasks
    .filter(task => !task.assignedAgentId)
    .sort((a, b) => b.priority - a.priority);

  unassignedTasks.forEach(task => {
    // Find agent with lowest workload
    let minWorkload = Infinity;
    let selectedAgent: string | null = null;

    agents.forEach(agent => {
      const workload = agentWorkload.get(agent.id) || 0;
      const maxLoad = agent.maxConcurrentTasks || 3;

      if (workload < maxLoad && workload < minWorkload) {
        minWorkload = workload;
        selectedAgent = agent.id;
      }
    });

    if (selectedAgent) {
      assignments.set(task.id, selectedAgent);
      agentWorkload.set(selectedAgent, minWorkload + 1);
    }
  });

  return assignments;
}
