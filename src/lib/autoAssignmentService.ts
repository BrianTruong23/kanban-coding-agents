import { CodingAgent } from '@/types/agent';
import { AgentSkill, AgentPerformanceMetrics, SkillMatchResult, AgentAvailability } from '@/types/agentSkills';
import { Task } from '@/types/task';

/**
 * Calculate skill match score between required skills and agent skills
 */
function calculateSkillMatchScore(
  requiredSkills: string[],
  agentSkills: AgentSkill[]
): { score: number; matchingSkills: string[] } {
  if (requiredSkills.length === 0) {
    return { score: 50, matchingSkills: [] }; // Neutral score if no specific skills required
  }

  const matchingSkills: string[] = [];
  let totalScore = 0;

  requiredSkills.forEach(requiredSkill => {
    const matchingSkill = agentSkills.find(
      skill => skill.skillName.toLowerCase() === requiredSkill.toLowerCase()
    );

    if (matchingSkill) {
      matchingSkills.push(requiredSkill);
      // Weight by proficiency level (1-5 mapped to 10-50 points)
      totalScore += matchingSkill.proficiencyLevel * 10;
    }
  });

  // Calculate percentage match
  const maxPossibleScore = requiredSkills.length * 50; // 50 points per skill at max proficiency
  const score = maxPossibleScore > 0 ? (totalScore / maxPossibleScore) * 100 : 0;

  return { score: Math.min(score, 100), matchingSkills };
}

/**
 * Calculate workload score (lower workload = higher score)
 */
function calculateWorkloadScore(currentWorkload: number, maxCapacity: number = 5): number {
  if (currentWorkload >= maxCapacity) return 0;
  return ((maxCapacity - currentWorkload) / maxCapacity) * 100;
}

/**
 * Calculate performance score based on metrics
 */
function calculatePerformanceScore(metrics: AgentPerformanceMetrics | undefined): number {
  if (!metrics) return 50; // Neutral score for new agents

  // Weight factors
  const successWeight = 0.4;
  const completionWeight = 0.3;
  const activityWeight = 0.3;

  // Success rate (0-100)
  const successScore = metrics.successRate;

  // Completion time (inverse - faster is better, assume 8 hours is ideal)
  const idealTime = 8;
  const completionScore = metrics.averageCompletionTime > 0
    ? Math.max(0, 100 - Math.abs(metrics.averageCompletionTime - idealTime) * 5)
    : 50;

  // Recent activity (agents active in last 7 days score higher)
  const daysSinceActivity = metrics.lastActivityAt
    ? (Date.now() - metrics.lastActivityAt) / (1000 * 60 * 60 * 24)
    : 999;
  const activityScore = Math.max(0, 100 - (daysSinceActivity * 10));

  return (
    successScore * successWeight +
    completionScore * completionWeight +
    activityScore * activityWeight
  );
}

/**
 * Find the best agent for a task based on skills, workload, and performance
 */
export function findBestAgent(
  requiredSkills: string[],
  agents: CodingAgent[],
  agentSkills: AgentSkill[],
  agentMetrics: AgentPerformanceMetrics[],
  tasks: Task[]
): SkillMatchResult[] {
  const results: SkillMatchResult[] = [];

  agents.forEach(agent => {
    // Get agent's skills
    const skills = agentSkills.filter(s => s.agentId === agent.id);

    // Calculate skill match
    const { score: skillScore, matchingSkills } = calculateSkillMatchScore(requiredSkills, skills);

    // Get agent's current workload
    const currentWorkload = tasks.filter(t => t.assignedAgentId === agent.id && t.status !== 'done').length;
    const workloadScore = calculateWorkloadScore(currentWorkload);

    // Get agent's performance metrics
    const metrics = agentMetrics.find(m => m.agentId === agent.id);
    const performanceScore = calculatePerformanceScore(metrics);

    // Calculate overall match score (weighted average)
    const skillWeight = 0.5;
    const workloadWeight = 0.3;
    const performanceWeight = 0.2;

    const overallScore = (
      skillScore * skillWeight +
      workloadScore * workloadWeight +
      performanceScore * performanceWeight
    );

    results.push({
      agentId: agent.id,
      agentName: agent.name,
      matchScore: Math.round(overallScore),
      matchingSkills,
      currentWorkload,
      successRate: metrics?.successRate || 100,
      averageCompletionTime: metrics?.averageCompletionTime || 0,
      recommended: false, // Will be set below
    });
  });

  // Sort by match score (descending)
  results.sort((a, b) => b.matchScore - a.matchScore);

  // Mark top 3 as recommended
  results.forEach((result, index) => {
    result.recommended = index < 3 && result.matchScore >= 40; // Only recommend if score is reasonable
  });

  return results;
}

/**
 * Automatically assign agents to multiple tasks
 */
