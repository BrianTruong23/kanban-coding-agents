import { CodingAgent, AgentSkill, AgentPerformanceMetrics } from '@/types/agent';
import { Task } from '@/types/task';

/**
 * Service for managing agent roster and auto-assignment based on
 * skills, availability, and performance metrics.
 */
export class AgentOrchestrationService {
  /**
   * Calculate a score for how well an agent matches a task
   */
  private calculateAgentTaskScore(agent: CodingAgent, task: Task): number {
    let score = 0;

    // Check if agent is active
    if (!agent.isActive) {
      return 0;
    }

    // Check workload (agents near max capacity get lower scores)
    const workloadScore = agent.performance
      ? Math.max(0, 1 - (agent.performance.currentWorkload / agent.maxConcurrentTasks))
      : 1;
    score += workloadScore * 30; // 30 points max for availability

    // Match skills with task tags
    const taskTags = task.tags.map(tag => tag.toLowerCase());
    const agentSkills = agent.skills.map(skill => skill.toLowerCase());

    const skillMatches = agentSkills.filter(skill => {
      return taskTags.some(tag => tag.includes(skill) || skill.includes(tag));
    }).length;

    score += skillMatches * 20; // 20 points per skill match

    // Performance metrics
    if (agent.performance) {
      score += (agent.performance.successRate / 100) * 25; // 25 points max for success rate

      // Prefer agents with reasonable completion times (not too fast, not too slow)
      const avgTime = agent.performance.averageCompletionTime;
      if (avgTime > 0 && avgTime < 100) {
        score += 15; // Bonus for experienced agents
      }

      // Check skill ratings for relevant skills
      if (agent.performance.skillRatings) {
        let relevantSkillRating = 0;
        let relevantSkillCount = 0;

        agentSkills.forEach(skill => {
          const rating = agent.performance!.skillRatings.get(skill as AgentSkill);
          if (rating && rating > 0) {
            relevantSkillRating += rating;
            relevantSkillCount++;
          }
        });

        if (relevantSkillCount > 0) {
          score += (relevantSkillRating / relevantSkillCount) * 2; // Up to 10 points for skill rating
        }
      }
    }

    // Priority bonus - higher priority tasks should go to better performers
    if (task.priority >= 4 && agent.performance) {
      score += (agent.performance.successRate / 100) * 10; // Extra weight for high priority
    }

    return score;
  }

  /**
   * Auto-assign tasks to agents based on skills and availability
   */
  async autoAssignTask(task: Task, agents: CodingAgent[]): Promise<CodingAgent | null> {
    if (agents.length === 0) {
      return null;
    }

    // Score all agents for this task
    const agentScores = agents.map(agent => ({
      agent,
      score: this.calculateAgentTaskScore(agent, task),
    }));

    // Sort by score descending
    agentScores.sort((a, b) => b.score - a.score);

    // Return the best match (if score > 0)
    if (agentScores[0].score > 0) {
      return agentScores[0].agent;
    }

    return null;
  }

  /**
   * Auto-assign multiple tasks to agents, optimizing for team capacity
   */
  async autoAssignTasks(tasks: Task[], agents: CodingAgent[]): Promise<Map<string, string>> {
    const assignments = new Map<string, string>(); // taskId -> agentId

    // Create a working copy of agents with current workload
    const agentWorkloads = new Map<string, number>();
    agents.forEach(agent => {
      agentWorkloads.set(
        agent.id,
        agent.performance?.currentWorkload || 0
      );
    });

    // Sort tasks by priority (highest first)
    const sortedTasks = [...tasks].sort((a, b) => b.priority - a.priority);

    for (const task of sortedTasks) {
      // Filter available agents
      const availableAgents = agents.filter(agent => {
        const currentWorkload = agentWorkloads.get(agent.id) || 0;
        return agent.isActive && currentWorkload < agent.maxConcurrentTasks;
      });

      if (availableAgents.length === 0) {
        continue; // Skip this task, no available agents
      }

      // Find best agent
      const bestAgent = await this.autoAssignTask(task, availableAgents);

      if (bestAgent) {
        assignments.set(task.id, bestAgent.id);
        // Update workload
        const currentWorkload = agentWorkloads.get(bestAgent.id) || 0;
        agentWorkloads.set(bestAgent.id, currentWorkload + 1);
      }
    }

    return assignments;
  }

