import { CodingAgent, AgentSkill } from '@/types/agent';
import { Task } from '@/types/task';
import { extractRequiredSkills } from './taskBreakdown';

export interface AssignmentScore {
  agentId: string;
  score: number;
  reasons: string[];
}

/**
 * Auto-assigns the best agent to a task based on skills and performance
 */
export function autoAssignTask(
  task: Partial<Task>,
  agents: CodingAgent[]
): string | null {
  const scores = scoreAgentsForTask(task, agents);

  if (scores.length === 0) {
    return null;
  }

  // Sort by score descending
  scores.sort((a, b) => b.score - a.score);

  // Return the agent with the highest score
  return scores[0].agentId;
}

/**
 * Scores all agents for a given task
 */
export function scoreAgentsForTask(
  task: Partial<Task>,
  agents: CodingAgent[]
): AssignmentScore[] {
  const requiredSkills = extractRequiredSkills(task);
  const scores: AssignmentScore[] = [];

  agents.forEach(agent => {
    const score = calculateAgentScore(task, agent, requiredSkills);
    if (score.score > 0) {
      scores.push(score);
    }
  });

  return scores;
}

/**
 * Calculates a score for an agent based on how well they match a task
 */
function calculateAgentScore(
  task: Partial<Task>,
  agent: CodingAgent,
  requiredSkills: string[]
): AssignmentScore {
  let score = 0;
  const reasons: string[] = [];

  // 1. Skill matching (40% weight)
  const skillScore = calculateSkillScore(agent, requiredSkills);
  score += skillScore * 0.4;

  if (skillScore > 0) {
    const matchedSkills = requiredSkills.filter(reqSkill =>
      agent.skills?.some(skill => skill.skillName === reqSkill)
    );
    if (matchedSkills.length > 0) {
      reasons.push(`Has skills: ${matchedSkills.join(', ')}`);
    }
  }

  // 2. Performance metrics (30% weight)
  if (agent.performanceMetrics) {
    const perfScore = calculatePerformanceScore(agent.performanceMetrics);
    score += perfScore * 0.3;

    if (agent.performanceMetrics.averageQuality && agent.performanceMetrics.averageQuality >= 4) {
      reasons.push('High quality track record');
    }
    if (agent.performanceMetrics.onTimePercentage && agent.performanceMetrics.onTimePercentage >= 90) {
      reasons.push('Consistently on-time');
    }
  }

  // 3. Availability/workload (20% weight) - placeholder for now
  const availabilityScore = 1.0; // Assume all agents are available
  score += availabilityScore * 0.2;

  // 4. Task priority match (10% weight)
  if (task.priority && task.priority >= 4) {
    // High priority tasks should go to high performers
    if (agent.performanceMetrics?.averageQuality && agent.performanceMetrics.averageQuality >= 4) {
      score += 0.1;
      reasons.push('Best performer for high-priority task');
    }
  }

  return {
    agentId: agent.id,
    score: Math.round(score * 100) / 100,
    reasons,
  };
}

/**
 * Calculates skill match score (0-1)
 */
function calculateSkillScore(agent: CodingAgent, requiredSkills: string[]): number {
  if (requiredSkills.length === 0) {
    return 0.5; // Neutral score if no specific skills required
  }

  if (!agent.skills || agent.skills.length === 0) {
    return 0;
  }

  let totalScore = 0;
  let matchedSkills = 0;

  requiredSkills.forEach(reqSkill => {
    const agentSkill = agent.skills?.find(s => s.skillName === reqSkill);
    if (agentSkill) {
      // Proficiency level contributes to score (1-5 normalized to 0-1)
      totalScore += agentSkill.proficiencyLevel / 5;
      matchedSkills++;
    }
  });

  if (matchedSkills === 0) {
    return 0;
  }

  // Average skill level * coverage percentage
  const avgSkillLevel = totalScore / matchedSkills;
  const coverage = matchedSkills / requiredSkills.length;

  return avgSkillLevel * coverage;
}

