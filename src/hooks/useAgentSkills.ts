'use client';

import { useState, useEffect, useCallback, useMemo } from 'react';
import { AgentSkill, AgentPerformance, AgentWithSkills } from '@/types/agent';
import { CodingAgent } from '@/types/agent';
import { createClient } from '@/lib/supabase/client';
import { useAuth } from '@/contexts/AuthContext';

interface DbAgentSkill {
  id: string;
  user_id: string;
  agent_id: string;
  skill_name: string;
  skill_level: number;
  created_at: string;
}

interface DbAgentPerformance {
  id: string;
  user_id: string;
  agent_id: string;
  task_id: string;
  completion_time_hours: number | null;
  quality_score: number | null;
  notes: string | null;
  created_at: string;
}

const mapDbSkill = (db: DbAgentSkill): AgentSkill => ({
  id: db.id,
  agentId: db.agent_id,
  skillName: db.skill_name,
  skillLevel: db.skill_level as AgentSkill['skillLevel'],
  createdAt: new Date(db.created_at).getTime(),
});

const mapDbPerformance = (db: DbAgentPerformance): AgentPerformance => ({
  id: db.id,
  agentId: db.agent_id,
  taskId: db.task_id,
  completionTimeHours: db.completion_time_hours || undefined,
  qualityScore: db.quality_score as AgentPerformance['qualityScore'] || undefined,
  notes: db.notes || undefined,
  createdAt: new Date(db.created_at).getTime(),
});

export const useAgentSkills = (agents: CodingAgent[]) => {
  const [skills, setSkills] = useState<AgentSkill[]>([]);
  const [performance, setPerformance] = useState<AgentPerformance[]>([]);
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
        .order('created_at', { ascending: false });

      if (skillsError) {
        console.error('Error fetching skills:', skillsError);
      } else {
        setSkills((skillsData || []).map(mapDbSkill));
      }

      // Fetch performance
      const { data: perfData, error: perfError } = await supabase
        .from('agent_performance')
        .select('*')
        .order('created_at', { ascending: false });

      if (perfError) {
        console.error('Error fetching performance:', perfError);
      } else {
        setPerformance((perfData || []).map(mapDbPerformance));
      }

      setHasFetched(true);
    };

    fetchData();
  }, [user, authLoading, hasFetched, supabase]);

  const addSkill = useCallback(async (skill: Omit<AgentSkill, 'id' | 'createdAt'>) => {
    if (!user) throw new Error('You must be logged in');

    const { data, error } = await supabase
      .from('agent_skills')
      .insert({
        user_id: user.id,
        agent_id: skill.agentId,
        skill_name: skill.skillName,
        skill_level: skill.skillLevel,
      })
      .select()
      .single();

    if (error) {
      console.error('Error adding skill:', error);
      throw new Error(error.message);
    }

    if (data) {
      setSkills((prev) => [mapDbSkill(data), ...prev]);
    }
  }, [user, supabase]);

  const updateSkill = useCallback(async (skillId: string, skillLevel: number) => {
    if (!user) return;

    const { error } = await supabase
      .from('agent_skills')
      .update({ skill_level: skillLevel })
      .eq('id', skillId);

    if (error) {
      console.error('Error updating skill:', error);
      return;
    }

    setSkills((prev) =>
      prev.map((s) => (s.id === skillId ? { ...s, skillLevel: skillLevel as AgentSkill['skillLevel'] } : s))
    );
  }, [user, supabase]);

  const removeSkill = useCallback(async (skillId: string) => {
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

  const addPerformanceRecord = useCallback(async (perf: Omit<AgentPerformance, 'id' | 'createdAt'>) => {
    if (!user) throw new Error('You must be logged in');

    const { data, error } = await supabase
      .from('agent_performance')
      .insert({
        user_id: user.id,
        agent_id: perf.agentId,
        task_id: perf.taskId,
        completion_time_hours: perf.completionTimeHours || null,
        quality_score: perf.qualityScore || null,
        notes: perf.notes || null,
      })
      .select()
      .single();

    if (error) {
      console.error('Error adding performance record:', error);
      throw new Error(error.message);
    }

    if (data) {
      setPerformance((prev) => [mapDbPerformance(data), ...prev]);
    }
  }, [user, supabase]);

  const getAgentWithSkills = useCallback((agentId: string): AgentWithSkills | null => {
    const agent = agents.find(a => a.id === agentId);
    if (!agent) return null;

    const agentSkills = skills.filter(s => s.agentId === agentId);
    const agentPerf = performance.filter(p => p.agentId === agentId);

    const performanceMetrics = agentPerf.length > 0 ? {
      averageCompletionTime: agentPerf.reduce((sum, p) => sum + (p.completionTimeHours || 0), 0) / agentPerf.length,
      averageQualityScore: agentPerf.reduce((sum, p) => sum + (p.qualityScore || 0), 0) / agentPerf.length,
      tasksCompleted: agentPerf.length,
    } : undefined;

    return {
      ...agent,
      skills: agentSkills,
      performanceMetrics,
    };
  }, [agents, skills, performance]);

  const getAllAgentsWithSkills = useCallback((): AgentWithSkills[] => {
    return agents.map(agent => {
      const agentSkills = skills.filter(s => s.agentId === agent.id);
      const agentPerf = performance.filter(p => p.agentId === agent.id);

      const performanceMetrics = agentPerf.length > 0 ? {
        averageCompletionTime: agentPerf.reduce((sum, p) => sum + (p.completionTimeHours || 0), 0) / agentPerf.length,
        averageQualityScore: agentPerf.reduce((sum, p) => sum + (p.qualityScore || 0), 0) / agentPerf.length,
        tasksCompleted: agentPerf.length,
      } : undefined;

      return {
        ...agent,
        skills: agentSkills,
        performanceMetrics,
      };
    });
  }, [agents, skills, performance]);

  return {
    skills,
    performance,
    addSkill,
    updateSkill,
    removeSkill,
    addPerformanceRecord,
    getAgentWithSkills,
    getAllAgentsWithSkills,
    isLoaded: !authLoading && (hasFetched || !user),
  };
};
