/**
 * Agent Assignment Algorithm
 *
 * Automatically assigns tasks to agents based on:
 * - Skill matching
 * - Current workload
 * - Performance history
 * - Task priority
 */

import { CodingAgent, AgentAssignment } from '@/types/agent';
import { Task } from '@/types/task';

interface AssignmentScore {
  agentId: string;
  score: number;
  skillMatches: string[];
  workloadPenalty: number;
  performanceBonus: number;
  reason: string;
}

/**
 * Calculate how well an agent matches a task
 */
function calculateMatchScore(
  agent: CodingAgent,
  task: Task
): AssignmentScore {
  let score = 0;
  const skillMatches: string[] = [];
  let reason = '';

  // 1. Skill matching (0-40 points)
  const agentSkills = (agent.skills || []).map(s => s.toLowerCase());
  const taskTags = task.tags.map(t => t.toLowerCase());

  taskTags.forEach(tag => {
    if (agentSkills.includes(tag)) {
      skillMatches.push(tag);
      score += 10; // Up to 40 points for 4+ matching skills
    }
  });

  // 2. Availability (0-30 points)
  const availability = agent.availability || 'available';
  const workloadScore = {
    'available': 30,
    'busy': 15,
    'overloaded': 0,
    'offline': -100
  }[availability] || 15;

  score += workloadScore;
  const workloadPenalty = 30 - workloadScore;

  // 3. Performance score (0-20 points)
  const performanceScore = (agent.performanceScore || 0) * 4; // Scale 0-5 to 0-20
  score += performanceScore;
  const performanceBonus = performanceScore;

  // 4. Current workload (0-10 points)
  const tasksInProgress = agent.tasksInProgress || 0;
  const workloadPoints = Math.max(0, 10 - (tasksInProgress * 2));
  score += workloadPoints;

  // Generate reason
  if (skillMatches.length > 0) {
    reason = `Matches skills: ${skillMatches.join(', ')}`;
  } else {
    reason = 'General availability';
  }

  if (availability === 'overloaded') {
    reason += ' (currently overloaded)';
  } else if (availability === 'busy') {
    reason += ' (currently busy)';
  }

  if (performanceScore > 15) {
    reason += ', high performance';
  }

  return {
    agentId: agent.id,
    score,
    skillMatches,
    workloadPenalty,
    performanceBonus,
    reason
  };
}

/**
 * Automatically assign a task to the best matching agent
 */
export function autoAssignTask(
  task: Task,
  agents: CodingAgent[]
): AgentAssignment | null {
  if (agents.length === 0) {
    return null;
  }

  // Calculate scores for all agents
  const scores = agents
    .map(agent => calculateMatchScore(agent, task))
    .sort((a, b) => b.score - a.score);

  const bestMatch = scores[0];

  // Don't assign if score is too low or agent is offline
  if (bestMatch.score < 10) {
    return null;
  }

  const agent = agents.find(a => a.id === bestMatch.agentId);
  if (!agent || agent.availability === 'offline') {
    return null;
  }

  return {
    agentId: bestMatch.agentId,
    taskId: task.id,
    assignedAt: Date.now(),
    matchScore: Math.min(1, bestMatch.score / 100), // Normalize to 0-1
    skillMatches: bestMatch.skillMatches,
    reason: bestMatch.reason
  };
}

/**
 * Batch assign multiple tasks to agents
 * Uses a greedy algorithm prioritizing:
 * 1. Task priority
 * 2. Best agent match
 * 3. Balanced workload distribution
 */
