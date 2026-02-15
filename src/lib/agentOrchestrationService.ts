import { Task } from '@/types/task';
import { CodingAgent } from '@/types/agent';
import {
  AgentSkill,
  AgentPerformanceMetrics,
  AgentAvailability,
  AssignmentRule,
  AutoAssignmentSuggestion,
  AgentRoster,
  OrchestrationConfig,
  SkillLevel
} from '@/types/agentOrchestration';

/**
 * Agent Orchestration Service
 * Handles agent roster management and auto-assignment based on skills and performance
 */

export class AgentOrchestrationService {
  /**
   * Find the best agent for a task
   */
  static async findBestAgent(
    task: Task,
    agents: CodingAgent[],
    agentSkills: Map<string, AgentSkill[]>,
    agentPerformance: Map<string, AgentPerformanceMetrics>,
    agentAvailability: Map<string, AgentAvailability>,
    config: OrchestrationConfig,
    rules: AssignmentRule[]
  ): Promise<AutoAssignmentSuggestion | null> {
    const candidates = await this.rankAgents(
      task,
      agents,
      agentSkills,
      agentPerformance,
      agentAvailability,
      config
    );

    if (candidates.length === 0) {
      return null;
    }

    // Apply assignment rules
    const filteredCandidates = this.applyRules(candidates, task, rules);

    if (filteredCandidates.length === 0) {
      return null;
    }

    const bestCandidate = filteredCandidates[0];

    if (bestCandidate.confidence < config.minConfidenceThreshold) {
      return null;
    }

    return {
      taskId: task.id,
      suggestedAgentId: bestCandidate.agentId,
      confidence: bestCandidate.confidence,
      reason: bestCandidate.reason,
      matchedSkills: bestCandidate.matchedSkills,
      estimatedCompletionTime: bestCandidate.estimatedCompletionTime,
      alternativeAgents: filteredCandidates.slice(1, 4).map(c => ({
        agentId: c.agentId,
        confidence: c.confidence,
        reason: c.reason
      }))
    };
  }

  /**
   * Rank agents based on multiple factors
   */
  private static async rankAgents(
    task: Task,
    agents: CodingAgent[],
    agentSkills: Map<string, AgentSkill[]>,
    agentPerformance: Map<string, AgentPerformanceMetrics>,
    agentAvailability: Map<string, AgentAvailability>,
    config: OrchestrationConfig
  ): Promise<Array<{
    agentId: string;
    confidence: number;
    reason: string;
    matchedSkills: string[];
    estimatedCompletionTime: number;
  }>> {
    const candidates = [];

    for (const agent of agents) {
      const skills = agentSkills.get(agent.id) || [];
      const performance = agentPerformance.get(agent.id);
      const availability = agentAvailability.get(agent.id);

      const score = this.calculateAgentScore(
        task,
        agent,
        skills,
        performance,
        availability,
        config
      );

      if (score.confidence > 0) {
        candidates.push({
          agentId: agent.id,
          ...score
        });
      }
    }

    // Sort by confidence descending
    candidates.sort((a, b) => b.confidence - a.confidence);

    return candidates;
  }

  /**
   * Calculate agent score for a task
   */
  private static calculateAgentScore(
    task: Task,
    agent: CodingAgent,
    skills: AgentSkill[],
    performance: AgentPerformanceMetrics | undefined,
    availability: AgentAvailability | undefined,
    config: OrchestrationConfig
  ): {
    confidence: number;
    reason: string;
    matchedSkills: string[];
    estimatedCompletionTime: number;
  } {
    let totalScore = 0;
    let maxScore = 0;
    const matchedSkills: string[] = [];
    const reasons: string[] = [];

    // 1. Skill matching (40% of total score)
    if (config.considerSkillLevel) {
      const skillScore = this.calculateSkillScore(task, skills);
      totalScore += skillScore.score * 0.4;
      maxScore += 40;
      matchedSkills.push(...skillScore.matchedSkills);
      if (skillScore.score > 0) {
        reasons.push(`Has ${skillScore.matchedSkills.length} matching skills`);
      }
    }

    // 2. Performance score (30% of total score)
    if (config.considerPerformance && performance) {
      const perfScore = this.calculatePerformanceScore(performance);
      totalScore += perfScore.score * 0.3;
      maxScore += 30;
      if (perfScore.score > 70) {
        reasons.push(`High performance (${perfScore.score.toFixed(0)}%)`);
      }
    }

    // 3. Workload balance (20% of total score)
    if (config.considerWorkload && performance) {
      const workloadScore = this.calculateWorkloadScore(performance, config.balanceWorkload);
      totalScore += workloadScore.score * 0.2;
      maxScore += 20;
      if (workloadScore.score > 70) {
        reasons.push(`Available capacity (${performance.capacity - performance.currentWorkload} slots)`);
      }
    }

    // 4. Availability (10% of total score)
    if (config.considerAvailability && availability) {
      const availScore = this.calculateAvailabilityScore(availability);
      totalScore += availScore.score * 0.1;
      maxScore += 10;
      if (!availScore.available) {
        reasons.push('Currently unavailable');
      }
    }

    // Normalize to 0-100
    const confidence = maxScore > 0 ? (totalScore / maxScore) * 100 : 0;

    // Estimate completion time based on task priority and agent performance
    const estimatedCompletionTime = this.estimateCompletionTime(
      task,
      performance
    );

    return {
      confidence,
      reason: reasons.join(', ') || 'General match',
      matchedSkills,
      estimatedCompletionTime
    };
  }

