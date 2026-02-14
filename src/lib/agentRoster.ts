import { CodingAgent, AgentSkill, AgentPerformance, SkillLevel } from '@/types/agent';
import { Task } from '@/types/task';

/**
 * Calculate skill match score between agent skills and task requirements
 */
export function calculateSkillMatch(agent: CodingAgent, task: Task): number {
  if (!agent.skills || agent.skills.length === 0) {
    return 0.5; // Default score for agents without defined skills
  }

  const taskTags = task.tags.map(t => t.toLowerCase());
  const taskDescription = (task.description || '').toLowerCase();
  const taskTitle = task.title.toLowerCase();
  const taskText = `${taskTitle} ${taskDescription}`;

  let totalScore = 0;
  let matchCount = 0;

  // Check each agent skill against task requirements
  agent.skills.forEach(skill => {
    const skillName = skill.skillName.toLowerCase();

    // Check if skill matches task tags or description
    const tagMatch = taskTags.some(tag =>
      tag.includes(skillName) || skillName.includes(tag)
    );
    const textMatch = taskText.includes(skillName);

    if (tagMatch || textMatch) {
      matchCount++;
      // Weight by skill level
      const levelScore = getSkillLevelScore(skill.level);
      totalScore += levelScore;
    }
  });

  if (matchCount === 0) {
    return 0.3; // Low base score if no skills match
  }

  // Normalize score to 0-1 range
  const avgScore = totalScore / matchCount;
  return Math.min(avgScore, 1);
}

function getSkillLevelScore(level: SkillLevel): number {
  const scores: Record<SkillLevel, number> = {
    beginner: 0.4,
    intermediate: 0.6,
    advanced: 0.8,
    expert: 1.0,
  };
  return scores[level];
}

/**
 * Calculate performance score from agent performance metrics
 */
export function calculatePerformanceScore(performance?: AgentPerformance): number {
  if (!performance || performance.tasksCompleted === 0) {
    return 0.7; // Default score for new agents
  }

  // Weight factors
  const onTimeWeight = 0.4;
  const qualityWeight = 0.4;
  const completionWeight = 0.2;

  // On-time delivery rate
  const onTimeRate = performance.tasksOnTime / performance.tasksCompleted;

  // Quality score (already 0-100, normalize to 0-1)
  const qualityScore = performance.qualityScore / 100;

  // Completion rate (completed vs total assigned)
  const totalTasks = performance.tasksCompleted + performance.tasksLate;
  const completionRate = totalTasks > 0 ? performance.tasksCompleted / totalTasks : 0;

  return (
    onTimeRate * onTimeWeight +
    qualityScore * qualityWeight +
    completionRate * completionWeight
  );
}

/**
 * Calculate workload score (inverse - lower workload = higher score)
 */
export function calculateWorkloadScore(agent: CodingAgent): number {
  const currentWorkload = agent.currentWorkload || 0;

  // Score decreases as workload increases
  // 0 tasks = 1.0, 5 tasks = 0.5, 10+ tasks = 0.1
  if (currentWorkload === 0) return 1.0;
  if (currentWorkload >= 10) return 0.1;

  return 1.0 - (currentWorkload * 0.09);
}

/**
 * Calculate availability score
 */
export function calculateAvailabilityScore(agent: CodingAgent): number {
  return agent.isAvailable !== false ? 1.0 : 0.0;
}

/**
 * Calculate overall agent suitability score for a task
 */
export function calculateAgentScore(agent: CodingAgent, task: Task): number {
  const skillScore = calculateSkillMatch(agent, task);
  const performanceScore = calculatePerformanceScore(agent.performance);
  const workloadScore = calculateWorkloadScore(agent);
  const availabilityScore = calculateAvailabilityScore(agent);

  // Availability is a hard requirement
  if (availabilityScore === 0) {
    return 0;
  }

  // Weighted scoring
  const weights = {
    skill: 0.4,
    performance: 0.3,
    workload: 0.3,
  };

  return (
    skillScore * weights.skill +
    performanceScore * weights.performance +
    workloadScore * weights.workload
  );
}

/**
 * Find the best agent for a task
 */
export function findBestAgent(agents: CodingAgent[], task: Task): CodingAgent | null {
  if (agents.length === 0) return null;

  const scoredAgents = agents.map(agent => ({
    agent,
    score: calculateAgentScore(agent, task),
  }));

  // Sort by score descending
  scoredAgents.sort((a, b) => b.score - a.score);

  // Return agent with highest score (if score is reasonable)
  const best = scoredAgents[0];
  return best.score > 0.2 ? best.agent : null;
}

/**
 * Rank all agents for a task
 */
