import { CodingAgent } from '@/types/agent';
import { TaskBreakdown } from '@/types/breakdown';
import { AssignmentScore, AssignmentRecommendation, SkillCategory } from '@/types/skills';

/**
 * Agent Assignment Algorithm
 *
 * Automatically assigns tasks to agents based on:
 * - Skill matching
 * - Performance metrics
 * - Current workload
 * - Availability
 */

export class AgentAssignmentService {
  /**
   * Get assignment recommendation for a task
   */
  getRecommendation(task: TaskBreakdown, agents: CodingAgent[]): AssignmentRecommendation {
    const scores = agents.map(agent => this.scoreAgent(task, agent, agents));
    scores.sort((a, b) => b.score - a.score);

    const bestMatch = scores[0];
    const confidence = this.calculateConfidence(bestMatch, scores);

    return {
      taskId: task.taskId,
      recommendations: scores,
      bestMatch,
      confidence,
    };
  }

  /**
   * Batch assign multiple tasks to agents
   */
  batchAssign(tasks: TaskBreakdown[], agents: CodingAgent[]): Map<string, string> {
    const assignments = new Map<string, string>(); // taskId -> agentId
    const agentWorkloads = new Map<string, number>();

    // Initialize workloads
    agents.forEach(agent => {
      agentWorkloads.set(agent.id, agent.workload || 0);
    });

    // Sort tasks by priority (higher priority first)
    const sortedTasks = [...tasks].sort((a, b) => b.priority - a.priority);

    // Assign each task
    sortedTasks.forEach(task => {
      // Create a copy of agents with updated workloads for scoring
      const agentsWithWorkload = agents.map(agent => ({
        ...agent,
        workload: agentWorkloads.get(agent.id) || agent.workload || 0,
      }));

      const recommendation = this.getRecommendation(task, agentsWithWorkload);

      if (recommendation.bestMatch && recommendation.confidence > 50) {
        const agentId = recommendation.bestMatch.agentId;
        assignments.set(task.taskId, agentId);

        // Update workload
        const currentWorkload = agentWorkloads.get(agentId) || 0;
        agentWorkloads.set(agentId, currentWorkload + 1);
      }
    });

    return assignments;
  }

  /**
   * Score an agent for a specific task
   */
  private scoreAgent(task: TaskBreakdown, agent: CodingAgent, allAgents: CodingAgent[]): AssignmentScore {
    const skillMatch = this.calculateSkillMatch(task, agent);
    const performanceMatch = this.calculatePerformanceMatch(task, agent);
    const availabilityMatch = this.calculateAvailabilityMatch(agent);
    const workloadMatch = this.calculateWorkloadMatch(agent, allAgents);

    // Weighted scoring
    const weights = {
      skill: 0.4,
      performance: 0.25,
      availability: 0.15,
      workload: 0.2,
    };

    const score =
      skillMatch * weights.skill +
      performanceMatch * weights.performance +
      availabilityMatch * weights.availability +
      workloadMatch * weights.workload;

    const reasons = this.generateReasons(skillMatch, performanceMatch, availabilityMatch, workloadMatch, agent);

    return {
      agentId: agent.id,
      score: Math.round(score),
      reasons,
      skillMatch: Math.round(skillMatch),
      performanceMatch: Math.round(performanceMatch),
      availabilityMatch: Math.round(availabilityMatch),
      workloadMatch: Math.round(workloadMatch),
    };
  }

  /**
   * Calculate skill match score (0-100)
   */
  private calculateSkillMatch(task: TaskBreakdown, agent: CodingAgent): number {
    if (!agent.skills || agent.skills.length === 0) {
      // If no skills defined, use specializations
      if (agent.specializations) {
        return this.matchSpecializations(task, agent.specializations);
      }
      return 50; // Default middle score if no skill data
    }

    const requiredSkills = task.requiredSkills || [];
    if (requiredSkills.length === 0) return 70; // No specific requirements

    const agentSkillNames = agent.skills.map(s => s.name.toLowerCase());
    let matchCount = 0;
    let totalLevel = 0;

    requiredSkills.forEach(requiredSkill => {
      const skillIndex = agentSkillNames.indexOf(requiredSkill.toLowerCase());
      if (skillIndex >= 0) {
        matchCount++;
        totalLevel += agent.skills![skillIndex].level;
      }
    });

    if (matchCount === 0) return 20; // No matching skills

    const matchPercentage = matchCount / requiredSkills.length;
    const avgLevel = totalLevel / matchCount;
    const levelBonus = (avgLevel / 5) * 20; // Up to 20 bonus points for expertise

    return Math.min(100, matchPercentage * 80 + levelBonus);
  }

  /**
   * Match task tags with agent specializations
   */
  private matchSpecializations(task: TaskBreakdown, specializations: SkillCategory[]): number {
    const taskCategories = this.inferCategoriesFromTags(task.tags);

    if (taskCategories.length === 0) return 60;

    const matches = taskCategories.filter(cat => specializations.includes(cat));
    return (matches.length / taskCategories.length) * 100;
  }

