# Bug Fix: Issue #7 - Newly added tasks do not appear on the Kanban board

## Problem Description

When users added a new task through the form, the task would not appear in any of the Kanban columns on the website, even though the task was successfully created in the database.

## Root Cause

The issue was caused by the **sprint filter state** in the KanbanBoard component. The board has a sprint filtering feature that allows users to view tasks from specific sprints or all sprints. When a user:

1. Selected a specific sprint filter (e.g., "Sprint 1")
2. Created a new task with a different sprint value (e.g., "Sprint 2" or no sprint)
3. The new task was successfully added to the database
4. **However**, the board only displayed tasks matching the current filter

This meant the newly added task was filtered out and not visible to the user, creating the appearance that the task creation had failed.

## Solution

The fix automatically adjusts the sprint filter after a task is added to ensure the new task is immediately visible:

1. **If the new task has a sprint assigned**: Switch the filter to show that specific sprint
2. **If the new task has no sprint**:
   - If the current filter is "All Sprints", leave it as is (task will be visible)
   - Otherwise, switch to "No Sprint" filter to show the new task

### Code Changes

**File**: `src/components/KanbanBoard.tsx`

**Location**: `handleAdd` function (lines 46-101)

**Changes**:
- Extracted the sprint value to a variable `taskSprint` for reuse
- Added logic after `onAddTask()` completes to update `selectedSprint` state
- The filter update ensures the newly created task matches the current view filter

```typescript
// Update sprint filter to ensure the newly added task is visible
if (taskSprint) {
  // If task has a sprint, switch to that sprint
  setSelectedSprint(taskSprint);
} else {
  // If task has no sprint, switch to "no sprint" filter if not already on "all"
  if (selectedSprint !== 'all') {
    setSelectedSprint('none');
  }
}
```

## Testing

- ✅ TypeScript compilation passes without errors
- ✅ No lint errors introduced
- The fix ensures that:
  - Creating a task with a sprint switches to that sprint view
  - Creating a task without a sprint switches to "No Sprint" view (unless "All Sprints" is selected)
  - Tasks are immediately visible after creation

## User Experience Improvement

This fix provides a better user experience by:
1. Making newly created tasks immediately visible
2. Automatically adjusting the view to show the context of the new task
3. Providing intuitive behavior that matches user expectations

## Related Issues

This fix builds upon previous work:
- Commit 94ddef4: Fixed task creation by memoizing Supabase client
- Commit 66b05f4: Added error handling for task creation
