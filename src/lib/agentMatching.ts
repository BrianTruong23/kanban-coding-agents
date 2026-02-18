import { EnhancedAgent, AgentMatchScore } from '@/types/agentSkills';
import { HierarchicalTask } from '@/types/taskHierarchy';

/**
 * Service for matching agents to tasks based on skills, performance, and availability
 */
export class AgentMatchingService {
  /**
   * Find the best agent for a task
   */
  static findBestAgent(
    task: HierarchicalTask,
    agents: EnhancedAgent[]
  ): AgentMatchScore | null {
    const scores = this.scoreAllAgents(task, agents);

    if (scores.length === 0) return null;

    // Sort by score descending
    scores.sort((a, b) => b.score - a.score);

    return scores[0];
  }

  /**
   * Score all agents for a task
   */
  static scoreAllAgents(
    task: HierarchicalTask,
    agents: EnhancedAgent[]
  ): AgentMatchScore[] {
    return agents.map(agent => this.scoreAgent(task, agent));
  }

  /**
   * Score a single agent for a task
   */
  private static scoreAgent(
    task: HierarchicalTask,
    agent: EnhancedAgent
  ): AgentMatchScore {
    const reasons: AgentMatchScore['reasons'] = [];
    let totalScore = 0;

    // 1. Skill matching (40% of total score)
    const skillScore = this.calculateSkillScore(task, agent, reasons);
    totalScore += skillScore * 0.4;

    // 2. Availability (30% of total score)
    const availabilityScore = this.calculateAvailabilityScore(agent, reasons);
    totalScore += availabilityScore * 0.3;

    // 3. Performance metrics (20% of total score)
    const performanceScore = this.calculatePerformanceScore(agent, reasons);
    totalScore += performanceScore * 0.2;

    // 4. Workload balance (10% of total score)
    const workloadScore = this.calculateWorkloadScore(agent, reasons);
    totalScore += workloadScore * 0.1;

    return {
      agentId: agent.id,
      score: Math.round(totalScore),
      reasons
    };
  }

  /**
   * Calculate skill match score
   */
  private static calculateSkillScore(
    task: HierarchicalTask,
    agent: EnhancedAgent,
    reasons: AgentMatchScore['reasons']
  ): number {
    let score = 50; // Base score

    // Extract required skills from task tags and description
    const requiredSkills = this.extractRequiredSkills(task);

    if (requiredSkills.length === 0) {
      reasons.push({
        factor: 'Skills',
        impact: 0,
        description: 'No specific skills required'
      });
      return score;
    }

    // Check agent skills
    const matchingSkills = agent.skills.filter(skill =>
      requiredSkills.some(req =>
        skill.name.toLowerCase().includes(req.toLowerCase()) ||
        req.toLowerCase().includes(skill.name.toLowerCase())
      )
    );

    if (matchingSkills.length > 0) {
      // Calculate average proficiency of matching skills
      const avgProficiency = matchingSkills.reduce((sum, skill) => sum + skill.proficiencyLevel, 0) / matchingSkills.length;
      const skillBonus = (avgProficiency / 5) * 50; // Up to 50 points bonus

      score += skillBonus;
      reasons.push({
        factor: 'Skills',
        impact: skillBonus,
        description: `Matches ${matchingSkills.length} required skill(s) with avg proficiency ${avgProficiency.toFixed(1)}/5`
      });
    } else {
      reasons.push({
        factor: 'Skills',
        impact: -20,
        description: 'No matching skills found'
      });
      score -= 20;
    }

    return Math.max(0, Math.min(100, score));
  }

  /**
   * Calculate availability score
   */
  private static calculateAvailabilityScore(
    agent: EnhancedAgent,
    reasons: AgentMatchScore['reasons']
  ): number {
    const { availability } = agent;

    if (availability.status === 'offline') {
      reasons.push({
        factor: 'Availability',
        impact: -50,
        description: 'Agent is offline'
      });
      return 0;
    }

    if (availability.status === 'busy') {
      reasons.push({
        factor: 'Availability',
        impact: -30,
        description: `Agent is busy (${availability.currentLoad}/${availability.maxLoad} tasks)`
      });
      return 20;
    }

    // Calculate load percentage
    const loadPercentage = (availability.currentLoad / availability.maxLoad) * 100;
    const score = 100 - loadPercentage;

    reasons.push({
      factor: 'Availability',
      impact: score - 50,
      description: `Agent has ${availability.maxLoad - availability.currentLoad} slot(s) available`
    });

    return score;
  }

