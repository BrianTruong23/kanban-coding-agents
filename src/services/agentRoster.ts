import {
  AgentSkill,
  AgentPerformanceMetrics,
  ExtendedAgent,
  Ticket,
} from '@/types/breakdown';
import { CodingAgent } from '@/types/agent';
import { createClient } from '@/lib/supabase/client';

export interface AgentMatch {
  agent: ExtendedAgent;
  matchScore: number; // 0-100
  reasons: string[];
}

/**
 * Agent Roster Management Service
 * Handles agent skills, performance tracking, and intelligent assignment
 */
export class AgentRosterService {
  private supabase = createClient();

  /**
   * Get all agents with their skills and performance metrics
   */
  async getExtendedAgents(userId: string): Promise<ExtendedAgent[]> {
    // Fetch agents
    const { data: agents, error: agentsError } = await this.supabase
      .from('agents')
      .select('*')
      .eq('user_id', userId);

    if (agentsError) {
      console.error('Error fetching agents:', agentsError);
      return [];
    }

    // Fetch skills and performance for each agent
    const extendedAgents: ExtendedAgent[] = [];

    for (const agent of agents || []) {
      const skills = await this.getAgentSkills(agent.id);
      const performance = await this.getAgentPerformance(agent.id);

      extendedAgents.push({
        id: agent.id,
        name: agent.name,
        description: agent.description,
        avatar: agent.avatar,
        avatarColor: agent.avatar_color,
        skills,
        performance,
        availability: performance.currentLoad < 80 ? 'available' : 'busy',
        currentLoad: performance.currentLoad,
        createdAt: new Date(agent.created_at).getTime(),
      });
    }

    return extendedAgents;
  }

  /**
   * Get skills for a specific agent
   */
  async getAgentSkills(agentId: string): Promise<AgentSkill[]> {
    const { data, error } = await this.supabase
      .from('agent_skills')
      .select('*')
      .eq('agent_id', agentId);

    if (error) {
      console.error('Error fetching agent skills:', error);
      return [];
    }

    return (data || []).map(skill => ({
      id: skill.id,
      name: skill.name,
      category: skill.category,
      proficiency: skill.proficiency,
    }));
  }

  /**
   * Add a skill to an agent
   */
  async addAgentSkill(
    agentId: string,
    skill: Omit<AgentSkill, 'id'>
  ): Promise<AgentSkill | null> {
    const { data, error } = await this.supabase
      .from('agent_skills')
      .insert({
        agent_id: agentId,
        name: skill.name,
        category: skill.category,
        proficiency: skill.proficiency,
      })
      .select()
      .single();

    if (error) {
      console.error('Error adding agent skill:', error);
      return null;
    }

    return {
      id: data.id,
      name: data.name,
      category: data.category,
      proficiency: data.proficiency,
    };
  }

  /**
   * Update agent skill proficiency
   */
  async updateAgentSkill(skillId: string, proficiency: 1 | 2 | 3 | 4 | 5): Promise<boolean> {
    const { error } = await this.supabase
      .from('agent_skills')
      .update({ proficiency })
      .eq('id', skillId);

    if (error) {
      console.error('Error updating agent skill:', error);
      return false;
    }

    return true;
  }

  /**
   * Remove a skill from an agent
   */
  async removeAgentSkill(skillId: string): Promise<boolean> {
    const { error } = await this.supabase
      .from('agent_skills')
      .delete()
      .eq('id', skillId);

    if (error) {
      console.error('Error removing agent skill:', error);
      return false;
    }

    return true;
  }

  /**
   * Get performance metrics for a specific agent
   */
  async getAgentPerformance(agentId: string): Promise<AgentPerformanceMetrics> {
    const { data, error } = await this.supabase
      .from('agent_performance')
      .select('*')
      .eq('agent_id', agentId)
      .single();

    if (error || !data) {
      // Return default metrics if not found
      return {
        agentId,
        tasksCompleted: 0,
        tasksInProgress: 0,
        averageCompletionTime: 0,
        successRate: 1.0,
        lastActive: Date.now(),
        skillRatings: {},
      };
    }

    return {
      agentId: data.agent_id,
      tasksCompleted: data.tasks_completed,
      tasksInProgress: data.tasks_in_progress,
      averageCompletionTime: parseFloat(data.average_completion_time),
      successRate: parseFloat(data.success_rate),
      lastActive: new Date(data.last_active).getTime(),
      skillRatings: {}, // TODO: Calculate from agent_skills
    };
  }

