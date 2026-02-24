import { CodingAgent, AgentSkillMatch } from '@/types/agent';
import { Task } from '@/types/task';

/**
 * Agent matching and auto-assignment system
 */
export class AgentMatcher {
  /**
   * Finds the best agent(s) for a task based on skills, performance, and availability
   */
  findBestAgents(task: Task, agents: CodingAgent[], topN: number = 3): AgentSkillMatch[] {
    const matches = agents.map(agent => this.calculateMatch(task, agent));

    // Sort by overall score (descending)
    matches.sort((a, b) => b.overallScore - a.overallScore);

    return matches.slice(0, topN);
  }

  /**
   * Calculates match score between a task and an agent
   */
  private calculateMatch(task: Task, agent: CodingAgent): AgentSkillMatch {
    const matchScore = this.calculateSkillMatch(task, agent);
    const availabilityScore = this.calculateAvailability(agent);
    const performanceScore = agent.performanceScore;

    // Weighted scoring: skills 50%, performance 30%, availability 20%
    const overallScore = (matchScore * 0.5) + (performanceScore * 0.3) + (availabilityScore * 0.2);

    const matchedSkills = this.getMatchedSkills(task, agent);

    return {
      agentId: agent.id,
      agent,
      matchScore,
      matchedSkills,
      availabilityScore,
      performanceScore,
      overallScore,
    };
  }

  /**
   * Calculates how well the agent's skills match the task requirements
   */
  private calculateSkillMatch(task: Task, agent: CodingAgent): number {
    if (agent.skills.length === 0) {
      return 30; // Base score for agents without defined skills
    }

    const requiredSkills = this.extractRequiredSkills(task);
    if (requiredSkills.length === 0) {
      return 50; // No specific requirements, moderate score
    }

    const matchedSkills = requiredSkills.filter(skill =>
      agent.skills.some(agentSkill =>
        agentSkill.toLowerCase() === skill.toLowerCase() ||
        this.areSkillsRelated(skill, agentSkill)
      )
    );

    const matchPercentage = (matchedSkills.length / requiredSkills.length) * 100;

    // Boost score slightly if agent has additional relevant skills
    const additionalSkillBoost = Math.min(10, agent.skills.length - matchedSkills.length);

    return Math.min(100, matchPercentage + additionalSkillBoost);
  }

  /**
   * Extracts required skills from task tags and description
   */
  private extractRequiredSkills(task: Task): string[] {
    const skills = new Set<string>();

    // Add skills from tags
    task.tags.forEach(tag => skills.add(tag.toLowerCase()));

    // Extract skills from description
    const skillKeywords = [
      'react', 'nextjs', 'typescript', 'javascript', 'node', 'api', 'rest',
      'graphql', 'database', 'sql', 'mongodb', 'postgres', 'ui', 'ux',
      'css', 'tailwind', 'backend', 'frontend', 'fullstack', 'devops',
      'docker', 'kubernetes', 'aws', 'testing', 'jest', 'cypress',
      'python', 'java', 'go', 'rust', 'mobile', 'ios', 'android'
    ];

    const lowerDesc = task.description.toLowerCase();
    const lowerTitle = task.title.toLowerCase();

    skillKeywords.forEach(keyword => {
      if (lowerDesc.includes(keyword) || lowerTitle.includes(keyword)) {
        skills.add(keyword);
      }
    });

    return Array.from(skills);
  }

  /**
   * Gets the list of matched skills between task and agent
   */
  private getMatchedSkills(task: Task, agent: CodingAgent): string[] {
    const requiredSkills = this.extractRequiredSkills(task);

    return agent.skills.filter(agentSkill =>
      requiredSkills.some(reqSkill =>
        reqSkill.toLowerCase() === agentSkill.toLowerCase() ||
        this.areSkillsRelated(reqSkill, agentSkill)
      )
    );
  }

  /**
   * Checks if two skills are related (e.g., "react" and "nextjs")
   */
  private areSkillsRelated(skill1: string, skill2: string): boolean {
    const relatedSkills: Record<string, string[]> = {
      'react': ['nextjs', 'jsx', 'frontend', 'ui'],
      'nextjs': ['react', 'ssr', 'frontend'],
      'typescript': ['javascript', 'ts', 'js'],
      'javascript': ['typescript', 'node', 'frontend'],
      'node': ['javascript', 'backend', 'api'],
      'api': ['rest', 'graphql', 'backend'],
      'database': ['sql', 'mongodb', 'postgres', 'backend'],
      'sql': ['database', 'postgres', 'mysql'],
      'frontend': ['react', 'ui', 'ux', 'css'],
      'backend': ['api', 'database', 'node'],
      'testing': ['jest', 'cypress', 'qa'],
      'devops': ['docker', 'kubernetes', 'aws', 'deployment'],
    };

    const s1 = skill1.toLowerCase();
    const s2 = skill2.toLowerCase();

    return relatedSkills[s1]?.includes(s2) || relatedSkills[s2]?.includes(s1) || false;
  }

