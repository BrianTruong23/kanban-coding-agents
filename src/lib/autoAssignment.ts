/**
 * Automated Agent Assignment Algorithm
 *
 * This module implements intelligent task assignment based on:
 * - Agent skills and proficiency
 * - Current workload
 * - Performance history
 * - Task requirements
 */

import {
  AssignmentRecommendation,
  AutoAssignmentConfig,
  AgentSkill,
  AgentPerformance,
  Ticket,
} from '@/types/orchestration';
import { CodingAgent } from '@/types/agent';
import {
  calculateSkillMatch,
  calculateWorkloadScore,
  calculatePerformanceScore,
} from './agentSkills';

// =====================
// AUTO-ASSIGNMENT
// =====================

/**
 * Default configuration for auto-assignment
 */
export const DEFAULT_AUTO_ASSIGNMENT_CONFIG: AutoAssignmentConfig = {
  prioritizeSkillMatch: true,
  skillMatchWeight: 0.5,
  workloadWeight: 0.3,
  performanceWeight: 0.2,
  maxTasksPerAgent: 10,
  maxHoursPerAgent: 40,
};

/**
 * Calculate assignment recommendations for a ticket
 */
export function calculateAssignmentRecommendations(
  ticket: Ticket,
  agents: CodingAgent[],
  agentSkills: Map<string, AgentSkill[]>,
  agentPerformance: Map<string, AgentPerformance>,
  config: AutoAssignmentConfig = DEFAULT_AUTO_ASSIGNMENT_CONFIG
): AssignmentRecommendation[] {
  const recommendations: AssignmentRecommendation[] = [];

  for (const agent of agents) {
    const skills = agentSkills.get(agent.id) || [];
    const performance = agentPerformance.get(agent.id);

    // Skip if agent is overloaded
    if (performance) {
      if (config.maxTasksPerAgent && performance.currentAssignedTasks >= config.maxTasksPerAgent) {
        continue;
      }
      if (config.maxHoursPerAgent && performance.currentWorkloadHours >= config.maxHoursPerAgent) {
        continue;
      }
    }

    const recommendation = calculateAgentScore(
      agent,
      ticket,
      skills,
      performance,
      config
    );

    recommendations.push(recommendation);
  }

  // Sort by score (descending)
  return recommendations.sort((a, b) => b.score - a.score);
}

/**
 * Calculate score for a specific agent for a ticket
 */
function calculateAgentScore(
  agent: CodingAgent,
  ticket: Ticket,
  agentSkills: AgentSkill[],
  performance: AgentPerformance | undefined,
  config: AutoAssignmentConfig
): AssignmentRecommendation {
  const reasons: string[] = [];

  // 1. Skill Match Score
  const requiredSkills = ticket.suggestedSkills || [];
  const { score: skillScore, matchedSkills } = calculateSkillMatch(requiredSkills, agentSkills);

  if (matchedSkills.length > 0) {
    reasons.push(`Matches ${matchedSkills.length}/${requiredSkills.length} required skills`);
  } else if (requiredSkills.length === 0) {
    reasons.push('No specific skills required');
  } else {
    reasons.push('Limited skill match');
  }

  // 2. Workload Score
  const currentWorkloadHours = performance?.currentWorkloadHours || 0;
  const workloadScore = calculateWorkloadScore(currentWorkloadHours, config.maxHoursPerAgent);

  if (currentWorkloadHours === 0) {
    reasons.push('Available - no current workload');
  } else if (currentWorkloadHours < (config.maxHoursPerAgent || 40) * 0.5) {
    reasons.push('Low workload - good availability');
  } else if (currentWorkloadHours < (config.maxHoursPerAgent || 40) * 0.8) {
    reasons.push('Moderate workload');
  } else {
    reasons.push('High workload - limited availability');
  }

  // 3. Performance Score
  const performanceScore = performance ? calculatePerformanceScore(performance) : 70;

  if (performance) {
    const successRate = performance.successRate || 0;
    if (successRate >= 90) {
      reasons.push('Excellent track record');
    } else if (successRate >= 75) {
      reasons.push('Good track record');
    } else if (successRate >= 60) {
      reasons.push('Moderate track record');
    }
  } else {
    reasons.push('New agent - no performance history');
  }

  // Calculate weighted final score
  const finalScore =
    skillScore * config.skillMatchWeight +
    workloadScore * config.workloadWeight +
    performanceScore * config.performanceWeight;

  // Normalize to 0-100
  const normalizedScore = Math.min(100, Math.max(0, finalScore));

  return {
    agentId: agent.id,
    agentName: agent.name,
    score: Math.round(normalizedScore),
    reasons,
    matchedSkills,
    currentWorkload: currentWorkloadHours,
    successRate: performance?.successRate,
  };
}

