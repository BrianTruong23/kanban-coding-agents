import { Task } from '@/types/task';
import { CodingAgent } from '@/types/agent';

export interface AssignmentScore {
  agentId: string;
  score: number;
  reasons: string[];
}

/**
 * Auto-assign tasks to agents based on skills, performance, and availability
 */
export function autoAssignTask(task: Task, agents: CodingAgent[]): string | null {
  const scores = calculateAssignmentScores(task, agents);

  // Sort by score (highest first)
  scores.sort((a, b) => b.score - a.score);

  // Return the best match, or null if no good match
  if (scores.length > 0 && scores[0].score > 0) {
    return scores[0].agentId;
  }

  return null;
}

/**
 * Calculate assignment scores for all agents
 */
export function calculateAssignmentScores(task: Task, agents: CodingAgent[]): AssignmentScore[] {
  const scores: AssignmentScore[] = [];

  for (const agent of agents) {
    const score = calculateAgentScore(task, agent);
    scores.push(score);
  }

  return scores;
}

/**
 * Calculate how well an agent matches a task
 */
function calculateAgentScore(task: Task, agent: CodingAgent): AssignmentScore {
  let score = 0;
  const reasons: string[] = [];

  // Base score
  score += 10;

  // Skill matching
  const taskRequiredSkills = extractRequiredSkills(task);
  const agentSkills = agent.skills || [];
  const matchingSkills = taskRequiredSkills.filter(skill =>
    agentSkills.some(agentSkill => agentSkill.toLowerCase().includes(skill.toLowerCase()))
  );

  if (matchingSkills.length > 0) {
    const skillScore = matchingSkills.length * 20;
    score += skillScore;
    reasons.push(`Matches ${matchingSkills.length} required skill(s): ${matchingSkills.join(', ')}`);
  }

  // Tag matching
  const taskTags = task.tags || [];
  const tagMatches = taskTags.filter(tag =>
    agentSkills.some(skill => skill.toLowerCase().includes(tag.toLowerCase()))
  );

  if (tagMatches.length > 0) {
    const tagScore = tagMatches.length * 10;
    score += tagScore;
    reasons.push(`Skills match task tags: ${tagMatches.join(', ')}`);
  }

  // Performance score bonus
  const performanceScore = agent.performanceScore || 100;
  const performanceBonus = (performanceScore / 100) * 15;
  score += performanceBonus;
  if (performanceScore > 90) {
    reasons.push(`High performance score (${performanceScore}/100)`);
  }

  // Availability
  const availability = agent.availability || 'available';
  if (availability === 'available') {
    score += 30;
    reasons.push('Currently available');
  } else if (availability === 'busy') {
    score += 5;
    reasons.push('Currently busy (lower priority)');
  } else {
    score -= 50;
    reasons.push('Currently offline');
  }

  // Workload balancing
  const tasksInProgress = agent.tasksInProgress || 0;
  if (tasksInProgress === 0) {
    score += 20;
    reasons.push('No tasks in progress');
  } else if (tasksInProgress < 3) {
    score += 10;
    reasons.push(`Light workload (${tasksInProgress} task(s) in progress)`);
  } else if (tasksInProgress >= 5) {
    score -= 20;
    reasons.push(`Heavy workload (${tasksInProgress} task(s) in progress)`);
  }

  // Priority matching - high priority tasks to high performers
  if (task.priority >= 4 && performanceScore >= 85) {
    score += 15;
    reasons.push('High priority task matched with high performer');
  }

  // Agent specialization from description
  const agentDescription = (agent.description || '').toLowerCase();
  const taskDescription = (task.title + ' ' + task.description).toLowerCase();

  if (agentDescription.includes('frontend') && (taskDescription.includes('ui') || taskDescription.includes('frontend') || taskDescription.includes('react'))) {
    score += 25;
    reasons.push('Frontend specialist matched with frontend task');
  }

  if (agentDescription.includes('backend') && (taskDescription.includes('api') || taskDescription.includes('backend') || taskDescription.includes('database'))) {
    score += 25;
    reasons.push('Backend specialist matched with backend task');
  }

  if (agentDescription.includes('devops') && (taskDescription.includes('deploy') || taskDescription.includes('infra') || taskDescription.includes('ci/cd'))) {
    score += 25;
    reasons.push('DevOps specialist matched with infrastructure task');
  }

  if (agentDescription.includes('mobile') && taskDescription.includes('mobile')) {
    score += 25;
    reasons.push('Mobile specialist matched with mobile task');
  }

  // Task type consideration
  if (task.taskType === 'epic') {
    // Assign epics to senior/high-performing agents
    if (performanceScore >= 90) {
      score += 10;
      reasons.push('Epic assigned to senior agent');
    }
  }

  return {
    agentId: agent.id,
    score,
    reasons,
  };
}

