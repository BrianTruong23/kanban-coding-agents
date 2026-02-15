'use client';

import { useState, useEffect, useCallback, useMemo } from 'react';
import { Budget, BudgetUsageEntry, BudgetAlert, BudgetSummary } from '@/types/budget';
import { createClient } from '@/lib/supabase/client';
import { useAuth } from '@/contexts/AuthContext';

interface DbBudget {
  id: string;
  user_id: string;
  task_id: string;
  max_cost: number | null;
  max_tokens: number | null;
  max_time: number | null;
  current_cost: number;
  current_tokens: number;
  current_time: number;
  max_retries: number;
  current_retries: number;
  status: string;
  paused_reason: string | null;
  created_at: string;
  updated_at: string;
}

interface DbBudgetUsageEntry {
  id: string;
  budget_id: string;
  task_id: string;
  cost_incurred: number;
  tokens_used: number;
  time_spent: number;
  agent_id: string | null;
  operation: string;
  success: boolean;
  error_message: string | null;
  created_at: string;
}

interface DbBudgetAlert {
  id: string;
  budget_id: string;
  task_id: string;
  alert_type: string;
  budget_type: string;
  message: string;
  threshold: number;
  current_usage: number;
  limit_value: number;
  acknowledged: boolean;
  created_at: string;
}

const mapDbBudgetToBudget = (dbBudget: DbBudget): Budget => ({
  id: dbBudget.id,
  taskId: dbBudget.task_id,
  userId: dbBudget.user_id,
  maxCost: dbBudget.max_cost !== null ? dbBudget.max_cost : undefined,
  maxTokens: dbBudget.max_tokens !== null ? dbBudget.max_tokens : undefined,
  maxTime: dbBudget.max_time !== null ? dbBudget.max_time : undefined,
  currentCost: dbBudget.current_cost,
  currentTokens: dbBudget.current_tokens,
  currentTime: dbBudget.current_time,
  maxRetries: dbBudget.max_retries,
  currentRetries: dbBudget.current_retries,
  status: dbBudget.status as Budget['status'],
  pausedReason: dbBudget.paused_reason || undefined,
  createdAt: new Date(dbBudget.created_at).getTime(),
  updatedAt: new Date(dbBudget.updated_at).getTime(),
});

const mapDbUsageEntryToUsageEntry = (dbEntry: DbBudgetUsageEntry): BudgetUsageEntry => ({
  id: dbEntry.id,
  budgetId: dbEntry.budget_id,
  taskId: dbEntry.task_id,
  costIncurred: dbEntry.cost_incurred,
  tokensUsed: dbEntry.tokens_used,
  timeSpent: dbEntry.time_spent,
  agentId: dbEntry.agent_id || undefined,
  operation: dbEntry.operation,
  success: dbEntry.success,
  errorMessage: dbEntry.error_message || undefined,
  timestamp: new Date(dbEntry.created_at).getTime(),
});

const mapDbAlertToAlert = (dbAlert: DbBudgetAlert): BudgetAlert => ({
  id: dbAlert.id,
  budgetId: dbAlert.budget_id,
  taskId: dbAlert.task_id,
  alertType: dbAlert.alert_type as BudgetAlert['alertType'],
  budgetType: dbAlert.budget_type as BudgetAlert['budgetType'],
  message: dbAlert.message,
  threshold: dbAlert.threshold,
  currentUsage: dbAlert.current_usage,
  limit: dbAlert.limit_value,
  acknowledged: dbAlert.acknowledged,
  createdAt: new Date(dbAlert.created_at).getTime(),
});