/**
 * Automatically assign a ticket to the best agent
 */
export function autoAssignTicket(
  ticket: Ticket,
  agents: CodingAgent[],
  agentSkills: Map<string, AgentSkill[]>,
  agentPerformance: Map<string, AgentPerformance>,
  config: AutoAssignmentConfig = DEFAULT_AUTO_ASSIGNMENT_CONFIG
): { agentId: string; agentName: string; score: number; reasons: string[] } | null {
  const recommendations = calculateAssignmentRecommendations(
    ticket,
    agents,
    agentSkills,
    agentPerformance,
    config
  );

  if (recommendations.length === 0) {
    return null; // No agents available
  }

  const best = recommendations[0];
  return {
    agentId: best.agentId,
    agentName: best.agentName,
    score: best.score,
    reasons: best.reasons,
  };
}

/**
 * Batch auto-assign multiple tickets
 */
export function batchAutoAssign(
  tickets: Ticket[],
  agents: CodingAgent[],
  agentSkills: Map<string, AgentSkill[]>,
  agentPerformance: Map<string, AgentPerformance>,
  config: AutoAssignmentConfig = DEFAULT_AUTO_ASSIGNMENT_CONFIG
): Map<string, { agentId: string; score: number }> {
  const assignments = new Map<string, { agentId: string; score: number }>();

  // Clone performance map to track changes during batch assignment
  const workingPerformance = new Map(agentPerformance);

  // Sort tickets by priority (high priority first)
  const sortedTickets = [...tickets].sort((a, b) => b.priority - a.priority);

  for (const ticket of sortedTickets) {
    const assignment = autoAssignTicket(
      ticket,
      agents,
      agentSkills,
      workingPerformance,
      config
    );

    if (assignment) {
      assignments.set(ticket.id, {
        agentId: assignment.agentId,
        score: assignment.score,
      });

      // Update working performance to account for this assignment
      const perf = workingPerformance.get(assignment.agentId);
      if (perf) {
        workingPerformance.set(assignment.agentId, {
          ...perf,
          currentAssignedTasks: perf.currentAssignedTasks + 1,
          currentWorkloadHours: perf.currentWorkloadHours + (ticket.estimatedHours || 0),
        });
      }
    }
  }

  return assignments;
}

// =====================
// WORKLOAD BALANCING
// =====================

/**
 * Check if workload is balanced across agents
 */
export function isWorkloadBalanced(
  agentPerformance: Map<string, AgentPerformance>,
  threshold: number = 0.3 // 30% difference is acceptable
): { balanced: boolean; imbalance: number; suggestions: string[] } {
  const workloads = Array.from(agentPerformance.values()).map(p => p.currentWorkloadHours);

  if (workloads.length === 0) {
    return { balanced: true, imbalance: 0, suggestions: [] };
  }

  const maxWorkload = Math.max(...workloads);
  const minWorkload = Math.min(...workloads);
  const avgWorkload = workloads.reduce((a, b) => a + b, 0) / workloads.length;

  const imbalance = avgWorkload > 0 ? (maxWorkload - minWorkload) / avgWorkload : 0;
  const balanced = imbalance <= threshold;

  const suggestions: string[] = [];
  if (!balanced) {
    suggestions.push('Workload is unbalanced across agents');
    suggestions.push(`Difference: ${Math.round(maxWorkload - minWorkload)} hours`);
    suggestions.push('Consider redistributing tasks');
  }

  return { balanced, imbalance, suggestions };
}

