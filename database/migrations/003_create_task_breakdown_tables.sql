-- Migration: Create task breakdown tables
-- Creates tables for epics, tickets, subtasks, and dependencies

-- =====================
-- EPICS TABLE
-- =====================
CREATE TABLE IF NOT EXISTS epics (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  epic_id TEXT NOT NULL, -- Display ID like "EPIC-1"
  title TEXT NOT NULL,
  description TEXT,
  goals TEXT[] DEFAULT '{}',
  status TEXT NOT NULL DEFAULT 'planning' CHECK (status IN ('planning', 'in-progress', 'review', 'done', 'cancelled')),
  priority INTEGER NOT NULL CHECK (priority >= 1 AND priority <= 5) DEFAULT 3,
  sprint TEXT,
  estimated_effort INTEGER,
  actual_effort INTEGER,
  tags TEXT[] DEFAULT '{}',
  definitions_of_done JSONB DEFAULT '[]'::jsonb,
  risk_flags JSONB DEFAULT '[]'::jsonb,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
  start_date TIMESTAMP WITH TIME ZONE,
  target_date TIMESTAMP WITH TIME ZONE,
  completed_at TIMESTAMP WITH TIME ZONE
);

-- Enable RLS for epics
ALTER TABLE epics ENABLE ROW LEVEL SECURITY;

-- RLS Policies for epics
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

-- Indexes for epics
CREATE INDEX IF NOT EXISTS epics_user_id_idx ON epics(user_id);
CREATE INDEX IF NOT EXISTS epics_status_idx ON epics(status);
CREATE INDEX IF NOT EXISTS epics_definitions_of_done_idx ON epics USING GIN (definitions_of_done);
CREATE INDEX IF NOT EXISTS epics_risk_flags_idx ON epics USING GIN (risk_flags);

-- Trigger for epics updated_at
DROP TRIGGER IF EXISTS update_epics_updated_at ON epics;
CREATE TRIGGER update_epics_updated_at
  BEFORE UPDATE ON epics
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- =====================
-- TICKETS TABLE (extended from tasks)
-- =====================
CREATE TABLE IF NOT EXISTS tickets (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  ticket_id TEXT NOT NULL, -- Display ID like "TICKET-1"
  epic_id UUID REFERENCES epics(id) ON DELETE SET NULL,
  title TEXT NOT NULL,
  description TEXT,
  type TEXT NOT NULL DEFAULT 'task' CHECK (type IN ('feature', 'bug', 'improvement', 'task', 'research')),
  status TEXT NOT NULL DEFAULT 'backlog' CHECK (status IN ('backlog', 'in-progress', 'review', 'done', 'blocked')),
  priority INTEGER NOT NULL CHECK (priority >= 1 AND priority <= 5) DEFAULT 3,
  sprint TEXT,
  assigned_agent_id UUID REFERENCES agents(id) ON DELETE SET NULL,
  estimated_effort INTEGER,
  actual_effort INTEGER,
  tags TEXT[] DEFAULT '{}',
  definitions_of_done JSONB DEFAULT '[]'::jsonb,
  test_notes JSONB DEFAULT '[]'::jsonb,
  risk_flags JSONB DEFAULT '[]'::jsonb,
  acceptance_criteria TEXT[] DEFAULT '{}',
  technical_notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
  start_date TIMESTAMP WITH TIME ZONE,
  due_date TIMESTAMP WITH TIME ZONE,
  completed_at TIMESTAMP WITH TIME ZONE
);

-- Enable RLS for tickets
ALTER TABLE tickets ENABLE ROW LEVEL SECURITY;

-- RLS Policies for tickets
DROP POLICY IF EXISTS "Users can view their own tickets" ON tickets;
CREATE POLICY "Users can view their own tickets" ON tickets
  FOR SELECT USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can insert their own tickets" ON tickets;
CREATE POLICY "Users can insert their own tickets" ON tickets
  FOR INSERT WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can update their own tickets" ON tickets;
CREATE POLICY "Users can update their own tickets" ON tickets
  FOR UPDATE USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can delete their own tickets" ON tickets;
CREATE POLICY "Users can delete their own tickets" ON tickets
  FOR DELETE USING (auth.uid() = user_id);

-- Indexes for tickets
CREATE INDEX IF NOT EXISTS tickets_user_id_idx ON tickets(user_id);
CREATE INDEX IF NOT EXISTS tickets_epic_id_idx ON tickets(epic_id);
CREATE INDEX IF NOT EXISTS tickets_status_idx ON tickets(status);
CREATE INDEX IF NOT EXISTS tickets_assigned_agent_idx ON tickets(assigned_agent_id);
CREATE INDEX IF NOT EXISTS tickets_definitions_of_done_idx ON tickets USING GIN (definitions_of_done);
CREATE INDEX IF NOT EXISTS tickets_test_notes_idx ON tickets USING GIN (test_notes);
CREATE INDEX IF NOT EXISTS tickets_risk_flags_idx ON tickets USING GIN (risk_flags);

