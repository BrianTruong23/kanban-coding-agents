// Agent Roster Management and Auto-Assignment Service

import {
  EnhancedAgent,
  AgentSkill,
  AgentPerformance,
  AssignmentRecommendation,
  EnhancedTask
} from '@/types/breakdown';

/**
 * Calculates assignment recommendations for a task based on agent skills and performance
 */
export function calculateAssignmentRecommendations(
  task: EnhancedTask,
  agents: EnhancedAgent[]
): AssignmentRecommendation[] {
  const recommendations: AssignmentRecommendation[] = [];

  for (const agent of agents) {
    const skillMatch = calculateSkillMatch(task, agent);
    const availabilityScore = calculateAvailabilityScore(agent);
    const performanceScore = calculatePerformanceScore(agent);

    const confidence = (skillMatch * 0.5 + availabilityScore * 0.2 + performanceScore * 0.3);

    const reasoning: string[] = [];

    // Add reasoning based on skill match
    if (skillMatch > 0.7) {
      reasoning.push(`Strong skill match (${Math.round(skillMatch * 100)}%)`);
    } else if (skillMatch > 0.4) {
      reasoning.push(`Moderate skill match (${Math.round(skillMatch * 100)}%)`);
    } else {
      reasoning.push(`Limited skill match (${Math.round(skillMatch * 100)}%)`);
    }

    // Add reasoning based on availability
    if (agent.availability === 'available' && agent.currentWorkload < 3) {
      reasoning.push('Low workload, immediately available');
    } else if (agent.availability === 'available') {
      reasoning.push('Available but has moderate workload');
    } else if (agent.availability === 'busy') {
      reasoning.push('Currently busy with other tasks');
    } else {
      reasoning.push('Agent is offline');
    }

    // Add reasoning based on performance
    if (performanceScore > 0.8) {
      reasoning.push('Excellent performance history');
    } else if (performanceScore > 0.6) {
      reasoning.push('Good performance history');
    } else if (performanceScore < 0.4) {
      reasoning.push('Needs improvement in performance');
    }

    recommendations.push({
      agentId: agent.id,
      agentName: agent.name,
      confidence,
      reasoning,
      skillMatch,
      availabilityScore,
      performanceScore
    });
  }

  // Sort by confidence (highest first)
  return recommendations.sort((a, b) => b.confidence - a.confidence);
}

/**
 * Calculates how well an agent's skills match the task requirements
 */
function calculateSkillMatch(task: EnhancedTask, agent: EnhancedAgent): number {
  if (!agent.skills || agent.skills.length === 0) {
    return 0.3; // Base score for agents without defined skills
  }

  const taskTags = task.tags || [];
  const taskDescription = (task.title + ' ' + task.description).toLowerCase();

  let totalMatch = 0;
  let matchCount = 0;

  // Check each agent skill against task requirements
  for (const skill of agent.skills) {
    const skillName = skill.skillName.toLowerCase();
    const proficiency = skill.proficiencyLevel / 5; // Normalize to 0-1

    // Check if skill matches task tags
    const tagMatch = taskTags.some(tag =>
      tag.toLowerCase().includes(skillName) ||
      skillName.includes(tag.toLowerCase())
    );

    // Check if skill is mentioned in task description
    const descriptionMatch = taskDescription.includes(skillName);

    if (tagMatch || descriptionMatch) {
      totalMatch += proficiency;
      matchCount++;
    }
  }

  // Calculate average match score
  if (matchCount === 0) {
    // No direct skill match, but check for general skills
    const generalSkills = agent.skills.filter(s =>
      ['general', 'fullstack', 'development', 'coding'].includes(s.skillName.toLowerCase())
    );

    if (generalSkills.length > 0) {
      return generalSkills.reduce((sum, s) => sum + (s.proficiencyLevel / 5), 0) / generalSkills.length * 0.5;
    }

    return 0.2; // Minimal score for no match
  }

  return Math.min(totalMatch / matchCount, 1.0);
}

/**
 * Calculates availability score based on agent status and workload
 */
function calculateAvailabilityScore(agent: EnhancedAgent): number {
  if (agent.availability === 'offline') {
    return 0;
  }

  if (agent.availability === 'busy') {
    return 0.3;
  }

  // Available status - score based on workload
  const workload = agent.currentWorkload || 0;

  if (workload === 0) return 1.0;
  if (workload === 1) return 0.9;
  if (workload === 2) return 0.7;
  if (workload === 3) return 0.5;
  if (workload === 4) return 0.3;

  return 0.1; // Heavy workload
}

/**
 * Calculates performance score based on agent's historical performance
 */
function calculatePerformanceScore(agent: EnhancedAgent): number {
  const perf = agent.performance;

  if (!perf || perf.tasksCompleted === 0) {
    return 0.5; // Neutral score for new agents
  }

  // Calculate on-time delivery rate
  const onTimeRate = perf.tasksOnTime / perf.tasksCompleted;

  // Normalize quality score (0-100 to 0-1)
  const qualityScore = perf.qualityScore / 100;

  // Combined score
  return (onTimeRate * 0.6 + qualityScore * 0.4);
}

/**
 * Automatically assigns a task to the best matching agent
 */
export function autoAssignTask(
  task: EnhancedTask,
  agents: EnhancedAgent[],
  minConfidence: number = 0.5
): string | undefined {
  const recommendations = calculateAssignmentRecommendations(task, agents);

  if (recommendations.length === 0) {
    return undefined;
  }

  const topRecommendation = recommendations[0];

  // Only auto-assign if confidence meets threshold
  if (topRecommendation.confidence >= minConfidence) {
    return topRecommendation.agentId;
  }

  return undefined;
}

