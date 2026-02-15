'use client';

import { useState, useEffect, useCallback, useMemo } from 'react';
import { TaskBudget, BudgetUsageLog, BudgetUpdateInput } from '@/types/budget';
import { createClient } from '@/lib/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { isBudgetExceeded } from '@/lib/budgetUtils';

interface DbTaskBudget {
  id: string;
  task_id: string;
  user_id: string;
  max_tokens: number | null;
  max_cost: number | null;
  max_time_minutes: number | null;
  max_retries: number | null;
  tokens_used: number;
  cost_used: number;
  time_used_minutes: number;
  retries_used: number;
  status: string;
  paused_reason: string | null;
  created_at: string;
  updated_at: string;
}

interface DbBudgetUsageLog {
  id: string;
  budget_id: string;
  task_id: string;
  user_id: string;
  tokens_used: number;
  cost_incurred: number;
  time_spent_minutes: number;
  event_type: string;
  description: string | null;
  agent_id: string | null;
  timestamp: string;
}

const mapDbBudgetToTaskBudget = (dbBudget: DbTaskBudget): TaskBudget => ({
  id: dbBudget.id,
  taskId: dbBudget.task_id,
  maxTokens: dbBudget.max_tokens ?? undefined,
  maxCost: dbBudget.max_cost ?? undefined,
  maxTimeMinutes: dbBudget.max_time_minutes ?? undefined,
  maxRetries: dbBudget.max_retries ?? undefined,
  tokensUsed: dbBudget.tokens_used,
  costUsed: dbBudget.cost_used,
  timeUsedMinutes: dbBudget.time_used_minutes,
  retriesUsed: dbBudget.retries_used,
  status: dbBudget.status as TaskBudget['status'],
  pausedReason: dbBudget.paused_reason ?? undefined,
  createdAt: new Date(dbBudget.created_at).getTime(),
  updatedAt: new Date(dbBudget.updated_at).getTime(),
});

const mapDbLogToUsageLog = (dbLog: DbBudgetUsageLog): BudgetUsageLog => ({
  id: dbLog.id,
  budgetId: dbLog.budget_id,
  taskId: dbLog.task_id,
  tokensUsed: dbLog.tokens_used,
  costIncurred: dbLog.cost_incurred,
  timeSpentMinutes: dbLog.time_spent_minutes,
  eventType: dbLog.event_type as BudgetUsageLog['eventType'],
  description: dbLog.description ?? undefined,
  agentId: dbLog.agent_id ?? undefined,
  timestamp: new Date(dbLog.timestamp).getTime(),
});

