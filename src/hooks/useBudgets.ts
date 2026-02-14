'use client';

import { useState, useEffect, useCallback, useMemo } from 'react';
import { TaskBudget, BudgetAlert, BudgetHistory, BudgetFilter, BudgetSummary } from '@/types/budget';
import { createClient } from '@/lib/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { calculatePercentages } from '@/lib/budget-tracker';

interface DbBudget {
  id: string;
  user_id: string;
  task_id: string;
  agent_id: string | null;
  status: string;
  limits: {
    tokens?: number;
    cost?: number;
    time?: number;
    retries?: number;
  };
  usage: {
    tokens: number;
    cost: number;
    time: number;
    retries: number;
    apiCalls: number;
    fileOperations: number;
  };
  warning_thresholds: {
    tokens?: number;
    cost?: number;
    time?: number;
  };
  auto_actions_enabled: boolean;
  auto_pause_on_exceed: boolean;
  created_at: string;
  updated_at: string;
  paused_at: string | null;
  resumed_at: string | null;
  completed_at: string | null;
}

interface DbAlert {
  id: string;
  user_id: string;
  budget_id: string;
  timestamp: string;
  type: string;
  resource_type: string;
  message: string;
  threshold: number;
  current_usage: number;
  limit_value: number;
  acknowledged: boolean;
  acknowledged_at: string | null;
}

interface DbHistory {
  id: string;
  user_id: string;
  budget_id: string;
  timestamp: string;
  action: string;
  resource_snapshot: {
    tokens: number;
    cost: number;
    time: number;
    retries: number;
    apiCalls: number;
    fileOperations: number;
  };
  triggered_by: string;
  notes: string | null;
}

const mapDbBudgetToTaskBudget = (dbBudget: DbBudget): TaskBudget => ({
  id: dbBudget.id,
  taskId: dbBudget.task_id,
  agentId: dbBudget.agent_id || undefined,
  status: dbBudget.status as TaskBudget['status'],
  limits: dbBudget.limits,
  usage: dbBudget.usage,
  alerts: [], // Loaded separately
  warningThresholds: dbBudget.warning_thresholds,
  autoActionsEnabled: dbBudget.auto_actions_enabled,
  autoPauseOnExceed: dbBudget.auto_pause_on_exceed,
  createdAt: new Date(dbBudget.created_at).getTime(),
  updatedAt: new Date(dbBudget.updated_at).getTime(),
  pausedAt: dbBudget.paused_at ? new Date(dbBudget.paused_at).getTime() : undefined,
  resumedAt: dbBudget.resumed_at ? new Date(dbBudget.resumed_at).getTime() : undefined,
  completedAt: dbBudget.completed_at ? new Date(dbBudget.completed_at).getTime() : undefined,
});

const mapDbAlertToBudgetAlert = (dbAlert: DbAlert): BudgetAlert => ({
  id: dbAlert.id,
  budgetId: dbAlert.budget_id,
  timestamp: new Date(dbAlert.timestamp).getTime(),
  type: dbAlert.type as BudgetAlert['type'],
  resourceType: dbAlert.resource_type as BudgetAlert['resourceType'],
  message: dbAlert.message,
  threshold: dbAlert.threshold,
  currentUsage: dbAlert.current_usage,
  limit: dbAlert.limit_value,
});

const mapDbHistoryToBudgetHistory = (dbHistory: DbHistory): BudgetHistory => ({
  id: dbHistory.id,
  budgetId: dbHistory.budget_id,
  timestamp: new Date(dbHistory.timestamp).getTime(),
  action: dbHistory.action as BudgetHistory['action'],
  resourceSnapshot: dbHistory.resource_snapshot,
  triggeredBy: dbHistory.triggered_by as BudgetHistory['triggeredBy'],
  notes: dbHistory.notes || undefined,
});

