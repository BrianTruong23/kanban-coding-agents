import { CodingAgent, AgentSkill, SkillLevel } from '@/types/agent';
import { Ticket, Subtask } from '@/types/breakdown';

/**
 * Agent Orchestration System
 * Manages agent roster and handles auto-assignment based on skills and performance
 */
export class AgentOrchestrator {

  /**
   * Calculate match score between an agent and a task
   */
  static calculateMatchScore(
    agent: CodingAgent,
    task: Ticket | Subtask,
    allAgents: CodingAgent[]
  ): {
    score: number;
    confidence: number;
    reasons: string[];
  } {
    const reasons: string[] = [];
    let score = 0;
    let maxPossibleScore = 0;

    // 1. Skills match (40 points max)
    maxPossibleScore += 40;
    const skillScore = this.calculateSkillScore(agent, task);
    score += skillScore.score;
    reasons.push(...skillScore.reasons);

    // 2. Performance metrics (30 points max)
    maxPossibleScore += 30;
    const performanceScore = this.calculatePerformanceScore(agent);
    score += performanceScore.score;
    reasons.push(...performanceScore.reasons);

    // 3. Availability (20 points max)
    maxPossibleScore += 20;
    const availabilityScore = this.calculateAvailabilityScore(agent);
    score += availabilityScore.score;
    reasons.push(...availabilityScore.reasons);

    // 4. Workload balance (10 points max)
    maxPossibleScore += 10;
    const workloadScore = this.calculateWorkloadScore(agent, allAgents);
    score += workloadScore.score;
    reasons.push(...workloadScore.reasons);

    // Calculate confidence (0-1)
    const confidence = score / maxPossibleScore;

    return {
      score,
      confidence,
      reasons
    };
  }

  /**
   * Calculate skill match score
   */
  private static calculateSkillScore(
    agent: CodingAgent,
    task: Ticket | Subtask
  ): { score: number; reasons: string[] } {
    const reasons: string[] = [];
    let score = 0;

    const taskTags = task.tags || [];
    const taskDescription = (task.title + ' ' + task.description).toLowerCase();

    // Check if agent has relevant skills
    const relevantSkills = agent.skills.filter(skill => {
      const skillName = skill.name.toLowerCase();
      return taskTags.some(tag => tag.toLowerCase().includes(skillName)) ||
             taskDescription.includes(skillName);
    });

    if (relevantSkills.length > 0) {
      // Calculate score based on skill level
      const skillLevelMap: Record<SkillLevel, number> = {
        'beginner': 5,
        'intermediate': 10,
        'advanced': 15,
        'expert': 20
      };

      relevantSkills.forEach(skill => {
        score += skillLevelMap[skill.level];
        reasons.push(`Has ${skill.level} level in ${skill.name}`);
      });

      // Cap at 40 points
      score = Math.min(score, 40);
    } else {
      // Check specializations
      if (agent.specializations) {
        const matchingSpecs = agent.specializations.filter(spec =>
          taskTags.some(tag => tag.toLowerCase().includes(spec.toLowerCase())) ||
          taskDescription.includes(spec.toLowerCase())
        );

        if (matchingSpecs.length > 0) {
          score += matchingSpecs.length * 10;
          reasons.push(`Specializes in: ${matchingSpecs.join(', ')}`);
        }
      }
    }

    return { score, reasons };
  }

  /**
   * Calculate performance score
   */
  private static calculatePerformanceScore(
    agent: CodingAgent
  ): { score: number; reasons: string[] } {
    const reasons: string[] = [];
    const metrics = agent.performance;

    // Success rate (0-10 points)
    const successScore = metrics.successRate * 10;

    // Quality score (0-10 points)
    const qualityScore = (metrics.qualityScore / 100) * 10;

    // Reliability (0-10 points)
    const reliabilityScore = (metrics.reliability / 100) * 10;

    const totalScore = successScore + qualityScore + reliabilityScore;

    if (metrics.successRate >= 0.9) {
      reasons.push(`High success rate (${(metrics.successRate * 100).toFixed(0)}%)`);
    }
    if (metrics.qualityScore >= 80) {
      reasons.push(`High quality score (${metrics.qualityScore})`);
    }
    if (metrics.reliability >= 80) {
      reasons.push(`Reliable delivery (${metrics.reliability}%)`);
    }

    return { score: totalScore, reasons };
  }

