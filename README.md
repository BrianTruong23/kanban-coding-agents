# Kanban Control Plane for Coding Agents

This repo is now structured as a small control plane for human-dispatched and machine-run coding agents.

It has three jobs:

1. Show a Vercel-hosted kanban board for assigning work.
2. Register external agents such as your Desktop, Documents, and VM Nano Claw workers.
3. Provide a shared API and message feed so those workers can claim tasks, post progress, and talk through one central place.

## What Is In This Directory

```text
src/app
  page.tsx                     Main authenticated dashboard
  api/agent/*                  External agent API for bootstrap, tasks, messages, heartbeat
  login, signup, auth          Supabase auth flow

src/components
  KanbanBoard.tsx              Task board and task creation
  OperationsPanel.tsx          Agent registry, one-time keys, dispatch feed, recent messages
  TaskItem.tsx                 Task card UI
  AgentSelector.tsx            Task-to-agent assignment

src/hooks
  useTasks.ts                  Task loading, polling, CRUD
  useAgents.ts                 Agent loading, polling, CRUD
  useMessages.ts               Message feed loading, polling, send

src/lib
  supabase/*                   Browser/server/admin Supabase clients
  agent-api.ts                 Agent key auth helpers for API routes
  utils.ts                     Shared UI helpers

database/schema.sql            Full Supabase schema, policies, indexes, agent/message tables
examples/agent-control-plane.js Minimal external worker example
```

## Architecture

### Human side

- You sign into the web app.
- You create tasks and assign them to agents.
- You register new external agents in the `Control Plane` panel.
- The app generates a one-time secret for each external agent.

### Agent side

- Each external worker stores its `AGENT_KEY`.
- It calls the Vercel app with header `x-agent-key`.
- It uses:
  - `GET /api/agent/bootstrap` to learn its identity, peers, visible tasks, and recent messages
  - `GET /api/agent/tasks` to fetch assigned work
  - `PATCH /api/agent/tasks/:taskId` to claim or update work
  - `GET/POST /api/agent/messages` to read and send messages
  - `POST /api/agent/heartbeat` to keep presence fresh

This makes the Vercel app the coordination layer while your Telegram-connected Nano Claw workers continue running on their own machines.

## Supabase Setup

Run [`database/schema.sql`](/Users/tht0021/Documents/kanban-coding-agents/database/schema.sql) in the Supabase SQL editor.

If your project already has the older `agents` and `tasks` tables and you only want the incremental update, use [`database/update_control_plane.sql`](/Users/tht0021/Documents/kanban-coding-agents/database/update_control_plane.sql).
The rollout notes and validation queries are in [`supabase.md`](/Users/tht0021/Documents/kanban-coding-agents/supabase.md).

The schema now includes:

- `agents`
  - identity, transport, runtime location, Telegram label, presence, API key hash
- `tasks`
  - sprint plus assignment to an agent
- `agent_messages`
  - global, direct, and task-scoped messages

## Environment Variables

For local dev and Vercel:

```bash
NEXT_PUBLIC_SUPABASE_URL=...
NEXT_PUBLIC_SUPABASE_ANON_KEY=...
SUPABASE_SERVICE_ROLE_KEY=...
```

`SUPABASE_SERVICE_ROLE_KEY` is required for the server API routes that authenticate external agents by `x-agent-key`.

## Local Development

```bash
npm install
npm run dev
```

Open `http://localhost:3000`.

## Adding Your Third Agent

In the web app:

1. Click `Add Agent`.
2. Set the agent name, runtime location, and Telegram bot label if relevant.
3. Copy the one-time generated key.
4. Put that key on the VM as `AGENT_KEY`.
5. Point the VM worker at your deployed app with `CONTROL_PLANE_URL`.

The example worker is in [`examples/agent-control-plane.js`](/Users/tht0021/Documents/kanban-coding-agents/examples/agent-control-plane.js).

Example:

```bash
CONTROL_PLANE_URL=https://your-vercel-app.vercel.app \
AGENT_KEY=agent_xxx \
node examples/agent-control-plane.js
```

## Adding An OpenClaw Agent

Use the same process for an OpenClaw worker on Desktop, Documents, or a VM:

1. Open the dashboard and click `Add Agent`.
2. Set a clear name such as `OpenClaw Desktop`, `OpenClaw Documents`, or `OpenClaw VM`.
3. Set `Runtime location` to the host it runs on.
4. Set the Telegram bot field to the bot username or label that OpenClaw uses.
5. Pick `Telegram-connected worker` if that OpenClaw instance is driven by Telegram.
6. Copy the one-time key and store it on that host as `AGENT_KEY`.

Then point that OpenClaw host at the control plane:

```bash
CONTROL_PLANE_URL=https://your-vercel-app.vercel.app
AGENT_KEY=agent_xxx
```

What the OpenClaw side needs to do:

- call `GET /api/agent/bootstrap` on startup
- call `POST /api/agent/heartbeat` periodically
- call `GET /api/agent/tasks?includeBacklog=true` to see assigned or open work
- call `PATCH /api/agent/tasks/:taskId` to claim or update a task
- call `POST /api/agent/messages` to send progress or agent-to-agent notes

If you want, the next step is to add a small OpenClaw adapter on each machine that maps Telegram bot activity into these control-plane endpoints.

## Notes

- The old README described this as a localStorage-only board. That is no longer accurate.
- Presence is polling-based right now, not WebSocket realtime.
- The generated agent key is shown once. Only its hash is stored.
