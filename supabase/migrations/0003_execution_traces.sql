-- Create execution_traces table
CREATE TABLE IF NOT EXISTS execution_traces (
    id TEXT PRIMARY KEY,
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    task_id TEXT NOT NULL,
    agent_id TEXT NOT NULL,
    status TEXT NOT NULL CHECK (status IN ('pending', 'running', 'success', 'failed', 'paused', 'cancelled')),
    start_time TIMESTAMPTZ NOT NULL,
    end_time TIMESTAMPTZ,
    prompts JSONB DEFAULT '[]'::jsonb,
    tool_calls JSONB DEFAULT '[]'::jsonb,
    diffs JSONB DEFAULT '[]'::jsonb,
    test_logs JSONB DEFAULT '[]'::jsonb,
    checkpoints JSONB DEFAULT '[]'::jsonb,
    metrics JSONB DEFAULT '{
        "totalDuration": 0,
        "toolCallCount": 0,
        "fileChangesCount": 0,
        "testsPassed": 0,
        "testsFailed": 0,
        "tokensUsed": 0,
        "errorCount": 0
    }'::jsonb,
    metadata JSONB DEFAULT '{}'::jsonb,
    parent_trace_id TEXT,
    replay_parameters JSONB,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Add indexes for better query performance
CREATE INDEX IF NOT EXISTS idx_execution_traces_user_id ON execution_traces(user_id);
CREATE INDEX IF NOT EXISTS idx_execution_traces_task_id ON execution_traces(task_id);
CREATE INDEX IF NOT EXISTS idx_execution_traces_agent_id ON execution_traces(agent_id);
CREATE INDEX IF NOT EXISTS idx_execution_traces_status ON execution_traces(status);
CREATE INDEX IF NOT EXISTS idx_execution_traces_start_time ON execution_traces(start_time DESC);
CREATE INDEX IF NOT EXISTS idx_execution_traces_parent_trace_id ON execution_traces(parent_trace_id);

-- Add foreign key constraint for parent_trace_id (self-referencing)
ALTER TABLE execution_traces
ADD CONSTRAINT fk_parent_trace
FOREIGN KEY (parent_trace_id)
REFERENCES execution_traces(id)
ON DELETE SET NULL;

-- Create a function to automatically update the updated_at timestamp
CREATE OR REPLACE FUNCTION update_execution_trace_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create a trigger to call the function before updates
CREATE TRIGGER trigger_update_execution_trace_updated_at
BEFORE UPDATE ON execution_traces
FOR EACH ROW
EXECUTE FUNCTION update_execution_trace_updated_at();

-- Enable Row Level Security (RLS)
ALTER TABLE execution_traces ENABLE ROW LEVEL SECURITY;

-- Create RLS policies
-- Users can only see their own execution traces
CREATE POLICY "Users can view their own execution traces"
ON execution_traces
FOR SELECT
USING (auth.uid() = user_id);

-- Users can insert their own execution traces
CREATE POLICY "Users can insert their own execution traces"
ON execution_traces
FOR INSERT
WITH CHECK (auth.uid() = user_id);

-- Users can update their own execution traces
CREATE POLICY "Users can update their own execution traces"
ON execution_traces
FOR UPDATE
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);

-- Users can delete their own execution traces
CREATE POLICY "Users can delete their own execution traces"
ON execution_traces
FOR DELETE
USING (auth.uid() = user_id);

-- Create a view for execution trace summaries (for better performance)
CREATE OR REPLACE VIEW execution_trace_summaries AS
SELECT
    id,
    user_id,
    task_id,
    agent_id,
    status,
    start_time,
    end_time,
    EXTRACT(EPOCH FROM (end_time - start_time)) * 1000 AS duration_ms,
    metrics,
    metadata->'tags' AS tags,
    parent_trace_id,
    created_at,
    updated_at
FROM execution_traces;

-- Grant access to the view
GRANT SELECT ON execution_trace_summaries TO authenticated;

-- Add comments for documentation
COMMENT ON TABLE execution_traces IS 'Stores detailed execution traces for agent runs, including prompts, tool calls, diffs, and test results';
COMMENT ON COLUMN execution_traces.id IS 'Unique identifier for the execution trace';
COMMENT ON COLUMN execution_traces.user_id IS 'Reference to the user who owns this trace';
COMMENT ON COLUMN execution_traces.task_id IS 'Reference to the task being executed';
COMMENT ON COLUMN execution_traces.agent_id IS 'Reference to the agent performing the execution';
COMMENT ON COLUMN execution_traces.status IS 'Current status of the execution';
COMMENT ON COLUMN execution_traces.prompts IS 'Array of prompts exchanged during execution';
COMMENT ON COLUMN execution_traces.tool_calls IS 'Array of tool calls made during execution';
COMMENT ON COLUMN execution_traces.diffs IS 'Array of file diffs produced during execution';
COMMENT ON COLUMN execution_traces.test_logs IS 'Array of test execution logs';
COMMENT ON COLUMN execution_traces.checkpoints IS 'Array of checkpoints for replay functionality';
COMMENT ON COLUMN execution_traces.metrics IS 'Execution metrics and statistics';
COMMENT ON COLUMN execution_traces.parent_trace_id IS 'Reference to the parent trace if this is a replay';
COMMENT ON COLUMN execution_traces.replay_parameters IS 'Parameters used for replay if applicable';
