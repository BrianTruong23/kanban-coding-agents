import { CodingAgent, Skill, SkillCategory } from '@/types/agent';
import { TaskBreakdownItem } from '@/types/taskBreakdown';

interface AssignmentScore {
  agentId: string;
  score: number;
  reasons: string[];
}

/**
 * Calculates skill match score between agent and task
 */
function calculateSkillMatch(agent: CodingAgent, task: TaskBreakdownItem): number {
  if (!agent.skills || agent.skills.length === 0) return 0.5; // neutral score if no skills defined

  const taskTags = task.tags.map(t => t.toLowerCase());
  let totalScore = 0;
  let matchCount = 0;

  // Map task tags to skill categories
  const tagToSkillMap: { [key: string]: SkillCategory } = {
    'frontend': 'frontend',
    'ui': 'frontend',
    'react': 'frontend',
    'backend': 'backend',
    'api': 'backend',
    'server': 'backend',
    'database': 'database',
    'db': 'database',
    'devops': 'devops',
    'deployment': 'devops',
    'mobile': 'mobile',
    'testing': 'testing',
    'qa': 'testing',
    'design': 'design',
    'architecture': 'architecture',
  };

  taskTags.forEach(tag => {
    const skillCategory = tagToSkillMap[tag];
    if (skillCategory) {
      const agentSkill = agent.skills?.find(s => s.category === skillCategory);
      if (agentSkill) {
        // Proficiency contributes to score (1-5 maps to 0.2-1.0)
        totalScore += agentSkill.proficiency / 5;
        matchCount++;
      }
    }
  });

  // Return average score, or 0 if no matches
  return matchCount > 0 ? totalScore / matchCount : 0;
}

/**
 * Calculates performance score for an agent
 */
function calculatePerformanceScore(agent: CodingAgent): number {
  if (!agent.performance) return 0.5; // neutral score if no performance data

  const perf = agent.performance;

  // Calculate on-time delivery rate (0-1)
  const onTimeRate = perf.tasksCompleted > 0
    ? perf.tasksOnTime / perf.tasksCompleted
    : 0.5;

  // Normalize quality score (0-100 to 0-1)
  const qualityRate = perf.qualityScore / 100;

  // Weighted combination
  return (onTimeRate * 0.6) + (qualityRate * 0.4);
}

/**
 * Calculates availability score for an agent
 */
function calculateAvailabilityScore(agent: CodingAgent): number {
  if (!agent.availability) return 1.0; // assume available if not specified

  const avail = agent.availability;

  // Status check
  if (avail.status === 'offline') return 0;
  if (avail.status === 'busy' && avail.currentWorkload >= avail.capacity) return 0.1;

  // Calculate workload ratio
  const workloadRatio = avail.currentWorkload / avail.capacity;

  // Return inverse of workload (more available = higher score)
  return Math.max(0, 1 - workloadRatio);
}

/**
 * Calculates priority bonus for critical tasks
 */
function calculatePriorityBonus(task: TaskBreakdownItem): number {
  // High priority tasks get bonus weighting
  return task.priority >= 4 ? 1.2 : 1.0;
}

/**
 * Main function to auto-assign tasks to agents
 */
export function autoAssignTask(
  task: TaskBreakdownItem,
  agents: CodingAgent[]
): CodingAgent | null {
  if (agents.length === 0) return null;

  const scores: AssignmentScore[] = agents.map(agent => {
    const reasons: string[] = [];

    // Calculate individual component scores
    const skillScore = calculateSkillMatch(agent, task);
    const performanceScore = calculatePerformanceScore(agent);
    const availabilityScore = calculateAvailabilityScore(agent);
    const priorityMultiplier = calculatePriorityBonus(task);

    // Add reasons for transparency
    if (skillScore > 0.7) {
      reasons.push('Strong skill match');
    } else if (skillScore < 0.3) {
      reasons.push('Limited skill match');
    }

    if (performanceScore > 0.7) {
      reasons.push('Excellent performance history');
    }

    if (availabilityScore < 0.3) {
      reasons.push('Heavy current workload');
    } else if (availabilityScore > 0.8) {
      reasons.push('High availability');
    }

    // Weighted combination
    // Skills: 40%, Performance: 30%, Availability: 30%
    const baseScore = (
      skillScore * 0.4 +
      performanceScore * 0.3 +
      availabilityScore * 0.3
    );

    const finalScore = baseScore * priorityMultiplier;

    return {
      agentId: agent.id,
      score: finalScore,
      reasons,
    };
  });

  // Sort by score descending
  scores.sort((a, b) => b.score - a.score);

  // Return the best matching agent
  const bestMatch = scores[0];
  if (bestMatch.score > 0.2) { // minimum threshold
    return agents.find(a => a.id === bestMatch.agentId) || null;
  }

  return null; // no good match found
}

/**
 * Batch assign multiple tasks to agents, considering dependencies and load balancing
 */
