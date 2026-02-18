/**
 * Agent Skills and Performance Management
 *
 * This module handles:
 * - Agent skill tracking and proficiency levels
 * - Performance metrics calculation
 * - Workload monitoring
 */

import { AgentSkill, AgentPerformance } from '@/types/orchestration';
import { CodingAgent } from '@/types/agent';

// =====================
// SKILL MANAGEMENT
// =====================

/**
 * Default skills for each agent type
 */
export const DEFAULT_AGENT_SKILLS: Record<string, { skillName: string; category: string; proficiency: 1 | 2 | 3 | 4 | 5 }[]> = {
  'Alex Chen': [
    { skillName: 'React', category: 'frontend', proficiency: 5 },
    { skillName: 'Next.js', category: 'frontend', proficiency: 5 },
    { skillName: 'TypeScript', category: 'frontend', proficiency: 5 },
    { skillName: 'CSS', category: 'frontend', proficiency: 4 },
    { skillName: 'UI/UX', category: 'frontend', proficiency: 4 },
  ],
  'Sarah Johnson': [
    { skillName: 'API Development', category: 'backend', proficiency: 5 },
    { skillName: 'Database Design', category: 'backend', proficiency: 5 },
    { skillName: 'Node.js', category: 'backend', proficiency: 5 },
    { skillName: 'SQL', category: 'backend', proficiency: 4 },
    { skillName: 'Python', category: 'backend', proficiency: 4 },
  ],
  'Mike Rodriguez': [
    { skillName: 'React', category: 'frontend', proficiency: 4 },
    { skillName: 'Node.js', category: 'backend', proficiency: 4 },
    { skillName: 'API Development', category: 'backend', proficiency: 4 },
    { skillName: 'TypeScript', category: 'frontend', proficiency: 4 },
    { skillName: 'Database Design', category: 'backend', proficiency: 3 },
  ],
  'Emma Wilson': [
    { skillName: 'DevOps', category: 'infrastructure', proficiency: 5 },
    { skillName: 'CI/CD', category: 'infrastructure', proficiency: 5 },
    { skillName: 'Docker', category: 'infrastructure', proficiency: 5 },
    { skillName: 'Kubernetes', category: 'infrastructure', proficiency: 4 },
    { skillName: 'Monitoring', category: 'infrastructure', proficiency: 4 },
  ],
  'David Kim': [
    { skillName: 'React Native', category: 'mobile', proficiency: 5 },
    { skillName: 'iOS', category: 'mobile', proficiency: 4 },
    { skillName: 'Android', category: 'mobile', proficiency: 4 },
    { skillName: 'Mobile UI', category: 'mobile', proficiency: 5 },
    { skillName: 'TypeScript', category: 'mobile', proficiency: 4 },
  ],
};

/**
 * Get skills for an agent
 */
export function getAgentSkills(agentName: string): { skillName: string; category: string; proficiency: 1 | 2 | 3 | 4 | 5 }[] {
  return DEFAULT_AGENT_SKILLS[agentName] || [];
}

/**
 * Calculate skill match score between required skills and agent skills
 */
export function calculateSkillMatch(
  requiredSkills: string[],
  agentSkills: AgentSkill[]
): { score: number; matchedSkills: string[] } {
  if (requiredSkills.length === 0) {
    return { score: 50, matchedSkills: [] }; // Neutral score if no skills required
  }

  const matchedSkills: string[] = [];
  let totalScore = 0;

  for (const required of requiredSkills) {
    const agentSkill = agentSkills.find(
      s => s.skillName.toLowerCase() === required.toLowerCase()
    );

    if (agentSkill) {
      matchedSkills.push(required);
      // Score based on proficiency: 1=40, 2=60, 3=75, 4=90, 5=100
      const proficiencyScore = agentSkill.proficiencyLevel * 20;
      totalScore += proficiencyScore;
    }
  }

  // Calculate percentage: (sum of matched proficiencies) / (max possible score)
  const maxScore = requiredSkills.length * 100;
  const score = maxScore > 0 ? (totalScore / maxScore) * 100 : 0;

  return { score, matchedSkills };
}

// =====================
// PERFORMANCE TRACKING
// =====================

/**
 * Initialize performance metrics for an agent
 */
export function initializePerformance(agentId: string): Omit<AgentPerformance, 'id' | 'createdAt' | 'updatedAt'> {
  return {
    agentId,
    tasksCompleted: 0,
    tasksOnTime: 0,
    tasksDelayed: 0,
    averageCompletionTimeHours: undefined,
    successRate: 100, // Start with optimistic score
    currentAssignedTasks: 0,
    currentWorkloadHours: 0,
    periodStart: Date.now(),
    periodEnd: undefined,
  };
}

/**
 * Update performance metrics when a task is completed
 */
