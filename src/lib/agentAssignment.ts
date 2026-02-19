import { Task } from '@/types/task';
import { CodingAgent } from '@/types/agent';

/**
 * Agent Auto-Assignment Service
 *
 * Automatically assigns tasks to agents based on:
 * - Skills matching
 * - Current workload (tasks in progress)
 * - Performance score
 * - Specializations
 */

interface AssignmentScore {
  agentId: string;
  score: number;
  reasons: string[];
}

/**
 * Extract required skills from a task
 */
function extractRequiredSkills(task: Task): string[] {
  const skills = new Set<string>();
  const combined = (task.title + ' ' + task.description + ' ' + task.tags.join(' ')).toLowerCase();

  // Skill mapping
  const skillMap: Record<string, string[]> = {
    'frontend': ['react', 'nextjs', 'next.js', 'ui', 'component', 'page', 'css', 'tailwind', 'javascript', 'typescript'],
    'backend': ['api', 'server', 'database', 'sql', 'postgres', 'supabase', 'node', 'endpoint'],
    'fullstack': ['fullstack', 'full-stack', 'full stack'],
    'devops': ['docker', 'ci/cd', 'deploy', 'infrastructure', 'kubernetes', 'aws', 'cloud'],
    'mobile': ['mobile', 'ios', 'android', 'react native', 'flutter'],
    'testing': ['test', 'testing', 'jest', 'cypress', 'unit test', 'e2e', 'qa'],
    'security': ['security', 'auth', 'authentication', 'authorization', 'encryption'],
    'database': ['database', 'sql', 'postgresql', 'migration', 'schema'],
    'design': ['design', 'ui/ux', 'figma', 'wireframe', 'mockup']
  };

  // Extract skills based on content
  Object.entries(skillMap).forEach(([skill, keywords]) => {
    if (keywords.some(keyword => combined.includes(keyword))) {
      skills.add(skill);
    }
  });

  // Add tags as skills
  task.tags.forEach(tag => {
    const normalizedTag = tag.toLowerCase();
    if (normalizedTag.length > 2) {
      skills.add(normalizedTag);
    }
  });

  return Array.from(skills);
}

/**
 * Calculate skill match score between agent and task
 */
function calculateSkillMatch(agentSkills: string[], taskSkills: string[]): number {
  if (taskSkills.length === 0) return 0.5; // Neutral score if no specific skills
  if (agentSkills.length === 0) return 0.3; // Low score if agent has no skills defined

  const normalizedAgentSkills = agentSkills.map(s => s.toLowerCase());
  const normalizedTaskSkills = taskSkills.map(s => s.toLowerCase());

  let matches = 0;
  normalizedTaskSkills.forEach(taskSkill => {
    if (normalizedAgentSkills.some(agentSkill =>
      agentSkill.includes(taskSkill) || taskSkill.includes(agentSkill)
    )) {
      matches++;
    }
  });

  return matches / normalizedTaskSkills.length;
}

/**
 * Calculate workload score (lower is better)
 * Agents with fewer tasks in progress get higher scores
 */
function calculateWorkloadScore(agent: CodingAgent): number {
  const tasksInProgress = agent.tasksInProgress || 0;

  if (tasksInProgress === 0) return 1.0;
  if (tasksInProgress === 1) return 0.8;
  if (tasksInProgress === 2) return 0.6;
  if (tasksInProgress === 3) return 0.4;
  return 0.2; // 4+ tasks
}

/**
 * Get performance score (0-1 scale)
 */
function getPerformanceScore(agent: CodingAgent): number {
  return agent.performanceScore || 0.7; // Default to 0.7 if not set
}

/**
 * Calculate priority alignment score
 * Higher priority tasks should go to higher performing agents
 */
function calculatePriorityAlignment(task: Task, agent: CodingAgent): number {
  const performanceScore = getPerformanceScore(agent);

  if (task.priority >= 4) {
    // High priority tasks should go to high performers
    return performanceScore;
  } else if (task.priority <= 2) {
    // Low priority tasks can go to anyone, slightly prefer those with capacity
    return 0.5 + (1 - performanceScore) * 0.5;
  }

  return 0.7; // Medium priority - neutral
}

/**
 * Calculate overall assignment score for an agent
 */
