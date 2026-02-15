# Kanban for Coding Agents

A Next.js application for managing tasks assigned to coding agents. This kanban board helps you visualize and track what tasks are assigned to which coding agents, making it easy to manage your development workflow.

## Features

### Kanban Board
- **Jira-Style Kanban Board**: Visual board with columns matching Jira: TO DO, IN PROGRESS, IN REVIEW, and DONE
- **Agent Assignment**: Assign tasks to specific coding agents with colored avatar circles
- **Task IDs**: Each task gets a unique ID (e.g., TASK-1, TASK-2)
- **Task Management**: Create, update, move, and delete tasks
- **Priority Indicators**: Visual priority indicators (arrows) for high, medium, and low priority
- **Colored Tags**: Add colored tags to categorize tasks (frontend, backend, bug, feature, etc.)
- **Agent Avatars**: Color-coded avatar circles with initials for each agent
- **Sprint Management**: Filter and organize tasks by sprint
- **Supabase Integration**: Cloud-based data persistence with authentication

### Task Orchestration & Agent Management ✨ NEW
- **Automated Task Breakdown**: Break down issues, PRDs, or plain text into epics, tickets, and subtasks
- **Smart Parsing**: Automatically identifies features, requirements, and implementation steps
- **Definition of Done**: Auto-generates acceptance criteria based on task type
- **Risk Identification**: Flags security, performance, and complexity risks automatically
- **Agent Skill Management**: Track agent skills across multiple categories (Frontend, Backend, DevOps, etc.)
- **Performance Metrics**: Monitor task completion, quality scores, and on-time delivery rates
- **Auto-Assignment Engine**: Intelligently assigns tasks based on skills, performance, and availability
- **Dependency Visualization**: Interactive graph showing task relationships and blocking issues
- **Workload Balancing**: Distributes work evenly across agents based on capacity

See [ORCHESTRATION.md](./ORCHESTRATION.md) for detailed documentation.

## Getting Started

### Prerequisites

- Node.js 18+ installed
- npm, yarn, pnpm, or bun

### Installation

1. Install dependencies:

```bash
npm install
# or
yarn install
# or
pnpm install
```

2. Run the development server:

```bash
npm run dev
# or
yarn dev
# or
pnpm dev
```

3. Open [http://localhost:3000](http://localhost:3000) in your browser.

## Usage

### Kanban Board

#### Adding Tasks

1. Click the "New Task" button in the top right
2. Fill in the task details:
   - **Title** (required): A brief description of the task
   - **Description** (optional): More detailed information
   - **Priority**: Select from 1 (Low) to 5 (Critical) - shown with arrow icons on task cards
   - **Tags**: Comma-separated tags (e.g., "frontend, urgent, bug") - tags are color-coded by type
   - **Sprint** (optional): Assign to a sprint for better organization
3. Click "Add Task" to create the task

#### Assigning Agents

1. Any task can be assigned to an agent using the dropdown selector below the task card
2. Each agent has a colored avatar circle with their initials
3. The assigned agent's avatar appears in the bottom-right corner of the task card
4. To unassign an agent, click the X button next to the agent name in the assignment area

#### Moving Tasks

- Use the "Next" and "Prev" buttons on each task card to move tasks between columns
- Tasks flow through: TO DO → IN PROGRESS → IN REVIEW → DONE

### Task Orchestration Dashboard

Click the **"Task Orchestration"** button in the header to access advanced features:

#### 1. Task Breakdown
- Paste an issue, PRD, or requirement text
- Select input type (GitHub Issue, PRD, Screenshot, or Text)
- Click "Generate Breakdown" to automatically create:
  - **Epics**: High-level features
  - **Tickets**: Detailed work items with DoD and test notes
  - **Subtasks**: Granular implementation steps
  - **Risk Flags**: Identified risks and mitigation strategies
  - **Recommended Assignments**: AI-suggested agent assignments

#### 2. Agent Roster
- View workload distribution across all agents
- Monitor performance metrics (completion rate, quality score, on-time delivery)
- Manage agent skills and expertise levels
- Track availability and capacity
- Add/remove skills per agent

#### 3. Dependencies
- Visualize task dependencies in an interactive graph
- Identify blocking relationships
- Detect circular dependencies
- Plan execution order

See [ORCHESTRATION_EXAMPLES.md](./ORCHESTRATION_EXAMPLES.md) for detailed examples.

### Default Agents

The application comes with five default coding agents (with colored avatars):
- **Alex Chen**: Specializes in React, Next.js, and UI development
- **Sarah Johnson**: Handles API, database, and server-side logic
- **Mike Rodriguez**: Works on both frontend and backend tasks
- **Emma Wilson**: DevOps and infrastructure specialist
- **David Kim**: Mobile app development expert

Each agent has a unique colored avatar circle that appears on assigned tasks.

## Project Structure

```
kanban-coding-agents/
├── src/
│   ├── app/
│   │   ├── layout.tsx              # Root layout
│   │   ├── page.tsx                # Main kanban page
│   │   ├── orchestration/          # Orchestration dashboard
│   │   ├── auth/                   # Authentication routes
│   │   └── globals.css             # Global styles
│   ├── components/
│   │   ├── KanbanBoard.tsx         # Main kanban board
│   │   ├── TaskItem.tsx            # Individual task card
│   │   ├── AgentSelector.tsx       # Agent assignment dropdown
│   │   ├── TaskBreakdownPanel.tsx  # Task breakdown UI
│   │   ├── AgentRosterManager.tsx  # Agent skills & performance
│   │   ├── DependencyGraph.tsx     # Dependency visualization
│   │   └── OrchestrationDashboard.tsx # Main orchestration UI
│   ├── hooks/
│   │   ├── useTasks.ts             # Task management hook
│   │   └── useAgents.ts            # Agent management hook
│   ├── lib/
│   │   ├── taskBreakdown.ts        # Task breakdown engine
│   │   ├── agentOrchestration.ts   # Auto-assignment engine
│   │   ├── supabase/               # Supabase client & auth
│   │   └── utils.ts                # Utility functions
│   ├── types/
│   │   ├── task.ts                 # Task type definitions
│   │   ├── agent.ts                # Agent type definitions
│   │   ├── breakdown.ts            # Breakdown type definitions
│   │   └── agentRoster.ts          # Agent roster types
│   └── contexts/
│       ├── AuthContext.tsx         # Authentication context
│       └── ThemeContext.tsx        # Theme management
├── database/
│   ├── schema.sql                  # Main database schema
│   └── orchestration_schema.sql    # Orchestration extensions
├── ORCHESTRATION.md                # Orchestration documentation
├── ORCHESTRATION_EXAMPLES.md       # Usage examples
├── package.json
├── tsconfig.json
└── README.md
```

## Technologies Used

- **Next.js 16**: React framework with App Router
- **TypeScript**: Type safety
- **Tailwind CSS**: Styling
- **Lucide React**: Icons
- **Supabase**: Authentication and database
- **PostgreSQL**: Relational database (via Supabase)

## Documentation

- **[ORCHESTRATION.md](./ORCHESTRATION.md)**: Complete orchestration system documentation
- **[ORCHESTRATION_EXAMPLES.md](./ORCHESTRATION_EXAMPLES.md)**: Practical usage examples
- **[BUDGET_MANAGEMENT.md](./BUDGET_MANAGEMENT.md)**: Budget tracking features

## Building for Production

```bash
npm run build
npm start
```

## License

MIT
