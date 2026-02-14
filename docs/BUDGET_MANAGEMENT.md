# Budget and Resource Management System

## Overview

The Budget and Resource Management System provides comprehensive tracking and control of resources consumed by agent tasks. It allows project managers to set budgets, monitor usage in real-time, and enforce limits to prevent runaway costs.

## Features

### 1. Multi-Dimensional Budget Tracking

Track multiple resource types for each task:

- **Tokens**: Monitor LLM token consumption (input + output)
- **Cost**: Track actual dollar costs based on model pricing
- **Time**: Measure execution time in milliseconds
- **Retries**: Count retry attempts
- **API Calls**: Track number of API requests
- **File Operations**: Monitor file system operations

### 2. Configurable Limits

Set limits for any combination of resources:

```typescript
const budget: BudgetLimit = {
  tokens: 100_000,      // 100K tokens max
  cost: 5.0,            // $5 max
  time: 3600000,        // 1 hour max (in ms)
  retries: 3,           // 3 retry attempts max
};
```

### 3. Warning Thresholds

Configure warning alerts at custom percentages:

```typescript
const warningThresholds = {
  tokens: 80,  // Alert at 80% token usage
  cost: 80,    // Alert at 80% cost usage
  time: 80,    // Alert at 80% time usage
};
```

### 4. Automatic Actions

- **Auto-Pause**: Automatically pause tasks when budgets are exceeded
- **Alert Generation**: System generates alerts at warning thresholds and when limits are exceeded
- **Status Updates**: Budget status automatically updates based on usage

### 5. Budget States

Budgets can be in one of five states:

- `active`: Budget is active and task can proceed
- `paused`: Budget is manually paused
- `exceeded`: Budget limit exceeded (auto-paused if enabled)
- `completed`: Task completed, budget finalized
- `cancelled`: Budget cancelled

### 6. PM Dashboard

The PM Dashboard (`/budget-pm`) provides:

- **Overview Metrics**: Total spend, tokens, time, and alerts
- **Budget Statistics**: Active, paused, exceeded, and completed budgets
- **Efficiency Metrics**: Average cost/tokens/time per completed task
- **Detailed Budget View**: Expandable budget monitors for each task
- **Filtering**: Filter by status, task, or agent
- **Budget Controls**: Pause, resume, and cancel budgets

## Usage

### Creating a Budget

#### From Code

```typescript
import { useBudgets } from '@/hooks/useBudgets';
import { createDefaultBudget } from '@/lib/budget-tracker';

const { createBudget } = useBudgets();

// Create with defaults
const defaultBudget = createDefaultBudget(taskId, agentId);
await createBudget(defaultBudget);

// Create with custom limits
await createBudget({
  taskId: 'task-123',
  agentId: 'agent-456',
  status: 'active',
  limits: {
    tokens: 50_000,
    cost: 2.5,
    time: 1800000, // 30 minutes
    retries: 5,
  },
  usage: {
    tokens: 0,
    cost: 0,
    time: 0,
    retries: 0,
    apiCalls: 0,
    fileOperations: 0,
  },
  alerts: [],
  warningThresholds: {
    tokens: 75,
    cost: 75,
    time: 75,
  },
  autoActionsEnabled: true,
  autoPauseOnExceed: true,
});
```

#### From UI

Use the `BudgetCreator` component:

```tsx
import { BudgetCreator } from '@/components/BudgetCreator';

<BudgetCreator
  task={task}
  onCreateBudget={async (taskId, agentId, limits) => {
    await createBudget({
      ...createDefaultBudget(taskId, agentId),
      limits,
    });
  }}
/>
```

### Updating Usage

```typescript
import { updateBudget } from '@/hooks/useBudgets';
import { updateUsage } from '@/lib/budget-tracker';

// Update budget with new resource consumption
const newUsage = updateUsage(budget.usage, {
  tokens: 1500,      // Add 1500 tokens
  cost: 0.045,       // Add $0.045
  time: 5000,        // Add 5 seconds
  apiCalls: 1,       // Increment API calls
});

await updateBudget(budgetId, { usage: newUsage });
```

### Monitoring Budget Status

```typescript
import { BudgetMonitor } from '@/components/BudgetMonitor';

<BudgetMonitor
  budget={budget}
  onPause={pauseBudget}
  onResume={resumeBudget}
  onCancel={cancelBudget}
  compact={false}  // Set to true for compact view
/>
```

### Calculating Costs

```typescript
import { calculateCost, TOKEN_COSTS } from '@/lib/budget-tracker';

// Calculate cost for Claude 3 Sonnet
const cost = calculateCost(
  inputTokens,
  outputTokens,
  'claude-3-sonnet'
);

// Get pricing for a specific model
const pricing = TOKEN_COSTS['gpt-4'];
console.log(`Input: $${pricing.input}/token`);
console.log(`Output: $${pricing.output}/token`);
```

### Budget Metrics

```typescript
import { calculateBudgetMetrics } from '@/lib/budget-tracker';

const metrics = calculateBudgetMetrics(budgets);

console.log('Total Budgeted:', metrics.totalBudgeted);
console.log('Total Used:', metrics.totalUsed);
console.log('Percentage Used:', metrics.percentageUsed);
console.log('Efficiency:', metrics.efficiency);
console.log('Projected Completion:', metrics.projectedCompletion);
```

## Database Schema

### task_budgets Table