function calculateAssignmentScore(task: Task, agent: CodingAgent): AssignmentScore {
  const taskSkills = extractRequiredSkills(task);
  const agentSkills = agent.skills || [];

  const skillMatch = calculateSkillMatch(agentSkills, taskSkills);
  const workloadScore = calculateWorkloadScore(agent);
  const performanceScore = getPerformanceScore(agent);
  const priorityAlignment = calculatePriorityAlignment(task, agent);

  // Weighted scoring
  const weights = {
    skillMatch: 0.4,
    workload: 0.3,
    performance: 0.2,
    priority: 0.1
  };

  const totalScore =
    skillMatch * weights.skillMatch +
    workloadScore * weights.workload +
    performanceScore * weights.performance +
    priorityAlignment * weights.priority;

  const reasons: string[] = [];
  if (skillMatch > 0.6) reasons.push(`Strong skill match (${Math.round(skillMatch * 100)}%)`);
  if (workloadScore > 0.8) reasons.push('Low current workload');
  if (performanceScore > 0.8) reasons.push('High performance score');
  if (taskSkills.length > 0) reasons.push(`Required skills: ${taskSkills.join(', ')}`);

  return {
    agentId: agent.id,
    score: totalScore,
    reasons
  };
}

/**
 * Auto-assign a task to the best available agent
 */
export function autoAssignTask(task: Task, agents: CodingAgent[]): {
  agentId: string | undefined;
  score: number;
  reasons: string[];
} {
  if (agents.length === 0) {
    return { agentId: undefined, score: 0, reasons: ['No agents available'] };
  }

  // Calculate scores for all agents
  const scores = agents.map(agent => calculateAssignmentScore(task, agent));

  // Sort by score (descending)
  scores.sort((a, b) => b.score - a.score);

  const best = scores[0];

  return {
    agentId: best.agentId,
    score: best.score,
    reasons: best.reasons
  };
}

/**
 * Get top N agent recommendations for a task
 */
export function getAgentRecommendations(
  task: Task,
  agents: CodingAgent[],
  topN: number = 3
): AssignmentScore[] {
  if (agents.length === 0) return [];

  const scores = agents.map(agent => calculateAssignmentScore(task, agent));
  scores.sort((a, b) => b.score - a.score);

  return scores.slice(0, topN);
}

/**
 * Update agent performance metrics after task completion
 */
export function updateAgentPerformance(
  agent: CodingAgent,
  taskCompleted: boolean,
  actualHours?: number
): Partial<CodingAgent> {
  const currentScore = agent.performanceScore || 0.7;
  const currentCompleted = agent.tasksCompleted || 0;
  const currentAvgTime = agent.avgCompletionTimeHours || 0;

  let newScore = currentScore;
  if (taskCompleted) {
    // Increase score slightly for completed tasks
    newScore = Math.min(1.0, currentScore + 0.02);
  } else {
    // Decrease score for failed/abandoned tasks
    newScore = Math.max(0.0, currentScore - 0.05);
  }

  let newAvgTime = currentAvgTime;
  if (actualHours && taskCompleted) {
    // Update rolling average
    newAvgTime = (currentAvgTime * currentCompleted + actualHours) / (currentCompleted + 1);
  }

  return {
    performanceScore: newScore,
    tasksCompleted: taskCompleted ? currentCompleted + 1 : currentCompleted,
    avgCompletionTimeHours: newAvgTime
  };
}

/**
 * Initialize agent skills based on their description
 */
export function inferAgentSkills(agent: CodingAgent): string[] {
  if (!agent.description) return [];

  const desc = agent.description.toLowerCase();
  const skills: string[] = [];

  const skillPatterns: Record<string, string[]> = {
    'React': ['react'],
    'Next.js': ['nextjs', 'next.js'],
    'Frontend': ['ui', 'frontend', 'component'],
    'Backend': ['api', 'backend', 'server'],
    'Database': ['database', 'sql', 'postgres'],
    'DevOps': ['devops', 'infrastructure', 'deploy'],
    'Mobile': ['mobile', 'ios', 'android'],
    'Testing': ['test', 'qa'],
    'Security': ['security', 'auth'],
    'FullStack': ['fullstack', 'full-stack', 'full stack']
  };

  Object.entries(skillPatterns).forEach(([skill, patterns]) => {
    if (patterns.some(pattern => desc.includes(pattern))) {
      skills.push(skill);
    }
  });

  return skills;
}
