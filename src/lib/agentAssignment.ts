import { Task } from '@/types/task';
import { CodingAgent, AgentSkill, AgentPerformance } from '@/types/agent';

/**
 * Agent Auto-Assignment Service
 * Automatically assigns tasks to agents based on skills, availability, and performance
 */

export interface AssignmentScore {
  agentId: string;
  score: number;
  reasons: string[];
}

export interface AssignmentResult {
  agentId: string;
  confidence: number; // 0-1
  reasons: string[];
}

/**
 * Automatically assigns a task to the best matching agent
 */
export function autoAssignTask(task: Task, agents: CodingAgent[]): AssignmentResult | null {
  if (agents.length === 0) {
    return null;
  }

  const scores = agents.map(agent => calculateAssignmentScore(task, agent));
  scores.sort((a, b) => b.score - a.score);

  const best = scores[0];

  if (best.score === 0) {
    return null;
  }

  return {
    agentId: best.agentId,
    confidence: Math.min(best.score / 100, 1),
    reasons: best.reasons,
  };
}

/**
 * Assigns multiple tasks to agents, optimizing for workload balance
 */
export function autoAssignMultipleTasks(
  tasks: Task[],
  agents: CodingAgent[]
): Map<string, string> {
  const assignments = new Map<string, string>(); // taskId -> agentId

  if (agents.length === 0) {
    return assignments;
  }

  // Sort tasks by priority (highest first)
  const sortedTasks = [...tasks].sort((a, b) => b.priority - a.priority);

  // Track current workload for each agent
  const workload = new Map<string, number>();
  agents.forEach(agent => {
    const tasksInProgress = agent.performance?.tasksInProgress || 0;
    workload.set(agent.id, tasksInProgress);
  });

  // Assign each task
  sortedTasks.forEach(task => {
    if (task.assignedAgentId) {
      // Already assigned
      return;
    }

    // Calculate scores for available agents
    const scores = agents
      .map(agent => ({
        ...calculateAssignmentScore(task, agent),
        workload: workload.get(agent.id) || 0,
      }))
      .map(score => ({
        ...score,
        // Penalize agents with high workload
        adjustedScore: score.score * (1 / (1 + score.workload * 0.2)),
      }))
      .sort((a, b) => b.adjustedScore - a.adjustedScore);

    const best = scores[0];

    if (best.adjustedScore > 0) {
      assignments.set(task.id, best.agentId);
      workload.set(best.agentId, (workload.get(best.agentId) || 0) + 1);
    }
  });

  return assignments;
}

/**
 * Calculates an assignment score for a task-agent pair
 */
function calculateAssignmentScore(task: Task, agent: CodingAgent): AssignmentScore {
  let score = 0;
  const reasons: string[] = [];

  // Base score
  score += 10;

  // Skill matching (most important factor)
  const skillScore = calculateSkillScore(task, agent);
  score += skillScore.score;
  reasons.push(...skillScore.reasons);

  // Performance score
  const perfScore = calculatePerformanceScore(agent);
  score += perfScore.score;
  reasons.push(...perfScore.reasons);

  // Workload score (prefer agents with less work)
  const workloadScore = calculateWorkloadScore(agent);
  score += workloadScore.score;
  reasons.push(...workloadScore.reasons);

  // Priority matching
  if (task.priority >= 4 && agent.performance?.successRate && agent.performance.successRate >= 90) {
    score += 15;
    reasons.push('High performer for high priority task');
  }

  return {
    agentId: agent.id,
    score: Math.max(0, score),
    reasons,
  };
}

/**
 * Calculates skill matching score
 */
