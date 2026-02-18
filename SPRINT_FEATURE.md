# Sprint Category Feature

## Overview

The sprint category feature allows users to organize and track tasks across different development sprints. Tasks can be assigned to specific sprints, and the kanban board can be filtered to display only tasks from a selected sprint.

## Features Implemented

### 1. Type Definitions
- Added optional `sprint?: string` field to the `Task` interface in `src/types/task.ts`
- Supports backward compatibility - existing tasks without sprint values continue to work

### 2. Database Schema
- Added `sprint text` column to the `tasks` table in `database/schema.sql`
- Included migration logic to add the column to existing databases
- Added index `tasks_sprint_idx` for optimized sprint filtering queries
- Sprint field is nullable to maintain backward compatibility

### 3. User Interface

#### Task Creation/Editing
- Added "Sprint" input field in the task creation modal (`src/components/KanbanBoard.tsx`)
- Users can optionally assign a sprint name when creating tasks
- Sprint input is a free-form text field allowing flexible naming (e.g., "Sprint 12", "Q1 2024", "MVP")

#### Task Display
- Sprint badges appear on task cards (`src/components/TaskItem.tsx`)
- Badges are styled with amber/yellow colors to stand out
- Sprint names are displayed in uppercase for consistency
- Only tasks with assigned sprints show the badge

#### Sprint Filtering
- Sprint dropdown filter in the kanban board header
- Filter options:
  - **All Sprints**: Shows all tasks (default)
  - **No Sprint**: Shows only unassigned tasks
  - **Individual Sprints**: Dynamically generated from existing task sprints
- Filter state managed in component state (`selectedSprint`)
- Real-time filtering updates the board display

### 4. Data Layer
- `useTasks` hook (`src/hooks/useTasks.ts`) handles sprint field in database operations:
  - Maps `sprint` column from database to Task interface
  - Handles null/empty sprint values gracefully
  - Includes sprint in insert and update operations

## User Experience

### Creating a Task with Sprint
1. Click "New Task" button
2. Fill in required fields (Title)
3. Optionally enter a sprint name in the "Sprint" field
4. Click "Add Task"
5. Task appears with a sprint badge

### Filtering by Sprint
1. Click the "Sprint" dropdown in the toolbar
2. Select desired sprint or "All Sprints"/"No Sprint"
3. Board updates to show only matching tasks
4. Column counts update to reflect filtered tasks

### Sprint Badge Display
- Sprint badges appear next to the Task ID on each card
- Color: Amber background with darker amber text
- Format: Uppercase sprint name
- Only visible when sprint is assigned

## Technical Details

### Database Migration
The schema includes an idempotent migration that adds the sprint column if it doesn't exist:

```sql
-- sprint
if not exists (select 1 from information_schema.columns where table_name = 'tasks' and column_name = 'sprint') then
  alter table tasks add column sprint text;
end if;
```

This allows the schema to be run multiple times safely.

### Data Flow
1. User enters sprint name in form → stored in component state
2. On submit → sent to `addTask` function in `useTasks` hook
3. Hook inserts into Supabase with sprint field
4. Database stores sprint value (or null if empty)
5. On fetch → database returns tasks with sprint data
6. Hook maps database format to Task interface
7. Component displays sprint badges and filters accordingly

### Performance Optimization
- Database index on sprint column for fast filtering
- Client-side filtering using JavaScript array methods
- Memoized Supabase client to avoid re-initialization

## Backward Compatibility

The implementation maintains full backward compatibility:
- Existing tasks without sprint values display normally (no badge)
- Sprint field is optional in all operations
- Database column is nullable
- UI handles undefined/null sprint values gracefully
- Filter includes "No Sprint" option for unassigned tasks

## Future Enhancements

Potential improvements that could be added:
1. Sprint autocomplete based on existing sprint names
2. Sprint management UI (create, edit, archive sprints)
3. Sprint statistics view (completion rates, velocity)
4. Date ranges for sprints
5. Sprint-based grouping/sections on the board
6. Sprint planning view
7. Bulk task sprint assignment
8. Sprint templates

## Testing Recommendations

When testing the sprint feature:
1. Create tasks with and without sprint assignments
2. Verify sprint badges appear correctly
3. Test filtering with multiple sprints
4. Ensure "All Sprints" shows everything
5. Verify "No Sprint" filter shows only unassigned tasks
6. Test that existing tasks continue to work
7. Verify sprint data persists across page refreshes
8. Test with empty/whitespace-only sprint names

## Database Setup

To apply the sprint feature to an existing Supabase database:

1. Open your Supabase project SQL Editor
2. Run the updated `database/schema.sql` file
3. The migration will automatically add the sprint column if needed
4. Existing tasks will have null sprint values (compatible with the UI)

No data migration is required for existing tasks.
