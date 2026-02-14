# Kanban Coding Agents - Documentation

Welcome to the documentation for the Kanban Coding Agents project. This directory contains comprehensive guides and references for using and extending the system.

## Documentation Index

### [Budget Management](./BUDGET_MANAGEMENT.md)
Complete guide to the Budget and Resource Management system:
- Setting up budgets for agent tasks
- Tracking tokens, costs, time, and retries
- Configuring automatic alerts and actions
- Using the PM Dashboard
- Database schema and API integration

## Quick Links

### For Project Managers
- **[PM Dashboard](./BUDGET_MANAGEMENT.md#pm-dashboard)**: Monitor all budgets and resource usage
- **[Creating Budgets](./BUDGET_MANAGEMENT.md#creating-a-budget)**: Set up budget limits for tasks
- **[Budget Metrics](./BUDGET_MANAGEMENT.md#budget-metrics)**: Understand efficiency and projections

### For Developers
- **[API Integration](./BUDGET_MANAGEMENT.md#api-integration-example)**: Integrate budget tracking with AI agents
- **[Database Schema](./BUDGET_MANAGEMENT.md#database-schema)**: Understand the data model
- **[Extending the System](./BUDGET_MANAGEMENT.md#extending-the-system)**: Add new features

## Key Features

### Budget and Resource Management
- Multi-dimensional resource tracking (tokens, cost, time, retries)
- Configurable limits and warning thresholds
- Automatic task pausing when budgets are exceeded
- Real-time alerts and notifications
- Comprehensive PM dashboard with metrics and analytics
- Historical tracking and audit trails

### Task Management
- Kanban-style task board with drag-and-drop
- Sprint-based organization
- Agent assignment and tracking
- Priority levels and tagging
- Task descriptions and metadata

### Agent Management
- Multiple AI agents with different specializations
- Agent assignment to tasks
- Performance tracking per agent
- Avatar customization

### Execution Tracing
- Record and replay agent executions
- Tool call tracking
- File diff tracking
- Test result logging
- Checkpoint system for partial replays

### Triage and Issue Management
- GitHub webhook integration
- Automatic issue clustering
- Priority-based triage inbox
- Severity and impact analysis

### PR Orchestration
- Pull request health monitoring
- Branch creation and management
- PR metrics and analytics

## Getting Started

1. **Set up the database**: Run the migration in `supabase/migrations/0005_budget_management.sql`
2. **Explore the PM Dashboard**: Navigate to `/budget-pm` to see budget overview
3. **Create a budget**: Use the `BudgetCreator` component or the PM Dashboard
4. **Monitor resources**: Watch the `BudgetMonitor` component for real-time updates

## Architecture

```
src/
├── types/          # TypeScript type definitions
│   ├── budget.ts   # Budget and resource types
│   ├── task.ts     # Task types
│   ├── agent.ts    # Agent types
│   └── ...
├── lib/            # Core business logic
│   ├── budget-tracker.ts    # Budget calculations and utilities
│   └── ...
├── hooks/          # React hooks for data management
│   ├── useBudgets.ts        # Budget data hook
│   ├── useTasks.ts          # Task data hook
│   └── ...
├── components/     # React components
│   ├── BudgetMonitor.tsx    # Budget display component
│   ├── BudgetCreator.tsx    # Budget creation form
│   └── ...
└── app/            # Next.js app routes
    ├── budget-pm/  # PM Dashboard
    └── ...
```

## Database Migrations

Migrations are located in `supabase/migrations/`:

- `0005_budget_management.sql`: Budget and resource management tables

Run migrations through your Supabase dashboard or CLI.

## Contributing

When adding new features:

1. Create type definitions in `src/types/`
2. Add business logic to `src/lib/`
3. Create React hooks in `src/hooks/`
4. Build UI components in `src/components/`
5. Add database migrations to `supabase/migrations/`
6. Document in this directory

## Support

For issues or questions:
- Check the documentation in this directory
- Review the source code comments
- Refer to the type definitions for API contracts
- Check database triggers and functions for automatic behaviors

## License

See the main project README for license information.