export function batchAutoAssign(
  tasks: TaskBreakdownItem[],
  agents: CodingAgent[],
  dependencies: { fromItemId: string; toItemId: string }[]
): Map<string, string> {
  const assignments = new Map<string, string>(); // taskId -> agentId
  const agentWorkload = new Map<string, number>(); // agentId -> task count

  // Initialize workload counter
  agents.forEach(agent => {
    agentWorkload.set(agent.id, agent.availability?.currentWorkload || 0);
  });

  // Sort tasks by priority (higher priority first)
  const sortedTasks = [...tasks].sort((a, b) => b.priority - a.priority);

  sortedTasks.forEach(task => {
    // Check if task has dependencies
    const taskDependencies = dependencies.filter(d => d.fromItemId === task.id);

    // If task has dependencies on other tasks, try to assign to the same agent for continuity
    if (taskDependencies.length > 0) {
      const dependentTaskIds = taskDependencies.map(d => d.toItemId);
      const dependentAssignments = dependentTaskIds
        .map(id => assignments.get(id))
        .filter((id): id is string => id !== undefined);

      if (dependentAssignments.length > 0) {
        // Prefer assigning to same agent as dependency for context
        const preferredAgentId = dependentAssignments[0];
        const preferredAgent = agents.find(a => a.id === preferredAgentId);

        if (preferredAgent &&
            (!preferredAgent.availability ||
             (agentWorkload.get(preferredAgentId) || 0) < (preferredAgent.availability.capacity || Infinity))) {
          assignments.set(task.id, preferredAgentId);
          agentWorkload.set(preferredAgentId, (agentWorkload.get(preferredAgentId) || 0) + 1);
          return;
        }
      }
    }

    // Otherwise, use standard auto-assignment
    const agent = autoAssignTask(task, agents);
    if (agent) {
      assignments.set(task.id, agent.id);
      agentWorkload.set(agent.id, (agentWorkload.get(agent.id) || 0) + 1);
    }
  });

  return assignments;
}

/**
 * Suggests reassignment if an agent is overloaded
 */
export function suggestReassignment(
  agentId: string,
  tasks: TaskBreakdownItem[],
  agents: CodingAgent[]
): { taskId: string; suggestedAgentId: string; reason: string }[] {
  const suggestions: { taskId: string; suggestedAgentId: string; reason: string }[] = [];

  const agent = agents.find(a => a.id === agentId);
  if (!agent || !agent.availability) return suggestions;

  // Check if agent is overloaded
  if (agent.availability.currentWorkload <= agent.availability.capacity) {
    return suggestions;
  }

  // Find tasks assigned to this agent
  const agentTasks = tasks.filter(t => t.assignedAgentId === agentId);

  // Sort by priority (reassign lower priority tasks first)
  const sortedTasks = [...agentTasks].sort((a, b) => a.priority - b.priority);

  // Try to reassign lower priority tasks
  for (const task of sortedTasks) {
    if (agent.availability.currentWorkload <= agent.availability.capacity) {
      break; // agent no longer overloaded
    }

    // Find alternative agents
    const otherAgents = agents.filter(a => a.id !== agentId);
    const alternativeAgent = autoAssignTask(task, otherAgents);

    if (alternativeAgent) {
      suggestions.push({
        taskId: task.id,
        suggestedAgentId: alternativeAgent.id,
        reason: `${agent.name} is overloaded. ${alternativeAgent.name} has capacity and matching skills.`,
      });

      // Simulate reassignment for next iteration
      agent.availability.currentWorkload--;
      if (alternativeAgent.availability) {
        alternativeAgent.availability.currentWorkload++;
      }
    }
  }

  return suggestions;
}

/**
 * Analyzes team capacity vs workload
 */
export function analyzeTeamCapacity(
  tasks: TaskBreakdownItem[],
  agents: CodingAgent[]
): {
  totalCapacity: number;
  totalWorkload: number;
  utilizationRate: number;
  isOverloaded: boolean;
  recommendations: string[];
} {
  const totalCapacity = agents.reduce((sum, agent) =>
    sum + (agent.availability?.capacity || 0), 0
  );

  const totalWorkload = agents.reduce((sum, agent) =>
    sum + (agent.availability?.currentWorkload || 0), 0
  );

  const pendingTasks = tasks.filter(t =>
    t.status === 'not-started' || t.status === 'in-progress'
  ).length;

  const utilizationRate = totalCapacity > 0 ? totalWorkload / totalCapacity : 0;
  const isOverloaded = utilizationRate > 0.9;

  const recommendations: string[] = [];

  if (isOverloaded) {
    recommendations.push('Team is at or near capacity. Consider adding more agents or extending timeline.');
  }

  if (utilizationRate < 0.5) {
    recommendations.push('Team has significant spare capacity. Consider pulling in additional work.');
  }

  if (pendingTasks > totalCapacity * 2) {
    recommendations.push(`Large backlog detected (${pendingTasks} pending tasks). Prioritize ruthlessly.`);
  }

  // Check for skill gaps
  const requiredSkills = new Set<string>();
  tasks.forEach(task => {
    task.tags.forEach(tag => requiredSkills.add(tag));
  });

  const availableSkills = new Set<SkillCategory>();
  agents.forEach(agent => {
    agent.skills?.forEach(skill => availableSkills.add(skill.category));
  });

  const missingSkills = Array.from(requiredSkills).filter(skill => {
    const category = skill as SkillCategory;
    return !availableSkills.has(category);
  });

  if (missingSkills.length > 0) {
    recommendations.push(`Skill gaps identified: ${missingSkills.join(', ')}. Consider training or hiring.`);
  }

  return {
    totalCapacity,
    totalWorkload,
    utilizationRate,
    isOverloaded,
    recommendations,
  };
}
