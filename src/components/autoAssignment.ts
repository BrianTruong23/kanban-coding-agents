import { CodingAgent } from '@/types/agent';
import { AgentSkill, AgentWorkload } from '@/types/agentSkill';
import { Task } from '@/types/task';
import { Subtask } from '@/types/subtask';

export interface AssignmentScore {
  agentId: string;
  agentName: string;
  score: number;
  reason: string;
}

/**
 * Auto-assign a task to the best available agent based on skills, workload, and performance
 */
export function autoAssignTask(
  task: Task | Subtask,
  agents: CodingAgent[],
  agentSkills: AgentSkill[],
  agentWorkloads: Map<string, AgentWorkload>,
  requiredSkills: string[] = []
): AssignmentScore[] {
  const scores: AssignmentScore[] = [];

  for (const agent of agents) {
    let score = 0;
    const reasons: string[] = [];

    // 1. Skill matching (40% of score)
    const skillScore = calculateSkillScore(agent.id, requiredSkills, agentSkills);
    score += skillScore * 0.4;
    if (skillScore > 0.7) {
      reasons.push(`Strong skill match (${Math.round(skillScore * 100)}%)`);
    } else if (skillScore > 0.4) {
      reasons.push(`Moderate skill match (${Math.round(skillScore * 100)}%)`);
    }

    // 2. Workload balance (30% of score)
    const workload = agentWorkloads.get(agent.id);
    const workloadScore = calculateWorkloadScore(workload);
    score += workloadScore * 0.3;
    if (workloadScore > 0.8) {
      reasons.push('Low workload');
    } else if (workloadScore < 0.3) {
      reasons.push('High workload');
    }

    // 3. Performance history (30% of score)
    const performanceScore = calculatePerformanceScore(workload);
    score += performanceScore * 0.3;
    if (performanceScore > 0.8) {
      reasons.push('Excellent track record');
    } else if (performanceScore > 0.6) {
      reasons.push('Good track record');
    }

    scores.push({
      agentId: agent.id,
      agentName: agent.name,
      score: Math.round(score * 100) / 100,
      reason: reasons.join(', ') || 'Available',
    });
  }

  // Sort by score (highest first)
  scores.sort((a, b) => b.score - a.score);

  return scores;
}

/**
 * Calculate skill matching score (0-1)
 */
function calculateSkillScore(
  agentId: string,
  requiredSkills: string[],
  agentSkills: AgentSkill[]
): number {
  if (requiredSkills.length === 0) {
    // If no specific skills required, neutral score
    return 0.5;
  }

  const agentSkillSet = agentSkills.filter(s => s.agentId === agentId);
  if (agentSkillSet.length === 0) {
    return 0.3; // No skills recorded, give benefit of doubt
  }

  let totalScore = 0;
  let matchedSkills = 0;

  for (const requiredSkill of requiredSkills) {
    const matchingSkill = agentSkillSet.find(s =>
      s.skillName.toLowerCase().includes(requiredSkill.toLowerCase()) ||
      requiredSkill.toLowerCase().includes(s.skillName.toLowerCase())
    );

    if (matchingSkill) {
      // Proficiency level contributes to score (1-5 mapped to 0.2-1.0)
      totalScore += matchingSkill.proficiencyLevel / 5;
      matchedSkills++;
    }
  }

  if (matchedSkills === 0) {
    return 0.2; // No matching skills
  }

  // Average score of matched skills
  return totalScore / requiredSkills.length;
}

/**
 * Calculate workload score (0-1, higher is better = less workload)
 */
function calculateWorkloadScore(workload?: AgentWorkload): number {
  if (!workload) {
    return 1.0; // No workload data = assume available
  }

  const { totalTasks, inProgressTasks } = workload;

  // Penalize heavily for many in-progress tasks
  let score = 1.0;

  if (inProgressTasks >= 5) {
    score -= 0.6; // Very busy
  } else if (inProgressTasks >= 3) {
    score -= 0.4; // Busy
  } else if (inProgressTasks >= 1) {
    score -= 0.2; // Somewhat busy
  }

  // Penalize for total workload
  if (totalTasks >= 20) {
    score -= 0.2;
  } else if (totalTasks >= 10) {
    score -= 0.1;
  }

  return Math.max(0, score);
}

/**
 * Calculate performance score based on quality history (0-1)
 */
function calculatePerformanceScore(workload?: AgentWorkload): number {
  if (!workload || !workload.avgQualityScore) {
    return 0.7; // No performance data = assume decent
  }

  // Quality score is 1-5, map to 0-1
  return workload.avgQualityScore / 5;
}

/**
 * Batch auto-assignment for multiple tasks
 */
export function autoAssignMultipleTasks(
  tasks: (Task | Subtask)[],
  agents: CodingAgent[],
  agentSkills: AgentSkill[],
  agentWorkloads: Map<string, AgentWorkload>,
  taskRequiredSkills: Map<string, string[]>
): Map<string, string> {
  const assignments = new Map<string, string>();
  const tempWorkloads = new Map(agentWorkloads);

  // Sort tasks by priority (highest first)
  const sortedTasks = [...tasks].sort((a, b) => b.priority - a.priority);

  for (const task of sortedTasks) {
    const requiredSkills = taskRequiredSkills.get(task.id) || [];
    const scores = autoAssignTask(task, agents, agentSkills, tempWorkloads, requiredSkills);

    if (scores.length > 0) {
      const bestAgent = scores[0];
      assignments.set(task.id, bestAgent.agentId);

      // Update temporary workload for next iteration
      const currentWorkload = tempWorkloads.get(bestAgent.agentId) || {
        totalTasks: 0,
        inProgressTasks: 0,
        avgQualityScore: 0,
      };
      tempWorkloads.set(bestAgent.agentId, {
        ...currentWorkload,
        totalTasks: currentWorkload.totalTasks + 1,
        inProgressTasks: currentWorkload.inProgressTasks + 1,
      });
    }
  }

  return assignments;
}

/**
 * Extract skills from task tags and description
 */
export function extractSkillsFromTask(task: Task | Subtask): string[] {
  const skills: Set<string> = new Set();

  // Common skill keywords
  const skillKeywords = [
    'react', 'vue', 'angular', 'frontend', 'backend', 'api', 'database',
    'typescript', 'javascript', 'python', 'java', 'go', 'rust',
    'sql', 'nosql', 'mongodb', 'postgresql', 'mysql',
    'docker', 'kubernetes', 'devops', 'ci/cd',
    'testing', 'qa', 'e2e', 'unit test',
    'ui', 'ux', 'design', 'mobile', 'ios', 'android',
    'graphql', 'rest', 'grpc',
    'aws', 'azure', 'gcp', 'cloud',
  ];

  const text = `${task.title} ${task.description} ${task.tags?.join(' ') || ''}`.toLowerCase();

  for (const keyword of skillKeywords) {
    if (text.includes(keyword)) {
      skills.add(keyword);
    }
  }

  return Array.from(skills);
}
