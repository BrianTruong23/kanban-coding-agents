import { CodingAgent, Skill, PerformanceMetrics, AgentAvailability } from '@/types/agent';
import { Task } from '@/types/task';

export interface AssignmentScore {
  agentId: string;
  score: number;
  reasons: string[];
}

export interface AssignmentRecommendation {
  agentId: string;
  agent: CodingAgent;
  score: number;
  reasons: string[];
  confidence: 'high' | 'medium' | 'low';
}

/**
 * Agent Orchestration Service
 * Manages agent roster and provides intelligent auto-assignment
 */
export class AgentOrchestrationService {
  /**
   * Find the best agent for a task
   */
  static findBestAgent(
    task: Task,
    agents: CodingAgent[],
    allTasks: Task[]
  ): AssignmentRecommendation | null {
    const scores = agents.map(agent => this.scoreAgent(agent, task, allTasks));

    // Sort by score descending
    scores.sort((a, b) => b.score - a.score);

    const best = scores[0];
    if (!best || best.score === 0) {
      return null;
    }

    const agent = agents.find(a => a.id === best.agentId);
    if (!agent) {
      return null;
    }

    return {
      agentId: best.agentId,
      agent,
      score: best.score,
      reasons: best.reasons,
      confidence: this.getConfidenceLevel(best.score),
    };
  }

  /**
   * Get multiple agent recommendations
   */
  static getRecommendations(
    task: Task,
    agents: CodingAgent[],
    allTasks: Task[],
    limit: number = 3
  ): AssignmentRecommendation[] {
    const scores = agents.map(agent => this.scoreAgent(agent, task, allTasks));

    // Sort by score descending
    scores.sort((a, b) => b.score - a.score);

    return scores
      .slice(0, limit)
      .filter(s => s.score > 0)
      .map(s => {
        const agent = agents.find(a => a.id === s.agentId)!;
        return {
          agentId: s.agentId,
          agent,
          score: s.score,
          reasons: s.reasons,
          confidence: this.getConfidenceLevel(s.score),
        };
      });
  }

  /**
   * Score an agent for a task (0-100)
   */
  private static scoreAgent(agent: CodingAgent, task: Task, allTasks: Task[]): AssignmentScore {
    let score = 0;
    const reasons: string[] = [];

    // Check availability (max 30 points)
    const availabilityScore = this.scoreAvailability(agent, allTasks);
    score += availabilityScore;
    if (availabilityScore > 20) {
      reasons.push('Available to take on work');
    } else if (availabilityScore > 0) {
      reasons.push('Has limited availability');
    } else {
      reasons.push('Currently at capacity');
    }

    // Check skills match (max 40 points)
    const skillScore = this.scoreSkills(agent, task);
    score += skillScore;
    if (skillScore > 30) {
      reasons.push('Expert in required technologies');
    } else if (skillScore > 20) {
      reasons.push('Has relevant technical skills');
    } else if (skillScore > 0) {
      reasons.push('Has some relevant experience');
    }

    // Check performance history (max 20 points)
    const performanceScore = this.scorePerformance(agent);
    score += performanceScore;
    if (performanceScore > 15) {
      reasons.push('Excellent track record');
    } else if (performanceScore > 10) {
      reasons.push('Good performance history');
    }

    // Check task type preference (max 10 points)
    const preferenceScore = this.scorePreference(agent, task);
    score += preferenceScore;
    if (preferenceScore > 5) {
      reasons.push('Matches preferred task type');
    }

    return {
      agentId: agent.id,
      score: Math.round(score),
      reasons,
    };
  }

  /**
   * Score availability (0-30 points)
   */
  private static scoreAvailability(agent: CodingAgent, allTasks: Task[]): number {
    const availability = agent.availability;

    // Check status
    if (availability.status === 'offline') {
      return 0;
    }

    if (availability.status === 'busy') {
      return 5;
    }

    // Check current load vs max load
    const loadPercentage = availability.currentTaskLoad / availability.maxTaskLoad;

    if (loadPercentage >= 1) {
      return 0; // At capacity
    }

    if (loadPercentage >= 0.8) {
      return 10; // Nearly at capacity
    }

    if (loadPercentage >= 0.5) {
      return 20; // Half capacity
    }

    return 30; // Plenty of capacity
  }

  /**
   * Score skills match (0-40 points)
   */
  private static scoreSkills(agent: CodingAgent, task: Task): number {
    let score = 0;

    // Match tags with skills
    const taskTags = new Set(task.tags.map(t => t.toLowerCase()));
    const agentSkillTags = new Set(
      agent.skills.flatMap(s => s.tags.map(t => t.toLowerCase()))
    );

    // Count matching tags
    const matchingTags = Array.from(taskTags).filter(tag => agentSkillTags.has(tag));

    if (matchingTags.length === 0) {
      return 0;
    }

    // Base score for having any matching skills
    score += Math.min(matchingTags.length * 5, 20);

    // Bonus for skill level
    const relevantSkills = agent.skills.filter(skill =>
      skill.tags.some(tag => taskTags.has(tag.toLowerCase()))
    );

    const maxLevel = Math.max(
      ...relevantSkills.map(skill => this.skillLevelToNumber(skill.level)),
      0
    );

    score += maxLevel * 5; // 5-20 points based on skill level

    return Math.min(score, 40);
  }