function calculateSkillScore(
  task: Task,
  agent: CodingAgent
): { score: number; reasons: string[] } {
  let score = 0;
  const reasons: string[] = [];

  if (!agent.skills || agent.skills.length === 0) {
    // No skill data, use tags from task and description
    const matchScore = matchTaskToAgentDescription(task, agent);
    score += matchScore.score;
    reasons.push(...matchScore.reasons);
    return { score, reasons };
  }

  // Match task tags with agent skills
  const taskTags = task.tags || [];
  const matchedSkills: AgentSkill[] = [];

  taskTags.forEach(tag => {
    const matchingSkill = agent.skills?.find(
      skill => skill.skillName.toLowerCase() === tag.toLowerCase()
    );

    if (matchingSkill) {
      matchedSkills.push(matchingSkill);
      score += matchingSkill.proficiency * 5; // 5-25 points per skill
      reasons.push(`Has ${matchingSkill.skillName} skill (level ${matchingSkill.proficiency})`);
    }
  });

  // Bonus for multiple skill matches
  if (matchedSkills.length > 1) {
    score += matchedSkills.length * 3;
    reasons.push(`Matches ${matchedSkills.length} required skills`);
  }

  // Check for related skills
  const relatedScore = findRelatedSkills(task, agent);
  score += relatedScore.score;
  reasons.push(...relatedScore.reasons);

  return { score, reasons };
}

/**
 * Matches task to agent description when no skill data available
 */
function matchTaskToAgentDescription(
  task: Task,
  agent: CodingAgent
): { score: number; reasons: string[] } {
  let score = 0;
  const reasons: string[] = [];

  if (!agent.description) {
    return { score, reasons };
  }

  const description = agent.description.toLowerCase();
  const taskTags = task.tags || [];
  const taskTitle = task.title.toLowerCase();
  const taskDesc = task.description?.toLowerCase() || '';

  // Check if agent description mentions task tags
  taskTags.forEach(tag => {
    if (description.includes(tag.toLowerCase())) {
      score += 10;
      reasons.push(`Specializes in ${tag}`);
    }
  });

  // Check for keyword matches
  const keywords = extractKeywords(taskTitle + ' ' + taskDesc);
  keywords.forEach(keyword => {
    if (description.includes(keyword)) {
      score += 5;
      reasons.push(`Experience with ${keyword}`);
    }
  });

  return { score, reasons };
}

/**
 * Finds related skills that might apply
 */
function findRelatedSkills(
  task: Task,
  agent: CodingAgent
): { score: number; reasons: string[] } {
  let score = 0;
  const reasons: string[] = [];

  if (!agent.skills) {
    return { score, reasons };
  }

  const skillRelations: Record<string, string[]> = {
    frontend: ['react', 'vue', 'angular', 'javascript', 'typescript', 'css', 'html'],
    backend: ['node', 'python', 'java', 'api', 'server', 'rest', 'graphql'],
    database: ['sql', 'postgresql', 'mongodb', 'mysql', 'redis'],
    devops: ['docker', 'kubernetes', 'ci/cd', 'aws', 'azure', 'gcp'],
    mobile: ['react-native', 'flutter', 'ios', 'android', 'swift', 'kotlin'],
    testing: ['jest', 'cypress', 'selenium', 'unit-testing', 'e2e'],
  };

  const taskTags = task.tags || [];

  taskTags.forEach(tag => {
    const relatedSkillNames = skillRelations[tag.toLowerCase()] || [];

    relatedSkillNames.forEach(relatedName => {
      const skill = agent.skills?.find(
        s => s.skillName.toLowerCase().includes(relatedName)
      );

      if (skill) {
        score += skill.proficiency * 2; // Less points than direct match
        reasons.push(`Related skill: ${skill.skillName}`);
      }
    });
  });

  return { score, reasons };
}

/**
 * Extracts keywords from text
 */
function extractKeywords(text: string): string[] {
  const keywords = text
    .toLowerCase()
    .split(/\W+/)
    .filter(word => word.length > 3)
    .filter(word => {
      // Filter out common words
      const commonWords = ['this', 'that', 'with', 'from', 'have', 'been', 'will'];
      return !commonWords.includes(word);
    });

  return [...new Set(keywords)];
}

/**
 * Calculates performance score
 */
