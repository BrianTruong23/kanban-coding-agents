'use client';

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { createClient } from '@/lib/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { AgentMessage } from '@/types/message';

interface DbMessage {
  id: string;
  user_id: string;
  from_agent_id: string | null;
  to_agent_id: string | null;
  task_id: string | null;
  body: string;
  channel: 'global' | 'direct' | 'task';
  created_by: 'user' | 'agent' | 'system';
  metadata: Record<string, unknown> | null;
  created_at: string;
}

const mapDbMessage = (message: DbMessage): AgentMessage => ({
  id: message.id,
  userId: message.user_id,
  fromAgentId: message.from_agent_id || undefined,
  toAgentId: message.to_agent_id || undefined,
  taskId: message.task_id || undefined,
  body: message.body,
  channel: message.channel,
  createdBy: message.created_by,
  metadata: message.metadata || {},
  createdAt: new Date(message.created_at).getTime(),
});

export const useMessages = () => {
  const [messages, setMessages] = useState<AgentMessage[]>([]);
  const [hasFetched, setHasFetched] = useState(false);
  const [isSending, setIsSending] = useState(false);
  const { user, isLoading: authLoading } = useAuth();
  const supabase = useMemo(() => createClient(), []);
  const fetchingRef = useRef(false);

  const fetchMessages = useCallback(async () => {
    if (!user || fetchingRef.current) return;

    fetchingRef.current = true;
    try {
      const { data, error } = await supabase
        .from('agent_messages')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(50);

      if (error) {
        console.error('Error fetching messages:', error);
      } else {
        setMessages((data || []).map(mapDbMessage));
      }
    } finally {
      setHasFetched(true);
      fetchingRef.current = false;
    }
  }, [user, supabase]);

  useEffect(() => {
    if (authLoading) return;
    if (!user) {
      setMessages([]);
      setHasFetched(true);
      return;
    }

    setHasFetched(false);
    void fetchMessages();

    const interval = window.setInterval(() => {
      void fetchMessages();
    }, 5000);

    return () => window.clearInterval(interval);
  }, [authLoading, user, fetchMessages]);

  const sendMessage = useCallback(async (input: {
    body: string;
    toAgentId?: string;
    taskId?: string;
    channel?: AgentMessage['channel'];
  }) => {
    if (!user) throw new Error('You must be logged in to send messages');

    setIsSending(true);
    try {
      const channel =
        input.channel || (input.taskId ? 'task' : input.toAgentId ? 'direct' : 'global');

      const { data, error } = await supabase
        .from('agent_messages')
        .insert({
          user_id: user.id,
          body: input.body,
          to_agent_id: input.toAgentId || null,
          task_id: input.taskId || null,
          channel,
          created_by: 'user',
        })
        .select()
        .single();

      if (error) {
        console.error('Error sending message:', error);
        throw error;
      }

      if (data) {
        setMessages((prev) => [mapDbMessage(data), ...prev].slice(0, 50));
      }
    } finally {
      setIsSending(false);
    }
  }, [user, supabase]);

  return {
    messages,
    isLoaded: authLoading ? false : hasFetched,
    isSending,
    sendMessage,
    refreshMessages: fetchMessages,
  };
};
