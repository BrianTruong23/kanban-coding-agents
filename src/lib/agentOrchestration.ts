import { CodingAgent, AgentSkill, AgentPerformanceMetrics } from '@/types/agent';
import { Task } from '@/types/task';

export interface AgentAssignmentScore {
  agentId: string;
  score: number;
  reasons: string[];
  availability: boolean;
}

/**
 * Service for managing agent roster and automatic task assignment
 */
export class AgentOrchestrationService {
  /**
   * Calculate the best agent for a task based on skills, performance, and availability
   */
  calculateAgentScores(
    task: Task,
    agents: CodingAgent[],
    allTasks: Task[]
  ): AgentAssignmentScore[] {
    return agents.map(agent => {
      const score = this.calculateAgentScore(task, agent, allTasks);
      const reasons = this.getAssignmentReasons(task, agent);
      const availability = this.checkAgentAvailability(agent, allTasks);

      return {
        agentId: agent.id,
        score,
        reasons,
        availability,
      };
    }).sort((a, b) => b.score - a.score);
  }

  /**
   * Auto-assign tasks to agents based on their skills and availability
   */
  autoAssignTasks(
    tasks: Task[],
    agents: CodingAgent[]
  ): Map<string, string> {
    const assignments = new Map<string, string>(); // taskId -> agentId
    const agentWorkload = new Map<string, number>(); // agentId -> number of assigned tasks

    // Initialize workload
    agents.forEach(agent => {
      const currentTasks = tasks.filter(t => t.assignedAgentId === agent.id && t.status !== 'done');
      agentWorkload.set(agent.id, currentTasks.length);
    });

    // Sort tasks by priority (high to low)
    const sortedTasks = [...tasks]
      .filter(t => !t.assignedAgentId)
      .sort((a, b) => b.priority - a.priority);

    // Assign each task to the best available agent
    sortedTasks.forEach(task => {
      const scores = this.calculateAgentScores(task, agents, tasks);

      // Filter by availability and workload
      const availableAgents = scores.filter(score => {
        const agent = agents.find(a => a.id === score.agentId);
        const currentWorkload = agentWorkload.get(score.agentId) || 0;
        const maxTasks = agent?.maxConcurrentTasks || 3;

        return score.availability && currentWorkload < maxTasks;
      });

      if (availableAgents.length > 0) {
        const bestAgent = availableAgents[0];
        assignments.set(task.id, bestAgent.agentId);
        agentWorkload.set(bestAgent.agentId, (agentWorkload.get(bestAgent.agentId) || 0) + 1);
      }
    });

    return assignments;
  }

  private calculateAgentScore(
    task: Task,
    agent: CodingAgent,
    allTasks: Task[]
  ): number {
    let score = 0;

    // 1. Skill matching (40% of score)
    const skillScore = this.calculateSkillScore(task, agent);
    score += skillScore * 0.4;

    // 2. Performance metrics (30% of score)
    const performanceScore = this.calculatePerformanceScore(agent);
    score += performanceScore * 0.3;

    // 3. Specialization match (20% of score)
    const specializationScore = this.calculateSpecializationScore(task, agent);
    score += specializationScore * 0.2;

    // 4. Workload balance (10% of score)
    const workloadScore = this.calculateWorkloadScore(agent, allTasks);
    score += workloadScore * 0.1;

    return score;
  }

  private calculateSkillScore(task: Task, agent: CodingAgent): number {
    if (!agent.skills || agent.skills.length === 0) {
      return 0.5; // Default score if no skills defined
    }

    const taskTags = task.tags || [];
    let totalScore = 0;
    let matchCount = 0;

    // Map task tags to skill categories
    const tagCategoryMap: Record<string, string[]> = {
      frontend: ['react', 'vue', 'angular', 'ui', 'component', 'css', 'html'],
      backend: ['api', 'server', 'node', 'express', 'backend', 'service'],
      database: ['database', 'sql', 'postgres', 'mongodb', 'db', 'schema'],
      devops: ['docker', 'kubernetes', 'ci/cd', 'deployment', 'devops'],
      mobile: ['ios', 'android', 'mobile', 'react-native', 'flutter'],
      testing: ['test', 'qa', 'jest', 'cypress', 'testing'],
    };

    agent.skills.forEach(skill => {
      const relatedTags = tagCategoryMap[skill.category] || [];
      const hasMatch = taskTags.some(tag =>
        relatedTags.includes(tag.toLowerCase()) ||
        tag.toLowerCase().includes(skill.name.toLowerCase())
      );

      if (hasMatch) {
        totalScore += skill.level / 5; // Normalize to 0-1
        matchCount++;
      }
    });

    return matchCount > 0 ? totalScore / matchCount : 0.3;
  }

  private calculatePerformanceScore(agent: CodingAgent): number {
    const performance = agent.performance;

    if (!performance) {
      return 0.5; // Default for agents without performance data
    }

    // Weight different performance metrics
    const successRateWeight = 0.5;
    const completionTimeWeight = 0.3;
    const experienceWeight = 0.2;

    // Success rate contribution
    const successScore = performance.successRate * successRateWeight;

    // Completion time contribution (faster is better, normalized)
    // Assume 40 hours is average, < 20 is excellent, > 80 is slow
    const avgTime = performance.averageCompletionTime || 40;
    const timeScore = Math.max(0, Math.min(1, 1 - (avgTime - 20) / 60)) * completionTimeWeight;

    // Experience contribution (more completed tasks is better)
    const experienceScore = Math.min(1, performance.tasksCompleted / 50) * experienceWeight;

    return successScore + timeScore + experienceScore;
  }

