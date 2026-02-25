import { useState, useCallback, useEffect, useMemo } from 'react';
import { createClient } from '@/lib/supabase/client';
import { CodingAgent } from '@/types/agent';
import { AgentSkill, AgentPerformance, AgentWithSkills } from '@/types/agent-skills';
import { Task } from '@/types/task';

export function useAgentSkills(userId: string, agents: CodingAgent[], tasks: Task[]) {
  const [skills, setSkills] = useState<AgentSkill[]>([]);
  const [performance, setPerformance] = useState<AgentPerformance[]>([]);
  const [loading, setLoading] = useState(false);

  const supabase = useMemo(() => createClient(), []);

  const fetchSkills = useCallback(async () => {
    try {
      const { data, error } = await supabase
        .from('agent_skills')
        .select('*')
        .eq('user_id', userId);

      if (error) throw error;

      const converted: AgentSkill[] = (data || []).map((item) => ({
        id: item.id,
        userId: item.user_id,
        agentId: item.agent_id,
        skillName: item.skill_name,
        skillLevel: item.skill_level,
        createdAt: new Date(item.created_at).getTime(),
        updatedAt: new Date(item.updated_at).getTime(),
      }));

      setSkills(converted);
    } catch (error) {
      console.error('Error fetching skills:', error);
    }
  }, [userId, supabase]);

  const fetchPerformance = useCallback(async () => {
    try {
      const { data, error } = await supabase
        .from('agent_performance')
        .select('*')
        .eq('user_id', userId);

      if (error) throw error;

      const converted: AgentPerformance[] = (data || []).map((item) => ({
        id: item.id,
        userId: item.user_id,
        agentId: item.agent_id,
        taskId: item.task_id,
        completionTimeHours: item.completion_time_hours,
        qualityScore: item.quality_score,
        onTime: item.on_time,
        notes: item.notes,
        createdAt: new Date(item.created_at).getTime(),
      }));

      setPerformance(converted);
    } catch (error) {
      console.error('Error fetching performance:', error);
    }
  }, [userId, supabase]);

  useEffect(() => {
    fetchSkills();
    fetchPerformance();
  }, [fetchSkills, fetchPerformance]);

  const updateAgentSkills = useCallback(
    async (agentId: string, newSkills: { skillName: string; skillLevel: number }[]) => {
      setLoading(true);
      try {
        // Delete existing skills for this agent
        const { error: deleteError } = await supabase
          .from('agent_skills')
          .delete()
          .eq('user_id', userId)
          .eq('agent_id', agentId);

        if (deleteError) throw deleteError;

        // Insert new skills
        if (newSkills.length > 0) {
          const skillsToInsert = newSkills.map((skill) => ({
            user_id: userId,
            agent_id: agentId,
            skill_name: skill.skillName,
            skill_level: skill.skillLevel,
          }));

          const { error: insertError } = await supabase
            .from('agent_skills')
            .insert(skillsToInsert);

          if (insertError) throw insertError;
        }

        await fetchSkills();
      } catch (error) {
        console.error('Error updating agent skills:', error);
        throw error;
      } finally {
        setLoading(false);
      }
    },
    [userId, supabase, fetchSkills]
  );

  const agentsWithSkills: AgentWithSkills[] = useMemo(() => {
    return agents.map((agent) => {
      const agentSkills = skills.filter((s) => s.agentId === agent.id);
      const agentPerformance = performance.filter((p) => p.agentId === agent.id);

      let performanceMetrics;
      if (agentPerformance.length > 0) {
        const totalTime = agentPerformance.reduce(
          (sum, p) => sum + (p.completionTimeHours || 0),
          0
        );
        const totalQuality = agentPerformance.reduce(
          (sum, p) => sum + (p.qualityScore || 0),
          0
        );
        const onTimeCount = agentPerformance.filter((p) => p.onTime).length;

        performanceMetrics = {
          averageCompletionTime: totalTime / agentPerformance.length,
          averageQualityScore: totalQuality / agentPerformance.length,
          onTimePercentage: (onTimeCount / agentPerformance.length) * 100,
          totalTasksCompleted: agentPerformance.length,
        };
      }

      return {
        ...agent,
        skills: agentSkills,
        performanceMetrics,
      };
    });
  }, [agents, skills, performance]);

  return {
    agentsWithSkills,
    loading,
    updateAgentSkills,
    fetchSkills,
    fetchPerformance,
  };
}
