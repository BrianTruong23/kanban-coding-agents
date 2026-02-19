import type { CodingAgent, AgentSkill, AgentPerformance, AgentWithSkills } from '@/types/agent';
import type { Task } from '@/types/task';
import type { GeneratedStory } from '@/types/breakdown';

/**
 * Service for intelligent agent assignment based on skills and performance
 */
export class AgentAssignmentService {
  /**
   * Calculate agent performance metrics
   */
  calculatePerformanceMetrics(
    performances: AgentPerformance[]
  ): {
    averageQuality: number;
    averageCompletionTime: number;
    onTimePercentage: number;
    tasksCompleted: number;
  } {
    if (performances.length === 0) {
      return {
        averageQuality: 0,
        averageCompletionTime: 0,
        onTimePercentage: 0,
        tasksCompleted: 0
      };
    }

    const qualityRatings = performances.filter(p => p.qualityRating).map(p => p.qualityRating!);
    const completionTimes = performances.filter(p => p.completionTimeHours).map(p => p.completionTimeHours!);
    const onTimeCount = performances.filter(p => p.onTime).length;

    return {
      averageQuality: qualityRatings.length > 0
        ? qualityRatings.reduce((a, b) => a + b, 0) / qualityRatings.length
        : 0,
      averageCompletionTime: completionTimes.length > 0
        ? completionTimes.reduce((a, b) => a + b, 0) / completionTimes.length
        : 0,
      onTimePercentage: (onTimeCount / performances.length) * 100,
      tasksCompleted: performances.length
    };
  }

  /**
   * Find the best agent for a task based on skills and performance
   */
  findBestAgent(
    task: Task | GeneratedStory,
    agents: AgentWithSkills[],
    currentWorkload: Map<string, number> // agentId -> number of assigned tasks
  ): {
    agentId: string;
    score: number;
    reasoning: string;
  } | null {
    if (agents.length === 0) {
      return null;
    }

    const requiredSkills = 'requiredSkills' in task ? task.requiredSkills : this.inferSkillsFromTask(task as Task);
    const scores = agents.map(agent => {
      const score = this.calculateAgentScore(agent, requiredSkills, currentWorkload.get(agent.id) || 0);
      return {
        agent,
        score: score.totalScore,
        breakdown: score
      };
    });

    // Sort by score (highest first)
    scores.sort((a, b) => b.score - a.score);

    const best = scores[0];
    if (best.score === 0) {
      return null;
    }

    return {
      agentId: best.agent.id,
      score: best.score,
      reasoning: this.generateReasoning(best.agent, best.breakdown, requiredSkills)
    };
  }

  /**
   * Auto-assign multiple tasks to agents optimally
   */
  autoAssignTasks(
    tasks: (Task | GeneratedStory)[],
    agents: AgentWithSkills[]
  ): Map<string, string> {
    // taskId/title -> agentId
    const assignments = new Map<string, string>();
    const workload = new Map<string, number>();

    // Initialize workload
    agents.forEach(agent => workload.set(agent.id, 0));

    // Sort tasks by priority (highest first)
    const sortedTasks = [...tasks].sort((a, b) => b.priority - a.priority);

    sortedTasks.forEach(task => {
      const assignment = this.findBestAgent(task, agents, workload);
      if (assignment) {
        const taskKey = 'id' in task ? task.id : task.title;
        assignments.set(taskKey, assignment.agentId);
        workload.set(assignment.agentId, (workload.get(assignment.agentId) || 0) + 1);
      }
    });

    return assignments;
  }

  /**
   * Calculate agent score for a specific task
   */
  private calculateAgentScore(
    agent: AgentWithSkills,
    requiredSkills: string[],
    currentWorkload: number
  ): {
    totalScore: number;
    skillMatchScore: number;
    performanceScore: number;
    workloadScore: number;
  } {
    // Skill match score (0-50 points)
    const skillMatchScore = this.calculateSkillMatch(agent.skills, requiredSkills);

    // Performance score (0-30 points)
    const performanceScore = this.calculatePerformanceScore(agent.performanceMetrics);

    // Workload score (0-20 points) - inverse relationship
    const workloadScore = this.calculateWorkloadScore(currentWorkload);

    return {
      totalScore: skillMatchScore + performanceScore + workloadScore,
      skillMatchScore,
      performanceScore,
      workloadScore
    };
  }

  private calculateSkillMatch(agentSkills: AgentSkill[], requiredSkills: string[]): number {
    if (requiredSkills.length === 0) {
      return 25; // Neutral score if no specific skills required
    }

    let matchScore = 0;
    let totalPossible = requiredSkills.length * 10; // Max 10 points per skill

    requiredSkills.forEach(requiredSkill => {
      const skill = agentSkills.find(s =>
        s.skillName.toLowerCase() === requiredSkill.toLowerCase() ||
        this.isRelatedSkill(s.skillName, requiredSkill)
      );

      if (skill) {
        // Score based on proficiency level (1-5)
        matchScore += skill.proficiencyLevel * 2;
      }
    });

    // Normalize to 0-50 range
    return Math.min(50, (matchScore / totalPossible) * 50);
  }

