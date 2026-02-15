import {
  AgentRoster,
  AssignmentScore,
  AutoAssignmentConfig,
  Skill,
  SkillCategory,
  SkillLevel,
} from '@/types/agentRoster';
import { Ticket, Subtask } from '@/types/breakdown';

/**
 * Agent orchestration and auto-assignment engine
 */
export class AgentOrchestrator {
  /**
   * Calculate assignment scores for all agents for a given task
   */
  static calculateAssignmentScores(
    task: Ticket | Subtask,
    agents: AgentRoster[],
    config: AutoAssignmentConfig = {
      preferSkillMatch: true,
      considerPerformance: true,
      balanceWorkload: true,
      respectCapacity: true,
    }
  ): AssignmentScore[] {
    const scores: AssignmentScore[] = [];

    agents.forEach(agent => {
      const skillMatch = this.calculateSkillMatch(task, agent);
      const availabilityScore = this.calculateAvailabilityScore(agent, config);
      const performanceScore = this.calculatePerformanceScore(agent);

      // Weighted scoring
      let totalScore = 0;
      const reasons: string[] = [];

      if (config.preferSkillMatch) {
        totalScore += skillMatch * 0.5;
        if (skillMatch > 70) {
          reasons.push(`Strong skill match (${skillMatch}%)`);
        } else if (skillMatch > 40) {
          reasons.push(`Moderate skill match (${skillMatch}%)`);
        }
      }

      if (config.considerPerformance) {
        totalScore += performanceScore * 0.25;
        if (performanceScore > 80) {
          reasons.push(`Excellent performance history (${performanceScore}%)`);
        }
      }

      if (config.balanceWorkload && config.respectCapacity) {
        totalScore += availabilityScore * 0.25;
        if (availabilityScore > 70) {
          reasons.push(`Good availability (${agent.availability.currentCapacity}% capacity)`);
        } else if (availabilityScore < 30) {
          reasons.push(`Limited availability (${agent.availability.currentCapacity}% capacity)`);
        }
      }

      // Penalty for over-capacity
      if (config.respectCapacity && agent.availability.currentCapacity < 20) {
        totalScore *= 0.5;
        reasons.push('At or near capacity - reduced priority');
      }

      scores.push({
        agentId: agent.id,
        score: Math.round(totalScore),
        reasons,
        skillMatch: Math.round(skillMatch),
        availabilityScore: Math.round(availabilityScore),
        performanceScore: Math.round(performanceScore),
      });
    });

    // Sort by score descending
    return scores.sort((a, b) => b.score - a.score);
  }

  /**
   * Auto-assign a task to the best available agent
   */
  static autoAssign(
    task: Ticket | Subtask,
    agents: AgentRoster[],
    config?: AutoAssignmentConfig
  ): string | null {
    const scores = this.calculateAssignmentScores(task, agents, config);

    if (scores.length === 0) return null;

    // Return the agent with the highest score
    const bestMatch = scores[0];
    return bestMatch.score > 0 ? bestMatch.agentId : null;
  }

  /**
   * Calculate how well an agent's skills match a task
   */
  private static calculateSkillMatch(task: Ticket | Subtask, agent: AgentRoster): number {
    if (agent.skills.length === 0) return 50; // Default score if no skills defined

    const taskRequirements = this.extractRequiredSkills(task);
    if (taskRequirements.length === 0) return 50; // Default if no specific skills needed

    let matchScore = 0;
    let maxPossibleScore = 0;

    taskRequirements.forEach(required => {
      maxPossibleScore += 100;

      // Find matching skill in agent's skill set
      const agentSkill = agent.skills.find(
        s => s.category === required.category || s.name.toLowerCase().includes(required.name.toLowerCase())
      );

      if (agentSkill) {
        // Score based on skill level
        const levelScore = this.getSkillLevelScore(agentSkill.level);
        matchScore += levelScore;
      }
    });

    return maxPossibleScore > 0 ? (matchScore / maxPossibleScore) * 100 : 50;
  }

