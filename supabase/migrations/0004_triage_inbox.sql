-- Create triage_items table
CREATE TABLE IF NOT EXISTS triage_items (
    id TEXT PRIMARY KEY,
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    source TEXT NOT NULL CHECK (source IN ('github_issue', 'ci_failure', 'error_log', 'user_feedback', 'sentry', 'manual')),
    title TEXT NOT NULL,
    description TEXT NOT NULL,
    raw_data JSONB DEFAULT '{}'::jsonb,
    severity TEXT NOT NULL CHECK (severity IN ('critical', 'high', 'medium', 'low', 'info')),
    status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'triaged', 'assigned', 'duplicate', 'resolved', 'ignored')),
    cluster_id TEXT,
    duplicate_of_id TEXT,
    suggested_owner TEXT,
    reproduction_steps JSONB DEFAULT '[]'::jsonb,
    tags TEXT[] DEFAULT ARRAY[]::TEXT[],
    metadata JSONB DEFAULT '{}'::jsonb,
    assigned_task_id TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    triaged_at TIMESTAMPTZ
);

-- Create triage_clusters table
CREATE TABLE IF NOT EXISTS triage_clusters (
    id TEXT PRIMARY KEY,
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    title TEXT NOT NULL,
    description TEXT NOT NULL,
    item_ids TEXT[] DEFAULT ARRAY[]::TEXT[],
    severity TEXT NOT NULL CHECK (severity IN ('critical', 'high', 'medium', 'low', 'info')),
    suggested_owner TEXT,
    common_patterns TEXT[] DEFAULT ARRAY[]::TEXT[],
    reproduction_steps JSONB DEFAULT '[]'::jsonb,
    tags TEXT[] DEFAULT ARRAY[]::TEXT[],
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Add foreign key constraint for cluster_id
ALTER TABLE triage_items
ADD CONSTRAINT fk_cluster
FOREIGN KEY (cluster_id)
REFERENCES triage_clusters(id)
ON DELETE SET NULL;

-- Add foreign key constraint for duplicate_of_id (self-referencing)
ALTER TABLE triage_items
ADD CONSTRAINT fk_duplicate_of
FOREIGN KEY (duplicate_of_id)
REFERENCES triage_items(id)
ON DELETE SET NULL;

-- Add indexes for better query performance
CREATE INDEX IF NOT EXISTS idx_triage_items_user_id ON triage_items(user_id);
CREATE INDEX IF NOT EXISTS idx_triage_items_source ON triage_items(source);
CREATE INDEX IF NOT EXISTS idx_triage_items_severity ON triage_items(severity);
CREATE INDEX IF NOT EXISTS idx_triage_items_status ON triage_items(status);
CREATE INDEX IF NOT EXISTS idx_triage_items_cluster_id ON triage_items(cluster_id);
CREATE INDEX IF NOT EXISTS idx_triage_items_duplicate_of_id ON triage_items(duplicate_of_id);
CREATE INDEX IF NOT EXISTS idx_triage_items_created_at ON triage_items(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_triage_items_tags ON triage_items USING GIN(tags);

CREATE INDEX IF NOT EXISTS idx_triage_clusters_user_id ON triage_clusters(user_id);
CREATE INDEX IF NOT EXISTS idx_triage_clusters_severity ON triage_clusters(severity);
CREATE INDEX IF NOT EXISTS idx_triage_clusters_created_at ON triage_clusters(created_at DESC);

-- Create full-text search index for triage items
CREATE INDEX IF NOT EXISTS idx_triage_items_title_search ON triage_items USING GIN(to_tsvector('english', title));
CREATE INDEX IF NOT EXISTS idx_triage_items_description_search ON triage_items USING GIN(to_tsvector('english', description));

-- Create a function to automatically update the updated_at timestamp
CREATE OR REPLACE FUNCTION update_triage_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create triggers to call the function before updates
CREATE TRIGGER trigger_update_triage_item_updated_at
BEFORE UPDATE ON triage_items
FOR EACH ROW
EXECUTE FUNCTION update_triage_updated_at();

CREATE TRIGGER trigger_update_triage_cluster_updated_at
BEFORE UPDATE ON triage_clusters
FOR EACH ROW
EXECUTE FUNCTION update_triage_updated_at();

-- Enable Row Level Security (RLS)
ALTER TABLE triage_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE triage_clusters ENABLE ROW LEVEL SECURITY;

-- Create RLS policies for triage_items
CREATE POLICY "Users can view their own triage items"
ON triage_items
FOR SELECT
USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own triage items"
ON triage_items
FOR INSERT
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own triage items"
ON triage_items
FOR UPDATE
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete their own triage items"
ON triage_items
FOR DELETE
USING (auth.uid() = user_id);

-- Create RLS policies for triage_clusters
CREATE POLICY "Users can view their own triage clusters"
ON triage_clusters
FOR SELECT
USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own triage clusters"
ON triage_clusters
FOR INSERT
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own triage clusters"
ON triage_clusters
FOR UPDATE
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete their own triage clusters"
ON triage_clusters
FOR DELETE
USING (auth.uid() = user_id);

-- Create a view for triage statistics
CREATE OR REPLACE VIEW triage_stats AS
SELECT
    user_id,
    COUNT(*) AS total,
    COUNT(CASE WHEN status = 'pending' THEN 1 END) AS pending_count,
    COUNT(CASE WHEN status = 'triaged' THEN 1 END) AS triaged_count,
    COUNT(CASE WHEN status = 'assigned' THEN 1 END) AS assigned_count,
    COUNT(CASE WHEN status = 'duplicate' THEN 1 END) AS duplicate_count,
    COUNT(CASE WHEN status = 'resolved' THEN 1 END) AS resolved_count,
    COUNT(CASE WHEN status = 'ignored' THEN 1 END) AS ignored_count,
    COUNT(CASE WHEN source = 'github_issue' THEN 1 END) AS github_issue_count,
    COUNT(CASE WHEN source = 'ci_failure' THEN 1 END) AS ci_failure_count,
    COUNT(CASE WHEN source = 'error_log' THEN 1 END) AS error_log_count,
    COUNT(CASE WHEN source = 'user_feedback' THEN 1 END) AS user_feedback_count,
    COUNT(CASE WHEN severity = 'critical' THEN 1 END) AS critical_count,
    COUNT(CASE WHEN severity = 'high' THEN 1 END) AS high_count,
    COUNT(CASE WHEN severity = 'medium' THEN 1 END) AS medium_count,
    COUNT(CASE WHEN severity = 'low' THEN 1 END) AS low_count,
    COUNT(DISTINCT cluster_id) FILTER (WHERE cluster_id IS NOT NULL) AS clusters_count,
    AVG(EXTRACT(EPOCH FROM (triaged_at - created_at)) * 1000) FILTER (WHERE triaged_at IS NOT NULL) AS avg_triage_time_ms
FROM triage_items
GROUP BY user_id;

-- Grant access to the view
GRANT SELECT ON triage_stats TO authenticated;

-- Add comments for documentation
COMMENT ON TABLE triage_items IS 'Stores issues, logs, and feedback items for auto-triage processing';
COMMENT ON TABLE triage_clusters IS 'Groups related triage items together for duplicate detection and batch processing';
COMMENT ON COLUMN triage_items.source IS 'Source of the triage item (GitHub, CI, logs, etc.)';
COMMENT ON COLUMN triage_items.severity IS 'Auto-detected or manually assigned severity level';
COMMENT ON COLUMN triage_items.cluster_id IS 'Reference to cluster for duplicate grouping';
COMMENT ON COLUMN triage_items.suggested_owner IS 'AI-suggested agent to handle this item';
COMMENT ON COLUMN triage_items.reproduction_steps IS 'Auto-generated minimal steps to reproduce the issue';