  /**
   * Score performance (0-20 points)
   */
  private static scorePerformance(agent: CodingAgent): number {
    const metrics = agent.performanceMetrics;

    if (metrics.tasksCompleted === 0) {
      return 10; // Neutral score for new agents
    }

    let score = 0;

    // Quality score (0-10 points)
    score += (metrics.qualityScore / 100) * 10;

    // On-time delivery rate (0-10 points)
    const onTimeRate = metrics.tasksOnTime / (metrics.tasksCompleted || 1);
    score += onTimeRate * 10;

    return Math.round(Math.min(score, 20));
  }

  /**
   * Score task type preference (0-10 points)
   */
  private static scorePreference(agent: CodingAgent, task: Task): number {
    if (!agent.preferredTaskTypes || agent.preferredTaskTypes.length === 0) {
      return 5; // Neutral if no preference
    }

    const taskTags = new Set(task.tags.map(t => t.toLowerCase()));
    const preferences = new Set(agent.preferredTaskTypes.map(p => p.toLowerCase()));

    const hasPreferredTag = Array.from(taskTags).some(tag => preferences.has(tag));

    return hasPreferredTag ? 10 : 0;
  }

  /**
   * Convert skill level to number
   */
  private static skillLevelToNumber(level: string): number {
    switch (level) {
      case 'expert':
        return 4;
      case 'advanced':
        return 3;
      case 'intermediate':
        return 2;
      case 'beginner':
        return 1;
      default:
        return 0;
    }
  }

  /**
   * Get confidence level from score
   */
  private static getConfidenceLevel(score: number): 'high' | 'medium' | 'low' {
    if (score >= 70) {
      return 'high';
    }
    if (score >= 40) {
      return 'medium';
    }
    return 'low';
  }

  /**
   * Update agent metrics after task completion
   */
  static updateAgentMetrics(
    agent: CodingAgent,
    task: Task,
    onTime: boolean,
    qualityScore: number
  ): CodingAgent {
    const metrics = { ...agent.performanceMetrics };

    metrics.tasksCompleted += 1;
    if (onTime) {
      metrics.tasksOnTime += 1;
    } else {
      metrics.tasksLate += 1;
    }

    // Update average task time
    const actualHours = task.actualHours || 0;
    metrics.averageTaskTime =
      (metrics.averageTaskTime * (metrics.tasksCompleted - 1) + actualHours) /
      metrics.tasksCompleted;

    // Update quality score (moving average)
    metrics.qualityScore =
      (metrics.qualityScore * (metrics.tasksCompleted - 1) + qualityScore) /
      metrics.tasksCompleted;

    metrics.lastUpdated = Date.now();

    return {
      ...agent,
      performanceMetrics: metrics,
    };
  }

  /**
   * Update agent availability
   */
  static updateAgentAvailability(
    agent: CodingAgent,
    currentTasks: Task[]
  ): CodingAgent {
    const agentTasks = currentTasks.filter(
      t => t.assignedAgentId === agent.id && t.status !== 'done'
    );

    const availability: AgentAvailability = {
      ...agent.availability,
      currentTaskLoad: agentTasks.length,
    };

    // Update status based on load
    if (agentTasks.length >= agent.availability.maxTaskLoad) {
      availability.status = 'busy';
    } else if (agentTasks.length === 0) {
      availability.status = 'available';
    }

    return {
      ...agent,
      availability,
    };
  }

  /**
   * Balance workload across agents
   */
  static balanceWorkload(
    tasks: Task[],
    agents: CodingAgent[]
  ): Map<string, string> {
    // Returns taskId -> agentId mapping
    const assignments = new Map<string, string>();

    // Get unassigned tasks
    const unassignedTasks = tasks.filter(t => !t.assignedAgentId && t.status !== 'done');

    // Sort tasks by priority (high to low)
    unassignedTasks.sort((a, b) => b.priority - a.priority);

    // Assign tasks
    unassignedTasks.forEach(task => {
      const recommendation = this.findBestAgent(task, agents, tasks);
      if (recommendation) {
        assignments.set(task.id, recommendation.agentId);
      }
    });

    return assignments;
  }

  /**
   * Create default agent with enhanced fields
   */
  static createDefaultAgent(
    id: string,
    name: string,
    description: string,
    avatarColor: string,
    skills: Skill[],
    preferredTaskTypes?: string[]
  ): CodingAgent {
    return {
      id,
      name,
      description,
      avatarColor,
      skills,
      preferredTaskTypes,
      performanceMetrics: {
        tasksCompleted: 0,
        tasksOnTime: 0,
        tasksLate: 0,
        averageTaskTime: 0,
        qualityScore: 80, // Start with a baseline
        lastUpdated: Date.now(),
      },
      availability: {
        status: 'available',
        currentTaskLoad: 0,
        maxTaskLoad: 3,
        availableHours: 40,
      },
      createdAt: Date.now(),
    };
  }
}
