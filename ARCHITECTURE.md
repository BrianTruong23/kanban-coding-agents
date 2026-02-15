# Budget Management System Architecture

## System Overview

```
┌─────────────────────────────────────────────────────────────────────┐
│                          User Interface Layer                        │
├─────────────────────────────────────────────────────────────────────┤
│                                                                       │
│  ┌──────────────┐    ┌──────────────┐    ┌──────────────────────┐  │
│  │ Kanban View  │◄──►│   PM View    │◄──►│  TaskExecution       │  │
│  │              │    │  Dashboard   │    │    Tracker           │  │
│  │ - TaskItem   │    │  - Overview  │    │  - Start/Pause       │  │
│  │ - ($) Icon   │    │  - Tasks     │    │  - Timer             │  │
│  │              │    │  - Alerts    │    │  - Status            │  │
│  └──────┬───────┘    └──────┬───────┘    └──────────┬───────────┘  │
│         │                   │                        │               │
│         └───────────────────┴────────────────────────┘               │
│                             │                                        │
│                    ┌────────▼────────┐                               │
│                    │  BudgetModal    │                               │
│                    │  - Edit Limits  │                               │
│                    │  - Set Retries  │                               │
│                    └────────┬────────┘                               │
└─────────────────────────────┼──────────────────────────────────────┘
                              │
┌─────────────────────────────┼──────────────────────────────────────┐
│                    Business Logic Layer                              │
├─────────────────────────────┼──────────────────────────────────────┤
│                              │                                       │
│                    ┌─────────▼─────────┐                            │
│                    │   useBudgets()    │                            │
│                    │   React Hook      │                            │
│                    │                   │                            │
│                    │  - createBudget   │                            │
│                    │  - updateBudget   │                            │
│                    │  - logUsage       │                            │
│                    │  - pauseTask      │                            │
│                    │  - resumeTask     │                            │
│                    │  - getMetrics     │                            │
│                    └─────────┬─────────┘                            │
│                              │                                       │
│                    ┌─────────▼─────────┐                            │
│                    │ BudgetEnforcer    │                            │
│                    │  Static Class     │                            │
│                    │                   │                            │
│                    │  - canExecute()   │                            │
│                    │  - getBudgetStatus│                            │
│                    │  - hasEnoughBudget│                            │
│                    │  - isAtWarning    │                            │
│                    └─────────┬─────────┘                            │
└──────────────────────────────┼──────────────────────────────────────┘
                               │
┌──────────────────────────────┼──────────────────────────────────────┐
│                       Data Access Layer                              │
├──────────────────────────────┼──────────────────────────────────────┤
│                               │                                      │
│                    ┌──────────▼──────────┐                          │
│                    │   Supabase Client   │                          │
│                    │   - Real-time Sync  │                          │
│                    │   - RLS Policies    │                          │
│                    └──────────┬──────────┘                          │
└───────────────────────────────┼───────────────────────────────────┘
                                │
┌───────────────────────────────┼───────────────────────────────────┐
│                       Database Layer (PostgreSQL)                   │
├───────────────────────────────┼───────────────────────────────────┤
│                                │                                    │
│  ┌─────────────────┐  ┌───────▼────────┐  ┌──────────────────┐   │
│  │ task_budgets    │  │ budget_usage   │  │ budget_alerts    │   │
│  │                 │  │    _logs       │  │                  │   │
│  │ - id            │  │                │  │ - id             │   │
│  │ - task_id       │  │ - task_id      │  │ - task_id        │   │
│  │ - max_cost      │  │ - cost         │  │ - type           │   │
│  │ - max_tokens    │  │ - tokens       │  │ - threshold      │   │
│  │ - max_time      │  │ - time_spent   │  │ - message        │   │
│  │ - current_cost  │  │ - operation    │  │ - acknowledged   │   │
│  │ - current_tokens│  │ - timestamp    │  │                  │   │
│  │ - current_time  │  │                │  │                  │   │
│  │ - retry_count   │  └────────────────┘  └──────────────────┘   │
│  │ - max_retries   │                                              │
│  │ - status        │  ┌──────────────────────────────────────┐   │
│  └─────────────────┘  │  Database Triggers & Functions       │   │
│                       │                                      │   │
│                       │  check_budget_limits()               │   │
│                       │  - Calculates usage percentages      │   │
│                       │  - Auto-creates alerts at 75/90/100% │   │
│                       │  - Auto-sets status to 'exceeded'    │   │
│                       └──────────────────────────────────────┘   │
└──────────────────────────────────────────────────────────────────┘
```

