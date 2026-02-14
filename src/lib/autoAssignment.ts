import { CodingAgent } from '@/types/agent';
import { Task } from '@/types/task';
import { findBestAgent, rankAgentsForTask } from './agentRoster';

export interface AssignmentResult {
  success: boolean;
  assignedAgent?: CodingAgent;
  reason: string;
  alternatives?: Array<{
    agent: CodingAgent;
    score: number;
    reason: string;
  }>;
}

/**
 * Automatically assign a task to the most suitable agent
 */
export function autoAssignTask(
  task: Task,
  agents: CodingAgent[],
  options: {
    considerWorkload?: boolean;
    considerPerformance?: boolean;
    considerSkills?: boolean;
    maxWorkload?: number;
  } = {}
): AssignmentResult {
  const {
    considerWorkload = true,
    considerPerformance = true,
    considerSkills = true,
    maxWorkload = 5,
  } = options;

  // Filter available agents
  const availableAgents = agents.filter(agent => {
    if (agent.isAvailable === false) return false;
    if (considerWorkload && (agent.currentWorkload || 0) >= maxWorkload) return false;
    return true;
  });

  if (availableAgents.length === 0) {
    return {
      success: false,
      reason: 'No available agents found',
    };
  }

  // Find best agent
  const bestAgent = findBestAgent(availableAgents, task);

  if (!bestAgent) {
    return {
      success: false,
      reason: 'No suitable agent found for this task',
    };
  }

  // Get ranked list for alternatives
  const rankedAgents = rankAgentsForTask(availableAgents, task);
  const alternatives = rankedAgents.slice(1, 4).map(ranked => ({
    agent: ranked.agent,
    score: ranked.score,
    reason: buildAssignmentReason(ranked),
  }));

  const topRanked = rankedAgents[0];
  const reason = buildAssignmentReason(topRanked);

  return {
    success: true,
    assignedAgent: bestAgent,
    reason,
    alternatives,
  };
}

function buildAssignmentReason(ranked: {
  agent: CodingAgent;
  score: number;
  skillMatch: number;
  performanceScore: number;
  workloadScore: number;
}): string {
  const reasons: string[] = [];

  if (ranked.skillMatch > 0.7) {
    reasons.push('strong skill match');
  } else if (ranked.skillMatch > 0.5) {
    reasons.push('good skill match');
  }

  if (ranked.performanceScore > 0.8) {
    reasons.push('excellent track record');
  } else if (ranked.performanceScore > 0.6) {
    reasons.push('good performance history');
  }

  if (ranked.workloadScore > 0.8) {
    reasons.push('low current workload');
  } else if (ranked.workloadScore > 0.5) {
    reasons.push('moderate workload');
  }

  if (reasons.length === 0) {
    return 'Available for assignment';
  }

  return reasons.join(', ');
}

/**
 * Auto-assign multiple tasks optimally
 */
export function autoAssignMultipleTasks(
  tasks: Task[],
  agents: CodingAgent[],
  dependencies: Array<{ sourceTaskId: string; targetTaskId: string }>
): Map<string, string> {
  // Map of taskId -> agentId
  const assignments = new Map<string, string>();

  // Track agent workloads during assignment
  const agentWorkloads = new Map<string, number>();
  agents.forEach(agent => {
    agentWorkloads.set(agent.id, agent.currentWorkload || 0);
  });

  // Sort tasks by priority and dependencies
  const sortedTasks = topologicalSort(tasks, dependencies);

  // Assign each task
  sortedTasks.forEach(task => {
    // Create temporary agent objects with updated workloads
    const updatedAgents = agents.map(agent => ({
      ...agent,
      currentWorkload: agentWorkloads.get(agent.id) || 0,
    }));

    const result = autoAssignTask(task, updatedAgents, {
      maxWorkload: 5,
    });

    if (result.success && result.assignedAgent) {
      assignments.set(task.id, result.assignedAgent.id);

      // Update workload
      const currentWorkload = agentWorkloads.get(result.assignedAgent.id) || 0;
      agentWorkloads.set(result.assignedAgent.id, currentWorkload + 1);
    }
  });

  return assignments;
}

