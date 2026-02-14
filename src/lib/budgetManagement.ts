import { createClient } from '@/lib/supabase/client';
import {
  Budget,
  BudgetUsage,
  BudgetAlert,
  BudgetSummary,
  PMDashboardStats,
  BudgetType,
  BudgetStatus,
} from '@/types/budget';

export class BudgetManager {
  private supabase = createClient();

  // =====================
  // Budget CRUD Operations
  // =====================

  async createBudget(
    taskId: string,
    userId: string,
    options: {
      tokenLimit?: number;
      costLimit?: number;
      timeLimit?: number;
      maxRetries?: number;
    }
  ): Promise<Budget | null> {
    const { data, error } = await this.supabase
      .from('budgets')
      .insert({
        user_id: userId,
        task_id: taskId,
        token_limit: options.tokenLimit,
        cost_limit: options.costLimit,
        time_limit: options.timeLimit,
        max_retries: options.maxRetries || 3,
        tokens_used: 0,
        cost_used: 0,
        time_used: 0,
        retries_used: 0,
        status: 'active',
        is_paused: false,
      })
      .select()
      .single();

    if (error) {
      console.error('Error creating budget:', error);
      return null;
    }

    return this.mapDbBudgetToBudget(data);
  }

  async getBudgetByTaskId(taskId: string): Promise<Budget | null> {
    const { data, error } = await this.supabase
      .from('budgets')
      .select('*')
      .eq('task_id', taskId)
      .single();

    if (error) {
      if (error.code === 'PGRST116') {
        // No rows returned
        return null;
      }
      console.error('Error fetching budget:', error);
      return null;
    }

    return this.mapDbBudgetToBudget(data);
  }

  async updateBudget(budgetId: string, updates: Partial<Budget>): Promise<boolean> {
    const dbUpdates: Record<string, unknown> = {};

    if (updates.tokenLimit !== undefined) dbUpdates.token_limit = updates.tokenLimit;
    if (updates.costLimit !== undefined) dbUpdates.cost_limit = updates.costLimit;
    if (updates.timeLimit !== undefined) dbUpdates.time_limit = updates.timeLimit;
    if (updates.maxRetries !== undefined) dbUpdates.max_retries = updates.maxRetries;
    if (updates.status !== undefined) dbUpdates.status = updates.status;
    if (updates.isPaused !== undefined) {
      dbUpdates.is_paused = updates.isPaused;
      if (updates.isPaused) {
        dbUpdates.paused_at = new Date().toISOString();
      }
    }

    const { error } = await this.supabase
      .from('budgets')
      .update(dbUpdates)
      .eq('id', budgetId);

    if (error) {
      console.error('Error updating budget:', error);
      return false;
    }

    return true;
  }

  async deleteBudget(budgetId: string): Promise<boolean> {
    const { error } = await this.supabase
      .from('budgets')
      .delete()
      .eq('id', budgetId);

    if (error) {
      console.error('Error deleting budget:', error);
      return false;
    }

    return true;
  }

  // =====================
  // Usage Tracking
  // =====================

  async recordUsage(
    budgetId: string,
    taskId: string,
    usage: {
      tokens: number;
      cost: number;
      timeSpent: number;
      agentId?: string;
      operation: string;
      success: boolean;
      errorMessage?: string;
      metadata?: Record<string, unknown>;
    }
  ): Promise<BudgetUsage | null> {
    const { data, error } = await this.supabase
      .from('budget_usages')
      .insert({
        budget_id: budgetId,
        task_id: taskId,
        tokens: usage.tokens,
        cost: usage.cost,
        time_spent: usage.timeSpent,
        agent_id: usage.agentId,
        operation: usage.operation,
        success: usage.success,
        error_message: usage.errorMessage,
        metadata: usage.metadata,
      })
      .select()
      .single();

    if (error) {
      console.error('Error recording usage:', error);
      return null;
    }

    // Check if we need to create alerts
    await this.checkAndCreateAlerts(budgetId);

    return this.mapDbUsageToUsage(data);
  }

