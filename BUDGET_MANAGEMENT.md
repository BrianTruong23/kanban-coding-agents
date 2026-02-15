# Budget and Resource Management

This document describes the budgeting and resource management system for agent tasks in the Kanban board application.

## Overview

The budget management system allows project managers to track and control resource consumption (cost, tokens, time) for agent tasks. It includes:

- **Budget Creation**: Set limits for cost, tokens, and time per task
- **Real-time Tracking**: Monitor resource usage as agents execute tasks
- **Alerts**: Get notified when budgets approach or exceed limits
- **Budget Enforcement**: Automatically pause tasks when limits are exceeded
- **Retry Management**: Control the number of retry attempts for failed operations
- **PM Dashboard**: Comprehensive view of all budgets and their status

## Features

### 1. Budget Types

Each task budget can track three types of resources:

- **Cost**: Dollar amount spent on API calls, compute resources, etc.
- **Tokens**: Number of tokens consumed by AI models
- **Time**: Minutes spent on task execution

You can set limits for any combination of these resources.

### 2. Budget Status

Budgets can be in one of four states:

- **Active**: Budget is active and task can execute
- **Paused**: Budget is manually paused, task execution blocked
- **Exceeded**: One or more limits exceeded, task automatically paused
- **Completed**: Task finished successfully

### 3. Budget Alerts

The system generates alerts when budgets reach certain thresholds:

- **Warning** (80%): Yellow warning when usage reaches 80% of limit
- **Critical** (95%): Orange alert when usage reaches 95% of limit
- **Exceeded** (100%): Red alert when limit is exceeded

### 4. Retry Management

Control how many times a failed operation can be retried:

- Set maximum retries per task (default: 3)
- Track current retry count
- Automatically pause task when retry limit is reached

## Database Schema

### Tables

#### budgets
```sql
- id: UUID (primary key)
- user_id: UUID (foreign key to auth.users)
- task_id: UUID (foreign key to tasks)
- max_cost: NUMERIC(10,2) - Maximum cost in dollars
- max_tokens: BIGINT - Maximum tokens
- max_time: INTEGER - Maximum time in minutes
- current_cost: NUMERIC(10,2) - Current cost spent
- current_tokens: BIGINT - Current tokens used
- current_time: INTEGER - Current time spent
- max_retries: INTEGER - Maximum retry attempts
- current_retries: INTEGER - Current retry count
- status: TEXT - 'active', 'paused', 'exceeded', 'completed'
- paused_reason: TEXT - Reason for pausing
- created_at: TIMESTAMP
- updated_at: TIMESTAMP
```

#### budget_usage_entries
```sql
- id: UUID (primary key)
- budget_id: UUID (foreign key to budgets)
- task_id: UUID (foreign key to tasks)
- cost_incurred: NUMERIC(10,2) - Cost for this operation
- tokens_used: BIGINT - Tokens for this operation
- time_spent: INTEGER - Time for this operation
- agent_id: UUID (foreign key to agents)
- operation: TEXT - Description of operation
- success: BOOLEAN - Whether operation succeeded
- error_message: TEXT - Error message if failed
- created_at: TIMESTAMP
```

#### budget_alerts
```sql
- id: UUID (primary key)
- budget_id: UUID (foreign key to budgets)
- task_id: UUID (foreign key to tasks)
- alert_type: TEXT - 'warning', 'critical', 'exceeded'
- budget_type: TEXT - 'cost', 'tokens', 'time'
- message: TEXT - Alert message
- threshold: NUMERIC(5,2) - Percentage threshold
- current_usage: NUMERIC(10,2) - Current usage value
- limit_value: NUMERIC(10,2) - Limit value
- acknowledged: BOOLEAN - Whether alert was acknowledged
- created_at: TIMESTAMP
```

## Setup Instructions

### 1. Database Migration

Run the budget schema SQL in your Supabase SQL Editor:

```bash
# Located in: database/budget_schema.sql
```

This creates:
- Budget tables with Row Level Security (RLS) policies
- Indexes for optimized queries
- Triggers for automatic budget updates
- Alert generation functions

### 2. Using the Budget Manager

#### Access the Budget View

1. Navigate to the main application
2. Click the "Budget" tab in the header (next to "Kanban")
3. You'll see the Budget Manager dashboard

#### Create a Budget

1. Click "New Budget" button
2. Select a task from the dropdown
3. Set budget limits (at least one required):
   - Max Cost (in dollars)
   - Max Tokens
   - Max Time (in minutes)
   - Max Retries (default: 3)
4. Click "Create Budget"

#### Monitor Budgets

The Budget Manager shows:
- Summary cards with total allocated and spent resources
- Active, paused, and exceeded budget counts
- Unacknowledged alerts section
- List of all budgets with progress bars

#### Manage Budgets

- **Pause**: Click pause icon to manually pause a budget
- **Resume**: Click play icon to resume a paused budget
- **Acknowledge Alerts**: Click checkmark on alerts to mark as read

### 3. Budget Enforcement

The system automatically enforces budgets through database triggers:

