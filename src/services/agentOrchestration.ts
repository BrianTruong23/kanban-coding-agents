import { Task } from '@/types/task';
import { CodingAgent } from '@/types/agent';
import { AgentSkill, AgentPerformance, AutoAssignmentConfig, SkillCategory } from '@/types/agentSkills';

export interface AgentWithSkills extends CodingAgent {
  skills: AgentSkill[];
  performance?: AgentPerformance;
}

export interface SkillRequirement {
  category: SkillCategory;
  minProficiency: 1 | 2 | 3 | 4 | 5;
  weight: number; // How important this skill is (0-1)
}

export interface AssignmentScore {
  agentId: string;
  score: number;
  breakdown: {
    skillMatch: number;
    workload: number;
    performance: number;
    availability: number;
  };
}

/**
 * Automatically assigns tasks to agents based on skills, workload, and performance
 */
export class AgentOrchestrator {
  private agents: AgentWithSkills[];
  private tasks: Task[];
  private config: AutoAssignmentConfig;

  constructor(
    agents: AgentWithSkills[],
    tasks: Task[],
    config: AutoAssignmentConfig = {
      enabled: true,
      considerSkills: true,
      considerWorkload: true,
      considerPerformance: true,
      balanceWorkload: true,
    }
  ) {
    this.agents = agents;
    this.tasks = tasks;
    this.config = config;
  }

  /**
   * Finds the best agent for a given task based on multiple criteria
   */
  findBestAgent(task: Task, skillRequirements?: SkillRequirement[]): AssignmentScore | null {
    if (!this.config.enabled || this.agents.length === 0) {
      return null;
    }

    const scores = this.agents.map(agent => {
      const score = this.calculateAgentScore(agent, task, skillRequirements);
      return score;
    });

    // Sort by score descending
    scores.sort((a, b) => b.score - a.score);

    // Return the best match if score is above threshold
    return scores[0].score > 0.3 ? scores[0] : null;
  }

  /**
   * Auto-assigns multiple tasks to agents, optimizing for overall team efficiency
   */
  autoAssignTasks(
    unassignedTasks: Task[],
    skillRequirements?: Map<string, SkillRequirement[]>
  ): Map<string, string> {
    // taskId -> agentId
    const assignments = new Map<string, string>();

    if (!this.config.enabled) {
      return assignments;
    }

    // Sort tasks by priority (highest first)
    const sortedTasks = [...unassignedTasks].sort((a, b) => b.priority - a.priority);

    // Track workload as we assign
    const agentWorkload = new Map<string, number>();
    this.agents.forEach(agent => {
      const currentWorkload = this.getAgentWorkload(agent.id);
      agentWorkload.set(agent.id, currentWorkload);
    });

    for (const task of sortedTasks) {
      const taskSkillReqs = skillRequirements?.get(task.id);
      const bestMatch = this.findBestAgent(task, taskSkillReqs);

      if (bestMatch) {
        assignments.set(task.id, bestMatch.agentId);
        // Update workload
        const currentLoad = agentWorkload.get(bestMatch.agentId) || 0;
        agentWorkload.set(bestMatch.agentId, currentLoad + (task.estimatedHours || 8));
      }
    }

    return assignments;
  }

  /**
   * Calculates a score for how well an agent matches a task
   */
  private calculateAgentScore(
    agent: AgentWithSkills,
    task: Task,
    skillRequirements?: SkillRequirement[]
  ): AssignmentScore {
    const breakdown = {
      skillMatch: 0,
      workload: 0,
      performance: 0,
      availability: 1,
    };

    // 1. Skill matching (40% weight)
    if (this.config.considerSkills && skillRequirements) {
      breakdown.skillMatch = this.calculateSkillMatch(agent, skillRequirements);
    } else {
      breakdown.skillMatch = 0.5; // Neutral if not considering skills
    }

    // 2. Workload balance (30% weight)
    if (this.config.considerWorkload || this.config.balanceWorkload) {
      breakdown.workload = this.calculateWorkloadScore(agent);
    } else {
      breakdown.workload = 0.5; // Neutral
    }

    // 3. Performance (20% weight)
    if (this.config.considerPerformance && agent.performance) {
      breakdown.performance = this.calculatePerformanceScore(agent.performance);
    } else {
      breakdown.performance = 0.5; // Neutral
    }

    // 4. Availability (10% weight)
    breakdown.availability = 1; // Simplified - could check calendar, current task status, etc.

    // Calculate weighted total score
    const totalScore =
      breakdown.skillMatch * 0.4 +
      breakdown.workload * 0.3 +
      breakdown.performance * 0.2 +
      breakdown.availability * 0.1;

    return {
      agentId: agent.id,
      score: totalScore,
      breakdown,
    };
  }

