import { Task } from '@/types/task';
import { AgentWithSkills } from '@/types/agentSkill';
import { SuggestedAssignment } from '@/types/taskBreakdown';

/**
 * Agent assignment service for intelligent task assignment
 */
export class AgentAssignmentService {
  /**
   * Suggest the best agent for a task based on skills and performance
   */
  suggestAgent(task: Task, agents: AgentWithSkills[]): SuggestedAssignment | null {
    if (agents.length === 0) return null;

    const scores = agents.map(agent => ({
      agent,
      score: this.calculateAgentScore(task, agent),
    }));

    // Sort by score descending
    scores.sort((a, b) => b.score - a.score);

    const best = scores[0];
    if (best.score === 0) return null;

    return {
      taskId: task.id,
      agentId: best.agent.id,
      agentName: best.agent.name,
      reason: this.generateAssignmentReason(task, best.agent, best.score),
      confidence: this.normalizeConfidence(best.score),
    };
  }

  /**
   * Suggest agents for multiple tasks
   */
  suggestAgentsForTasks(tasks: Task[], agents: AgentWithSkills[]): SuggestedAssignment[] {
    const suggestions: SuggestedAssignment[] = [];
    const agentWorkload = new Map<string, number>();

    // Initialize workload
    agents.forEach(agent => agentWorkload.set(agent.id, 0));

    // Sort tasks by priority (higher first)
    const sortedTasks = [...tasks].sort((a, b) => b.priority - a.priority);

    for (const task of sortedTasks) {
      const suggestion = this.suggestAgentWithWorkload(task, agents, agentWorkload);
      if (suggestion) {
        suggestions.push(suggestion);
        // Increase workload for assigned agent
        const currentWorkload = agentWorkload.get(suggestion.agentId) || 0;
        agentWorkload.set(suggestion.agentId, currentWorkload + (task.estimatedHours || 4));
      }
    }

    return suggestions;
  }

  /**
   * Calculate agent score for a task considering workload
   */
  private suggestAgentWithWorkload(
    task: Task,
    agents: AgentWithSkills[],
    workload: Map<string, number>
  ): SuggestedAssignment | null {
    if (agents.length === 0) return null;

    const scores = agents.map(agent => {
      const skillScore = this.calculateAgentScore(task, agent);
      const workloadPenalty = (workload.get(agent.id) || 0) / 40; // Penalize based on hours
      const finalScore = Math.max(0, skillScore - workloadPenalty);

      return { agent, score: finalScore };
    });

    scores.sort((a, b) => b.score - a.score);

    const best = scores[0];
    if (best.score === 0) return null;

    return {
      taskId: task.id,
      agentId: best.agent.id,
      agentName: best.agent.name,
      reason: this.generateAssignmentReason(task, best.agent, best.score),
      confidence: this.normalizeConfidence(best.score),
    };
  }

  /**
   * Calculate agent score for a task
   */
  private calculateAgentScore(task: Task, agent: AgentWithSkills): number {
    let score = 0;

    // 1. Match required skills from tags
    const requiredSkills = this.extractRequiredSkills(task);
    for (const requiredSkill of requiredSkills) {
      const agentSkill = agent.skills.find(s =>
        s.skillName.toLowerCase().includes(requiredSkill.toLowerCase()) ||
        requiredSkill.toLowerCase().includes(s.skillName.toLowerCase())
      );

      if (agentSkill) {
        // Score based on proficiency (1-5) and performance
        score += agentSkill.proficiency * 10;
        score += Math.min(agentSkill.performanceScore / 10, 5);
      }
    }

    // 2. Match agent description with task
    if (agent.description) {
      const descMatch = this.calculateTextSimilarity(
        agent.description.toLowerCase(),
        task.description.toLowerCase()
      );
      score += descMatch * 5;
    }

    // 3. Consider task priority
    score += task.priority * 2;

    // 4. Consider risk level - assign experienced agents to risky tasks
    if (task.riskLevel) {
      const avgProficiency = agent.skills.length > 0
        ? agent.skills.reduce((sum, s) => sum + s.proficiency, 0) / agent.skills.length
        : 0;

      if (task.riskLevel === 'critical' || task.riskLevel === 'high') {
        score += avgProficiency * 5;
      }
    }

    // 5. Consider past performance
    const totalTasksCompleted = agent.skills.reduce((sum, s) => sum + s.tasksCompleted, 0);
    score += Math.min(totalTasksCompleted / 5, 10);

    return score;
  }

  /**
   * Extract required skills from task
   */
  private extractRequiredSkills(task: Task): string[] {
    const skills: string[] = [];

    // From tags
    skills.push(...task.tags);

    // From description
    const description = task.description.toLowerCase();
    const commonSkills = [
      'react', 'vue', 'angular', 'typescript', 'javascript',
      'node', 'python', 'java', 'go', 'rust',
      'sql', 'database', 'api', 'backend', 'frontend',
      'css', 'html', 'testing', 'devops', 'docker',
    ];

    for (const skill of commonSkills) {
      if (description.includes(skill)) {
        skills.push(skill);
      }
    }

    return [...new Set(skills)]; // Remove duplicates
  }

