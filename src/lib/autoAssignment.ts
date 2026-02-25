/**
 * Auto-Assignment Algorithm
 * Assigns tasks to agents based on skills, performance, and workload
 */

import { Task } from '@/types/task';
import { CodingAgent, AgentSkill, AgentPerformance } from '@/types/agent';

export interface AssignmentScore {
  agentId: string;
  score: number;
  reasons: string[];
}

export interface AssignmentRecommendation {
  taskId: string;
  recommendedAgentId: string;
  score: number;
  reasons: string[];
  alternativeAgents: AssignmentScore[];
}

/**
 * Calculate workload for an agent based on their current tasks
 */
function calculateWorkload(agentId: string, allTasks: Task[]): number {
  const agentTasks = allTasks.filter(
    task => task.assignedAgentId === agentId && task.status !== 'done'
  );

  // Workload is based on number of tasks and their priorities
  return agentTasks.reduce((sum, task) => {
    const priorityWeight = task.priority || 3;
    return sum + priorityWeight;
  }, 0);
}

/**
 * Calculate skill match score between task and agent
 */
function calculateSkillMatch(task: Task, agent: CodingAgent): number {
  if (!agent.skills || agent.skills.length === 0) {
    return 0.5; // Neutral score if no skills data
  }

  let matchScore = 0;
  let maxPossibleScore = 0;

  // Extract required skills from task tags and description
  const requiredSkills = extractRequiredSkills(task);

  for (const requiredSkill of requiredSkills) {
    maxPossibleScore += 5; // Maximum skill level

    const agentSkill = agent.skills.find(
      s => s.skillName.toLowerCase() === requiredSkill.toLowerCase()
    );

    if (agentSkill) {
      matchScore += agentSkill.skillLevel;
    }
  }

  // If no required skills identified, use average of agent's skills
  if (requiredSkills.length === 0 && agent.skills.length > 0) {
    const avgSkillLevel = agent.skills.reduce((sum, s) => sum + s.skillLevel, 0) / agent.skills.length;
    return avgSkillLevel / 5; // Normalize to 0-1
  }

  return maxPossibleScore > 0 ? matchScore / maxPossibleScore : 0;
}

/**
 * Extract required skills from task
 */
function extractRequiredSkills(task: Task): string[] {
  const skills: Set<string> = new Set();
  const text = `${task.title} ${task.description || ''} ${task.tags.join(' ')}`.toLowerCase();

  // Frontend skills
  if (text.includes('react')) skills.add('React');
  if (text.includes('next') || text.includes('nextjs')) skills.add('Next.js');
  if (text.includes('typescript') || text.includes('ts')) skills.add('TypeScript');
  if (text.includes('css') || text.includes('styling') || text.includes('ui')) skills.add('CSS');
  if (text.includes('design') || text.includes('ux')) skills.add('UI/UX Design');

  // Backend skills
  if (text.includes('node') || text.includes('nodejs')) skills.add('Node.js');
  if (text.includes('postgres') || text.includes('database') || text.includes('sql')) skills.add('PostgreSQL');
  if (text.includes('api')) skills.add('API Design');
  if (text.includes('database')) skills.add('Database Design');

  // DevOps skills
  if (text.includes('docker')) skills.add('Docker');
  if (text.includes('ci/cd') || text.includes('deploy')) skills.add('CI/CD');
  if (text.includes('aws') || text.includes('cloud')) skills.add('AWS');
  if (text.includes('kubernetes') || text.includes('k8s')) skills.add('Kubernetes');

  // Mobile skills
  if (text.includes('mobile') || text.includes('ios') || text.includes('android')) {
    skills.add('React Native');
    skills.add('Mobile UI/UX');
  }

  return Array.from(skills);
}

/**
 * Calculate performance score for agent
 */
function calculatePerformanceScore(agent: CodingAgent): number {
  if (!agent.performance) {
    return 0.75; // Neutral/good score if no performance data
  }

  const metrics = agent.performance;

  // Weight different metrics
  const qualityWeight = 0.4;
  const onTimeWeight = 0.3;
  const efficiencyWeight = 0.3;

  const qualityScore = metrics.averageQualityScore / 5;
  const onTimeScore = metrics.onTimePercentage / 100;

  // Efficiency: lower completion time is better (assume 8 hours is baseline)
  const efficiencyScore = Math.max(0, 1 - (metrics.averageCompletionTime - 8) / 16);

  return (
    qualityScore * qualityWeight +
    onTimeScore * onTimeWeight +
    efficiencyScore * efficiencyWeight
  );
}