/**
 * Extract required skills from task
 */
function extractRequiredSkills(task: Task): string[] {
  const skills: string[] = [];
  const text = (task.title + ' ' + task.description + ' ' + (task.tags || []).join(' ')).toLowerCase();

  // Programming languages
  if (text.match(/\b(react|jsx|tsx)\b/)) skills.push('React');
  if (text.match(/\b(next\.?js|nextjs)\b/)) skills.push('Next.js');
  if (text.match(/\b(typescript|ts)\b/)) skills.push('TypeScript');
  if (text.match(/\b(javascript|js)\b/)) skills.push('JavaScript');
  if (text.match(/\b(python|py)\b/)) skills.push('Python');
  if (text.match(/\b(java)\b/)) skills.push('Java');
  if (text.match(/\b(go|golang)\b/)) skills.push('Go');
  if (text.match(/\b(rust)\b/)) skills.push('Rust');

  // Frontend
  if (text.match(/\b(css|styling|tailwind)\b/)) skills.push('CSS');
  if (text.match(/\b(html)\b/)) skills.push('HTML');
  if (text.match(/\b(ui|user interface)\b/)) skills.push('UI');
  if (text.match(/\b(ux|user experience)\b/)) skills.push('UX');

  // Backend
  if (text.match(/\b(api|rest|graphql)\b/)) skills.push('API');
  if (text.match(/\b(database|sql|postgres|mysql|mongodb)\b/)) skills.push('Database');
  if (text.match(/\b(node\.?js|nodejs)\b/)) skills.push('Node.js');

  // DevOps
  if (text.match(/\b(docker|container)\b/)) skills.push('Docker');
  if (text.match(/\b(kubernetes|k8s)\b/)) skills.push('Kubernetes');
  if (text.match(/\b(ci\/cd|jenkins|github actions)\b/)) skills.push('CI/CD');
  if (text.match(/\b(aws|azure|gcp|cloud)\b/)) skills.push('Cloud');

  // Mobile
  if (text.match(/\b(ios|swift)\b/)) skills.push('iOS');
  if (text.match(/\b(android|kotlin)\b/)) skills.push('Android');
  if (text.match(/\b(react native)\b/)) skills.push('React Native');
  if (text.match(/\b(flutter)\b/)) skills.push('Flutter');

  // Testing
  if (text.match(/\b(test|testing|jest|cypress)\b/)) skills.push('Testing');

  return skills;
}

/**
 * Batch auto-assign multiple tasks
 */
export function batchAutoAssign(tasks: Task[], agents: CodingAgent[]): Map<string, string> {
  const assignments = new Map<string, string>();

  // Create a working copy of agents with updated workloads
  const agentWorkloads = new Map<string, number>();
  for (const agent of agents) {
    agentWorkloads.set(agent.id, agent.tasksInProgress || 0);
  }

  // Sort tasks by priority (high to low)
  const sortedTasks = [...tasks].sort((a, b) => (b.priority || 3) - (a.priority || 3));

  for (const task of sortedTasks) {
    // Update agent workloads for scoring
    const agentsWithUpdatedWorkload = agents.map(agent => ({
      ...agent,
      tasksInProgress: agentWorkloads.get(agent.id) || 0,
    }));

    const assignedAgentId = autoAssignTask(task, agentsWithUpdatedWorkload);

    if (assignedAgentId) {
      assignments.set(task.id, assignedAgentId);
      // Update workload
      const currentWorkload = agentWorkloads.get(assignedAgentId) || 0;
      agentWorkloads.set(assignedAgentId, currentWorkload + 1);
    }
  }

  return assignments;
}
