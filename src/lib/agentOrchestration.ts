import { CodingAgent, AgentAssignmentScore, AgentAvailability } from '@/types/agent';
import { Task } from '@/types/task';

/**
 * Agent Orchestration System
 * Handles auto-assignment of tasks to agents based on skills, performance, and availability
 */

/**
 * Calculate skill match score between task and agent
 */
function calculateSkillMatch(task: Partial<Task>, agent: CodingAgent): number {
  if (!agent.skills || agent.skills.length === 0) return 0.5;

  const taskTags = task.tags || [];
  const taskDescription = (task.title || '') + ' ' + (task.description || '');

  let matchCount = 0;
  let totalSkills = agent.skills.length;

  for (const skill of agent.skills) {
    const skillLower = skill.toLowerCase();

    // Check if skill matches any task tag
    if (taskTags.some(tag => tag.toLowerCase().includes(skillLower))) {
      matchCount += 2; // Tag matches are stronger
    }
    // Check if skill is mentioned in description
    else if (taskDescription.toLowerCase().includes(skillLower)) {
      matchCount += 1;
    }
  }

  // Normalize to 0-1 range
  return Math.min(matchCount / (totalSkills * 1.5), 1);
}

/**
 * Calculate workload score (lower is better)
 */
function calculateWorkloadScore(agent: CodingAgent): number {
  const maxWorkload = 5; // Maximum concurrent tasks
  const currentWorkload = agent.tasksInProgress || 0;

  // Return inverse score (0 = fully loaded, 1 = no tasks)
  return Math.max(0, (maxWorkload - currentWorkload) / maxWorkload);
}

/**
 * Calculate performance score
 */
function calculatePerformanceScore(agent: CodingAgent): number {
  // Normalize performance score to 0-1 range
  return (agent.performanceScore || 80) / 100;
}

/**
 * Calculate availability score
 */
function calculateAvailabilityScore(agent: CodingAgent): number {
  switch (agent.availabilityStatus) {
    case 'available':
      return 1.0;
    case 'busy':
      return 0.5;
    case 'offline':
      return 0.0;
    default:
      return 0.5;
  }
}

/**
 * Calculate priority urgency multiplier
 */
function calculatePriorityMultiplier(priority: number): number {
  // Higher priority tasks should match with better performing agents
  return 0.8 + (priority / 5) * 0.4; // Range: 0.88 to 1.2
}

/**
 * Calculate overall agent assignment score
 */
export function calculateAgentScore(
  task: Partial<Task>,
  agent: CodingAgent
): AgentAssignmentScore {
  const skillMatch = calculateSkillMatch(task, agent);
  const workloadScore = calculateWorkloadScore(agent);
  const performanceScore = calculatePerformanceScore(agent);
  const availabilityScore = calculateAvailabilityScore(agent);
  const priorityMultiplier = calculatePriorityMultiplier(task.priority || 3);

  // Weighted scoring
  const weights = {
    skill: 0.4,
    workload: 0.2,
    performance: 0.2,
    availability: 0.2,
  };

  const baseScore =
    skillMatch * weights.skill +
    workloadScore * weights.workload +
    performanceScore * weights.performance +
    availabilityScore * weights.availability;

  const finalScore = baseScore * priorityMultiplier;

  // Generate reasons for the assignment
  const reasons: string[] = [];
  const skillMatches: string[] = [];

  if (skillMatch > 0.7) {
    reasons.push('High skill match');
    // Find matching skills
    const taskTags = task.tags || [];
    const taskDesc = ((task.title || '') + ' ' + (task.description || '')).toLowerCase();
    for (const skill of agent.skills) {
      if (
        taskTags.some(tag => tag.toLowerCase().includes(skill.toLowerCase())) ||
        taskDesc.includes(skill.toLowerCase())
      ) {
        skillMatches.push(skill);
      }
    }
  } else if (skillMatch > 0.4) {
    reasons.push('Moderate skill match');
  }

  if (workloadScore > 0.7) {
    reasons.push('Low current workload');
  } else if (workloadScore < 0.3) {
    reasons.push('High current workload');
  }

  if (performanceScore > 0.85) {
    reasons.push('Excellent performance history');
  }

  if (availabilityScore === 1) {
    reasons.push('Currently available');
  } else if (availabilityScore === 0) {
    reasons.push('Currently offline');
  }

  if (agent.specialization) {
    const taskDesc = ((task.title || '') + ' ' + (task.description || '')).toLowerCase();
    if (taskDesc.includes(agent.specialization.toLowerCase())) {
      reasons.push(`Specialization: ${agent.specialization}`);
      skillMatches.push(agent.specialization);
    }
  }

  return {
    agentId: agent.id,
    score: finalScore,
    reasons,
    skillMatches,
    availability: agent.availabilityStatus,
  };
}

/**
 * Find the best agent for a task
 */
