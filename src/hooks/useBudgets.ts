'use client';

import { useState, useEffect, useCallback, useMemo } from 'react';
import { TaskBudget, BudgetLog, ProjectBudget, BudgetAlert, BudgetUtilization } from '@/types/budget';
import { createClient } from '@/lib/supabase/client';
import { useAuth } from '@/contexts/AuthContext';

interface DbTaskBudget {
  id: string;
  task_id: string;
  user_id: string;
  budget_type: string;
  max_cost: number | null;
  max_tokens: number | null;
  max_time: number | null;
  current_cost: number;
  current_tokens: number;
  current_time: number;
  max_retries: number | null;
  current_retries: number;
  status: string;
  created_at: string;
  updated_at: string;
}

interface DbBudgetLog {
  id: string;
  task_budget_id: string;
  user_id: string;
  cost_delta: number;
  tokens_delta: number;
  time_delta: number;
  agent_id: string | null;
  action: string;
  notes: string | null;
  created_at: string;
}

interface DbProjectBudget {
  id: string;
  user_id: string;
  name: string;
  total_max_cost: number | null;
  total_max_tokens: number | null;
  total_max_time: number | null;
  total_current_cost: number;
  total_current_tokens: number;
  total_current_time: number;
  total_tasks: number;
  active_tasks: number;
  paused_tasks: number;
  exceeded_tasks: number;
  completed_tasks: number;
  created_at: string;
  updated_at: string;
}

interface DbBudgetAlert {
  id: string;
  task_budget_id: string | null;
  project_budget_id: string | null;
  user_id: string;
  alert_type: string;
  budget_type: string;
  threshold: number;
  message: string;
  acknowledged: boolean;
  triggered_at: string;
}

const mapDbTaskBudget = (db: DbTaskBudget): TaskBudget => ({
  id: db.id,
  taskId: db.task_id,
  type: db.budget_type as TaskBudget['type'],
  maxCost: db.max_cost ?? undefined,
  maxTokens: db.max_tokens ?? undefined,
  maxTime: db.max_time ?? undefined,
  currentCost: db.current_cost,
  currentTokens: db.current_tokens,
  currentTime: db.current_time,
  maxRetries: db.max_retries ?? undefined,
  currentRetries: db.current_retries,
  status: db.status as TaskBudget['status'],
  lastUpdated: new Date(db.updated_at).getTime(),
  createdAt: new Date(db.created_at).getTime(),
});

const mapDbBudgetLog = (db: DbBudgetLog): BudgetLog => ({
  id: db.id,
  taskBudgetId: db.task_budget_id,
  timestamp: new Date(db.created_at).getTime(),
  costDelta: db.cost_delta,
  tokensDelta: db.tokens_delta,
  timeDelta: db.time_delta,
  agentId: db.agent_id ?? undefined,
  action: db.action,
  notes: db.notes ?? undefined,
});

const mapDbProjectBudget = (db: DbProjectBudget): ProjectBudget => ({
  id: db.id,
  userId: db.user_id,
  name: db.name,
  totalMaxCost: db.total_max_cost ?? undefined,
  totalMaxTokens: db.total_max_tokens ?? undefined,
  totalMaxTime: db.total_max_time ?? undefined,
  totalCurrentCost: db.total_current_cost,
  totalCurrentTokens: db.total_current_tokens,
  totalCurrentTime: db.total_current_time,
  totalTasks: db.total_tasks,
  activeTasks: db.active_tasks,
  pausedTasks: db.paused_tasks,
  exceededTasks: db.exceeded_tasks,
  completedTasks: db.completed_tasks,
  createdAt: new Date(db.created_at).getTime(),
  updatedAt: new Date(db.updated_at).getTime(),
});

const mapDbBudgetAlert = (db: DbBudgetAlert): BudgetAlert => ({
  id: db.id,
  taskBudgetId: db.task_budget_id ?? undefined,
  projectBudgetId: db.project_budget_id ?? undefined,
  type: db.alert_type as BudgetAlert['type'],
  budgetType: db.budget_type as BudgetAlert['budgetType'],
  threshold: db.threshold,
  message: db.message,
  triggeredAt: new Date(db.triggered_at).getTime(),
  acknowledged: db.acknowledged,
});

