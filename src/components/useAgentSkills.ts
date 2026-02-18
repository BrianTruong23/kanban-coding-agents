import { useState, useEffect, useMemo } from 'react';
import { AgentSkill, AgentPerformance, AgentWorkload } from '@/types/agentSkill';
import { createClient } from '@/lib/supabase/client';

export function useAgentSkills(userId?: string) {
  const [skills, setSkills] = useState<AgentSkill[]>([]);
  const [performance, setPerformance] = useState<AgentPerformance[]>([]);
  const [isLoaded, setIsLoaded] = useState(false);
  const supabase = useMemo(() => createClient(), []);

  useEffect(() => {
    if (!userId) return;

    const loadData = async () => {
      try {
        // Load skills
        const { data: skillsData, error: skillsError } = await supabase
          .from('agent_skills')
          .select('*')
          .eq('user_id', userId);

        if (skillsError) throw skillsError;

        // Load performance
        const { data: performanceData, error: perfError } = await supabase
          .from('agent_performance')
          .select('*')
          .eq('user_id', userId);

        if (perfError) throw perfError;

        setSkills(skillsData.map(transformSkill) || []);
        setPerformance(performanceData.map(transformPerformance) || []);
        setIsLoaded(true);
      } catch (error) {
        console.error('Error loading agent skills:', error);
        setIsLoaded(true);
      }
    };

    loadData();
  }, [userId, supabase]);

  const addSkill = async (skill: Omit<AgentSkill, 'id' | 'createdAt' | 'updatedAt'>) => {
    if (!userId) return;

    try {
      const { data, error } = await supabase
        .from('agent_skills')
        .insert({
          user_id: userId,
          agent_id: skill.agentId,
          skill_name: skill.skillName,
          skill_category: skill.skillCategory,
          proficiency_level: skill.proficiencyLevel,
        })
        .select()
        .single();

      if (error) throw error;

      setSkills([...skills, transformSkill(data)]);
    } catch (error) {
      console.error('Error adding skill:', error);
      throw error;
    }
  };

  const updateSkill = async (skill: AgentSkill) => {
    if (!userId) return;

    try {
      const { error } = await supabase
        .from('agent_skills')
        .update({
          skill_name: skill.skillName,
          skill_category: skill.skillCategory,
          proficiency_level: skill.proficiencyLevel,
        })
        .eq('id', skill.id)
        .eq('user_id', userId);

      if (error) throw error;

      setSkills(skills.map(s => s.id === skill.id ? skill : s));
    } catch (error) {
      console.error('Error updating skill:', error);
      throw error;
    }
  };

  const deleteSkill = async (id: string) => {
    if (!userId) return;

    try {
      const { error } = await supabase
        .from('agent_skills')
        .delete()
        .eq('id', id)
        .eq('user_id', userId);

      if (error) throw error;

      setSkills(skills.filter(s => s.id !== id));
    } catch (error) {
      console.error('Error deleting skill:', error);
      throw error;
    }
  };

  const addPerformance = async (perf: Omit<AgentPerformance, 'id' | 'createdAt'>) => {
    if (!userId) return;

    try {
      const { data, error } = await supabase
        .from('agent_performance')
        .insert({
          user_id: userId,
          agent_id: perf.agentId,
          task_id: perf.taskId,
          subtask_id: perf.subtaskId,
          estimated_hours: perf.estimatedHours,
          actual_hours: perf.actualHours,
          quality_score: perf.qualityScore,
          notes: perf.notes,
        })
        .select()
        .single();

      if (error) throw error;

      setPerformance([...performance, transformPerformance(data)]);
    } catch (error) {
      console.error('Error adding performance:', error);
      throw error;
    }
  };

  const getAgentWorkload = (agentId: string): AgentWorkload => {
    const agentPerformance = performance.filter(p => p.agentId === agentId);
    const totalQuality = agentPerformance.reduce((sum, p) => sum + (p.qualityScore || 0), 0);

    return {
      totalTasks: agentPerformance.length,
      inProgressTasks: 0, // This should be calculated from tasks
      avgQualityScore: agentPerformance.length > 0 ? totalQuality / agentPerformance.length : 0,
    };
  };

  return {
    skills,
    performance,
    isLoaded,
    addSkill,
    updateSkill,
    deleteSkill,
    addPerformance,
    getAgentWorkload,
  };
}

function transformSkill(data: any): AgentSkill {
  return {
    id: data.id,
    agentId: data.agent_id,
    skillName: data.skill_name,
    skillCategory: data.skill_category,
    proficiencyLevel: data.proficiency_level,
    createdAt: new Date(data.created_at).getTime(),
    updatedAt: new Date(data.updated_at).getTime(),
  };
}

function transformPerformance(data: any): AgentPerformance {
  return {
    id: data.id,
    agentId: data.agent_id,
    taskId: data.task_id,
    subtaskId: data.subtask_id,
    completedAt: new Date(data.completed_at).getTime(),
    estimatedHours: data.estimated_hours,
    actualHours: data.actual_hours,
    qualityScore: data.quality_score,
    notes: data.notes,
    createdAt: new Date(data.created_at).getTime(),
  };
}