  /**
   * Calculate text similarity (simple word overlap)
   */
  private calculateTextSimilarity(text1: string, text2: string): number {
    const words1 = new Set(text1.split(/\s+/).filter(w => w.length > 3));
    const words2 = new Set(text2.split(/\s+/).filter(w => w.length > 3));

    if (words1.size === 0 || words2.size === 0) return 0;

    let overlap = 0;
    words1.forEach(word => {
      if (words2.has(word)) overlap++;
    });

    return overlap / Math.min(words1.size, words2.size);
  }

  /**
   * Generate assignment reason
   */
  private generateAssignmentReason(task: Task, agent: AgentWithSkills, score: number): string {
    const reasons: string[] = [];

    const requiredSkills = this.extractRequiredSkills(task);
    const matchedSkills = requiredSkills.filter(reqSkill =>
      agent.skills.some(agentSkill =>
        agentSkill.skillName.toLowerCase().includes(reqSkill.toLowerCase())
      )
    );

    if (matchedSkills.length > 0) {
      reasons.push(`Has skills: ${matchedSkills.slice(0, 3).join(', ')}`);
    }

    const totalCompleted = agent.skills.reduce((sum, s) => sum + s.tasksCompleted, 0);
    if (totalCompleted > 5) {
      reasons.push(`Completed ${totalCompleted} tasks`);
    }

    if (agent.description) {
      const keywords = this.extractKeywords(agent.description);
      const taskKeywords = this.extractKeywords(task.description);
      const commonKeywords = keywords.filter(k => taskKeywords.includes(k));
      if (commonKeywords.length > 0) {
        reasons.push(`Relevant experience in ${commonKeywords[0]}`);
      }
    }

    if (reasons.length === 0) {
      reasons.push('Best available match');
    }

    return reasons.join('; ');
  }

  /**
   * Extract keywords from text
   */
  private extractKeywords(text: string): string[] {
    const stopWords = new Set(['the', 'and', 'or', 'but', 'in', 'on', 'at', 'to', 'for', 'of', 'with', 'a', 'an']);
    return text
      .toLowerCase()
      .split(/\s+/)
      .filter(word => word.length > 3 && !stopWords.has(word))
      .slice(0, 10);
  }

  /**
   * Normalize confidence score to 0-1
   */
  private normalizeConfidence(score: number): number {
    // Assuming max realistic score is around 100
    return Math.min(score / 100, 1);
  }

  /**
   * Update agent performance after task completion
   */
  updateAgentPerformance(
    agentId: string,
    taskCompleted: boolean,
    taskQuality: number = 3 // 1-5 rating
  ): { performanceScore: number; tasksCompleted: number } {
    // This would typically update the database
    // For now, return calculation logic

    const performanceChange = taskCompleted ? taskQuality * 10 : -10;

    return {
      performanceScore: performanceChange,
      tasksCompleted: taskCompleted ? 1 : 0,
    };
  }

  /**
   * Get workload distribution across agents
   */
  getWorkloadDistribution(tasks: Task[], agents: AgentWithSkills[]): Map<string, {
    agentName: string;
    taskCount: number;
    totalHours: number;
    avgPriority: number;
  }> {
    const distribution = new Map();

    // Initialize
    agents.forEach(agent => {
      distribution.set(agent.id, {
        agentName: agent.name,
        taskCount: 0,
        totalHours: 0,
        avgPriority: 0,
      });
    });

    // Calculate from assigned tasks
    tasks.forEach(task => {
      if (task.assignedAgentId) {
        const current = distribution.get(task.assignedAgentId);
        if (current) {
          current.taskCount++;
          current.totalHours += task.estimatedHours || 4;
          current.avgPriority = (current.avgPriority * (current.taskCount - 1) + task.priority) / current.taskCount;
        }
      }
    });

    return distribution;
  }

  /**
   * Suggest workload rebalancing
   */
  suggestRebalancing(tasks: Task[], agents: AgentWithSkills[]): Array<{
    taskId: string;
    fromAgentId: string | undefined;
    toAgentId: string;
    reason: string;
  }> {
    const suggestions: Array<{
      taskId: string;
      fromAgentId: string | undefined;
      toAgentId: string;
      reason: string;
    }> = [];

    const distribution = this.getWorkloadDistribution(tasks, agents);

    // Find overloaded agents
    const avgWorkload = Array.from(distribution.values())
      .reduce((sum, d) => sum + d.totalHours, 0) / agents.length;

    distribution.forEach((workload, agentId) => {
      if (workload.totalHours > avgWorkload * 1.5) {
        // Agent is overloaded, find tasks to reassign
        const agentTasks = tasks.filter(t => t.assignedAgentId === agentId);
        const lowPriorityTask = agentTasks.find(t => t.priority <= 2);

        if (lowPriorityTask) {
          // Find underloaded agent
          const underloadedAgent = Array.from(distribution.entries())
            .find(([id, w]) => w.totalHours < avgWorkload * 0.8);

          if (underloadedAgent) {
            suggestions.push({
              taskId: lowPriorityTask.id,
              fromAgentId: agentId,
              toAgentId: underloadedAgent[0],
              reason: `Rebalance workload: ${workload.agentName} is overloaded`,
            });
          }
        }
      }
    });

    return suggestions;
  }
}

export const agentAssignmentService = new AgentAssignmentService();
