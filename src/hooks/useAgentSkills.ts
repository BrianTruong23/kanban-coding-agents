'use client';

import { useState, useEffect, useCallback, useMemo } from 'react';
import { AgentSkill, AgentPerformanceMetrics } from '@/types/agentSkills';
import { createClient } from '@/lib/supabase/client';
import { useAuth } from '@/contexts/AuthContext';

interface DbAgentSkill {
  id: string;
  agent_id: string;
  skill_name: string;
  category: string;
  proficiency_level: number;
  created_at: string;
  updated_at: string;
}

interface DbAgentPerformanceMetrics {
  id: string;
  agent_id: string;
  tasks_completed: number;
  tasks_in_progress: number;
  average_completion_time: number;
  success_rate: number;
  last_activity_at: string | null;
  created_at: string;
  updated_at: string;
}

const mapDbSkillToSkill = (dbSkill: DbAgentSkill): AgentSkill => ({
  id: dbSkill.id,
  agentId: dbSkill.agent_id,
  skillName: dbSkill.skill_name,
  category: dbSkill.category as AgentSkill['category'],
  proficiencyLevel: dbSkill.proficiency_level as AgentSkill['proficiencyLevel'],
  createdAt: new Date(dbSkill.created_at).getTime(),
  updatedAt: new Date(dbSkill.updated_at).getTime(),
});

const mapDbMetricsToMetrics = (dbMetrics: DbAgentPerformanceMetrics): AgentPerformanceMetrics => ({
  id: dbMetrics.id,
  agentId: dbMetrics.agent_id,
  tasksCompleted: dbMetrics.tasks_completed,
  tasksInProgress: dbMetrics.tasks_in_progress,
  averageCompletionTime: dbMetrics.average_completion_time,
  successRate: dbMetrics.success_rate,
  lastActivityAt: dbMetrics.last_activity_at ? new Date(dbMetrics.last_activity_at).getTime() : 0,
  createdAt: new Date(dbMetrics.created_at).getTime(),
  updatedAt: new Date(dbMetrics.updated_at).getTime(),
});

export const useAgentSkills = () => {
  const [skills, setSkills] = useState<AgentSkill[]>([]);
  const [metrics, setMetrics] = useState<AgentPerformanceMetrics[]>([]);
  const [hasFetched, setHasFetched] = useState(false);
  const { user, isLoading: authLoading } = useAuth();
  const supabase = useMemo(() => createClient(), []);

  useEffect(() => {
    if (authLoading || hasFetched || !user) return;

    const fetchData = async () => {
      // Fetch skills
      const { data: skillsData, error: skillsError } = await supabase
        .from('agent_skills')
        .select('*')
        .order('created_at', { ascending: true });

      if (skillsError) {
        console.error('Error fetching agent skills:', skillsError);
      } else {
        setSkills((skillsData || []).map(mapDbSkillToSkill));
      }

      // Fetch metrics
      const { data: metricsData, error: metricsError } = await supabase
        .from('agent_performance_metrics')
        .select('*');

      if (metricsError) {
        console.error('Error fetching agent metrics:', metricsError);
      } else {
        setMetrics((metricsData || []).map(mapDbMetricsToMetrics));
      }

      setHasFetched(true);
    };

    fetchData();
  }, [user, authLoading, hasFetched, supabase]);

  const addSkill = useCallback(async (skill: Omit<AgentSkill, 'id' | 'createdAt' | 'updatedAt'>) => {
    if (!user) return;

    const { data, error } = await supabase
      .from('agent_skills')
      .insert({
        agent_id: skill.agentId,
        skill_name: skill.skillName,
        category: skill.category,
        proficiency_level: skill.proficiencyLevel,
      })
      .select()
      .single();

    if (error) {
      console.error('Error adding skill:', error);
      throw new Error(error.message);
    }

    if (data) {
      setSkills((prev) => [...prev, mapDbSkillToSkill(data)]);
    }
  }, [user, supabase]);

  const updateSkill = useCallback(async (skillId: string, updates: Partial<Pick<AgentSkill, 'skillName' | 'category' | 'proficiencyLevel'>>) => {
    if (!user) return;

    const dbUpdates: Record<string, unknown> = {};
    if (updates.skillName !== undefined) dbUpdates.skill_name = updates.skillName;
    if (updates.category !== undefined) dbUpdates.category = updates.category;
    if (updates.proficiencyLevel !== undefined) dbUpdates.proficiency_level = updates.proficiencyLevel;

    const { error } = await supabase
      .from('agent_skills')
      .update(dbUpdates)
      .eq('id', skillId);

    if (error) {
      console.error('Error updating skill:', error);
      return;
    }

    setSkills((prev) =>
      prev.map((s) => (s.id === skillId ? { ...s, ...updates, updatedAt: Date.now() } : s))
    );
  }, [user, supabase]);

  const deleteSkill = useCallback(async (skillId: string) => {
    if (!user) return;

    const { error } = await supabase
      .from('agent_skills')
      .delete()
      .eq('id', skillId);

    if (error) {
      console.error('Error deleting skill:', error);
      return;
    }

    setSkills((prev) => prev.filter((s) => s.id !== skillId));
  }, [user, supabase]);

  const updateMetrics = useCallback(async (agentId: string, updates: Partial<Omit<AgentPerformanceMetrics, 'id' | 'agentId' | 'createdAt' | 'updatedAt'>>) => {
    if (!user) return;

    const dbUpdates: Record<string, unknown> = {};
    if (updates.tasksCompleted !== undefined) dbUpdates.tasks_completed = updates.tasksCompleted;
    if (updates.tasksInProgress !== undefined) dbUpdates.tasks_in_progress = updates.tasksInProgress;
    if (updates.averageCompletionTime !== undefined) dbUpdates.average_completion_time = updates.averageCompletionTime;
    if (updates.successRate !== undefined) dbUpdates.success_rate = updates.successRate;
    if (updates.lastActivityAt !== undefined) dbUpdates.last_activity_at = new Date(updates.lastActivityAt).toISOString();

    const { error } = await supabase
      .from('agent_performance_metrics')
      .update(dbUpdates)
      .eq('agent_id', agentId);

    if (error) {
      console.error('Error updating metrics:', error);
      return;
    }

    setMetrics((prev) =>
      prev.map((m) => (m.agentId === agentId ? { ...m, ...updates, updatedAt: Date.now() } : m))
    );
  }, [user, supabase]);

  const getSkillsByAgent = useCallback((agentId: string) => {
    return skills.filter(s => s.agentId === agentId);
  }, [skills]);

  const getMetricsByAgent = useCallback((agentId: string) => {
    return metrics.find(m => m.agentId === agentId);
  }, [metrics]);

  return {
    skills,
    metrics,
    addSkill,
    updateSkill,
    deleteSkill,
    updateMetrics,
    getSkillsByAgent,
    getMetricsByAgent,
    isLoaded: hasFetched,
  };
};
