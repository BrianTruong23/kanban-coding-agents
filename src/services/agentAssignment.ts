import { ExtendedTask } from '@/types/taskHierarchy';
import {
  ExtendedAgent,
  AgentAssignmentScore,
  AgentWorkload,
  SkillCategory,
} from '@/types/agentSkills';

/**
 * Service for automatically assigning tasks to agents based on skills, performance, and workload
 */
export class AgentAssignmentService {
  /**
   * Calculate assignment scores for all agents for a given task
   */
  calculateAssignmentScores(task: ExtendedTask, agents: ExtendedAgent[]): AgentAssignmentScore[] {
    const scores: AgentAssignmentScore[] = [];

    agents.forEach((agent) => {
      if (agent.status !== 'active') {
        return; // Skip inactive agents
      }

      const score = this.calculateAgentScore(task, agent);
      scores.push(score);
    });

    // Sort by score descending
    return scores.sort((a, b) => b.score - a.score);
  }

  /**
   * Get the best agent for a task
   */
  getBestAgent(task: ExtendedTask, agents: ExtendedAgent[]): ExtendedAgent | null {
    const scores = this.calculateAssignmentScores(task, agents);
    if (scores.length === 0) return null;

    const bestScore = scores[0];
    return agents.find((a) => a.id === bestScore.agentId) || null;
  }

  /**
   * Auto-assign multiple tasks to agents optimally
   */
  autoAssignTasks(tasks: ExtendedTask[], agents: ExtendedAgent[]): Map<string, string> {
    const assignments = new Map<string, string>(); // taskId -> agentId
    const workloadTracker = this.initializeWorkloadTracker(agents);

    // Sort tasks by priority (higher first), then complexity
    const sortedTasks = [...tasks].sort((a, b) => {
      if (b.priority !== a.priority) return b.priority - a.priority;
      const complexityOrder = { high: 3, medium: 2, low: 1 };
      return complexityOrder[b.complexity || 'medium'] - complexityOrder[a.complexity || 'medium'];
    });

    sortedTasks.forEach((task) => {
      const availableAgents = agents.filter((agent) => {
        const workload = workloadTracker.get(agent.id);
        return (
          agent.status === 'active' &&
          workload &&
          workload.availability !== 'overloaded' &&
          (!agent.preferences?.maxConcurrentTasks ||
            workload.currentTasks < agent.preferences.maxConcurrentTasks)
        );
      });

      if (availableAgents.length === 0) return;

      const scores = this.calculateAssignmentScores(task, availableAgents);
      if (scores.length === 0) return;

      const bestAgent = scores[0].agentId;
      assignments.set(task.id, bestAgent);

      // Update workload tracker
      const workload = workloadTracker.get(bestAgent);
      if (workload) {
        workload.currentTasks++;
        workload.estimatedHoursRemaining += task.estimatedHours || 0;
        workload.availability = this.calculateAvailability(workload);
      }
    });

    return assignments;
  }

  private calculateAgentScore(task: ExtendedTask, agent: ExtendedAgent): AgentAssignmentScore {
    const skillMatch = this.calculateSkillMatch(task, agent);
    const availabilityScore = this.calculateAvailabilityScore(agent);
    const performanceScore = this.calculatePerformanceScore(agent);
    const workloadScore = this.calculateWorkloadScore(agent);

    // Weighted average
    const weights = {
      skill: 0.4,
      availability: 0.2,
      performance: 0.25,
      workload: 0.15,
    };

    const totalScore =
      skillMatch * weights.skill +
      availabilityScore * weights.availability +
      performanceScore * weights.performance +
      workloadScore * weights.workload;

    const reasons: string[] = [];
    if (skillMatch >= 80) reasons.push('Excellent skill match');
    else if (skillMatch >= 60) reasons.push('Good skill match');
    else if (skillMatch < 40) reasons.push('Limited skill match');

    if (availabilityScore >= 80) reasons.push('High availability');
    else if (availabilityScore < 40) reasons.push('Limited availability');

    if (performanceScore >= 80) reasons.push('Strong track record');
    else if (performanceScore < 40) reasons.push('Needs mentoring');

    if (workloadScore >= 80) reasons.push('Light workload');
    else if (workloadScore < 40) reasons.push('Heavy workload');

    return {
      agentId: agent.id,
      score: Math.round(totalScore),
      reasons,
      skillMatch: Math.round(skillMatch),
      availabilityScore: Math.round(availabilityScore),
      performanceScore: Math.round(performanceScore),
      workloadScore: Math.round(workloadScore),
    };
  }