function calculatePerformanceScore(agent: CodingAgent): { score: number; reasons: string[] } {
  let score = 0;
  const reasons: string[] = [];

  if (!agent.performance) {
    return { score: 5, reasons: ['No performance history'] };
  }

  const perf = agent.performance;

  // Success rate (0-20 points)
  if (perf.successRate >= 95) {
    score += 20;
    reasons.push(`Excellent success rate (${perf.successRate}%)`);
  } else if (perf.successRate >= 85) {
    score += 15;
    reasons.push(`Good success rate (${perf.successRate}%)`);
  } else if (perf.successRate >= 75) {
    score += 10;
    reasons.push(`Average success rate (${perf.successRate}%)`);
  } else {
    score += 5;
    reasons.push(`Success rate: ${perf.successRate}%`);
  }

  // Completion time (0-10 points)
  if (perf.avgCompletionTimeHours) {
    if (perf.avgCompletionTimeHours <= 4) {
      score += 10;
      reasons.push('Fast completion time');
    } else if (perf.avgCompletionTimeHours <= 8) {
      score += 7;
      reasons.push('Good completion time');
    } else {
      score += 4;
    }
  }

  // Experience (tasks completed)
  if (perf.tasksCompleted >= 50) {
    score += 10;
    reasons.push('Highly experienced');
  } else if (perf.tasksCompleted >= 20) {
    score += 7;
    reasons.push('Experienced');
  } else if (perf.tasksCompleted >= 5) {
    score += 4;
    reasons.push('Some experience');
  }

  return { score, reasons };
}

/**
 * Calculates workload score (prefer agents with less work)
 */
function calculateWorkloadScore(agent: CodingAgent): { score: number; reasons: string[] } {
  let score = 0;
  const reasons: string[] = [];

  if (!agent.performance) {
    return { score: 5, reasons: ['No workload data'] };
  }

  const tasksInProgress = agent.performance.tasksInProgress || 0;

  if (tasksInProgress === 0) {
    score += 15;
    reasons.push('Available (no tasks in progress)');
  } else if (tasksInProgress === 1) {
    score += 10;
    reasons.push('Light workload (1 task)');
  } else if (tasksInProgress === 2) {
    score += 5;
    reasons.push('Moderate workload (2 tasks)');
  } else if (tasksInProgress <= 4) {
    score += 2;
    reasons.push(`Busy (${tasksInProgress} tasks)`);
  } else {
    score += 0;
    reasons.push(`Very busy (${tasksInProgress} tasks)`);
  }

  return { score, reasons };
}

/**
 * Suggests task reassignment based on performance and workload
 */
export function suggestReassignments(
  tasks: Task[],
  agents: CodingAgent[]
): Array<{ taskId: string; fromAgentId: string; toAgentId: string; reason: string }> {
  const suggestions: Array<{
    taskId: string;
    fromAgentId: string;
    toAgentId: string;
    reason: string;
  }> = [];

  // Find overloaded agents
  const overloadedAgents = agents.filter(
    agent => (agent.performance?.tasksInProgress || 0) > 3
  );

  // Find underutilized agents
  const availableAgents = agents.filter(
    agent => (agent.performance?.tasksInProgress || 0) < 2
  );

  if (overloadedAgents.length === 0 || availableAgents.length === 0) {
    return suggestions;
  }

  // For each overloaded agent, try to reassign some tasks
  overloadedAgents.forEach(overloadedAgent => {
    const agentTasks = tasks.filter(t => t.assignedAgentId === overloadedAgent.id);

    // Try to reassign lower priority tasks
    const candidateTasks = agentTasks
      .filter(t => t.priority <= 3)
      .sort((a, b) => a.priority - b.priority);

    candidateTasks.slice(0, 2).forEach(task => {
      const bestAlternative = availableAgents
        .map(agent => ({
          agent,
          score: calculateAssignmentScore(task, agent),
        }))
        .sort((a, b) => b.score.score - a.score.score)[0];

      if (bestAlternative && bestAlternative.score.score > 30) {
        suggestions.push({
          taskId: task.id,
          fromAgentId: overloadedAgent.id,
          toAgentId: bestAlternative.agent.id,
          reason: `Balance workload: ${overloadedAgent.name} is overloaded, ${bestAlternative.agent.name} is available`,
        });
      }
    });
  });

  return suggestions;
}
