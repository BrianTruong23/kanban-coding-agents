import { CodingAgent } from '@/types/agent';
import { Task } from '@/types/task';
import { AgentSkill, AgentMetrics, TaskRequirement } from '@/types/agent-skills';

interface AssignmentScore {
  agentId: string;
  score: number;
  confidence: number;
  reasoning: string;
  breakdown: {
    skillMatch: number;
    performanceScore: number;
    availabilityScore: number;
    workloadScore: number;
  };
}

/**
 * Auto-assignment service for intelligent agent assignment based on skills,
 * performance history, and current workload
 */
export class AutoAssignmentService {
  /**
   * Calculate the best agent for a given task based on multiple factors
   */
  async calculateBestAgent(
    task: Task,
    agents: CodingAgent[],
    agentSkills: AgentSkill[],
    taskRequirements: TaskRequirement[],
    agentMetrics: AgentMetrics[],
    currentWorkload: Map<string, number>
  ): Promise<AssignmentScore[]> {
    const scores: AssignmentScore[] = [];

    for (const agent of agents) {
      const score = await this.calculateAgentScore(
        agent,
        task,
        agentSkills.filter(s => s.agentId === agent.id),
        taskRequirements,
        agentMetrics.find(m => m.agentId === agent.id),
        currentWorkload.get(agent.id) || 0
      );

      scores.push(score);
    }

    // Sort by total score descending
    return scores.sort((a, b) => b.score - a.score);
  }

  /**
   * Calculate a comprehensive score for an agent-task pairing
   */
  private async calculateAgentScore(
    agent: CodingAgent,
    task: Task,
    agentSkills: AgentSkill[],
    taskRequirements: TaskRequirement[],
    metrics: AgentMetrics | undefined,
    currentWorkload: number
  ): Promise<AssignmentScore> {
    // 1. Skill Match Score (40% weight)
    const skillMatch = this.calculateSkillMatch(agentSkills, taskRequirements);

    // 2. Performance Score (30% weight)
    const performanceScore = this.calculatePerformanceScore(metrics);

    // 3. Availability Score (20% weight)
    const availabilityScore = this.calculateAvailabilityScore(currentWorkload);

    // 4. Workload Balance Score (10% weight)
    const workloadScore = this.calculateWorkloadScore(currentWorkload);

    // Calculate weighted total score
    const totalScore =
      skillMatch * 0.4 +
      performanceScore * 0.3 +
      availabilityScore * 0.2 +
      workloadScore * 0.1;

    // Calculate confidence (based on data availability and skill match)
    const confidence = this.calculateConfidence(
      skillMatch,
      Boolean(metrics),
      taskRequirements.length > 0
    );

    const reasoning = this.generateReasoning(
      agent,
      skillMatch,
      performanceScore,
      availabilityScore,
      workloadScore,
      taskRequirements
    );

    return {
      agentId: agent.id,
      score: totalScore,
      confidence,
      reasoning,
      breakdown: {
        skillMatch,
        performanceScore,
        availabilityScore,
        workloadScore,
      },
    };
  }

  /**
   * Calculate how well agent's skills match task requirements
   */
  private calculateSkillMatch(
    agentSkills: AgentSkill[],
    taskRequirements: TaskRequirement[]
  ): number {
    if (taskRequirements.length === 0) {
      return 0.5; // Neutral score if no requirements specified
    }

    let totalMatch = 0;
    let totalWeight = 0;

    for (const requirement of taskRequirements) {
      // Find matching skill
      const matchingSkill = agentSkills.find(
        s => s.category === requirement.skillCategory &&
             s.name.toLowerCase() === requirement.skillName.toLowerCase()
      );

      // Weight based on importance
      const importanceWeight = {
        'required': 3,
        'preferred': 2,
        'nice-to-have': 1,
      }[requirement.importance];

      totalWeight += importanceWeight;

      if (matchingSkill) {
        // Calculate proficiency match (0-1 scale)
        const proficiencyMatch = Math.min(
          matchingSkill.proficiency / requirement.requiredProficiency,
          1.0
        );

        // Bonus for exceeding requirements
        const exceeds = matchingSkill.proficiency > requirement.requiredProficiency;
        const bonus = exceeds ? 0.1 : 0;

        totalMatch += (proficiencyMatch + bonus) * importanceWeight;
      }
    }

    return totalWeight > 0 ? Math.min(totalMatch / totalWeight, 1.0) : 0.5;
  }

  /**
   * Calculate performance score based on historical metrics
   */
  private calculatePerformanceScore(metrics: AgentMetrics | undefined): number {
    if (!metrics) {
      return 0.5; // Neutral score for new agents
    }

    // Normalize quality score (1-5 to 0-1)
    const qualityScore = (metrics.averageQualityScore - 1) / 4;

    // On-time delivery score
    const onTimeScore = metrics.onTimePercentage / 100;

    // Revision rate (inverse - lower is better)
    const revisionScore = 1 - metrics.revisionRate;

    // Weighted average
    return (
      qualityScore * 0.5 +
      onTimeScore * 0.3 +
      revisionScore * 0.2
    );
  }