  /**
   * Calculates how well an agent's skills match the requirements
   */
  private calculateSkillMatch(agent: AgentWithSkills, requirements: SkillRequirement[]): number {
    if (requirements.length === 0) {
      return 0.5; // Neutral if no requirements
    }

    let totalWeightedMatch = 0;
    let totalWeight = 0;

    for (const req of requirements) {
      const agentSkill = agent.skills.find(s => {
        // Match by category (simplified - in production would match by skill ID)
        return this.getSkillCategory(s.skillId) === req.category;
      });

      totalWeight += req.weight;

      if (agentSkill) {
        // Calculate match based on proficiency level
        const proficiencyMatch = Math.min(agentSkill.proficiencyLevel / req.minProficiency, 1.2);
        totalWeightedMatch += proficiencyMatch * req.weight;
      }
      // If agent doesn't have the skill, no points added
    }

    return totalWeight > 0 ? Math.min(totalWeightedMatch / totalWeight, 1) : 0.5;
  }

  /**
   * Calculates workload score (higher score = less busy)
   */
  private calculateWorkloadScore(agent: AgentWithSkills): number {
    const currentWorkload = this.getAgentWorkload(agent.id);
    const maxWorkload = 40; // Max hours per week

    if (currentWorkload >= maxWorkload) {
      return 0; // Fully loaded
    }

    // Linear scale: less workload = higher score
    return 1 - (currentWorkload / maxWorkload);
  }

  /**
   * Gets current workload for an agent (hours of assigned incomplete tasks)
   */
  private getAgentWorkload(agentId: string): number {
    const agentTasks = this.tasks.filter(
      t => t.assignedAgentId === agentId && t.status !== 'done'
    );

    return agentTasks.reduce((total, task) => {
      return total + (task.estimatedHours || 8);
    }, 0);
  }

  /**
   * Calculates performance score based on historical metrics
   */
  private calculatePerformanceScore(performance: AgentPerformance): number {
    const onTimeRate = performance.tasksCompleted > 0
      ? performance.tasksOnTime / performance.tasksCompleted
      : 0.5;

    const qualityScore = performance.qualityScore / 100;

    // Weighted average: 60% quality, 40% on-time delivery
    return qualityScore * 0.6 + onTimeRate * 0.4;
  }

  /**
   * Simplified skill category lookup
   * In production, this would query the skills table
   */
  private getSkillCategory(skillId: string): SkillCategory {
    // Mock implementation - would lookup from database
    const skillMap: Record<string, SkillCategory> = {
      'react': 'frontend',
      'vue': 'frontend',
      'angular': 'frontend',
      'node': 'backend',
      'python': 'backend',
      'postgres': 'database',
      'mongodb': 'database',
      'docker': 'devops',
      'kubernetes': 'devops',
      'react-native': 'mobile',
      'flutter': 'mobile',
    };

    return skillMap[skillId.toLowerCase()] || 'frontend';
  }

