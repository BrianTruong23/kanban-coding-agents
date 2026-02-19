import { Task } from '@/types/task';
import { AgentWithSkills, AgentAssignmentScore, AgentSkill, AgentPerformance } from '@/types/agent';

/**
 * Calculate how well an agent's skills match a task's requirements
 */
function calculateSkillMatchScore(
  agentSkills: AgentSkill[],
  requiredSkills: string[]
): {
  score: number;
  matchedSkills: string[];
  missingSkills: string[];
} {
  if (requiredSkills.length === 0) {
    return { score: 50, matchedSkills: [], missingSkills: [] }; // Neutral score for tasks with no specific requirements
  }

  const matchedSkills: string[] = [];
  const missingSkills: string[] = [];
  let totalSkillScore = 0;

  for (const requiredSkill of requiredSkills) {
    const agentSkill = agentSkills.find(
      s => s.skillName.toLowerCase() === requiredSkill.toLowerCase()
    );

    if (agentSkill) {
      matchedSkills.push(requiredSkill);
      // Weight by proficiency: 1->20, 2->40, 3->60, 4->80, 5->100
      totalSkillScore += agentSkill.proficiencyLevel * 20;
    } else {
      missingSkills.push(requiredSkill);
    }
  }

  // Average skill proficiency for matched skills
  const score = requiredSkills.length > 0
    ? (totalSkillScore / requiredSkills.length)
    : 0;

  return { score, matchedSkills, missingSkills };
}

/**
 * Calculate availability score based on current workload
 */
function calculateAvailabilityScore(
  agentId: string,
  allTasks: Task[]
): number {
  const activeTasks = allTasks.filter(
    t => t.assignedAgentId === agentId && t.status !== 'done'
  );

  // Calculate total estimated hours
  const totalHours = activeTasks.reduce((sum, task) => {
    return sum + (task.estimatedHours || 0);
  }, 0);

  // Assume agents have 40 hours/week capacity
  // 0 hours = 100 score, 40+ hours = 0 score
  const capacity = 40;
  const score = Math.max(0, 100 - (totalHours / capacity) * 100);

  return score;
}

/**
 * Calculate performance score based on historical data
 */
function calculatePerformanceScore(
  performanceMetrics?: AgentWithSkills['performanceMetrics']
): number {
  if (!performanceMetrics || performanceMetrics.totalTasksCompleted === 0) {
    return 70; // Default score for agents with no history
  }

  const qualityWeight = 0.5;
  const onTimeWeight = 0.3;
  const experienceWeight = 0.2;

  // Quality score (1-5 -> 0-100)
  const qualityScore = (performanceMetrics.averageQualityScore / 5) * 100;

  // On-time percentage (already 0-100)
  const onTimeScore = performanceMetrics.onTimePercentage;

  // Experience bonus (logarithmic scale)
  const experienceScore = Math.min(100, Math.log10(performanceMetrics.totalTasksCompleted + 1) * 50);

  const score =
    qualityScore * qualityWeight +
    onTimeScore * onTimeWeight +
    experienceScore * experienceWeight;

  return score;
}

/**
 * Auto-assign tasks to agents based on skills, availability, and performance
 */
export function calculateAgentAssignmentScores(
  task: Task,
  agents: AgentWithSkills[],
  allTasks: Task[]
): AgentAssignmentScore[] {
  // Extract required skills from task tags
  const requiredSkills = task.tags || [];

  const scores: AgentAssignmentScore[] = agents.map(agent => {
    const skillMatch = calculateSkillMatchScore(agent.skills, requiredSkills);
    const availabilityScore = calculateAvailabilityScore(agent.id, allTasks);
    const performanceScore = calculatePerformanceScore(agent.performanceMetrics);

    // Weighted average
    const weights = {
      skill: 0.5,
      availability: 0.3,
      performance: 0.2,
    };

    const totalScore =
      skillMatch.score * weights.skill +
      availabilityScore * weights.availability +
      performanceScore * weights.performance;

    return {
      agentId: agent.id,
      agentName: agent.name,
      skillMatchScore: Math.round(skillMatch.score),
      availabilityScore: Math.round(availabilityScore),
      performanceScore: Math.round(performanceScore),
      totalScore: Math.round(totalScore),
      matchedSkills: skillMatch.matchedSkills,
      missingSkills: skillMatch.missingSkills,
    };
  });

  // Sort by total score (descending)
  scores.sort((a, b) => b.totalScore - a.totalScore);

  return scores;
}