  private calculateSpecializationScore(task: Task, agent: CodingAgent): number {
    const performance = agent.performance;

    if (!performance?.specializations || performance.specializations.length === 0) {
      return 0.5;
    }

    const taskTags = task.tags || [];
    const matchingSpecs = performance.specializations.filter(spec =>
      taskTags.some(tag => tag.toLowerCase() === spec.toLowerCase())
    );

    return matchingSpecs.length > 0 ? Math.min(1, matchingSpecs.length / taskTags.length) : 0.3;
  }

  private calculateWorkloadScore(agent: CodingAgent, allTasks: Task[]): number {
    const agentTasks = allTasks.filter(
      t => t.assignedAgentId === agent.id && t.status !== 'done'
    );

    const currentWorkload = agentTasks.length;
    const maxTasks = agent.maxConcurrentTasks || 3;

    // Return higher score for agents with lower workload
    return Math.max(0, 1 - currentWorkload / maxTasks);
  }

  private checkAgentAvailability(agent: CodingAgent, allTasks: Task[]): boolean {
    if (agent.availability === 'offline') {
      return false;
    }

    const currentWorkload = allTasks.filter(
      t => t.assignedAgentId === agent.id && t.status !== 'done'
    ).length;

    const maxTasks = agent.maxConcurrentTasks || 3;

    return currentWorkload < maxTasks;
  }

  private getAssignmentReasons(task: Task, agent: CodingAgent): string[] {
    const reasons: string[] = [];

    // Check skill matches
    if (agent.skills) {
      const matchingSkills = agent.skills.filter(skill => {
        const taskTags = task.tags.map(t => t.toLowerCase());
        return taskTags.some(tag =>
          tag.includes(skill.name.toLowerCase()) ||
          skill.category === tag
        );
      });

      matchingSkills.forEach(skill => {
        const levelDesc = ['Beginner', 'Intermediate', 'Proficient', 'Advanced', 'Expert'][skill.level - 1];
        reasons.push(`${levelDesc} in ${skill.name}`);
      });
    }

    // Check performance
    if (agent.performance) {
      if (agent.performance.successRate > 0.9) {
        reasons.push(`High success rate (${Math.round(agent.performance.successRate * 100)}%)`);
      }
      if (agent.performance.averageCompletionTime < 30) {
        reasons.push('Fast completion time');
      }
    }

    // Check specializations
    if (agent.performance?.specializations) {
      const matchingSpecs = agent.performance.specializations.filter(spec =>
        task.tags.some(tag => tag.toLowerCase() === spec.toLowerCase())
      );

      if (matchingSpecs.length > 0) {
        reasons.push(`Specialized in ${matchingSpecs.join(', ')}`);
      }
    }

    // Check availability
    if (agent.availability === 'available') {
      reasons.push('Currently available');
    }

    return reasons;
  }

  /**
   * Update agent performance metrics based on task completion
   */
  updateAgentPerformance(
    agent: CodingAgent,
    task: Task,
    completionTimeHours: number,
    success: boolean
  ): AgentPerformanceMetrics {
    const current = agent.performance || {
      tasksCompleted: 0,
      tasksInProgress: 0,
      averageCompletionTime: 0,
      successRate: 1,
      specializations: [],
    };

    const newTasksCompleted = current.tasksCompleted + 1;
    const newSuccessRate = (current.successRate * current.tasksCompleted + (success ? 1 : 0)) / newTasksCompleted;
    const newAvgCompletionTime = (current.averageCompletionTime * current.tasksCompleted + completionTimeHours) / newTasksCompleted;

    // Update specializations based on task tags
    const updatedSpecs = [...(current.specializations || [])];
    task.tags.forEach(tag => {
      if (!updatedSpecs.includes(tag)) {
        updatedSpecs.push(tag);
      }
    });

    return {
      tasksCompleted: newTasksCompleted,
      tasksInProgress: Math.max(0, current.tasksInProgress - 1),
      averageCompletionTime: newAvgCompletionTime,
      successRate: newSuccessRate,
      lastActiveDate: Date.now(),
      specializations: updatedSpecs,
    };
  }

  /**
   * Suggest skills for an agent based on task history
   */
  suggestSkills(agent: CodingAgent, completedTasks: Task[]): AgentSkill[] {
    const agentTasks = completedTasks.filter(t => t.assignedAgentId === agent.id);

    if (agentTasks.length === 0) {
      return [];
    }

    // Count tag frequency
    const tagFrequency = new Map<string, number>();
    agentTasks.forEach(task => {
      task.tags.forEach(tag => {
        tagFrequency.set(tag, (tagFrequency.get(tag) || 0) + 1);
      });
    });

    // Map tags to skill categories
    const categoryMap: Record<string, AgentSkill['category']> = {
      react: 'frontend',
      vue: 'frontend',
      angular: 'frontend',
      ui: 'frontend',
      api: 'backend',
      backend: 'backend',
      node: 'backend',
      database: 'database',
      sql: 'database',
      docker: 'devops',
      kubernetes: 'devops',
      mobile: 'mobile',
      test: 'testing',
    };

    // Generate skill suggestions
    const skills: AgentSkill[] = [];
    tagFrequency.forEach((count, tag) => {
      const category = categoryMap[tag.toLowerCase()] || 'other';
      const level = Math.min(5, Math.ceil(count / 5)) as 1 | 2 | 3 | 4 | 5;

      skills.push({
        name: tag,
        level,
        category,
      });
    });

    return skills.sort((a, b) => b.level - a.level);
  }
}

// Export singleton instance
export const agentOrchestrationService = new AgentOrchestrationService();