  async getUsageHistory(budgetId: string, limit = 50): Promise<BudgetUsage[]> {
    const { data, error } = await this.supabase
      .from('budget_usages')
      .select('*')
      .eq('budget_id', budgetId)
      .order('created_at', { ascending: false })
      .limit(limit);

    if (error) {
      console.error('Error fetching usage history:', error);
      return [];
    }

    return (data || []).map(this.mapDbUsageToUsage);
  }

  // =====================
  // Alert Management
  // =====================

  async checkAndCreateAlerts(budgetId: string): Promise<void> {
    const budget = await this.getBudgetById(budgetId);
    if (!budget) return;

    const alerts: Array<{
      type: 'warning' | 'critical' | 'exceeded';
      message: string;
      threshold: number;
      currentUsage: number;
      limit: number;
      budgetType: BudgetType;
    }> = [];

    // Check token budget
    if (budget.tokenLimit && budget.tokenLimit > 0) {
      const percent = (budget.tokensUsed * 100) / budget.tokenLimit;
      const alertData = this.getAlertForThreshold(
        percent,
        budget.tokensUsed,
        budget.tokenLimit,
        'tokens'
      );
      if (alertData) alerts.push(alertData);
    }

    // Check cost budget
    if (budget.costLimit && budget.costLimit > 0) {
      const percent = (budget.costUsed * 100) / budget.costLimit;
      const alertData = this.getAlertForThreshold(
        percent,
        budget.costUsed,
        budget.costLimit,
        'cost'
      );
      if (alertData) alerts.push(alertData);
    }

    // Check time budget
    if (budget.timeLimit && budget.timeLimit > 0) {
      const percent = (budget.timeUsed * 100) / budget.timeLimit;
      const alertData = this.getAlertForThreshold(
        percent,
        budget.timeUsed,
        budget.timeLimit,
        'time'
      );
      if (alertData) alerts.push(alertData);
    }

    // Create alerts if they don't already exist
    for (const alert of alerts) {
      await this.createAlertIfNotExists(budgetId, budget.taskId, alert);
    }
  }

  private getAlertForThreshold(
    percent: number,
    current: number,
    limit: number,
    budgetType: BudgetType
  ): {
    type: 'warning' | 'critical' | 'exceeded';
    message: string;
    threshold: number;
    currentUsage: number;
    limit: number;
    budgetType: BudgetType;
  } | null {
    if (percent >= 100) {
      return {
        type: 'exceeded',
        message: `${budgetType} budget exceeded (${current} / ${limit})`,
        threshold: 100,
        currentUsage: current,
        limit,
        budgetType,
      };
    } else if (percent >= 90) {
      return {
        type: 'critical',
        message: `${budgetType} budget at ${Math.round(percent)}% (${current} / ${limit})`,
        threshold: 90,
        currentUsage: current,
        limit,
        budgetType,
      };
    } else if (percent >= 75) {
      return {
        type: 'warning',
        message: `${budgetType} budget at ${Math.round(percent)}% (${current} / ${limit})`,
        threshold: 75,
        currentUsage: current,
        limit,
        budgetType,
      };
    }
    return null;
  }

  private async createAlertIfNotExists(
    budgetId: string,
    taskId: string,
    alert: {
      type: 'warning' | 'critical' | 'exceeded';
      message: string;
      threshold: number;
      currentUsage: number;
      limit: number;
      budgetType: BudgetType;
    }
  ): Promise<void> {
    // Check if similar alert already exists
    const { data: existingAlerts } = await this.supabase
      .from('budget_alerts')
      .select('*')
      .eq('budget_id', budgetId)
      .eq('budget_type', alert.budgetType)
      .eq('threshold', alert.threshold)
      .eq('acknowledged', false);

    if (existingAlerts && existingAlerts.length > 0) {
      // Alert already exists
      return;
    }

    // Create new alert
    await this.supabase.from('budget_alerts').insert({
      budget_id: budgetId,
      task_id: taskId,
      type: alert.type,
      message: alert.message,
      threshold: alert.threshold,
      current_usage: alert.currentUsage,
      limit_value: alert.limit,
      budget_type: alert.budgetType,
      acknowledged: false,
    });
  }

