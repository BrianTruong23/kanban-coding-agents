// Agent Auto-Assignment Logic

import { Task } from '@/types/task';
import {
  AgentSkill,
  AgentPerformanceMetrics,
  AgentAvailability,
  AutoAssignmentScore,
  SkillCategory,
} from '@/types/agent-extended';
import { CodingAgent } from '@/types/agent';

export interface AgentWithMetrics extends CodingAgent {
  skills: AgentSkill[];
  performance: AgentPerformanceMetrics;
  availability: AgentAvailability;
}

/**
 * Automatically assign the best agent to a task based on:
 * 1. Skill match
 * 2. Availability and workload
 * 3. Performance history
 * 4. Task priority
 */
export function autoAssignAgent(
  task: Task,
  agents: AgentWithMetrics[]
): AutoAssignmentScore[] {
  const scores: AutoAssignmentScore[] = [];

  for (const agent of agents) {
    const score = calculateAgentScore(task, agent);
    scores.push(score);
  }

  // Sort by score descending
  return scores.sort((a, b) => b.score - a.score);
}

function calculateAgentScore(
  task: Task,
  agent: AgentWithMetrics
): AutoAssignmentScore {
  const reasons: string[] = [];

  // 1. Skill Match Score (40% weight)
  const skillMatch = calculateSkillMatch(task, agent.skills);
  reasons.push(`Skill match: ${(skillMatch * 100).toFixed(0)}%`);

  // 2. Availability Score (30% weight)
  const availabilityScore = calculateAvailabilityScore(agent.availability);
  if (agent.availability.available) {
    reasons.push(`Available (${agent.availability.currentTasks}/${agent.availability.maxConcurrentTasks} tasks)`);
  } else {
    reasons.push('Currently unavailable');
  }

  // 3. Performance Score (20% weight)
  const performanceScore = calculatePerformanceScore(agent.performance);
  reasons.push(`Success rate: ${agent.performance.successRate.toFixed(0)}%`);

  // 4. Workload Score (10% weight)
  const workloadScore = calculateWorkloadScore(agent.performance, agent.availability);
  if (workloadScore > 0.7) {
    reasons.push('Low current workload');
  } else if (workloadScore < 0.3) {
    reasons.push('High current workload');
  }

  // Calculate weighted total score
  const totalScore =
    skillMatch * 0.4 +
    availabilityScore * 0.3 +
    performanceScore * 0.2 +
    workloadScore * 0.1;

  // Apply priority multiplier for high-priority tasks
  let finalScore = totalScore;
  if (task.priority >= 4 && skillMatch > 0.7) {
    finalScore *= 1.1; // 10% boost for high-priority tasks with good skill match
    reasons.push('Boosted for high-priority task');
  }

  return {
    agentId: agent.id,
    score: Math.min(finalScore, 1), // Cap at 1
    reasons,
    skillMatch,
    availabilityScore,
    performanceScore,
    workloadScore,
  };
}

function calculateSkillMatch(task: Task, skills: AgentSkill[]): number {
  if (skills.length === 0) return 0.5; // Default medium score for agents without skills

  // Extract skill requirements from task tags and description
  const requiredSkills = extractSkillsFromTask(task);

  if (requiredSkills.length === 0) return 0.5; // No specific skills required

  let totalMatch = 0;
  let maxPossibleMatch = 0;

  for (const required of requiredSkills) {
    maxPossibleMatch += 5; // Max proficiency is 5

    // Find matching skill
    const matchingSkill = skills.find(
      (s) =>
        s.category === required.category ||
        s.name.toLowerCase().includes(required.keyword.toLowerCase()) ||
        required.keyword.toLowerCase().includes(s.name.toLowerCase())
    );

    if (matchingSkill) {
      totalMatch += matchingSkill.proficiency;
    }
  }

  return maxPossibleMatch > 0 ? totalMatch / maxPossibleMatch : 0.5;
}

