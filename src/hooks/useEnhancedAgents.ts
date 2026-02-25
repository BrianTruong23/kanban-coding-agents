import { useState, useEffect, useMemo } from 'react';
import { createClient } from '@/lib/supabase/client';
import { EnhancedAgent, AgentSkill, AgentPerformanceMetrics } from '@/types/agentRoster';

export const useEnhancedAgents = (userId?: string) => {
  const [agents, setAgents] = useState<EnhancedAgent[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  const supabase = useMemo(() => createClient(), []);

  useEffect(() => {
    if (!userId) {
      setLoading(false);
      return;
    }

    fetchAgents();
  }, [userId, supabase]);

  const fetchAgents = async () => {
    try {
      setLoading(true);

      // Fetch agents
      const { data: agentsData, error: agentsError } = await supabase
        .from('agents')
        .select('*')
        .order('created_at', { ascending: true });

      if (agentsError) throw agentsError;

      // Fetch skills for all agents
      const { data: skillsData, error: skillsError } = await supabase
        .from('agent_skills')
        .select('*');

      if (skillsError) {
        console.error('Error fetching skills:', skillsError);
        // Continue without skills if table doesn't exist yet
      }

      // Map agents to EnhancedAgent format
      const enhancedAgents: EnhancedAgent[] = (agentsData || []).map((agent) => {
        const agentSkills: AgentSkill[] = (skillsData || [])
          .filter((skill: any) => skill.agent_id === agent.id)
          .map((skill: any) => ({
            id: skill.id,
            name: skill.skill_name,
            category: skill.category,
            proficiencyLevel: skill.proficiency_level,
          }));

        const performanceMetrics: AgentPerformanceMetrics = {
          agentId: agent.id,
          tasksCompleted: agent.tasks_completed || 0,
          tasksInProgress: agent.tasks_in_progress || 0,
          averageCompletionTime: agent.average_completion_time || 8,
          successRate: agent.success_rate || 1.0,
          qualityScore: agent.quality_score || 4.0,
          lastActive: agent.last_active ? new Date(agent.last_active).getTime() : Date.now(),
          workload: agent.workload || 0,
        };

        return {
          id: agent.id,
          name: agent.name,
          description: agent.description,
          avatar: agent.avatar,
          avatarColor: agent.avatar_color,
          skills: agentSkills,
          specializations: agent.specializations || [],
          availability: agent.availability || 'available',
          maxConcurrentTasks: agent.max_concurrent_tasks || 3,
          performanceMetrics,
          createdAt: new Date(agent.created_at).getTime(),
          userId: agent.user_id,
        };
      });

      setAgents(enhancedAgents);
      setError(null);
    } catch (err) {
      console.error('Error fetching enhanced agents:', err);
      setError(err instanceof Error ? err : new Error('Failed to fetch agents'));
    } finally {
      setLoading(false);
    }
  };

  const updateAgent = async (agent: EnhancedAgent) => {
    try {
      const { error: updateError } = await supabase
        .from('agents')
        .update({
          name: agent.name,
          description: agent.description,
          avatar: agent.avatar,
          avatar_color: agent.avatarColor,
          specializations: agent.specializations,
          availability: agent.availability,
          max_concurrent_tasks: agent.maxConcurrentTasks,
          tasks_completed: agent.performanceMetrics.tasksCompleted,
          tasks_in_progress: agent.performanceMetrics.tasksInProgress,
          average_completion_time: agent.performanceMetrics.averageCompletionTime,
          success_rate: agent.performanceMetrics.successRate,
          quality_score: agent.performanceMetrics.qualityScore,
          workload: agent.performanceMetrics.workload,
          last_active: new Date(agent.performanceMetrics.lastActive).toISOString(),
        })
        .eq('id', agent.id);

      if (updateError) throw updateError;

      // Update local state
      setAgents((prev) =>
        prev.map((a) => (a.id === agent.id ? agent : a))
      );

      return { success: true };
    } catch (err) {
      console.error('Error updating agent:', err);
      return { success: false, error: err };
    }
  };

  const deleteAgent = async (agentId: string) => {
    try {
      const { error: deleteError } = await supabase
        .from('agents')
        .delete()
        .eq('id', agentId);

      if (deleteError) throw deleteError;

      // Update local state
      setAgents((prev) => prev.filter((a) => a.id !== agentId));

      return { success: true };
    } catch (err) {
      console.error('Error deleting agent:', err);
      return { success: false, error: err };
    }
  };

  return {
    agents,
    loading,
    error,
    fetchAgents,
    updateAgent,
    deleteAgent,
  };
};