  /**
   * Calculate skill matching score
   */
  private static calculateSkillScore(
    task: Task,
    skills: AgentSkill[]
  ): { score: number; matchedSkills: string[] } {
    const taskKeywords = [
      ...task.title.toLowerCase().split(/\s+/),
      ...task.description.toLowerCase().split(/\s+/),
      ...task.tags.map(t => t.toLowerCase())
    ];

    const matchedSkills: string[] = [];
    let totalScore = 0;

    for (const skill of skills) {
      const skillName = skill.skillName.toLowerCase();
      const isMatch = taskKeywords.some(keyword =>
        skillName.includes(keyword) || keyword.includes(skillName)
      );

      if (isMatch) {
        matchedSkills.push(skill.skillName);

        // Score based on skill level
        const levelScore = {
          'beginner': 25,
          'intermediate': 50,
          'advanced': 75,
          'expert': 100
        }[skill.level] || 50;

        totalScore += levelScore;
      }
    }

    // Average score if multiple skills matched
    const score = matchedSkills.length > 0 ? totalScore / matchedSkills.length : 0;

    return { score, matchedSkills };
  }

  /**
   * Calculate performance score
   */
  private static calculatePerformanceScore(
    performance: AgentPerformanceMetrics
  ): { score: number } {
    const qualityWeight = 0.4;
    const deliveryWeight = 0.3;
    const collaborationWeight = 0.3;

    const score =
      performance.qualityScore * qualityWeight +
      performance.onTimeDeliveryRate * deliveryWeight +
      performance.collaborationScore * collaborationWeight;

    return { score };
  }

  /**
   * Calculate workload score
   */
  private static calculateWorkloadScore(
    performance: AgentPerformanceMetrics,
    balanceWorkload: boolean
  ): { score: number } {
    const utilizationRate = performance.currentWorkload / performance.capacity;

    // Lower utilization = higher score (more available)
    const score = balanceWorkload
      ? (1 - utilizationRate) * 100
      : utilizationRate < 1 ? 100 : 0; // Just check if has capacity

    return { score };
  }

  /**
   * Calculate availability score
   */
  private static calculateAvailabilityScore(
    availability: AgentAvailability
  ): { score: number; available: boolean } {
    if (!availability.isAvailable) {
      return { score: 0, available: false };
    }

    const now = Date.now();

    // Check time-based availability
    if (availability.availableFrom && now < availability.availableFrom) {
      return { score: 50, available: false }; // Will be available soon
    }

    if (availability.availableUntil && now > availability.availableUntil) {
      return { score: 0, available: false };
    }

    return { score: 100, available: true };
  }

  /**
   * Estimate task completion time
   */
  private static estimateCompletionTime(
    task: Task,
    performance?: AgentPerformanceMetrics
  ): number {
    // Base estimate based on priority (higher priority = more urgent)
    const baseHours = {
      1: 16, // Low priority
      2: 12,
      3: 8,  // Medium priority
      4: 4,
      5: 2   // Critical priority
    }[task.priority] || 8;

    // Adjust based on agent's average completion time
    if (performance && performance.averageCompletionTime > 0) {
      return Math.min(baseHours, performance.averageCompletionTime);
    }

    return baseHours;
  }

