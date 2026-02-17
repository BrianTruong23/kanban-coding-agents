'use client';

import { useState, useEffect, useCallback, useMemo } from 'react';
import { TaskBudgetLog, BudgetLogType } from '@/types/budget';
import { createClient } from '@/lib/supabase/client';
import { useAuth } from '@/contexts/AuthContext';

interface DbBudgetLog {
  id: string;
  task_id: string;
  user_id: string;
  log_type: string;
  tokens_used: number;
  cost_incurred: number;
  time_taken: number;
  details: string | null;
  created_at: string;
}

const mapDbLogToLog = (dbLog: DbBudgetLog): TaskBudgetLog => ({
  id: dbLog.id,
  taskId: dbLog.task_id,
  userId: dbLog.user_id,
  logType: dbLog.log_type as BudgetLogType,
  tokensUsed: dbLog.tokens_used || 0,
  costIncurred: dbLog.cost_incurred || 0,
  timeTaken: dbLog.time_taken || 0,
  details: dbLog.details || undefined,
  createdAt: new Date(dbLog.created_at).getTime(),
});

export const useBudgets = () => {
  const [logs, setLogs] = useState<TaskBudgetLog[]>([]);
  const [hasFetched, setHasFetched] = useState(false);
  const { user, isLoading: authLoading } = useAuth();
  const supabase = useMemo(() => createClient(), []);

  useEffect(() => {
    if (authLoading || hasFetched || !user) return;

    const fetchLogs = async () => {
      const { data, error } = await supabase
        .from('task_budget_logs')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) {
        console.error('Error fetching budget logs:', error);
      } else {
        setLogs((data || []).map(mapDbLogToLog));
      }
      setHasFetched(true);
    };

    fetchLogs();
  }, [user, authLoading, hasFetched, supabase]);

  const isLoaded = useMemo(() => {
    if (authLoading) return false;
    if (!user) return true;
    return hasFetched;
  }, [authLoading, user, hasFetched]);

  const addLog = useCallback(async (log: Omit<TaskBudgetLog, 'id' | 'userId' | 'createdAt'>) => {
    if (!user) {
      throw new Error('You must be logged in to add budget logs');
    }

    const { data, error } = await supabase
      .from('task_budget_logs')
      .insert({
        user_id: user.id,
        task_id: log.taskId,
        log_type: log.logType,
        tokens_used: log.tokensUsed || 0,
        cost_incurred: log.costIncurred || 0,
        time_taken: log.timeTaken || 0,
        details: log.details || null,
      })
      .select()
      .single();

    if (error) {
      console.error('Error adding budget log:', error);
      throw new Error(error.message);
    }

    if (data) {
      setLogs((prev) => [mapDbLogToLog(data), ...prev]);
    }
  }, [user, supabase]);

  const getLogsForTask = useCallback((taskId: string) => {
    return logs.filter(log => log.taskId === taskId);
  }, [logs]);

  const getTaskBudgetSummary = useCallback((taskId: string) => {
    const taskLogs = getLogsForTask(taskId);

    return taskLogs.reduce((acc, log) => ({
      tokensUsed: acc.tokensUsed + log.tokensUsed,
      costIncurred: acc.costIncurred + log.costIncurred,
      timeTaken: acc.timeTaken + log.timeTaken,
      retryCount: log.logType === 'retry' ? acc.retryCount + 1 : acc.retryCount,
    }), {
      tokensUsed: 0,
      costIncurred: 0,
      timeTaken: 0,
      retryCount: 0,
    });
  }, [getLogsForTask]);

  return {
    logs,
    addLog,
    getLogsForTask,
    getTaskBudgetSummary,
    isLoaded,
  };
};