  /**
   * Analyzes task tags to infer required skills
   */
  static inferSkillRequirements(task: Task): SkillRequirement[] {
    const requirements: SkillRequirement[] = [];
    const tags = task.tags.map(t => t.toLowerCase());

    // Map tags to skill requirements
    if (tags.includes('frontend') || tags.includes('ui') || tags.includes('react')) {
      requirements.push({
        category: 'frontend',
        minProficiency: 3,
        weight: 1.0,
      });
    }

    if (tags.includes('backend') || tags.includes('api') || tags.includes('server')) {
      requirements.push({
        category: 'backend',
        minProficiency: 3,
        weight: 1.0,
      });
    }

    if (tags.includes('database') || tags.includes('sql') || tags.includes('data')) {
      requirements.push({
        category: 'database',
        minProficiency: 3,
        weight: 0.8,
      });
    }

    if (tags.includes('devops') || tags.includes('deployment') || tags.includes('ci/cd')) {
      requirements.push({
        category: 'devops',
        minProficiency: 3,
        weight: 0.7,
      });
    }

    if (tags.includes('mobile') || tags.includes('ios') || tags.includes('android')) {
      requirements.push({
        category: 'mobile',
        minProficiency: 3,
        weight: 1.0,
      });
    }

    if (tags.includes('testing') || tags.includes('qa')) {
      requirements.push({
        category: 'testing',
        minProficiency: 2,
        weight: 0.6,
      });
    }

    if (tags.includes('design') || tags.includes('ux')) {
      requirements.push({
        category: 'design',
        minProficiency: 2,
        weight: 0.7,
      });
    }

    // Default if no tags matched
    if (requirements.length === 0) {
      requirements.push({
        category: 'frontend',
        minProficiency: 2,
        weight: 0.5,
      });
    }

    return requirements;
  }

  /**
   * Suggests skill development based on task requirements and agent gaps
   */
  suggestSkillDevelopment(agent: AgentWithSkills, upcomingTasks: Task[]): {
    skill: SkillCategory;
    reason: string;
    priority: 'high' | 'medium' | 'low';
  }[] {
    const suggestions: {
      skill: SkillCategory;
      reason: string;
      priority: 'high' | 'medium' | 'low';
    }[] = [];

    // Analyze upcoming task requirements
    const skillDemand = new Map<SkillCategory, number>();

    for (const task of upcomingTasks) {
      const requirements = AgentOrchestrator.inferSkillRequirements(task);
      for (const req of requirements) {
        const current = skillDemand.get(req.category) || 0;
        skillDemand.set(req.category, current + req.weight);
      }
    }

    // Find gaps
    for (const [skill, demand] of skillDemand.entries()) {
      const hasSkill = agent.skills.some(s => this.getSkillCategory(s.skillId) === skill);

      if (!hasSkill && demand > 2) {
        suggestions.push({
          skill,
          reason: `High demand for ${skill} skills in upcoming tasks`,
          priority: 'high',
        });
      } else if (hasSkill) {
        const agentSkill = agent.skills.find(s => this.getSkillCategory(s.skillId) === skill);
        if (agentSkill && agentSkill.proficiencyLevel < 4 && demand > 1) {
          suggestions.push({
            skill,
            reason: `Improve ${skill} proficiency for better task matching`,
            priority: 'medium',
          });
        }
      }
    }

    return suggestions;
  }
}

/**
 * Validates task dependencies to prevent circular dependencies
 */
export function validateDependencies(
  dependencies: Array<{ sourceTaskId: string; targetTaskId: string }>
): { valid: boolean; error?: string } {
  // Build adjacency list
  const graph = new Map<string, Set<string>>();

  for (const dep of dependencies) {
    if (!graph.has(dep.sourceTaskId)) {
      graph.set(dep.sourceTaskId, new Set());
    }
    graph.get(dep.sourceTaskId)!.add(dep.targetTaskId);
  }

  // Check for cycles using DFS
  const visited = new Set<string>();
  const recStack = new Set<string>();

  function hasCycle(node: string): boolean {
    visited.add(node);
    recStack.add(node);

    const neighbors = graph.get(node) || new Set();
    for (const neighbor of neighbors) {
      if (!visited.has(neighbor)) {
        if (hasCycle(neighbor)) {
          return true;
        }
      } else if (recStack.has(neighbor)) {
        return true; // Cycle detected
      }
    }

    recStack.delete(node);
    return false;
  }

  for (const node of graph.keys()) {
    if (!visited.has(node)) {
      if (hasCycle(node)) {
        return {
          valid: false,
          error: 'Circular dependency detected',
        };
      }
    }
  }

  return { valid: true };
}