  /**
   * Infer skill categories from task tags
   */
  private inferCategoriesFromTags(tags: string[]): SkillCategory[] {
    const categoryMap: Record<string, SkillCategory> = {
      frontend: 'frontend',
      react: 'frontend',
      ui: 'frontend',
      css: 'frontend',
      backend: 'backend',
      api: 'backend',
      server: 'backend',
      database: 'database',
      db: 'database',
      sql: 'database',
      devops: 'devops',
      deployment: 'devops',
      docker: 'devops',
      testing: 'testing',
      qa: 'testing',
      mobile: 'mobile',
      design: 'design',
      security: 'security',
    };

    const categories = new Set<SkillCategory>();
    tags.forEach(tag => {
      const category = categoryMap[tag.toLowerCase()];
      if (category) categories.add(category);
    });

    return Array.from(categories);
  }

  /**
   * Calculate performance match score (0-100)
   */
  private calculatePerformanceMatch(task: TaskBreakdown, agent: CodingAgent): number {
    if (!agent.performanceMetrics) return 70; // Default score if no metrics

    const metrics = agent.performanceMetrics;

    // Higher success rate = better
    const successScore = metrics.successRate || 80;

    // Higher quality score = better (scale from 1-5 to 0-100)
    const qualityScore = ((metrics.qualityScore || 3) / 5) * 100;

    // Higher velocity = better (normalize to 0-100)
    const velocityScore = Math.min(100, (metrics.velocity || 5) * 10);

    // Average the scores
    return (successScore + qualityScore + velocityScore) / 3;
  }

  /**
   * Calculate availability match score (0-100)
   */
  private calculateAvailabilityMatch(agent: CodingAgent): number {
    switch (agent.availability) {
      case 'available':
        return 100;
      case 'busy':
        return 50;
      case 'offline':
        return 0;
      default:
        return 80; // Default if not specified
    }
  }

  /**
   * Calculate workload match score (0-100)
   * Lower workload = higher score
   */
  private calculateWorkloadMatch(agent: CodingAgent, allAgents: CodingAgent[]): number {
    const workloads = allAgents.map(a => a.workload || 0);
    const maxWorkload = Math.max(...workloads, 1);
    const agentWorkload = agent.workload || 0;

    // Invert the score: less workload = higher score
    return 100 - (agentWorkload / maxWorkload) * 100;
  }

  /**
   * Generate human-readable reasons for the score
   */
  private generateReasons(
    skillMatch: number,
    performanceMatch: number,
    availabilityMatch: number,
    workloadMatch: number,
    agent: CodingAgent
  ): string[] {
    const reasons: string[] = [];

    // Skill match reasons
    if (skillMatch >= 80) {
      reasons.push('Excellent skill match for this task');
    } else if (skillMatch >= 60) {
      reasons.push('Good skill match');
    } else if (skillMatch >= 40) {
      reasons.push('Moderate skill match');
    } else {
      reasons.push('Limited skill match - may need support');
    }

    // Performance reasons
    if (performanceMatch >= 80) {
      reasons.push('Strong performance history');
    } else if (performanceMatch >= 60) {
      reasons.push('Reliable performer');
    }

    // Availability reasons
    if (availabilityMatch === 100) {
      reasons.push('Currently available');
    } else if (availabilityMatch === 50) {
      reasons.push('Currently busy but can take on more work');
    } else if (availabilityMatch === 0) {
      reasons.push('Currently offline - not recommended');
    }

    // Workload reasons
    if (workloadMatch >= 80) {
      reasons.push('Low current workload');
    } else if (workloadMatch >= 50) {
      reasons.push('Moderate workload');
    } else {
      reasons.push('High current workload - may affect delivery time');
    }

    return reasons;
  }

  /**
   * Calculate confidence in the recommendation
   */
  private calculateConfidence(bestMatch: AssignmentScore, allScores: AssignmentScore[]): number {
    if (allScores.length === 1) return 100;

    const secondBest = allScores[1];
    const scoreDiff = bestMatch.score - secondBest.score;

    // Higher difference = higher confidence
    // 0 diff = 50% confidence, 50+ diff = 100% confidence
    return Math.min(100, 50 + scoreDiff);
  }

  /**
   * Get agent utilization statistics
   */
  getUtilizationStats(agents: CodingAgent[]): {
    agentId: string;
    name: string;
    workload: number;
    availability: string;
    utilization: number; // percentage
  }[] {
    const maxWorkload = Math.max(...agents.map(a => a.workload || 0), 1);

    return agents.map(agent => ({
      agentId: agent.id,
      name: agent.name,
      workload: agent.workload || 0,
      availability: agent.availability || 'available',
      utilization: ((agent.workload || 0) / maxWorkload) * 100,
    }));
  }
}

// Export singleton instance
export const agentAssignmentService = new AgentAssignmentService();