  /**
   * Calculate performance score
   */
  private static calculatePerformanceScore(
    agent: EnhancedAgent,
    reasons: AgentMatchScore['reasons']
  ): number {
    const { performance } = agent;
    let score = 50; // Base score

    // On-time delivery rate (30 points max)
    const onTimeBonus = performance.onTimeDeliveryRate * 30;
    score += onTimeBonus;

    // Code quality score (20 points max)
    const qualityBonus = (performance.codeQualityScore / 100) * 20;
    score += qualityBonus;

    // Bug rate penalty (up to -20 points)
    const bugPenalty = Math.min(performance.bugRate * 2, 20);
    score -= bugPenalty;

    const overallImpact = score - 50;
    reasons.push({
      factor: 'Performance',
      impact: overallImpact,
      description: `${Math.round(performance.onTimeDeliveryRate * 100)}% on-time, quality ${performance.codeQualityScore}/100`
    });

    return Math.max(0, Math.min(100, score));
  }

  /**
   * Calculate workload balance score
   */
  private static calculateWorkloadScore(
    agent: EnhancedAgent,
    reasons: AgentMatchScore['reasons']
  ): number {
    const { performance } = agent;

    // Prefer agents with fewer tasks in progress
    const score = 100 - (performance.tasksInProgress * 20);

    if (performance.tasksInProgress === 0) {
      reasons.push({
        factor: 'Workload',
        impact: 20,
        description: 'No tasks in progress - can start immediately'
      });
    } else {
      reasons.push({
        factor: 'Workload',
        impact: score - 50,
        description: `Currently working on ${performance.tasksInProgress} task(s)`
      });
    }

    return Math.max(0, Math.min(100, score));
  }

  /**
   * Extract required skills from task
   */
  private static extractRequiredSkills(task: HierarchicalTask): string[] {
    const skills: string[] = [];
    const text = `${task.title} ${task.description} ${task.tags.join(' ')}`.toLowerCase();

    // Frontend skills
    if (text.match(/react|vue|angular|frontend|ui|component|page/)) skills.push('frontend', 'react');
    if (text.match(/next\.?js|nextjs/)) skills.push('Next.js');
    if (text.match(/tailwind|css|styling/)) skills.push('CSS', 'Tailwind');
    if (text.match(/typescript|ts/)) skills.push('TypeScript');

    // Backend skills
    if (text.match(/backend|api|server|endpoint/)) skills.push('backend');
    if (text.match(/node\.?js|nodejs/)) skills.push('Node.js');
    if (text.match(/python/)) skills.push('Python');
    if (text.match(/java(?!script)/)) skills.push('Java');

    // Database skills
    if (text.match(/database|db|sql|postgres|mysql|mongo/)) skills.push('database');
    if (text.match(/postgres|postgresql/)) skills.push('PostgreSQL');
    if (text.match(/supabase/)) skills.push('Supabase');

    // DevOps skills
    if (text.match(/deploy|docker|kubernetes|ci\/cd|devops/)) skills.push('devops', 'Docker');
    if (text.match(/aws|azure|gcp|cloud/)) skills.push('cloud');

    // Testing skills
    if (text.match(/test|testing|jest|cypress|playwright/)) skills.push('testing');

    // Mobile skills
    if (text.match(/mobile|ios|android|react native/)) skills.push('mobile');

    return [...new Set(skills)]; // Remove duplicates
  }

  /**
   * Auto-assign tasks to agents
   */
  static autoAssignTasks(
    tasks: HierarchicalTask[],
    agents: EnhancedAgent[]
  ): Map<string, string> {
    const assignments = new Map<string, string>(); // taskId -> agentId

    // Sort tasks by priority (higher priority first)
    const sortedTasks = [...tasks].sort((a, b) => b.priority - a.priority);

    for (const task of sortedTasks) {
      const bestMatch = this.findBestAgent(task, agents);

      if (bestMatch && bestMatch.score >= 50) { // Only assign if score is reasonable
        assignments.set(task.id, bestMatch.agentId);
      }
    }

    return assignments;
  }

  /**
   * Suggest reassignment if a better agent becomes available
   */
  static suggestReassignment(
    task: HierarchicalTask,
    currentAgentId: string,
    agents: EnhancedAgent[]
  ): { shouldReassign: boolean; suggestedAgent?: AgentMatchScore; improvement?: number } {
    const currentAgent = agents.find(a => a.id === currentAgentId);
    if (!currentAgent) {
      return { shouldReassign: true };
    }

    const currentScore = this.scoreAgent(task, currentAgent);
    const bestMatch = this.findBestAgent(task, agents.filter(a => a.id !== currentAgentId));

    if (bestMatch && bestMatch.score > currentScore.score + 20) { // 20 point threshold
      return {
        shouldReassign: true,
        suggestedAgent: bestMatch,
        improvement: bestMatch.score - currentScore.score
      };
    }

    return { shouldReassign: false };
  }
}
