'use client';

import { useState, useEffect, useCallback, useRef, useMemo } from 'react';
import { Budget, BudgetUsage, BudgetAlert, BudgetSummary } from '@/types/budget';
import { createClient } from '@/lib/supabase/client';
import { useAuth } from '@/contexts/AuthContext';

interface DbBudget {
  id: string;
  user_id: string;
  task_id: string;
  max_cost: number | null;
  max_tokens: number | null;
  max_time: number | null;
  max_retries: number | null;
  current_cost: number;
  current_tokens: number;
  current_time: number;
  current_retries: number;
  status: string;
  paused_reason: string | null;
  created_at: string;
  updated_at: string;
}

interface DbBudgetUsage {
  id: string;
  budget_id: string;
  task_id: string;
  user_id: string;
  cost: number;
  tokens: number;
  time: number;
  operation: string;
  agent_id: string | null;
  metadata: Record<string, unknown> | null;
  timestamp: string;
}

interface DbBudgetAlert {
  id: string;
  budget_id: string;
  task_id: string;
  user_id: string;
  type: string;
  category: string;
  message: string;
  threshold: number;
  current_value: number;
  max_value: number;
  acknowledged: boolean;
  created_at: string;
}

const mapDbBudgetToBudget = (dbBudget: DbBudget): Budget => ({
  id: dbBudget.id,
  taskId: dbBudget.task_id,
  userId: dbBudget.user_id,
  maxCost: dbBudget.max_cost || undefined,
  maxTokens: dbBudget.max_tokens || undefined,
  maxTime: dbBudget.max_time || undefined,
  maxRetries: dbBudget.max_retries || undefined,
  currentCost: Number(dbBudget.current_cost),
  currentTokens: Number(dbBudget.current_tokens),
  currentTime: dbBudget.current_time,
  currentRetries: dbBudget.current_retries,
  status: dbBudget.status as Budget['status'],
  pausedReason: dbBudget.paused_reason || undefined,
  createdAt: new Date(dbBudget.created_at).getTime(),
  updatedAt: new Date(dbBudget.updated_at).getTime(),
});

const mapDbUsageToUsage = (dbUsage: DbBudgetUsage): BudgetUsage => ({
  id: dbUsage.id,
  budgetId: dbUsage.budget_id,
  taskId: dbUsage.task_id,
  cost: Number(dbUsage.cost),
  tokens: Number(dbUsage.tokens),
  time: dbUsage.time,
  operation: dbUsage.operation,
  agentId: dbUsage.agent_id || undefined,
  timestamp: new Date(dbUsage.timestamp).getTime(),
  metadata: dbUsage.metadata || undefined,
});

const mapDbAlertToAlert = (dbAlert: DbBudgetAlert): BudgetAlert => ({
  id: dbAlert.id,
  budgetId: dbAlert.budget_id,
  taskId: dbAlert.task_id,
  type: dbAlert.type as BudgetAlert['type'],
  category: dbAlert.category as BudgetAlert['category'],
  message: dbAlert.message,
  threshold: dbAlert.threshold,
  currentValue: Number(dbAlert.current_value),
  maxValue: Number(dbAlert.max_value),
  createdAt: new Date(dbAlert.created_at).getTime(),
  acknowledged: dbAlert.acknowledged,
});