  /**
   * Calculate availability score
   */
  private static calculateAvailabilityScore(
    agent: CodingAgent
  ): { score: number; reasons: string[] } {
    const reasons: string[] = [];
    let score = 0;

    const availability = agent.availability;

    if (availability.status === 'available') {
      score += 10;
      reasons.push('Currently available');
    } else if (availability.status === 'busy') {
      score += 5;
      reasons.push('Busy but can take more tasks');
    } else {
      reasons.push('Currently offline');
    }

    // Workload capacity
    const capacityScore = (1 - (availability.currentWorkload / 100)) * 10;
    score += capacityScore;

    if (availability.currentWorkload < 50) {
      reasons.push(`Low workload (${availability.currentWorkload}%)`);
    }

    return { score, reasons };
  }

  /**
   * Calculate workload balance score
   */
  private static calculateWorkloadScore(
    agent: CodingAgent,
    allAgents: CodingAgent[]
  ): { score: number; reasons: string[] } {
    const reasons: string[] = [];

    // Calculate average workload
    const totalWorkload = allAgents.reduce((sum, a) => sum + a.availability.currentWorkload, 0);
    const avgWorkload = totalWorkload / allAgents.length;

    // Agents with lower than average workload get higher scores
    const workloadDiff = avgWorkload - agent.availability.currentWorkload;
    const score = Math.max(0, Math.min(10, (workloadDiff / 100) * 10 + 5));

    if (agent.availability.currentWorkload < avgWorkload) {
      reasons.push('Has capacity compared to team average');
    }

    return { score, reasons };
  }

  /**
   * Auto-assign tasks to agents based on skills and performance
   */
  static autoAssignTasks(
    tasks: (Ticket | Subtask)[],
    agents: CodingAgent[]
  ): Array<{
    taskId: string;
    agentId: string;
    confidence: number;
    reason: string;
  }> {
    const assignments: Array<{
      taskId: string;
      agentId: string;
      confidence: number;
      reason: string;
    }> = [];

    // Filter available agents
    const availableAgents = agents.filter(a =>
      a.availability.status !== 'offline' &&
      a.availability.currentWorkload < 100
    );

    if (availableAgents.length === 0) {
      return assignments;
    }

    // Sort tasks by priority
    const sortedTasks = [...tasks].sort((a, b) => {
      const priorityA = 'priority' in a ? a.priority : 3;
      const priorityB = 'priority' in b ? b.priority : 3;
      return priorityB - priorityA;
    });

    // Assign each task to the best matching agent
    for (const task of sortedTasks) {
      // Skip already assigned tasks
      if (task.assignedAgentId) continue;

      // Calculate scores for all available agents
      const scores = availableAgents.map(agent => ({
        agent,
        ...this.calculateMatchScore(agent, task, availableAgents)
      }));

      // Sort by score
      scores.sort((a, b) => b.score - a.score);

      // Assign to best match if confidence is high enough
      if (scores.length > 0 && scores[0].confidence >= 0.3) {
        const bestMatch = scores[0];
        assignments.push({
          taskId: task.id,
          agentId: bestMatch.agent.id,
          confidence: bestMatch.confidence,
          reason: bestMatch.reasons.join('; ')
        });
      }
    }

    return assignments;
  }

  /**
   * Get agent recommendations for a specific task
   */
  static getAgentRecommendations(
    task: Ticket | Subtask,
    agents: CodingAgent[],
    topN: number = 3
  ): Array<{
    agent: CodingAgent;
    score: number;
    confidence: number;
    reasons: string[];
  }> {
    const scores = agents.map(agent => ({
      agent,
      ...this.calculateMatchScore(agent, task, agents)
    }));

    // Sort by score
    scores.sort((a, b) => b.score - a.score);

    return scores.slice(0, topN);
  }

