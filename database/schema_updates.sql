-- Database Schema Updates for Task Breakdown and Agent Orchestration
-- Run this SQL in your Supabase SQL Editor after the main schema

-- =====================
-- UPDATE AGENTS TABLE (Add Skills and Performance)
-- =====================

-- Add new columns to agents table
DO $$
BEGIN
  -- skills array
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'agents' AND column_name = 'skills') THEN
    ALTER TABLE agents ADD COLUMN skills text[] DEFAULT '{}';
  END IF;

  -- is_active flag
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'agents' AND column_name = 'is_active') THEN
    ALTER TABLE agents ADD COLUMN is_active boolean DEFAULT true;
  END IF;

  -- max_concurrent_tasks
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'agents' AND column_name = 'max_concurrent_tasks') THEN
    ALTER TABLE agents ADD COLUMN max_concurrent_tasks integer DEFAULT 5;
  END IF;

  -- Performance metrics (stored as JSONB for flexibility)
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'agents' AND column_name = 'performance_metrics') THEN
    ALTER TABLE agents ADD COLUMN performance_metrics jsonb DEFAULT '{
      "tasksCompleted": 0,
      "averageCompletionTime": 0,
      "successRate": 100,
      "currentWorkload": 0,
      "skillRatings": {}
    }'::jsonb;
  END IF;
END $$;

-- Update existing default agents with skills
UPDATE agents
SET skills = CASE
  WHEN name = 'Alex Chen' THEN ARRAY['frontend', 'ui-ux', 'fullstack']
  WHEN name = 'Sarah Johnson' THEN ARRAY['backend', 'api', 'database']
  WHEN name = 'Mike Rodriguez' THEN ARRAY['fullstack', 'frontend', 'backend']
  WHEN name = 'Emma Wilson' THEN ARRAY['devops', 'backend', 'security']
  WHEN name = 'David Kim' THEN ARRAY['mobile', 'frontend', 'api']
  ELSE skills
END
WHERE skills = '{}' OR skills IS NULL;

