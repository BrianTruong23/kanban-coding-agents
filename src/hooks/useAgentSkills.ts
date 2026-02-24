'use client';

import { useState, useEffect, useCallback, useMemo } from 'react';
import { AgentSkill, AgentPerformance, AgentStats, AgentWithSkills } from '@/types/agentSkills';
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
  completed_on_time: boolean;
  quality_score: number | null;
  created_at: string;
}

const mapDbSkillToSkill = (dbSkill: DbAgentSkill): AgentSkill => ({
  id: dbSkill.id,
  agentId: dbSkill.agent_id,
  skillName: dbSkill.skill_name,
  proficiencyLevel: dbSkill.proficiency_level as 1 | 2 | 3 | 4 | 5,
  createdAt: new Date(dbSkill.created_at).getTime(),
});

const mapDbPerformanceToPerformance = (dbPerf: DbAgentPerformance): AgentPerformance => ({
  id: dbPerf.id,
  agentId: dbPerf.agent_id,
  taskId: dbPerf.task_id,
  completedOnTime: dbPerf.completed_on_time,
  qualityScore: dbPerf.quality_score as 1 | 2 | 3 | 4 | 5 | undefined,
  createdAt: new Date(dbPerf.created_at).getTime(),
});

export const useAgentSkills = (agents: CodingAgent[]) => {
  const [skills, setSkills] = useState<AgentSkill[]>([]);
  const [performance, setPerformance] = useState<AgentPerformance[]>([]);
  const [hasFetched, setHasFetched] = useState(false);
  const { user, isLoading: authLoading } = useAuth();
  const supabase = useMemo(() => createClient(), []);

  useEffect(() => {
    if (authLoading || hasFetched || !user || agents.length === 0) return;

    const fetchSkillsAndPerformance = async () => {
      // Fetch skills
      const { data: skillsData, error: skillsError } = await supabase
        .from('agent_skills')
        .select('*')
        .order('proficiency_level', { ascending: false });

      if (skillsError) {
        console.error('Error fetching agent skills:', skillsError);
      } else {
        setSkills((skillsData || []).map(mapDbSkillToSkill));
      }

      // Fetch performance
      const { data: perfData, error: perfError } = await supabase
        .from('agent_performance')
        .select('*')
        .order('created_at', { ascending: false });

      if (perfError) {
        console.error('Error fetching agent performance:', perfError);
      } else {
        setPerformance((perfData || []).map(mapDbPerformanceToPerformance));
      }

      setHasFetched(true);
    };

    fetchSkillsAndPerformance();
  }, [user, authLoading, hasFetched, agents, supabase]);

  const addSkill = useCallback(
    async (skill: Omit<AgentSkill, 'id' | 'createdAt'>) => {
      if (!user) return;

      const { data, error } = await supabase
        .from('agent_skills')
        .insert({
          user_id: user.id,
          agent_id: skill.agentId,
          skill_name: skill.skillName,
          proficiency_level: skill.proficiencyLevel,
        })
        .select()
        .single();

      if (error) {
        console.error('Error adding skill:', error);
        return;
      }

      if (data) {
        setSkills((prev) => [...prev, mapDbSkillToSkill(data)]);
      }
    },
    [user, supabase]
  );

  const updateSkill = useCallback(
    async (skillId: string, proficiencyLevel: number) => {
      if (!user) return;

      const { error } = await supabase
        .from('agent_skills')
        .update({ proficiency_level: proficiencyLevel })
        .eq('id', skillId);

      if (error) {
        console.error('Error updating skill:', error);
        return;
      }

      setSkills((prev) =>
        prev.map((s) =>
          s.id === skillId ? { ...s, proficiencyLevel: proficiencyLevel as 1 | 2 | 3 | 4 | 5 } : s
        )
      );
    },
    [user, supabase]
  );

  const deleteSkill = useCallback(
    async (skillId: string) => {
      if (!user) return;

      const { error } = await supabase.from('agent_skills').delete().eq('id', skillId);

      if (error) {
        console.error('Error deleting skill:', error);
        return;
      }

      setSkills((prev) => prev.filter((s) => s.id !== skillId));
    },
    [user, supabase]
  );

  const recordPerformance = useCallback(
    async (perf: Omit<AgentPerformance, 'id' | 'createdAt'>) => {
      if (!user) return;

      const { data, error } = await supabase
        .from('agent_performance')
        .insert({
          user_id: user.id,
          agent_id: perf.agentId,
          task_id: perf.taskId,
          completed_on_time: perf.completedOnTime,
          quality_score: perf.qualityScore || null,
        })
        .select()
        .single();

      if (error) {
        console.error('Error recording performance:', error);
        return;
      }

      if (data) {
        setPerformance((prev) => [...prev, mapDbPerformanceToPerformance(data)]);
      }
    },
    [user, supabase]
  );

  // Calculate agent stats
  const agentStats = useMemo(() => {
    const stats: Record<string, AgentStats> = {};

    agents.forEach((agent) => {
      const agentPerformance = performance.filter((p) => p.agentId === agent.id);
      const agentSkills = skills.filter((s) => s.agentId === agent.id);

      const totalTasks = agentPerformance.length;
      const onTimeCount = agentPerformance.filter((p) => p.completedOnTime).length;
      const qualityScores = agentPerformance
        .map((p) => p.qualityScore)
        .filter((q): q is 1 | 2 | 3 | 4 | 5 => q !== undefined);

      stats[agent.id] = {
        agentId: agent.id,
        totalTasks,
        completedTasks: totalTasks,
        onTimeRate: totalTasks > 0 ? (onTimeCount / totalTasks) * 100 : 0,
        averageQualityScore:
          qualityScores.length > 0
            ? qualityScores.reduce((a, b) => a + b, 0) / qualityScores.length
            : 0,
        topSkills: agentSkills.sort((a, b) => b.proficiencyLevel - a.proficiencyLevel).slice(0, 5),
      };
    });

    return stats;
  }, [agents, performance, skills]);

  // Combine agents with their skills and stats
  const agentsWithSkills = useMemo((): AgentWithSkills[] => {
    return agents.map((agent) => ({
      ...agent,
      skills: skills.filter((s) => s.agentId === agent.id),
      stats: agentStats[agent.id],
    }));
  }, [agents, skills, agentStats]);

  return {
    skills,
    performance,
    agentStats,
    agentsWithSkills,
    addSkill,
    updateSkill,
    deleteSkill,
    recordPerformance,
    isLoaded: hasFetched,
  };
};