  private isRelatedSkill(agentSkill: string, requiredSkill: string): boolean {
    const skillMap: Record<string, string[]> = {
      'React': ['Frontend', 'UI/UX', 'TypeScript', 'JavaScript'],
      'Frontend': ['React', 'UI/UX', 'CSS', 'HTML'],
      'Backend': ['API Development', 'Node.js', 'Database'],
      'TypeScript': ['JavaScript', 'Frontend', 'Backend'],
      'Database': ['SQL', 'Backend', 'Data Modeling'],
      'Testing': ['QA', 'Automation'],
      'DevOps': ['CI/CD', 'Docker', 'Infrastructure']
    };

    const agentLower = agentSkill.toLowerCase();
    const requiredLower = requiredSkill.toLowerCase();

    // Check if either skill is related to the other
    const agentRelated = skillMap[agentSkill] || [];
    const requiredRelated = skillMap[requiredSkill] || [];

    return agentRelated.some(s => s.toLowerCase() === requiredLower) ||
           requiredRelated.some(s => s.toLowerCase() === agentLower);
  }

  private calculatePerformanceScore(metrics?: {
    averageQuality: number;
    averageCompletionTime: number;
    onTimePercentage: number;
    tasksCompleted: number;
  }): number {
    if (!metrics || metrics.tasksCompleted === 0) {
      return 15; // Neutral score for new agents
    }

    // Quality (0-15 points) - based on 1-5 rating
    const qualityScore = (metrics.averageQuality / 5) * 15;

    // On-time delivery (0-10 points)
    const onTimeScore = (metrics.onTimePercentage / 100) * 10;

    // Experience bonus (0-5 points) - based on tasks completed
    const experienceScore = Math.min(5, metrics.tasksCompleted / 10);

    return qualityScore + onTimeScore + experienceScore;
  }

  private calculateWorkloadScore(currentWorkload: number): number {
    // Inverse relationship: fewer tasks = higher score
    // 0 tasks = 20 points, 5+ tasks = 0 points
    return Math.max(0, 20 - (currentWorkload * 4));
  }

  private generateReasoning(
    agent: AgentWithSkills,
    breakdown: {
      skillMatchScore: number;
      performanceScore: number;
      workloadScore: number;
    },
    requiredSkills: string[]
  ): string {
    const reasons: string[] = [];

    if (breakdown.skillMatchScore > 35) {
      reasons.push(`Strong match for required skills: ${requiredSkills.join(', ')}`);
    } else if (breakdown.skillMatchScore > 20) {
      reasons.push(`Good match for most required skills`);
    }

    if (agent.performanceMetrics && agent.performanceMetrics.averageQuality >= 4) {
      reasons.push(`Excellent track record (${agent.performanceMetrics.averageQuality.toFixed(1)}/5.0 avg quality)`);
    }

    if (breakdown.workloadScore > 15) {
      reasons.push(`Low current workload`);
    } else if (breakdown.workloadScore < 5) {
      reasons.push(`Higher workload but best skill match`);
    }

    return reasons.join('. ') || 'Selected based on overall suitability';
  }

  private inferSkillsFromTask(task: Task): string[] {
    const skills: string[] = [];
    const titleLower = task.title.toLowerCase();
    const descLower = task.description.toLowerCase();
    const combined = `${titleLower} ${descLower}`;

    // Infer skills from task content
    const skillKeywords: Record<string, string[]> = {
      'React': ['react', 'component', 'ui', 'frontend'],
      'Backend': ['api', 'backend', 'server', 'endpoint'],
      'Database': ['database', 'schema', 'sql', 'migration'],
      'TypeScript': ['typescript', 'type', 'interface'],
      'Testing': ['test', 'testing', 'qa'],
      'DevOps': ['deploy', 'ci/cd', 'docker', 'infrastructure'],
      'UI/UX': ['design', 'styling', 'ux', 'interface']
    };

    Object.entries(skillKeywords).forEach(([skill, keywords]) => {
      if (keywords.some(keyword => combined.includes(keyword))) {
        skills.push(skill);
      }
    });

    // Infer from tags
    task.tags.forEach(tag => {
      const tagLower = tag.toLowerCase();
      if (tagLower === 'frontend') skills.push('React', 'TypeScript');
      if (tagLower === 'backend') skills.push('Backend', 'API Development');
      if (tagLower === 'database') skills.push('Database');
    });

    return [...new Set(skills)]; // Remove duplicates
  }

  /**
   * Suggest skills that should be added to the team
   */
  suggestMissingSkills(
    tasks: (Task | GeneratedStory)[],
    agents: AgentWithSkills[]
  ): Array<{
    skill: string;
    demand: number;
    currentCoverage: number;
  }> {
    const skillDemand = new Map<string, number>();
    const skillCoverage = new Map<string, number>();

    // Count skill demand from tasks
    tasks.forEach(task => {
      const requiredSkills = 'requiredSkills' in task ? task.requiredSkills : this.inferSkillsFromTask(task as Task);
      requiredSkills.forEach(skill => {
        skillDemand.set(skill, (skillDemand.get(skill) || 0) + 1);
      });
    });

    // Count skill coverage from agents
    agents.forEach(agent => {
      agent.skills.forEach(skill => {
        skillCoverage.set(skill.skillName, (skillCoverage.get(skill.skillName) || 0) + skill.proficiencyLevel);
      });
    });

    // Find gaps
    const gaps: Array<{
      skill: string;
      demand: number;
      currentCoverage: number;
    }> = [];

    skillDemand.forEach((demand, skill) => {
      const coverage = skillCoverage.get(skill) || 0;
      const coverageRatio = coverage / demand;

      if (coverageRatio < 2) { // Less than 2 proficiency points per demand
        gaps.push({
          skill,
          demand,
          currentCoverage: coverage
        });
      }
    });

    // Sort by gap severity
    gaps.sort((a, b) => {
      const gapA = a.demand - a.currentCoverage;
      const gapB = b.demand - b.currentCoverage;
      return gapB - gapA;
    });

    return gaps;
  }
}

// Export singleton instance
export const agentAssignmentService = new AgentAssignmentService();