/**
 * Calculate priority score based on task priority and agent availability
 */
function calculatePriorityScore(task: Task, agentWorkload: number): number {
  const taskPriority = task.priority || 3;
  const maxWorkload = 20; // Arbitrary max workload threshold

  // Higher priority tasks should get agents with lower workload
  const priorityWeight = taskPriority / 5;
  const workloadPenalty = Math.min(agentWorkload / maxWorkload, 1);

  return priorityWeight * (1 - workloadPenalty * 0.5);
}

/**
 * Recommend agent assignment for a task
 */
export function recommendAgentForTask(
  task: Task,
  agents: CodingAgent[],
  allTasks: Task[]
): AssignmentRecommendation | null {
  if (agents.length === 0) {
    return null;
  }

  const scores: AssignmentScore[] = [];

  for (const agent of agents) {
    const workload = calculateWorkload(agent.id, allTasks);
    const skillMatch = calculateSkillMatch(task, agent);
    const performance = calculatePerformanceScore(agent);
    const priorityScore = calculatePriorityScore(task, workload);

    // Weighted score calculation
    const weights = {
      skill: 0.4,
      performance: 0.3,
      priority: 0.2,
      workload: 0.1
    };

    const workloadScore = Math.max(0, 1 - workload / 20);

    const totalScore =
      skillMatch * weights.skill +
      performance * weights.performance +
      priorityScore * weights.priority +
      workloadScore * weights.workload;

    const reasons: string[] = [];

    if (skillMatch > 0.7) {
      reasons.push('Strong skill match');
    } else if (skillMatch < 0.3) {
      reasons.push('Limited skill match');
    }

    if (performance > 0.8) {
      reasons.push('Excellent track record');
    }

    if (workload > 15) {
      reasons.push('High current workload');
    } else if (workload < 5) {
      reasons.push('Available capacity');
    }

    scores.push({
      agentId: agent.id,
      score: totalScore,
      reasons
    });
  }

  // Sort by score descending
  scores.sort((a, b) => b.score - a.score);

  const topAgent = scores[0];
  const alternatives = scores.slice(1, 3);

  return {
    taskId: task.id,
    recommendedAgentId: topAgent.agentId,
    score: topAgent.score,
    reasons: topAgent.reasons,
    alternativeAgents: alternatives
  };
}

/**
 * Auto-assign multiple tasks to agents optimally
 */
export function autoAssignTasks(
  tasks: Task[],
  agents: CodingAgent[],
  allTasks: Task[]
): Map<string, string> {
  const assignments = new Map<string, string>();

  // Sort tasks by priority (highest first)
  const sortedTasks = [...tasks].sort((a, b) => (b.priority || 3) - (a.priority || 3));

  // Track workload changes as we assign
  const workloadTracker = new Map<string, number>();
  agents.forEach(agent => {
    workloadTracker.set(agent.id, calculateWorkload(agent.id, allTasks));
  });

  for (const task of sortedTasks) {
    if (task.assignedAgentId) {
      // Skip already assigned tasks
      continue;
    }

    // Update temporary tasks list with new assignments
    const tempTasks = [
      ...allTasks,
      ...Array.from(assignments.entries()).map(([taskId, agentId]) => ({
        ...tasks.find(t => t.id === taskId)!,
        assignedAgentId: agentId
      }))
    ];

    const recommendation = recommendAgentForTask(task, agents, tempTasks);

    if (recommendation && recommendation.score > 0.4) {
      assignments.set(task.id, recommendation.recommendedAgentId);

      // Update workload tracker
      const currentWorkload = workloadTracker.get(recommendation.recommendedAgentId) || 0;
      workloadTracker.set(
        recommendation.recommendedAgentId,
        currentWorkload + (task.priority || 3)
      );
    }
  }

  return assignments;
}

/**
 * Get agent utilization stats
 */
export function getAgentUtilization(
  agents: CodingAgent[],
  tasks: Task[]
): Map<string, { workload: number; tasksCount: number; utilization: number }> {
  const stats = new Map();

  for (const agent of agents) {
    const workload = calculateWorkload(agent.id, tasks);
    const tasksCount = tasks.filter(
      t => t.assignedAgentId === agent.id && t.status !== 'done'
    ).length;

    // Utilization percentage (assuming 20 is max workload)
    const utilization = Math.min(100, (workload / 20) * 100);

    stats.set(agent.id, { workload, tasksCount, utilization });
  }

  return stats;
}
