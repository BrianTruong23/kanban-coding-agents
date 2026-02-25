import { EnhancedAgent, AgentAssignmentScore, AutoAssignmentConfig } from '@/types/agentRoster';
import { Ticket } from '@/types/epic';

/**
 * Service for automated agent assignment based on skills, workload, and performance
 */
export class AgentAssignmentService {
  /**
   * Automatically assigns agents to tickets based on various factors
   */
  static assignAgentsToTickets(
    tickets: Ticket[],
    agents: EnhancedAgent[],
    config: AutoAssignmentConfig = {
      considerSkills: true,
      considerWorkload: true,
      considerPerformance: true,
      preferSpecialists: true,
      balanceWorkload: true,
    }
  ): Map<string, string> {
    const assignments = new Map<string, string>();
    const agentWorkloads = new Map<string, number>();

    // Initialize workloads
    agents.forEach(agent => {
      agentWorkloads.set(agent.id, agent.performanceMetrics.workload || 0);
    });

    // Sort tickets by priority (higher priority first)
    const sortedTickets = [...tickets].sort((a, b) => b.priority - a.priority);

    for (const ticket of sortedTickets) {
      const scores = this.scoreAgentsForTicket(ticket, agents, agentWorkloads, config);

      if (scores.length > 0) {
        // Get the best match
        const bestAgent = scores[0];
        assignments.set(ticket.taskId, bestAgent.agentId);

        // Update workload for next iteration
        const currentWorkload = agentWorkloads.get(bestAgent.agentId) || 0;
        agentWorkloads.set(bestAgent.agentId, currentWorkload + (ticket.estimatedHours || 8));
      }
    }

    return assignments;
  }

  /**
   * Scores all agents for a given ticket
   */
  static scoreAgentsForTicket(
    ticket: Ticket,
    agents: EnhancedAgent[],
    currentWorkloads: Map<string, number>,
    config: AutoAssignmentConfig
  ): AgentAssignmentScore[] {
    const scores = agents
      .filter(agent => agent.availability !== 'offline')
      .map(agent => {
        const score = this.calculateAgentScore(ticket, agent, currentWorkloads.get(agent.id) || 0, config);
        return score;
      })
      .sort((a, b) => b.score - a.score);

    return scores;
  }

  /**
   * Calculates a composite score for an agent's suitability for a ticket
   */
  private static calculateAgentScore(
    ticket: Ticket,
    agent: EnhancedAgent,
    currentWorkload: number,
    config: AutoAssignmentConfig
  ): AgentAssignmentScore {
    const reasons: string[] = [];
    let totalScore = 0;
    let weightSum = 0;

    // Skill matching score
    let skillMatch = 0;
    if (config.considerSkills) {
      skillMatch = this.calculateSkillMatch(ticket, agent);
      const skillWeight = config.preferSpecialists ? 3 : 2;
      totalScore += skillMatch * skillWeight;
      weightSum += skillWeight;

      if (skillMatch > 0.7) {
        reasons.push(`High skill match (${(skillMatch * 100).toFixed(0)}%)`);
      } else if (skillMatch > 0.4) {
        reasons.push(`Moderate skill match (${(skillMatch * 100).toFixed(0)}%)`);
      }
    }

    // Workload score (inverse - lower workload is better)
    let workloadScore = 0;
    if (config.considerWorkload) {
      const maxWorkload = agent.maxConcurrentTasks * 8; // assuming 8 hours per task
      workloadScore = Math.max(0, 1 - (currentWorkload / maxWorkload));
      const workloadWeight = config.balanceWorkload ? 2 : 1;
      totalScore += workloadScore * workloadWeight;
      weightSum += workloadWeight;

      if (workloadScore > 0.7) {
        reasons.push('Low current workload');
      } else if (workloadScore < 0.3) {
        reasons.push('High current workload');
      }
    }

    // Performance score
    let performanceScore = 0;
    if (config.considerPerformance) {
      performanceScore = this.calculatePerformanceScore(agent);
      const performanceWeight = 1.5;
      totalScore += performanceScore * performanceWeight;
      weightSum += performanceWeight;

      if (performanceScore > 0.8) {
        reasons.push('Excellent performance history');
      } else if (performanceScore > 0.6) {
        reasons.push('Good performance history');
      }
    }

    // Availability bonus
    if (agent.availability === 'available') {
      totalScore += 0.5;
      weightSum += 0.5;
      reasons.push('Currently available');
    }

    // Priority matching - high priority tasks to high performers
    if (ticket.priority >= 4 && performanceScore > 0.7) {
      totalScore += 1;
      weightSum += 1;
      reasons.push('High performer for high-priority task');
    }

    // Normalize score to 0-1 range
    const finalScore = weightSum > 0 ? totalScore / weightSum : 0;

    return {
      agentId: agent.id,
      score: finalScore,
      reasons,
      skillMatch,
      workloadScore,
      performanceScore,
    };
  }

