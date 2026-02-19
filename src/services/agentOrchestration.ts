import { CodingAgent } from '@/types/agent';
import { Task } from '@/types/task';
import { AgentSkill } from '@/types/agentSkill';
import { AgentPerformance } from '@/types/agentPerformance';

interface AgentScore {
  agentId: string;
  score: number;
  matchedSkills: string[];
  averagePerformance: number;
  currentWorkload: number;
}

/**
 * Service for orchestrating agent assignments based on skills and performance
 */
export class AgentOrchestrationService {

  /**
   * Find the best agent for a task based on skills, performance, and workload
   */
  static findBestAgent(
    task: Task,
    agents: CodingAgent[],
    agentSkills: AgentSkill[],
    agentPerformances: AgentPerformance[],
    currentAssignments: Task[]
  ): string | undefined {
    if (agents.length === 0) return undefined;

    const requiredSkills = this.extractRequiredSkills(task);
    const agentScores: AgentScore[] = [];

    for (const agent of agents) {
      const score = this.calculateAgentScore(
        agent,
        requiredSkills,
        agentSkills,
        agentPerformances,
        currentAssignments
      );
      agentScores.push(score);
    }

    // Sort by score (descending)
    agentScores.sort((a, b) => b.score - a.score);

    // Return the best agent (or undefined if no good match)
    return agentScores.length > 0 && agentScores[0].score > 0
      ? agentScores[0].agentId
      : undefined;
  }

  /**
   * Auto-assign agents to multiple tasks
   */
  static autoAssignAgents(
    tasks: Task[],
    agents: CodingAgent[],
    agentSkills: AgentSkill[],
    agentPerformances: AgentPerformance[]
  ): Map<string, string> {
    const assignments = new Map<string, string>(); // taskId -> agentId
    const currentAssignments: Task[] = [];

    // Sort tasks by priority (highest first)
    const sortedTasks = [...tasks].sort((a, b) => b.priority - a.priority);

    for (const task of sortedTasks) {
      const bestAgent = this.findBestAgent(
        task,
        agents,
        agentSkills,
        agentPerformances,
        currentAssignments
      );

      if (bestAgent) {
        assignments.set(task.id, bestAgent);
        // Add to current assignments for workload calculation
        currentAssignments.push({ ...task, assignedAgentId: bestAgent });
      }
    }

    return assignments;
  }

  /**
   * Calculate agent score for a task
   */
  private static calculateAgentScore(
    agent: CodingAgent,
    requiredSkills: string[],
    agentSkills: AgentSkill[],
    agentPerformances: AgentPerformance[],
    currentAssignments: Task[]
  ): AgentScore {
    const agentSkillsMap = agentSkills
      .filter(s => s.agentId === agent.id)
      .reduce((map, skill) => {
        map.set(skill.skillName.toLowerCase(), skill.proficiencyLevel);
        return map;
      }, new Map<string, number>());

    // Calculate skill match score
    let skillScore = 0;
    const matchedSkills: string[] = [];

    if (requiredSkills.length === 0) {
      // No specific skills required, base score
      skillScore = 50;
    } else {
      for (const skill of requiredSkills) {
        const proficiency = agentSkillsMap.get(skill.toLowerCase());
        if (proficiency) {
          skillScore += proficiency * 20; // Max 100 points per skill
          matchedSkills.push(skill);
        }
      }
      // Normalize by required skills
      skillScore = (skillScore / requiredSkills.length) || 0;
    }

    // Calculate performance score
    const agentPerfs = agentPerformances.filter(p => p.agentId === agent.id);
    let performanceScore = 60; // Default middle score

    if (agentPerfs.length > 0) {
      const avgQuality = agentPerfs.reduce((sum, p) => sum + (p.qualityRating || 3), 0) / agentPerfs.length;
      performanceScore = (avgQuality / 5) * 100; // Convert to 0-100 scale
    }

    // Calculate workload penalty
    const workloadCount = currentAssignments.filter(t => t.assignedAgentId === agent.id).length;
    const workloadPenalty = Math.min(workloadCount * 10, 50); // Max 50 point penalty

    // Final score calculation
    const finalScore = (skillScore * 0.5) + (performanceScore * 0.3) - workloadPenalty +
      (matchedSkills.length * 5); // Bonus for matched skills

    return {
      agentId: agent.id,
      score: Math.max(0, finalScore),
      matchedSkills,
      averagePerformance: performanceScore,
      currentWorkload: workloadCount
    };
  }

  /**
   * Extract required skills from task
   */
  private static extractRequiredSkills(task: Task): string[] {
    const skills: Set<string> = new Set();
    const text = `${task.title} ${task.description}`.toLowerCase();

    // Frontend skills
    if (text.match(/react|ui|frontend|component|css|html|tailwind/)) {
      skills.add('react');
      skills.add('frontend');
    }
    if (text.match(/next\.js|nextjs/)) {
      skills.add('nextjs');
    }

    // Backend skills
    if (text.match(/api|backend|server|endpoint|route/)) {
      skills.add('backend');
      skills.add('api');
    }
    if (text.match(/database|db|sql|postgres|supabase/)) {
      skills.add('database');
    }

    // DevOps skills
    if (text.match(/deploy|devops|docker|ci\/cd|infrastructure/)) {
      skills.add('devops');
    }

    // Mobile skills
    if (text.match(/mobile|ios|android|react native/)) {
      skills.add('mobile');
    }

    // Testing
    if (text.match(/test|testing|jest|cypress|e2e/)) {
      skills.add('testing');
    }

    // Check tags as well
    for (const tag of task.tags) {
      const lowerTag = tag.toLowerCase();
      if (lowerTag === 'frontend' || lowerTag === 'backend' || lowerTag === 'database' ||
          lowerTag === 'testing' || lowerTag === 'devops' || lowerTag === 'mobile') {
        skills.add(lowerTag);
      }
    }

    return Array.from(skills);
  }

  /**
   * Get agent statistics
   */
  static getAgentStats(
    agentId: string,
    performances: AgentPerformance[]
  ): {
    totalTasks: number;
    averageQuality: number;
    averageCompletionTime: number;
  } {
    const agentPerfs = performances.filter(p => p.agentId === agentId);

    if (agentPerfs.length === 0) {
      return {
        totalTasks: 0,
        averageQuality: 0,
        averageCompletionTime: 0
      };
    }

    const qualityRatings = agentPerfs.filter(p => p.qualityRating).map(p => p.qualityRating!);
    const completionTimes = agentPerfs.filter(p => p.completionTimeHours).map(p => p.completionTimeHours!);

    return {
      totalTasks: agentPerfs.length,
      averageQuality: qualityRatings.length > 0
        ? qualityRatings.reduce((a, b) => a + b, 0) / qualityRatings.length
        : 0,
      averageCompletionTime: completionTimes.length > 0
        ? completionTimes.reduce((a, b) => a + b, 0) / completionTimes.length
        : 0
    };
  }
}