  /**
   * Update agent performance metrics after task completion
   */
  static updateAgentPerformance(
    agent: CodingAgent,
    taskCompleted: boolean,
    actualHours: number,
    estimatedHours?: number,
    qualityRating?: number // 0-100
  ): CodingAgent {
    const updatedPerformance = { ...agent.performance };

    // Update task counts
    if (taskCompleted) {
      updatedPerformance.tasksCompleted += 1;
      updatedPerformance.tasksInProgress = Math.max(0, updatedPerformance.tasksInProgress - 1);
    }

    // Update success rate (exponential moving average)
    const alpha = 0.2; // Smoothing factor
    const newSuccess = taskCompleted ? 1 : 0;
    updatedPerformance.successRate =
      alpha * newSuccess + (1 - alpha) * updatedPerformance.successRate;

    // Update average completion time
    if (taskCompleted && actualHours > 0) {
      const totalTasks = updatedPerformance.tasksCompleted;
      updatedPerformance.averageCompletionTime =
        ((updatedPerformance.averageCompletionTime * (totalTasks - 1)) + actualHours) / totalTasks;
      updatedPerformance.totalHoursWorked += actualHours;
    }

    // Update reliability (based on meeting estimates)
    if (estimatedHours && actualHours > 0) {
      const onTime = actualHours <= estimatedHours * 1.2; // 20% buffer
      updatedPerformance.reliability =
        alpha * (onTime ? 100 : 50) + (1 - alpha) * updatedPerformance.reliability;
    }

    // Update quality score if provided
    if (qualityRating !== undefined) {
      updatedPerformance.qualityScore =
        alpha * qualityRating + (1 - alpha) * updatedPerformance.qualityScore;
    }

    // Update last active
    updatedPerformance.lastActiveAt = Date.now();

    return {
      ...agent,
      performance: updatedPerformance
    };
  }

  /**
   * Calculate team capacity
   */
  static calculateTeamCapacity(agents: CodingAgent[]): {
    totalAgents: number;
    availableAgents: number;
    averageWorkload: number;
    teamCapacity: number; // percentage of remaining capacity
    estimatedHoursAvailable: number;
  } {
    const totalAgents = agents.length;
    const availableAgents = agents.filter(a => a.availability.status !== 'offline').length;

    const totalWorkload = agents.reduce((sum, a) => sum + a.availability.currentWorkload, 0);
    const averageWorkload = totalAgents > 0 ? totalWorkload / totalAgents : 0;

    const totalPossibleWorkload = totalAgents * 100;
    const remainingCapacity = totalPossibleWorkload - totalWorkload;
    const teamCapacity = totalPossibleWorkload > 0 ? (remainingCapacity / totalPossibleWorkload) * 100 : 0;

    // Estimate hours available (assuming 40 hours/week per agent at 100% workload)
    const estimatedHoursAvailable = (remainingCapacity / 100) * 40;

    return {
      totalAgents,
      availableAgents,
      averageWorkload,
      teamCapacity,
      estimatedHoursAvailable
    };
  }

  /**
   * Find skill gaps in the team for a given task
   */
  static findSkillGaps(
    task: Ticket | Subtask,
    agents: CodingAgent[]
  ): string[] {
    const gaps: string[] = [];

    const taskDescription = (task.title + ' ' + task.description).toLowerCase();
    const commonSkills = [
      'react', 'typescript', 'javascript', 'python', 'java', 'node.js',
      'sql', 'mongodb', 'api', 'testing', 'devops', 'security'
    ];

    // Check for required skills in task
    const requiredSkills = commonSkills.filter(skill =>
      taskDescription.includes(skill.toLowerCase())
    );

    // Check if any agent has each required skill
    for (const requiredSkill of requiredSkills) {
      const hasSkill = agents.some(agent =>
        agent.skills.some(s => s.name.toLowerCase().includes(requiredSkill.toLowerCase())) ||
        agent.specializations?.some(s => s.toLowerCase().includes(requiredSkill.toLowerCase()))
      );

      if (!hasSkill) {
        gaps.push(requiredSkill);
      }
    }

    return gaps;
  }
}
