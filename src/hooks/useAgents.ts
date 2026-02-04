'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import { CodingAgent } from '@/types/agent';
import { createClient } from '@/lib/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { getInitials, getAvatarColor } from '@/lib/utils';

interface DbAgent {
  id: string;
  user_id: string;
  name: string;
  description: string | null;
  avatar: string | null;
  avatar_color: string | null;
  created_at: string;
}

const mapDbAgentToAgent = (dbAgent: DbAgent): CodingAgent => ({
  id: dbAgent.id,
  name: dbAgent.name,
  description: dbAgent.description || undefined,
  avatar: dbAgent.avatar || getInitials(dbAgent.name),
  avatarColor: dbAgent.avatar_color || getAvatarColor(dbAgent.name),
  createdAt: new Date(dbAgent.created_at).getTime(),
});

export const useAgents = () => {
  const [agents, setAgents] = useState<CodingAgent[]>([]);
  const [isLoaded, setIsLoaded] = useState(false);
  const { user } = useAuth();
  const supabase = createClient();
  const hasFetched = useRef(false);

  useEffect(() => {
    if (!user || hasFetched.current) return;
    hasFetched.current = true;

    const fetchAgents = async () => {
      const { data, error } = await supabase
        .from('agents')
        .select('*')
        .order('created_at', { ascending: true });

      if (error) {
        console.error('Error fetching agents:', error);
        setIsLoaded(true);
        return;
      }

      setAgents((data || []).map(mapDbAgentToAgent));
      setIsLoaded(true);
    };

    fetchAgents();
  }, [user, supabase]);

  const addAgent = useCallback(async (agent: CodingAgent) => {
    if (!user) return;

    const { data, error } = await supabase
      .from('agents')
      .insert({
        user_id: user.id,
        name: agent.name,
        description: agent.description || null,
        avatar: agent.avatar || null,
        avatar_color: agent.avatarColor || null,
      })
      .select()
      .single();

    if (error) {
      console.error('Error adding agent:', error);
      return;
    }

    if (data) {
      setAgents((prev) => [mapDbAgentToAgent(data), ...prev]);
    }
  }, [user, supabase]);

  const updateAgent = useCallback(async (updatedAgent: CodingAgent) => {
    if (!user) return;

    const { error } = await supabase
      .from('agents')
      .update({
        name: updatedAgent.name,
        description: updatedAgent.description || null,
        avatar: updatedAgent.avatar || null,
        avatar_color: updatedAgent.avatarColor || null,
      })
      .eq('id', updatedAgent.id);

    if (error) {
      console.error('Error updating agent:', error);
      return;
    }

    setAgents((prev) =>
      prev.map((a) => (a.id === updatedAgent.id ? updatedAgent : a))
    );
  }, [user, supabase]);

  const deleteAgent = useCallback(async (agentId: string) => {
    if (!user) return;

    const { error } = await supabase
      .from('agents')
      .delete()
      .eq('id', agentId);

    if (error) {
      console.error('Error deleting agent:', error);
      return;
    }

    setAgents((prev) => prev.filter((a) => a.id !== agentId));
  }, [user, supabase]);

  return {
    agents,
    addAgent,
    updateAgent,
    deleteAgent,
    isLoaded,
  };
};
