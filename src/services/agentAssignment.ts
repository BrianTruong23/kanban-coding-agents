import { AgentWithSkills } from '@/types/agentSkills';
import { Task } from '@/types/task';

/**
 * Service for auto-assigning tasks to agents based on skills and performance
 */
export class AgentAssignmentService {
  /**
   * Find the best agent for a task based on skills and performance
   */
  findBestAgent(task: Task, agents: AgentWithSkills[]): string | undefined {
    if (agents.length === 0) return undefined;

    // Extract required skills from task
    const requiredSkills = this.extractRequiredSkills(task);

    // Score each agent
    const scoredAgents = agents.map((agent) => ({
      agent,
      score: this.calculateAgentScore(agent, requiredSkills, task),
    }));

    // Sort by score (highest first)
    scoredAgents.sort((a, b) => b.score - a.score);

    // Return the best agent (or undefined if no good match)
    const bestMatch = scoredAgents[0];
    return bestMatch && bestMatch.score > 0 ? bestMatch.agent.id : undefined;
  }

  /**
   * Assign multiple tasks to agents optimally
   */
  assignTasks(tasks: Task[], agents: AgentWithSkills[]): Map<string, string> {
    const assignments = new Map<string, string>();
    const agentWorkload = new Map<string, number>();

    // Initialize workload
    agents.forEach((agent) => {
      agentWorkload.set(agent.id, 0);
    });

    // Sort tasks by priority (highest first)
    const sortedTasks = [...tasks].sort((a, b) => b.priority - a.priority);

    // Assign each task
    sortedTasks.forEach((task) => {
      const requiredSkills = this.extractRequiredSkills(task);

      // Score each agent, considering their current workload
      const scoredAgents = agents.map((agent) => {
        const skillScore = this.calculateAgentScore(agent, requiredSkills, task);
        const workload = agentWorkload.get(agent.id) || 0;

        // Penalize agents with high workload
        const workloadPenalty = workload * 0.1;
        const finalScore = Math.max(0, skillScore - workloadPenalty);

        return {
          agent,
          score: finalScore,
        };
      });

      // Sort by score
      scoredAgents.sort((a, b) => b.score - a.score);

      // Assign to best agent
      const bestMatch = scoredAgents[0];
      if (bestMatch && bestMatch.score > 0) {
        assignments.set(task.id, bestMatch.agent.id);
        agentWorkload.set(bestMatch.agent.id, (agentWorkload.get(bestMatch.agent.id) || 0) + 1);
      }
    });

    return assignments;
  }

  /**
   * Suggest agent for a skill-based requirement
   */
  findAgentBySkill(skillName: string, agents: AgentWithSkills[]): string | undefined {
    const matchingAgents = agents
      .map((agent) => {
        const skill = agent.skills.find(
          (s) => s.skillName.toLowerCase() === skillName.toLowerCase()
        );
        return {
          agent,
          proficiency: skill?.proficiencyLevel || 0,
          stats: agent.stats,
        };
      })
      .filter((a) => a.proficiency > 0);

    if (matchingAgents.length === 0) return undefined;

    // Sort by proficiency and performance
    matchingAgents.sort((a, b) => {
      // Primary: proficiency level
      if (b.proficiency !== a.proficiency) {
        return b.proficiency - a.proficiency;
      }

      // Secondary: on-time rate
      const aOnTime = a.stats?.onTimeRate || 0;
      const bOnTime = b.stats?.onTimeRate || 0;
      if (bOnTime !== aOnTime) {
        return bOnTime - aOnTime;
      }

      // Tertiary: quality score
      const aQuality = a.stats?.averageQualityScore || 0;
      const bQuality = b.stats?.averageQualityScore || 0;
      return bQuality - aQuality;
    });

    return matchingAgents[0].agent.id;
  }

