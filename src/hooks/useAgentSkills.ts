'use client';

import { useState, useEffect, useCallback, useMemo } from 'react';
import { AgentSkill } from '@/types/agentSkill';
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
  proficiencyLevel: dbSkill.proficiency_level as 1 | 2 | 3 | 4 | 5,
  createdAt: new Date(dbSkill.created_at).getTime(),
  updatedAt: new Date(dbSkill.updated_at).getTime(),
});

export const useAgentSkills = () => {
  const [skills, setSkills] = useState<AgentSkill[]>([]);
  const [hasFetched, setHasFetched] = useState(false);
  const { user, isLoading: authLoading } = useAuth();
  const supabase = useMemo(() => createClient(), []);

  useEffect(() => {
    if (authLoading || hasFetched || !user) return;

    const fetchSkills = async () => {
      const { data, error } = await supabase
        .from('agent_skills')
        .select('*')
        .order('created_at', { ascending: true });

      if (error) {
        console.error('Error fetching agent skills:', error);
      } else {
        setSkills((data || []).map(mapDbSkillToSkill));
      }
      setHasFetched(true);
    };

    fetchSkills();
  }, [user, authLoading, hasFetched, supabase]);

  const addSkill = useCallback(async (skill: Omit<AgentSkill, 'id' | 'createdAt' | 'updatedAt'>) => {
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
  }, [user, supabase]);

  const updateSkill = useCallback(async (updatedSkill: AgentSkill) => {
    if (!user) return;

    const { error } = await supabase
      .from('agent_skills')
      .update({
        skill_name: updatedSkill.skillName,
        proficiency_level: updatedSkill.proficiencyLevel,
      })
      .eq('id', updatedSkill.id);

    if (error) {
      console.error('Error updating skill:', error);
      return;
    }

    setSkills((prev) =>
      prev.map((s) => (s.id === updatedSkill.id ? updatedSkill : s))
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

  return {
    skills,
    addSkill,
    updateSkill,
    deleteSkill,
    isLoaded: hasFetched,
  };
};
