import { CodingAgent, AgentSkill } from '@/types/agent';
import { Task } from '@/types/task';
import { TaskBreakdown } from '@/types/breakdown';

interface AssignmentScore {
  agentId: string;
  score: number;
  reasons: string[];
}

/**
 * Agent Orchestration Service
 * Handles intelligent agent assignment based on skills, performance, and availability
 */
export class AgentOrchestrationService {
  /**
   * Auto-assign tasks to agents based on skills and performance
   */
  assignTasksToAgents(
    tasks: Task[],
    breakdowns: Map<string, TaskBreakdown>,
    agents: CodingAgent[]
  ): Map<string, string> {
    const assignments = new Map<string, string>();

    // Filter available agents (not overloaded)
    const availableAgents = agents.filter(agent => {
      const currentTasks = tasks.filter(t => t.assignedAgentId === agent.id && t.status !== 'done');
      return currentTasks.length < agent.maxConcurrentTasks;
    });

    // Sort tasks by priority (highest first)
    const sortedTasks = [...tasks].sort((a, b) => b.priority - a.priority);

    for (const task of sortedTasks) {
      if (task.assignedAgentId) continue; // Skip already assigned tasks

      const bestAgent = this.findBestAgent(task, breakdowns.get(task.id), availableAgents);
      if (bestAgent) {
        assignments.set(task.id, bestAgent.id);
      }
    }

    return assignments;
  }

  /**
   * Find the best agent for a specific task
   */
  findBestAgent(
    task: Task,
    breakdown: TaskBreakdown | undefined,
    agents: CodingAgent[]
  ): CodingAgent | null {
    if (agents.length === 0) return null;

    const scores = agents.map(agent => this.scoreAgent(agent, task, breakdown));

    // Sort by score (highest first)
    scores.sort((a, b) => b.score - a.score);

    // Return the best agent if score is above threshold
    return scores[0].score > 0 ? agents.find(a => a.id === scores[0].agentId) || null : null;
  }

  /**
   * Score an agent for a task based on multiple factors
   */
  private scoreAgent(agent: CodingAgent, task: Task, breakdown: TaskBreakdown | undefined): AssignmentScore {
    let score = 0;
    const reasons: string[] = [];

    // 1. Skill matching (40% of total score)
    const skillScore = this.calculateSkillScore(agent, task);
    score += skillScore * 0.4;
    if (skillScore > 0) {
      reasons.push(`Skill match: ${Math.round(skillScore)}%`);
    }

    // 2. Performance metrics (30% of total score)
    const performanceScore = this.calculatePerformanceScore(agent);
    score += performanceScore * 0.3;
    if (performanceScore > 70) {
      reasons.push(`High performance: ${Math.round(performanceScore)}%`);
    }

    // 3. Availability (20% of total score)
    const availabilityScore = agent.performance.availability;
    score += availabilityScore * 0.2;
    if (availabilityScore >= 80) {
      reasons.push(`Available: ${availabilityScore}%`);
    }

    // 4. Current workload (10% of total score)
    const workloadScore = this.calculateWorkloadScore(agent);
    score += workloadScore * 0.1;
    if (workloadScore > 50) {
      reasons.push('Light workload');
    }

    return {
      agentId: agent.id,
      score,
      reasons,
    };
  }

  /**
   * Calculate skill match score (0-100)
   */
  private calculateSkillScore(agent: CodingAgent, task: Task): number {
    // Map task tags to skills
    const requiredSkills = this.extractRequiredSkills(task);

    if (requiredSkills.length === 0) {
      // No specific skills required, return base score
      return 50;
    }

    let totalScore = 0;
    let matchedSkills = 0;

    requiredSkills.forEach(skill => {
      if (agent.skills.includes(skill)) {
        matchedSkills++;
        // Weight by proficiency level (1-5 -> 20-100)
        const proficiency = agent.skillLevels[skill] || 0;
        totalScore += proficiency * 20;
      }
    });

    // Average score, bonus for matching multiple skills
    const avgScore = matchedSkills > 0 ? totalScore / matchedSkills : 0;
    const coverageBonus = (matchedSkills / requiredSkills.length) * 20;

    return Math.min(100, avgScore + coverageBonus);
  }