  /**
   * Calculates agent availability score based on current workload
   */
  private calculateAvailability(agent: CodingAgent): number {
    if (!agent.isAvailable) {
      return 0;
    }

    // Penalize agents with many tasks in progress
    const workloadPenalty = Math.min(50, agent.tasksInProgress * 10);

    return Math.max(0, 100 - workloadPenalty);
  }

  /**
   * Auto-assigns a task to the best available agent
   */
  autoAssign(task: Task, agents: CodingAgent[]): string | undefined {
    const availableAgents = agents.filter(agent => agent.isAvailable);

    if (availableAgents.length === 0) {
      return undefined;
    }

    const bestMatches = this.findBestAgents(task, availableAgents, 1);

    if (bestMatches.length > 0 && bestMatches[0].overallScore >= 30) {
      return bestMatches[0].agentId;
    }

    return undefined;
  }

  /**
   * Recommends task reassignment if a better agent becomes available
   */
  shouldReassign(task: Task, currentAgent: CodingAgent, agents: CodingAgent[]): AgentSkillMatch | null {
    if (!task.assignedAgentId) return null;

    const currentMatch = this.calculateMatch(task, currentAgent);
    const otherAgents = agents.filter(a => a.id !== currentAgent.id && a.isAvailable);

    if (otherAgents.length === 0) return null;

    const bestAlternative = this.findBestAgents(task, otherAgents, 1)[0];

    // Recommend reassignment if alternative is significantly better (>20 points)
    if (bestAlternative && (bestAlternative.overallScore - currentMatch.overallScore) > 20) {
      return bestAlternative;
    }

    return null;
  }
}

/**
 * Updates agent performance metrics based on task completion
 */
export class AgentPerformanceTracker {
  /**
   * Updates agent metrics when a task is completed
   */
  updateOnTaskCompletion(
    agent: CodingAgent,
    task: Task,
    completionTimeHours: number
  ): Partial<CodingAgent> {
    const newTasksCompleted = agent.tasksCompleted + 1;
    const newTasksInProgress = Math.max(0, agent.tasksInProgress - 1);

    // Update average completion time
    const currentAverage = agent.averageCompletionTimeHours || 0;
    const newAverage = currentAverage === 0
      ? completionTimeHours
      : ((currentAverage * agent.tasksCompleted) + completionTimeHours) / newTasksCompleted;

    // Calculate performance score based on:
    // - On-time completion (compared to estimate)
    // - Task complexity
    // - Completion rate
    let performanceAdjustment = 0;

    if (task.estimatedHours) {
      const efficiency = (task.estimatedHours / completionTimeHours) * 100;
      if (efficiency >= 100) performanceAdjustment = 2; // Faster than estimate
      else if (efficiency >= 80) performanceAdjustment = 1; // Close to estimate
      else if (efficiency >= 50) performanceAdjustment = -1; // Slower than estimate
      else performanceAdjustment = -2; // Much slower than estimate
    } else {
      performanceAdjustment = 1; // Completed task, slight boost
    }

    // Factor in task priority and risk
    if (task.priority >= 4) performanceAdjustment += 0.5;
    if (task.riskLevel === 'high' || task.riskLevel === 'critical') performanceAdjustment += 0.5;

    const newPerformanceScore = Math.max(0, Math.min(100, agent.performanceScore + performanceAdjustment));

    return {
      tasksCompleted: newTasksCompleted,
      tasksInProgress: newTasksInProgress,
      averageCompletionTimeHours: newAverage,
      performanceScore: newPerformanceScore,
    };
  }

  /**
   * Updates agent metrics when a task is assigned
   */
  updateOnTaskAssignment(agent: CodingAgent): Partial<CodingAgent> {
    return {
      tasksInProgress: agent.tasksInProgress + 1,
    };
  }

  /**
   * Updates agent metrics when a task assignment is removed
   */
  updateOnTaskUnassignment(agent: CodingAgent): Partial<CodingAgent> {
    return {
      tasksInProgress: Math.max(0, agent.tasksInProgress - 1),
    };
  }

  /**
   * Suggests skills to add to an agent based on completed tasks
   */
  suggestSkills(agent: CodingAgent, completedTasks: Task[]): string[] {
    const skillFrequency = new Map<string, number>();

    completedTasks.forEach(task => {
      task.tags.forEach(tag => {
        const count = skillFrequency.get(tag.toLowerCase()) || 0;
        skillFrequency.set(tag.toLowerCase(), count + 1);
      });
    });

    const currentSkills = new Set(agent.skills.map(s => s.toLowerCase()));
    const suggestions: string[] = [];

    // Suggest skills that appear in at least 3 completed tasks
    skillFrequency.forEach((count, skill) => {
      if (count >= 3 && !currentSkills.has(skill)) {
        suggestions.push(skill);
      }
    });

    return suggestions;
  }
}

/**
 * Helper function to auto-assign a task
 */
export function autoAssignTask(task: Task, agents: CodingAgent[]): string | undefined {
  const matcher = new AgentMatcher();
  return matcher.autoAssign(task, agents);
}

/**
 * Helper function to find best agents for a task
 */
export function findBestAgentsForTask(task: Task, agents: CodingAgent[], topN: number = 3): AgentSkillMatch[] {
  const matcher = new AgentMatcher();
  return matcher.findBestAgents(task, agents, topN);
}