function extractSkillsFromTask(task: Task): Array<{
  category: SkillCategory;
  keyword: string;
}> {
  const skills: Array<{ category: SkillCategory; keyword: string }> = [];
  const text = (task.title + ' ' + task.description + ' ' + task.tags.join(' ')).toLowerCase();

  // Frontend skills
  if (
    text.includes('react') ||
    text.includes('ui') ||
    text.includes('frontend') ||
    text.includes('component')
  ) {
    skills.push({ category: 'frontend', keyword: 'react' });
  }

  // Backend skills
  if (
    text.includes('api') ||
    text.includes('backend') ||
    text.includes('server') ||
    text.includes('endpoint')
  ) {
    skills.push({ category: 'backend', keyword: 'api' });
  }

  // Database skills
  if (
    text.includes('database') ||
    text.includes('db') ||
    text.includes('sql') ||
    text.includes('schema')
  ) {
    skills.push({ category: 'database', keyword: 'database' });
  }

  // DevOps skills
  if (
    text.includes('deploy') ||
    text.includes('devops') ||
    text.includes('ci/cd') ||
    text.includes('docker')
  ) {
    skills.push({ category: 'devops', keyword: 'devops' });
  }

  // Testing skills
  if (
    text.includes('test') ||
    text.includes('qa') ||
    text.includes('testing')
  ) {
    skills.push({ category: 'testing', keyword: 'testing' });
  }

  // Mobile skills
  if (
    text.includes('mobile') ||
    text.includes('ios') ||
    text.includes('android') ||
    text.includes('app')
  ) {
    skills.push({ category: 'mobile', keyword: 'mobile' });
  }

  // UI/UX skills
  if (
    text.includes('design') ||
    text.includes('ux') ||
    text.includes('ui/ux') ||
    text.includes('wireframe')
  ) {
    skills.push({ category: 'ui-ux', keyword: 'design' });
  }

  // API Design
  if (
    text.includes('api design') ||
    text.includes('rest') ||
    text.includes('graphql')
  ) {
    skills.push({ category: 'api-design', keyword: 'api-design' });
  }

  return skills;
}

function calculateAvailabilityScore(availability: AgentAvailability): number {
  if (!availability.available) return 0;

  const capacityRatio =
    1 - availability.currentTasks / availability.maxConcurrentTasks;

  // Return 0 if at max capacity, 1 if completely free
  return Math.max(0, capacityRatio);
}

function calculatePerformanceScore(performance: AgentPerformanceMetrics): number {
  // Weight different factors
  const successRateScore = performance.successRate / 100; // 0-1

  // Time efficiency (compare estimated vs actual)
  let timeEfficiency = 1;
  if (performance.totalEstimatedHours > 0) {
    timeEfficiency = Math.min(
      1,
      performance.totalEstimatedHours / (performance.totalActualHours || performance.totalEstimatedHours)
    );
  }

  // Combine scores
  return successRateScore * 0.7 + timeEfficiency * 0.3;
}

function calculateWorkloadScore(
  performance: AgentPerformanceMetrics,
  availability: AgentAvailability
): number {
  const currentLoad = availability.currentTasks;
  const maxLoad = availability.maxConcurrentTasks;

  if (maxLoad === 0) return 0;

  // Score is higher when workload is lower
  return 1 - currentLoad / maxLoad;
}

/**
 * Get the best agent for a task
 */
export function getBestAgent(
  task: Task,
  agents: AgentWithMetrics[]
): { agent: AgentWithMetrics; score: AutoAssignmentScore } | null {
  const scores = autoAssignAgent(task, agents);

  if (scores.length === 0) return null;

  const bestScore = scores[0];
  const agent = agents.find((a) => a.id === bestScore.agentId);

  if (!agent) return null;

  return { agent, score: bestScore };
}

/**
 * Validate if an agent can take on a task
 */
export function canAssignTask(agent: AgentWithMetrics): boolean {
  return (
    agent.availability.available &&
    agent.availability.currentTasks < agent.availability.maxConcurrentTasks
  );
}

/**
 * Get recommended agents (top 3)
 */
export function getRecommendedAgents(
  task: Task,
  agents: AgentWithMetrics[],
  limit: number = 3
): Array<{ agent: AgentWithMetrics; score: AutoAssignmentScore }> {
  const scores = autoAssignAgent(task, agents);

  return scores.slice(0, limit).map((score) => ({
    agent: agents.find((a) => a.id === score.agentId)!,
    score,
  })).filter(item => item.agent); // Filter out undefined agents
}