/**
 * Suggest task reassignments to balance workload
 */
export function suggestRebalancing(
  tickets: Ticket[],
  agents: CodingAgent[],
  agentPerformance: Map<string, AgentPerformance>
): { ticketId: string; fromAgentId: string; toAgentId: string; reason: string }[] {
  const suggestions: { ticketId: string; fromAgentId: string; toAgentId: string; reason: string }[] = [];

  // Find overloaded and underloaded agents
  const performances = Array.from(agentPerformance.entries());
  const avgWorkload = performances.reduce((sum, [, p]) => sum + p.currentWorkloadHours, 0) / performances.length;

  const overloaded = performances.filter(([, p]) => p.currentWorkloadHours > avgWorkload * 1.3);
  const underloaded = performances.filter(([, p]) => p.currentWorkloadHours < avgWorkload * 0.7);

  // For each overloaded agent, try to move tasks to underloaded agents
  for (const [overloadedAgentId, overloadedPerf] of overloaded) {
    const agentTickets = tickets.filter(t => t.assignedAgentId === overloadedAgentId && t.status !== 'done');

    for (const ticket of agentTickets) {
      // Find best underloaded agent for this ticket
      for (const [underloadedAgentId, underloadedPerf] of underloaded) {
        const hoursToMove = ticket.estimatedHours || 0;

        // Check if this would improve balance
        const newOverloadedWorkload = overloadedPerf.currentWorkloadHours - hoursToMove;
        const newUnderloadedWorkload = underloadedPerf.currentWorkloadHours + hoursToMove;

        if (newOverloadedWorkload > avgWorkload && newUnderloadedWorkload < avgWorkload) {
          suggestions.push({
            ticketId: ticket.id,
            fromAgentId: overloadedAgentId,
            toAgentId: underloadedAgentId,
            reason: `Balance workload (${Math.round(overloadedPerf.currentWorkloadHours)}h → ${Math.round(newOverloadedWorkload)}h)`,
          });
          break; // Only suggest one reassignment per ticket
        }
      }
    }
  }

  return suggestions;
}

// =====================
// SPECIALIZATION VS GENERALIZATION
// =====================

/**
 * Calculate team specialization score
 * High score = specialized team (each agent focuses on specific skills)
 * Low score = generalized team (agents have diverse, overlapping skills)
 */
export function calculateTeamSpecialization(
  agentSkills: Map<string, AgentSkill[]>
): { score: number; analysis: string } {
  const allSkills = new Set<string>();
  const skillCountPerAgent: number[] = [];
  const skillCoverage = new Map<string, number>();

  for (const skills of agentSkills.values()) {
    skillCountPerAgent.push(skills.length);

    for (const skill of skills) {
      allSkills.add(skill.skillName);
      skillCoverage.set(skill.skillName, (skillCoverage.get(skill.skillName) || 0) + 1);
    }
  }

  const totalSkills = allSkills.size;
  const avgSkillsPerAgent = skillCountPerAgent.reduce((a, b) => a + b, 0) / skillCountPerAgent.length;

  // Calculate average coverage (how many agents have each skill)
  const avgCoverage = Array.from(skillCoverage.values()).reduce((a, b) => a + b, 0) / totalSkills;

  // Specialization score: lower coverage = more specialized
  // Scale: 1 agent per skill = 100% specialized, all agents have all skills = 0% specialized
  const maxAgents = agentSkills.size;
  const specializationScore = ((maxAgents - avgCoverage) / (maxAgents - 1)) * 100;

  let analysis: string;
  if (specializationScore > 70) {
    analysis = 'Highly specialized team - agents focus on specific areas';
  } else if (specializationScore > 40) {
    analysis = 'Moderately specialized team - some overlap in skills';
  } else {
    analysis = 'Generalized team - agents have diverse, overlapping skills';
  }

  return { score: Math.round(specializationScore), analysis };
}