  /**
   * Update agent performance metrics
   */
  async updateAgentPerformance(
    agentId: string,
    updates: Partial<AgentPerformanceMetrics>
  ): Promise<boolean> {
    const updateData: any = {};

    if (updates.tasksCompleted !== undefined) {
      updateData.tasks_completed = updates.tasksCompleted;
    }
    if (updates.tasksInProgress !== undefined) {
      updateData.tasks_in_progress = updates.tasksInProgress;
    }
    if (updates.averageCompletionTime !== undefined) {
      updateData.average_completion_time = updates.averageCompletionTime;
    }
    if (updates.successRate !== undefined) {
      updateData.success_rate = updates.successRate;
    }
    if (updates.lastActive !== undefined) {
      updateData.last_active = new Date(updates.lastActive).toISOString();
    }

    const { error } = await this.supabase
      .from('agent_performance')
      .update(updateData)
      .eq('agent_id', agentId);

    if (error) {
      console.error('Error updating agent performance:', error);
      return false;
    }

    return true;
  }

  /**
   * Calculate current load for an agent based on assigned tasks
   */
  async calculateAgentLoad(agentId: string): Promise<number> {
    const { data, error } = await this.supabase
      .from('tickets')
      .select('status, estimated_hours')
      .eq('assigned_agent_id', agentId)
      .in('status', ['backlog', 'in-progress']);

    if (error) {
      console.error('Error calculating agent load:', error);
      return 0;
    }

    const totalHours = (data || []).reduce(
      (sum, ticket) => sum + (ticket.estimated_hours || 0),
      0
    );

    // Assume 40 hours per week capacity
    const capacity = 40;
    const load = Math.min(100, Math.round((totalHours / capacity) * 100));

    // Update the load in database
    await this.supabase
      .from('agent_performance')
      .update({ current_load: load })
      .eq('agent_id', agentId);

    return load;
  }

  /**
   * Find the best agent match for a ticket based on skills and performance
   */
  async findBestAgentMatch(ticket: Ticket, agents: ExtendedAgent[]): Promise<AgentMatch[]> {
    const matches: AgentMatch[] = [];

    for (const agent of agents) {
      const { score, reasons } = this.calculateMatchScore(ticket, agent);
      matches.push({
        agent,
        matchScore: score,
        reasons,
      });
    }

    // Sort by match score descending
    matches.sort((a, b) => b.matchScore - a.matchScore);

    return matches;
  }

  /**
   * Calculate how well an agent matches a ticket
   */
  private calculateMatchScore(ticket: Ticket, agent: ExtendedAgent): {
    score: number;
    reasons: string[];
  } {
    let score = 0;
    const reasons: string[] = [];

    // Base score: availability (40 points max)
    if (agent.currentLoad < 50) {
      score += 40;
      reasons.push('Low workload - highly available');
    } else if (agent.currentLoad < 80) {
      score += 20;
      reasons.push('Moderate workload - available');
    } else {
      score += 5;
      reasons.push('High workload - limited availability');
    }

    // Skill matching (40 points max)
    const ticketTags = ticket.tags;
    let skillMatchScore = 0;
    const matchedSkills: string[] = [];

    for (const skill of agent.skills) {
      // Check if skill category matches any ticket tag
      if (ticketTags.includes(skill.category)) {
        skillMatchScore += skill.proficiency * 4; // Max 20 per skill
        matchedSkills.push(`${skill.category} (level ${skill.proficiency})`);
      }
    }

    skillMatchScore = Math.min(40, skillMatchScore);
    score += skillMatchScore;

    if (matchedSkills.length > 0) {
      reasons.push(`Skills: ${matchedSkills.join(', ')}`);
    }

    // Performance history (20 points max)
    const performanceScore = agent.performance.successRate * 20;
    score += performanceScore;

    if (agent.performance.tasksCompleted > 10) {
      reasons.push(
        `Strong track record: ${agent.performance.tasksCompleted} tasks completed, ${Math.round(agent.performance.successRate * 100)}% success rate`
      );
    } else if (agent.performance.tasksCompleted > 0) {
      reasons.push(`${agent.performance.tasksCompleted} tasks completed`);
    }

    // Priority boost: prefer less busy agents for high priority tasks
    if (ticket.priority >= 4 && agent.currentLoad < 60) {
      score += 10;
      reasons.push('Available for high-priority task');
    }

    // If no specific skill match, give small bonus based on versatility
    if (matchedSkills.length === 0 && agent.skills.length > 3) {
      score += 5;
      reasons.push('Versatile skill set');
    }

    return {
      score: Math.min(100, Math.round(score)),
      reasons,
    };
  }

