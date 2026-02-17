import {
  CodingAgent,
  AgentSkill,
  AgentAssignmentResult,
  AssignmentCriteria,
  SkillCategory,
} from '@/types/agent';
import { Ticket, Subtask } from '@/types/taskBreakdown';

/**
 * Service for orchestrating agent assignments and roster management
 * Implements intelligent auto-assignment based on skills, performance, and availability
 */
export class AgentOrchestrationService {
  /**
   * Automatically assigns the best agent to a task based on multiple criteria
   */
  static assignBestAgent(
    agents: CodingAgent[],
    criteria: AssignmentCriteria
  ): AgentAssignmentResult | null {
    // Filter out excluded agents and unavailable agents
    let availableAgents = agents.filter(
      (agent) =>
        !criteria.excludeAgents?.includes(agent.id) &&
        agent.availability.status !== 'offline' &&
        agent.availability.status !== 'on-leave'
    );

    if (availableAgents.length === 0) {
      return null;
    }

    // Score each agent
    const scoredAgents = availableAgents.map((agent) => ({
      agent,
      score: this.calculateAgentScore(agent, criteria),
    }));

    // Sort by score descending
    scoredAgents.sort((a, b) => b.score.total - a.score.total);

    // Get the best match
    const best = scoredAgents[0];
    if (best.score.total === 0) {
      return null;
    }

    // Get alternatives (top 3 excluding the best)
    const alternatives = scoredAgents.slice(1, 4).map((s) => ({
      agentId: s.agent.id,
      confidence: s.score.total,
    }));

    return {
      agentId: best.agent.id,
      confidence: best.score.total,
      reasons: best.score.reasons,
      alternatives: alternatives.length > 0 ? alternatives : undefined,
    };
  }

  /**
   * Calculates a comprehensive score for an agent based on criteria
   */
  private static calculateAgentScore(
    agent: CodingAgent,
    criteria: AssignmentCriteria
  ): { total: number; reasons: string[] } {
    let score = 0;
    const reasons: string[] = [];
    const maxScore = 100;

    // 1. Skills matching (40 points max)
    const skillScore = this.calculateSkillScore(agent, criteria);
    score += skillScore.score;
    reasons.push(...skillScore.reasons);

    // 2. Availability and capacity (20 points max)
    const availabilityScore = this.calculateAvailabilityScore(agent, criteria);
    score += availabilityScore.score;
    reasons.push(...availabilityScore.reasons);

    // 3. Performance metrics (25 points max)
    const performanceScore = this.calculatePerformanceScore(agent, criteria);
    score += performanceScore.score;
    reasons.push(...performanceScore.reasons);

    // 4. Task preferences and fit (15 points max)
    const preferenceScore = this.calculatePreferenceScore(agent, criteria);
    score += preferenceScore.score;
    reasons.push(...preferenceScore.reasons);

    // Normalize to 0-1 range
    const normalizedScore = Math.min(score / maxScore, 1);

    return {
      total: normalizedScore,
      reasons,
    };
  }