export function updatePerformanceOnCompletion(
  performance: AgentPerformance,
  wasOnTime: boolean,
  completionTimeHours: number
): AgentPerformance {
  const tasksCompleted = performance.tasksCompleted + 1;
  const tasksOnTime = wasOnTime ? performance.tasksOnTime + 1 : performance.tasksOnTime;
  const tasksDelayed = wasOnTime ? performance.tasksDelayed : performance.tasksDelayed + 1;

  // Update average completion time
  const currentAvg = performance.averageCompletionTimeHours || 0;
  const averageCompletionTimeHours = (currentAvg * performance.tasksCompleted + completionTimeHours) / tasksCompleted;

  // Calculate success rate (on-time percentage)
  const successRate = (tasksOnTime / tasksCompleted) * 100;

  return {
    ...performance,
    tasksCompleted,
    tasksOnTime,
    tasksDelayed,
    averageCompletionTimeHours,
    successRate,
    updatedAt: Date.now(),
  };
}

/**
 * Update workload when a task is assigned
 */
export function updateWorkloadOnAssignment(
  performance: AgentPerformance,
  estimatedHours: number
): AgentPerformance {
  return {
    ...performance,
    currentAssignedTasks: performance.currentAssignedTasks + 1,
    currentWorkloadHours: performance.currentWorkloadHours + estimatedHours,
    updatedAt: Date.now(),
  };
}

/**
 * Update workload when a task is completed or unassigned
 */
export function updateWorkloadOnUnassignment(
  performance: AgentPerformance,
  estimatedHours: number
): AgentPerformance {
  return {
    ...performance,
    currentAssignedTasks: Math.max(0, performance.currentAssignedTasks - 1),
    currentWorkloadHours: Math.max(0, performance.currentWorkloadHours - estimatedHours),
    updatedAt: Date.now(),
  };
}

/**
 * Calculate workload score (0-100, where 100 is no workload, 0 is overloaded)
 */
export function calculateWorkloadScore(
  currentWorkloadHours: number,
  maxWorkloadHours: number = 40 // Default: 40 hours per week
): number {
  if (currentWorkloadHours <= 0) return 100;
  if (currentWorkloadHours >= maxWorkloadHours) return 0;

  // Linear scale: 100 at 0 hours, 0 at maxWorkloadHours
  return ((maxWorkloadHours - currentWorkloadHours) / maxWorkloadHours) * 100;
}

/**
 * Calculate performance score based on success rate and completion time
 */
export function calculatePerformanceScore(performance: AgentPerformance): number {
  // If no tasks completed yet, return neutral score
  if (performance.tasksCompleted === 0) return 70;

  // Success rate contributes 70% of the score
  const successComponent = (performance.successRate || 0) * 0.7;

  // Completion time efficiency contributes 30%
  // Assume 8 hours per task is the baseline
  const baselineHours = 8;
  const avgHours = performance.averageCompletionTimeHours || baselineHours;
  const efficiencyRatio = Math.min(1, baselineHours / avgHours); // Capped at 1
  const efficiencyComponent = efficiencyRatio * 100 * 0.3;

  return successComponent + efficiencyComponent;
}

// =====================
// SKILL RECOMMENDATIONS
// =====================

/**
 * Suggest skills to learn based on ticket patterns
 */
export function suggestSkillsForAgent(
  agentCurrentSkills: AgentSkill[],
  recentTicketSkills: string[]
): string[] {
  const currentSkillNames = new Set(agentCurrentSkills.map(s => s.skillName.toLowerCase()));
  const suggestions = new Set<string>();

  // Find skills that appear in tickets but agent doesn't have
  for (const skill of recentTicketSkills) {
    if (!currentSkillNames.has(skill.toLowerCase())) {
      suggestions.add(skill);
    }
  }

  return Array.from(suggestions);
}

/**
 * Identify skill gaps across the team
 */
export function identifyTeamSkillGaps(
  allAgentSkills: Map<string, AgentSkill[]>,
  requiredSkills: string[]
): { skill: string; coverage: number }[] {
  const gaps: { skill: string; coverage: number }[] = [];

  for (const skill of requiredSkills) {
    let agentsWithSkill = 0;
    let totalProficiency = 0;

    for (const skills of allAgentSkills.values()) {
      const agentSkill = skills.find(s => s.skillName.toLowerCase() === skill.toLowerCase());
      if (agentSkill) {
        agentsWithSkill++;
        totalProficiency += agentSkill.proficiencyLevel;
      }
    }

    // Coverage is based on: (number of agents with skill) / (total agents) * (avg proficiency / 5)
    const totalAgents = allAgentSkills.size;
    const avgProficiency = agentsWithSkill > 0 ? totalProficiency / agentsWithSkill : 0;
    const coverage = totalAgents > 0 ? (agentsWithSkill / totalAgents) * (avgProficiency / 5) * 100 : 0;

    gaps.push({ skill, coverage });
  }

  // Sort by coverage (ascending) to show biggest gaps first
  return gaps.sort((a, b) => a.coverage - b.coverage);
}
