-- Migration: Add extended fields for agent orchestration
-- Adds skills, availability, performance, and preferences to agents table

-- Add JSONB columns for extended agent data
DO $$
BEGIN
  -- skills: Array of skill objects with category, name, proficiency, etc.
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'agents' AND column_name = 'skills'
  ) THEN
    ALTER TABLE agents ADD COLUMN skills JSONB DEFAULT '[]'::jsonb;
  END IF;

  -- availability: Status, capacity, task counts, etc.
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'agents' AND column_name = 'availability'
  ) THEN
    ALTER TABLE agents ADD COLUMN availability JSONB DEFAULT '{
      "status": "available",
      "currentCapacity": 100,
      "currentTaskCount": 0,
      "maxConcurrentTasks": 5
    }'::jsonb;
  END IF;

  -- performance: Metrics like success rate, tasks completed, quality score, etc.
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'agents' AND column_name = 'performance'
  ) THEN
    ALTER TABLE agents ADD COLUMN performance JSONB DEFAULT '{
      "tasksCompleted": 0,
      "tasksInProgress": 0,
      "tasksFailed": 0,
      "successRate": 0,
      "qualityScore": 0,
      "onTimeDeliveryRate": 0,
      "averageCompletionTime": 0,
      "totalHoursWorked": 0
    }'::jsonb;
  END IF;

  -- preferences: Task type preferences, complexity limits, etc.
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'agents' AND column_name = 'preferences'
  ) THEN
    ALTER TABLE agents ADD COLUMN preferences JSONB DEFAULT '{
      "preferredTaskTypes": [],
      "maxTaskComplexity": 5,
      "preferredTechnologies": [],
      "workloadPreference": "medium"
    }'::jsonb;
  END IF;

  -- email field
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'agents' AND column_name = 'email'
  ) THEN
    ALTER TABLE agents ADD COLUMN email TEXT;
  END IF;

  -- role field
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'agents' AND column_name = 'role'
  ) THEN
    ALTER TABLE agents ADD COLUMN role TEXT;
  END IF;

  -- team field
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'agents' AND column_name = 'team'
  ) THEN
    ALTER TABLE agents ADD COLUMN team TEXT;
  END IF;

  -- tags field
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'agents' AND column_name = 'tags'
  ) THEN
    ALTER TABLE agents ADD COLUMN tags TEXT[] DEFAULT '{}';
  END IF;

  -- updated_at field
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'agents' AND column_name = 'updated_at'
  ) THEN
    ALTER TABLE agents ADD COLUMN updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL;
  END IF;
END $$;

-- Create indexes for JSONB fields to improve query performance
CREATE INDEX IF NOT EXISTS agents_skills_idx ON agents USING GIN (skills);
CREATE INDEX IF NOT EXISTS agents_availability_idx ON agents USING GIN (availability);
CREATE INDEX IF NOT EXISTS agents_performance_idx ON agents USING GIN (performance);
CREATE INDEX IF NOT EXISTS agents_preferences_idx ON agents USING GIN (preferences);

-- Trigger for agents updated_at
DROP TRIGGER IF EXISTS update_agents_updated_at ON agents;
CREATE TRIGGER update_agents_updated_at
  BEFORE UPDATE ON agents
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- Update existing agents with default values if they're null
UPDATE agents
SET
  skills = COALESCE(skills, '[]'::jsonb),
  availability = COALESCE(availability, '{
    "status": "available",
    "currentCapacity": 100,
    "currentTaskCount": 0,
    "maxConcurrentTasks": 5
  }'::jsonb),
  performance = COALESCE(performance, '{
    "tasksCompleted": 0,
    "tasksInProgress": 0,
    "tasksFailed": 0,
    "successRate": 0,
    "qualityScore": 0,
    "onTimeDeliveryRate": 0,
    "averageCompletionTime": 0,
    "totalHoursWorked": 0
  }'::jsonb),
  preferences = COALESCE(preferences, '{
    "preferredTaskTypes": [],
    "maxTaskComplexity": 5,
    "preferredTechnologies": [],
    "workloadPreference": "medium"
  }'::jsonb);