  /**
   * Calculates skill matching score
   */
  private static calculateSkillScore(
    agent: CodingAgent,
    criteria: AssignmentCriteria
  ): { score: number; reasons: string[] } {
    let score = 0;
    const reasons: string[] = [];
    const maxSkillScore = 40;

    const requiredSkills = criteria.requiredSkills || [];
    const preferredSkills = criteria.preferredSkills || [];

    // Check required skills (critical)
    if (requiredSkills.length > 0) {
      const matchedRequired = requiredSkills.filter((reqSkill) =>
        agent.skills.some(
          (agentSkill) =>
            agentSkill.category === reqSkill.category &&
            agentSkill.proficiency >= (reqSkill.proficiency || 1)
        )
      );

      const requiredMatchRatio = matchedRequired.length / requiredSkills.length;
      score += requiredMatchRatio * (maxSkillScore * 0.7); // 70% weight for required

      if (requiredMatchRatio === 1) {
        reasons.push('Matches all required skills');
      } else if (requiredMatchRatio > 0) {
        reasons.push(`Matches ${Math.round(requiredMatchRatio * 100)}% of required skills`);
      }
    } else {
      // No required skills, give base score
      score += maxSkillScore * 0.3;
    }

    // Check preferred skills (nice to have)
    if (preferredSkills.length > 0) {
      const matchedPreferred = preferredSkills.filter((prefSkill) =>
        agent.skills.some(
          (agentSkill) =>
            agentSkill.category === prefSkill.category &&
            agentSkill.proficiency >= (prefSkill.proficiency || 1)
        )
      );

      const preferredMatchRatio = matchedPreferred.length / preferredSkills.length;
      score += preferredMatchRatio * (maxSkillScore * 0.3); // 30% weight for preferred

      if (preferredMatchRatio > 0) {
        reasons.push(`Matches ${Math.round(preferredMatchRatio * 100)}% of preferred skills`);
      }
    }

    // Bonus for high proficiency
    const avgProficiency =
      agent.skills.reduce((sum, skill) => sum + skill.proficiency, 0) / agent.skills.length;
    if (avgProficiency >= 4) {
      score += 5;
      reasons.push('High skill proficiency');
    }

    return { score, reasons };
  }

  /**
   * Calculates availability score
   */
  private static calculateAvailabilityScore(
    agent: CodingAgent,
    criteria: AssignmentCriteria
  ): { score: number; reasons: string[] } {
    let score = 0;
    const reasons: string[] = [];
    const maxAvailabilityScore = 20;

    // Status check
    if (agent.availability.status === 'available') {
      score += maxAvailabilityScore * 0.5;
      reasons.push('Currently available');
    } else if (agent.availability.status === 'busy') {
      score += maxAvailabilityScore * 0.2;
      reasons.push('Currently busy but can take work');
    }

    // Capacity check
    const capacity = agent.availability.currentCapacity || 0;
    const capacityScore = (capacity / 100) * (maxAvailabilityScore * 0.3);
    score += capacityScore;

    if (capacity >= 80) {
      reasons.push('High availability (80%+ capacity)');
    } else if (capacity >= 50) {
      reasons.push('Moderate availability (50%+ capacity)');
    }

    // Concurrent tasks check
    const maxConcurrent = agent.availability.maxConcurrentTasks || 5;
    const current = agent.availability.currentTaskCount || 0;

    if (current < maxConcurrent) {
      score += maxAvailabilityScore * 0.2;
      reasons.push(`Can handle more tasks (${current}/${maxConcurrent})`);
    }

    // Deadline consideration
    if (criteria.deadline) {
      const now = Date.now();
      const timeUntilDeadline = criteria.deadline - now;
      const urgentThreshold = 7 * 24 * 60 * 60 * 1000; // 7 days

      if (timeUntilDeadline < urgentThreshold && agent.availability.status === 'available') {
        score += 5;
        reasons.push('Available for urgent deadline');
      }
    }

    return { score, reasons };
  }