```typescript
// When adding usage, budget is automatically updated
await addUsageEntry({
  budgetId: budget.id,
  taskId: task.id,
  costIncurred: 0.05,
  tokensUsed: 500,
  timeSpent: 2,
  operation: 'AI model inference',
  success: true,
});

// Budget status automatically changes to 'exceeded' if limits are breached
// Alerts are automatically generated at 80%, 95%, and 100% thresholds
```

### 4. Budget Enforcement in Application Code

Use the budget enforcement utilities:

```typescript
import { checkBudgetAllowance } from '@/lib/budgetEnforcement';

// Before executing an agent task
const check = checkBudgetAllowance(
  budget,
  estimatedCost,
  estimatedTokens,
  estimatedTime
);

if (!check.allowed) {
  console.error('Task blocked:', check.reason);
  // Handle budget exceeded scenario
  return;
}

// Show warnings if approaching limits
check.warnings.forEach(warning => {
  console.warn(warning.message);
});

// Execute task...
```

## API Reference

### Hooks

#### useBudgets()

```typescript
const {
  budgets,           // Array of all budgets
  usageEntries,      // Array of usage history
  alerts,            // Array of budget alerts
  isLoaded,          // Loading state
  createBudget,      // Create new budget
  updateBudget,      // Update existing budget
  deleteBudget,      // Delete budget
  addUsageEntry,     // Add usage entry (triggers budget update)
  acknowledgeAlert,  // Mark alert as acknowledged
  pauseBudget,       // Pause budget with reason
  resumeBudget,      // Resume paused budget
  getBudgetSummary,  // Get summary statistics
} = useBudgets();
```

### Utility Functions

#### checkBudgetAllowance()
```typescript
const result = checkBudgetAllowance(
  budget: Budget,
  estimatedCost?: number,
  estimatedTokens?: number,
  estimatedTime?: number
): BudgetCheckResult
```

#### calculateRemainingBudget()
```typescript
const remaining = calculateRemainingBudget(budget: Budget)
// Returns: { remainingCost, remainingTokens, remainingTime, remainingRetries }
```

#### estimateCostFromTokens()
```typescript
const cost = estimateCostFromTokens(
  tokens: number,
  model: string = 'gpt-4'
): number
```

#### validateBudgetConfig()
```typescript
const validation = validateBudgetConfig(budget: Partial<Budget>)
// Returns: { valid: boolean, errors: string[] }
```

## Components

### BudgetManager
Main PM dashboard for budget management.

### TaskBudgetIndicator
Shows budget status on individual task cards.

### BudgetSimulator
Testing tool to simulate agent execution and budget consumption.

## Best Practices

1. **Set Realistic Limits**: Base limits on historical data or conservative estimates
2. **Monitor Regularly**: Check the Budget Manager dashboard frequently
3. **Acknowledge Alerts**: Review and acknowledge alerts to track what you've seen
4. **Use Warnings**: Pay attention to 80% warnings to take action before exceeding
5. **Document Operations**: Provide clear operation descriptions in usage entries
6. **Track Failures**: Set success=false for failed operations to track retries
7. **Adjust as Needed**: Update budget limits based on actual usage patterns

## Example Workflow

```typescript
// 1. Create a budget for a task
const budget = await createBudget({
  taskId: task.id,
  maxCost: 10.00,      // $10
  maxTokens: 100000,   // 100K tokens
  maxTime: 60,         // 60 minutes
  maxRetries: 3,
  currentCost: 0,
  currentTokens: 0,
  currentTime: 0,
  currentRetries: 0,
  status: 'active',
});

// 2. Before executing agent task, check budget
const check = checkBudgetAllowance(budget, 0.5, 1000, 5);
if (!check.allowed) {
  throw new Error(`Budget check failed: ${check.reason}`);
}

// 3. Execute agent task (your implementation)
const result = await executeAgentTask(task);

// 4. Record usage
await addUsageEntry({
  budgetId: budget.id,
  taskId: task.id,
  costIncurred: result.cost,
  tokensUsed: result.tokens,
  timeSpent: result.duration,
  agentId: task.assignedAgentId,
  operation: 'Code generation with GPT-4',
  success: result.success,
  errorMessage: result.error,
});

// 5. Budget is automatically updated, alerts generated if needed
```

## Troubleshooting

### Budget not updating
- Check that usage entries are being created successfully
- Verify database triggers are active
- Check browser console for errors

### Alerts not appearing
- Ensure budget limits are set
- Verify usage has crossed threshold (80%, 95%, or 100%)
- Check that alerts table has RLS policies configured

### Task execution blocked unexpectedly
- Check budget status (may be paused or exceeded)
- Review retry count vs. max retries
- Look at recent alerts for the task

## Future Enhancements

Potential improvements to the budget system:

- Real-time budget notifications via WebSocket
- Budget templates for common task types
- Historical budget analytics and reporting
- Budget pooling across multiple tasks
- Automatic budget optimization based on usage patterns
- Integration with actual AI API cost tracking
- Budget forecasting and predictions

## Support

For issues or questions about the budget system:
1. Check this documentation
2. Review the code in `src/hooks/useBudgets.ts` and `src/lib/budgetEnforcement.ts`
3. Check database schema in `database/budget_schema.sql`
4. Open an issue on GitHub