export function batchAssignTasks(
  tasks: Task[],
  agents: CodingAgent[]
): Map<string, AgentAssignment> {
  const assignments = new Map<string, AgentAssignment>();

  // Create a mutable copy of agents to track workload
  const agentWorkload = new Map<string, number>(
    agents.map(a => [a.id, a.tasksInProgress || 0])
  );

  // Sort tasks by priority (1 is highest)
  const sortedTasks = [...tasks].sort((a, b) => a.priority - b.priority);

  for (const task of sortedTasks) {
    // Skip already assigned tasks
    if (task.assignedAgentId) {
      continue;
    }

    // Create temporary agent objects with updated workload
    const updatedAgents = agents.map(agent => ({
      ...agent,
      tasksInProgress: agentWorkload.get(agent.id) || 0,
      availability: getAvailabilityByWorkload(
        agentWorkload.get(agent.id) || 0,
        agent.availability
      )
    }));

    const assignment = autoAssignTask(task, updatedAgents);

    if (assignment) {
      assignments.set(task.id, assignment);
      // Update workload for next iteration
      const currentLoad = agentWorkload.get(assignment.agentId) || 0;
      agentWorkload.set(assignment.agentId, currentLoad + 1);
    }
  }

  return assignments;
}

/**
 * Determine agent availability based on current workload
 */
function getAvailabilityByWorkload(
  tasksInProgress: number,
  currentAvailability?: string
): 'available' | 'busy' | 'overloaded' | 'offline' {
  if (currentAvailability === 'offline') {
    return 'offline';
  }

  if (tasksInProgress === 0) {
    return 'available';
  } else if (tasksInProgress <= 3) {
    return 'busy';
  } else {
    return 'overloaded';
  }
}

/**
 * Suggest reassignment of tasks to optimize workload distribution
 */
export function suggestReassignments(
  tasks: Task[],
  agents: CodingAgent[]
): AgentAssignment[] {
  const suggestions: AgentAssignment[] = [];

  // Find overloaded agents
  const overloadedAgents = agents.filter(
    a => (a.tasksInProgress || 0) > 3
  );

  // Find available agents
  const availableAgents = agents.filter(
    a => a.availability === 'available' || (a.tasksInProgress || 0) < 2
  );

  if (availableAgents.length === 0) {
    return suggestions;
  }

  // For each overloaded agent, suggest moving their lowest priority tasks
  for (const overloadedAgent of overloadedAgents) {
    const agentTasks = tasks
      .filter(t => t.assignedAgentId === overloadedAgent.id)
      .filter(t => t.status === 'backlog' || t.status === 'in-progress')
      .sort((a, b) => b.priority - a.priority); // Sort by priority (5 is lowest)

    // Try to reassign lowest priority tasks
    for (const task of agentTasks.slice(-2)) {
      const assignment = autoAssignTask(task, availableAgents);
      if (assignment && assignment.agentId !== overloadedAgent.id) {
        suggestions.push({
          ...assignment,
          reason: `Rebalancing workload from ${overloadedAgent.name}: ${assignment.reason}`
        });
      }
    }
  }

  return suggestions;
}

/**
 * Calculate team capacity metrics
 */
export interface TeamCapacity {
  totalAgents: number;
  availableAgents: number;
  busyAgents: number;
  overloadedAgents: number;
  totalCapacity: number; // Total tasks the team can handle
  currentLoad: number; // Currently assigned tasks
  utilizationRate: number; // Percentage of capacity used
}

export function calculateTeamCapacity(
  agents: CodingAgent[],
  tasks: Task[]
): TeamCapacity {
  const totalAgents = agents.length;
  const availableAgents = agents.filter(a => a.availability === 'available').length;
  const busyAgents = agents.filter(a => a.availability === 'busy').length;
  const overloadedAgents = agents.filter(a => a.availability === 'overloaded').length;

  // Assume each agent can handle ~3 tasks optimally
  const totalCapacity = totalAgents * 3;
  const currentLoad = tasks.filter(
    t => t.status === 'in-progress' || t.status === 'review'
  ).length;
  const utilizationRate = totalCapacity > 0 ? (currentLoad / totalCapacity) * 100 : 0;

  return {
    totalAgents,
    availableAgents,
    busyAgents,
    overloadedAgents,
    totalCapacity,
    currentLoad,
    utilizationRate
  };
}