/**
 * Topological sort to handle dependencies
 */
function topologicalSort(
  tasks: Task[],
  dependencies: Array<{ sourceTaskId: string; targetTaskId: string }>
): Task[] {
  // Build adjacency list
  const graph = new Map<string, string[]>();
  const inDegree = new Map<string, number>();

  tasks.forEach(task => {
    if (!graph.has(task.id)) graph.set(task.id, []);
    if (!inDegree.has(task.id)) inDegree.set(task.id, 0);
  });

  dependencies.forEach(dep => {
    const edges = graph.get(dep.sourceTaskId) || [];
    edges.push(dep.targetTaskId);
    graph.set(dep.sourceTaskId, edges);

    const degree = inDegree.get(dep.targetTaskId) || 0;
    inDegree.set(dep.targetTaskId, degree + 1);
  });

  // Kahn's algorithm
  const queue: Task[] = [];
  const sorted: Task[] = [];

  tasks.forEach(task => {
    if ((inDegree.get(task.id) || 0) === 0) {
      queue.push(task);
    }
  });

  // Sort queue by priority
  queue.sort((a, b) => b.priority - a.priority);

  while (queue.length > 0) {
    const task = queue.shift()!;
    sorted.push(task);

    const edges = graph.get(task.id) || [];
    edges.forEach(targetId => {
      const degree = (inDegree.get(targetId) || 0) - 1;
      inDegree.set(targetId, degree);

      if (degree === 0) {
        const targetTask = tasks.find(t => t.id === targetId);
        if (targetTask) queue.push(targetTask);
      }
    });

    // Re-sort queue by priority
    queue.sort((a, b) => b.priority - a.priority);
  }

  // If not all tasks are sorted, there's a cycle or unconnected tasks
  if (sorted.length < tasks.length) {
    // Add remaining tasks sorted by priority
    const remaining = tasks.filter(t => !sorted.includes(t));
    remaining.sort((a, b) => b.priority - a.priority);
    sorted.push(...remaining);
  }

  return sorted;
}

/**
 * Suggest reassignments to balance workload
 */
export function suggestReassignments(
  tasks: Task[],
  agents: CodingAgent[]
): Array<{
  task: Task;
  currentAgent: CodingAgent;
  suggestedAgent: CodingAgent;
  reason: string;
}> {
  const suggestions: Array<{
    task: Task;
    currentAgent: CodingAgent;
    suggestedAgent: CodingAgent;
    reason: string;
  }> = [];

  // Find overloaded agents
  const avgWorkload =
    agents.reduce((sum, a) => sum + (a.currentWorkload || 0), 0) / agents.length;

  const overloadedAgents = agents.filter(a => (a.currentWorkload || 0) > avgWorkload + 2);
  const underutilizedAgents = agents.filter(
    a => (a.currentWorkload || 0) < avgWorkload - 1 && a.isAvailable !== false
  );

  if (overloadedAgents.length === 0 || underutilizedAgents.length === 0) {
    return suggestions;
  }

  // For each overloaded agent, suggest moving tasks
  overloadedAgents.forEach(overloadedAgent => {
    const agentTasks = tasks.filter(t => t.assignedAgentId === overloadedAgent.id);

    // Sort by lowest priority first (easier to reassign)
    agentTasks.sort((a, b) => a.priority - b.priority);

    agentTasks.slice(0, 2).forEach(task => {
      const bestAlternative = findBestAgent(underutilizedAgents, task);

      if (bestAlternative) {
        suggestions.push({
          task,
          currentAgent: overloadedAgent,
          suggestedAgent: bestAlternative,
          reason: `${overloadedAgent.name} is overloaded (${overloadedAgent.currentWorkload} tasks), ${bestAlternative.name} has capacity`,
        });
      }
    });
  });

  return suggestions;
}