  private calculateSkillMatch(task: ExtendedTask, agent: ExtendedAgent): number {
    if (!task.skillsRequired || task.skillsRequired.length === 0) {
      return 70; // Neutral score if no skills required
    }

    let totalMatch = 0;
    let requiredSkillsCount = task.skillsRequired.length;

    task.skillsRequired.forEach((requiredSkill) => {
      const agentSkill = agent.skills.find(
        (s) => s.category === requiredSkill || s.name.toLowerCase().includes(requiredSkill.toLowerCase())
      );

      if (agentSkill) {
        // Proficiency contributes to match (1-5 scale -> 20-100)
        totalMatch += agentSkill.proficiency * 20;
      }
    });

    const averageMatch = requiredSkillsCount > 0 ? totalMatch / requiredSkillsCount : 0;

    // Bonus for having relevant specializations
    const specializationBonus = agent.performance.specializations.some((spec) =>
      task.skillsRequired?.includes(spec)
    )
      ? 10
      : 0;

    return Math.min(100, averageMatch + specializationBonus);
  }

  private calculateAvailabilityScore(agent: ExtendedAgent): number {
    switch (agent.workload.availability) {
      case 'available':
        return 100;
      case 'busy':
        return 60;
      case 'overloaded':
        return 20;
      case 'offline':
        return 0;
      default:
        return 50;
    }
  }

  private calculatePerformanceScore(agent: ExtendedAgent): number {
    const metrics = agent.performance;

    // Weighted components
    const successWeight = 0.3;
    const qualityWeight = 0.3;
    const onTimeWeight = 0.25;
    const experienceWeight = 0.15;

    // Experience score (based on tasks completed)
    let experienceScore = 0;
    if (metrics.tasksCompleted >= 50) experienceScore = 100;
    else if (metrics.tasksCompleted >= 20) experienceScore = 80;
    else if (metrics.tasksCompleted >= 10) experienceScore = 60;
    else if (metrics.tasksCompleted >= 5) experienceScore = 40;
    else experienceScore = 20;

    return (
      metrics.successRate * successWeight +
      metrics.qualityScore * qualityWeight +
      metrics.onTimeDeliveryRate * onTimeWeight +
      experienceScore * experienceWeight
    );
  }

  private calculateWorkloadScore(agent: ExtendedAgent): number {
    const workload = agent.workload;
    const maxConcurrent = agent.preferences?.maxConcurrentTasks || 5;
    const maxHours = 40; // Max reasonable hours per week

    // Score based on current task count
    const taskScore = Math.max(0, 100 - (workload.currentTasks / maxConcurrent) * 100);

    // Score based on estimated hours
    const hoursScore = Math.max(0, 100 - (workload.estimatedHoursRemaining / maxHours) * 100);

    // Average the two scores
    return (taskScore + hoursScore) / 2;
  }

  private initializeWorkloadTracker(agents: ExtendedAgent[]): Map<string, AgentWorkload> {
    const tracker = new Map<string, AgentWorkload>();

    agents.forEach((agent) => {
      tracker.set(agent.id, { ...agent.workload });
    });

    return tracker;
  }

  private calculateAvailability(workload: AgentWorkload): AgentWorkload['availability'] {
    if (workload.currentTasks === 0) return 'available';
    if (workload.currentTasks <= 2 && workload.estimatedHoursRemaining <= 20) return 'available';
    if (workload.currentTasks <= 4 && workload.estimatedHoursRemaining <= 40) return 'busy';
    return 'overloaded';
  }