## Data Flow Diagrams

### Creating a Budget

```
User                 TaskItem              BudgetModal           useBudgets          Supabase
 │                      │                      │                    │                  │
 │   Hover & Click $    │                      │                    │                  │
 ├─────────────────────►│                      │                    │                  │
 │                      │   Show Modal         │                    │                  │
 │                      ├─────────────────────►│                    │                  │
 │                      │                      │                    │                  │
 │   Enter Budget Data  │                      │                    │                  │
 ├──────────────────────┼─────────────────────►│                    │                  │
 │                      │                      │  createBudget()    │                  │
 │                      │                      ├───────────────────►│                  │
 │                      │                      │                    │   INSERT         │
 │                      │                      │                    ├─────────────────►│
 │                      │                      │                    │   (RLS check)    │
 │                      │                      │                    │◄─────────────────┤
 │                      │                      │   Budget created   │   Return row     │
 │                      │                      │◄───────────────────┤                  │
 │   Budget saved ✓     │                      │                    │                  │
 │◄─────────────────────┴──────────────────────┤                    │                  │
```

### Logging Usage & Triggering Alerts

```
TaskExecution        useBudgets          Supabase            DB Trigger         budget_alerts
    │                    │                   │                    │                    │
    │   logUsage()       │                   │                    │                    │
    ├───────────────────►│                   │                    │                    │
    │                    │   INSERT log      │                    │                    │
    │                    ├──────────────────►│                    │                    │
    │                    │                   │   Log inserted     │                    │
    │                    │                   │                    │                    │
    │                    │   UPDATE budget   │                    │                    │
    │                    ├──────────────────►│                    │                    │
    │                    │                   │  Trigger fires     │                    │
    │                    │                   ├───────────────────►│                    │
    │                    │                   │                    │  Check thresholds  │
    │                    │                   │                    │  Calculate %       │
    │                    │                   │                    │                    │
    │                    │                   │                    │   IF >= 75%        │
    │                    │                   │                    ├───────────────────►│
    │                    │                   │                    │   INSERT alert     │
    │                    │                   │  Budget updated    │                    │
    │                    │◄──────────────────┤                    │                    │
    │   Usage logged ✓   │                   │                    │                    │
    │◄───────────────────┤                   │                    │                    │
```

### Task Execution Flow

```
User              TaskExecution      BudgetEnforcer      useBudgets        Supabase
 │                     │                   │                 │                │
 │   Click Start       │                   │                 │                │
 ├────────────────────►│                   │                 │                │
 │                     │  getBudgetForTask │                 │                │
 │                     ├───────────────────┼────────────────►│                │
 │                     │                   │  Return budget  │                │
 │                     │◄──────────────────┼─────────────────┤                │
 │                     │                   │                 │                │
 │                     │  canExecute()     │                 │                │
 │                     ├──────────────────►│                 │                │
 │                     │                   │ Check limits    │                │
 │                     │                   │ Check status    │                │
 │                     │  { allowed: bool }│                 │                │
 │                     │◄──────────────────┤                 │                │
 │                     │                   │                 │                │
 │ IF allowed:         │                   │                 │                │
 │   Start timer       │                   │                 │                │
 │   Show "Running"    │                   │                 │                │
 │                     │                   │                 │                │
 │ IF NOT allowed:     │                   │                 │                │
 │   Show error        │                   │                 │                │
 │   Display reasons   │                   │                 │                │
```

