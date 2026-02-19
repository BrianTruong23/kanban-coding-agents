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
  proficiency_level: number;
  created_at: string;
}

interface DbAgentPerformance {
  id: string;
  user_id: string;
  agent_id: string;
  task_id: string;
  completion_time_hours: number | null;
  quality_score: number | null;
  on_time: boolean;
  notes: string | null;
  completed_at: string;
}

const mapDbSkill = (db: DbAgentSkill): AgentSkill => ({
  id: db.id,
  agentId: db.agent_id,
  skillName: db.skill_name,
  proficiencyLevel: db.proficiency_level as 1 | 2 | 3 | 4 | 5,
  createdAt: new Date(db.created_at).getTime(),
});

const mapDbPerformance = (db: DbAgentPerformance): AgentPerformance => ({
  id: db.id,
  agentId: db.agent_id,
  taskId: db.task_id,
  completionTimeHours: db.completion_time_hours || undefined,
  qualityScore: db.quality_score as 1 | 2 | 3 | 4 | 5 | undefined,
  onTime: db.on_time,
  notes: db.notes || undefined,
  completedAt: new Date(db.completed_at).getTime(),
});

export const useAgentSkills = (agents: CodingAgent[]) => {
  const [skills, setSkills] = useState<AgentSkill[]>([]);
  const [performance, setPerformance] = useState<AgentPerformance[]>([]);
  const [isLoaded, setIsLoaded] = useState(false);
  const { user, isLoading: authLoading } = useAuth();
  const supabase = useMemo(() => createClient(), []);

  // Fetch skills and performance
  useEffect(() => {
    if (authLoading || !user || isLoaded) return;

    const fetchData = async () => {
      // Fetch skills
      const { data: skillsData, error: skillsError } = await supabase
        .from('agent_skills')
        .select('*');

      if (skillsError) {
        console.error('Error fetching agent skills:', skillsError);
      } else {
        setSkills((skillsData || []).map(mapDbSkill));
      }

      // Fetch performance
      const { data: perfData, error: perfError } = await supabase
        .from('agent_performance')
        .select('*');

      if (perfError) {
        console.error('Error fetching agent performance:', perfError);
      } else {
        setPerformance((perfData || []).map(mapDbPerformance));
      }

      setIsLoaded(true);
    };

    fetchData();
  }, [user, authLoading, isLoaded, supabase]);

  // Combine agents with their skills and performance metrics
  const agentsWithSkills = useMemo((): AgentWithSkills[] => {
    return agents.map(agent => {
      const agentSkills = skills.filter(s => s.agentId === agent.id);
      const agentPerformance = performance.filter(p => p.agentId === agent.id);

      // Calculate performance metrics
      let performanceMetrics = undefined;
      if (agentPerformance.length > 0) {
        const totalTasksCompleted = agentPerformance.length;
        const avgCompletionTime =
          agentPerformance.reduce((sum, p) => sum + (p.completionTimeHours || 0), 0) /
          agentPerformance.filter(p => p.completionTimeHours).length || 0;
        const avgQualityScore =
          agentPerformance.reduce((sum, p) => sum + (p.qualityScore || 0), 0) /
          agentPerformance.filter(p => p.qualityScore).length || 0;
        const onTimeCount = agentPerformance.filter(p => p.onTime).length;

        performanceMetrics = {
          averageCompletionTime: Math.round(avgCompletionTime * 10) / 10,
          averageQualityScore: Math.round(avgQualityScore * 10) / 10,
          onTimePercentage: Math.round((onTimeCount / totalTasksCompleted) * 100),
          totalTasksCompleted,
        };
      }

      return {
        ...agent,
        skills: agentSkills,
        performanceMetrics,
      };
    });
  }, [agents, skills, performance]);

  // Add skill
  const addSkill = useCallback(async (agentId: string, skillName: string, proficiencyLevel: 1 | 2 | 3 | 4 | 5) => {
    if (!user) return;

    const { data, error } = await supabase
      .from('agent_skills')
      .insert({
        user_id: user.id,
        agent_id: agentId,
        skill_name: skillName,
        proficiency_level: proficiencyLevel,
      })
      .select()
      .single();

    if (error) {
      console.error('Error adding skill:', error);
      throw error;
    }

    if (data) {
      setSkills(prev => [...prev, mapDbSkill(data)]);
    }
  }, [user, supabase]);

  // Update skill
  const updateSkill = useCallback(async (skillId: string, proficiencyLevel: 1 | 2 | 3 | 4 | 5) => {
    if (!user) return;

    const { error } = await supabase
      .from('agent_skills')
      .update({ proficiency_level: proficiencyLevel })
      .eq('id', skillId);

    if (error) {
      console.error('Error updating skill:', error);
      throw error;
    }

    setSkills(prev =>
      prev.map(s => (s.id === skillId ? { ...s, proficiencyLevel } : s))
    );
  }, [user, supabase]);

  // Delete skill
  const deleteSkill = useCallback(async (skillId: string) => {
    if (!user) return;

    const { error } = await supabase
      .from('agent_skills')
      .delete()
      .eq('id', skillId);

    if (error) {
      console.error('Error deleting skill:', error);
      throw error;
    }

    setSkills(prev => prev.filter(s => s.id !== skillId));
  }, [user, supabase]);

  // Add performance record
  const addPerformance = useCallback(async (
    agentId: string,
    taskId: string,
    data: {
      completionTimeHours?: number;
      qualityScore?: 1 | 2 | 3 | 4 | 5;
      onTime: boolean;
      notes?: string;
    }
  ) => {
    if (!user) return;

    const { data: perfData, error } = await supabase
      .from('agent_performance')
      .insert({
        user_id: user.id,
        agent_id: agentId,
        task_id: taskId,
        completion_time_hours: data.completionTimeHours || null,
        quality_score: data.qualityScore || null,
        on_time: data.onTime,
        notes: data.notes || null,
      })
      .select()
      .single();

    if (error) {
      console.error('Error adding performance:', error);
      throw error;
    }

    if (perfData) {
      setPerformance(prev => [...prev, mapDbPerformance(perfData)]);
    }
  }, [user, supabase]);

  return {
    agentsWithSkills,
    skills,
    performance,
    addSkill,
    updateSkill,
    deleteSkill,
    addPerformance,
    isLoaded,
  };
};