  /**
   * Rebalance workload across agents
   */
  rebalanceWorkload(
    assignments: Map<string, string>,
    tasks: ExtendedTask[],
    agents: ExtendedAgent[]
  ): Map<string, string> {
    const workloadByAgent = new Map<string, number>();

    // Calculate current workload
    agents.forEach((agent) => {
      workloadByAgent.set(agent.id, agent.workload.estimatedHoursRemaining);
    });

    // Find overloaded agents
    const overloadedAgents = agents.filter((a) => a.workload.availability === 'overloaded');

    if (overloadedAgents.length === 0) return assignments;

    // Try to move low-priority tasks from overloaded agents to available ones
    const availableAgents = agents.filter((a) => a.workload.availability === 'available');

    if (availableAgents.length === 0) return assignments;

    overloadedAgents.forEach((overloadedAgent) => {
      const tasksForAgent = tasks.filter((t) => assignments.get(t.id) === overloadedAgent.id);
      const lowPriorityTasks = tasksForAgent.filter((t) => t.priority <= 3).sort((a, b) => a.priority - b.priority);

      lowPriorityTasks.forEach((task) => {
        const scores = this.calculateAssignmentScores(task, availableAgents);
        if (scores.length > 0 && scores[0].score > 50) {
          // Reassign if there's a good match
          assignments.set(task.id, scores[0].agentId);
        }
      });
    });

    return assignments;
  }

  /**
   * Generate agent roster report
   */
  generateRosterReport(agents: ExtendedAgent[]): AgentRosterReport {
    const activeAgents = agents.filter((a) => a.status === 'active');
    const totalCapacity = activeAgents.length * 40; // Assuming 40 hours per week per agent

    const currentLoad = activeAgents.reduce(
      (sum, agent) => sum + agent.workload.estimatedHoursRemaining,
      0
    );

    const utilizationRate = totalCapacity > 0 ? (currentLoad / totalCapacity) * 100 : 0;

    const skillCoverage = this.calculateSkillCoverage(activeAgents);

    const topPerformers = [...activeAgents]
      .sort((a, b) => b.performance.qualityScore - a.performance.qualityScore)
      .slice(0, 5);

    const bottlenecks = activeAgents.filter((a) => a.workload.availability === 'overloaded');

    return {
      totalAgents: agents.length,
      activeAgents: activeAgents.length,
      utilizationRate: Math.round(utilizationRate),
      totalCapacityHours: totalCapacity,
      currentLoadHours: Math.round(currentLoad),
      availableHours: Math.round(totalCapacity - currentLoad),
      skillCoverage,
      topPerformers: topPerformers.map((a) => ({
        id: a.id,
        name: a.name,
        qualityScore: a.performance.qualityScore,
        tasksCompleted: a.performance.tasksCompleted,
      })),
      bottlenecks: bottlenecks.map((a) => ({
        id: a.id,
        name: a.name,
        currentTasks: a.workload.currentTasks,
        estimatedHours: a.workload.estimatedHoursRemaining,
      })),
    };
  }

  private calculateSkillCoverage(agents: ExtendedAgent[]): SkillCoverageMap {
    const coverage = new Map<SkillCategory, number>();

    const allSkillCategories: SkillCategory[] = [
      'frontend',
      'backend',
      'database',
      'devops',
      'testing',
      'ui-ux',
      'architecture',
      'security',
      'mobile',
      'api-design',
    ];

    allSkillCategories.forEach((category) => {
      const agentsWithSkill = agents.filter((agent) =>
        agent.skills.some((skill) => skill.category === category && skill.proficiency >= 3)
      );
      coverage.set(category, agentsWithSkill.length);
    });

    return coverage;
  }
}

// Types for roster report
export interface AgentRosterReport {
  totalAgents: number;
  activeAgents: number;
  utilizationRate: number;
  totalCapacityHours: number;
  currentLoadHours: number;
  availableHours: number;
  skillCoverage: SkillCoverageMap;
  topPerformers: {
    id: string;
    name: string;
    qualityScore: number;
    tasksCompleted: number;
  }[];
  bottlenecks: {
    id: string;
    name: string;
    currentTasks: number;
    estimatedHours: number;
  }[];
}

type SkillCoverageMap = Map<SkillCategory, number>;

// Export singleton instance
export const agentAssignmentService = new AgentAssignmentService();