  /**
   * Calculate availability based on current workload
   */
  private calculateAvailabilityScore(currentWorkload: number): number {
    // Assume capacity of 5 concurrent tasks
    const maxCapacity = 5;

    if (currentWorkload === 0) return 1.0;
    if (currentWorkload >= maxCapacity) return 0.0;

    return 1 - (currentWorkload / maxCapacity);
  }

  /**
   * Calculate workload balance score (prefer balanced distribution)
   */
  private calculateWorkloadScore(currentWorkload: number): number {
    // Ideal workload is 2-3 tasks
    const idealWorkload = 2.5;

    if (currentWorkload === idealWorkload) return 1.0;

    const distance = Math.abs(currentWorkload - idealWorkload);
    return Math.max(0, 1 - (distance / 5));
  }

  /**
   * Calculate confidence in the assignment recommendation
   */
  private calculateConfidence(
    skillMatch: number,
    hasMetrics: boolean,
    hasRequirements: boolean
  ): number {
    let confidence = 0.5;

    // High skill match increases confidence
    if (skillMatch > 0.8) confidence += 0.3;
    else if (skillMatch > 0.6) confidence += 0.2;
    else if (skillMatch > 0.4) confidence += 0.1;

    // Having metrics increases confidence
    if (hasMetrics) confidence += 0.15;

    // Having requirements increases confidence
    if (hasRequirements) confidence += 0.15;

    return Math.min(confidence, 1.0);
  }

  /**
   * Generate human-readable reasoning for the assignment
   */
  private generateReasoning(
    agent: CodingAgent,
    skillMatch: number,
    performanceScore: number,
    availabilityScore: number,
    workloadScore: number,
    taskRequirements: TaskRequirement[]
  ): string {
    const reasons: string[] = [];

    // Skill match reasoning
    if (skillMatch > 0.8) {
      reasons.push(`${agent.name} has excellent skill match (${Math.round(skillMatch * 100)}%)`);
    } else if (skillMatch > 0.6) {
      reasons.push(`${agent.name} has good skill match (${Math.round(skillMatch * 100)}%)`);
    } else if (skillMatch > 0.4) {
      reasons.push(`${agent.name} has adequate skills (${Math.round(skillMatch * 100)}%)`);
    } else {
      reasons.push(`${agent.name} may need support for some required skills`);
    }

    // Performance reasoning
    if (performanceScore > 0.8) {
      reasons.push('Strong performance history');
    } else if (performanceScore > 0.6) {
      reasons.push('Good performance history');
    }

    // Availability reasoning
    if (availabilityScore > 0.8) {
      reasons.push('High availability');
    } else if (availabilityScore < 0.3) {
      reasons.push('Currently has heavy workload');
    }

    // Specific skill matches
    if (taskRequirements.length > 0) {
      const requiredSkills = taskRequirements
        .filter(r => r.importance === 'required')
        .map(r => r.skillName);

      if (requiredSkills.length > 0) {
        reasons.push(`Required skills: ${requiredSkills.join(', ')}`);
      }
    }

    return reasons.join('. ');
  }

  /**
   * Automatically assign tasks based on the calculated scores
   */
  async autoAssign(
    tasks: Task[],
    agents: CodingAgent[],
    agentSkills: AgentSkill[],
    taskRequirements: TaskRequirement[],
    agentMetrics: AgentMetrics[],
    minConfidence: number = 0.6
  ): Promise<Map<string, string>> {
    const assignments = new Map<string, string>(); // taskId -> agentId
    const workload = new Map<string, number>(); // agentId -> task count

    // Initialize workload
    agents.forEach(agent => workload.set(agent.id, 0));

    // Sort tasks by priority (higher priority first)
    const sortedTasks = [...tasks].sort((a, b) => b.priority - a.priority);

    for (const task of sortedTasks) {
      const taskReqs = taskRequirements.filter(r => r.taskId === task.id);

      const scores = await this.calculateBestAgent(
        task,
        agents,
        agentSkills,
        taskReqs,
        agentMetrics,
        workload
      );

      const bestMatch = scores[0];

      // Only auto-assign if confidence is high enough
      if (bestMatch && bestMatch.confidence >= minConfidence) {
        assignments.set(task.id, bestMatch.agentId);
        workload.set(bestMatch.agentId, (workload.get(bestMatch.agentId) || 0) + 1);
      }
    }

    return assignments;
  }
}

export const autoAssignmentService = new AutoAssignmentService();