export const useBudgets = () => {
  const [budgets, setBudgets] = useState<TaskBudget[]>([]);
  const [usageLogs, setUsageLogs] = useState<BudgetUsageLog[]>([]);
  const [isLoaded, setIsLoaded] = useState(false);
  const { user, isLoading: authLoading } = useAuth();
  const supabase = useMemo(() => createClient(), []);

  // Fetch budgets
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

    fetchBudgets();
  }, [user, authLoading, supabase]);

  // Fetch usage logs
  useEffect(() => {
    if (authLoading || !user) return;

    const fetchUsageLogs = async () => {
      const { data, error } = await supabase
        .from('budget_usage_logs')
        .select('*')
        .order('timestamp', { ascending: false })
        .limit(100); // Limit to recent logs

      if (error) {
        console.error('Error fetching usage logs:', error);
      } else {
        setUsageLogs((data || []).map(mapDbLogToUsageLog));
      }
    };

    fetchUsageLogs();
  }, [user, authLoading, supabase]);

  // Create budget for a task
  const createBudget = useCallback(async (
    taskId: string,
    limits: {
      maxTokens?: number;
      maxCost?: number;
      maxTimeMinutes?: number;
      maxRetries?: number;
    }
  ) => {
    if (!user) {
      throw new Error('You must be logged in to create budgets');
    }

    const { data, error } = await supabase
      .from('task_budgets')
      .insert({
        task_id: taskId,
        user_id: user.id,
        max_tokens: limits.maxTokens ?? null,
        max_cost: limits.maxCost ?? null,
        max_time_minutes: limits.maxTimeMinutes ?? null,
        max_retries: limits.maxRetries ?? null,
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

    throw new Error('Failed to create budget: No data returned');
  }, [user, supabase]);

  // Update budget usage
  const updateBudgetUsage = useCallback(async (
    budgetId: string,
    taskId: string,
    update: BudgetUpdateInput,
    agentId?: string
  ) => {
    if (!user) return;

    const budget = budgets.find(b => b.id === budgetId);
    if (!budget) {
      throw new Error('Budget not found');
    }

    // Calculate new usage values
    const newTokensUsed = budget.tokensUsed + (update.tokensUsed || 0);
    const newCostUsed = budget.costUsed + (update.costIncurred || 0);
    const newTimeUsed = budget.timeUsedMinutes + (update.timeSpentMinutes || 0);
    const newRetriesUsed = budget.retriesUsed + (update.retriesUsed || 0);

    // Update budget
    const { error: budgetError } = await supabase
      .from('task_budgets')
      .update({
        tokens_used: newTokensUsed,
        cost_used: newCostUsed,
        time_used_minutes: newTimeUsed,
        retries_used: newRetriesUsed,
      })
      .eq('id', budgetId);

    if (budgetError) {
      console.error('Error updating budget:', budgetError);
      throw new Error(budgetError.message);
    }

    // Create usage log
    const { data: logData, error: logError } = await supabase
      .from('budget_usage_logs')
      .insert({
        budget_id: budgetId,
        task_id: taskId,
        user_id: user.id,
        tokens_used: update.tokensUsed || 0,
        cost_incurred: update.costIncurred || 0,
        time_spent_minutes: update.timeSpentMinutes || 0,
        event_type: 'execution',
        description: update.description,
        agent_id: agentId,
      })
      .select()
      .single();

    if (logError) {
      console.error('Error creating usage log:', logError);
    }

    // Update local state
    const updatedBudget: TaskBudget = {
      ...budget,
      tokensUsed: newTokensUsed,
      costUsed: newCostUsed,
      timeUsedMinutes: newTimeUsed,
      retriesUsed: newRetriesUsed,
      updatedAt: Date.now(),
    };

    // Check if budget exceeded and auto-pause
    if (isBudgetExceeded(updatedBudget) && updatedBudget.status === 'active') {
      await pauseBudget(budgetId, 'Budget limit exceeded');
    } else {
      setBudgets((prev) =>
        prev.map((b) => (b.id === budgetId ? updatedBudget : b))
      );
    }

    if (logData) {
      setUsageLogs((prev) => [mapDbLogToUsageLog(logData), ...prev]);
    }
  }, [user, budgets, supabase]);

  // Pause budget
  const pauseBudget = useCallback(async (budgetId: string, reason: string) => {
    if (!user) return;

    const { error } = await supabase
      .from('task_budgets')
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
          ? { ...b, status: 'paused', pausedReason: reason, updatedAt: Date.now() }
          : b
      )
    );
  }, [user, supabase]);

  // Resume budget
  const resumeBudget = useCallback(async (budgetId: string) => {
    if (!user) return;

    const { error } = await supabase
      .from('task_budgets')
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
          ? { ...b, status: 'active', pausedReason: undefined, updatedAt: Date.now() }
          : b
      )
    );
  }, [user, supabase]);

  // Delete budget
  const deleteBudget = useCallback(async (budgetId: string) => {
    if (!user) return;

    const { error } = await supabase
      .from('task_budgets')
      .delete()
      .eq('id', budgetId);

    if (error) {
      console.error('Error deleting budget:', error);
      return;
    }

    setBudgets((prev) => prev.filter((b) => b.id !== budgetId));
  }, [user, supabase]);

  // Get budget for a specific task
  const getBudgetForTask = useCallback((taskId: string): TaskBudget | undefined => {
    return budgets.find(b => b.taskId === taskId);
  }, [budgets]);

  // Get usage logs for a specific budget
  const getLogsForBudget = useCallback((budgetId: string): BudgetUsageLog[] => {
    return usageLogs.filter(log => log.budgetId === budgetId);
  }, [usageLogs]);

  return {
    budgets,
    usageLogs,
    isLoaded,
    createBudget,
    updateBudgetUsage,
    pauseBudget,
    resumeBudget,
    deleteBudget,
    getBudgetForTask,
    getLogsForBudget,
  };
};
