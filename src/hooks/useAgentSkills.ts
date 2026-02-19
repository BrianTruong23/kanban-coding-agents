import { useState, useEffect, useMemo } from 'react';
import { createClient } from '@/lib/supabase/client';
import type { AgentSkill } from '@/types/agent';

export function useAgentSkills(userId: string | undefined) {
  const [skills, setSkills] = useState<AgentSkill[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const supabase = useMemo(() => createClient(), []);

  useEffect(() => {
    if (!userId) {
      setSkills([]);
      setLoading(false);
      return;
    }

    loadSkills();

    // Subscribe to real-time changes
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
      supabase.removeChannel(channel);
    };
  }, [userId, supabase]);

  const loadSkills = async () => {
    if (!userId) return;

    try {
      setLoading(true);
      setError(null);

      const { data, error: fetchError } = await supabase
        .from('agent_skills')
        .select('*')
        .eq('user_id', userId)
        .order('created_at', { ascending: false });

      if (fetchError) throw fetchError;

      const mappedSkills: AgentSkill[] = (data || []).map((row) => ({
        id: row.id,
        agentId: row.agent_id,
        skillName: row.skill_name,
        proficiencyLevel: row.proficiency_level as 1 | 2 | 3 | 4 | 5,
        createdAt: new Date(row.created_at).getTime(),
      }));

      setSkills(mappedSkills);
    } catch (err) {
      console.error('Error loading agent skills:', err);
      setError(err instanceof Error ? err.message : 'Failed to load agent skills');
    } finally {
      setLoading(false);
    }
  };

  const addSkill = async (
    agentId: string,
    skill: Omit<AgentSkill, 'id' | 'agentId' | 'createdAt'>
  ) => {
    if (!userId) throw new Error('User not authenticated');

    try {
      const { data, error: insertError } = await supabase
        .from('agent_skills')
        .insert({
          user_id: userId,
          agent_id: agentId,
          skill_name: skill.skillName,
          proficiency_level: skill.proficiencyLevel,
        })
        .select()
        .single();

      if (insertError) throw insertError;

      const newSkill: AgentSkill = {
        id: data.id,
        agentId: data.agent_id,
        skillName: data.skill_name,
        proficiencyLevel: data.proficiency_level as 1 | 2 | 3 | 4 | 5,
        createdAt: new Date(data.created_at).getTime(),
      };

      setSkills((prev) => [...prev, newSkill]);
    } catch (err) {
      console.error('Error adding skill:', err);
      throw err;
    }
  };

  const removeSkill = async (agentId: string, skillId: string) => {
    if (!userId) throw new Error('User not authenticated');

    try {
      const { error: deleteError } = await supabase
        .from('agent_skills')
        .delete()
        .eq('id', skillId)
        .eq('agent_id', agentId)
        .eq('user_id', userId);

      if (deleteError) throw deleteError;

      setSkills((prev) => prev.filter((s) => s.id !== skillId));
    } catch (err) {
      console.error('Error removing skill:', err);
      throw err;
    }
  };

  const updateSkill = async (skillId: string, updates: Partial<AgentSkill>) => {
    if (!userId) throw new Error('User not authenticated');

    try {
      const updateData: Record<string, unknown> = {};
      if (updates.skillName !== undefined) updateData.skill_name = updates.skillName;
      if (updates.proficiencyLevel !== undefined)
        updateData.proficiency_level = updates.proficiencyLevel;

      const { error: updateError } = await supabase
        .from('agent_skills')
        .update(updateData)
        .eq('id', skillId)
        .eq('user_id', userId);

      if (updateError) throw updateError;

      setSkills((prev) =>
        prev.map((skill) =>
          skill.id === skillId ? { ...skill, ...updates } : skill
        )
      );
    } catch (err) {
      console.error('Error updating skill:', err);
      throw err;
    }
  };

  // Group skills by agent
  const skillsByAgent = useMemo(() => {
    const map = new Map<string, AgentSkill[]>();
    skills.forEach((skill) => {
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
    removeSkill,
    updateSkill,
    refresh: loadSkills,
  };
}
