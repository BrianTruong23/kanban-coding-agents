import { useState, useEffect, useMemo } from 'react';
import { AgentPerformance, AgentPerformanceStats } from '@/types/agent';
import { createClient } from '@/lib/supabase/client';

export function useAgentPerformance(userId?: string) {
  const [performances, setPerformances] = useState<AgentPerformance[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const supabase = useMemo(() => createClient(), []);

  useEffect(() => {
    if (!userId) {
      setLoading(false);
      return;
    }

    loadPerformances();

    // Subscribe to changes
    const channel = supabase
      .channel('agent_performance_changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'agent_performance',
          filter: `user_id=eq.${userId}`,
        },
        () => {
          loadPerformances();
        }
      )
      .subscribe();

    return () => {
      channel.unsubscribe();
    };
  }, [userId, supabase]);

  async function loadPerformances() {
    try {
      setLoading(true);
      setError(null);

      const { data, error: fetchError } = await supabase
        .from('agent_performance')
        .select('*')
        .order('created_at', { ascending: false });

      if (fetchError) throw fetchError;

      const mapped: AgentPerformance[] = (data || []).map(row => ({
        id: row.id,
        agentId: row.agent_id,
        taskId: row.task_id,
        completedAt: row.completed_at ? new Date(row.completed_at).getTime() : undefined,
        qualityScore: row.quality_score as 1 | 2 | 3 | 4 | 5 | undefined,
        efficiencyScore: row.efficiency_score as 1 | 2 | 3 | 4 | 5 | undefined,
        estimatedHours: row.estimated_hours,
        actualHours: row.actual_hours,
        onTime: row.on_time ?? true,
        notes: row.notes,
        createdAt: new Date(row.created_at).getTime(),
        updatedAt: new Date(row.updated_at).getTime(),
      }));

      setPerformances(mapped);
    } catch (err) {
      console.error('Error loading agent performance:', err);
      setError(err instanceof Error ? err.message : 'Failed to load performance data');
    } finally {
      setLoading(false);
    }
  }

  async function recordPerformance(performance: Omit<AgentPerformance, 'id' | 'createdAt' | 'updatedAt'>) {
    try {
      const { data: userData } = await supabase.auth.getUser();
      if (!userData.user) throw new Error('Not authenticated');

      const { error: insertError } = await supabase.from('agent_performance').insert({
        user_id: userData.user.id,
        agent_id: performance.agentId,
        task_id: performance.taskId,
        completed_at: performance.completedAt ? new Date(performance.completedAt).toISOString() : null,
        quality_score: performance.qualityScore,
        efficiency_score: performance.efficiencyScore,
        estimated_hours: performance.estimatedHours,
        actual_hours: performance.actualHours,
        on_time: performance.onTime,
        notes: performance.notes,
      });

      if (insertError) throw insertError;

      await loadPerformances();
    } catch (err) {
      console.error('Error recording performance:', err);
      throw err;
    }
  }

  async function updatePerformance(performanceId: string, updates: Partial<AgentPerformance>) {
    try {
      const updateData: Record<string, unknown> = {};

      if (updates.completedAt !== undefined) {
        updateData.completed_at = updates.completedAt ? new Date(updates.completedAt).toISOString() : null;
      }
      if (updates.qualityScore !== undefined) updateData.quality_score = updates.qualityScore;
      if (updates.efficiencyScore !== undefined) updateData.efficiency_score = updates.efficiencyScore;
      if (updates.estimatedHours !== undefined) updateData.estimated_hours = updates.estimatedHours;
      if (updates.actualHours !== undefined) updateData.actual_hours = updates.actualHours;
      if (updates.onTime !== undefined) updateData.on_time = updates.onTime;
      if (updates.notes !== undefined) updateData.notes = updates.notes;

      const { error: updateError } = await supabase
        .from('agent_performance')
        .update(updateData)
        .eq('id', performanceId);

      if (updateError) throw updateError;

      await loadPerformances();
    } catch (err) {
      console.error('Error updating performance:', err);
      throw err;
    }
  }

  // Get performance records by agent ID
  function getPerformanceByAgent(agentId: string): AgentPerformance[] {
    return performances.filter(perf => perf.agentId === agentId);
  }

  // Get performance stats for an agent
  function getAgentStats(agentId: string): AgentPerformanceStats {
    const agentPerformances = getPerformanceByAgent(agentId);
    const completed = agentPerformances.filter(p => p.completedAt);

    if (completed.length === 0) {
      return {
        totalTasksCompleted: 0,
        averageQualityScore: 0,
        averageEfficiencyScore: 0,
        onTimePercentage: 0,
        averageHoursPerTask: 0,
        totalHours: 0,
      };
    }

    const totalQuality = completed.reduce((sum, p) => sum + (p.qualityScore || 0), 0);
    const totalEfficiency = completed.reduce((sum, p) => sum + (p.efficiencyScore || 0), 0);
    const onTimeCount = completed.filter(p => p.onTime).length;
    const totalHours = completed.reduce((sum, p) => sum + (p.actualHours || 0), 0);

    const withQuality = completed.filter(p => p.qualityScore).length;
    const withEfficiency = completed.filter(p => p.efficiencyScore).length;

    return {
      totalTasksCompleted: completed.length,
      averageQualityScore: withQuality > 0 ? totalQuality / withQuality : 0,
      averageEfficiencyScore: withEfficiency > 0 ? totalEfficiency / withEfficiency : 0,
      onTimePercentage: (onTimeCount / completed.length) * 100,
      averageHoursPerTask: totalHours / completed.length,
      totalHours,
    };
  }

  // Get performance map (agentId -> performances[])
  const performanceByAgent = useMemo(() => {
    const map = new Map<string, AgentPerformance[]>();
    performances.forEach(perf => {
      const agentPerfs = map.get(perf.agentId) || [];
      agentPerfs.push(perf);
      map.set(perf.agentId, agentPerfs);
    });
    return map;
  }, [performances]);

  return {
    performances,
    performanceByAgent,
    loading,
    error,
    recordPerformance,
    updatePerformance,
    getPerformanceByAgent,
    getAgentStats,
    refresh: loadPerformances,
  };
}
