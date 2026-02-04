'use client';

import { useState, useEffect, useCallback, useRef, useMemo } from 'react';
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
  const [hasFetched, setHasFetched] = useState(false);
  const { user, isLoading: authLoading } = useAuth();
  const supabase = createClient();
  const fetchingRef = useRef(false);

  useEffect(() => {
    // Skip if auth is loading, already fetched, or currently fetching
    if (authLoading || hasFetched || fetchingRef.current || !user) return;

    fetchingRef.current = true;

    const fetchAgents = async () => {
      const { data, error } = await supabase
        .from('agents')
        .select('*')
        .order('created_at', { ascending: true });

      if (error) {
        console.error('Error fetching agents:', error);
      } else {
        setAgents((data || []).map(mapDbAgentToAgent));
      }
      setHasFetched(true);
      fetchingRef.current = false;
    };

    fetchAgents();
  }, [user, authLoading, hasFetched, supabase]);

  // Derived loading state
  const isLoaded = useMemo(() => {
    if (authLoading) return false;
    if (!user) return true; // No user = loaded with empty state
    return hasFetched;
  }, [authLoading, user, hasFetched]);

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
