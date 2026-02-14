# Kanban for Coding Agents

A Next.js application for managing tasks assigned to coding agents. This kanban board helps you visualize and track what tasks are assigned to which coding agents, making it easy to manage your development workflow.

## Features

### Core Kanban Features
- **Jira-Style Kanban Board**: Visual board with columns matching Jira: TO DO, IN PROGRESS, IN REVIEW, and DONE
- **Agent Assignment**: Assign tasks to specific coding agents with colored avatar circles
- **Task IDs**: Each task gets a unique ID (e.g., TASK-1, TASK-2)
- **Task Management**: Create, update, move, and delete tasks
- **Priority Indicators**: Visual priority indicators (arrows) for high, medium, and low priority
- **Colored Tags**: Add colored tags to categorize tasks (frontend, backend, bug, feature, etc.)
- **Agent Avatars**: Color-coded avatar circles with initials for each agent
- **Comments & Attachments**: Placeholder support for comments and attachments count
- **Sprint Management**: Filter and organize tasks by sprint

### Advanced Task Breakdown & Orchestration
- **Automated Task Breakdown**: Parse GitHub issues, PRD documents, or screenshots into structured epics, tickets, and subtasks
- **Smart Task Generation**: Auto-generate Definition of Done (DoD), test notes, and risk flags for each task
- **Dependency Visualization**: Interactive dependency graph showing task relationships and blockers
- **Agent Roster Management**: Manage agent skills with proficiency levels across multiple categories
- **Performance Tracking**: Track agent quality scores, completion rates, and workload
- **Auto-Assignment Algorithm**: Intelligent task assignment based on skills, performance, availability, and workload
- **Risk Assessment**: Automatic identification of risks with mitigation strategies
- **Complexity Estimation**: Smart hour estimation based on task complexity

### Data Persistence
- **Supabase Integration**: Cloud-based storage for tasks and agents
- **Local Storage Fallback**: Breakdown tasks and roster data stored locally
- **User Authentication**: Secure login with Supabase Auth

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

### Task Breakdown & Agent Orchestration

Access the AI-powered task breakdown system by clicking the **"AI Breakdown"** button in the top-right corner of the Kanban board.

For detailed documentation on using the task breakdown features, see [TASK_BREAKDOWN_GUIDE.md](./TASK_BREAKDOWN_GUIDE.md).

#### Quick Start
1. Click "AI Breakdown" button
2. Select input type (GitHub Issue, PRD, or Screenshot)
3. Paste your content
4. Click "Break Down Tasks"
5. Review generated tasks with DoD, test notes, and risk flags
6. Tasks are auto-assigned to agents based on skills
7. Select tasks and click "Add to Kanban Board"

#### Agent Roster Management
1. Navigate to the "Agent Roster Management" tab
2. Select an agent to view their performance metrics
3. Add skills with proficiency levels (1-5)
4. Use quick presets for common skill sets
5. Track quality scores, completion rates, and workload

### Basic Kanban Usage

### Adding Tasks

1. Click the "New Task" button in the top right
2. Fill in the task details:
   - **Title** (required): A brief description of the task
   - **Description** (optional): More detailed information
- **Priority**: Select from 1 (Low) to 5 (Critical) - shown with arrow icons on task cards
- **Tags**: Comma-separated tags (e.g., "frontend, urgent, bug") - tags are color-coded by type
3. Click "Add Task" to create the task

### Assigning Agents

1. Any task can be assigned to an agent using the dropdown selector below the task card
2. Each agent has a colored avatar circle with their initials
3. The assigned agent's avatar appears in the bottom-right corner of the task card
4. To unassign an agent, click the X button next to the agent name in the assignment area

### Moving Tasks

- Use the "Next" and "Prev" buttons on each task card to move tasks between columns
- Tasks flow through: TO DO → IN PROGRESS → IN REVIEW → DONE

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
│   │   ├── layout.tsx           # Root layout
│   │   ├── page.tsx             # Main Kanban board page
│   │   ├── breakdown/
│   │   │   └── page.tsx         # Task breakdown & orchestration page
│   │   ├── login/               # Authentication pages
│   │   └── signup/
│   ├── components/
│   │   ├── KanbanBoard.tsx      # Main kanban board component
│   │   ├── TaskItem.tsx         # Individual task card
│   │   ├── AgentSelector.tsx    # Agent assignment dropdown
│   │   ├── TaskBreakdownDashboard.tsx  # AI task breakdown UI
│   │   ├── AgentRosterManager.tsx      # Agent skills management
│   │   └── DependencyGraph.tsx  # Task dependency visualization
│   ├── hooks/
│   │   ├── useTasks.ts          # Task management hook
│   │   ├── useAgents.ts         # Agent management hook
│   │   ├── useAgentRosters.ts   # Agent roster hook
│   │   └── useBreakdownTasks.ts # Breakdown tasks hook
│   ├── lib/
│   │   ├── storage.ts           # LocalStorage utilities
│   │   ├── utils.ts             # Utility functions
│   │   ├── taskBreakdown.ts     # Task parsing & breakdown service
│   │   ├── agentRoster.ts       # Agent roster & auto-assignment
│   │   └── supabase/            # Supabase client utilities
│   ├── contexts/
│   │   ├── AuthContext.tsx      # Authentication context
│   │   └── ThemeContext.tsx     # Dark mode context
│   └── types/
│       ├── task.ts              # Task type definitions
│       ├── agent.ts             # Agent type definitions
│       ├── breakdown.ts         # Breakdown task types
│       ├── agentSkills.ts       # Agent roster types
│       └── budget.ts            # Budget types
├── TASK_BREAKDOWN_GUIDE.md      # Detailed feature documentation
├── package.json
├── tsconfig.json
└── README.md
```

## Technologies Used

- **Next.js 16**: React framework with App Router
- **TypeScript**: Type safety and better DX
- **Tailwind CSS**: Utility-first styling
- **Lucide React**: Beautiful icon library
- **Supabase**: Backend-as-a-Service for auth and database
- **LocalStorage**: Client-side data persistence for breakdown tasks

## Building for Production

```bash
npm run build
npm start
```

## License

MIT
