'use client';

import { useState, useEffect, useCallback, useMemo } from 'react';
import { AgentPerformance } from '@/types/agentPerformance';
import { createClient } from '@/lib/supabase/client';
import { useAuth } from '@/contexts/AuthContext';

interface DbAgentPerformance {
  id: string;
  user_id: string;
  agent_id: string;
  task_id: string;
  completion_time_hours: number | null;
  quality_rating: number | null;
  notes: string | null;
  created_at: string;
}

const mapDbPerfToPerf = (dbPerf: DbAgentPerformance): AgentPerformance => ({
  id: dbPerf.id,
  agentId: dbPerf.agent_id,
  taskId: dbPerf.task_id,
  completionTimeHours: dbPerf.completion_time_hours || undefined,
  qualityRating: dbPerf.quality_rating as 1 | 2 | 3 | 4 | 5 | undefined,
  notes: dbPerf.notes || undefined,
  createdAt: new Date(dbPerf.created_at).getTime(),
});

export const useAgentPerformance = () => {
  const [performances, setPerformances] = useState<AgentPerformance[]>([]);
  const [hasFetched, setHasFetched] = useState(false);
  const { user, isLoading: authLoading } = useAuth();
  const supabase = useMemo(() => createClient(), []);

  useEffect(() => {
    if (authLoading || hasFetched || !user) return;

    const fetchPerformances = async () => {
      const { data, error } = await supabase
        .from('agent_performance')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) {
        console.error('Error fetching agent performance:', error);
      } else {
        setPerformances((data || []).map(mapDbPerfToPerf));
      }
      setHasFetched(true);
    };

    fetchPerformances();
  }, [user, authLoading, hasFetched, supabase]);

  const addPerformance = useCallback(async (perf: Omit<AgentPerformance, 'id' | 'createdAt'>) => {
    if (!user) return;

    const { data, error } = await supabase
      .from('agent_performance')
      .insert({
        user_id: user.id,
        agent_id: perf.agentId,
        task_id: perf.taskId,
        completion_time_hours: perf.completionTimeHours || null,
        quality_rating: perf.qualityRating || null,
        notes: perf.notes || null,
      })
      .select()
      .single();

    if (error) {
      console.error('Error adding performance:', error);
      return;
    }

    if (data) {
      setPerformances((prev) => [mapDbPerfToPerf(data), ...prev]);
    }
  }, [user, supabase]);

  return {
    performances,
    addPerformance,
    isLoaded: hasFetched,
  };
};
