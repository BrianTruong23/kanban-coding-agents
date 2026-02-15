// Agent Orchestration System with Auto-Assignment Capabilities

import {
  AgentRoster,
  AssignmentScore,
  AssignmentRecommendation,
  TeamComposition,
  Skill,
  SkillLevel,
  SkillCategory,
} from '@/types/agentRoster';
import { Ticket, Subtask } from '@/types/taskBreakdown';

export class AgentOrchestrator {
  /**
   * Find the best agent for a task
   */
  static recommendAgent(
    task: Ticket | Subtask,
    agents: AgentRoster[]
  ): AssignmentRecommendation {
    const recommendations: AssignmentScore[] = [];

    for (const agent of agents) {
      const score = this.calculateAssignmentScore(task, agent);
      recommendations.push(score);
    }

    // Sort by score descending
    recommendations.sort((a, b) => b.score - a.score);

    // Auto-assign if confidence is high enough
    const topScore = recommendations[0];
    const autoAssigned = topScore && topScore.score > 75 ? topScore.agentId : undefined;

    return {
      taskId: task.id,
      recommendations,
      autoAssigned,
      confidence: topScore ? topScore.score : 0,
    };
  }

  /**
   * Batch assign multiple tasks to agents
   */
  static batchAssign(
    tasks: (Ticket | Subtask)[],
    agents: AgentRoster[]
  ): Map<string, string> {
    const assignments = new Map<string, string>(); // taskId -> agentId
    const agentWorkload = new Map<string, number>();

    // Initialize workload
    for (const agent of agents) {
      agentWorkload.set(agent.id, agent.availability.currentWorkload);
    }

    // Sort tasks by priority (higher first)
    const sortedTasks = [...tasks].sort((a, b) => b.priority - a.priority);

    for (const task of sortedTasks) {
      const recommendation = this.recommendAgent(task, agents);

      // Find best available agent
      for (const rec of recommendation.recommendations) {
        const agent = agents.find(a => a.id === rec.agentId);
        if (!agent) continue;

        const currentLoad = agentWorkload.get(agent.id) || 0;

        if (currentLoad < agent.availability.maxCapacity) {
          assignments.set(task.id, agent.id);
          agentWorkload.set(agent.id, currentLoad + 1);
          break;
        }
      }
    }

    return assignments;
  }

  /**
   * Calculate assignment score for an agent and task
   */
  private static calculateAssignmentScore(
    task: Ticket | Subtask,
    agent: AgentRoster
  ): AssignmentScore {
    const skillMatch = this.calculateSkillMatch(task, agent);
    const availabilityMatch = this.calculateAvailabilityMatch(agent);
    const performanceMatch = this.calculatePerformanceMatch(agent);
    const preferenceMatch = this.calculatePreferenceMatch(task, agent);

    // Weighted average
    const score = Math.round(
      skillMatch * 0.4 +
      availabilityMatch * 0.3 +
      performanceMatch * 0.2 +
      preferenceMatch * 0.1
    );

    const reasons: string[] = [];

    if (skillMatch > 80) reasons.push('Excellent skill match');
    else if (skillMatch > 60) reasons.push('Good skill match');
    else if (skillMatch < 40) reasons.push('Limited skill match');

    if (availabilityMatch > 80) reasons.push('Highly available');
    else if (availabilityMatch < 40) reasons.push('Limited availability');

    if (performanceMatch > 80) reasons.push('Strong performance history');

    if (preferenceMatch > 80) reasons.push('Matches preferences');

    return {
      agentId: agent.id,
      score,
      reasons,
      skillMatch,
      availabilityMatch,
      performanceMatch,
      preferenceMatch,
    };
  }

  /**
   * Calculate skill match score
   */
  private static calculateSkillMatch(
    task: Ticket | Subtask,
    agent: AgentRoster
  ): number {
    const requiredSkills = task.requiredSkills;
    if (requiredSkills.length === 0) return 50; // neutral if no skills specified

    let matchCount = 0;
    let totalWeight = 0;

    for (const requiredSkill of requiredSkills) {
      const agentSkill = agent.skills.find(
        s => s.name.toLowerCase().includes(requiredSkill.toLowerCase()) ||
             s.category.toLowerCase().includes(requiredSkill.toLowerCase())
      );

      if (agentSkill) {
        const levelScore = this.skillLevelToScore(agentSkill.level);
        matchCount += levelScore;
      }

      totalWeight += 100; // max score per skill
    }

    return totalWeight > 0 ? Math.round((matchCount / totalWeight) * 100) : 0;
  }

  /**
   * Convert skill level to numeric score
   */
  private static skillLevelToScore(level: SkillLevel): number {
    switch (level) {
      case 'expert': return 100;
      case 'advanced': return 80;
      case 'intermediate': return 60;
      case 'beginner': return 40;
      default: return 0;
    }
  }

  /**
   * Calculate availability match score
   */
  private static calculateAvailabilityMatch(agent: AgentRoster): number {
    const { status, currentWorkload, maxCapacity } = agent.availability;

    if (status === 'offline') return 0;
    if (status === 'busy' && currentWorkload >= maxCapacity) return 20;

    const utilizationRate = currentWorkload / maxCapacity;
    const availabilityScore = Math.round((1 - utilizationRate) * 100);

    return Math.max(0, Math.min(100, availabilityScore));
  }

  /**
   * Calculate performance match score
   */
  private static calculatePerformanceMatch(agent: AgentRoster): number {
    const metrics = agent.performanceMetrics;

    const qualityScore = metrics.qualityScore || 50;
    const onTimeRate = metrics.onTimeDeliveryRate || 50;
    const collaborationScore = metrics.collaborationScore || 50;

    return Math.round((qualityScore + onTimeRate + collaborationScore) / 3);
  }