  /**
   * Auto-assign a ticket to the best available agent
   */
  async autoAssignTicket(ticketId: string, userId: string): Promise<string | null> {
    // Fetch the ticket
    const { data: ticketData, error: ticketError } = await this.supabase
      .from('tickets')
      .select('*')
      .eq('id', ticketId)
      .single();

    if (ticketError || !ticketData) {
      console.error('Error fetching ticket:', ticketError);
      return null;
    }

    // Get extended agents
    const agents = await this.getExtendedAgents(userId);

    if (agents.length === 0) {
      console.error('No agents available for assignment');
      return null;
    }

    // Convert DB ticket to Ticket type
    const ticket: Ticket = {
      id: ticketData.id,
      ticketId: ticketData.ticket_id,
      epicId: ticketData.epic_id,
      title: ticketData.title,
      description: ticketData.description || '',
      taskType: ticketData.task_type,
      status: ticketData.status,
      priority: ticketData.priority,
      sprint: ticketData.sprint,
      assignedAgentId: ticketData.assigned_agent_id,
      tags: ticketData.tags || [],
      estimatedHours: ticketData.estimated_hours,
      actualHours: ticketData.actual_hours,
      definitionOfDone: ticketData.definition_of_done || [],
      testNotes: ticketData.test_notes || [],
      riskFlags: ticketData.risk_flags || [],
      createdAt: new Date(ticketData.created_at).getTime(),
      updatedAt: new Date(ticketData.updated_at).getTime(),
      userId: ticketData.user_id,
    };

    // Find best match
    const matches = await this.findBestAgentMatch(ticket, agents);

    if (matches.length === 0) {
      return null;
    }

    const bestMatch = matches[0];

    // Assign the ticket
    const { error: updateError } = await this.supabase
      .from('tickets')
      .update({ assigned_agent_id: bestMatch.agent.id })
      .eq('id', ticketId);

    if (updateError) {
      console.error('Error assigning ticket:', updateError);
      return null;
    }

    // Update agent's task count
    await this.updateAgentPerformance(bestMatch.agent.id, {
      tasksInProgress: bestMatch.agent.performance.tasksInProgress + 1,
      lastActive: Date.now(),
    });

    // Recalculate load
    await this.calculateAgentLoad(bestMatch.agent.id);

    return bestMatch.agent.id;
  }

  /**
   * Update agent performance when a task is completed
   */
  async onTaskCompleted(
    agentId: string,
    success: boolean,
    completionTimeHours: number
  ): Promise<void> {
    const performance = await this.getAgentPerformance(agentId);

    const newTasksCompleted = performance.tasksCompleted + 1;
    const newTasksInProgress = Math.max(0, performance.tasksInProgress - 1);

    // Update average completion time
    const totalTime = performance.averageCompletionTime * performance.tasksCompleted;
    const newAverageTime = (totalTime + completionTimeHours) / newTasksCompleted;

    // Update success rate
    const totalSuccesses = performance.successRate * performance.tasksCompleted;
    const newSuccessRate = (totalSuccesses + (success ? 1 : 0)) / newTasksCompleted;

    await this.updateAgentPerformance(agentId, {
      tasksCompleted: newTasksCompleted,
      tasksInProgress: newTasksInProgress,
      averageCompletionTime: newAverageTime,
      successRate: newSuccessRate,
      lastActive: Date.now(),
    });

    // Recalculate load
    await this.calculateAgentLoad(agentId);
  }
}

// Export singleton instance
export const agentRosterService = new AgentRosterService();