export const useBudgets = () => {
  const [budgets, setBudgets] = useState<Budget[]>([]);
  const [alerts, setAlerts] = useState<BudgetAlert[]>([]);
  const [hasFetched, setHasFetched] = useState(false);
  const { user, isLoading: authLoading } = useAuth();
  const supabase = useMemo(() => createClient(), []);
  const fetchingRef = useRef(false);

  useEffect(() => {
    if (authLoading || hasFetched || fetchingRef.current || !user) return;

    fetchingRef.current = true;

    const fetchBudgets = async () => {
      const { data, error } = await supabase
        .from('budgets')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) {
        console.error('Error fetching budgets:', error);
      } else {
        setBudgets((data || []).map(mapDbBudgetToBudget));
      }
      setHasFetched(true);
      fetchingRef.current = false;
    };

    fetchBudgets();
  }, [user, authLoading, hasFetched, supabase]);

  useEffect(() => {
    if (!user) return;

    const fetchAlerts = async () => {
      const { data, error } = await supabase
        .from('budget_alerts')
        .select('*')
        .eq('acknowledged', false)
        .order('created_at', { ascending: false });

      if (error) {
        console.error('Error fetching alerts:', error);
      } else {
        setAlerts((data || []).map(mapDbAlertToAlert));
      }
    };

    fetchAlerts();
  }, [user, supabase]);

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
        max_retries: budget.maxRetries || 3,
        current_cost: budget.currentCost,
        current_tokens: budget.currentTokens,
        current_time: budget.currentTime,
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
      setBudgets((prev) => [mapDbBudgetToBudget(data), ...prev]);
      return mapDbBudgetToBudget(data);
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
        max_retries: updatedBudget.maxRetries || null,
        current_cost: updatedBudget.currentCost,
        current_tokens: updatedBudget.currentTokens,
        current_time: updatedBudget.currentTime,
        current_retries: updatedBudget.currentRetries,
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

  const addUsage = useCallback(async (usage: Omit<BudgetUsage, 'id' | 'timestamp'>) => {
    if (!user) {
      throw new Error('You must be logged in to add usage');
    }

    const { data, error } = await supabase
      .from('budget_usage')
      .insert({
        budget_id: usage.budgetId,
        task_id: usage.taskId,
        user_id: user.id,
        cost: usage.cost,
        tokens: usage.tokens,
        time: usage.time,
        operation: usage.operation,
        agent_id: usage.agentId || null,
        metadata: usage.metadata || {},
      })
      .select()
      .single();

    if (error) {
      console.error('Error adding usage:', error);
      throw new Error(error.message);
    }

    // Refresh budgets after adding usage (trigger will update budget)
    const { data: budgetData } = await supabase
      .from('budgets')
      .select('*')
      .eq('id', usage.budgetId)
      .single();

    if (budgetData) {
      setBudgets((prev) =>
        prev.map((b) => (b.id === usage.budgetId ? mapDbBudgetToBudget(budgetData) : b))
      );
    }

    // Refresh alerts
    const { data: alertsData } = await supabase
      .from('budget_alerts')
      .select('*')
      .eq('acknowledged', false)
      .order('created_at', { ascending: false });

    if (alertsData) {
      setAlerts(alertsData.map(mapDbAlertToAlert));
    }

    return data ? mapDbUsageToUsage(data) : null;
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

    setAlerts((prev) => prev.filter((a) => a.id !== alertId));
  }, [user, supabase]);

  const pauseTask = useCallback(async (budgetId: string, reason: string) => {
    if (!user) return;

    const { error } = await supabase
      .from('budgets')
      .update({
        status: 'paused',
        paused_reason: reason,
      })
      .eq('id', budgetId);

    if (error) {
      console.error('Error pausing task:', error);
      return;
    }

    setBudgets((prev) =>
      prev.map((b) => (b.id === budgetId ? { ...b, status: 'paused', pausedReason: reason, updatedAt: Date.now() } : b))
    );
  }, [user, supabase]);

  const resumeTask = useCallback(async (budgetId: string) => {
    if (!user) return;

    const { error } = await supabase
      .from('budgets')
      .update({
        status: 'active',
        paused_reason: null,
      })
      .eq('id', budgetId);

    if (error) {
      console.error('Error resuming task:', error);
      return;
    }

    setBudgets((prev) =>
      prev.map((b) => (b.id === budgetId ? { ...b, status: 'active', pausedReason: undefined, updatedAt: Date.now() } : b))
    );
  }, [user, supabase]);

  const getBudgetSummary = useCallback((): BudgetSummary => {
    const totalTasks = budgets.length;
    const activeBudgets = budgets.filter((b) => b.status === 'active').length;
    const pausedBudgets = budgets.filter((b) => b.status === 'paused').length;
    const exceededBudgets = budgets.filter((b) => b.status === 'exceeded').length;

    const totalCostBudget = budgets.reduce((sum, b) => sum + (b.maxCost || 0), 0);
    const totalCostUsed = budgets.reduce((sum, b) => sum + b.currentCost, 0);

    const totalTokensBudget = budgets.reduce((sum, b) => sum + (b.maxTokens || 0), 0);
    const totalTokensUsed = budgets.reduce((sum, b) => sum + b.currentTokens, 0);

    const totalTimeBudget = budgets.reduce((sum, b) => sum + (b.maxTime || 0), 0);
    const totalTimeUsed = budgets.reduce((sum, b) => sum + b.currentTime, 0);

    return {
      totalTasks,
      activeBudgets,
      pausedBudgets,
      exceededBudgets,
      totalCostBudget,
      totalCostUsed,
      totalTokensBudget,
      totalTokensUsed,
      totalTimeBudget,
      totalTimeUsed,
      alerts,
    };
  }, [budgets, alerts]);

  return {
    budgets,
    alerts,
    createBudget,
    updateBudget,
    deleteBudget,
    addUsage,
    acknowledgeAlert,
    pauseTask,
    resumeTask,
    getBudgetSummary,
    isLoaded,
  };
};