/**
 * Calculates performance score (0-1)
 */
function calculatePerformanceScore(metrics: {
  averageQuality?: number;
  averageCompletionTime?: number;
  onTimePercentage?: number;
  totalTasksCompleted?: number;
}): number {
  let score = 0;
  let factors = 0;

  // Quality score (normalized 1-5 to 0-1)
  if (metrics.averageQuality) {
    score += metrics.averageQuality / 5;
    factors++;
  }

  // On-time percentage (already 0-100, normalize to 0-1)
  if (metrics.onTimePercentage !== undefined) {
    score += metrics.onTimePercentage / 100;
    factors++;
  }

  // Experience bonus (more completed tasks = better)
  if (metrics.totalTasksCompleted) {
    const experienceScore = Math.min(metrics.totalTasksCompleted / 20, 1); // Cap at 20 tasks
    score += experienceScore;
    factors++;
  }

  return factors > 0 ? score / factors : 0.5; // Default to neutral if no metrics
}

/**
 * Batch assigns agents to multiple tasks
 */
export function batchAutoAssign(
  tasks: Partial<Task>[],
  agents: CodingAgent[]
): Map<string, string> {
  const assignments = new Map<string, string>();
  const agentWorkload = new Map<string, number>();

  // Initialize workload
  agents.forEach(agent => agentWorkload.set(agent.id, 0));

  // Sort tasks by priority (highest first)
  const sortedTasks = [...tasks].sort((a, b) =>
    (b.priority || 0) - (a.priority || 0)
  );

  sortedTasks.forEach(task => {
    if (!task.id) return;

    const scores = scoreAgentsForTask(task, agents);

    // Adjust scores based on current workload
    scores.forEach(score => {
      const workload = agentWorkload.get(score.agentId) || 0;
      // Reduce score based on workload (each task reduces score by 10%)
      score.score *= (1 - (workload * 0.1));
    });

    // Sort by adjusted score
    scores.sort((a, b) => b.score - a.score);

    if (scores.length > 0 && scores[0].score > 0) {
      const assignedAgentId = scores[0].agentId;
      assignments.set(task.id, assignedAgentId);

      // Update workload
      const currentWorkload = agentWorkload.get(assignedAgentId) || 0;
      agentWorkload.set(assignedAgentId, currentWorkload + 1);
    }
  });

  return assignments;
}

/**
 * Recommends skill development for agents based on task requirements
 */
export function recommendSkillDevelopment(
  tasks: Partial<Task>[],
  agents: CodingAgent[]
): Map<string, string[]> {
  const recommendations = new Map<string, string[]>();

  // Aggregate all required skills from tasks
  const requiredSkillsFrequency = new Map<string, number>();

  tasks.forEach(task => {
    const skills = extractRequiredSkills(task);
    skills.forEach(skill => {
      requiredSkillsFrequency.set(
        skill,
        (requiredSkillsFrequency.get(skill) || 0) + 1
      );
    });
  });

  // Sort skills by frequency
  const sortedSkills = Array.from(requiredSkillsFrequency.entries())
    .sort((a, b) => b[1] - a[1]);

  // Recommend top 3 most needed skills that agents don't have or have low proficiency in
  agents.forEach(agent => {
    const agentRecommendations: string[] = [];

    sortedSkills.forEach(([skill, frequency]) => {
      if (agentRecommendations.length >= 3) return;

      const agentSkill = agent.skills?.find(s => s.skillName === skill);

      if (!agentSkill) {
        agentRecommendations.push(`Learn ${skill} (needed in ${frequency} tasks)`);
      } else if (agentSkill.proficiencyLevel < 4) {
        agentRecommendations.push(
          `Improve ${skill} (current: ${agentSkill.proficiencyLevel}/5, needed in ${frequency} tasks)`
        );
      }
    });

    if (agentRecommendations.length > 0) {
      recommendations.set(agent.id, agentRecommendations);
    }
  });

  return recommendations;
}
