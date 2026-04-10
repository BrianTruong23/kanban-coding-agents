/*
  Minimal external agent loop for the Vercel control plane.

  Required env vars:
  - CONTROL_PLANE_URL=https://your-app.vercel.app
  - AGENT_KEY=agent_xxx
*/

const baseUrl = process.env.CONTROL_PLANE_URL;
const agentKey = process.env.AGENT_KEY;

if (!baseUrl || !agentKey) {
  throw new Error('Missing CONTROL_PLANE_URL or AGENT_KEY');
}

const headers = {
  'content-type': 'application/json',
  'x-agent-key': agentKey,
};

async function api(path, init = {}) {
  const response = await fetch(`${baseUrl}${path}`, {
    ...init,
    headers: {
      ...headers,
      ...(init.headers || {}),
    },
  });

  const payload = await response.json();
  if (!response.ok) {
    throw new Error(payload.error || `Request failed: ${response.status}`);
  }
  return payload;
}

async function main() {
  const bootstrap = await api('/api/agent/bootstrap');
  console.log(`Connected as ${bootstrap.agent.name}`);

  await api('/api/agent/heartbeat', {
    method: 'POST',
    body: JSON.stringify({
      status: 'online',
      metadata: {
        pid: process.pid,
        platform: process.platform,
      },
    }),
  });

  const tasks = await api('/api/agent/tasks?includeBacklog=true');
  console.log(`Visible tasks: ${tasks.tasks.length}`);

  const nextTask = tasks.tasks.find((task) => task.assigned_agent_id === bootstrap.agent.id) || tasks.tasks[0];
  if (!nextTask) return;

  await api(`/api/agent/tasks/${nextTask.id}`, {
    method: 'PATCH',
    body: JSON.stringify({
      claim: true,
      status: 'in-progress',
      message: `Picked up ${nextTask.task_id} from the shared control plane.`,
    }),
  });

  await api('/api/agent/messages', {
    method: 'POST',
    body: JSON.stringify({
      taskId: nextTask.id,
      body: `Starting work on ${nextTask.task_id}. I will post an update when the patch is ready.`,
    }),
  });

  console.log(`Working on ${nextTask.task_id}`);
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