export const useBudgets = () => {
  const [taskBudgets, setTaskBudgets] = useState<TaskBudget[]>([]);
  const [projectBudget, setProjectBudget] = useState<ProjectBudget | null>(null);
  const [budgetAlerts, setBudgetAlerts] = useState<BudgetAlert[]>([]);
  const [isLoaded, setIsLoaded] = useState(false);
  const { user, isLoading: authLoading } = useAuth();
  const supabase = useMemo(() => createClient(), []);

  // Fetch all budgets
  useEffect(() => {
    if (authLoading || !user) return;

    const fetchBudgets = async () => {
      // Fetch task budgets
      const { data: taskBudgetsData, error: taskBudgetsError } = await supabase
        .from('task_budgets')
        .select('*')
        .order('created_at', { ascending: false });

      if (taskBudgetsError) {
        console.error('Error fetching task budgets:', taskBudgetsError);
      } else {
        setTaskBudgets((taskBudgetsData || []).map(mapDbTaskBudget));
      }

      // Fetch or create project budget
      const { data: projectBudgetsData, error: projectBudgetsError } = await supabase
        .from('project_budgets')
        .select('*')
        .limit(1)
        .single();

      if (projectBudgetsError && projectBudgetsError.code !== 'PGRST116') {
        console.error('Error fetching project budget:', projectBudgetsError);
      } else if (projectBudgetsData) {
        setProjectBudget(mapDbProjectBudget(projectBudgetsData));
      } else {
        // Create default project budget
        const { data: newProjectBudget, error: createError } = await supabase
          .from('project_budgets')
          .insert({
            user_id: user.id,
            name: 'Default Project',
          })
          .select()
          .single();

        if (createError) {
          console.error('Error creating project budget:', createError);
        } else if (newProjectBudget) {
          setProjectBudget(mapDbProjectBudget(newProjectBudget));
        }
      }

      // Fetch budget alerts
      const { data: alertsData, error: alertsError } = await supabase
        .from('budget_alerts')
        .select('*')
        .eq('acknowledged', false)
        .order('triggered_at', { ascending: false });

      if (alertsError) {
        console.error('Error fetching budget alerts:', alertsError);
      } else {
        setBudgetAlerts((alertsData || []).map(mapDbBudgetAlert));
      }

      setIsLoaded(true);
    };

    fetchBudgets();
  }, [user, authLoading, supabase]);

  // Create task budget
  const createTaskBudget = useCallback(async (budget: Omit<TaskBudget, 'id' | 'createdAt' | 'lastUpdated' | 'currentCost' | 'currentTokens' | 'currentTime' | 'currentRetries' | 'status'>) => {
    if (!user) throw new Error('User must be logged in');

    const { data, error } = await supabase
      .from('task_budgets')
      .insert({
        task_id: budget.taskId,
        user_id: user.id,
        budget_type: budget.type,
        max_cost: budget.maxCost ?? null,
        max_tokens: budget.maxTokens ?? null,
        max_time: budget.maxTime ?? null,
        max_retries: budget.maxRetries ?? null,
      })
      .select()
      .single();

    if (error) {
      console.error('Error creating task budget:', error);
      throw new Error(error.message);
    }

    if (data) {
      const newBudget = mapDbTaskBudget(data);
      setTaskBudgets((prev) => [newBudget, ...prev]);
      return newBudget;
    }
  }, [user, supabase]);

  // Update task budget usage
  const updateBudgetUsage = useCallback(async (
    budgetId: string,
    updates: {
      costDelta?: number;
      tokensDelta?: number;
      timeDelta?: number;
      agentId?: string;
      action: string;
      notes?: string;
    }
  ) => {
    if (!user) throw new Error('User must be logged in');

    const budget = taskBudgets.find(b => b.id === budgetId);
    if (!budget) throw new Error('Budget not found');

    const newCost = budget.currentCost + (updates.costDelta || 0);
    const newTokens = budget.currentTokens + (updates.tokensDelta || 0);
    const newTime = budget.currentTime + (updates.timeDelta || 0);

    // Check if budget is exceeded
    let newStatus = budget.status;
    if (
      (budget.maxCost && newCost > budget.maxCost) ||
      (budget.maxTokens && newTokens > budget.maxTokens) ||
      (budget.maxTime && newTime > budget.maxTime)
    ) {
      newStatus = 'exceeded';
    }

    // Update budget
    const { error: updateError } = await supabase
      .from('task_budgets')
      .update({
        current_cost: newCost,
        current_tokens: newTokens,
        current_time: newTime,
        status: newStatus,
      })
      .eq('id', budgetId);

    if (updateError) {
      console.error('Error updating budget:', updateError);
      throw new Error(updateError.message);
    }

    // Log the change
    const { error: logError } = await supabase
      .from('budget_logs')
      .insert({
        task_budget_id: budgetId,
        user_id: user.id,
        cost_delta: updates.costDelta || 0,
        tokens_delta: updates.tokensDelta || 0,
        time_delta: updates.timeDelta || 0,
        agent_id: updates.agentId || null,
        action: updates.action,
        notes: updates.notes || null,
      });

    if (logError) {
      console.error('Error logging budget change:', logError);
    }

    // Update local state
    setTaskBudgets((prev) =>
      prev.map((b) =>
        b.id === budgetId
          ? {
              ...b,
              currentCost: newCost,
              currentTokens: newTokens,
              currentTime: newTime,
              status: newStatus,
              lastUpdated: Date.now(),
            }
          : b
      )
    );
  }, [user, supabase, taskBudgets]);

  // Pause/resume task budget
  const toggleBudgetStatus = useCallback(async (budgetId: string, paused: boolean) => {
    if (!user) throw new Error('User must be logged in');

    const { error } = await supabase
      .from('task_budgets')
      .update({
        status: paused ? 'paused' : 'active',
      })
      .eq('id', budgetId);

    if (error) {
      console.error('Error updating budget status:', error);
      throw new Error(error.message);
    }

    setTaskBudgets((prev) =>
      prev.map((b) =>
        b.id === budgetId
          ? {
              ...b,
              status: paused ? 'paused' : 'active',
              lastUpdated: Date.now(),
            }
          : b
      )
    );
  }, [user, supabase]);

  // Increment retry count
  const incrementRetry = useCallback(async (budgetId: string) => {
    if (!user) throw new Error('User must be logged in');

    const budget = taskBudgets.find(b => b.id === budgetId);
    if (!budget) throw new Error('Budget not found');

    const newRetries = budget.currentRetries + 1;

    const { error } = await supabase
      .from('task_budgets')
      .update({
        current_retries: newRetries,
      })
      .eq('id', budgetId);

    if (error) {
      console.error('Error incrementing retries:', error);
      throw new Error(error.message);
    }

    setTaskBudgets((prev) =>
      prev.map((b) =>
        b.id === budgetId
          ? {
              ...b,
              currentRetries: newRetries,
              lastUpdated: Date.now(),
            }
          : b
      )
    );
  }, [user, supabase, taskBudgets]);

  // Update project budget
  const updateProjectBudget = useCallback(async (updates: Partial<ProjectBudget>) => {
    if (!user || !projectBudget) throw new Error('User must be logged in and project budget must exist');

    const { error } = await supabase
      .from('project_budgets')
      .update({
        total_max_cost: updates.totalMaxCost ?? projectBudget.totalMaxCost ?? null,
        total_max_tokens: updates.totalMaxTokens ?? projectBudget.totalMaxTokens ?? null,
        total_max_time: updates.totalMaxTime ?? projectBudget.totalMaxTime ?? null,
      })
      .eq('id', projectBudget.id);

    if (error) {
      console.error('Error updating project budget:', error);
      throw new Error(error.message);
    }

    setProjectBudget((prev) =>
      prev
        ? {
            ...prev,
            ...updates,
            updatedAt: Date.now(),
          }
        : null
    );
  }, [user, supabase, projectBudget]);

  // Acknowledge alert
  const acknowledgeAlert = useCallback(async (alertId: string) => {
    if (!user) throw new Error('User must be logged in');

    const { error } = await supabase
      .from('budget_alerts')
      .update({ acknowledged: true })
      .eq('id', alertId);

    if (error) {
      console.error('Error acknowledging alert:', error);
      throw new Error(error.message);
    }

    setBudgetAlerts((prev) => prev.filter((a) => a.id !== alertId));
  }, [user, supabase]);

  // Calculate budget utilization
  const calculateUtilization = useCallback((budget: TaskBudget): BudgetUtilization[] => {
    const utilizations: BudgetUtilization[] = [];

    if (budget.maxCost) {
      const percentage = (budget.currentCost / budget.maxCost) * 100;
      utilizations.push({
        type: 'cost',
        max: budget.maxCost,
        current: budget.currentCost,
        percentage,
        status: percentage >= 100 ? 'exceeded' : percentage >= 90 ? 'critical' : percentage >= 75 ? 'warning' : 'safe',
      });
    }

    if (budget.maxTokens) {
      const percentage = (budget.currentTokens / budget.maxTokens) * 100;
      utilizations.push({
        type: 'token',
        max: budget.maxTokens,
        current: budget.currentTokens,
        percentage,
        status: percentage >= 100 ? 'exceeded' : percentage >= 90 ? 'critical' : percentage >= 75 ? 'warning' : 'safe',
      });
    }

    if (budget.maxTime) {
      const percentage = (budget.currentTime / budget.maxTime) * 100;
      utilizations.push({
        type: 'time',
        max: budget.maxTime,
        current: budget.currentTime,
        percentage,
        status: percentage >= 100 ? 'exceeded' : percentage >= 90 ? 'critical' : percentage >= 75 ? 'warning' : 'safe',
      });
    }

    return utilizations;
  }, []);

  return {
    taskBudgets,
    projectBudget,
    budgetAlerts,
    isLoaded,
    createTaskBudget,
    updateBudgetUsage,
    toggleBudgetStatus,
    incrementRetry,
    updateProjectBudget,
    acknowledgeAlert,
    calculateUtilization,
  };
};