export const useBudgets = () => {
  const [budgets, setBudgets] = useState<Budget[]>([]);
  const [usageEntries, setUsageEntries] = useState<BudgetUsageEntry[]>([]);
  const [alerts, setAlerts] = useState<BudgetAlert[]>([]);
  const [hasFetched, setHasFetched] = useState(false);
  const { user, isLoading: authLoading } = useAuth();
  const supabase = useMemo(() => createClient(), []);

  useEffect(() => {
    if (authLoading || hasFetched || !user) return;

    const fetchBudgetData = async () => {
      // Fetch budgets
      const { data: budgetsData, error: budgetsError } = await supabase
        .from('budgets')
        .select('*')
        .order('created_at', { ascending: false });

      if (budgetsError) {
        console.error('Error fetching budgets:', budgetsError);
      } else {
        setBudgets((budgetsData || []).map(mapDbBudgetToBudget));
      }

      // Fetch usage entries
      const { data: usageData, error: usageError } = await supabase
        .from('budget_usage_entries')
        .select('*')
        .order('created_at', { ascending: false });

      if (usageError) {
        console.error('Error fetching usage entries:', usageError);
      } else {
        setUsageEntries((usageData || []).map(mapDbUsageEntryToUsageEntry));
      }

      // Fetch alerts
      const { data: alertsData, error: alertsError } = await supabase
        .from('budget_alerts')
        .select('*')
        .order('created_at', { ascending: false });

      if (alertsError) {
        console.error('Error fetching alerts:', alertsError);
      } else {
        setAlerts((alertsData || []).map(mapDbAlertToAlert));
      }

      setHasFetched(true);
    };

    fetchBudgetData();
  }, [user, authLoading, hasFetched, supabase]);

  const isLoaded = useMemo(() => {
    if (authLoading) return false;
    if (!user) return true;
    return hasFetched;
  }, [authLoading, user, hasFetched]);

  const createBudget = useCallback(async (budget: Omit<Budget, 'id' | 'userId' | 'createdAt' | 'updatedAt'>) => {
    if (!user) {
      throw new Error('You must be logged in to create budgets');
    }

    const { data, error } = await supabase
      .from('budgets')
      .insert({
        user_id: user.id,
        task_id: budget.taskId,
        max_cost: budget.maxCost || null,
        max_tokens: budget.maxTokens || null,
        max_time: budget.maxTime || null,
        current_cost: budget.currentCost,
        current_tokens: budget.currentTokens,
        current_time: budget.currentTime,
        max_retries: budget.maxRetries,
        current_retries: budget.currentRetries,
        status: budget.status,
        paused_reason: budget.pausedReason || null,
      })
      .select()
      .single();

    if (error) {
      console.error('Error creating budget:', error);
      throw new Error(error.message);
    }

    if (data) {
      const newBudget = mapDbBudgetToBudget(data);
      setBudgets((prev) => [newBudget, ...prev]);
      return newBudget;
    } else {
      throw new Error('Failed to create budget: No data returned');
    }
  }, [user, supabase]);

  const updateBudget = useCallback(async (updatedBudget: Budget) => {
    if (!user) return;

    const { error } = await supabase
      .from('budgets')
      .update({
        max_cost: updatedBudget.maxCost || null,
        max_tokens: updatedBudget.maxTokens || null,
        max_time: updatedBudget.maxTime || null,
        max_retries: updatedBudget.maxRetries,
        status: updatedBudget.status,
        paused_reason: updatedBudget.pausedReason || null,
      })
      .eq('id', updatedBudget.id);

    if (error) {
      console.error('Error updating budget:', error);
      return;
    }

    setBudgets((prev) =>
      prev.map((b) => (b.id === updatedBudget.id ? { ...updatedBudget, updatedAt: Date.now() } : b))
    );
  }, [user, supabase]);

  const deleteBudget = useCallback(async (budgetId: string) => {
    if (!user) return;

    const { error } = await supabase
      .from('budgets')
      .delete()
      .eq('id', budgetId);

    if (error) {
      console.error('Error deleting budget:', error);
      return;
    }

    setBudgets((prev) => prev.filter((b) => b.id !== budgetId));
  }, [user, supabase]);

  const addUsageEntry = useCallback(async (entry: Omit<BudgetUsageEntry, 'id' | 'timestamp'>) => {
    if (!user) {
      throw new Error('You must be logged in to add usage entries');
    }

    const { data, error } = await supabase
      .from('budget_usage_entries')
      .insert({
        budget_id: entry.budgetId,
        task_id: entry.taskId,
        cost_incurred: entry.costIncurred,
        tokens_used: entry.tokensUsed,
        time_spent: entry.timeSpent,
        agent_id: entry.agentId || null,
        operation: entry.operation,
        success: entry.success,
        error_message: entry.errorMessage || null,
      })
      .select()
      .single();

    if (error) {
      console.error('Error adding usage entry:', error);
      throw new Error(error.message);
    }

    if (data) {
      const newEntry = mapDbUsageEntryToUsageEntry(data);
      setUsageEntries((prev) => [newEntry, ...prev]);

      // Re-fetch the budget to get updated values
      const { data: budgetData } = await supabase
        .from('budgets')
        .select('*')
        .eq('id', entry.budgetId)
        .single();

      if (budgetData) {
        setBudgets((prev) =>
          prev.map((b) => (b.id === entry.budgetId ? mapDbBudgetToBudget(budgetData) : b))
        );
      }

      // Re-fetch alerts
      const { data: alertsData } = await supabase
        .from('budget_alerts')
        .select('*')
        .order('created_at', { ascending: false });

      if (alertsData) {
        setAlerts(alertsData.map(mapDbAlertToAlert));
      }

      return newEntry;
    } else {
      throw new Error('Failed to add usage entry: No data returned');
    }
  }, [user, supabase]);

  const acknowledgeAlert = useCallback(async (alertId: string) => {
    if (!user) return;

    const { error } = await supabase
      .from('budget_alerts')
      .update({ acknowledged: true })
      .eq('id', alertId);

    if (error) {
      console.error('Error acknowledging alert:', error);
      return;
    }

    setAlerts((prev) =>
      prev.map((a) => (a.id === alertId ? { ...a, acknowledged: true } : a))
    );
  }, [user, supabase]);

  const pauseBudget = useCallback(async (budgetId: string, reason: string) => {
    if (!user) return;

    const { error } = await supabase
      .from('budgets')
      .update({
        status: 'paused',
        paused_reason: reason,
      })
      .eq('id', budgetId);

    if (error) {
      console.error('Error pausing budget:', error);
      return;
    }

    setBudgets((prev) =>
      prev.map((b) =>
        b.id === budgetId
          ? { ...b, status: 'paused' as const, pausedReason: reason, updatedAt: Date.now() }
          : b
      )
    );
  }, [user, supabase]);

  const resumeBudget = useCallback(async (budgetId: string) => {
    if (!user) return;

    const { error } = await supabase
      .from('budgets')
      .update({
        status: 'active',
        paused_reason: null,
      })
      .eq('id', budgetId);

    if (error) {
      console.error('Error resuming budget:', error);
      return;
    }

    setBudgets((prev) =>
      prev.map((b) =>
        b.id === budgetId
          ? { ...b, status: 'active' as const, pausedReason: undefined, updatedAt: Date.now() }
          : b
      )
    );
  }, [user, supabase]);

  const getBudgetSummary = useCallback((): BudgetSummary => {
    const summary: BudgetSummary = {
      totalBudgets: budgets.length,
      activeBudgets: budgets.filter((b) => b.status === 'active').length,
      pausedBudgets: budgets.filter((b) => b.status === 'paused').length,
      exceededBudgets: budgets.filter((b) => b.status === 'exceeded').length,
      totalAllocatedCost: 0,
      totalSpentCost: 0,
      totalAllocatedTokens: 0,
      totalSpentTokens: 0,
      totalAllocatedTime: 0,
      totalSpentTime: 0,
    };

    budgets.forEach((budget) => {
      if (budget.maxCost) summary.totalAllocatedCost += budget.maxCost;
      summary.totalSpentCost += budget.currentCost;

      if (budget.maxTokens) summary.totalAllocatedTokens += budget.maxTokens;
      summary.totalSpentTokens += budget.currentTokens;

      if (budget.maxTime) summary.totalAllocatedTime += budget.maxTime;
      summary.totalSpentTime += budget.currentTime;
    });

    return summary;
  }, [budgets]);

  return {
    budgets,
    usageEntries,
    alerts,
    isLoaded,
    createBudget,
    updateBudget,
    deleteBudget,
    addUsageEntry,
    acknowledgeAlert,
    pauseBudget,
    resumeBudget,
    getBudgetSummary,
  };
};