  async getAlerts(budgetId: string, includeAcknowledged = false): Promise<BudgetAlert[]> {
    let query = this.supabase
      .from('budget_alerts')
      .select('*')
      .eq('budget_id', budgetId)
      .order('created_at', { ascending: false });

    if (!includeAcknowledged) {
      query = query.eq('acknowledged', false);
    }

    const { data, error } = await query;

    if (error) {
      console.error('Error fetching alerts:', error);
      return [];
    }

    return (data || []).map(this.mapDbAlertToAlert);
  }

  async acknowledgeAlert(alertId: string): Promise<boolean> {
    const { error } = await this.supabase
      .from('budget_alerts')
      .update({
        acknowledged: true,
        acknowledged_at: new Date().toISOString(),
      })
      .eq('id', alertId);

    if (error) {
      console.error('Error acknowledging alert:', error);
      return false;
    }

    return true;
  }

  // =====================
  // Budget Control
  // =====================

  async pauseTask(budgetId: string): Promise<boolean> {
    return this.updateBudget(budgetId, {
      isPaused: true,
      status: 'paused' as BudgetStatus,
    });
  }

  async resumeTask(budgetId: string): Promise<boolean> {
    return this.updateBudget(budgetId, {
      isPaused: false,
      status: 'active' as BudgetStatus,
    });
  }

  async canExecuteTask(budgetId: string): Promise<{ allowed: boolean; reason?: string }> {
    const budget = await this.getBudgetById(budgetId);
    if (!budget) {
      return { allowed: false, reason: 'Budget not found' };
    }

    if (budget.isPaused) {
      return { allowed: false, reason: 'Task is paused' };
    }

    if (budget.status === 'exceeded') {
      return { allowed: false, reason: 'Budget exceeded' };
    }

    if (budget.status === 'completed') {
      return { allowed: false, reason: 'Task is completed' };
    }

    // Check if any budget is exceeded
    if (budget.tokenLimit && budget.tokensUsed >= budget.tokenLimit) {
      return { allowed: false, reason: 'Token budget exceeded' };
    }

    if (budget.costLimit && budget.costUsed >= budget.costLimit) {
      return { allowed: false, reason: 'Cost budget exceeded' };
    }

    if (budget.timeLimit && budget.timeUsed >= budget.timeLimit) {
      return { allowed: false, reason: 'Time budget exceeded' };
    }

    return { allowed: true };
  }

  async canRetry(budgetId: string): Promise<{ allowed: boolean; reason?: string }> {
    const budget = await this.getBudgetById(budgetId);
    if (!budget) {
      return { allowed: false, reason: 'Budget not found' };
    }

    if (budget.retriesUsed >= budget.maxRetries) {
      return { allowed: false, reason: 'Max retries reached' };
    }

    const canExecute = await this.canExecuteTask(budgetId);
    if (!canExecute.allowed) {
      return canExecute;
    }

    return { allowed: true };
  }

  async incrementRetries(budgetId: string): Promise<boolean> {
    const { error } = await this.supabase.rpc('increment_budget_retries', {
      p_budget_id: budgetId,
    });

    if (error) {
      // Fallback to manual increment
      const budget = await this.getBudgetById(budgetId);
      if (!budget) return false;

      const { error: updateError } = await this.supabase
        .from('budgets')
        .update({ retries_used: budget.retriesUsed + 1 })
        .eq('id', budgetId);

      if (updateError) {
        console.error('Error incrementing retries:', updateError);
        return false;
      }
    }

    return true;
  }

  // =====================
  // PM Dashboard
  // =====================