  /**
   * Get score for skill level
   */
  private static getSkillLevelScore(level: SkillLevel): number {
    switch (level) {
      case 'expert': return 100;
      case 'advanced': return 80;
      case 'intermediate': return 60;
      case 'beginner': return 40;
      default: return 50;
    }
  }

  /**
   * Extract required skills from a task description
   */
  private static extractRequiredSkills(task: Ticket | Subtask): Array<{ name: string; category: SkillCategory }> {
    const text = (task.title + ' ' + task.description).toLowerCase();
    const skills: Array<{ name: string; category: SkillCategory }> = [];

    const skillPatterns: Array<{ keywords: string[]; name: string; category: SkillCategory }> = [
      { keywords: ['react', 'frontend', 'ui', 'component'], name: 'React', category: 'frontend' },
      { keywords: ['backend', 'api', 'server'], name: 'Backend', category: 'backend' },
      { keywords: ['database', 'sql', 'schema', 'migration'], name: 'Database', category: 'database' },
      { keywords: ['devops', 'deployment', 'ci/cd', 'docker'], name: 'DevOps', category: 'devops' },
      { keywords: ['mobile', 'ios', 'android'], name: 'Mobile', category: 'mobile' },
      { keywords: ['test', 'testing', 'qa'], name: 'Testing', category: 'testing' },
      { keywords: ['design', 'ux', 'ui/ux'], name: 'Design', category: 'design' },
      { keywords: ['ai', 'ml', 'machine learning'], name: 'AI/ML', category: 'ai-ml' },
    ];

    skillPatterns.forEach(pattern => {
      if (pattern.keywords.some(kw => text.includes(kw))) {
        skills.push({ name: pattern.name, category: pattern.category });
      }
    });

    return skills;
  }

  /**
   * Calculate availability score
   */
  private static calculateAvailabilityScore(agent: AgentRoster, config: AutoAssignmentConfig): number {
    if (!agent.availability.isAvailable) return 0;

    let score = agent.availability.currentCapacity;

    // Bonus for agents with capacity for concurrent work
    if (agent.availability.currentTasks.length < agent.availability.maxConcurrentTasks) {
      score += 10;
    }

    return Math.min(score, 100);
  }

  /**
   * Calculate performance score
   */
  private static calculatePerformanceScore(agent: AgentRoster): number {
    const perf = agent.performance;

    // Weighted average of metrics
    const qualityWeight = 0.4;
    const onTimeWeight = 0.4;
    const completionWeight = 0.2;

    let score = 0;

    score += perf.qualityScore * qualityWeight;
    score += perf.onTimeDeliveryRate * onTimeWeight;

    // Bonus for agents with good completion history
    if (perf.tasksCompleted > 10) {
      score += 20 * completionWeight;
    } else if (perf.tasksCompleted > 5) {
      score += 10 * completionWeight;
    }

    return Math.min(score, 100);
  }

  /**
   * Update agent performance metrics after task completion
   */
  static updateAgentPerformance(
    agent: AgentRoster,
    taskCompleted: boolean,
    onTime: boolean,
    qualityRating: number // 0-100
  ): AgentRoster {
    const updatedPerformance = { ...agent.performance };

    if (taskCompleted) {
      updatedPerformance.tasksCompleted += 1;

      // Update on-time delivery rate (rolling average)
      const totalTasks = updatedPerformance.tasksCompleted;
      const previousOnTimeCount = Math.round(
        (updatedPerformance.onTimeDeliveryRate / 100) * (totalTasks - 1)
      );
      const newOnTimeCount = previousOnTimeCount + (onTime ? 1 : 0);
      updatedPerformance.onTimeDeliveryRate = (newOnTimeCount / totalTasks) * 100;

      // Update quality score (rolling average)
      updatedPerformance.qualityScore =
        (updatedPerformance.qualityScore * (totalTasks - 1) + qualityRating) / totalTasks;
    }

    updatedPerformance.lastUpdated = Date.now();

    return {
      ...agent,
      performance: updatedPerformance,
      updatedAt: Date.now(),
    };
  }