export function autoAssignTasks(
  tasks: Array<{ taskId: string; requiredSkills: string[] }>,
  agents: CodingAgent[],
  agentSkills: AgentSkill[],
  agentMetrics: AgentPerformanceMetrics[],
  existingTasks: Task[]
): Array<{ taskId: string; assignedAgentId: string; matchScore: number }> {
  const assignments: Array<{ taskId: string; assignedAgentId: string; matchScore: number }> = [];
  const workloadTracker = new Map<string, number>();

  // Initialize workload tracker
  agents.forEach(agent => {
    const currentWorkload = existingTasks.filter(
      t => t.assignedAgentId === agent.id && t.status !== 'done'
    ).length;
    workloadTracker.set(agent.id, currentWorkload);
  });

  // Sort tasks by complexity/priority (to assign important tasks first)
  const sortedTasks = [...tasks].sort((a, b) => {
    return b.requiredSkills.length - a.requiredSkills.length;
  });

  sortedTasks.forEach(task => {
    // Find best available agent considering current temporary workload
    const availableAgents = agents.filter(agent => {
      const workload = workloadTracker.get(agent.id) || 0;
      return workload < 5; // Max capacity
    });

    if (availableAgents.length === 0) {
      // All agents at capacity, assign to least loaded
      const leastLoaded = agents.reduce((prev, curr) => {
        const prevLoad = workloadTracker.get(prev.id) || 0;
        const currLoad = workloadTracker.get(curr.id) || 0;
        return currLoad < prevLoad ? curr : prev;
      });

      const results = findBestAgent(
        task.requiredSkills,
        [leastLoaded],
        agentSkills,
        agentMetrics,
        existingTasks
      );

      if (results.length > 0) {
        assignments.push({
          taskId: task.taskId,
          assignedAgentId: results[0].agentId,
          matchScore: results[0].matchScore,
        });
        workloadTracker.set(results[0].agentId, (workloadTracker.get(results[0].agentId) || 0) + 1);
      }
    } else {
      const results = findBestAgent(
        task.requiredSkills,
        availableAgents,
        agentSkills,
        agentMetrics,
        existingTasks
      );

      if (results.length > 0) {
        const bestMatch = results[0];
        assignments.push({
          taskId: task.taskId,
          assignedAgentId: bestMatch.agentId,
          matchScore: bestMatch.matchScore,
        });
        workloadTracker.set(bestMatch.agentId, (workloadTracker.get(bestMatch.agentId) || 0) + 1);
      }
    }
  });

  return assignments;
}

/**
 * Get agent availability status
 */
export function getAgentAvailability(
  agents: CodingAgent[],
  tasks: Task[],
  maxCapacity: number = 5
): AgentAvailability[] {
  return agents.map(agent => {
    const currentWorkload = tasks.filter(
      t => t.assignedAgentId === agent.id && t.status !== 'done'
    ).length;

    return {
      agentId: agent.id,
      isAvailable: currentWorkload < maxCapacity,
      currentWorkload,
      maxCapacity,
    };
  });
}

/**
 * Suggest task redistribution to balance workload
 */
export function suggestWorkloadRebalancing(
  agents: CodingAgent[],
  tasks: Task[],
  agentSkills: AgentSkill[],
  agentMetrics: AgentPerformanceMetrics[]
): Array<{ taskId: string; fromAgentId: string; toAgentId: string; reason: string }> {
  const suggestions: Array<{ taskId: string; fromAgentId: string; toAgentId: string; reason: string }> = [];

  // Calculate workload for each agent
  const workloads = new Map<string, Task[]>();
  agents.forEach(agent => {
    workloads.set(
      agent.id,
      tasks.filter(t => t.assignedAgentId === agent.id && t.status !== 'done')
    );
  });

  // Find overloaded agents (>5 tasks)
  agents.forEach(agent => {
    const agentTasks = workloads.get(agent.id) || [];
    if (agentTasks.length > 5) {
      // Find underloaded agents
      const underloadedAgents = agents.filter(a => {
        const load = workloads.get(a.id)?.length || 0;
        return load < 3 && a.id !== agent.id;
      });

      // Try to reassign some tasks
      agentTasks.slice(0, agentTasks.length - 5).forEach(task => {
        const requiredSkills = task.tags; // Using tags as proxy for skills
        const matches = findBestAgent(
          requiredSkills,
          underloadedAgents,
          agentSkills,
          agentMetrics,
          tasks
        );

        if (matches.length > 0 && matches[0].matchScore >= 50) {
          suggestions.push({
            taskId: task.id,
            fromAgentId: agent.id,
            toAgentId: matches[0].agentId,
            reason: `Rebalancing workload - ${matches[0].agentName} has capacity and ${matches[0].matchScore}% match`,
          });
        }
      });
    }
  });

  return suggestions;
}
