import { CodingAgent } from '@/types/agent';
import { TaskBreakdown, AgentSkill, AgentAvailability } from '@/types/breakdown';

/**
 * Agent Orchestration Service
 * Handles agent skill matching, auto-assignment, and load balancing
 */

interface SkillMatch {
  agentId: string;
  score: number;
  matchedSkills: string[];
  missingSkills: string[];
}

/**
 * Calculate skill match score between an agent and required skills
 */
function calculateSkillMatch(agent: CodingAgent, requiredSkills: string[]): SkillMatch {
  const agentSkills = agent.skills || [];
  const matchedSkills: string[] = [];
  const missingSkills: string[] = [];
  let score = 0;

  // Check each required skill
  requiredSkills.forEach(reqSkill => {
    const skillMatch = agentSkills.find(
      s => s.skill.toLowerCase() === reqSkill.toLowerCase()
    );

    if (skillMatch) {
      matchedSkills.push(reqSkill);
      // Score based on proficiency (1-5)
      score += skillMatch.proficiency * 20; // Max 100 per skill
    } else {
      missingSkills.push(reqSkill);
    }
  });

  // Normalize score (0-100)
  if (requiredSkills.length > 0) {
    score = (score / (requiredSkills.length * 100)) * 100;
  }

  return {
    agentId: agent.id,
    score,
    matchedSkills,
    missingSkills
  };
}

/**
 * Calculate agent availability based on current load
 */
function calculateAvailability(
  agent: CodingAgent,
  currentAssignments: Map<string, number>
): AgentAvailability {
  const currentLoad = currentAssignments.get(agent.id) || 0;
  const capacity = agent.capacity || 5; // Default capacity of 5 concurrent tasks

  return {
    agentId: agent.id,
    currentLoad,
    capacity,
    isAvailable: currentLoad < capacity
  };
}

/**
 * Calculate performance score based on agent metrics
 */
function calculatePerformanceScore(agent: CodingAgent): number {
  if (!agent.performance) return 50; // Default score

  const { tasksCompleted, tasksOnTime, qualityScore } = agent.performance;

  if (tasksCompleted === 0) return 50; // No history

  // On-time delivery rate (0-40 points)
  const onTimeRate = (tasksOnTime / tasksCompleted) * 40;

  // Quality score (0-40 points)
  const quality = (qualityScore / 100) * 40;

  // Experience bonus (0-20 points)
  const experience = Math.min((tasksCompleted / 100) * 20, 20);

  return Math.round(onTimeRate + quality + experience);
}

/**
 * Find the best agent for a task
 */
export function findBestAgent(
  task: TaskBreakdown,
  agents: CodingAgent[],
  currentAssignments: Map<string, number> = new Map()
): string | undefined {
  if (agents.length === 0) return undefined;

  // Calculate scores for each agent
  const agentScores = agents.map(agent => {
    const skillMatch = calculateSkillMatch(agent, task.skillsRequired);
    const availability = calculateAvailability(agent, currentAssignments);
    const performance = calculatePerformanceScore(agent);

    // Overall score calculation
    // Skill match: 50%, Performance: 30%, Availability: 20%
    let totalScore = 0;

    // Skill match (0-50 points)
    totalScore += (skillMatch.score / 100) * 50;

    // Performance (0-30 points)
    totalScore += (performance / 100) * 30;

    // Availability (0-20 points)
    if (availability.isAvailable) {
      const loadFactor = 1 - (availability.currentLoad / availability.capacity);
      totalScore += loadFactor * 20;
    }

    return {
      agent,
      totalScore,
      skillMatch,
      availability,
      performance
    };
  });

  // Sort by total score (descending)
  agentScores.sort((a, b) => b.totalScore - a.totalScore);

  // Filter out agents that are at capacity
  const availableAgents = agentScores.filter(a => a.availability.isAvailable);

  if (availableAgents.length === 0) {
    // All agents at capacity, return the one with highest score
    return agentScores[0]?.agent.id;
  }

  // Return the best available agent
  return availableAgents[0]?.agent.id;
}

