'use client';

import { useState, useEffect, useCallback, useRef, useMemo } from 'react';
import { ExecutionTrace, ExecutionTraceFilter, ReplayParameters } from '@/types/execution-trace';
import { createClient } from '@/lib/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import {
  createExecutionTrace,
  addPrompt,
  addToolCall,
  addFileDiff,
  addTestLog,
  addCheckpoint,
  updateTraceStatus,
  createReplayTrace,
  exportTraceToJSON,
  importTraceFromJSON,
  filterTraces as filterTracesUtil,
  calculateTraceStatistics,
} from '@/lib/execution-trace';

interface DbExecutionTrace {
  id: string;
  user_id: string;
  task_id: string;
  agent_id: string;
  status: string;
  start_time: string;
  end_time: string | null;
  prompts: any[];
  tool_calls: any[];
  diffs: any[];
  test_logs: any[];
  checkpoints: any[];
  metrics: any;
  metadata: any;
  parent_trace_id: string | null;
  replay_parameters: any | null;
  created_at: string;
  updated_at: string;
}

const mapDbTraceToTrace = (dbTrace: DbExecutionTrace): ExecutionTrace => ({
  id: dbTrace.id,
  taskId: dbTrace.task_id,
  agentId: dbTrace.agent_id,
  status: dbTrace.status as ExecutionTrace['status'],
  startTime: new Date(dbTrace.start_time).getTime(),
  endTime: dbTrace.end_time ? new Date(dbTrace.end_time).getTime() : undefined,
  prompts: dbTrace.prompts || [],
  toolCalls: dbTrace.tool_calls || [],
  diffs: dbTrace.diffs || [],
  testLogs: dbTrace.test_logs || [],
  checkpoints: dbTrace.checkpoints || [],
  metrics: dbTrace.metrics || {
    totalDuration: 0,
    toolCallCount: 0,
    fileChangesCount: 0,
    testsPassed: 0,
    testsFailed: 0,
    tokensUsed: 0,
    errorCount: 0,
  },
  metadata: dbTrace.metadata || {},
  parentTraceId: dbTrace.parent_trace_id || undefined,
  replayParameters: dbTrace.replay_parameters || undefined,
  createdAt: new Date(dbTrace.created_at).getTime(),
  updatedAt: new Date(dbTrace.updated_at).getTime(),
});

const mapTraceToDbTrace = (trace: ExecutionTrace, userId: string) => ({
  id: trace.id,
  user_id: userId,
  task_id: trace.taskId,
  agent_id: trace.agentId,
  status: trace.status,
  start_time: new Date(trace.startTime).toISOString(),
  end_time: trace.endTime ? new Date(trace.endTime).toISOString() : null,
  prompts: trace.prompts,
  tool_calls: trace.toolCalls,
  diffs: trace.diffs,
  test_logs: trace.testLogs,
  checkpoints: trace.checkpoints,
  metrics: trace.metrics,
  metadata: trace.metadata,
  parent_trace_id: trace.parentTraceId || null,
  replay_parameters: trace.replayParameters || null,
});

