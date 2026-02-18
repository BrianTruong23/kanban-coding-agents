import { CodingAgent, AgentMatchScore, SkillLevel } from '@/types/agent';
import { Task } from '@/types/task';

/**
 * Agent Orchestration Service
 * Handles auto-assignment of tasks to agents based on skills, performance, and availability
 */
export class AgentOrchestrationService {
  /**
   * Find the best agent(s) for a task based on multiple factors
   */
  public findBestAgentsForTask(
    task: Task,
    agents: CodingAgent[],
    topN: number = 3
  ): AgentMatchScore[] {
    const scores: AgentMatchScore[] = [];

    for (const agent of agents) {
      const score = this.calculateAgentScore(task, agent);
      scores.push(score);
    }

    // Sort by score descending
    scores.sort((a, b) => b.score - a.score);

    return scores.slice(0, topN);
  }

  /**
   * Calculate a match score for an agent-task pair
   */
  private calculateAgentScore(task: Task, agent: CodingAgent): AgentMatchScore {
    const reasons: string[] = [];
    const skillMatches: string[] = [];

    // Calculate skill match score (0-40 points)
    const skillScore = this.calculateSkillScore(task, agent, skillMatches);

    // Calculate availability score (0-30 points)
    const availabilityScore = this.calculateAvailabilityScore(agent, reasons);

    // Calculate performance score (0-30 points)
    const performanceScore = this.calculatePerformanceScore(agent, reasons);

    // Total score
    const totalScore = skillScore + availabilityScore + performanceScore;

    // Add skill match reasons
    if (skillMatches.length > 0) {
      reasons.push(`Skills match: ${skillMatches.join(', ')}`);
    }

    return {
      agentId: agent.id,
      score: Math.round(totalScore),
      reasons,
      skillMatches,
      availabilityScore,
      performanceScore,
    };
  }

  /**
   * Calculate skill match score based on task tags and requirements
   */
  private calculateSkillScore(
    task: Task,
    agent: CodingAgent,
    skillMatches: string[]
  ): number {
    let score = 0;

    // Match task tags with agent skills
    for (const tag of task.tags) {
      const matchingSkill = agent.skills.find(
        skill => skill.name.toLowerCase() === tag.toLowerCase() ||
                skill.category.toLowerCase() === tag.toLowerCase()
      );

      if (matchingSkill) {
        skillMatches.push(matchingSkill.name);

        // Score based on skill level
        const levelScore = this.getSkillLevelScore(matchingSkill.level);
        score += levelScore;
      }
    }

    // Bonus for task type preference
    if (agent.preferredTaskTypes?.includes(task.type)) {
      score += 5;
      skillMatches.push(`Prefers ${task.type}s`);
    }

    // Cap at 40 points
    return Math.min(score, 40);
  }

  /**
   * Calculate availability score
   */
  private calculateAvailabilityScore(agent: CodingAgent, reasons: string[]): number {
    let score = 0;

    if (!agent.availability.isAvailable) {
      reasons.push('Currently unavailable');
      return 0;
    }

    // Score based on current load (inverse relationship)
    const loadFactor = 100 - agent.availability.currentLoad;
    score = (loadFactor / 100) * 30;

    if (agent.availability.currentLoad < 30) {
      reasons.push('Low workload');
    } else if (agent.availability.currentLoad > 80) {
      reasons.push('High workload');
    }

    return score;
  }

  /**
   * Calculate performance score
   */
  private calculatePerformanceScore(agent: CodingAgent, reasons: string[]): number {
    const metrics = agent.performanceMetrics;
    let score = 0;

    // Success rate (0-15 points)
    score += (metrics.successRate / 100) * 15;

    // Recent activity bonus (0-10 points)
    if (metrics.lastActive) {
      const hoursSinceActive = (Date.now() - metrics.lastActive) / (1000 * 60 * 60);
      if (hoursSinceActive < 24) {
        score += 10;
        reasons.push('Recently active');
      } else if (hoursSinceActive < 168) { // 1 week
        score += 5;
      }
    }

    // Completion rate bonus (0-5 points)
    if (metrics.tasksCompleted > 10) {
      score += 5;
      reasons.push(`${metrics.tasksCompleted} tasks completed`);
    } else if (metrics.tasksCompleted > 5) {
      score += 3;
    }

    return score;
  }

  /**
   * Get numeric score for skill level
   */
  private getSkillLevelScore(level: SkillLevel): number {
    const scores: Record<SkillLevel, number> = {
      'beginner': 2,
      'intermediate': 4,
      'advanced': 6,
      'expert': 10,
    };
    return scores[level];
  }