export const useBudgets = (filter?: BudgetFilter) => {
  const [budgets, setBudgets] = useState<TaskBudget[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const { user } = useAuth();
  const supabase = useMemo(() => createClient(), []);

  const fetchBudgets = useCallback(async () => {
    if (!user) {
      setIsLoading(false);
      return;
    }

    setIsLoading(true);
    let query = supabase.from('task_budgets').select('*');

    if (filter?.taskId) query = query.eq('task_id', filter.taskId);
    if (filter?.agentId) query = query.eq('agent_id', filter.agentId);
    if (filter?.status) query = query.eq('status', filter.status);
    if (filter?.createdFrom) {
      query = query.gte('created_at', new Date(filter.createdFrom).toISOString());
    }
    if (filter?.createdTo) {
      query = query.lte('created_at', new Date(filter.createdTo).toISOString());
    }

    const { data, error } = await query.order('created_at', { ascending: false });

    if (error) {
      console.error('Error fetching budgets:', error);
    } else {
      let budgetsData = (data || []).map(mapDbBudgetToTaskBudget);

      // Apply client-side filter for exceededOnly
      if (filter?.exceededOnly) {
        budgetsData = budgetsData.filter(b => b.status === 'exceeded');
      }

      setBudgets(budgetsData);
    }
    setIsLoading(false);
  }, [user, filter, supabase]);

  useEffect(() => {
    fetchBudgets();
  }, [fetchBudgets]);

  const createBudget = useCallback(
    async (budget: Omit<TaskBudget, 'id' | 'createdAt' | 'updatedAt' | 'alerts'>) => {
      if (!user) throw new Error('You must be logged in to create budgets');

      const { data, error } = await supabase
        .from('task_budgets')
        .insert({
          user_id: user.id,
          task_id: budget.taskId,
          agent_id: budget.agentId || null,
          status: budget.status,
          limits: budget.limits,
          usage: budget.usage,
          warning_thresholds: budget.warningThresholds,
          auto_actions_enabled: budget.autoActionsEnabled,
          auto_pause_on_exceed: budget.autoPauseOnExceed,
        })
        .select()
        .single();

      if (error) {
        console.error('Error creating budget:', error);
        throw new Error(error.message);
      }

      if (data) {
        const newBudget = mapDbBudgetToTaskBudget(data);
        setBudgets((prev) => [newBudget, ...prev]);
        return newBudget;
      }

      throw new Error('Failed to create budget');
    },
    [user, supabase]
  );

  const updateBudget = useCallback(
    async (budgetId: string, updates: Partial<TaskBudget>) => {
      if (!user) return;

      const updateData: Record<string, unknown> = {};
      if (updates.status !== undefined) updateData.status = updates.status;
      if (updates.limits !== undefined) updateData.limits = updates.limits;
      if (updates.usage !== undefined) updateData.usage = updates.usage;
      if (updates.warningThresholds !== undefined)
        updateData.warning_thresholds = updates.warningThresholds;
      if (updates.autoActionsEnabled !== undefined)
        updateData.auto_actions_enabled = updates.autoActionsEnabled;
      if (updates.autoPauseOnExceed !== undefined)
        updateData.auto_pause_on_exceed = updates.autoPauseOnExceed;
      if (updates.pausedAt !== undefined)
        updateData.paused_at = updates.pausedAt ? new Date(updates.pausedAt).toISOString() : null;
      if (updates.resumedAt !== undefined)
        updateData.resumed_at = updates.resumedAt
          ? new Date(updates.resumedAt).toISOString()
          : null;
      if (updates.completedAt !== undefined)
        updateData.completed_at = updates.completedAt
          ? new Date(updates.completedAt).toISOString()
          : null;

      const { error } = await supabase
        .from('task_budgets')
        .update(updateData)
        .eq('id', budgetId);

      if (error) {
        console.error('Error updating budget:', error);
        return;
      }

      setBudgets((prev) =>
        prev.map((b) =>
          b.id === budgetId ? { ...b, ...updates, updatedAt: Date.now() } : b
        )
      );
    },
    [user, supabase]
  );

  const deleteBudget = useCallback(
    async (budgetId: string) => {
      if (!user) return;

      const { error } = await supabase.from('task_budgets').delete().eq('id', budgetId);

      if (error) {
        console.error('Error deleting budget:', error);
        return;
      }

      setBudgets((prev) => prev.filter((b) => b.id !== budgetId));
    },
    [user, supabase]
  );

  const pauseBudget = useCallback(
    async (budgetId: string) => {
      await updateBudget(budgetId, {
        status: 'paused',
        pausedAt: Date.now(),
      });
    },
    [updateBudget]
  );

  const resumeBudget = useCallback(
    async (budgetId: string) => {
      await updateBudget(budgetId, {
        status: 'active',
        resumedAt: Date.now(),
      });
    },
    [updateBudget]
  );

  const completeBudget = useCallback(
    async (budgetId: string) => {
      await updateBudget(budgetId, {
        status: 'completed',
        completedAt: Date.now(),
      });
    },
    [updateBudget]
  );

  const fetchAlerts = useCallback(
    async (budgetId?: string) => {
      if (!user) return [];

      let query = supabase.from('budget_alerts').select('*');
      if (budgetId) query = query.eq('budget_id', budgetId);

      const { data, error } = await query.order('timestamp', { ascending: false });

      if (error) {
        console.error('Error fetching alerts:', error);
        return [];
      }

      return (data || []).map(mapDbAlertToBudgetAlert);
    },
    [user, supabase]
  );

  const fetchHistory = useCallback(
    async (budgetId: string) => {
      if (!user) return [];

      const { data, error } = await supabase
        .from('budget_history')
        .select('*')
        .eq('budget_id', budgetId)
        .order('timestamp', { ascending: false });

      if (error) {
        console.error('Error fetching budget history:', error);
        return [];
      }

      return (data || []).map(mapDbHistoryToBudgetHistory);
    },
    [user, supabase]
  );

  const getBudgetSummaries = useCallback((): BudgetSummary[] => {
    return budgets.map((budget) => ({
      id: budget.id,
      taskId: budget.taskId,
      agentId: budget.agentId,
      status: budget.status,
      limits: budget.limits,
      usage: budget.usage,
      percentageUsed: calculatePercentages(budget.usage, budget.limits),
      alertCount: budget.alerts.length,
      createdAt: budget.createdAt,
      updatedAt: budget.updatedAt,
    }));
  }, [budgets]);

  return {
    budgets,
    isLoading,
    createBudget,
    updateBudget,
    deleteBudget,
    pauseBudget,
    resumeBudget,
    completeBudget,
    fetchAlerts,
    fetchHistory,
    getBudgetSummaries,
    refetch: fetchBudgets,
  };
};
