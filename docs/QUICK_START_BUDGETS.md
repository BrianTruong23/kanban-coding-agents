# Budget System Quick Start Guide

## 1. Setup (One-Time)

### Run the Database Migration

Execute the migration file in your Supabase dashboard:
```bash
supabase/migrations/0005_budget_management.sql
```

This creates:
- `task_budgets` table
- `budget_alerts` table
- `budget_history` table
- Automatic triggers for budget enforcement

## 2. Access the PM Dashboard

Navigate to `/budget-pm` in your application to see:
- Real-time budget monitoring
- Resource usage metrics
- Budget alerts and warnings
- Budget controls (pause/resume/cancel)

## 3. Create Your First Budget

### Option A: Using the UI Component

```tsx
import { BudgetCreator } from '@/components/BudgetCreator';
import { useBudgets } from '@/hooks/useBudgets';

function MyComponent() {
  const { createBudget } = useBudgets();

  return (
    <BudgetCreator
      task={myTask}
      onCreateBudget={async (taskId, agentId, limits) => {
        await createBudget({
          taskId,
          agentId,
          status: 'active',
          limits,
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
            tokens: 80,
            cost: 80,
            time: 80,
          },
          autoActionsEnabled: true,
          autoPauseOnExceed: true,
        });
      }}
    />
  );
}
```

### Option B: Using Templates

```typescript
import { useBudgets } from '@/hooks/useBudgets';
import { createBudgetFromTemplate } from '@/lib/budget-samples';

const { createBudget } = useBudgets();

// Create a medium-sized task budget
const budget = createBudgetFromTemplate(taskId, agentId, 'medium');
await createBudget(budget);

// Available templates: 'small', 'medium', 'large', 'research', 'critical'
```

### Option C: Custom Budget

```typescript
import { useBudgets } from '@/hooks/useBudgets';

const { createBudget } = useBudgets();

await createBudget({
  taskId: 'task-123',
  agentId: 'agent-456',
  status: 'active',
  limits: {
    tokens: 100_000,   // Max 100K tokens
    cost: 5.0,         // Max $5
    time: 3600000,     // Max 1 hour (in milliseconds)
    retries: 3,        // Max 3 retries
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
    tokens: 80,  // Alert at 80%
    cost: 80,
    time: 80,
  },
  autoActionsEnabled: true,
  autoPauseOnExceed: true,
});
```

## 4. Track Resource Usage

### During Agent Execution

```typescript
import { updateUsage, calculateCost } from '@/lib/budget-tracker';
import { useBudgets } from '@/hooks/useBudgets';

const { budgets, updateBudget } = useBudgets();
const budget = budgets.find(b => b.taskId === taskId);

// Before API call
const startTime = Date.now();

// Make your API call
const response = await llm.complete({ messages });

// After API call
const duration = Date.now() - startTime;
const cost = calculateCost(
  response.usage.input_tokens,
  response.usage.output_tokens,
  'claude-3-sonnet'
);

// Update budget
const newUsage = updateUsage(budget.usage, {
  tokens: response.usage.input_tokens + response.usage.output_tokens,
  cost: cost,
  time: duration,
  apiCalls: 1,
});

await updateBudget(budget.id, { usage: newUsage });
```

### For File Operations

```typescript
const newUsage = updateUsage(budget.usage, {
  fileOperations: 1,
  time: 500, // time spent on file operation
});

await updateBudget(budget.id, { usage: newUsage });
```

### For Retries

```typescript
const newUsage = updateUsage(budget.usage, {
  retries: 1,
});

await updateBudget(budget.id, { usage: newUsage });
```

## 5. Monitor Budgets

### Display Budget Status

```tsx
import { BudgetMonitor } from '@/components/BudgetMonitor';
import { useBudgets } from '@/hooks/useBudgets';

function TaskDetail({ taskId }) {
  const { budgets, pauseBudget, resumeBudget } = useBudgets({ taskId });
  const budget = budgets[0];

  if (!budget) return null;

  return (
    <BudgetMonitor
      budget={budget}
      onPause={pauseBudget}
      onResume={resumeBudget}
      compact={false}
    />
  );
}
```

### Check Budget Status Programmatically

```typescript
import { hasExceededLimit, hasReachedWarning } from '@/lib/budget-tracker';

// Check if exceeded
if (hasExceededLimit(budget.usage, budget.limits)) {
  console.log('Budget exceeded!');
  // Handle exceeded state
}

// Check if warning threshold reached
if (hasReachedWarning(budget.usage, budget.limits, budget.warningThresholds)) {
  console.log('Budget warning!');
  // Show warning to user
}
```

