import { CodingAgent, AgentSkill, SkillLevel } from '@/types/agent';
import { Task } from '@/types/task';

/**
 * Skill level to numeric score mapping
 */
const SKILL_LEVEL_SCORES: Record<SkillLevel, number> = {
  beginner: 1,
  intermediate: 2,
  advanced: 3,
  expert: 4,
};

/**
 * Extract relevant skills from task description and tags
 */
function extractRequiredSkills(task: Task): string[] {
  const skillKeywords = [
    'react', 'next.js', 'nextjs', 'typescript', 'javascript', 'node.js', 'nodejs',
    'python', 'django', 'flask', 'java', 'spring', 'angular', 'vue',
    'database', 'sql', 'postgresql', 'mongodb', 'mysql',
    'api', 'rest', 'graphql', 'microservices',
    'docker', 'kubernetes', 'devops', 'ci/cd', 'aws', 'azure', 'gcp',
    'mobile', 'ios', 'android', 'react-native', 'flutter',
    'testing', 'jest', 'cypress', 'selenium',
    'ui', 'ux', 'design', 'css', 'tailwind', 'scss',
    'backend', 'frontend', 'fullstack',
  ];

  const text = `${task.title} ${task.description} ${task.tags.join(' ')}`.toLowerCase();
  const foundSkills: string[] = [];

  skillKeywords.forEach(skill => {
    if (text.includes(skill.toLowerCase())) {
      foundSkills.push(skill);
    }
  });

  return foundSkills;
}

/**
 * Calculate skill match score between required skills and agent skills
 */
function calculateSkillMatchScore(requiredSkills: string[], agentSkills: AgentSkill[]): number {
  if (requiredSkills.length === 0) return 0.5; // Neutral score if no specific skills required

  let totalScore = 0;
  let matchedSkills = 0;

  requiredSkills.forEach(required => {
    const matchingSkill = agentSkills.find(skill =>
      skill.name.toLowerCase().includes(required.toLowerCase()) ||
      required.toLowerCase().includes(skill.name.toLowerCase())
    );

    if (matchingSkill) {
      totalScore += SKILL_LEVEL_SCORES[matchingSkill.level];
      matchedSkills++;
    }
  });

  if (matchedSkills === 0) return 0; // No matching skills

  // Average score normalized to 0-1 range
  return (totalScore / (matchedSkills * 4)); // 4 is max skill level score
}

/**
 * Calculate performance score for an agent
 */
function calculatePerformanceScore(agent: CodingAgent): number {
  if (!agent.performance) return 0.5; // Neutral score for agents without performance data

  const {
    successRate = 75,
    onTimeDeliveryRate = 75,
    qualityScore = 75,
  } = agent.performance;

  // Weighted average of performance metrics (normalized to 0-1)
  return (
    (successRate / 100) * 0.4 +
    (onTimeDeliveryRate / 100) * 0.3 +
    (qualityScore / 100) * 0.3
  );
}

/**
 * Calculate workload score (lower is better - less busy agents score higher)
 */
function calculateWorkloadScore(agent: CodingAgent, allTasks: Task[]): number {
  const maxConcurrent = agent.maxConcurrentTasks || 3;
  const currentTasks = allTasks.filter(
    task => task.assignedAgentId === agent.id && task.status !== 'done'
  ).length;

  if (currentTasks >= maxConcurrent) return 0; // Agent is at capacity

  // Score decreases as workload increases
  return 1 - (currentTasks / maxConcurrent);
}

/**
 * Check if agent is available
 */
function isAgentAvailable(agent: CodingAgent): boolean {
  return agent.availability !== 'offline';
}

/**
 * Calculate overall agent suitability score for a task
 */
function calculateAgentScore(
  agent: CodingAgent,
  task: Task,
  allTasks: Task[],
  requiredSkills: string[]
): number {
  if (!isAgentAvailable(agent)) return 0;

  const skillScore = calculateSkillMatchScore(requiredSkills, agent.skills || []);
  const performanceScore = calculatePerformanceScore(agent);
  const workloadScore = calculateWorkloadScore(agent, allTasks);

  // Weighted combination of scores
  const weights = {
    skill: 0.5,      // Skills are most important
    performance: 0.3, // Performance is important
    workload: 0.2,    // Workload balance is considered
  };

  return (
    skillScore * weights.skill +
    performanceScore * weights.performance +
    workloadScore * weights.workload
  );
}

/**
 * Find the best agent for a task
 */