  /**
   * Update agent availability
   */
  static updateAgentAvailability(
    agent: AgentRoster,
    updates: Partial<{
      isAvailable: boolean;
      currentTasks: string[];
      maxConcurrentTasks: number;
    }>
  ): AgentRoster {
    const updatedAvailability = { ...agent.availability, ...updates };

    // Calculate current capacity based on current tasks
    const taskLoad = updatedAvailability.currentTasks.length;
    const maxTasks = updatedAvailability.maxConcurrentTasks;
    updatedAvailability.currentCapacity = Math.max(0, ((maxTasks - taskLoad) / maxTasks) * 100);

    return {
      ...agent,
      availability: updatedAvailability,
      updatedAt: Date.now(),
    };
  }

  /**
   * Create a default agent roster from existing agents
   */
  static createAgentRoster(agent: {
    id: string;
    name: string;
    description?: string;
    avatar?: string;
    avatarColor?: string;
  }): AgentRoster {
    // Infer skills from description
    const skills = this.inferSkillsFromDescription(agent.description || '');

    return {
      id: agent.id,
      name: agent.name,
      description: agent.description,
      avatar: agent.avatar,
      avatarColor: agent.avatarColor,
      skills,
      performance: {
        tasksCompleted: 0,
        tasksInProgress: 0,
        averageCompletionTime: 0,
        onTimeDeliveryRate: 100,
        qualityScore: 80,
        lastUpdated: Date.now(),
      },
      availability: {
        isAvailable: true,
        currentCapacity: 100,
        maxConcurrentTasks: 3,
        currentTasks: [],
      },
      createdAt: Date.now(),
      updatedAt: Date.now(),
    };
  }

  /**
   * Infer skills from agent description
   */
  private static inferSkillsFromDescription(description: string): Skill[] {
    const skills: Skill[] = [];
    const lower = description.toLowerCase();

    const skillMap: Array<{ keywords: string[]; skill: Omit<Skill, 'id'> }> = [
      {
        keywords: ['react', 'next.js', 'ui'],
        skill: { name: 'React/Next.js', category: 'frontend', level: 'advanced' },
      },
      {
        keywords: ['api', 'server', 'backend'],
        skill: { name: 'Backend Development', category: 'backend', level: 'advanced' },
      },
      {
        keywords: ['database', 'sql'],
        skill: { name: 'Database', category: 'database', level: 'advanced' },
      },
      {
        keywords: ['devops', 'infrastructure'],
        skill: { name: 'DevOps', category: 'devops', level: 'advanced' },
      },
      {
        keywords: ['mobile', 'app development'],
        skill: { name: 'Mobile Development', category: 'mobile', level: 'advanced' },
      },
      {
        keywords: ['frontend', 'backend'],
        skill: { name: 'Full Stack', category: 'frontend', level: 'intermediate' },
      },
    ];

    skillMap.forEach((mapping, idx) => {
      if (mapping.keywords.some(kw => lower.includes(kw))) {
        skills.push({
          id: `skill-${Date.now()}-${idx}`,
          ...mapping.skill,
        });
      }
    });

    // Default skill if none detected
    if (skills.length === 0) {
      skills.push({
        id: `skill-${Date.now()}-0`,
        name: 'General Development',
        category: 'frontend',
        level: 'intermediate',
      });
    }

    return skills;
  }

  /**
   * Get workload distribution across agents
   */
  static getWorkloadDistribution(agents: AgentRoster[]): Record<string, {
    agentName: string;
    currentTasks: number;
    capacity: number;
    utilizationRate: number;
  }> {
    const distribution: Record<string, any> = {};

    agents.forEach(agent => {
      const taskCount = agent.availability.currentTasks.length;
      const maxTasks = agent.availability.maxConcurrentTasks;
      const utilizationRate = maxTasks > 0 ? (taskCount / maxTasks) * 100 : 0;

      distribution[agent.id] = {
        agentName: agent.name,
        currentTasks: taskCount,
        capacity: agent.availability.currentCapacity,
        utilizationRate,
      };
    });

    return distribution;
  }
}
