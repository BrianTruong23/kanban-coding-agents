/**
 * Execution Trace Types
 *
 * These types define the structure for recording and replaying agent execution traces.
 */

export type ToolType =
  | 'bash'
  | 'file_edit'
  | 'file_create'
  | 'file_read'
  | 'api_call'
  | 'test_run'
  | 'custom';

export type ExecutionStatus =
  | 'pending'
  | 'running'
  | 'success'
  | 'failed'
  | 'paused'
  | 'cancelled';

export interface ToolCall {
  id: string;
  type: ToolType;
  timestamp: number;
  command?: string;
  input: string;
  output?: string;
  error?: string;
  duration?: number; // in milliseconds
  exitCode?: number;
}

export interface FileDiff {
  id: string;
  timestamp: number;
  filePath: string;
  oldContent?: string;
  newContent: string;
  changeType: 'create' | 'modify' | 'delete';
  diff?: string; // unified diff format
}

export interface TestLog {
  id: string;
  timestamp: number;
  testName: string;
  status: 'passed' | 'failed' | 'skipped';
  duration: number;
  output?: string;
  error?: string;
}

export interface Prompt {
  id: string;
  timestamp: number;
  role: 'user' | 'assistant' | 'system';
  content: string;
  tokens?: number;
}

export interface Checkpoint {
  id: string;
  timestamp: number;
  label: string;
  description?: string;
  state: {
    workingDirectory?: string;
    environmentVariables?: Record<string, string>;
    installedPackages?: string[];
    fileSystemSnapshot?: Record<string, string>; // path -> content hash
  };
}

export interface ExecutionMetrics {
  totalDuration: number; // milliseconds
  toolCallCount: number;
  fileChangesCount: number;
  testsPassed: number;
  testsFailed: number;
  tokensUsed: number;
  errorCount: number;
}

export interface ReplayParameters {
  startFromCheckpoint?: string; // checkpoint ID
  skipSteps?: string[]; // step IDs to skip
  modifyInputs?: Record<string, string>; // step ID -> new input
  stopAtCheckpoint?: string; // checkpoint ID
  dryRun?: boolean; // simulate without executing
}

export interface ExecutionTrace {
  id: string;
  taskId: string; // reference to the task
  agentId: string; // reference to the agent
  status: ExecutionStatus;
  startTime: number;
  endTime?: number;
  prompts: Prompt[];
  toolCalls: ToolCall[];
  diffs: FileDiff[];
  testLogs: TestLog[];
  checkpoints: Checkpoint[];
  metrics: ExecutionMetrics;
  metadata: {
    environment?: string;
    branch?: string;
    commit?: string;
    tags?: string[];
    notes?: string;
  };
  parentTraceId?: string; // if this is a replay of another trace
  replayParameters?: ReplayParameters;
  createdAt: number;
  updatedAt: number;
}

export interface ExecutionTraceFilter {
  taskId?: string;
  agentId?: string;
  status?: ExecutionStatus;
  startTimeFrom?: number;
  startTimeTo?: number;
  tags?: string[];
}

export interface ExecutionTraceSummary {
  id: string;
  taskId: string;
  agentId: string;
  status: ExecutionStatus;
  startTime: number;
  endTime?: number;
  duration?: number;
  metrics: ExecutionMetrics;
  tags?: string[];
}