```sql
create table task_budgets (
  id uuid primary key,
  user_id uuid references auth.users(id),
  task_id uuid references tasks(id),
  agent_id uuid references agents(id),
  status text,
  limits jsonb,
  usage jsonb,
  warning_thresholds jsonb,
  auto_actions_enabled boolean,
  auto_pause_on_exceed boolean,
  created_at timestamp,
  updated_at timestamp,
  paused_at timestamp,
  resumed_at timestamp,
  completed_at timestamp
);
```

### budget_alerts Table

```sql
create table budget_alerts (
  id uuid primary key,
  user_id uuid references auth.users(id),
  budget_id uuid references task_budgets(id),
  timestamp timestamp,
  type text,  -- 'warning', 'critical', 'exceeded'
  resource_type text,  -- 'tokens', 'cost', 'time', 'retries'
  message text,
  threshold numeric,
  current_usage numeric,
  limit_value numeric,
  acknowledged boolean,
  acknowledged_at timestamp
);
```

### budget_history Table

```sql
create table budget_history (
  id uuid primary key,
  user_id uuid references auth.users(id),
  budget_id uuid references task_budgets(id),
  timestamp timestamp,
  action text,  -- 'created', 'updated', 'paused', 'resumed', 'exceeded', 'completed', 'cancelled'
  resource_snapshot jsonb,
  triggered_by text,  -- 'user', 'system', 'auto'
  notes text
);
```

## Automatic Budget Enforcement

The system includes database triggers that automatically:

1. **Check Budget Limits**: When usage is updated, compare against limits
2. **Generate Alerts**: Create alerts when thresholds are reached
3. **Auto-Pause Tasks**: If `auto_pause_on_exceed` is enabled, pause the budget when exceeded
4. **Log History**: Track all budget state changes

### Trigger Examples

```sql
-- Check budget limits on update
create trigger check_budget_limits_trigger
  before update on task_budgets
  for each row
  when (old.usage is distinct from new.usage)
  execute function check_budget_limits();

-- Log budget history
create trigger log_budget_history_trigger
  after insert or update on task_budgets
  for each row
  execute function log_budget_history();
```

## API Integration Example

When integrating with AI agents, track usage like this:

```typescript
// Before API call
const startTime = Date.now();

// Make API call
const response = await llmClient.complete({
  messages,
  model: 'claude-3-sonnet',
});

// After API call
const duration = Date.now() - startTime;
const inputTokens = response.usage.input_tokens;
const outputTokens = response.usage.output_tokens;
const totalTokens = inputTokens + outputTokens;
const cost = calculateCost(inputTokens, outputTokens, 'claude-3-sonnet');

// Update budget
const newUsage = updateUsage(budget.usage, {
  tokens: totalTokens,
  cost: cost,
  time: duration,
  apiCalls: 1,
});

await updateBudget(budget.id, { usage: newUsage });

// Check if exceeded
if (hasExceededLimit(newUsage, budget.limits)) {
  if (budget.autoPauseOnExceed) {
    console.log('Budget exceeded, task paused');
    // Handle pause logic
  }
}
```

## Best Practices

1. **Set Realistic Limits**: Base limits on historical data and task complexity
2. **Use Warning Thresholds**: Set warnings at 75-80% to get early alerts
3. **Enable Auto-Pause**: Prevent runaway costs by enabling auto-pause
4. **Monitor the Dashboard**: Regularly check the PM Dashboard for insights
5. **Track Efficiency**: Use efficiency metrics to optimize future budgets
6. **Review Alerts**: Acknowledge and review alerts to understand usage patterns
7. **Adjust as Needed**: Update budgets based on actual usage patterns

## Extending the System

### Adding New Resource Types

1. Add to `ResourceUsage` type in `src/types/budget.ts`
2. Update database schema to track the new resource
3. Modify `updateUsage` function to handle the new type
4. Add UI components to display and configure the new resource

### Custom Alert Rules

Extend the `check_budget_limits()` database function to add custom alert logic:

```sql
-- Example: Alert when cost per token is too high
if (usage_cost / usage_tokens) > 0.0001 then
  insert into budget_alerts (...)
  values (..., 'warning', 'efficiency', 'Cost per token is high', ...);
end if;
```

### Integration with External Systems

Use webhooks or event listeners to integrate with:

- **Slack**: Send notifications when budgets are exceeded
- **PagerDuty**: Create incidents for critical budget alerts
- **Analytics**: Send metrics to Datadog, New Relic, etc.
- **Billing Systems**: Sync costs with internal billing

## Troubleshooting

### Budget Not Updating

- Check that `updateBudget` is being called correctly
- Verify database triggers are enabled
- Check RLS policies allow the update

### Alerts Not Generating

- Ensure warning thresholds are properly configured
- Verify the `check_budget_limits()` trigger is firing
- Check that usage is actually being incremented

### Auto-Pause Not Working

- Confirm `autoPauseOnExceed` is set to `true`
- Check that limits are properly configured
- Verify the trigger has permission to update status

## Performance Considerations

- **Batch Updates**: When possible, batch usage updates to reduce database calls
- **Index Optimization**: Ensure proper indexes on frequently queried fields
- **Alert Deduplication**: The system prevents duplicate alerts with `on conflict do nothing`
- **History Pruning**: Consider archiving old history records after a certain period

## Security

- **Row Level Security**: All budget tables enforce RLS to ensure users only see their own data
- **Input Validation**: All limits and thresholds are validated before insertion
- **Audit Trail**: Budget history provides a complete audit trail of all changes
- **Access Control**: Only authenticated users can create and manage budgets