  async getPMDashboardStats(userId: string): Promise<PMDashboardStats> {
    // Fetch all budgets for the user
    const { data: budgets, error } = await this.supabase
      .from('budgets')
      .select('*, tasks!inner(title)')
      .eq('user_id', userId);

    if (error || !budgets) {
      console.error('Error fetching budgets:', error);
      return this.getEmptyStats();
    }

    const mappedBudgets = budgets.map((b) => this.mapDbBudgetToBudget(b));

    // Calculate aggregate stats
    const totalTokensUsed = mappedBudgets.reduce((sum, b) => sum + b.tokensUsed, 0);
    const totalCostUsed = mappedBudgets.reduce((sum, b) => sum + b.costUsed, 0);
    const totalTimeUsed = mappedBudgets.reduce((sum, b) => sum + b.timeUsed, 0);

    const totalTokenLimit = mappedBudgets.reduce(
      (sum, b) => sum + (b.tokenLimit || 0),
      0
    );
    const totalCostLimit = mappedBudgets.reduce((sum, b) => sum + (b.costLimit || 0), 0);
    const totalTimeLimit = mappedBudgets.reduce((sum, b) => sum + (b.timeLimit || 0), 0);

    const activeTasksCount = mappedBudgets.filter((b) => b.status === 'active').length;
    const pausedTasksCount = mappedBudgets.filter((b) => b.status === 'paused').length;
    const exceededTasksCount = mappedBudgets.filter(
      (b) => b.status === 'exceeded'
    ).length;

    // Fetch all alerts
    const { data: alerts } = await this.supabase
      .from('budget_alerts')
      .select('*')
      .in('budget_id', mappedBudgets.map((b) => b.id));

    const mappedAlerts = (alerts || []).map(this.mapDbAlertToAlert);
    const criticalAlerts = mappedAlerts.filter((a) => a.type === 'critical').length;
    const unacknowledgedAlerts = mappedAlerts.filter((a) => !a.acknowledged).length;

    // Build task summaries
    const taskSummaries: BudgetSummary[] = await Promise.all(
      budgets.map(async (dbBudget) => {
        const budget = this.mapDbBudgetToBudget(dbBudget);
        const usages = await this.getUsageHistory(budget.id, 10);
        const budgetAlerts = mappedAlerts.filter((a) => a.budgetId === budget.id);

        return {
          taskId: budget.taskId,
          taskTitle: (dbBudget.tasks as { title: string }).title,
          budget,
          tokenUsagePercent: budget.tokenLimit
            ? (budget.tokensUsed / budget.tokenLimit) * 100
            : 0,
          costUsagePercent: budget.costLimit
            ? (budget.costUsed / budget.costLimit) * 100
            : 0,
          timeUsagePercent: budget.timeLimit
            ? (budget.timeUsed / budget.timeLimit) * 100
            : 0,
          hasWarnings: budgetAlerts.some((a) => a.type === 'warning'),
          hasCriticalAlerts: budgetAlerts.some((a) => a.type === 'critical'),
          isExceeded: budget.status === 'exceeded',
          recentUsages: usages,
          activeAlerts: budgetAlerts.filter((a) => !a.acknowledged),
        };
      })
    );

    return {
      totalTasks: mappedBudgets.length,
      tasksWithBudget: mappedBudgets.length,
      activeTasksCount,
      pausedTasksCount,
      exceededTasksCount,
      totalTokensUsed,
      totalCostUsed,
      totalTimeUsed,
      totalTokenLimit,
      totalCostLimit,
      totalTimeLimit,
      averageTokensPerTask:
        mappedBudgets.length > 0 ? totalTokensUsed / mappedBudgets.length : 0,
      averageCostPerTask:
        mappedBudgets.length > 0 ? totalCostUsed / mappedBudgets.length : 0,
      averageTimePerTask:
        mappedBudgets.length > 0 ? totalTimeUsed / mappedBudgets.length : 0,
      totalAlerts: mappedAlerts.length,
      criticalAlerts,
      unacknowledgedAlerts,
      taskSummaries,
    };
  }

  // =====================
  // Helper Methods
  // =====================

  private async getBudgetById(budgetId: string): Promise<Budget | null> {
    const { data, error } = await this.supabase
      .from('budgets')
      .select('*')
      .eq('id', budgetId)
      .single();

    if (error) {
      console.error('Error fetching budget:', error);
      return null;
    }

    return this.mapDbBudgetToBudget(data);
  }