  /**
   * Calculates performance score
   */
  private static calculatePerformanceScore(
    agent: CodingAgent,
    criteria: AssignmentCriteria
  ): { score: number; reasons: string[] } {
    let score = 0;
    const reasons: string[] = [];
    const maxPerformanceScore = 25;

    const perf = agent.performance;

    // Success rate
    if (perf.successRate !== undefined) {
      score += perf.successRate * (maxPerformanceScore * 0.4);
      if (perf.successRate >= 0.9) {
        reasons.push('Excellent success rate (90%+)');
      } else if (perf.successRate >= 0.75) {
        reasons.push('Good success rate (75%+)');
      }
    }

    // Quality score
    if (perf.qualityScore !== undefined) {
      score += perf.qualityScore * (maxPerformanceScore * 0.3);
      if (perf.qualityScore >= 0.8) {
        reasons.push('High quality work (80%+)');
      }
    }

    // On-time delivery
    if (perf.onTimeDeliveryRate !== undefined) {
      score += perf.onTimeDeliveryRate * (maxPerformanceScore * 0.2);
      if (perf.onTimeDeliveryRate >= 0.85) {
        reasons.push('Reliable on-time delivery (85%+)');
      }
    }

    // Recent activity
    if (perf.lastActiveAt) {
      const daysSinceActive = (Date.now() - perf.lastActiveAt) / (1000 * 60 * 60 * 24);
      if (daysSinceActive <= 1) {
        score += maxPerformanceScore * 0.1;
        reasons.push('Recently active');
      }
    }

    // Experience (based on tasks completed)
    if (perf.tasksCompleted >= 50) {
      reasons.push('Highly experienced (50+ tasks)');
    } else if (perf.tasksCompleted >= 20) {
      reasons.push('Experienced (20+ tasks)');
    }

    return { score, reasons };
  }

  /**
   * Calculates preference and fit score
   */
  private static calculatePreferenceScore(
    agent: CodingAgent,
    criteria: AssignmentCriteria
  ): { score: number; reasons: string[] } {
    let score = 0;
    const reasons: string[] = [];
    const maxPreferenceScore = 15;

    const prefs = agent.preferences;
    if (!prefs) {
      return { score: 0, reasons: [] };
    }

    // Task type preference
    if (criteria.taskType && prefs.preferredTaskTypes?.includes(criteria.taskType)) {
      score += maxPreferenceScore * 0.4;
      reasons.push(`Prefers ${criteria.taskType} tasks`);
    }

    // Complexity fit
    if (criteria.taskComplexity && prefs.maxTaskComplexity) {
      if (criteria.taskComplexity <= prefs.maxTaskComplexity) {
        score += maxPreferenceScore * 0.3;
        reasons.push('Task complexity matches preference');
      }
    }

    // Estimated effort fit
    if (criteria.estimatedEffort) {
      // Agents prefer tasks that match their capacity
      const agentCapacityHours = (agent.availability.currentCapacity || 50) / 10; // rough estimate
      const effortFit = 1 - Math.abs(criteria.estimatedEffort - agentCapacityHours) / agentCapacityHours;
      score += Math.max(0, effortFit) * (maxPreferenceScore * 0.3);
    }

    return { score, reasons };
  }

  /**
   * Auto-assigns agents to multiple tickets
   */
  static bulkAssignAgents(
    agents: CodingAgent[],
    tickets: Ticket[]
  ): Map<string, AgentAssignmentResult> {
    const assignments = new Map<string, AgentAssignmentResult>();
    const agentWorkload = new Map<string, number>();

    // Initialize workload
    agents.forEach((agent) => {
      agentWorkload.set(agent.id, agent.availability.currentTaskCount || 0);
    });

    // Sort tickets by priority
    const sortedTickets = [...tickets].sort((a, b) => b.priority - a.priority);

    // Assign each ticket
    sortedTickets.forEach((ticket) => {
      const criteria = this.ticketToCriteria(ticket);
      const assignment = this.assignBestAgent(agents, criteria);

      if (assignment) {
        assignments.set(ticket.id, assignment);
        // Update workload
        const currentLoad = agentWorkload.get(assignment.agentId) || 0;
        agentWorkload.set(assignment.agentId, currentLoad + 1);
      }
    });

    return assignments;
  }

  /**
   * Converts a ticket to assignment criteria
   */
  private static ticketToCriteria(ticket: Ticket): AssignmentCriteria {
    const requiredSkills: AgentSkill[] = [];

    // Infer required skills from tags
    ticket.tags.forEach((tag) => {
      const category = this.tagToSkillCategory(tag);
      if (category) {
        requiredSkills.push({
          category,
          name: tag,
          proficiency: 3, // Medium proficiency required
        });
      }
    });

    return {
      requiredSkills,
      taskType: ticket.type,
      taskComplexity: ticket.priority,
      estimatedEffort: ticket.estimatedEffort,
      priority: ticket.priority,
      deadline: ticket.dueDate,
    };
  }