  /**
   * Auto-assign tasks to agents based on availability and skills
   */
  public autoAssignTasks(tasks: Task[], agents: CodingAgent[]): Map<string, string> {
    const assignments = new Map<string, string>(); // taskId -> agentId

    // Filter unassigned tasks
    const unassignedTasks = tasks.filter(t => !t.assignedAgentId);

    // Sort tasks by priority (highest first)
    unassignedTasks.sort((a, b) => b.priority - a.priority);

    // Track agent loads during this assignment session
    const agentLoads = new Map<string, number>();
    agents.forEach(agent => {
      agentLoads.set(agent.id, agent.availability.currentLoad);
    });

    for (const task of unassignedTasks) {
      // Find best available agent
      const matches = this.findBestAgentsForTask(task, agents, 1);

      if (matches.length > 0 && matches[0].score > 30) { // Minimum threshold
        const bestMatch = matches[0];
        const agent = agents.find(a => a.id === bestMatch.agentId);

        if (agent && agentLoads.get(agent.id)! < 90) { // Don't overload
          assignments.set(task.id, agent.id);

          // Update load tracker
          const currentLoad = agentLoads.get(agent.id)!;
          agentLoads.set(agent.id, currentLoad + 10); // Assume each task is 10% load
        }
      }
    }

    return assignments;
  }

  /**
   * Suggest task reassignment based on agent performance and availability
   */
  public suggestReassignments(
    tasks: Task[],
    agents: CodingAgent[]
  ): Array<{ taskId: string; currentAgentId: string; suggestedAgentId: string; reason: string }> {
    const suggestions: Array<{
      taskId: string;
      currentAgentId: string;
      suggestedAgentId: string;
      reason: string;
    }> = [];

    // Find tasks assigned to overloaded or underperforming agents
    for (const task of tasks) {
      if (!task.assignedAgentId) continue;

      const currentAgent = agents.find(a => a.id === task.assignedAgentId);
      if (!currentAgent) continue;

      // Check if agent is overloaded
      if (currentAgent.availability.currentLoad > 90) {
        const alternativeMatches = this.findBestAgentsForTask(
          task,
          agents.filter(a => a.id !== currentAgent.id && a.availability.currentLoad < 70),
          1
        );

        if (alternativeMatches.length > 0 && alternativeMatches[0].score > 40) {
          suggestions.push({
            taskId: task.id,
            currentAgentId: currentAgent.id,
            suggestedAgentId: alternativeMatches[0].agentId,
            reason: 'Current agent overloaded, better match available',
          });
        }
      }

      // Check if there's a significantly better match
      const allMatches = this.findBestAgentsForTask(task, agents, 2);
      const currentAgentScore = allMatches.find(m => m.agentId === currentAgent.id);
      const bestMatch = allMatches[0];

      if (bestMatch.agentId !== currentAgent.id &&
          (!currentAgentScore || bestMatch.score > currentAgentScore.score + 20)) {
        suggestions.push({
          taskId: task.id,
          currentAgentId: currentAgent.id,
          suggestedAgentId: bestMatch.agentId,
          reason: `Better skill match available (score: ${bestMatch.score} vs ${currentAgentScore?.score || 0})`,
        });
      }
    }

    return suggestions;
  }

  /**
   * Update agent performance metrics after task completion
   */
  public updateAgentMetrics(
    agent: CodingAgent,
    task: Task,
    success: boolean,
    completionTimeHours?: number
  ): CodingAgent {
    const metrics = { ...agent.performanceMetrics };

    // Update task counts
    if (success) {
      metrics.tasksCompleted += 1;
    }

    // Update average completion time
    if (completionTimeHours) {
      if (metrics.averageCompletionTime) {
        metrics.averageCompletionTime =
          (metrics.averageCompletionTime * metrics.tasksCompleted + completionTimeHours) /
          (metrics.tasksCompleted + 1);
      } else {
        metrics.averageCompletionTime = completionTimeHours;
      }
    }

    // Update success rate
    const totalTasks = metrics.tasksCompleted + 1;
    const successfulTasks = success ? metrics.tasksCompleted + 1 : metrics.tasksCompleted;
    metrics.successRate = (successfulTasks / totalTasks) * 100;

    // Update last active
    metrics.lastActive = Date.now();

    // Track specializations (tasks they excel at)
    if (success && task.tags.length > 0) {
      const specializations = new Set(metrics.specializations || []);
      task.tags.forEach(tag => specializations.add(tag));
      metrics.specializations = Array.from(specializations);
    }

    return {
      ...agent,
      performanceMetrics: metrics,
    };
  }
}

/**
 * Initialize default agents with skills and metrics
 */
