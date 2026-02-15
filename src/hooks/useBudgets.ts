'use client';

import { useState, useEffect, useCallback, useMemo } from 'react';
import { TaskBudget, BudgetUsageLog, BudgetAlert, BudgetMetrics } from '@/types/budget';
import { createClient } from '@/lib/supabase/client';
import { useAuth } from '@/contexts/AuthContext';

interface DbTaskBudget {
  id: string;
  task_id: string;
  user_id: string;
  max_cost: number | null;
  max_tokens: number | null;
  max_time: number | null;
  current_cost: number;
  current_tokens: number;
  current_time: number;
  retry_count: number;
  max_retries: number;
  status: string;
  created_at: string;
  updated_at: string;
}

interface DbBudgetUsageLog {
  id: string;
  task_id: string;
  user_id: string;
  timestamp: string;
  cost: number;
  tokens: number;
  time_spent: number;
  operation: string;
  notes: string | null;
}

interface DbBudgetAlert {
  id: string;
  user_id: string;
  task_id: string | null;
  project_id: string | null;
  type: string;
  threshold: number;
  message: string;
  triggered_at: string;
  acknowledged: boolean;
}

const mapDbBudgetToTaskBudget = (dbBudget: DbTaskBudget): TaskBudget => ({
  id: dbBudget.id,
  taskId: dbBudget.task_id,
  maxCost: dbBudget.max_cost ?? undefined,
  maxTokens: dbBudget.max_tokens ?? undefined,
  maxTime: dbBudget.max_time ?? undefined,
  currentCost: Number(dbBudget.current_cost),
  currentTokens: dbBudget.current_tokens,
  currentTime: dbBudget.current_time,
  retryCount: dbBudget.retry_count,
  maxRetries: dbBudget.max_retries,
  status: dbBudget.status as TaskBudget['status'],
  createdAt: new Date(dbBudget.created_at).getTime(),
  updatedAt: new Date(dbBudget.updated_at).getTime(),
});

const mapDbLogToUsageLog = (dbLog: DbBudgetUsageLog): BudgetUsageLog => ({
  id: dbLog.id,
  taskId: dbLog.task_id,
  timestamp: new Date(dbLog.timestamp).getTime(),
  cost: Number(dbLog.cost),
  tokens: dbLog.tokens,
  timeSpent: dbLog.time_spent,
  operation: dbLog.operation,
  notes: dbLog.notes ?? undefined,
});

const mapDbAlertToBudgetAlert = (dbAlert: DbBudgetAlert): BudgetAlert => ({
  id: dbAlert.id,
  taskId: dbAlert.task_id ?? undefined,
  projectId: dbAlert.project_id ?? undefined,
  type: dbAlert.type as BudgetAlert['type'],
  threshold: dbAlert.threshold,
  message: dbAlert.message,
  triggeredAt: new Date(dbAlert.triggered_at).getTime(),
  acknowledged: dbAlert.acknowledged,
});