  /**
   * Calculates how well an agent's skills match a ticket's requirements
   */
  private static calculateSkillMatch(ticket: Ticket, agent: EnhancedAgent): number {
    if (agent.skills.length === 0) return 0.5; // neutral score if no skills defined

    const ticketRequirements = this.extractTicketRequirements(ticket);
    if (ticketRequirements.size === 0) return 0.5;

    let matchScore = 0;
    let matchCount = 0;

    ticketRequirements.forEach((requiredLevel, skillName) => {
      const agentSkill = agent.skills.find(s =>
        s.name.toLowerCase() === skillName.toLowerCase() ||
        s.category.toLowerCase() === skillName.toLowerCase()
      );

      if (agentSkill) {
        // Calculate match based on proficiency level
        const proficiencyMatch = agentSkill.proficiencyLevel / 5;
        const levelMatch = agentSkill.proficiencyLevel >= requiredLevel ? 1 : 0.5;
        matchScore += proficiencyMatch * levelMatch;
        matchCount++;
      }
    });

    // Check specializations
    agent.specializations.forEach(spec => {
      const specLower = spec.toLowerCase();
      if (ticket.description.toLowerCase().includes(specLower) ||
          ticket.title.toLowerCase().includes(specLower)) {
        matchScore += 0.3;
        matchCount++;
      }
    });

    return matchCount > 0 ? Math.min(matchScore / matchCount, 1) : 0.3;
  }