export function createDefaultAgentsWithSkills(): Omit<CodingAgent, 'id' | 'createdAt'>[] {
  return [
    {
      name: 'Alex Chen',
      description: 'Specializes in React, Next.js, and UI development',
      avatarColor: 'bg-blue-500',
      skills: [
        { name: 'React', level: 'expert', category: 'frontend' },
        { name: 'Next.js', level: 'expert', category: 'frontend' },
        { name: 'TypeScript', level: 'advanced', category: 'frontend' },
        { name: 'UI/UX', level: 'advanced', category: 'design' },
        { name: 'CSS', level: 'expert', category: 'frontend' },
      ],
      performanceMetrics: {
        tasksCompleted: 45,
        tasksInProgress: 2,
        averageCompletionTime: 6.5,
        successRate: 92,
        lastActive: Date.now() - 3600000, // 1 hour ago
        specializations: ['frontend', 'ui', 'react'],
      },
      availability: {
        isAvailable: true,
        currentLoad: 35,
        maxCapacity: 5,
      },
      preferredTaskTypes: ['task', 'story'],
    },
    {
      name: 'Sarah Johnson',
      description: 'Handles API, database, and server-side logic',
      avatarColor: 'bg-green-500',
      skills: [
        { name: 'Node.js', level: 'expert', category: 'backend' },
        { name: 'PostgreSQL', level: 'advanced', category: 'backend' },
        { name: 'API Design', level: 'expert', category: 'backend' },
        { name: 'GraphQL', level: 'intermediate', category: 'backend' },
        { name: 'Database Design', level: 'advanced', category: 'backend' },
      ],
      performanceMetrics: {
        tasksCompleted: 38,
        tasksInProgress: 1,
        averageCompletionTime: 8.2,
        successRate: 95,
        lastActive: Date.now() - 7200000, // 2 hours ago
        specializations: ['backend', 'api', 'database'],
      },
      availability: {
        isAvailable: true,
        currentLoad: 20,
        maxCapacity: 4,
      },
      preferredTaskTypes: ['task', 'story'],
    },
    {
      name: 'Mike Rodriguez',
      description: 'Works on both frontend and backend tasks',
      avatarColor: 'bg-purple-500',
      skills: [
        { name: 'Full Stack', level: 'advanced', category: 'frontend' },
        { name: 'React', level: 'advanced', category: 'frontend' },
        { name: 'Node.js', level: 'advanced', category: 'backend' },
        { name: 'MongoDB', level: 'intermediate', category: 'backend' },
        { name: 'Testing', level: 'advanced', category: 'testing' },
      ],
      performanceMetrics: {
        tasksCompleted: 52,
        tasksInProgress: 3,
        averageCompletionTime: 7.0,
        successRate: 88,
        lastActive: Date.now() - 1800000, // 30 min ago
        specializations: ['frontend', 'backend', 'testing'],
      },
      availability: {
        isAvailable: true,
        currentLoad: 60,
        maxCapacity: 5,
      },
      preferredTaskTypes: ['task', 'subtask'],
    },
    {
      name: 'Emma Wilson',
      description: 'DevOps and infrastructure specialist',
      avatarColor: 'bg-orange-500',
      skills: [
        { name: 'Docker', level: 'expert', category: 'devops' },
        { name: 'Kubernetes', level: 'advanced', category: 'devops' },
        { name: 'CI/CD', level: 'expert', category: 'devops' },
        { name: 'AWS', level: 'advanced', category: 'devops' },
        { name: 'Monitoring', level: 'advanced', category: 'devops' },
      ],
      performanceMetrics: {
        tasksCompleted: 31,
        tasksInProgress: 1,
        averageCompletionTime: 10.5,
        successRate: 97,
        lastActive: Date.now() - 86400000, // 1 day ago
        specializations: ['devops', 'infrastructure'],
      },
      availability: {
        isAvailable: true,
        currentLoad: 25,
        maxCapacity: 3,
      },
      preferredTaskTypes: ['task', 'epic'],
    },
    {
      name: 'David Kim',
      description: 'Mobile app development expert',
      avatarColor: 'bg-pink-500',
      skills: [
        { name: 'React Native', level: 'expert', category: 'mobile' },
        { name: 'iOS', level: 'advanced', category: 'mobile' },
        { name: 'Android', level: 'advanced', category: 'mobile' },
        { name: 'Mobile UI', level: 'expert', category: 'design' },
        { name: 'Performance', level: 'advanced', category: 'mobile' },
      ],
      performanceMetrics: {
        tasksCompleted: 29,
        tasksInProgress: 2,
        averageCompletionTime: 9.0,
        successRate: 90,
        lastActive: Date.now() - 10800000, // 3 hours ago
        specializations: ['mobile', 'react-native'],
      },
      availability: {
        isAvailable: true,
        currentLoad: 40,
        maxCapacity: 4,
      },
      preferredTaskTypes: ['story', 'task'],
    },
  ];
}

// Export singleton instance
export const agentOrchestrator = new AgentOrchestrationService();
