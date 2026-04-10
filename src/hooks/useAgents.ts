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
  slug: string | null;
  description: string | null;
  avatar: string | null;
  avatar_color: string | null;
  agent_type: 'manual' | 'external';
  transport: 'web' | 'telegram' | 'http';
  runtime_location: string | null;
  telegram_bot: string | null;
  status: 'offline' | 'online' | 'idle' | 'busy';
  api_key_preview: string | null;
  last_seen_at: string | null;
  metadata: Record<string, unknown> | null;
  created_at: string;
}

const mapDbAgentToAgent = (dbAgent: DbAgent): CodingAgent => ({
  id: dbAgent.id,
  name: dbAgent.name,
  slug: dbAgent.slug || undefined,
  description: dbAgent.description || undefined,
  avatar: dbAgent.avatar || getInitials(dbAgent.name),
  avatarColor: dbAgent.avatar_color || getAvatarColor(dbAgent.name),
  agentType: dbAgent.agent_type,
  transport: dbAgent.transport,
  runtimeLocation: dbAgent.runtime_location || undefined,
  telegramBot: dbAgent.telegram_bot || undefined,
  status: dbAgent.status,
  apiKeyPreview: dbAgent.api_key_preview || undefined,
  lastSeenAt: dbAgent.last_seen_at ? new Date(dbAgent.last_seen_at).getTime() : undefined,
  metadata: dbAgent.metadata || {},
  createdAt: new Date(dbAgent.created_at).getTime(),
});

export const useAgents = () => {
  const [agents, setAgents] = useState<CodingAgent[]>([]);
  const [hasFetched, setHasFetched] = useState(false);
  const { user, isLoading: authLoading } = useAuth();
  // Memoize the Supabase client to avoid creating a new instance on every render
  const supabase = useMemo(() => createClient(), []);
  const fetchingRef = useRef(false);

  const fetchAgents = useCallback(async () => {
    if (!user || fetchingRef.current) return;

    fetchingRef.current = true;
    try {
      const { data, error } = await supabase
        .from('agents')
        .select('*')
        .order('created_at', { ascending: true });

      if (error) {
        console.error('Error fetching agents:', error);
      } else {
        setAgents((data || []).map(mapDbAgentToAgent));
      }
    } finally {
      setHasFetched(true);
      fetchingRef.current = false;
    }
  }, [user, supabase]);

  useEffect(() => {
    if (authLoading) return;
    if (!user) {
      setAgents([]);
      setHasFetched(true);
      return;
    }

    setHasFetched(false);
    void fetchAgents();

    const interval = window.setInterval(() => {
      void fetchAgents();
    }, 10000);

    return () => window.clearInterval(interval);
  }, [authLoading, user, fetchAgents]);

  // Derived loading state
  const isLoaded = useMemo(() => {
    if (authLoading) return false;
    if (!user) return true; // No user = loaded with empty state
    return hasFetched;
  }, [authLoading, user, hasFetched]);

  const addAgent = useCallback(async (agent: CodingAgent, apiKeyHash?: string) => {
    if (!user) return null;

    const { data, error } = await supabase
      .from('agents')
      .insert({
        user_id: user.id,
        name: agent.name,
        slug: agent.slug || null,
        description: agent.description || null,
        avatar: agent.avatar || null,
        avatar_color: agent.avatarColor || null,
        agent_type: agent.agentType || 'manual',
        transport: agent.transport || 'web',
        runtime_location: agent.runtimeLocation || null,
        telegram_bot: agent.telegramBot || null,
        status: agent.status || 'offline',
        api_key_hash: apiKeyHash || null,
        api_key_preview: agent.apiKeyPreview || null,
        last_seen_at: agent.lastSeenAt ? new Date(agent.lastSeenAt).toISOString() : null,
        metadata: agent.metadata || {},
      })
      .select()
      .single();

    if (error) {
      console.error('Error adding agent:', error);
      throw error;
    }

    if (data) {
      const mapped = mapDbAgentToAgent(data);
      setAgents((prev) => [...prev, mapped]);
      return mapped;
    }
    return null;
  }, [user, supabase]);

  const updateAgent = useCallback(async (updatedAgent: CodingAgent) => {
    if (!user) return;

    const { error } = await supabase
      .from('agents')
      .update({
        name: updatedAgent.name,
        slug: updatedAgent.slug || null,
        description: updatedAgent.description || null,
        avatar: updatedAgent.avatar || null,
        avatar_color: updatedAgent.avatarColor || null,
        agent_type: updatedAgent.agentType || 'manual',
        transport: updatedAgent.transport || 'web',
        runtime_location: updatedAgent.runtimeLocation || null,
        telegram_bot: updatedAgent.telegramBot || null,
        status: updatedAgent.status || 'offline',
        api_key_preview: updatedAgent.apiKeyPreview || null,
        last_seen_at: updatedAgent.lastSeenAt ? new Date(updatedAgent.lastSeenAt).toISOString() : null,
        metadata: updatedAgent.metadata || {},
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