export const useBudgets = () => {
  const [budgets, setBudgets] = useState<TaskBudget[]>([]);
  const [alerts, setAlerts] = useState<BudgetAlert[]>([]);
  const [isLoaded, setIsLoaded] = useState(false);
  const { user, isLoading: authLoading } = useAuth();
  const supabase = useMemo(() => createClient(), []);

  useEffect(() => {
    if (authLoading || !user) return;

    const fetchBudgets = async () => {
      const { data, error } = await supabase
        .from('task_budgets')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) {
        console.error('Error fetching budgets:', error);
      } else {
        setBudgets((data || []).map(mapDbBudgetToTaskBudget));
      }
      setIsLoaded(true);
    };

    const fetchAlerts = async () => {
      const { data, error } = await supabase
        .from('budget_alerts')
        .select('*')
        .eq('acknowledged', false)
        .order('triggered_at', { ascending: false });

      if (error) {
        console.error('Error fetching alerts:', error);
      } else {
        setAlerts((data || []).map(mapDbAlertToBudgetAlert));
      }
    };

    fetchBudgets();
    fetchAlerts();
  }, [user, authLoading, supabase]);

  const createBudget = useCallback(async (taskId: string, budget: Partial<TaskBudget>) => {
    if (!user) {
      throw new Error('You must be logged in to create budgets');
    }

    const { data, error } = await supabase
      .from('task_budgets')
      .insert({
        task_id: taskId,
        user_id: user.id,
        max_cost: budget.maxCost ?? null,
        max_tokens: budget.maxTokens ?? null,
        max_time: budget.maxTime ?? null,
        max_retries: budget.maxRetries ?? 3,
        status: budget.status ?? 'active',
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
  }, [user, supabase]);

  const updateBudget = useCallback(async (budgetId: string, updates: Partial<TaskBudget>) => {
    if (!user) return;

    const { error } = await supabase
      .from('task_budgets')
      .update({
        max_cost: updates.maxCost ?? undefined,
        max_tokens: updates.maxTokens ?? undefined,
        max_time: updates.maxTime ?? undefined,
        current_cost: updates.currentCost ?? undefined,
        current_tokens: updates.currentTokens ?? undefined,
        current_time: updates.currentTime ?? undefined,
        retry_count: updates.retryCount ?? undefined,
        max_retries: updates.maxRetries ?? undefined,
        status: updates.status ?? undefined,
      })
      .eq('id', budgetId);

    if (error) {
      console.error('Error updating budget:', error);
      throw new Error(error.message);
    }

    setBudgets((prev) =>
      prev.map((b) => (b.id === budgetId ? { ...b, ...updates, updatedAt: Date.now() } : b))
    );
  }, [user, supabase]);

  const logUsage = useCallback(async (log: Omit<BudgetUsageLog, 'id' | 'timestamp'>) => {
    if (!user) {
      throw new Error('You must be logged in to log usage');
    }

    const { error } = await supabase
      .from('budget_usage_logs')
      .insert({
        task_id: log.taskId,
        user_id: user.id,
        cost: log.cost,
        tokens: log.tokens,
        time_spent: log.timeSpent,
        operation: log.operation,
        notes: log.notes ?? null,
      });

    if (error) {
      console.error('Error logging usage:', error);
      throw new Error(error.message);
    }

    // Update the corresponding budget
    const budget = budgets.find((b) => b.taskId === log.taskId);
    if (budget) {
      await updateBudget(budget.id, {
        currentCost: budget.currentCost + log.cost,
        currentTokens: budget.currentTokens + log.tokens,
        currentTime: budget.currentTime + log.timeSpent,
      });
    }
  }, [user, supabase, budgets, updateBudget]);

  const pauseTask = useCallback(async (budgetId: string) => {
    await updateBudget(budgetId, { status: 'paused' });
  }, [updateBudget]);

  const resumeTask = useCallback(async (budgetId: string) => {
    await updateBudget(budgetId, { status: 'active' });
  }, [updateBudget]);

  const incrementRetry = useCallback(async (budgetId: string) => {
    const budget = budgets.find((b) => b.id === budgetId);
    if (!budget) return;

    const newRetryCount = budget.retryCount + 1;
    const updates: Partial<TaskBudget> = { retryCount: newRetryCount };

    // Check if max retries exceeded
    if (newRetryCount >= budget.maxRetries) {
      updates.status = 'exceeded';
    }

    await updateBudget(budgetId, updates);
  }, [budgets, updateBudget]);

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

    setAlerts((prev) => prev.filter((a) => a.id !== alertId));
  }, [user, supabase]);

  const getBudgetMetrics = useCallback((): BudgetMetrics => {
    const totalTasks = budgets.length;
    const activeTasks = budgets.filter((b) => b.status === 'active').length;
    const pausedTasks = budgets.filter((b) => b.status === 'paused').length;
    const exceededTasks = budgets.filter((b) => b.status === 'exceeded').length;
    const completedTasks = budgets.filter((b) => b.status === 'completed').length;
    const totalCost = budgets.reduce((sum, b) => sum + b.currentCost, 0);
    const totalTokens = budgets.reduce((sum, b) => sum + b.currentTokens, 0);
    const totalTime = budgets.reduce((sum, b) => sum + b.currentTime, 0);

    return {
      totalTasks,
      activeTasks,
      pausedTasks,
      exceededTasks,
      completedTasks,
      totalCost,
      totalTokens,
      totalTime,
      averageCostPerTask: totalTasks > 0 ? totalCost / totalTasks : 0,
      averageTokensPerTask: totalTasks > 0 ? totalTokens / totalTasks : 0,
      averageTimePerTask: totalTasks > 0 ? totalTime / totalTasks : 0,
    };
  }, [budgets]);

  const getBudgetForTask = useCallback((taskId: string): TaskBudget | undefined => {
    return budgets.find((b) => b.taskId === taskId);
  }, [budgets]);

  return {
    budgets,
    alerts,
    isLoaded,
    createBudget,
    updateBudget,
    logUsage,
    pauseTask,
    resumeTask,
    incrementRetry,
    acknowledgeAlert,
    getBudgetMetrics,
    getBudgetForTask,
  };
};