export const useExecutionTraces = (filter?: ExecutionTraceFilter) => {
  const [traces, setTraces] = useState<ExecutionTrace[]>([]);
  const [hasFetched, setHasFetched] = useState(false);
  const { user, isLoading: authLoading } = useAuth();
  const supabase = useMemo(() => createClient(), []);
  const fetchingRef = useRef(false);

  // Fetch traces from Supabase
  useEffect(() => {
    if (authLoading || hasFetched || fetchingRef.current || !user) return;

    fetchingRef.current = true;

    const fetchTraces = async () => {
      let query = supabase
        .from('execution_traces')
        .select('*')
        .order('created_at', { ascending: false });

      // Apply filters
      if (filter?.taskId) {
        query = query.eq('task_id', filter.taskId);
      }
      if (filter?.agentId) {
        query = query.eq('agent_id', filter.agentId);
      }
      if (filter?.status) {
        query = query.eq('status', filter.status);
      }

      const { data, error } = await query;

      if (error) {
        console.error('Error fetching execution traces:', error);
      } else {
        const mappedTraces = (data || []).map(mapDbTraceToTrace);
        setTraces(
          filter ? filterTracesUtil(mappedTraces, filter) : mappedTraces
        );
      }
      setHasFetched(true);
      fetchingRef.current = false;
    };

    fetchTraces();
  }, [user, authLoading, hasFetched, filter, supabase]);

  const isLoaded = useMemo(() => {
    if (authLoading) return false;
    if (!user) return true;
    return hasFetched;
  }, [authLoading, user, hasFetched]);

  // Create a new execution trace
  const createTrace = useCallback(
    async (taskId: string, agentId: string, metadata?: ExecutionTrace['metadata']) => {
      if (!user) {
        throw new Error('You must be logged in to create execution traces');
      }

      const trace = createExecutionTrace(taskId, agentId, metadata);
      const dbTrace = mapTraceToDbTrace(trace, user.id);

      const { data, error } = await supabase
        .from('execution_traces')
        .insert(dbTrace)
        .select()
        .single();

      if (error) {
        console.error('Error creating execution trace:', error);
        throw new Error(error.message);
      }

      if (data) {
        const newTrace = mapDbTraceToTrace(data);
        setTraces((prev) => [newTrace, ...prev]);
        return newTrace;
      }

      throw new Error('Failed to create execution trace');
    },
    [user, supabase]
  );

  // Update an existing trace
  const updateTrace = useCallback(
    async (trace: ExecutionTrace) => {
      if (!user) return;

      const dbTrace = mapTraceToDbTrace(trace, user.id);
      const { updated_at, created_at, ...updateData } = dbTrace as any;

      const { error } = await supabase
        .from('execution_traces')
        .update(updateData)
        .eq('id', trace.id);

      if (error) {
        console.error('Error updating execution trace:', error);
        return;
      }

      setTraces((prev) =>
        prev.map((t) => (t.id === trace.id ? { ...trace, updatedAt: Date.now() } : t))
      );
    },
    [user, supabase]
  );

  // Delete a trace
  const deleteTrace = useCallback(
    async (traceId: string) => {
      if (!user) return;

      const { error } = await supabase
        .from('execution_traces')
        .delete()
        .eq('id', traceId);

      if (error) {
        console.error('Error deleting execution trace:', error);
        return;
      }

      setTraces((prev) => prev.filter((t) => t.id !== traceId));
    },
    [user, supabase]
  );

  // Get a single trace by ID
  const getTrace = useCallback(
    async (traceId: string): Promise<ExecutionTrace | null> => {
      if (!user) return null;

      const { data, error } = await supabase
        .from('execution_traces')
        .select('*')
        .eq('id', traceId)
        .single();

      if (error) {
        console.error('Error fetching execution trace:', error);
        return null;
      }

      return data ? mapDbTraceToTrace(data) : null;
    },
    [user, supabase]
  );

  // Replay a trace
  const replayTrace = useCallback(
    async (traceId: string, replayParameters: ReplayParameters) => {
      if (!user) {
        throw new Error('You must be logged in to replay traces');
      }

      const originalTrace = await getTrace(traceId);
      if (!originalTrace) {
        throw new Error('Original trace not found');
      }

      const replayTraceObj = createReplayTrace(originalTrace, replayParameters);
      return createTrace(
        replayTraceObj.taskId,
        replayTraceObj.agentId,
        replayTraceObj.metadata
      );
    },
    [user, getTrace, createTrace]
  );

  // Export trace
  const exportTrace = useCallback(
    (traceId: string): string | null => {
      const trace = traces.find((t) => t.id === traceId);
      return trace ? exportTraceToJSON(trace) : null;
    },
    [traces]
  );

  // Import trace
  const importTrace = useCallback(
    async (json: string) => {
      if (!user) {
        throw new Error('You must be logged in to import traces');
      }

      const trace = importTraceFromJSON(json);
      const dbTrace = mapTraceToDbTrace(trace, user.id);

      const { data, error } = await supabase
        .from('execution_traces')
        .insert(dbTrace)
        .select()
        .single();

      if (error) {
        console.error('Error importing execution trace:', error);
        throw new Error(error.message);
      }

      if (data) {
        const newTrace = mapDbTraceToTrace(data);
        setTraces((prev) => [newTrace, ...prev]);
        return newTrace;
      }

      throw new Error('Failed to import execution trace');
    },
    [user, supabase]
  );

  // Get traces for a specific task
  const getTracesForTask = useCallback(
    (taskId: string): ExecutionTrace[] => {
      return traces.filter((t) => t.taskId === taskId);
    },
    [traces]
  );

  // Get traces for a specific agent
  const getTracesForAgent = useCallback(
    (agentId: string): ExecutionTrace[] => {
      return traces.filter((t) => t.agentId === agentId);
    },
    [traces]
  );

  // Calculate statistics
  const statistics = useMemo(() => {
    return calculateTraceStatistics(traces);
  }, [traces]);

  return {
    traces,
    isLoaded,
    createTrace,
    updateTrace,
    deleteTrace,
    getTrace,
    replayTrace,
    exportTrace,
    importTrace,
    getTracesForTask,
    getTracesForAgent,
    statistics,
    // Utility functions for updating traces
    addPromptToTrace: addPrompt,
    addToolCallToTrace: addToolCall,
    addFileDiffToTrace: addFileDiff,
    addTestLogToTrace: addTestLog,
    addCheckpointToTrace: addCheckpoint,
    updateTraceStatus,
  };
};