-- =====================
-- EPICS TABLE
-- =====================
CREATE TABLE IF NOT EXISTS epics (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  epic_id text NOT NULL, -- Display ID like "EPIC-1"
  title text NOT NULL,
  description text,
  status text NOT NULL DEFAULT 'planning',
  start_date timestamp with time zone,
  end_date timestamp with time zone,
  progress integer DEFAULT 0 CHECK (progress >= 0 AND progress <= 100),
  created_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL,
  updated_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Status constraint for epics
ALTER TABLE epics DROP CONSTRAINT IF EXISTS epics_status_check;
ALTER TABLE epics ADD CONSTRAINT epics_status_check CHECK (status IN ('planning', 'active', 'completed', 'cancelled'));

-- Enable RLS
ALTER TABLE epics ENABLE ROW LEVEL SECURITY;

-- Grants
GRANT ALL ON TABLE epics TO postgres, service_role;

-- RLS Policies
DROP POLICY IF EXISTS "Users can view their own epics" ON epics;
CREATE POLICY "Users can view their own epics" ON epics
  FOR SELECT USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can insert their own epics" ON epics;
CREATE POLICY "Users can insert their own epics" ON epics
  FOR INSERT WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can update their own epics" ON epics;
CREATE POLICY "Users can update their own epics" ON epics
  FOR UPDATE USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can delete their own epics" ON epics;
CREATE POLICY "Users can delete their own epics" ON epics
  FOR DELETE USING (auth.uid() = user_id);

-- Indexes
CREATE INDEX IF NOT EXISTS epics_user_id_idx ON epics(user_id);
CREATE INDEX IF NOT EXISTS epics_status_idx ON epics(status);

-- Auto-update trigger
DROP TRIGGER IF EXISTS update_epics_updated_at ON epics;
CREATE TRIGGER update_epics_updated_at
  BEFORE UPDATE ON epics
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- =====================
-- TASK-EPIC RELATIONSHIP TABLE
-- =====================
CREATE TABLE IF NOT EXISTS task_epics (
  task_id uuid REFERENCES tasks(id) ON DELETE CASCADE NOT NULL,
  epic_id uuid REFERENCES epics(id) ON DELETE CASCADE NOT NULL,
  created_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL,
  PRIMARY KEY (task_id, epic_id)
);

-- Enable RLS
ALTER TABLE task_epics ENABLE ROW LEVEL SECURITY;

-- Grants
GRANT ALL ON TABLE task_epics TO postgres, service_role;

-- RLS Policies (inherit from tasks/epics)
DROP POLICY IF EXISTS "Users can manage their task-epic relationships" ON task_epics;
CREATE POLICY "Users can manage their task-epic relationships" ON task_epics
  FOR ALL USING (
    EXISTS (SELECT 1 FROM tasks WHERE tasks.id = task_epics.task_id AND tasks.user_id = auth.uid())
  );

-- =====================
-- SUBTASKS TABLE
-- =====================
CREATE TABLE IF NOT EXISTS subtasks (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  parent_task_id uuid REFERENCES tasks(id) ON DELETE CASCADE NOT NULL,
  title text NOT NULL,
  description text,
  completed boolean DEFAULT false,
  assigned_agent_id uuid REFERENCES agents(id) ON DELETE SET NULL,
  estimated_hours numeric(5, 2),
  actual_hours numeric(5, 2),
  created_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL,
  updated_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Enable RLS
ALTER TABLE subtasks ENABLE ROW LEVEL SECURITY;

-- Grants
GRANT ALL ON TABLE subtasks TO postgres, service_role;

-- RLS Policies
DROP POLICY IF EXISTS "Users can manage their subtasks" ON subtasks;
CREATE POLICY "Users can manage their subtasks" ON subtasks
  FOR ALL USING (
    EXISTS (SELECT 1 FROM tasks WHERE tasks.id = subtasks.parent_task_id AND tasks.user_id = auth.uid())
  );

-- Indexes
CREATE INDEX IF NOT EXISTS subtasks_parent_task_idx ON subtasks(parent_task_id);
CREATE INDEX IF NOT EXISTS subtasks_assigned_agent_idx ON subtasks(assigned_agent_id);

-- Auto-update trigger
DROP TRIGGER IF EXISTS update_subtasks_updated_at ON subtasks;
CREATE TRIGGER update_subtasks_updated_at
  BEFORE UPDATE ON subtasks
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- =====================
-- TASK DEPENDENCIES TABLE
-- =====================
CREATE TABLE IF NOT EXISTS task_dependencies (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  source_task_id uuid REFERENCES tasks(id) ON DELETE CASCADE NOT NULL,
  target_task_id uuid REFERENCES tasks(id) ON DELETE CASCADE NOT NULL,
  dependency_type text NOT NULL,
  created_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Type constraint
ALTER TABLE task_dependencies DROP CONSTRAINT IF EXISTS task_dependencies_type_check;
ALTER TABLE task_dependencies ADD CONSTRAINT task_dependencies_type_check
  CHECK (dependency_type IN ('blocks', 'blocked-by', 'relates-to'));

-- Prevent self-dependencies
ALTER TABLE task_dependencies DROP CONSTRAINT IF EXISTS task_dependencies_no_self;
ALTER TABLE task_dependencies ADD CONSTRAINT task_dependencies_no_self
  CHECK (source_task_id != target_task_id);

-- Enable RLS
ALTER TABLE task_dependencies ENABLE ROW LEVEL SECURITY;

-- Grants
GRANT ALL ON TABLE task_dependencies TO postgres, service_role;

-- RLS Policies
DROP POLICY IF EXISTS "Users can manage their task dependencies" ON task_dependencies;
CREATE POLICY "Users can manage their task dependencies" ON task_dependencies
  FOR ALL USING (
    EXISTS (SELECT 1 FROM tasks WHERE tasks.id = task_dependencies.source_task_id AND tasks.user_id = auth.uid())
    OR EXISTS (SELECT 1 FROM tasks WHERE tasks.id = task_dependencies.target_task_id AND tasks.user_id = auth.uid())
  );

-- Indexes
CREATE INDEX IF NOT EXISTS task_dependencies_source_idx ON task_dependencies(source_task_id);
CREATE INDEX IF NOT EXISTS task_dependencies_target_idx ON task_dependencies(target_task_id);

-- =====================
-- TASK METADATA TABLE (DoD, Test Notes, Risk Flags)
-- =====================
CREATE TABLE IF NOT EXISTS task_metadata (
  task_id uuid PRIMARY KEY REFERENCES tasks(id) ON DELETE CASCADE,
  definition_of_done jsonb DEFAULT '{"criteria": []}'::jsonb,
  test_notes jsonb DEFAULT '[]'::jsonb,
  risk_flags jsonb DEFAULT '[]'::jsonb,
  created_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL,
  updated_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Enable RLS
ALTER TABLE task_metadata ENABLE ROW LEVEL SECURITY;

-- Grants
GRANT ALL ON TABLE task_metadata TO postgres, service_role;

-- RLS Policies
DROP POLICY IF EXISTS "Users can manage their task metadata" ON task_metadata;
CREATE POLICY "Users can manage their task metadata" ON task_metadata
  FOR ALL USING (
    EXISTS (SELECT 1 FROM tasks WHERE tasks.id = task_metadata.task_id AND tasks.user_id = auth.uid())
  );

-- Auto-update trigger
DROP TRIGGER IF EXISTS update_task_metadata_updated_at ON task_metadata;
CREATE TRIGGER update_task_metadata_updated_at
  BEFORE UPDATE ON task_metadata
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- =====================
-- ADD SPRINT COLUMN TO TASKS (if not exists)
-- =====================
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'tasks' AND column_name = 'sprint') THEN
    ALTER TABLE tasks ADD COLUMN sprint text;
  END IF;
END $$;

CREATE INDEX IF NOT EXISTS tasks_sprint_idx ON tasks(sprint);

-- =====================
-- HELPER FUNCTION: Update Epic Progress
-- =====================
CREATE OR REPLACE FUNCTION update_epic_progress()
RETURNS TRIGGER AS $$
DECLARE
  epic_record RECORD;
  total_tasks INTEGER;
  completed_tasks INTEGER;
  new_progress INTEGER;
BEGIN
  -- Find all epics related to this task
  FOR epic_record IN
    SELECT DISTINCT e.id
    FROM epics e
    JOIN task_epics te ON te.epic_id = e.id
    WHERE te.task_id = NEW.id OR te.task_id = OLD.id
  LOOP
    -- Count total and completed tasks for this epic
    SELECT COUNT(*), COUNT(*) FILTER (WHERE t.status = 'done')
    INTO total_tasks, completed_tasks
    FROM tasks t
    JOIN task_epics te ON te.task_id = t.id
    WHERE te.epic_id = epic_record.id;

    -- Calculate progress
    IF total_tasks > 0 THEN
      new_progress := (completed_tasks * 100) / total_tasks;
    ELSE
      new_progress := 0;
    END IF;

    -- Update epic progress
    UPDATE epics
    SET progress = new_progress,
        updated_at = timezone('utc'::text, now())
    WHERE id = epic_record.id;
  END LOOP;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger to auto-update epic progress when task status changes
DROP TRIGGER IF EXISTS task_status_update_epic_progress ON tasks;
CREATE TRIGGER task_status_update_epic_progress
  AFTER UPDATE OF status ON tasks
  FOR EACH ROW
  EXECUTE FUNCTION update_epic_progress();

-- =====================
-- HELPER FUNCTION: Update Agent Workload
-- =====================
CREATE OR REPLACE FUNCTION update_agent_workload()
RETURNS TRIGGER AS $$
DECLARE
  agent_id_to_update uuid;
  current_workload INTEGER;
BEGIN
  -- Determine which agent(s) to update
  IF TG_OP = 'INSERT' THEN
    agent_id_to_update := NEW.assigned_agent_id;
  ELSIF TG_OP = 'UPDATE' THEN
    -- Update both old and new agents if assignment changed
    IF OLD.assigned_agent_id IS DISTINCT FROM NEW.assigned_agent_id THEN
      -- Update old agent
      IF OLD.assigned_agent_id IS NOT NULL THEN
        SELECT COUNT(*) INTO current_workload
        FROM tasks
        WHERE assigned_agent_id = OLD.assigned_agent_id
          AND status IN ('backlog', 'in-progress', 'review');

        UPDATE agents
        SET performance_metrics = jsonb_set(
          performance_metrics,
          '{currentWorkload}',
          to_jsonb(current_workload)
        )
        WHERE id = OLD.assigned_agent_id;
      END IF;

      agent_id_to_update := NEW.assigned_agent_id;
    ELSIF OLD.status IS DISTINCT FROM NEW.status THEN
      agent_id_to_update := NEW.assigned_agent_id;
    END IF;
  ELSIF TG_OP = 'DELETE' THEN
    agent_id_to_update := OLD.assigned_agent_id;
  END IF;

  -- Update the agent's workload
  IF agent_id_to_update IS NOT NULL THEN
    SELECT COUNT(*) INTO current_workload
    FROM tasks
    WHERE assigned_agent_id = agent_id_to_update
      AND status IN ('backlog', 'in-progress', 'review');

    UPDATE agents
    SET performance_metrics = jsonb_set(
      performance_metrics,
      '{currentWorkload}',
      to_jsonb(current_workload)
    )
    WHERE id = agent_id_to_update;
  END IF;

  IF TG_OP = 'DELETE' THEN
    RETURN OLD;
  ELSE
    RETURN NEW;
  END IF;
END;
$$ LANGUAGE plpgsql;

-- Triggers to auto-update agent workload
DROP TRIGGER IF EXISTS task_assignment_update_workload ON tasks;
CREATE TRIGGER task_assignment_update_workload
  AFTER INSERT OR UPDATE OR DELETE ON tasks
  FOR EACH ROW
  EXECUTE FUNCTION update_agent_workload();

-- =====================
-- UPDATE DEFAULT AGENTS FUNCTION
-- =====================
DROP FUNCTION IF EXISTS create_default_agents() CASCADE;

CREATE OR REPLACE FUNCTION create_default_agents()
RETURNS TRIGGER
SECURITY DEFINER
SET search_path = public
LANGUAGE plpgsql
AS $$
BEGIN
  INSERT INTO agents (user_id, name, description, avatar_color, skills, is_active, max_concurrent_tasks) VALUES
    (NEW.id, 'Alex Chen', 'Specializes in React, Next.js, and UI development', 'bg-blue-500', ARRAY['frontend', 'ui-ux', 'fullstack'], true, 5),
    (NEW.id, 'Sarah Johnson', 'Handles API, database, and server-side logic', 'bg-green-500', ARRAY['backend', 'api', 'database'], true, 5),
    (NEW.id, 'Mike Rodriguez', 'Works on both frontend and backend tasks', 'bg-purple-500', ARRAY['fullstack', 'frontend', 'backend'], true, 5),
    (NEW.id, 'Emma Wilson', 'DevOps and infrastructure specialist', 'bg-orange-500', ARRAY['devops', 'backend', 'security'], true, 4),
    (NEW.id, 'David Kim', 'Mobile app development expert', 'bg-pink-500', ARRAY['mobile', 'frontend', 'api'], true, 4);
  RETURN NEW;
EXCEPTION
  WHEN OTHERS THEN
    RAISE NOTICE 'Error creating agents: %', SQLERRM;
    RETURN NEW;
END;
$$;

-- Recreate the trigger
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION create_default_agents();