  /**
   * Extracts skill requirements from ticket content
   */
  private static extractTicketRequirements(ticket: Ticket): Map<string, number> {
    const requirements = new Map<string, number>();
    const content = `${ticket.title} ${ticket.description}`.toLowerCase();

    // Define skill keywords and their categories
    const skillMap: Record<string, { category: string; level: number }> = {
      'react': { category: 'frontend', level: 3 },
      'vue': { category: 'frontend', level: 3 },
      'angular': { category: 'frontend', level: 3 },
      'nextjs': { category: 'frontend', level: 3 },
      'typescript': { category: 'frontend', level: 3 },
      'javascript': { category: 'frontend', level: 2 },
      'css': { category: 'frontend', level: 2 },
      'html': { category: 'frontend', level: 2 },
      'ui': { category: 'frontend', level: 2 },
      'component': { category: 'frontend', level: 2 },

      'api': { category: 'backend', level: 3 },
      'backend': { category: 'backend', level: 3 },
      'server': { category: 'backend', level: 3 },
      'node': { category: 'backend', level: 3 },
      'express': { category: 'backend', level: 3 },
      'rest': { category: 'backend', level: 3 },
      'graphql': { category: 'backend', level: 4 },

      'database': { category: 'database', level: 3 },
      'sql': { category: 'database', level: 3 },
      'postgres': { category: 'database', level: 3 },
      'mongodb': { category: 'database', level: 3 },
      'redis': { category: 'database', level: 3 },

      'docker': { category: 'devops', level: 3 },
      'kubernetes': { category: 'devops', level: 4 },
      'ci/cd': { category: 'devops', level: 3 },
      'deploy': { category: 'devops', level: 2 },
      'infrastructure': { category: 'devops', level: 3 },

      'mobile': { category: 'mobile', level: 3 },
      'ios': { category: 'mobile', level: 4 },
      'android': { category: 'mobile', level: 4 },
      'react native': { category: 'mobile', level: 3 },

      'test': { category: 'testing', level: 2 },
      'jest': { category: 'testing', level: 3 },
      'cypress': { category: 'testing', level: 3 },

      'security': { category: 'security', level: 4 },
      'authentication': { category: 'security', level: 3 },
      'authorization': { category: 'security', level: 3 },
    };

    // Check for each skill keyword
    Object.entries(skillMap).forEach(([keyword, { category, level }]) => {
      if (content.includes(keyword)) {
        const currentLevel = requirements.get(category) || 0;
        requirements.set(category, Math.max(currentLevel, level));
      }
    });

    // Check tags
    ticket.tags.forEach(tag => {
      const tagLower = tag.toLowerCase();
      const match = skillMap[tagLower];
      if (match) {
        const currentLevel = requirements.get(match.category) || 0;
        requirements.set(match.category, Math.max(currentLevel, match.level));
      }
    });

    return requirements;
  }

  /**
   * Calculates an agent's performance score
   */
  private static calculatePerformanceScore(agent: EnhancedAgent): number {
    const metrics = agent.performanceMetrics;

    if (metrics.tasksCompleted === 0) return 0.5; // neutral for new agents

    // Weighted combination of metrics
    const successWeight = 0.4;
    const qualityWeight = 0.35;
    const speedWeight = 0.25;

    const successScore = metrics.successRate;
    const qualityScore = metrics.qualityScore / 5;

    // Speed score: prefer agents who complete tasks efficiently
    // Normalize completion time (assuming 8 hours is baseline)
    const speedScore = Math.max(0, Math.min(1, 1 - ((metrics.averageCompletionTime - 8) / 16)));

    const performanceScore =
      (successScore * successWeight) +
      (qualityScore * qualityWeight) +
      (speedScore * speedWeight);

    return Math.max(0, Math.min(1, performanceScore));
  }

  /**
   * Suggests the best agent for a single ticket
   */
  static suggestAgentForTicket(
    ticket: Ticket,
    agents: EnhancedAgent[],
    config?: AutoAssignmentConfig
  ): AgentAssignmentScore | null {
    const workloads = new Map<string, number>();
    agents.forEach(agent => {
      workloads.set(agent.id, agent.performanceMetrics.workload || 0);
    });

    const scores = this.scoreAgentsForTicket(
      ticket,
      agents,
      workloads,
      config || {
        considerSkills: true,
        considerWorkload: true,
        considerPerformance: true,
        preferSpecialists: true,
        balanceWorkload: true,
      }
    );

    return scores.length > 0 ? scores[0] : null;
  }

  /**
   * Gets top N agent recommendations for a ticket
   */
  static getTopAgentRecommendations(
    ticket: Ticket,
    agents: EnhancedAgent[],
    topN: number = 3,
    config?: AutoAssignmentConfig
  ): AgentAssignmentScore[] {
    const workloads = new Map<string, number>();
    agents.forEach(agent => {
      workloads.set(agent.id, agent.performanceMetrics.workload || 0);
    });

    const scores = this.scoreAgentsForTicket(
      ticket,
      agents,
      workloads,
      config || {
        considerSkills: true,
        considerWorkload: true,
        considerPerformance: true,
        preferSpecialists: true,
        balanceWorkload: true,
      }
    );

    return scores.slice(0, topN);
  }
}