  /**
   * Calculate score for an agent given required skills
   */
  private calculateAgentScore(
    agent: AgentWithSkills,
    requiredSkills: string[],
    task: Task
  ): number {
    let score = 0;

    // Skill matching score (0-100 points)
    if (requiredSkills.length > 0) {
      const matchedSkills = requiredSkills.filter((reqSkill) =>
        agent.skills.some((s) => s.skillName.toLowerCase() === reqSkill.toLowerCase())
      );

      const matchRatio = matchedSkills.length / requiredSkills.length;
      score += matchRatio * 50; // Up to 50 points for skill matches

      // Add proficiency bonus
      const totalProficiency = matchedSkills.reduce((sum, reqSkill) => {
        const skill = agent.skills.find((s) => s.skillName.toLowerCase() === reqSkill.toLowerCase());
        return sum + (skill?.proficiencyLevel || 0);
      }, 0);

      const avgProficiency = matchedSkills.length > 0 ? totalProficiency / matchedSkills.length : 0;
      score += avgProficiency * 10; // Up to 50 more points for proficiency (5 * 10)
    }

    // Performance bonus (0-30 points)
    if (agent.stats) {
      // On-time rate bonus
      score += (agent.stats.onTimeRate / 100) * 15;

      // Quality score bonus
      if (agent.stats.averageQualityScore > 0) {
        score += (agent.stats.averageQualityScore / 5) * 15;
      }
    }

    // Priority alignment bonus (0-20 points)
    // High priority tasks benefit from experienced agents
    if (task.priority >= 4 && agent.stats && agent.stats.totalTasks > 10) {
      score += 20;
    }

    return score;
  }

  /**
   * Extract required skills from task
   */
  private extractRequiredSkills(task: Task): string[] {
    const skills: string[] = [];
    const combined = (task.title + ' ' + (task.description || '') + ' ' + task.tags.join(' ')).toLowerCase();

    // Map keywords to skills
    const skillMap: Record<string, string[]> = {
      React: ['react', 'component', 'jsx', 'hooks'],
      'Next.js': ['next.js', 'nextjs', 'next'],
      TypeScript: ['typescript', 'ts', 'types'],
      'UI/UX': ['ui', 'ux', 'design', 'frontend', 'interface', 'styling'],
      CSS: ['css', 'styling', 'tailwind', 'styles'],
      'Node.js': ['node', 'nodejs', 'node.js'],
      Database: ['database', 'sql', 'postgres', 'mysql', 'mongodb', 'db'],
      'API Design': ['api', 'endpoint', 'rest', 'graphql'],
      Backend: ['backend', 'server', 'server-side'],
      'Full Stack': ['full stack', 'fullstack'],
      Testing: ['test', 'testing', 'unit test', 'integration test', 'e2e'],
      DevOps: ['devops', 'deployment', 'ci', 'cd'],
      'CI/CD': ['ci/cd', 'pipeline', 'github actions', 'jenkins'],
      Docker: ['docker', 'container'],
      Kubernetes: ['kubernetes', 'k8s'],
      AWS: ['aws', 'amazon web services', 'cloud'],
      'React Native': ['react native', 'mobile app'],
      Mobile: ['mobile', 'app development'],
      iOS: ['ios', 'swift', 'iphone'],
      Android: ['android', 'kotlin', 'java'],
      SQL: ['sql', 'query', 'queries'],
    };

    // Check for skill matches
    Object.entries(skillMap).forEach(([skill, keywords]) => {
      if (keywords.some((keyword) => combined.includes(keyword))) {
        skills.push(skill);
      }
    });

    // Also add tags as potential skills
    task.tags.forEach((tag) => {
      const capitalizedTag = tag.charAt(0).toUpperCase() + tag.slice(1);
      if (!skills.includes(capitalizedTag)) {
        skills.push(capitalizedTag);
      }
    });

    return [...new Set(skills)]; // Remove duplicates
  }
}

// Export singleton instance
export const agentAssignmentService = new AgentAssignmentService();