  /**
   * Recommend agents for a specific task with explanations
   */
  async recommendAgents(
    task: Task,
    agents: CodingAgent[],
    limit: number = 3
  ): Promise<Array<{ agent: CodingAgent; score: number; reasons: string[] }>> {
    const recommendations = agents.map(agent => {
      const score = this.calculateAgentTaskScore(agent, task);
      const reasons = this.generateRecommendationReasons(agent, task, score);

      return { agent, score, reasons };
    });

    // Sort by score and return top N
    recommendations.sort((a, b) => b.score - a.score);
    return recommendations.slice(0, limit).filter(r => r.score > 0);
  }

  /**
   * Generate human-readable reasons for a recommendation
   */
  private generateRecommendationReasons(agent: CodingAgent, task: Task, score: number): string[] {
    const reasons: string[] = [];

    if (score === 0) {
      if (!agent.isActive) {
        reasons.push('Agent is currently inactive');
      } else if (agent.performance && agent.performance.currentWorkload >= agent.maxConcurrentTasks) {
        reasons.push('Agent is at maximum capacity');
      } else {
        reasons.push('No skill match for this task');
      }
      return reasons;
    }

    // Check skill matches
    const taskTags = task.tags.map(tag => tag.toLowerCase());
    const matchingSkills = agent.skills.filter(skill => {
      return taskTags.some(tag => tag.includes(skill) || skill.includes(tag));
    });

    if (matchingSkills.length > 0) {
      reasons.push(`Has relevant skills: ${matchingSkills.join(', ')}`);
    }

    // Performance-based reasons
    if (agent.performance) {
      if (agent.performance.successRate >= 80) {
        reasons.push(`High success rate: ${agent.performance.successRate.toFixed(0)}%`);
      }

      if (agent.performance.currentWorkload < agent.maxConcurrentTasks) {
        const available = agent.maxConcurrentTasks - agent.performance.currentWorkload;
        reasons.push(`Available capacity: ${available} task${available !== 1 ? 's' : ''}`);
      }

      if (agent.performance.tasksCompleted > 10) {
        reasons.push(`Experienced: ${agent.performance.tasksCompleted} tasks completed`);
      }
    }

    // Priority matching
    if (task.priority >= 4 && agent.performance && agent.performance.successRate >= 75) {
      reasons.push('Good match for high-priority task');
    }

    if (reasons.length === 0) {
      reasons.push('General availability');
    }

    return reasons;
  }

  /**
   * Update agent performance metrics based on task completion
   */
  async updateAgentPerformance(
    agent: CodingAgent,
    taskCompleted: boolean,
    completionTimeHours: number
  ): Promise<AgentPerformanceMetrics> {
    const current = agent.performance || {
      tasksCompleted: 0,
      averageCompletionTime: 0,
      successRate: 100,
      currentWorkload: 0,
      skillRatings: new Map(),
    };

    // Update tasks completed
    const newTasksCompleted = taskCompleted
      ? current.tasksCompleted + 1
      : current.tasksCompleted;

    // Update success rate
    const totalAttempts = current.tasksCompleted + 1;
    const successfulTasks = taskCompleted
      ? current.tasksCompleted * (current.successRate / 100) + 1
      : current.tasksCompleted * (current.successRate / 100);
    const newSuccessRate = (successfulTasks / totalAttempts) * 100;

    // Update average completion time
    const newAvgTime =
      (current.averageCompletionTime * current.tasksCompleted + completionTimeHours) /
      (current.tasksCompleted + 1);

    return {
      tasksCompleted: newTasksCompleted,
      averageCompletionTime: newAvgTime,
      successRate: newSuccessRate,
      currentWorkload: current.currentWorkload,
      skillRatings: current.skillRatings,
    };
  }