## Component Hierarchy

```
App (page.tsx)
│
├─ Header
│  ├─ View Toggle [Kanban | PM]
│  ├─ User Info
│  └─ Theme Toggle
│
└─ Main Content
   │
   ├─ Kanban View (KanbanBoard)
   │  │
   │  └─ Task Columns
   │     │
   │     └─ TaskItem (multiple)
   │        │
   │        ├─ Budget Icon ($)
   │        ├─ Task Details
   │        ├─ Agent Selector
   │        └─ BudgetModal (conditional)
   │           │
   │           └─ Budget Form
   │              ├─ Max Cost Input
   │              ├─ Max Tokens Input
   │              ├─ Max Time Input
   │              └─ Max Retries Input
   │
   └─ PM Dashboard (PMDashboard)
      │
      ├─ Tab Navigation
      │  ├─ Overview
      │  ├─ Task Budgets
      │  └─ Alerts
      │
      ├─ Overview Tab
      │  ├─ Total Spend Card
      │  ├─ Total Tokens Card
      │  ├─ Total Time Card
      │  └─ Status Breakdown
      │
      ├─ Task Budgets Tab
      │  │
      │  └─ Budget Cards (multiple)
      │     │
      │     ├─ Task Info
      │     ├─ Status Badge
      │     ├─ Pause/Resume Button
      │     ├─ Cost Progress Bar
      │     ├─ Tokens Progress Bar
      │     └─ Time Progress Bar
      │
      └─ Alerts Tab
         │
         └─ Alert Cards (multiple)
            │
            ├─ Alert Type Badge
            ├─ Message
            ├─ Task Info
            ├─ Timestamp
            └─ Dismiss Button
```

## State Management

### useBudgets Hook State

```typescript
const useBudgets = () => {
  // Local State
  const [budgets, setBudgets] = useState<TaskBudget[]>([])
  const [alerts, setAlerts] = useState<BudgetAlert[]>([])
  const [isLoaded, setIsLoaded] = useState(false)

  // Auth Context
  const { user, isLoading } = useAuth()

  // Supabase Client
  const supabase = useMemo(() => createClient(), [])

  // Effects
  useEffect(() => {
    // Fetch budgets and alerts on mount/auth change
  }, [user, isLoading, supabase])

  // Return API
  return {
    budgets,        // Read-only state
    alerts,         // Read-only state
    isLoaded,       // Loading indicator
    createBudget,   // Create operation
    updateBudget,   // Update operation
    logUsage,       // Usage tracking
    pauseTask,      // Control operation
    resumeTask,     // Control operation
    incrementRetry, // Retry tracking
    acknowledgeAlert, // Alert management
    getBudgetMetrics, // Computed metrics
    getBudgetForTask  // Lookup helper
  }
}
```

### Component State Flow

```
┌─────────────────────────────────────────────────────────────┐
│                      Global State                            │
│                                                              │
│  Supabase Database (Single Source of Truth)                 │
│  - task_budgets table                                       │
│  - budget_usage_logs table                                  │
│  - budget_alerts table                                      │
└─────────────────────────────────────────────────────────────┘
                           │
                           │ Real-time subscriptions
                           │ (future enhancement)
                           ▼
┌─────────────────────────────────────────────────────────────┐
│                    useBudgets Hook                           │
│                                                              │
│  Local cached state for performance                          │
│  - budgets: TaskBudget[]                                    │
│  - alerts: BudgetAlert[]                                    │
│  - isLoaded: boolean                                        │
└─────────────────────────────────────────────────────────────┘
                           │
                           │ Provides data & methods
                           ▼
┌───────────────────┬───────────────────┬─────────────────────┐
│   TaskItem        │   PMDashboard     │  TaskExecutionTracker│
│                   │                   │                     │
│ Local State:      │ Local State:      │ Local State:        │
│ - showModal       │ - selectedView    │ - isRunning         │
│                   │                   │ - executionTime     │
│                   │                   │ - status            │
└───────────────────┴───────────────────┴─────────────────────┘
```