-- Trigger for tickets updated_at
DROP TRIGGER IF EXISTS update_tickets_updated_at ON tickets;
CREATE TRIGGER update_tickets_updated_at
  BEFORE UPDATE ON tickets
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- =====================
-- SUBTASKS TABLE
-- =====================
CREATE TABLE IF NOT EXISTS subtasks (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  subtask_id TEXT NOT NULL, -- Display ID like "SUB-1"
  ticket_id UUID REFERENCES tickets(id) ON DELETE CASCADE NOT NULL,
  title TEXT NOT NULL,
  description TEXT,
  status TEXT NOT NULL DEFAULT 'todo' CHECK (status IN ('todo', 'in-progress', 'done')),
  assigned_agent_id UUID REFERENCES agents(id) ON DELETE SET NULL,
  estimated_effort INTEGER,
  actual_effort INTEGER,
  test_notes JSONB DEFAULT '[]'::jsonb,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
  completed_at TIMESTAMP WITH TIME ZONE
);

-- Enable RLS for subtasks
ALTER TABLE subtasks ENABLE ROW LEVEL SECURITY;

-- RLS Policies for subtasks
DROP POLICY IF EXISTS "Users can view their own subtasks" ON subtasks;
CREATE POLICY "Users can view their own subtasks" ON subtasks
  FOR SELECT USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can insert their own subtasks" ON subtasks;
CREATE POLICY "Users can insert their own subtasks" ON subtasks
  FOR INSERT WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can update their own subtasks" ON subtasks;
CREATE POLICY "Users can update their own subtasks" ON subtasks
  FOR UPDATE USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can delete their own subtasks" ON subtasks;
CREATE POLICY "Users can delete their own subtasks" ON subtasks
  FOR DELETE USING (auth.uid() = user_id);

-- Indexes for subtasks
CREATE INDEX IF NOT EXISTS subtasks_user_id_idx ON subtasks(user_id);
CREATE INDEX IF NOT EXISTS subtasks_ticket_id_idx ON subtasks(ticket_id);
CREATE INDEX IF NOT EXISTS subtasks_status_idx ON subtasks(status);
CREATE INDEX IF NOT EXISTS subtasks_assigned_agent_idx ON subtasks(assigned_agent_id);
CREATE INDEX IF NOT EXISTS subtasks_test_notes_idx ON subtasks USING GIN (test_notes);

-- Trigger for subtasks updated_at
DROP TRIGGER IF EXISTS update_subtasks_updated_at ON subtasks;
CREATE TRIGGER update_subtasks_updated_at
  BEFORE UPDATE ON subtasks
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- =====================
-- TASK DEPENDENCIES TABLE
-- =====================
CREATE TABLE IF NOT EXISTS task_dependencies (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  source_task_id UUID NOT NULL, -- The task that blocks/relates to another
  target_task_id UUID NOT NULL, -- The task being blocked/related to
  dependency_type TEXT NOT NULL CHECK (dependency_type IN ('blocks', 'blocked_by', 'relates_to', 'duplicates')),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
  UNIQUE(source_task_id, target_task_id, dependency_type)
);

-- Enable RLS for task_dependencies
ALTER TABLE task_dependencies ENABLE ROW LEVEL SECURITY;

-- RLS Policies for task_dependencies
DROP POLICY IF EXISTS "Users can view their own task dependencies" ON task_dependencies;
CREATE POLICY "Users can view their own task dependencies" ON task_dependencies
  FOR SELECT USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can insert their own task dependencies" ON task_dependencies;
CREATE POLICY "Users can insert their own task dependencies" ON task_dependencies
  FOR INSERT WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can update their own task dependencies" ON task_dependencies;
CREATE POLICY "Users can update their own task dependencies" ON task_dependencies
  FOR UPDATE USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can delete their own task dependencies" ON task_dependencies;
CREATE POLICY "Users can delete their own task dependencies" ON task_dependencies
  FOR DELETE USING (auth.uid() = user_id);

-- Indexes for task_dependencies
CREATE INDEX IF NOT EXISTS task_dependencies_user_id_idx ON task_dependencies(user_id);
CREATE INDEX IF NOT EXISTS task_dependencies_source_idx ON task_dependencies(source_task_id);
CREATE INDEX IF NOT EXISTS task_dependencies_target_idx ON task_dependencies(target_task_id);

-- Grants for all new tables
GRANT ALL ON TABLE epics TO postgres, service_role;
GRANT ALL ON TABLE tickets TO postgres, service_role;
GRANT ALL ON TABLE subtasks TO postgres, service_role;
GRANT ALL ON TABLE task_dependencies TO postgres, service_role;