  /**
   * Calculate preference match score
   */
  private static calculatePreferenceMatch(
    task: Ticket | Subtask,
    agent: AgentRoster
  ): number {
    if (!agent.preferences) return 50; // neutral

    const taskTags = 'tags' in task ? task.tags : [];
    const preferredTypes = agent.preferences.preferredTaskTypes || [];
    const avoidTypes = agent.preferences.avoidTaskTypes || [];

    let score = 50;

    // Check if task matches preferred types
    for (const tag of taskTags) {
      if (preferredTypes.some(p => p.toLowerCase() === tag.toLowerCase())) {
        score += 15;
      }
      if (avoidTypes.some(a => a.toLowerCase() === tag.toLowerCase())) {
        score -= 25;
      }
    }

    return Math.max(0, Math.min(100, score));
  }

  /**
   * Get team composition overview
   */
  static getTeamComposition(agents: AgentRoster[]): TeamComposition {
    const totalAgents = agents.length;
    const availableAgents = agents.filter(a => a.availability.status === 'available').length;
    const busyAgents = agents.filter(a => a.availability.status === 'busy').length;
    const offlineAgents = agents.filter(a => a.availability.status === 'offline').length;

    // Skill coverage analysis
    const skillCategories: SkillCategory[] = [
      'frontend', 'backend', 'database', 'devops', 'testing', 'design', 'mobile', 'security', 'performance'
    ];

    const skillCoverage = skillCategories.map(category => {
      const agentsWithSkill = agents.filter(agent =>
        agent.skills.some(skill => skill.category === category)
      );

      const averageLevel = this.calculateAverageSkillLevel(
        agentsWithSkill.flatMap(a => a.skills.filter(s => s.category === category))
      );

      return {
        category,
        agentCount: agentsWithSkill.length,
        averageLevel,
      };
    });

    // Workload distribution
    const workloadDistribution = agents.map(agent => ({
      agentId: agent.id,
      currentTasks: agent.availability.currentWorkload,
      capacityUtilization: Math.round(
        (agent.availability.currentWorkload / agent.availability.maxCapacity) * 100
      ),
    }));

    return {
      totalAgents,
      availableAgents,
      busyAgents,
      offlineAgents,
      skillCoverage,
      workloadDistribution,
    };
  }

  /**
   * Calculate average skill level
   */
  private static calculateAverageSkillLevel(skills: Skill[]): SkillLevel {
    if (skills.length === 0) return 'beginner';

    const scores = skills.map(s => this.skillLevelToScore(s.level));
    const average = scores.reduce((sum, s) => sum + s, 0) / scores.length;

    if (average >= 90) return 'expert';
    if (average >= 70) return 'advanced';
    if (average >= 50) return 'intermediate';
    return 'beginner';
  }

  /**
   * Update agent performance after task completion
   */
  static updatePerformance(
    agent: AgentRoster,
    taskCompletedOnTime: boolean,
    qualityRating: number
  ): AgentRoster {
    const metrics = agent.performanceMetrics;

    const updatedMetrics = {
      ...metrics,
      tasksCompleted: metrics.tasksCompleted + 1,
      tasksInProgress: Math.max(0, metrics.tasksInProgress - 1),
      onTimeDeliveryRate: this.calculateNewRate(
        metrics.onTimeDeliveryRate || 100,
        taskCompletedOnTime ? 100 : 0,
        metrics.tasksCompleted
      ),
      qualityScore: this.calculateNewRate(
        metrics.qualityScore || 75,
        qualityRating,
        metrics.tasksCompleted
      ),
      lastUpdated: Date.now(),
    };

    return {
      ...agent,
      performanceMetrics: updatedMetrics,
      availability: {
        ...agent.availability,
        currentWorkload: Math.max(0, agent.availability.currentWorkload - 1),
      },
      updatedAt: Date.now(),
    };
  }

  /**
   * Calculate new running average rate
   */
  private static calculateNewRate(
    currentRate: number,
    newValue: number,
    count: number
  ): number {
    return Math.round(((currentRate * count) + newValue) / (count + 1));
  }

  /**
   * Rebalance workload across team
   */
  static rebalanceWorkload(
    tasks: (Ticket | Subtask)[],
    agents: AgentRoster[]
  ): Map<string, string> {
    // Get current assignments
    const currentAssignments = new Map<string, string>();

    for (const task of tasks) {
      if (task.assignedAgentId) {
        currentAssignments.set(task.id, task.assignedAgentId);
      }
    }

    // Find overloaded agents
    const overloadedAgents = agents.filter(
      a => a.availability.currentWorkload > a.availability.maxCapacity * 0.8
    );

    const underutilizedAgents = agents.filter(
      a => a.availability.currentWorkload < a.availability.maxCapacity * 0.5
    );

    if (overloadedAgents.length === 0 || underutilizedAgents.length === 0) {
      return currentAssignments; // No rebalancing needed
    }

    // Reassign some tasks from overloaded to underutilized agents
    const tasksToReassign = tasks.filter(
      t => t.status === 'backlog' &&
      overloadedAgents.some(a => a.id === t.assignedAgentId)
    );

    for (const task of tasksToReassign) {
      const recommendation = this.recommendAgent(task, underutilizedAgents);
      if (recommendation.autoAssigned) {
        currentAssignments.set(task.id, recommendation.autoAssigned);
      }
    }

    return currentAssignments;
  }
}
