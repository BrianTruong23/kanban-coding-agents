import { useState, useEffect, useCallback, useMemo } from 'react';
import { createClient } from '@/lib/supabase/client';
import type {
  TriageItem,
  TriageCluster,
  TriageStats,
  TriageFilters,
  TriageStatus,
  TriageSeverity,
} from '@/types/triage';

export function useTriageInbox() {
  const [items, setItems] = useState<TriageItem[]>([]);
  const [clusters, setClusters] = useState<TriageCluster[]>([]);
  const [stats, setStats] = useState<TriageStats | null>(null);
  const [isLoaded, setIsLoaded] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const supabase = useMemo(() => createClient(), []);

  // Fetch triage items
  const fetchItems = useCallback(async (filters?: TriageFilters) => {
    try {
      setIsLoading(true);
      setError(null);

      let query = supabase
        .from('triage_items')
        .select('*')
        .order('created_at', { ascending: false });

      // Apply filters
      if (filters?.status && filters.status.length > 0) {
        query = query.in('status', filters.status);
      }
      if (filters?.source && filters.source.length > 0) {
        query = query.in('source', filters.source);
      }
      if (filters?.severity && filters.severity.length > 0) {
        query = query.in('severity', filters.severity);
      }
      if (filters?.clusterId) {
        query = query.eq('cluster_id', filters.clusterId);
      }
      if (filters?.search) {
        query = query.or(`title.ilike.%${filters.search}%,description.ilike.%${filters.search}%`);
      }
      if (filters?.dateFrom) {
        query = query.gte('created_at', filters.dateFrom.toISOString());
      }
      if (filters?.dateTo) {
        query = query.lte('created_at', filters.dateTo.toISOString());
      }

      const { data, error: fetchError } = await query;

      if (fetchError) throw fetchError;

      const triageItems: TriageItem[] = (data || []).map(item => ({
        ...item,
        createdAt: new Date(item.created_at).getTime(),
        updatedAt: new Date(item.updated_at).getTime(),
        triagedAt: item.triaged_at ? new Date(item.triaged_at).getTime() : undefined,
      }));

      setItems(triageItems);
    } catch (err) {
      console.error('Error fetching triage items:', err);
      setError(err instanceof Error ? err.message : 'Failed to fetch items');
    } finally {
      setIsLoading(false);
      setIsLoaded(true);
    }
  }, [supabase]);

  // Fetch clusters
  const fetchClusters = useCallback(async () => {
    try {
      const { data, error: fetchError } = await supabase
        .from('triage_clusters')
        .select('*')
        .order('created_at', { ascending: false });

      if (fetchError) throw fetchError;

      const triageClusters: TriageCluster[] = (data || []).map(cluster => ({
        ...cluster,
        createdAt: new Date(cluster.created_at).getTime(),
        updatedAt: new Date(cluster.updated_at).getTime(),
      }));

      setClusters(triageClusters);
    } catch (err) {
      console.error('Error fetching clusters:', err);
    }
  }, [supabase]);

  // Fetch statistics
  const fetchStats = useCallback(async () => {
    try {
      const { data, error: statsError } = await supabase
        .from('triage_stats')
        .select('*')
        .single();

      if (statsError) throw statsError;

      if (data) {
        const triageStats: TriageStats = {
          total: data.total || 0,
          byStatus: {
            pending: data.pending_count || 0,
            triaged: data.triaged_count || 0,
            assigned: data.assigned_count || 0,
            duplicate: data.duplicate_count || 0,
            resolved: data.resolved_count || 0,
            ignored: data.ignored_count || 0,
          },
          bySource: {
            github_issue: data.github_issue_count || 0,
            ci_failure: data.ci_failure_count || 0,
            error_log: data.error_log_count || 0,
            user_feedback: data.user_feedback_count || 0,
            sentry: 0,
            manual: 0,
          },
          bySeverity: {
            critical: data.critical_count || 0,
            high: data.high_count || 0,
            medium: data.medium_count || 0,
            low: data.low_count || 0,
            info: 0,
          },
          clustersCount: data.clusters_count || 0,
          duplicatesCount: data.duplicate_count || 0,
          avgTriageTime: data.avg_triage_time_ms || 0,
        };

        setStats(triageStats);
      }
    } catch (err) {
      console.error('Error fetching stats:', err);
    }
  }, [supabase]);

  // Update item status
  const updateItemStatus = useCallback(async (itemId: string, status: TriageStatus) => {
    try {
      const updates: any = { status };

      // Set triaged_at when status changes from pending
      if (status !== 'pending') {
        updates.triaged_at = new Date().toISOString();
      }

      const { error: updateError } = await supabase
        .from('triage_items')
        .update(updates)
        .eq('id', itemId);

      if (updateError) throw updateError;

      // Update local state
      setItems(prev => prev.map(item =>
        item.id === itemId
          ? { ...item, status, triagedAt: status !== 'pending' ? Date.now() : item.triagedAt }
          : item
      ));

      // Refresh stats
      await fetchStats();
    } catch (err) {
      console.error('Error updating item status:', err);
      throw err;
    }
  }, [supabase, fetchStats]);

  // Update item severity
  const updateItemSeverity = useCallback(async (itemId: string, severity: TriageSeverity) => {
    try {
      const { error: updateError } = await supabase
        .from('triage_items')
        .update({ severity })
        .eq('id', itemId);

      if (updateError) throw updateError;

      setItems(prev => prev.map(item =>
        item.id === itemId ? { ...item, severity } : item
      ));
    } catch (err) {
      console.error('Error updating item severity:', err);
      throw err;
    }
  }, [supabase]);

  // Assign item to agent
  const assignItem = useCallback(async (itemId: string, agentId: string) => {
    try {
      const { error: updateError } = await supabase
        .from('triage_items')
        .update({
          suggested_owner: agentId,
          status: 'assigned',
          triaged_at: new Date().toISOString(),
        })
        .eq('id', itemId);

      if (updateError) throw updateError;

      setItems(prev => prev.map(item =>
        item.id === itemId
          ? { ...item, suggestedOwner: agentId, status: 'assigned', triagedAt: Date.now() }
          : item
      ));

      await fetchStats();
    } catch (err) {
      console.error('Error assigning item:', err);
      throw err;
    }
  }, [supabase, fetchStats]);

  // Convert item to task
  const convertToTask = useCallback(async (itemId: string, taskId: string) => {
    try {
      const { error: updateError } = await supabase
        .from('triage_items')
        .update({
          assigned_task_id: taskId,
          status: 'assigned',
          triaged_at: new Date().toISOString(),
        })
        .eq('id', itemId);

      if (updateError) throw updateError;

      setItems(prev => prev.map(item =>
        item.id === itemId
          ? { ...item, assignedTaskId: taskId, status: 'assigned', triagedAt: Date.now() }
          : item
      ));

      await fetchStats();
    } catch (err) {
      console.error('Error converting to task:', err);
      throw err;
    }
  }, [supabase, fetchStats]);

  // Delete item
  const deleteItem = useCallback(async (itemId: string) => {
    try {
      const { error: deleteError } = await supabase
        .from('triage_items')
        .delete()
        .eq('id', itemId);

      if (deleteError) throw deleteError;

      setItems(prev => prev.filter(item => item.id !== itemId));
      await fetchStats();
    } catch (err) {
      console.error('Error deleting item:', err);
      throw err;
    }
  }, [supabase, fetchStats]);

  // Trigger clustering
  const triggerClustering = useCallback(async (similarityThreshold = 0.3) => {
    try {
      setIsLoading(true);
      const response = await fetch('/api/triage/cluster', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ similarityThreshold }),
      });

      if (!response.ok) throw new Error('Failed to cluster items');

      const result = await response.json();

      // Refresh data
      await Promise.all([fetchItems(), fetchClusters(), fetchStats()]);

      return result;
    } catch (err) {
      console.error('Error clustering items:', err);
      throw err;
    } finally {
      setIsLoading(false);
    }
  }, [fetchItems, fetchClusters, fetchStats]);

  // Initial load
  useEffect(() => {
    fetchItems();
    fetchClusters();
    fetchStats();
  }, [fetchItems, fetchClusters, fetchStats]);

  return {
    items,
    clusters,
    stats,
    isLoaded,
    isLoading,
    error,
    fetchItems,
    fetchClusters,
    updateItemStatus,
    updateItemSeverity,
    assignItem,
    convertToTask,
    deleteItem,
    triggerClustering,
  };
}
