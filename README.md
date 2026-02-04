# Kanban for Coding Agents

A Next.js application for managing tasks assigned to coding agents. This kanban board helps you visualize and track what tasks are assigned to which coding agents, making it easy to manage your development workflow.

## Features

- **Jira-Style Kanban Board**: Visual board with columns matching Jira: TO DO, IN PROGRESS, IN REVIEW, and DONE
- **Agent Assignment**: Assign tasks to specific coding agents with colored avatar circles
- **Task IDs**: Each task gets a unique ID (e.g., TASK-1, TASK-2)
- **Task Management**: Create, update, move, and delete tasks
- **Priority Indicators**: Visual priority indicators (arrows) for high, medium, and low priority
- **Colored Tags**: Add colored tags to categorize tasks (frontend, backend, bug, feature, etc.)
- **Agent Avatars**: Color-coded avatar circles with initials for each agent
- **Comments & Attachments**: Placeholder support for comments and attachments count
- **Local Storage**: All data is stored locally in your browser

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
│   │   ├── layout.tsx       # Root layout
│   │   ├── page.tsx         # Main page
│   │   └── globals.css      # Global styles
│   ├── components/
│   │   ├── KanbanBoard.tsx  # Main kanban board component
│   │   ├── TaskItem.tsx     # Individual task card
│   │   └── AgentSelector.tsx # Agent assignment dropdown
│   ├── hooks/
│   │   ├── useTasks.ts      # Task management hook
│   │   └── useAgents.ts     # Agent management hook
│   ├── lib/
│   │   ├── storage.ts        # LocalStorage utilities
│   │   └── utils.ts         # Utility functions
│   └── types/
│       ├── task.ts          # Task type definitions
│       └── agent.ts         # Agent type definitions
├── package.json
├── tsconfig.json
└── README.md
```

## Technologies Used

- **Next.js 16**: React framework
- **TypeScript**: Type safety
- **Tailwind CSS**: Styling
- **Lucide React**: Icons
- **LocalStorage**: Data persistence

## Building for Production

```bash
npm run build
npm start
```

## License

MIT