  /**
   * Maps a tag to a skill category
   */
  private static tagToSkillCategory(tag: string): SkillCategory | null {
    const mapping: Record<string, SkillCategory> = {
      frontend: 'frontend',
      backend: 'backend',
      database: 'database',
      db: 'database',
      devops: 'devops',
      testing: 'testing',
      test: 'testing',
      design: 'design',
      ui: 'design',
      ux: 'design',
      security: 'security',
      auth: 'security',
      performance: 'performance',
      docs: 'documentation',
      documentation: 'documentation',
      architecture: 'architecture',
    };

    return mapping[tag.toLowerCase()] || null;
  }

  /**
   * Updates agent performance metrics after task completion
   */
  static updateAgentPerformance(
    agent: CodingAgent,
    taskCompleted: boolean,
    actualEffort?: number,
    estimatedEffort?: number,
    onTime?: boolean,
    qualityRating?: number
  ): CodingAgent {
    const updatedPerformance = { ...agent.performance };

    // Update task counts
    if (taskCompleted) {
      updatedPerformance.tasksCompleted = (updatedPerformance.tasksCompleted || 0) + 1;
      updatedPerformance.tasksInProgress = Math.max(
        0,
        (updatedPerformance.tasksInProgress || 0) - 1
      );
    } else {
      updatedPerformance.tasksFailed = (updatedPerformance.tasksFailed || 0) + 1;
    }

    // Update success rate
    const totalTasks =
      updatedPerformance.tasksCompleted + updatedPerformance.tasksFailed;
    updatedPerformance.successRate = updatedPerformance.tasksCompleted / totalTasks;

    // Update on-time delivery rate
    if (onTime !== undefined) {
      const currentOnTimeCount = Math.round(
        (updatedPerformance.onTimeDeliveryRate || 0.8) * (totalTasks - 1)
      );
      const newOnTimeCount = currentOnTimeCount + (onTime ? 1 : 0);
      updatedPerformance.onTimeDeliveryRate = newOnTimeCount / totalTasks;
    }

    // Update quality score
    if (qualityRating !== undefined) {
      const currentQualitySum =
        (updatedPerformance.qualityScore || 0.7) * (totalTasks - 1);
      updatedPerformance.qualityScore = (currentQualitySum + qualityRating) / totalTasks;
    }

    // Update average completion time
    if (actualEffort) {
      const currentTotalTime =
        (updatedPerformance.averageCompletionTime || 0) * (totalTasks - 1);
      updatedPerformance.averageCompletionTime =
        (currentTotalTime + actualEffort) / totalTasks;
    }

    // Update total hours worked
    if (actualEffort) {
      updatedPerformance.totalHoursWorked =
        (updatedPerformance.totalHoursWorked || 0) + actualEffort;
    }

    // Update last active timestamp
    updatedPerformance.lastActiveAt = Date.now();

    return {
      ...agent,
      performance: updatedPerformance,
      updatedAt: Date.now(),
    };
  }

  /**
   * Gets agent workload summary
   */
  static getAgentWorkloadSummary(agents: CodingAgent[]): {
    agentId: string;
    name: string;
    currentTasks: number;
    capacity: number;
    utilizationRate: number;
  }[] {
    return agents.map((agent) => {
      const currentTasks = agent.availability.currentTaskCount || 0;
      const maxTasks = agent.availability.maxConcurrentTasks || 5;
      const utilizationRate = (currentTasks / maxTasks) * 100;

      return {
        agentId: agent.id,
        name: agent.name,
        currentTasks,
        capacity: agent.availability.currentCapacity || 0,
        utilizationRate,
      };
    });
  }
}
