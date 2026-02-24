'use client';

import { useState, useEffect, useCallback, useMemo } from 'react';
import { AgentSkill } from '@/types/agent';
import { createClient } from '@/lib/supabase/client';
import { useAuth } from '@/contexts/AuthContext';

interface DbAgentSkill {
  id: string;
  user_id: string;
  agent_id: string;
  skill_name: string;
  proficiency_level: number;
  created_at: string;
  updated_at: string;
}

const mapDbSkillToSkill = (dbSkill: DbAgentSkill): AgentSkill => ({
  id: dbSkill.id,
  agentId: dbSkill.agent_id,
  skillName: dbSkill.skill_name,
  proficiencyLevel: dbSkill.proficiency_level as AgentSkill['proficiencyLevel'],
  createdAt: new Date(dbSkill.created_at).getTime(),
  updatedAt: new Date(dbSkill.updated_at).getTime(),
});

export const useAgentSkills = (agentId?: string) => {
  const [skills, setSkills] = useState<AgentSkill[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const { user } = useAuth();
  const supabase = useMemo(() => createClient(), []);

  useEffect(() => {
    if (!user) {
      setIsLoading(false);
      return;
    }

    const fetchSkills = async () => {
      setIsLoading(true);
      let query = supabase
        .from('agent_skills')
        .select('*');

      if (agentId) {
        query = query.eq('agent_id', agentId);
      }

      const { data, error } = await query.order('skill_name', { ascending: true });

      if (error) {
        console.error('Error fetching agent skills:', error);
      } else {
        setSkills((data || []).map(mapDbSkillToSkill));
      }
      setIsLoading(false);
    };

    fetchSkills();
  }, [user, agentId, supabase]);

  const addSkill = useCallback(async (
    agentId: string,
    skillName: string,
    proficiencyLevel: 1 | 2 | 3 | 4 | 5 = 3
  ) => {
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
      return;
    }

    if (data) {
      setSkills((prev) => [...prev, mapDbSkillToSkill(data)]);
    }
  }, [user, supabase]);

  const updateSkill = useCallback(async (
    skillId: string,
    proficiencyLevel: 1 | 2 | 3 | 4 | 5
  ) => {
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
        s.id === skillId ? { ...s, proficiencyLevel, updatedAt: Date.now() } : s
      )
    );
  }, [user, supabase]);

  const removeSkill = useCallback(async (skillId: string) => {
    if (!user) return;

    const { error } = await supabase
      .from('agent_skills')
      .delete()
      .eq('id', skillId);

    if (error) {
      console.error('Error removing skill:', error);
      return;
    }

    setSkills((prev) => prev.filter((s) => s.id !== skillId));
  }, [user, supabase]);

  const getSkillsByAgent = useCallback((agentId: string) => {
    return skills.filter(s => s.agentId === agentId);
  }, [skills]);

  return {
    skills,
    isLoading,
    addSkill,
    updateSkill,
    removeSkill,
    getSkillsByAgent,
  };
};