  /**
   * Apply assignment rules to filter candidates
   */
  private static applyRules(
    candidates: Array<{
      agentId: string;
      confidence: number;
      reason: string;
      matchedSkills: string[];
      estimatedCompletionTime: number;
    }>,
    task: Task,
    rules: AssignmentRule[]
  ): Array<{
    agentId: string;
    confidence: number;
    reason: string;
    matchedSkills: string[];
    estimatedCompletionTime: number;
  }> {
    let filtered = [...candidates];

    // Sort rules by priority
    const sortedRules = rules
      .filter(r => r.enabled)
      .sort((a, b) => b.priority - a.priority);

    for (const rule of sortedRules) {
      filtered = filtered.filter(candidate =>
        this.matchesRule(candidate, task, rule)
      );
    }

    return filtered;
  }

  /**
   * Check if a candidate matches a rule
   */
  private static matchesRule(
    candidate: {
      agentId: string;
      confidence: number;
      matchedSkills: string[];
    },
    task: Task,
    rule: AssignmentRule
  ): boolean {
    const conditions = rule.conditions;

    // Check required skills
    if (conditions.requiredSkills && conditions.requiredSkills.length > 0) {
      const hasRequiredSkills = conditions.requiredSkills.some(skill =>
        candidate.matchedSkills.some(ms =>
          ms.toLowerCase().includes(skill.toLowerCase())
        )
      );
      if (!hasRequiredSkills) return false;
    }

    // Check task priority
    if (conditions.taskPriority && conditions.taskPriority.length > 0) {
      if (!conditions.taskPriority.includes(task.priority)) {
        return false;
      }
    }

    // Check task tags
    if (conditions.taskTags && conditions.taskTags.length > 0) {
      const hasMatchingTag = conditions.taskTags.some(tag =>
        task.tags.some(t => t.toLowerCase().includes(tag.toLowerCase()))
      );
      if (!hasMatchingTag) return false;
    }

    return true;
  }

  /**
   * Build agent roster with all relevant data
   */
  static buildAgentRoster(
    agents: CodingAgent[],
    agentSkills: Map<string, AgentSkill[]>,
    agentPerformance: Map<string, AgentPerformanceMetrics>,
    agentAvailability: Map<string, AgentAvailability>,
    tasks: Task[]
  ): AgentRoster[] {
    return agents.map(agent => {
      const skills = agentSkills.get(agent.id) || [];
      const performance = agentPerformance.get(agent.id) || this.getDefaultPerformance(agent.id);
      const availability = agentAvailability.get(agent.id) || this.getDefaultAvailability(agent.id);
      const currentTasks = tasks
        .filter(t => t.assignedAgentId === agent.id && t.status !== 'done')
        .map(t => t.id);

      return {
        agentId: agent.id,
        name: agent.name,
        skills,
        performance,
        availability,
        currentTasks
      };
    });
  }

  /**
   * Get default performance metrics
   */
  private static getDefaultPerformance(agentId: string): AgentPerformanceMetrics {
    return {
      id: `perf_${agentId}`,
      agentId,
      totalTasksCompleted: 0,
      totalTasksInProgress: 0,
      averageCompletionTime: 0,
      onTimeDeliveryRate: 100,
      qualityScore: 100,
      collaborationScore: 100,
      currentWorkload: 0,
      capacity: 5,
      lastUpdated: Date.now()
    };
  }

  /**
   * Get default availability
   */
  private static getDefaultAvailability(agentId: string): AgentAvailability {
    return {
      id: `avail_${agentId}`,
      agentId,
      isAvailable: true,
      timezone: 'UTC',
      workingHours: {
        start: '09:00',
        end: '17:00'
      },
      daysOff: ['saturday', 'sunday']
    };
  }

  /**
   * Update performance metrics after task completion
   */
  static updatePerformanceMetrics(
    performance: AgentPerformanceMetrics,
    completionTime: number,
    wasOnTime: boolean,
    qualityRating: number
  ): AgentPerformanceMetrics {
    const totalTasks = performance.totalTasksCompleted + 1;

    return {
      ...performance,
      totalTasksCompleted: totalTasks,
      averageCompletionTime:
        (performance.averageCompletionTime * performance.totalTasksCompleted + completionTime) / totalTasks,
      onTimeDeliveryRate:
        (performance.onTimeDeliveryRate * performance.totalTasksCompleted + (wasOnTime ? 100 : 0)) / totalTasks,
      qualityScore:
        (performance.qualityScore * performance.totalTasksCompleted + qualityRating) / totalTasks,
      lastUpdated: Date.now()
    };
  }
}