  /**
   * Balance workload across team
   */
  async balanceWorkload(
    tasks: Task[],
    agents: CodingAgent[]
  ): Promise<{
    balanced: boolean;
    recommendations: string[];
    agentUtilization: Map<string, number>;
  }> {
    const agentUtilization = new Map<string, number>();
    const recommendations: string[] = [];

    // Calculate current utilization
    agents.forEach(agent => {
      const workload = agent.performance?.currentWorkload || 0;
      const utilization = (workload / agent.maxConcurrentTasks) * 100;
      agentUtilization.set(agent.id, utilization);
    });

    const utilizationValues = Array.from(agentUtilization.values());
    const avgUtilization =
      utilizationValues.reduce((sum, val) => sum + val, 0) / utilizationValues.length;

    // Check if workload is balanced (standard deviation)
    const variance =
      utilizationValues.reduce((sum, val) => sum + Math.pow(val - avgUtilization, 2), 0) /
      utilizationValues.length;
    const stdDev = Math.sqrt(variance);

    const balanced = stdDev < 20; // Less than 20% standard deviation is considered balanced

    // Generate recommendations
    if (!balanced) {
      const overloadedAgents = agents.filter(agent => {
        const util = agentUtilization.get(agent.id) || 0;
        return util > 80;
      });

      const underutilizedAgents = agents.filter(agent => {
        const util = agentUtilization.get(agent.id) || 0;
        return util < 30 && agent.isActive;
      });

      if (overloadedAgents.length > 0) {
        recommendations.push(
          `${overloadedAgents.length} agent(s) are overloaded (>80% capacity). Consider reassigning tasks.`
        );
      }

      if (underutilizedAgents.length > 0) {
        recommendations.push(
          `${underutilizedAgents.length} agent(s) are underutilized (<30% capacity). Assign them more tasks.`
        );
      }

      if (stdDev > 30) {
        recommendations.push('Workload is significantly imbalanced. Run auto-assignment to optimize.');
      }
    } else {
      recommendations.push('Workload is well-balanced across the team.');
    }

    return {
      balanced,
      recommendations,
      agentUtilization,
    };
  }

  /**
   * Suggest creating a new agent based on team needs
   */
  async suggestNewAgent(
    tasks: Task[],
    agents: CodingAgent[]
  ): Promise<{ suggested: boolean; skillsNeeded: AgentSkill[]; reason: string } | null> {
    // Analyze unassigned or pending tasks
    const backlogTasks = tasks.filter(task => task.status === 'backlog');

    if (backlogTasks.length === 0) {
      return null;
    }

    // Identify skills in demand
    const skillDemand = new Map<string, number>();

    backlogTasks.forEach(task => {
      task.tags.forEach(tag => {
        const count = skillDemand.get(tag) || 0;
        skillDemand.set(tag, count + 1);
      });
    });

    // Check if existing agents can handle the demand
    const activeAgents = agents.filter(a => a.isActive);
    const totalCapacity = activeAgents.reduce((sum, a) => sum + a.maxConcurrentTasks, 0);
    const totalWorkload = activeAgents.reduce(
      (sum, a) => sum + (a.performance?.currentWorkload || 0),
      0
    );

    const availableCapacity = totalCapacity - totalWorkload;

    if (backlogTasks.length > availableCapacity * 1.5) {
      // Team is overloaded
      const topSkills = Array.from(skillDemand.entries())
        .sort((a, b) => b[1] - a[1])
        .slice(0, 3)
        .map(([skill]) => skill as AgentSkill);

      return {
        suggested: true,
        skillsNeeded: topSkills,
        reason: `Team capacity is insufficient. ${backlogTasks.length} tasks in backlog, but only ${Math.floor(availableCapacity)} slots available.`,
      };
    }

    return null;
  }
}

// Export singleton instance
export const agentOrchestrationService = new AgentOrchestrationService();
