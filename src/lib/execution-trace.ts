/**
 * Execution Trace Utilities
 *
 * This module provides utilities for recording, storing, and replaying agent execution traces.
 */

import {
  ExecutionTrace,
  ExecutionStatus,
  ToolCall,
  FileDiff,
  TestLog,
  Prompt,
  Checkpoint,
  ExecutionMetrics,
  ReplayParameters,
  ExecutionTraceFilter,
  ExecutionTraceSummary,
} from '@/types/execution-trace';

/**
 * Generate a unique ID for trace elements
 */
export const generateTraceId = (): string => {
  return `trace-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
};

/**
 * Create a new execution trace
 */
export const createExecutionTrace = (
  taskId: string,
  agentId: string,
  metadata?: ExecutionTrace['metadata']
): ExecutionTrace => {
  return {
    id: generateTraceId(),
    taskId,
    agentId,
    status: 'pending',
    startTime: Date.now(),
    prompts: [],
    toolCalls: [],
    diffs: [],
    testLogs: [],
    checkpoints: [],
    metrics: {
      totalDuration: 0,
      toolCallCount: 0,
      fileChangesCount: 0,
      testsPassed: 0,
      testsFailed: 0,
      tokensUsed: 0,
      errorCount: 0,
    },
    metadata: metadata || {},
    createdAt: Date.now(),
    updatedAt: Date.now(),
  };
};

/**
 * Add a prompt to the trace
 */
export const addPrompt = (
  trace: ExecutionTrace,
  role: Prompt['role'],
  content: string,
  tokens?: number
): ExecutionTrace => {
  const prompt: Prompt = {
    id: generateTraceId(),
    timestamp: Date.now(),
    role,
    content,
    tokens,
  };

  return {
    ...trace,
    prompts: [...trace.prompts, prompt],
    metrics: {
      ...trace.metrics,
      tokensUsed: trace.metrics.tokensUsed + (tokens || 0),
    },
    updatedAt: Date.now(),
  };
};

/**
 * Add a tool call to the trace
 */
export const addToolCall = (
  trace: ExecutionTrace,
  toolCall: Omit<ToolCall, 'id' | 'timestamp'>
): ExecutionTrace => {
  const fullToolCall: ToolCall = {
    id: generateTraceId(),
    timestamp: Date.now(),
    ...toolCall,
  };

  return {
    ...trace,
    toolCalls: [...trace.toolCalls, fullToolCall],
    metrics: {
      ...trace.metrics,
      toolCallCount: trace.metrics.toolCallCount + 1,
      errorCount: fullToolCall.error
        ? trace.metrics.errorCount + 1
        : trace.metrics.errorCount,
    },
    updatedAt: Date.now(),
  };
};

/**
 * Add a file diff to the trace
 */
export const addFileDiff = (
  trace: ExecutionTrace,
  diff: Omit<FileDiff, 'id' | 'timestamp'>
): ExecutionTrace => {
  const fullDiff: FileDiff = {
    id: generateTraceId(),
    timestamp: Date.now(),
    ...diff,
  };

  return {
    ...trace,
    diffs: [...trace.diffs, fullDiff],
    metrics: {
      ...trace.metrics,
      fileChangesCount: trace.metrics.fileChangesCount + 1,
    },
    updatedAt: Date.now(),
  };
};

/**
 * Add a test log to the trace
 */
export const addTestLog = (
  trace: ExecutionTrace,
  testLog: Omit<TestLog, 'id' | 'timestamp'>
): ExecutionTrace => {
  const fullTestLog: TestLog = {
    id: generateTraceId(),
    timestamp: Date.now(),
    ...testLog,
  };

  const newMetrics = { ...trace.metrics };
  if (testLog.status === 'passed') {
    newMetrics.testsPassed += 1;
  } else if (testLog.status === 'failed') {
    newMetrics.testsFailed += 1;
  }

  return {
    ...trace,
    testLogs: [...trace.testLogs, fullTestLog],
    metrics: newMetrics,
    updatedAt: Date.now(),
  };
};

/**
 * Add a checkpoint to the trace
 */
export const addCheckpoint = (
  trace: ExecutionTrace,
  checkpoint: Omit<Checkpoint, 'id' | 'timestamp'>
): ExecutionTrace => {
  const fullCheckpoint: Checkpoint = {
    id: generateTraceId(),
    timestamp: Date.now(),
    ...checkpoint,
  };

  return {
    ...trace,
    checkpoints: [...trace.checkpoints, fullCheckpoint],
    updatedAt: Date.now(),
  };
};

/**
 * Update the status of an execution trace
 */
export const updateTraceStatus = (
  trace: ExecutionTrace,
  status: ExecutionStatus
): ExecutionTrace => {
  const updates: Partial<ExecutionTrace> = {
    status,
    updatedAt: Date.now(),
  };

  if (status === 'success' || status === 'failed' || status === 'cancelled') {
    updates.endTime = Date.now();
    updates.metrics = {
      ...trace.metrics,
      totalDuration: Date.now() - trace.startTime,
    };
  }

  return {
    ...trace,
    ...updates,
  };
};

/**
 * Create a summary of an execution trace
 */
export const createTraceSummary = (
  trace: ExecutionTrace
): ExecutionTraceSummary => {
  return {
    id: trace.id,
    taskId: trace.taskId,
    agentId: trace.agentId,
    status: trace.status,
    startTime: trace.startTime,
    endTime: trace.endTime,
    duration: trace.endTime ? trace.endTime - trace.startTime : undefined,
    metrics: trace.metrics,
    tags: trace.metadata.tags,
  };
};

/**
 * Filter execution traces based on criteria
 */
export const filterTraces = (
  traces: ExecutionTrace[],
  filter: ExecutionTraceFilter
): ExecutionTrace[] => {
  return traces.filter((trace) => {
    if (filter.taskId && trace.taskId !== filter.taskId) {
      return false;
    }
    if (filter.agentId && trace.agentId !== filter.agentId) {
      return false;
    }
    if (filter.status && trace.status !== filter.status) {
      return false;
    }
    if (filter.startTimeFrom && trace.startTime < filter.startTimeFrom) {
      return false;
    }
    if (filter.startTimeTo && trace.startTime > filter.startTimeTo) {
      return false;
    }
    if (filter.tags && filter.tags.length > 0) {
      const traceTags = trace.metadata.tags || [];
      if (!filter.tags.some((tag) => traceTags.includes(tag))) {
        return false;
      }
    }
    return true;
  });
};

/**
 * Create a replay trace from an existing trace
 */
export const createReplayTrace = (
  originalTrace: ExecutionTrace,
  replayParameters: ReplayParameters
): ExecutionTrace => {
  let startingCheckpoint: Checkpoint | undefined;

  if (replayParameters.startFromCheckpoint) {
    startingCheckpoint = originalTrace.checkpoints.find(
      (cp) => cp.id === replayParameters.startFromCheckpoint
    );
  }

  const newTrace: ExecutionTrace = {
    ...createExecutionTrace(originalTrace.taskId, originalTrace.agentId, {
      ...originalTrace.metadata,
      notes: `Replay of trace ${originalTrace.id}`,
    }),
    parentTraceId: originalTrace.id,
    replayParameters,
  };

  // If starting from a checkpoint, copy the state up to that checkpoint
  if (startingCheckpoint) {
    const checkpointIndex = originalTrace.checkpoints.indexOf(startingCheckpoint);

    // Copy prompts, tool calls, diffs, and test logs up to the checkpoint
    newTrace.prompts = originalTrace.prompts.filter(
      (p) => p.timestamp <= startingCheckpoint.timestamp
    );
    newTrace.toolCalls = originalTrace.toolCalls.filter(
      (tc) => tc.timestamp <= startingCheckpoint.timestamp
    );
    newTrace.diffs = originalTrace.diffs.filter(
      (d) => d.timestamp <= startingCheckpoint.timestamp
    );
    newTrace.testLogs = originalTrace.testLogs.filter(
      (tl) => tl.timestamp <= startingCheckpoint.timestamp
    );
    newTrace.checkpoints = originalTrace.checkpoints.slice(0, checkpointIndex + 1);

    // Recalculate metrics
    newTrace.metrics = {
      totalDuration: 0,
      toolCallCount: newTrace.toolCalls.length,
      fileChangesCount: newTrace.diffs.length,
      testsPassed: newTrace.testLogs.filter((tl) => tl.status === 'passed').length,
      testsFailed: newTrace.testLogs.filter((tl) => tl.status === 'failed').length,
      tokensUsed: newTrace.prompts.reduce((sum, p) => sum + (p.tokens || 0), 0),
      errorCount: newTrace.toolCalls.filter((tc) => tc.error).length,
    };
  }

  return newTrace;
};

/**
 * Export trace to JSON
 */
export const exportTraceToJSON = (trace: ExecutionTrace): string => {
  return JSON.stringify(trace, null, 2);
};

/**
 * Import trace from JSON
 */
export const importTraceFromJSON = (json: string): ExecutionTrace => {
  return JSON.parse(json) as ExecutionTrace;
};

/**
 * Calculate trace statistics
 */
export const calculateTraceStatistics = (traces: ExecutionTrace[]) => {
  const stats = {
    totalTraces: traces.length,
    successfulTraces: 0,
    failedTraces: 0,
    averageDuration: 0,
    totalToolCalls: 0,
    totalFileChanges: 0,
    totalTestsPassed: 0,
    totalTestsFailed: 0,
    totalTokensUsed: 0,
  };

  let totalDuration = 0;
  let completedTraces = 0;

  traces.forEach((trace) => {
    if (trace.status === 'success') {
      stats.successfulTraces++;
    } else if (trace.status === 'failed') {
      stats.failedTraces++;
    }

    if (trace.endTime) {
      totalDuration += trace.endTime - trace.startTime;
      completedTraces++;
    }

    stats.totalToolCalls += trace.metrics.toolCallCount;
    stats.totalFileChanges += trace.metrics.fileChangesCount;
    stats.totalTestsPassed += trace.metrics.testsPassed;
    stats.totalTestsFailed += trace.metrics.testsFailed;
    stats.totalTokensUsed += trace.metrics.tokensUsed;
  });

  if (completedTraces > 0) {
    stats.averageDuration = totalDuration / completedTraces;
  }

  return stats;
};