export function findBestAgent(
  task: Partial<Task>,
  agents: CodingAgent[]
): AgentAssignmentScore | null {
  if (agents.length === 0) return null;

  const scores = agents.map(agent => calculateAgentScore(task, agent));

  // Sort by score descending
  scores.sort((a, b) => b.score - a.score);

  // Return the best match
  return scores[0];
}

/**
 * Auto-assign multiple tasks to agents
 */
export function autoAssignTasks(
  tasks: Partial<Task>[],
  agents: CodingAgent[]
): Map<string, string> {
  const assignments = new Map<string, string>(); // taskId -> agentId

  // Create a working copy of agents with updated workload
  const agentWorkloads = new Map<string, number>();
  agents.forEach(agent => {
    agentWorkloads.set(agent.id, agent.tasksInProgress || 0);
  });

  // Sort tasks by priority (high to low)
  const sortedTasks = [...tasks].sort((a, b) => (b.priority || 3) - (a.priority || 3));

  for (const task of sortedTasks) {
    if (!task.taskId) continue;

    // Update agent workloads for scoring
    const updatedAgents = agents.map(agent => ({
      ...agent,
      tasksInProgress: agentWorkloads.get(agent.id) || agent.tasksInProgress || 0,
    }));

    const bestMatch = findBestAgent(task, updatedAgents);

    if (bestMatch && bestMatch.score > 0.3) {
      // Assign if score is reasonable
      assignments.set(task.taskId, bestMatch.agentId);

      // Update workload
      const currentWorkload = agentWorkloads.get(bestMatch.agentId) || 0;
      agentWorkloads.set(bestMatch.agentId, currentWorkload + 1);
    }
  }

  return assignments;
}

/**
 * Get agent recommendations for a task
 */
export function getAgentRecommendations(
  task: Partial<Task>,
  agents: CodingAgent[],
  topN: number = 3
): AgentAssignmentScore[] {
  const scores = agents.map(agent => calculateAgentScore(task, agent));

  // Sort by score descending
  scores.sort((a, b) => b.score - a.score);

  // Return top N recommendations
  return scores.slice(0, topN);
}

/**
 * Update agent performance metrics based on task completion
 */
export function updateAgentPerformance(
  agent: CodingAgent,
  taskCompleted: boolean,
  taskQuality: number = 1.0, // 0-1 scale
  timeEfficiency: number = 1.0 // actual/estimated time
): Partial<CodingAgent> {
  const currentScore = agent.performanceScore || 80;
  const tasksCompleted = agent.tasksCompleted || 0;

  // Calculate new performance score
  let scoreAdjustment = 0;

  if (taskCompleted) {
    // Positive adjustment based on quality and efficiency
    scoreAdjustment = (taskQuality * 2 + (1 - Math.abs(1 - timeEfficiency)) * 1) / 3;
    scoreAdjustment = scoreAdjustment * 2 - 1; // Scale to -1 to 1 range
  } else {
    // Task failed or incomplete
    scoreAdjustment = -5;
  }

  // Use exponential moving average to update score
  const alpha = 0.1; // Learning rate
  const newScore = Math.max(
    0,
    Math.min(100, currentScore + scoreAdjustment * alpha * 10)
  );

  return {
    performanceScore: newScore,
    tasksCompleted: taskCompleted ? tasksCompleted + 1 : tasksCompleted,
  };
}

/**
 * Balance workload across agents
 */
export function balanceWorkload(
  tasks: Partial<Task>[],
  agents: CodingAgent[]
): Map<string, string> {
  const assignments = new Map<string, string>();

  if (agents.length === 0 || tasks.length === 0) return assignments;

  // Sort tasks by priority
  const sortedTasks = [...tasks].sort((a, b) => (b.priority || 3) - (a.priority || 3));

  // Create workload tracker
  const agentLoads = new Map<string, number>();
  agents.forEach(agent => {
    agentLoads.set(agent.id, agent.tasksInProgress || 0);
  });

  // Round-robin with skill matching
  for (const task of sortedTasks) {
    if (!task.taskId) continue;

    // Get top 3 candidates by skill match
    const candidates = agents
      .map(agent => ({
        agent,
        skillMatch: calculateSkillMatch(task, agent),
        currentLoad: agentLoads.get(agent.id) || 0,
      }))
      .filter(c => c.agent.availabilityStatus !== 'offline')
      .sort((a, b) => {
        // Prefer skill match, then lower workload
        const scoreDiff = b.skillMatch - a.skillMatch;
        if (Math.abs(scoreDiff) > 0.2) return scoreDiff;
        return a.currentLoad - b.currentLoad;
      });

    if (candidates.length > 0) {
      const selected = candidates[0].agent;
      assignments.set(task.taskId, selected.id);
      agentLoads.set(selected.id, (agentLoads.get(selected.id) || 0) + 1);
    }
  }

  return assignments;
}