/**
 * Get the best agent for a task
 */
export function getBestAgentForTask(
  task: Task,
  agents: AgentWithSkills[],
  allTasks: Task[]
): AgentAssignmentScore | null {
  const scores = calculateAgentAssignmentScores(task, agents, allTasks);
  return scores.length > 0 ? scores[0] : null;
}

/**
 * Auto-assign multiple tasks to agents, optimizing for balanced workload
 */
export function autoAssignTasks(
  tasks: Task[],
  agents: AgentWithSkills[],
  allTasks: Task[]
): Map<string, string> {
  const assignments = new Map<string, string>(); // taskId -> agentId
  const workloadCopy = [...allTasks];

  // Sort tasks by priority (high to low) and estimated hours (high to low)
  const sortedTasks = [...tasks].sort((a, b) => {
    if (a.priority !== b.priority) {
      return b.priority - a.priority; // Higher priority first
    }
    return (b.estimatedHours || 0) - (a.estimatedHours || 0); // Larger tasks first
  });

  for (const task of sortedTasks) {
    const bestAgent = getBestAgentForTask(task, agents, workloadCopy);

    if (bestAgent) {
      assignments.set(task.id, bestAgent.agentId);

      // Add this task to workload for next iteration
      workloadCopy.push({
        ...task,
        assignedAgentId: bestAgent.agentId,
      });
    }
  }

  return assignments;
}

/**
 * Suggest agent reassignments for better load balancing
 */
export function suggestReassignments(
  agents: AgentWithSkills[],
  allTasks: Task[]
): {
  taskId: string;
  currentAgentId: string;
  suggestedAgentId: string;
  reason: string;
}[] {
  const suggestions: {
    taskId: string;
    currentAgentId: string;
    suggestedAgentId: string;
    reason: string;
  }[] = [];

  // Calculate workload per agent
  const workloadMap = new Map<string, { hours: number; tasks: Task[] }>();

  for (const agent of agents) {
    workloadMap.set(agent.id, { hours: 0, tasks: [] });
  }

  for (const task of allTasks) {
    if (task.assignedAgentId && task.status !== 'done') {
      const workload = workloadMap.get(task.assignedAgentId);
      if (workload) {
        workload.hours += task.estimatedHours || 0;
        workload.tasks.push(task);
      }
    }
  }

  // Find overloaded agents (>40 hours)
  for (const [agentId, workload] of workloadMap.entries()) {
    if (workload.hours > 40) {
      // Try to reassign some tasks
      const tasksToReassign = workload.tasks
        .filter(t => t.status === 'backlog') // Only reassign not-started tasks
        .sort((a, b) => (b.estimatedHours || 0) - (a.estimatedHours || 0)); // Largest first

      for (const task of tasksToReassign) {
        const alternativeScores = calculateAgentAssignmentScores(
          task,
          agents.filter(a => a.id !== agentId),
          allTasks
        );

        if (alternativeScores.length > 0 && alternativeScores[0].totalScore > 60) {
          suggestions.push({
            taskId: task.id,
            currentAgentId: agentId,
            suggestedAgentId: alternativeScores[0].agentId,
            reason: `Rebalance workload (${workload.hours}h -> ${workload.hours - (task.estimatedHours || 0)}h)`,
          });

          // Update workload for next iteration
          workload.hours -= task.estimatedHours || 0;
          const newWorkload = workloadMap.get(alternativeScores[0].agentId);
          if (newWorkload) {
            newWorkload.hours += task.estimatedHours || 0;
          }

          if (workload.hours <= 40) break; // No longer overloaded
        }
      }
    }
  }

  return suggestions;
}