/**
 * Auto-assign agents to a list of tasks
 */
export function autoAssignAgents(
  tasks: TaskBreakdown[],
  agents: CodingAgent[]
): Map<string, string> {
  const assignments = new Map<string, string>(); // taskId -> agentId
  const currentLoad = new Map<string, number>(); // agentId -> task count

  // Initialize load counters
  agents.forEach(agent => {
    currentLoad.set(agent.id, 0);
  });

  // Sort tasks by priority (highest estimated hours first for better load balancing)
  const sortedTasks = [...tasks].sort((a, b) =>
    (b.estimatedHours || 0) - (a.estimatedHours || 0)
  );

  // Assign each task
  sortedTasks.forEach(task => {
    const bestAgentId = findBestAgent(task, agents, currentLoad);

    if (bestAgentId) {
      assignments.set(task.id, bestAgentId);
      currentLoad.set(bestAgentId, (currentLoad.get(bestAgentId) || 0) + 1);
    }
  });

  return assignments;
}

/**
 * Suggest agent skills based on task requirements
 */
export function suggestAgentSkills(tasks: TaskBreakdown[]): Map<string, number> {
  const skillDemand = new Map<string, number>();

  tasks.forEach(task => {
    task.skillsRequired.forEach(skill => {
      skillDemand.set(skill, (skillDemand.get(skill) || 0) + 1);
    });
  });

  return skillDemand;
}

/**
 * Analyze agent roster and provide recommendations
 */
export interface RosterAnalysis {
  totalAgents: number;
  averageCapacity: number;
  averageLoad: number;
  skillGaps: string[];
  overloadedAgents: string[];
  underutilizedAgents: string[];
  recommendations: string[];
}

export function analyzeAgentRoster(
  agents: CodingAgent[],
  tasks: TaskBreakdown[],
  currentAssignments: Map<string, number>
): RosterAnalysis {
  const totalAgents = agents.length;
  const averageCapacity = agents.reduce((sum, a) => sum + (a.capacity || 5), 0) / totalAgents || 0;
  const averageLoad = Array.from(currentAssignments.values()).reduce((sum, v) => sum + v, 0) / totalAgents || 0;

  // Identify skill gaps
  const requiredSkills = new Set<string>();
  tasks.forEach(task => {
    task.skillsRequired.forEach(skill => requiredSkills.add(skill));
  });

  const availableSkills = new Set<string>();
  agents.forEach(agent => {
    agent.skills?.forEach(skill => availableSkills.add(skill.skill));
  });

  const skillGaps = Array.from(requiredSkills).filter(skill => !availableSkills.has(skill));

  // Identify overloaded/underutilized agents
  const overloadedAgents: string[] = [];
  const underutilizedAgents: string[] = [];

  agents.forEach(agent => {
    const load = currentAssignments.get(agent.id) || 0;
    const capacity = agent.capacity || 5;

    if (load >= capacity) {
      overloadedAgents.push(agent.name);
    } else if (load < capacity * 0.3) {
      underutilizedAgents.push(agent.name);
    }
  });

  // Generate recommendations
  const recommendations: string[] = [];

  if (skillGaps.length > 0) {
    recommendations.push(`Consider training agents in: ${skillGaps.join(', ')}`);
  }

  if (overloadedAgents.length > 0) {
    recommendations.push(`Agents at capacity: ${overloadedAgents.join(', ')}. Consider redistributing tasks or adding capacity.`);
  }

  if (underutilizedAgents.length > 0 && overloadedAgents.length > 0) {
    recommendations.push('Rebalance workload between overloaded and underutilized agents.');
  }

  if (averageLoad > averageCapacity * 0.8) {
    recommendations.push('Team is near capacity. Consider adding more agents or increasing capacity.');
  }

  return {
    totalAgents,
    averageCapacity,
    averageLoad,
    skillGaps,
    overloadedAgents,
    underutilizedAgents,
    recommendations
  };
}