## 6. Budget Controls

### Pause a Budget

```typescript
const { pauseBudget } = useBudgets();

await pauseBudget(budgetId);
// Budget status -> 'paused'
// Task execution should be halted
```

### Resume a Budget

```typescript
const { resumeBudget } = useBudgets();

await resumeBudget(budgetId);
// Budget status -> 'active'
// Task execution can continue
```

### Complete a Budget

```typescript
const { completeBudget } = useBudgets();

await completeBudget(budgetId);
// Budget status -> 'completed'
// Final usage is locked
```

### Cancel a Budget

```typescript
const { deleteBudget } = useBudgets();

await deleteBudget(budgetId);
// Budget is deleted from database
```

## 7. View Alerts

```typescript
const { fetchAlerts } = useBudgets();

// Get all alerts for a budget
const alerts = await fetchAlerts(budgetId);

// Get all alerts for the user
const allAlerts = await fetchAlerts();

// Process alerts
alerts.forEach(alert => {
  if (alert.type === 'exceeded') {
    console.error(`${alert.resourceType} budget exceeded!`);
  }
});
```

## 8. Budget Templates by Task Type

Use the recommendation system:

```typescript
import { recommendBudget, createBudgetFromTemplate } from '@/lib/budget-samples';

const task = {
  tags: ['feature', 'backend', 'api'],
};

const templateName = recommendBudget(task.tags);
// Returns: 'medium'

const budget = createBudgetFromTemplate(taskId, agentId, templateName);
await createBudget(budget);
```

## 9. Estimate Completion

```typescript
import { estimateCompletion } from '@/lib/budget-samples';

const estimate = estimateCompletion(
  budget.usage,
  budget.limits,
  Date.now() - budget.createdAt
);

console.log(`${estimate.completionPercentage.toFixed(1)}% complete`);
console.log(`Estimated remaining: ${estimate.estimatedRemainingTime}ms`);
console.log(`Projected cost: $${estimate.projectedCost}`);
```

## 10. Common Patterns

### Pattern 1: Create Budget When Task Starts

```typescript
// When task moves to 'in-progress'
if (task.status === 'in-progress' && !task.budgetId) {
  const templateName = recommendBudget(task.tags);
  const budget = createBudgetFromTemplate(task.id, task.assignedAgentId, templateName);
  const createdBudget = await createBudget(budget);

  // Update task with budget reference
  await updateTask({ ...task, budgetId: createdBudget.id });
}
```

### Pattern 2: Check Budget Before API Call

```typescript
async function executeAgentTask(task, budget) {
  // Check if budget allows execution
  if (budget.status === 'paused' || budget.status === 'exceeded') {
    throw new Error('Budget does not allow execution');
  }

  // Check if we're close to limits
  const percentages = calculatePercentages(budget.usage, budget.limits);
  if (percentages.cost && percentages.cost > 95) {
    console.warn('Budget nearly exhausted');
  }

  // Proceed with execution...
}
```

### Pattern 3: Batch Usage Updates

```typescript
// Instead of updating after each operation
let batchedUsage = { ...budget.usage };

for (const operation of operations) {
  const result = await operation.execute();
  batchedUsage = updateUsage(batchedUsage, result.usage);
}

// Update once at the end
await updateBudget(budget.id, { usage: batchedUsage });
```

## Need Help?

- **Full Documentation**: See `docs/BUDGET_MANAGEMENT.md`
- **PM Dashboard**: Visit `/budget-pm` in your app
- **Type Definitions**: Check `src/types/budget.ts`
- **Examples**: See `src/lib/budget-samples.ts`

## Quick Reference

| Resource | Default Limit | Warning % |
|----------|--------------|-----------|
| Tokens   | 100,000      | 80%       |
| Cost     | $5.00        | 80%       |
| Time     | 1 hour       | 80%       |
| Retries  | 3            | N/A       |

| Budget Status | Description |
|--------------|-------------|
| active       | Budget is active, task can proceed |
| paused       | Manually paused by user |
| exceeded     | Limit exceeded, auto-paused if enabled |
| completed    | Task completed, budget finalized |
| cancelled    | Budget cancelled |

| Alert Type | Meaning |
|-----------|---------|
| warning   | Threshold reached (default 80%) |
| critical  | Very close to limit (90%+) |
| exceeded  | Limit has been exceeded |
