# Execution Traces & Replay

This document describes the execution trace and replay functionality for agent runs in the Kanban Coding Agents application.

## Overview

The execution trace feature records detailed information about each agent run, including:
- Prompts exchanged between user and agent
- Tool calls (bash commands, API calls, etc.)
- File changes (diffs)
- Test execution results
- Execution checkpoints
- Performance metrics

The replay feature allows you to:
- Re-execute an agent task with the same or modified parameters
- Resume execution from a specific checkpoint
- Simulate execution (dry run) without making actual changes
- Compare different execution attempts

## Table of Contents

1. [Architecture](#architecture)
2. [Data Model](#data-model)
3. [Usage](#usage)
4. [API Reference](#api-reference)
5. [Database Schema](#database-schema)
6. [Examples](#examples)

## Architecture

### Components

The execution trace feature is composed of the following components:

```
src/
├── types/
│   └── execution-trace.ts          # Type definitions
├── lib/
│   └── execution-trace.ts          # Utility functions
├── hooks/
│   └── useExecutionTraces.ts       # React hook for trace management
├── components/
│   ├── ExecutionTraceViewer.tsx    # View detailed trace information
│   ├── ExecutionTraceList.tsx      # List of traces with filtering
│   ├── ReplayModal.tsx             # Configure replay parameters
│   └── TaskExecutionPanel.tsx      # Integrate traces with tasks
└── app/
    └── traces/
        └── page.tsx                # Main traces page
```

## Data Model

### ExecutionTrace

The main data structure for storing execution information:

```typescript
interface ExecutionTrace {
  id: string;                       // Unique identifier
  taskId: string;                   // Reference to the task
  agentId: string;                  // Reference to the agent
  status: ExecutionStatus;          // Current execution status
  startTime: number;                // Start timestamp
  endTime?: number;                 // End timestamp (if completed)
  prompts: Prompt[];                // Conversation prompts
  toolCalls: ToolCall[];            // Tool invocations
  diffs: FileDiff[];                // File changes
  testLogs: TestLog[];              // Test results
  checkpoints: Checkpoint[];        // Execution checkpoints
  metrics: ExecutionMetrics;        // Performance metrics
  metadata: {                       // Additional metadata
    environment?: string;
    branch?: string;
    commit?: string;
    tags?: string[];
    notes?: string;
  };
  parentTraceId?: string;           // Parent trace for replays
  replayParameters?: ReplayParameters;
  createdAt: number;
  updatedAt: number;
}
```

### ExecutionStatus

Possible states of an execution:
- `pending`: Execution created but not started
- `running`: Currently executing
- `success`: Completed successfully
- `failed`: Completed with errors
- `paused`: Temporarily stopped
- `cancelled`: Manually stopped

### ToolCall

Records a single tool invocation:

```typescript
interface ToolCall {
  id: string;
  type: ToolType;                   // bash, file_edit, api_call, etc.
  timestamp: number;
  command?: string;                 // Command executed
  input: string;                    // Input parameters
  output?: string;                  // Command output
  error?: string;                   // Error message if failed
  duration?: number;                // Execution time in ms
  exitCode?: number;                // Exit code for bash commands
}
```

### FileDiff

Records a file change:

```typescript
interface FileDiff {
  id: string;
  timestamp: number;
  filePath: string;                 // Path to the file
  oldContent?: string;              // Previous content
  newContent: string;               // New content
  changeType: 'create' | 'modify' | 'delete';
  diff?: string;                    // Unified diff format
}
```

### TestLog

Records a test execution:

```typescript
interface TestLog {
  id: string;
  timestamp: number;
  testName: string;
  status: 'passed' | 'failed' | 'skipped';
  duration: number;
  output?: string;
  error?: string;
}
```

### Checkpoint

Saves execution state for replay:

```typescript
interface Checkpoint {
  id: string;
  timestamp: number;
  label: string;
  description?: string;
  state: {
    workingDirectory?: string;
    environmentVariables?: Record<string, string>;
    installedPackages?: string[];
    fileSystemSnapshot?: Record<string, string>;
  };
}
```

### ReplayParameters

Configuration for replaying a trace:

```typescript
interface ReplayParameters {
  startFromCheckpoint?: string;     // Resume from checkpoint ID
  skipSteps?: string[];             // Step IDs to skip
  modifyInputs?: Record<string, string>; // Override inputs
  stopAtCheckpoint?: string;        // Stop at checkpoint ID
  dryRun?: boolean;                 // Simulate without executing
}
```

## Usage

### Recording Execution Traces

#### 1. Using the TaskExecutionPanel Component

Add the `TaskExecutionPanel` to your task detail view:

```tsx
import { TaskExecutionPanel } from '@/components/TaskExecutionPanel';

function TaskDetail({ task, agent }) {
  return (
    <div>
      {/* Task details */}
      <TaskExecutionPanel task={task} agent={agent} />
    </div>
  );
}
```

#### 2. Manual Trace Recording

```tsx
import { useExecutionTraces } from '@/hooks/useExecutionTraces';

function MyComponent() {
  const {
    createTrace,
    updateTrace,
    addPromptToTrace,
    addToolCallToTrace,
    updateTraceStatus,
  } = useExecutionTraces();

  const executeTask = async (taskId: string, agentId: string) => {
    // Create a new trace
    const trace = await createTrace(taskId, agentId, {
      environment: 'production',
      tags: ['deployment'],
    });

    // Add a prompt
    let updatedTrace = addPromptToTrace(
      trace,
      'user',
      'Deploy the application',
      100
    );
    await updateTrace(updatedTrace);

    // Record a tool call
    updatedTrace = addToolCallToTrace(updatedTrace, {
      type: 'bash',
      command: 'npm run build',
      input: 'Building application',
      output: 'Build successful',
      duration: 15000,
      exitCode: 0,
    });
    await updateTrace(updatedTrace);

    // Mark as completed
    updatedTrace = updateTraceStatus(updatedTrace, 'success');
    await updateTrace(updatedTrace);
  };
}
```

### Viewing Execution Traces

#### 1. Traces Page

Navigate to `/traces` to view all execution traces with filtering and sorting options.

#### 2. Task-Specific Traces

```tsx
import { useExecutionTraces } from '@/hooks/useExecutionTraces';

function TaskTraces({ taskId }) {
  const { getTracesForTask } = useExecutionTraces();
  const traces = getTracesForTask(taskId);

  return (
    <div>
      <h3>Execution History</h3>
      {traces.map(trace => (
        <div key={trace.id}>
          {/* Display trace summary */}
        </div>
      ))}
    </div>
  );
}
```

### Replaying Executions

#### 1. Using the ReplayModal

```tsx
import { ReplayModal } from '@/components/ReplayModal';

function MyComponent({ trace }) {
  const [showReplay, setShowReplay] = useState(false);

  const handleReplay = async (traceId, parameters) => {
    const newTrace = await replayTrace(traceId, parameters);
    console.log('Replay started:', newTrace);
  };

  return (
    <>
      <button onClick={() => setShowReplay(true)}>Replay</button>
      <ReplayModal
        trace={trace}
        isOpen={showReplay}
        onClose={() => setShowReplay(false)}
        onReplay={handleReplay}
      />
    </>
  );
}
```

#### 2. Programmatic Replay

```tsx
const { replayTrace } = useExecutionTraces();

// Replay from beginning
await replayTrace(traceId, { dryRun: true });

// Resume from checkpoint
await replayTrace(traceId, {
  startFromCheckpoint: 'checkpoint-id',
  stopAtCheckpoint: 'another-checkpoint-id',
});

// Modify inputs
await replayTrace(traceId, {
  modifyInputs: {
    'step-1': 'new input value',
  },
});
```

### Exporting and Importing Traces

#### Export

```tsx
const { exportTrace } = useExecutionTraces();

const handleExport = (traceId) => {
  const json = exportTrace(traceId);
  if (json) {
    // Create download
    const blob = new Blob([json], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `trace-${traceId}.json`;
    a.click();
  }
};
```

#### Import

```tsx
const { importTrace } = useExecutionTraces();

const handleImport = async (file) => {
  const reader = new FileReader();
  reader.onload = async (e) => {
    const json = e.target.result;
    await importTrace(json);
  };
  reader.readAsText(file);
};
```

## API Reference

### Hooks

#### useExecutionTraces(filter?: ExecutionTraceFilter)

Main hook for managing execution traces.

**Returns:**
- `traces`: Array of execution traces
- `isLoaded`: Boolean indicating if data is loaded
- `createTrace(taskId, agentId, metadata)`: Create a new trace
- `updateTrace(trace)`: Update an existing trace
- `deleteTrace(traceId)`: Delete a trace
- `getTrace(traceId)`: Get a single trace by ID
- `replayTrace(traceId, parameters)`: Replay a trace
- `exportTrace(traceId)`: Export trace to JSON
- `importTrace(json)`: Import trace from JSON
- `getTracesForTask(taskId)`: Get all traces for a task
- `getTracesForAgent(agentId)`: Get all traces for an agent
- `statistics`: Calculated statistics across all traces

### Utility Functions

#### createExecutionTrace(taskId, agentId, metadata)

Creates a new execution trace object.

#### addPrompt(trace, role, content, tokens)

Adds a prompt to the trace.

#### addToolCall(trace, toolCall)

Adds a tool call to the trace.

#### addFileDiff(trace, diff)

Adds a file diff to the trace.

#### addTestLog(trace, testLog)

Adds a test log to the trace.

#### addCheckpoint(trace, checkpoint)

Adds a checkpoint to the trace.

#### updateTraceStatus(trace, status)

Updates the execution status and calculates metrics.

#### createReplayTrace(originalTrace, replayParameters)

Creates a new trace for replaying an existing one.

## Database Schema

The execution traces are stored in the `execution_traces` table:

```sql
CREATE TABLE execution_traces (
    id TEXT PRIMARY KEY,
    user_id UUID NOT NULL,
    task_id TEXT NOT NULL,
    agent_id TEXT NOT NULL,
    status TEXT NOT NULL,
    start_time TIMESTAMPTZ NOT NULL,
    end_time TIMESTAMPTZ,
    prompts JSONB DEFAULT '[]',
    tool_calls JSONB DEFAULT '[]',
    diffs JSONB DEFAULT '[]',
    test_logs JSONB DEFAULT '[]',
    checkpoints JSONB DEFAULT '[]',
    metrics JSONB,
    metadata JSONB DEFAULT '{}',
    parent_trace_id TEXT,
    replay_parameters JSONB,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);
```

## Examples

### Example 1: Complete Task Execution

```tsx
async function executeTaskWithTrace(task, agent) {
  // Create trace
  let trace = await createTrace(task.id, agent.id, {
    environment: 'development',
    tags: task.tags,
  });

  // Update status to running
  trace = updateTraceStatus(trace, 'running');
  await updateTrace(trace);

  // Add initial checkpoint
  trace = addCheckpointToTrace(trace, {
    label: 'Initial State',
    description: 'Before any changes',
    state: { workingDirectory: '/project' },
  });
  await updateTrace(trace);

  // Execute and record
  try {
    // ... perform work ...

    trace = updateTraceStatus(trace, 'success');
  } catch (error) {
    trace = updateTraceStatus(trace, 'failed');
  }

  await updateTrace(trace);
  return trace;
}
```

### Example 2: Dry Run Replay

```tsx
async function reviewChanges(traceId) {
  // Replay in dry run mode to see what would happen
  const newTrace = await replayTrace(traceId, {
    dryRun: true,
  });

  // Review the simulated results
  console.log('Would make changes:', newTrace.diffs);
  console.log('Would run tests:', newTrace.testLogs);

  // If approved, run for real
  const realTrace = await replayTrace(traceId, {
    dryRun: false,
  });
}
```

### Example 3: Incremental Replay

```tsx
async function fixFailedExecution(failedTraceId) {
  // Get the failed trace
  const failedTrace = await getTrace(failedTraceId);

  // Find the last successful checkpoint
  const lastGoodCheckpoint = failedTrace.checkpoints
    .filter(cp => /* check if before failure */)
    .pop();

  // Replay from that checkpoint
  const fixedTrace = await replayTrace(failedTraceId, {
    startFromCheckpoint: lastGoodCheckpoint.id,
    // Could also modify inputs if needed
  });
}
```

## Best Practices

1. **Create Checkpoints Frequently**: Add checkpoints at logical breakpoints in your execution to enable fine-grained replay.

2. **Record All Tool Calls**: Ensure every significant operation is recorded as a tool call for complete traceability.

3. **Use Meaningful Labels**: Give checkpoints and metadata descriptive names for easier navigation.

4. **Dry Run First**: When replaying, use dry run mode first to verify the expected outcome.

5. **Clean Up Old Traces**: Periodically delete old traces to manage database size.

6. **Tag Appropriately**: Use tags to categorize traces for easier filtering and analysis.

## Troubleshooting

### Traces Not Appearing

- Verify the user is logged in
- Check that the Supabase migration has been applied
- Ensure Row Level Security policies are configured correctly

### Replay Not Working

- Verify the original trace has checkpoints
- Check that all required state is saved in checkpoints
- Ensure replay parameters are valid

### Performance Issues

- Use filtering to limit the number of traces loaded
- Consider archiving old traces
- Use the summary view for listing instead of full traces

## Future Enhancements

Potential improvements to the execution trace feature:

- [ ] Real-time trace updates using Supabase Realtime
- [ ] Trace comparison and diff visualization
- [ ] Automated trace analysis and insights
- [ ] Trace compression for storage optimization
- [ ] Integration with CI/CD pipelines
- [ ] Trace sharing and collaboration
- [ ] Advanced search and filtering
- [ ] Trace templates for common workflows