  private mapDbBudgetToBudget(dbBudget: Record<string, unknown>): Budget {
    return {
      id: dbBudget.id as string,
      userId: dbBudget.user_id as string,
      taskId: dbBudget.task_id as string,
      tokenLimit: (dbBudget.token_limit as number) || undefined,
      costLimit: (dbBudget.cost_limit as number) || undefined,
      timeLimit: (dbBudget.time_limit as number) || undefined,
      tokensUsed: (dbBudget.tokens_used as number) || 0,
      costUsed: (dbBudget.cost_used as number) || 0,
      timeUsed: (dbBudget.time_used as number) || 0,
      maxRetries: (dbBudget.max_retries as number) || 3,
      retriesUsed: (dbBudget.retries_used as number) || 0,
      status: (dbBudget.status as BudgetStatus) || 'active',
      isPaused: (dbBudget.is_paused as boolean) || false,
      createdAt: new Date(dbBudget.created_at as string).getTime(),
      updatedAt: new Date(dbBudget.updated_at as string).getTime(),
      pausedAt: dbBudget.paused_at
        ? new Date(dbBudget.paused_at as string).getTime()
        : undefined,
      completedAt: dbBudget.completed_at
        ? new Date(dbBudget.completed_at as string).getTime()
        : undefined,
    };
  }

  private mapDbUsageToUsage(dbUsage: Record<string, unknown>): BudgetUsage {
    return {
      id: dbUsage.id as string,
      budgetId: dbUsage.budget_id as string,
      taskId: dbUsage.task_id as string,
      tokens: (dbUsage.tokens as number) || 0,
      cost: (dbUsage.cost as number) || 0,
      timeSpent: (dbUsage.time_spent as number) || 0,
      agentId: (dbUsage.agent_id as string) || undefined,
      operation: (dbUsage.operation as string) || '',
      success: (dbUsage.success as boolean) || false,
      errorMessage: (dbUsage.error_message as string) || undefined,
      metadata: (dbUsage.metadata as Record<string, unknown>) || undefined,
      createdAt: new Date(dbUsage.created_at as string).getTime(),
    };
  }

  private mapDbAlertToAlert(dbAlert: Record<string, unknown>): BudgetAlert {
    return {
      id: dbAlert.id as string,
      budgetId: dbAlert.budget_id as string,
      taskId: dbAlert.task_id as string,
      type: (dbAlert.type as 'warning' | 'critical' | 'exceeded') || 'warning',
      message: (dbAlert.message as string) || '',
      threshold: (dbAlert.threshold as number) || 0,
      currentUsage: (dbAlert.current_usage as number) || 0,
      limit: (dbAlert.limit_value as number) || 0,
      budgetType: (dbAlert.budget_type as BudgetType) || 'tokens',
      acknowledged: (dbAlert.acknowledged as boolean) || false,
      createdAt: new Date(dbAlert.created_at as string).getTime(),
      acknowledgedAt: dbAlert.acknowledged_at
        ? new Date(dbAlert.acknowledged_at as string).getTime()
        : undefined,
    };
  }

  private getEmptyStats(): PMDashboardStats {
    return {
      totalTasks: 0,
      tasksWithBudget: 0,
      activeTasksCount: 0,
      pausedTasksCount: 0,
      exceededTasksCount: 0,
      totalTokensUsed: 0,
      totalCostUsed: 0,
      totalTimeUsed: 0,
      totalTokenLimit: 0,
      totalCostLimit: 0,
      totalTimeLimit: 0,
      averageTokensPerTask: 0,
      averageCostPerTask: 0,
      averageTimePerTask: 0,
      totalAlerts: 0,
      criticalAlerts: 0,
      unacknowledgedAlerts: 0,
      taskSummaries: [],
    };
  }
}

// Export a singleton instance
export const budgetManager = new BudgetManager();

// Helper functions for formatting
export function formatCost(cents: number): string {
  return `$${(cents / 100).toFixed(2)}`;
}

export function formatTime(minutes: number): string {
  if (minutes < 60) {
    return `${minutes}m`;
  }
  const hours = Math.floor(minutes / 60);
  const remainingMinutes = minutes % 60;
  return remainingMinutes > 0 ? `${hours}h ${remainingMinutes}m` : `${hours}h`;
}

export function formatTokens(tokens: number): string {
  if (tokens < 1000) {
    return `${tokens}`;
  }
  if (tokens < 1000000) {
    return `${(tokens / 1000).toFixed(1)}K`;
  }
  return `${(tokens / 1000000).toFixed(1)}M`;
}
