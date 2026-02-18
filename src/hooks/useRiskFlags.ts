'use client';

import { useState, useEffect, useCallback, useMemo } from 'react';
import { RiskFlag } from '@/types/dependencies';
import { createClient } from '@/lib/supabase/client';
import { useAuth } from '@/contexts/AuthContext';

interface DbRiskFlag {
  id: string;
  user_id: string;
  task_id: string;
  level: string;
  category: string;
  description: string;
  mitigation: string | null;
  created_at: string;
  resolved_at: string | null;
}

const mapDbRiskFlag = (db: DbRiskFlag): RiskFlag => ({
  id: db.id,
  taskId: db.task_id,
  level: db.level as RiskFlag['level'],
  category: db.category,
  description: db.description,
  mitigation: db.mitigation || undefined,
  createdAt: new Date(db.created_at).getTime(),
  resolvedAt: db.resolved_at ? new Date(db.resolved_at).getTime() : undefined,
});

export const useRiskFlags = () => {
  const [riskFlags, setRiskFlags] = useState<RiskFlag[]>([]);
  const [isLoaded, setIsLoaded] = useState(false);
  const { user, isLoading: authLoading } = useAuth();
  const supabase = useMemo(() => createClient(), []);

  useEffect(() => {
    if (authLoading || !user) return;

    const fetchRiskFlags = async () => {
      const { data, error } = await supabase
        .from('risk_flags')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) {
        console.error('Error fetching risk flags:', error);
      } else {
        setRiskFlags((data || []).map(mapDbRiskFlag));
      }
      setIsLoaded(true);
    };

    fetchRiskFlags();
  }, [user, authLoading, supabase]);

  const addRiskFlag = useCallback(
    async (riskFlag: Omit<RiskFlag, 'id' | 'createdAt'>) => {
      if (!user) return;

      const { data, error } = await supabase
        .from('risk_flags')
        .insert({
          user_id: user.id,
          task_id: riskFlag.taskId,
          level: riskFlag.level,
          category: riskFlag.category,
          description: riskFlag.description,
          mitigation: riskFlag.mitigation || null,
        })
        .select()
        .single();

      if (error) {
        console.error('Error adding risk flag:', error);
        throw new Error(error.message);
      }

      if (data) {
        setRiskFlags((prev) => [mapDbRiskFlag(data), ...prev]);
      }
    },
    [user, supabase]
  );

  const resolveRiskFlag = useCallback(
    async (id: string) => {
      if (!user) return;

      const { error } = await supabase
        .from('risk_flags')
        .update({ resolved_at: new Date().toISOString() })
        .eq('id', id);

      if (error) {
        console.error('Error resolving risk flag:', error);
        return;
      }

      setRiskFlags((prev) =>
        prev.map((flag) =>
          flag.id === id ? { ...flag, resolvedAt: Date.now() } : flag
        )
      );
    },
    [user, supabase]
  );

  const getRiskFlagsForTask = useCallback(
    (taskId: string) => {
      return riskFlags.filter((flag) => flag.taskId === taskId && !flag.resolvedAt);
    },
    [riskFlags]
  );

  return {
    riskFlags,
    addRiskFlag,
    resolveRiskFlag,
    getRiskFlagsForTask,
    isLoaded,
  };
};
