import { useState, useEffect, useMemo } from 'react';
import { createClient } from '@/lib/supabase/client';
import { AgentSkill } from '@/types/agent';
import { useAuth } from '@/contexts/AuthContext';

export function useAgentSkills() {
  const [agentSkills, setAgentSkills] = useState<Map<string, AgentSkill[]>>(new Map());
  const [isLoaded, setIsLoaded] = useState(false);
  const { user } = useAuth();
  const supabase = useMemo(() => createClient(), []);

  useEffect(() => {
    if (!user) {
      setAgentSkills(new Map());
      setIsLoaded(true);
      return;
    }

    loadAgentSkills();

    // Set up real-time subscription
    const channel = supabase
      .channel('agent_skills_changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'agent_skills',
          filter: `user_id=eq.${user.id}`
        },
        () => {
          loadAgentSkills();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [user, supabase]);

  const loadAgentSkills = async () => {
    if (!user) return;

    try {
      const { data, error } = await supabase
        .from('agent_skills')
        .select('*')
        .eq('user_id', user.id)
        .order('skill_name', { ascending: true });

      if (error) throw error;

      const skillsMap = new Map<string, AgentSkill[]>();

      (data || []).forEach((skill: any) => {
        const agentSkill: AgentSkill = {
          id: skill.id,
          agentId: skill.agent_id,
          skillName: skill.skill_name,
          proficiencyLevel: skill.proficiency_level,
          createdAt: new Date(skill.created_at).getTime(),
          updatedAt: new Date(skill.updated_at).getTime()
        };

        if (!skillsMap.has(skill.agent_id)) {
          skillsMap.set(skill.agent_id, []);
        }
        skillsMap.get(skill.agent_id)!.push(agentSkill);
      });

      setAgentSkills(skillsMap);
    } catch (error) {
      console.error('Error loading agent skills:', error);
    } finally {
      setIsLoaded(true);
    }
  };

  const updateAgentSkills = async (agentId: string, skills: AgentSkill[]) => {
    if (!user) return;

    try {
      // Delete existing skills for this agent
      await supabase
        .from('agent_skills')
        .delete()
        .eq('agent_id', agentId)
        .eq('user_id', user.id);

      // Insert new skills
      if (skills.length > 0) {
        const skillsToInsert = skills.map(skill => ({
          user_id: user.id,
          agent_id: agentId,
          skill_name: skill.skillName,
          proficiency_level: skill.proficiencyLevel
        }));

        const { error } = await supabase
          .from('agent_skills')
          .insert(skillsToInsert);

        if (error) throw error;
      }

      // Update local state
      setAgentSkills(prev => {
        const newMap = new Map(prev);
        newMap.set(agentId, skills);
        return newMap;
      });
    } catch (error) {
      console.error('Error updating agent skills:', error);
      throw error;
    }
  };

  return {
    agentSkills,
    isLoaded,
    updateAgentSkills
  };
}