export function findBestAgent(
  task: Task,
  agents: CodingAgent[],
  allTasks: Task[]
): CodingAgent | null {
  if (agents.length === 0) return null;

  const requiredSkills = extractRequiredSkills(task);

  const scoredAgents = agents
    .map(agent => ({
      agent,
      score: calculateAgentScore(agent, task, allTasks, requiredSkills),
      skillMatch: calculateSkillMatchScore(requiredSkills, agent.skills || []),
    }))
    .filter(item => item.score > 0) // Filter out unavailable or unsuitable agents
    .sort((a, b) => b.score - a.score); // Sort by score descending

  return scoredAgents.length > 0 ? scoredAgents[0].agent : null;
}

/**
 * Auto-assign agents to multiple tasks
 */
export function autoAssignAgents(
  tasks: Task[],
  agents: CodingAgent[],
  allTasks: Task[]
): Map<string, string> {
  const assignments = new Map<string, string>(); // taskId -> agentId

  // Sort tasks by priority (higher priority first)
  const sortedTasks = [...tasks].sort((a, b) => b.priority - a.priority);

  sortedTasks.forEach(task => {
    if (task.assignedAgentId) return; // Skip already assigned tasks

    const bestAgent = findBestAgent(task, agents, [...allTasks, ...sortedTasks]);
    if (bestAgent) {
      assignments.set(task.id, bestAgent.id);
      // Update task count for workload calculation in subsequent iterations
      task.assignedAgentId = bestAgent.id;
    }
  });

  return assignments;
}

/**
 * Get agent recommendations with explanations
 */
export interface AgentRecommendation {
  agent: CodingAgent;
  score: number;
  skillMatch: number;
  performanceScore: number;
  workloadScore: number;
  explanation: string;
}

export function getAgentRecommendations(
  task: Task,
  agents: CodingAgent[],
  allTasks: Task[],
  limit: number = 3
): AgentRecommendation[] {
  const requiredSkills = extractRequiredSkills(task);

  const recommendations = agents
    .map(agent => {
      const skillMatch = calculateSkillMatchScore(requiredSkills, agent.skills || []);
      const performanceScore = calculatePerformanceScore(agent);
      const workloadScore = calculateWorkloadScore(agent, allTasks);
      const overallScore = calculateAgentScore(agent, task, allTasks, requiredSkills);

      let explanation = '';
      if (skillMatch > 0.7) {
        explanation = 'Excellent skill match';
      } else if (skillMatch > 0.4) {
        explanation = 'Good skill match';
      } else if (skillMatch > 0) {
        explanation = 'Partial skill match';
      } else {
        explanation = 'General availability';
      }

      if (performanceScore > 0.8) {
        explanation += ', high performer';
      }

      if (workloadScore < 0.3) {
        explanation += ', high workload';
      } else if (workloadScore > 0.7) {
        explanation += ', available';
      }

      return {
        agent,
        score: overallScore,
        skillMatch,
        performanceScore,
        workloadScore,
        explanation,
      };
    })
    .filter(item => item.score > 0)
    .sort((a, b) => b.score - a.score)
    .slice(0, limit);

  return recommendations;
}

/**
 * Update agent performance metrics based on task completion
 */
export function updateAgentPerformance(
  agent: CodingAgent,
  task: Task,
  wasOnTime: boolean,
  qualityRating: number // 0-100
): CodingAgent {
  const currentPerformance = agent.performance || {
    tasksCompleted: 0,
    tasksInProgress: 0,
    averageCompletionTime: 0,
    successRate: 75,
    onTimeDeliveryRate: 75,
    qualityScore: 75,
    lastUpdated: Date.now(),
  };

  const completionTime = task.actualHours || task.estimatedHours || 0;

  // Update metrics with weighted averages
  const updatedPerformance = {
    ...currentPerformance,
    tasksCompleted: currentPerformance.tasksCompleted + 1,
    tasksInProgress: Math.max(0, currentPerformance.tasksInProgress - 1),
    averageCompletionTime:
      ((currentPerformance.averageCompletionTime || 0) * currentPerformance.tasksCompleted + completionTime) /
      (currentPerformance.tasksCompleted + 1),
    successRate:
      ((currentPerformance.successRate || 75) * currentPerformance.tasksCompleted + (task.status === 'done' ? 100 : 0)) /
      (currentPerformance.tasksCompleted + 1),
    onTimeDeliveryRate:
      ((currentPerformance.onTimeDeliveryRate || 75) * currentPerformance.tasksCompleted + (wasOnTime ? 100 : 0)) /
      (currentPerformance.tasksCompleted + 1),
    qualityScore:
      ((currentPerformance.qualityScore || 75) * currentPerformance.tasksCompleted + qualityRating) /
      (currentPerformance.tasksCompleted + 1),
    lastUpdated: Date.now(),
  };

  return {
    ...agent,
    performance: updatedPerformance,
  };
}