## Security Architecture

### Row Level Security (RLS)

```sql
-- Example RLS Policy
CREATE POLICY "Users can view their own task budgets"
ON task_budgets
FOR SELECT
USING (auth.uid() = user_id);

-- All operations isolated by user_id
-- No user can see/modify another user's data
```

### Security Layers

```
┌─────────────────────────────────────────────────────────────┐
│ Layer 1: Client-side Validation                             │
│ - BudgetEnforcer checks before execution                    │
│ - UI prevents invalid inputs                                │
│ - TypeScript type safety                                    │
└─────────────────────────────────────────────────────────────┘
                           │
                           ▼
┌─────────────────────────────────────────────────────────────┐
│ Layer 2: Supabase RLS                                       │
│ - User authentication required                              │
│ - Row-level access control                                  │
│ - Per-operation policies (SELECT, INSERT, UPDATE, DELETE)   │
└─────────────────────────────────────────────────────────────┘
                           │
                           ▼
┌─────────────────────────────────────────────────────────────┐
│ Layer 3: Database Triggers                                  │
│ - Automatic limit checking                                  │
│ - Alert generation                                          │
│ - Status updates                                            │
└─────────────────────────────────────────────────────────────┘
```

## Performance Considerations

### Optimization Strategies

1. **Memoized Supabase Client**
   ```typescript
   const supabase = useMemo(() => createClient(), [])
   ```

2. **Computed Metrics**
   ```typescript
   const getBudgetMetrics = useCallback(() => {
     // Compute from cached budgets array
   }, [budgets])
   ```

3. **Database Indexes**
   ```sql
   CREATE INDEX task_budgets_task_id_idx ON task_budgets(task_id);
   CREATE INDEX budget_alerts_acknowledged_idx ON budget_alerts(acknowledged);
   ```

4. **Selective Queries**
   ```typescript
   .eq('acknowledged', false)  // Only fetch active alerts
   .order('created_at', { ascending: false })  // Latest first
   ```

## Error Handling

### Error Flow

```
User Action
    │
    ├─ Try
    │   │
    │   ├─ Validate Input (client-side)
    │   │   │
    │   │   └─ Invalid? → Show validation error
    │   │
    │   ├─ Call API (useBudgets)
    │   │   │
    │   │   ├─ Check auth
    │   │   │   └─ No user? → Throw error
    │   │   │
    │   │   ├─ Execute Supabase query
    │   │   │   │
    │   │   │   ├─ RLS denied? → Return error
    │   │   │   ├─ Constraint violated? → Return error
    │   │   │   └─ Success → Return data
    │   │   │
    │   │   └─ Update local state
    │   │
    │   └─ Success callback
    │
    └─ Catch
        │
        ├─ Log to console
        ├─ Show user-friendly message
        └─ Optionally revert optimistic update
```

## Deployment Checklist

- [x] Database schema created
- [x] TypeScript types defined
- [x] Hooks implemented
- [x] Components created
- [x] UI integrated
- [ ] Environment variables configured
- [ ] Database migrations run
- [ ] RLS policies tested
- [ ] End-to-end testing
- [ ] Performance testing
- [ ] Documentation reviewed

## Monitoring & Observability

### Key Metrics to Track

1. **Budget Usage**
   - Average cost per task
   - Average tokens per task
   - Average time per task

2. **System Health**
   - Number of active budgets
   - Number of exceeded budgets
   - Alert generation rate

3. **User Behavior**
   - Budget creation frequency
   - Task pause/resume patterns
   - Alert acknowledgment time

### Logging Points

- Budget creation/update
- Usage logging events
- Task pause/resume
- Alert generation
- Budget violations
- Retry attempts

