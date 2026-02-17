import { useState, useEffect, useMemo } from 'react';
import { AgentSkill, SkillCategory } from '@/types/agent';
import { createClient } from '@/lib/supabase/client';

export function useAgentSkills(userId?: string) {
  const [skills, setSkills] = useState<AgentSkill[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const supabase = useMemo(() => createClient(), []);

  useEffect(() => {
    if (!userId) {
      setLoading(false);
      return;
    }

    loadSkills();

    // Subscribe to changes
    const channel = supabase
      .channel('agent_skills_changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'agent_skills',
          filter: `user_id=eq.${userId}`,
        },
        () => {
          loadSkills();
        }
      )
      .subscribe();

    return () => {
      channel.unsubscribe();
    };
  }, [userId, supabase]);

  async function loadSkills() {
    try {
      setLoading(true);
      setError(null);

      const { data, error: fetchError } = await supabase
        .from('agent_skills')
        .select('*')
        .order('created_at', { ascending: false });

      if (fetchError) throw fetchError;

      const mapped: AgentSkill[] = (data || []).map(row => ({
        id: row.id,
        agentId: row.agent_id,
        skillName: row.skill_name,
        skillCategory: row.skill_category as SkillCategory,
        proficiencyLevel: row.proficiency_level as 1 | 2 | 3 | 4 | 5,
        yearsExperience: row.years_experience,
        createdAt: new Date(row.created_at).getTime(),
        updatedAt: new Date(row.updated_at).getTime(),
      }));

      setSkills(mapped);
    } catch (err) {
      console.error('Error loading agent skills:', err);
      setError(err instanceof Error ? err.message : 'Failed to load skills');
    } finally {
      setLoading(false);
    }
  }

  async function addSkill(skill: Omit<AgentSkill, 'id' | 'createdAt' | 'updatedAt'>) {
    try {
      const { data: userData } = await supabase.auth.getUser();
      if (!userData.user) throw new Error('Not authenticated');

      const { error: insertError } = await supabase.from('agent_skills').insert({
        user_id: userData.user.id,
        agent_id: skill.agentId,
        skill_name: skill.skillName,
        skill_category: skill.skillCategory,
        proficiency_level: skill.proficiencyLevel,
        years_experience: skill.yearsExperience,
      });

      if (insertError) throw insertError;

      await loadSkills();
    } catch (err) {
      console.error('Error adding skill:', err);
      throw err;
    }
  }

  async function updateSkill(skillId: string, updates: Partial<AgentSkill>) {
    try {
      const updateData: Record<string, unknown> = {};

      if (updates.skillName) updateData.skill_name = updates.skillName;
      if (updates.skillCategory) updateData.skill_category = updates.skillCategory;
      if (updates.proficiencyLevel) updateData.proficiency_level = updates.proficiencyLevel;
      if (updates.yearsExperience !== undefined) updateData.years_experience = updates.yearsExperience;

      const { error: updateError } = await supabase
        .from('agent_skills')
        .update(updateData)
        .eq('id', skillId);

      if (updateError) throw updateError;

      await loadSkills();
    } catch (err) {
      console.error('Error updating skill:', err);
      throw err;
    }
  }

  async function deleteSkill(skillId: string) {
    try {
      const { error: deleteError } = await supabase
        .from('agent_skills')
        .delete()
        .eq('id', skillId);

      if (deleteError) throw deleteError;

      await loadSkills();
    } catch (err) {
      console.error('Error deleting skill:', err);
      throw err;
    }
  }

  // Get skills by agent ID
  function getSkillsByAgent(agentId: string): AgentSkill[] {
    return skills.filter(skill => skill.agentId === agentId);
  }

  // Get skills map (agentId -> skills[])
  const skillsByAgent = useMemo(() => {
    const map = new Map<string, AgentSkill[]>();
    skills.forEach(skill => {
      const agentSkills = map.get(skill.agentId) || [];
      agentSkills.push(skill);
      map.set(skill.agentId, agentSkills);
    });
    return map;
  }, [skills]);

  return {
    skills,
    skillsByAgent,
    loading,
    error,
    addSkill,
    updateSkill,
    deleteSkill,
    getSkillsByAgent,
    refresh: loadSkills,
  };
}