/**
 * Batch assigns multiple tasks to agents optimally
 */
export function batchAssignTasks(
  tasks: EnhancedTask[],
  agents: EnhancedAgent[],
  minConfidence: number = 0.5
): Map<string, string> {
  const assignments = new Map<string, string>(); // taskId -> agentId
  const agentWorkloads = new Map<string, number>(); // agentId -> workload count

  // Initialize workloads
  for (const agent of agents) {
    agentWorkloads.set(agent.id, agent.currentWorkload || 0);
  }

  // Sort tasks by priority (highest first)
  const sortedTasks = [...tasks].sort((a, b) => (b.priority || 0) - (a.priority || 0));

  for (const task of sortedTasks) {
    // Create a temporary copy of agents with updated workloads
    const agentsWithWorkload = agents.map(agent => ({
      ...agent,
      currentWorkload: agentWorkloads.get(agent.id) || 0
    }));

    const recommendations = calculateAssignmentRecommendations(task, agentsWithWorkload);

    if (recommendations.length > 0 && recommendations[0].confidence >= minConfidence) {
      const agentId = recommendations[0].agentId;
      assignments.set(task.id, agentId);

      // Update workload
      const currentWorkload = agentWorkloads.get(agentId) || 0;
      agentWorkloads.set(agentId, currentWorkload + 1);
    }
  }

  return assignments;
}

/**
 * Updates agent performance based on task completion
 */
export function updateAgentPerformance(
  agent: EnhancedAgent,
  task: EnhancedTask,
  wasOnTime: boolean,
  qualityRating: number // 0-100
): AgentPerformance {
  const currentPerf = agent.performance || {
    id: '',
    agentId: agent.id,
    tasksCompleted: 0,
    tasksOnTime: 0,
    tasksLate: 0,
    averageCompletionTime: 0,
    qualityScore: 100,
    lastUpdated: Date.now()
  };

  const newTasksCompleted = currentPerf.tasksCompleted + 1;
  const newTasksOnTime = wasOnTime ? currentPerf.tasksOnTime + 1 : currentPerf.tasksOnTime;
  const newTasksLate = !wasOnTime ? currentPerf.tasksLate + 1 : currentPerf.tasksLate;

  // Calculate new average completion time
  let newAvgCompletionTime = currentPerf.averageCompletionTime;
  if (task.actualHours) {
    newAvgCompletionTime = (
      (currentPerf.averageCompletionTime * currentPerf.tasksCompleted) + task.actualHours
    ) / newTasksCompleted;
  }

  // Calculate new quality score (weighted average)
  const newQualityScore = (
    (currentPerf.qualityScore * currentPerf.tasksCompleted) + qualityRating
  ) / newTasksCompleted;

  return {
    ...currentPerf,
    tasksCompleted: newTasksCompleted,
    tasksOnTime: newTasksOnTime,
    tasksLate: newTasksLate,
    averageCompletionTime: newAvgCompletionTime,
    qualityScore: newQualityScore,
    lastUpdated: Date.now()
  };
}

/**
 * Adds a skill to an agent
 */
export function addSkillToAgent(
  agentId: string,
  skillName: string,
  proficiencyLevel: 1 | 2 | 3 | 4 | 5
): AgentSkill {
  return {
    id: crypto.randomUUID(),
    agentId,
    skillName,
    proficiencyLevel,
    createdAt: Date.now()
  };
}

/**
 * Suggests skills for an agent based on completed tasks
 */
export function suggestSkillsFromTasks(
  completedTasks: EnhancedTask[]
): { skillName: string; count: number }[] {
  const skillCounts = new Map<string, number>();

  for (const task of completedTasks) {
    for (const tag of task.tags || []) {
      skillCounts.set(tag, (skillCounts.get(tag) || 0) + 1);
    }
  }

  return Array.from(skillCounts.entries())
    .map(([skillName, count]) => ({ skillName, count }))
    .sort((a, b) => b.count - a.count);
}

/**
 * Calculates recommended proficiency level based on performance
 */
export function calculateProficiencyLevel(
  tasksCompleted: number,
  averageQuality: number,
  onTimeRate: number
): 1 | 2 | 3 | 4 | 5 {
  // Combine factors
  const score = (
    (tasksCompleted / 10) * 0.3 + // More tasks = more experience
    (averageQuality / 100) * 0.4 + // Quality matters most
    onTimeRate * 0.3 // On-time delivery
  );

  if (score >= 0.9) return 5; // Expert
  if (score >= 0.7) return 4; // Advanced
  if (score >= 0.5) return 3; // Intermediate
  if (score >= 0.3) return 2; // Beginner
  return 1; // Novice
}

/**
 * Gets agent availability based on current workload and status
 */
export function getAgentAvailability(
  currentWorkload: number,
  maxWorkload: number = 5
): 'available' | 'busy' | 'offline' {
  if (currentWorkload >= maxWorkload) {
    return 'busy';
  }
  return 'available';
}

/**
 * Balances workload across agents
 */
export function balanceWorkload(
  agents: EnhancedAgent[]
): { agentId: string; suggestedWorkload: number }[] {
  const totalWorkload = agents.reduce((sum, agent) => sum + (agent.currentWorkload || 0), 0);
  const averageWorkload = totalWorkload / agents.length;

  return agents.map(agent => ({
    agentId: agent.id,
    suggestedWorkload: Math.ceil(averageWorkload)
  }));
}