export function rankAgentsForTask(agents: CodingAgent[], task: Task): Array<{
  agent: CodingAgent;
  score: number;
  skillMatch: number;
  performanceScore: number;
  workloadScore: number;
}> {
  return agents
    .map(agent => ({
      agent,
      score: calculateAgentScore(agent, task),
      skillMatch: calculateSkillMatch(agent, task),
      performanceScore: calculatePerformanceScore(agent.performance),
      workloadScore: calculateWorkloadScore(agent),
    }))
    .sort((a, b) => b.score - a.score);
}

/**
 * Update agent performance after task completion
 */
export function updatePerformanceMetrics(
  currentPerformance: AgentPerformance | undefined,
  taskCompletedOnTime: boolean,
  actualHours: number,
  qualityRating: number // 0-100
): AgentPerformance {
  const current = currentPerformance || {
    id: '',
    agentId: '',
    tasksCompleted: 0,
    tasksOnTime: 0,
    tasksLate: 0,
    averageCompletionTime: 0,
    qualityScore: 100,
    lastUpdated: Date.now(),
  };

  const newTasksCompleted = current.tasksCompleted + 1;
  const newTasksOnTime = current.tasksOnTime + (taskCompletedOnTime ? 1 : 0);
  const newTasksLate = current.tasksLate + (taskCompletedOnTime ? 0 : 1);

  // Update average completion time (weighted average)
  const newAvgCompletionTime =
    (current.averageCompletionTime * current.tasksCompleted + actualHours) / newTasksCompleted;

  // Update quality score (weighted average, recent tasks weighted more)
  const recentWeight = 0.3;
  const historicalWeight = 1 - recentWeight;
  const newQualityScore =
    current.qualityScore * historicalWeight + qualityRating * recentWeight;

  return {
    ...current,
    tasksCompleted: newTasksCompleted,
    tasksOnTime: newTasksOnTime,
    tasksLate: newTasksLate,
    averageCompletionTime: newAvgCompletionTime,
    qualityScore: newQualityScore,
    lastUpdated: Date.now(),
  };
}

/**
 * Suggest skills to add to agent based on common task patterns
 */
export function suggestSkills(tasks: Task[]): string[] {
  const skillFrequency = new Map<string, number>();

  tasks.forEach(task => {
    task.tags.forEach(tag => {
      const count = skillFrequency.get(tag) || 0;
      skillFrequency.set(tag, count + 1);
    });
  });

  // Return top skills by frequency
  return Array.from(skillFrequency.entries())
    .sort((a, b) => b[1] - a[1])
    .slice(0, 10)
    .map(([skill]) => skill);
}

/**
 * Detect skill gaps in agent roster
 */
export function detectSkillGaps(
  agents: CodingAgent[],
  tasks: Task[]
): Array<{ skill: string; gap: number }> {
  const requiredSkills = new Map<string, number>();
  const availableSkills = new Map<string, number>();

  // Count required skills from tasks
  tasks.forEach(task => {
    task.tags.forEach(tag => {
      const count = requiredSkills.get(tag) || 0;
      requiredSkills.set(tag, count + 1);
    });
  });

  // Count available skills from agents
  agents.forEach(agent => {
    if (agent.skills) {
      agent.skills.forEach(skill => {
        const count = availableSkills.get(skill.skillName) || 0;
        availableSkills.set(skill.skillName, count + 1);
      });
    }
  });

  // Calculate gaps
  const gaps: Array<{ skill: string; gap: number }> = [];

  requiredSkills.forEach((required, skill) => {
    const available = availableSkills.get(skill) || 0;
    const gap = required - available;

    if (gap > 0) {
      gaps.push({ skill, gap });
    }
  });

  return gaps.sort((a, b) => b.gap - a.gap);
}

/**
 * Get agent workload distribution
 */
export function getWorkloadDistribution(agents: CodingAgent[]): {
  balanced: boolean;
  distribution: Array<{ agentId: string; agentName: string; workload: number }>;
  recommendation: string;
} {
  const distribution = agents.map(agent => ({
    agentId: agent.id,
    agentName: agent.name,
    workload: agent.currentWorkload || 0,
  }));

  const workloads = distribution.map(d => d.workload);
  const avgWorkload = workloads.reduce((a, b) => a + b, 0) / workloads.length;
  const maxWorkload = Math.max(...workloads);
  const minWorkload = Math.min(...workloads);

  // Consider balanced if difference is <= 2 tasks
  const balanced = maxWorkload - minWorkload <= 2;

  let recommendation = '';
  if (!balanced) {
    const overloaded = distribution.filter(d => d.workload > avgWorkload + 1);
    const underutilized = distribution.filter(d => d.workload < avgWorkload - 1);

    if (overloaded.length > 0 && underutilized.length > 0) {
      recommendation = `Consider redistributing tasks from ${overloaded.map(a => a.agentName).join(', ')} to ${underutilized.map(a => a.agentName).join(', ')}`;
    }
  } else {
    recommendation = 'Workload is well balanced across agents';
  }

  return {
    balanced,
    distribution,
    recommendation,
  };
}