  /**
   * Extract required skills from task
   */
  private extractRequiredSkills(task: Task): AgentSkill[] {
    const skills: AgentSkill[] = [];
    const tags = task.tags.map(t => t.toLowerCase());
    const title = task.title.toLowerCase();
    const description = task.description.toLowerCase();

    // Map keywords to skills
    const skillMap: Record<string, AgentSkill> = {
      'react': 'react',
      'next.js': 'nextjs',
      'nextjs': 'nextjs',
      'typescript': 'typescript',
      'ts': 'typescript',
      'node': 'nodejs',
      'nodejs': 'nodejs',
      'database': 'database',
      'db': 'database',
      'sql': 'database',
      'api': 'api',
      'rest': 'api',
      'graphql': 'api',
      'ui': 'ui-ux',
      'ux': 'ui-ux',
      'design': 'ui-ux',
      'test': 'testing',
      'testing': 'testing',
      'jest': 'testing',
      'devops': 'devops',
      'ci/cd': 'devops',
      'docker': 'devops',
      'mobile': 'mobile',
      'ios': 'mobile',
      'android': 'mobile',
      'backend': 'backend',
      'server': 'backend',
      'frontend': 'frontend',
      'fullstack': 'fullstack',
    };

    // Check tags
    tags.forEach(tag => {
      if (skillMap[tag]) {
        skills.push(skillMap[tag]);
      }
    });

    // Check title and description
    Object.entries(skillMap).forEach(([keyword, skill]) => {
      if (title.includes(keyword) || description.includes(keyword)) {
        if (!skills.includes(skill)) {
          skills.push(skill);
        }
      }
    });

    return [...new Set(skills)]; // Remove duplicates
  }

  /**
   * Calculate performance score (0-100)
   */
  private calculatePerformanceScore(agent: CodingAgent): number {
    const { successRate, tasksCompleted } = agent.performance;

    // Success rate is the main factor
    let score = successRate;

    // Bonus for experience (more completed tasks)
    if (tasksCompleted > 50) {
      score += 10;
    } else if (tasksCompleted > 20) {
      score += 5;
    }

    return Math.min(100, score);
  }

  /**
   * Calculate workload score - higher is better (less loaded)
   */
  private calculateWorkloadScore(agent: CodingAgent): number {
    const { tasksInProgress, maxConcurrentTasks } = agent.performance;

    // Calculate available capacity
    const availableSlots = maxConcurrentTasks - tasksInProgress;
    const capacityRatio = availableSlots / maxConcurrentTasks;

    return capacityRatio * 100;
  }

  /**
   * Rebalance workload across agents
   */
  rebalanceWorkload(tasks: Task[], agents: CodingAgent[]): Map<string, string> {
    const reassignments = new Map<string, string>();

    // Find overloaded agents
    const overloadedAgents = agents.filter(agent => {
      const currentTasks = tasks.filter(t => t.assignedAgentId === agent.id && t.status !== 'done');
      return currentTasks.length > agent.maxConcurrentTasks;
    });

    // Find underutilized agents
    const underutilizedAgents = agents.filter(agent => {
      const currentTasks = tasks.filter(t => t.assignedAgentId === agent.id && t.status !== 'done');
      return currentTasks.length < agent.maxConcurrentTasks * 0.5;
    });

    // Move tasks from overloaded to underutilized agents
    overloadedAgents.forEach(overloadedAgent => {
      const agentTasks = tasks.filter(
        t => t.assignedAgentId === overloadedAgent.id && t.status === 'backlog'
      );

      // Sort by priority (lowest first for reassignment)
      agentTasks.sort((a, b) => a.priority - b.priority);

      for (const task of agentTasks) {
        const bestAgent = this.findBestAgent(task, undefined, underutilizedAgents);
        if (bestAgent && bestAgent.id !== overloadedAgent.id) {
          reassignments.set(task.id, bestAgent.id);
        }
      }
    });

    return reassignments;
  }

  /**
   * Get agent recommendations for a task
   */
  getAgentRecommendations(
    task: Task,
    breakdown: TaskBreakdown | undefined,
    agents: CodingAgent[],
    limit: number = 3
  ): Array<{ agent: CodingAgent; score: number; reasons: string[] }> {
    const scores = agents.map(agent => ({
      agent,
      ...this.scoreAgent(agent, task, breakdown),
    }));

    // Sort by score (highest first)
    scores.sort((a, b) => b.score - a.score);

    return scores.slice(0, limit);
  }

  /**
   * Update agent performance metrics after task completion
   */
  updateAgentPerformance(
    agent: CodingAgent,
    task: Task,
    success: boolean,
    hoursSpent: number
  ): Partial<CodingAgent> {
    const { performance } = agent;

    // Update task counts
    const tasksCompleted = performance.tasksCompleted + (success ? 1 : 0);
    const tasksInProgress = Math.max(0, performance.tasksInProgress - 1);

    // Update success rate
    const totalTasks = tasksCompleted + (success ? 0 : 1);
    const successRate = totalTasks > 0 ? (tasksCompleted / totalTasks) * 100 : 100;

    // Update average completion time
    const totalHours = performance.totalHoursLogged + hoursSpent;
    const averageCompletionTime = tasksCompleted > 0 ? totalHours / tasksCompleted : 0;

    return {
      performance: {
        ...performance,
        tasksCompleted,
        tasksInProgress,
        successRate,
        averageCompletionTime,
        totalHoursLogged: totalHours,
        lastActive: Date.now(),
      },
    };
  }
}

export const agentOrchestrationService = new AgentOrchestrationService();
