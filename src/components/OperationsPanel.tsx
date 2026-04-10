'use client';

import { useMemo, useState } from 'react';
import { CodingAgent } from '@/types/agent';
import { Task } from '@/types/task';
import { AgentMessage } from '@/types/message';
import { formatRelativeTime, getAvatarColor, getInitials, slugify } from '@/lib/utils';
import clsx from 'clsx';
import { Plus, Radio, Send, X } from 'lucide-react';

interface OperationsPanelProps {
  agents: CodingAgent[];
  tasks: Task[];
  messages: AgentMessage[];
  onAddAgent: (agent: CodingAgent, apiKeyHash?: string) => Promise<CodingAgent | null>;
  onSendMessage: (input: { body: string; toAgentId?: string; taskId?: string }) => Promise<void>;
  isSendingMessage: boolean;
}

const statusTone: Record<string, string> = {
  online: 'bg-emerald-500',
  idle: 'bg-amber-500',
  busy: 'bg-blue-500',
  offline: 'bg-slate-400',
};

const hashValue = async (value: string) => {
  const encoded = new TextEncoder().encode(value);
  const digest = await crypto.subtle.digest('SHA-256', encoded);
  return Array.from(new Uint8Array(digest))
    .map((byte) => byte.toString(16).padStart(2, '0'))
    .join('');
};

const createAgentSecret = () => {
  const bytes = crypto.getRandomValues(new Uint8Array(18));
  return `agent_${Array.from(bytes).map((byte) => byte.toString(16).padStart(2, '0')).join('')}`;
};

export const OperationsPanel = ({
  agents,
  tasks,
  messages,
  onAddAgent,
  onSendMessage,
  isSendingMessage,
}: OperationsPanelProps) => {
  const [isAddingAgent, setIsAddingAgent] = useState(false);
  const [agentName, setAgentName] = useState('');
  const [agentDescription, setAgentDescription] = useState('');
  const [runtimeLocation, setRuntimeLocation] = useState('');
  const [telegramBot, setTelegramBot] = useState('');
  const [transport, setTransport] = useState<'telegram' | 'http'>('telegram');
  const [agentError, setAgentError] = useState<string | null>(null);
  const [createdSecret, setCreatedSecret] = useState<string | null>(null);
  const [createdAgent, setCreatedAgent] = useState<CodingAgent | null>(null);

  const [messageBody, setMessageBody] = useState('');
  const [messageTarget, setMessageTarget] = useState('');
  const [messageTask, setMessageTask] = useState('');

  const taskMap = useMemo(() => new Map(tasks.map((task) => [task.id, task])), [tasks]);
  const agentMap = useMemo(() => new Map(agents.map((agent) => [agent.id, agent])), [agents]);

  const handleCreateAgent = async (event: React.FormEvent) => {
    event.preventDefault();
    setAgentError(null);

    try {
      const secret = createAgentSecret();
      const hash = await hashValue(secret);
      const slug = slugify(agentName);
      const preview = `${secret.slice(0, 10)}...${secret.slice(-4)}`;

      const created = await onAddAgent({
        id: '',
        name: agentName.trim(),
        slug,
        description: agentDescription.trim() || undefined,
        avatar: getInitials(agentName.trim()),
        avatarColor: getAvatarColor(agentName.trim()),
        agentType: 'external',
        transport,
        runtimeLocation: runtimeLocation.trim() || undefined,
        telegramBot: telegramBot.trim() || undefined,
        status: 'offline',
        apiKeyPreview: preview,
        metadata: {
          source: 'vercel-control-plane',
        },
        createdAt: Date.now(),
      }, hash);

      setCreatedSecret(secret);
      setCreatedAgent(created);
      setAgentName('');
      setAgentDescription('');
      setRuntimeLocation('');
      setTelegramBot('');
      setTransport('telegram');
      setIsAddingAgent(false);
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Failed to create agent';
      setAgentError(message);
    }
  };

  const handleSendMessage = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!messageBody.trim()) return;

    await onSendMessage({
      body: messageBody.trim(),
      toAgentId: messageTarget || undefined,
      taskId: messageTask || undefined,
    });

    setMessageBody('');
    setMessageTask('');
  };

  return (
    <aside className="w-full xl:w-[380px] shrink-0 rounded-2xl border border-gray-200 dark:border-gray-700 bg-white/90 dark:bg-gray-800/90 backdrop-blur-sm p-4 flex flex-col gap-4 overflow-hidden">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-lg font-semibold text-gray-900 dark:text-white">Control Plane</h2>
          <p className="text-xs text-gray-500 dark:text-gray-400">Register agents, dispatch work, review cross-agent chatter.</p>
        </div>
        <button
          onClick={() => {
            setIsAddingAgent(true);
            setCreatedSecret(null);
          }}
          className="inline-flex items-center gap-2 rounded-lg bg-black text-white dark:bg-white dark:text-black px-3 py-2 text-sm font-medium"
        >
          <Plus size={14} />
          Add Agent
        </button>
      </div>

      {createdSecret && createdAgent && (
        <div className="rounded-xl border border-emerald-200 bg-emerald-50 dark:border-emerald-800 dark:bg-emerald-950/40 p-3 text-sm">
          <div className="font-semibold text-emerald-900 dark:text-emerald-200">One-time agent key</div>
          <div className="mt-2 rounded-md bg-black text-green-300 p-2 font-mono text-xs break-all">{createdSecret}</div>
          <div className="mt-2 text-xs text-emerald-800 dark:text-emerald-300">
            Use header <code>x-agent-key</code> with this key. Store it on the machine because the hash only is saved.
          </div>
          <div className="mt-2 text-xs text-emerald-800 dark:text-emerald-300">
            Bootstrap URL: <code>/api/agent/bootstrap</code> for <strong>{createdAgent.name}</strong>
          </div>
        </div>
      )}

      <section className="rounded-xl border border-gray-200 dark:border-gray-700 p-3">
        <div className="flex items-center justify-between mb-3">
          <h3 className="text-sm font-semibold text-gray-900 dark:text-white">Agents</h3>
          <span className="text-xs text-gray-500 dark:text-gray-400">{agents.length} total</span>
        </div>
        <div className="space-y-2 max-h-[280px] overflow-y-auto pr-1">
          {agents.map((agent) => {
            const assignedCount = tasks.filter((task) => task.assignedAgentId === agent.id).length;
            return (
              <div key={agent.id} className="rounded-lg border border-gray-200 dark:border-gray-700 px-3 py-2">
                <div className="flex items-start justify-between gap-3">
                  <div className="flex items-center gap-2 min-w-0">
                    <div
                      className={clsx(
                        'w-8 h-8 rounded-full flex items-center justify-center text-xs font-semibold text-white',
                        agent.avatarColor || getAvatarColor(agent.name)
                      )}
                    >
                      {agent.avatar || getInitials(agent.name)}
                    </div>
                    <div className="min-w-0">
                      <div className="text-sm font-medium text-gray-900 dark:text-white truncate">{agent.name}</div>
                      <div className="text-[11px] text-gray-500 dark:text-gray-400 truncate">
                        {agent.runtimeLocation || 'No runtime location'} · {agent.transport || 'web'}
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-1 text-[11px] uppercase font-semibold text-gray-500 dark:text-gray-400">
                    <span className={clsx('w-2 h-2 rounded-full', statusTone[agent.status || 'offline'])} />
                    {agent.status || 'offline'}
                  </div>
                </div>
                <div className="mt-2 flex items-center justify-between text-[11px] text-gray-500 dark:text-gray-400">
                  <span>{assignedCount} assigned</span>
                  <span>{formatRelativeTime(agent.lastSeenAt)}</span>
                </div>
                {(agent.telegramBot || agent.apiKeyPreview) && (
                  <div className="mt-1 text-[11px] text-gray-500 dark:text-gray-400">
                    {agent.telegramBot ? `Bot: ${agent.telegramBot}` : agent.apiKeyPreview}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </section>

      <section className="rounded-xl border border-gray-200 dark:border-gray-700 p-3 flex flex-col gap-3">
        <div>
          <h3 className="text-sm font-semibold text-gray-900 dark:text-white">Dispatch Message</h3>
          <p className="text-xs text-gray-500 dark:text-gray-400">Broadcast to everyone or target one agent and one task.</p>
        </div>

        <form className="space-y-2" onSubmit={handleSendMessage}>
          <select
            value={messageTarget}
            onChange={(event) => setMessageTarget(event.target.value)}
            className="w-full rounded-lg border border-gray-200 dark:border-gray-600 bg-white dark:bg-gray-700 px-3 py-2 text-sm"
          >
            <option value="">Broadcast to all agents</option>
            {agents.map((agent) => (
              <option key={agent.id} value={agent.id}>
                {agent.name}
              </option>
            ))}
          </select>
          <select
            value={messageTask}
            onChange={(event) => setMessageTask(event.target.value)}
            className="w-full rounded-lg border border-gray-200 dark:border-gray-600 bg-white dark:bg-gray-700 px-3 py-2 text-sm"
          >
            <option value="">No task context</option>
            {tasks.map((task) => (
              <option key={task.id} value={task.id}>
                {task.taskId} · {task.title}
              </option>
            ))}
          </select>
          <textarea
            value={messageBody}
            onChange={(event) => setMessageBody(event.target.value)}
            placeholder="Example: VM agent, take TASK-12. Desktop agent, review the patch once it lands."
            className="min-h-[88px] w-full rounded-lg border border-gray-200 dark:border-gray-600 bg-white dark:bg-gray-700 px-3 py-2 text-sm resize-none"
          />
          <button
            type="submit"
            disabled={isSendingMessage || !messageBody.trim()}
            className="inline-flex items-center gap-2 rounded-lg bg-sky-600 text-white px-3 py-2 text-sm font-medium disabled:opacity-50"
          >
            <Send size={14} />
            Send
          </button>
        </form>
      </section>

      <section className="rounded-xl border border-gray-200 dark:border-gray-700 p-3 flex-1 min-h-0">
        <div className="flex items-center justify-between mb-3">
          <h3 className="text-sm font-semibold text-gray-900 dark:text-white">Recent Messages</h3>
          <Radio size={14} className="text-gray-400" />
        </div>
        <div className="space-y-2 overflow-y-auto max-h-[320px] pr-1">
          {messages.map((message) => {
            const fromAgent = message.fromAgentId ? agentMap.get(message.fromAgentId) : null;
            const toAgent = message.toAgentId ? agentMap.get(message.toAgentId) : null;
            const task = message.taskId ? taskMap.get(message.taskId) : null;

            return (
              <div key={message.id} className="rounded-lg border border-gray-200 dark:border-gray-700 p-3">
                <div className="flex items-center justify-between gap-2">
                  <div className="text-xs font-semibold text-gray-700 dark:text-gray-200">
                    {fromAgent?.name || (message.createdBy === 'user' ? 'Dispatcher' : 'System')}
                    {toAgent ? ` → ${toAgent.name}` : ' → all'}
                  </div>
                  <div className="text-[11px] text-gray-500 dark:text-gray-400">{formatRelativeTime(message.createdAt)}</div>
                </div>
                {task && (
                  <div className="mt-1 text-[11px] uppercase tracking-wide text-sky-600 dark:text-sky-400">
                    {task.taskId} · {task.title}
                  </div>
                )}
                <div className="mt-2 text-sm text-gray-800 dark:text-gray-200 whitespace-pre-wrap">{message.body}</div>
              </div>
            );
          })}
          {messages.length === 0 && (
            <div className="text-sm text-gray-500 dark:text-gray-400">No messages yet.</div>
          )}
        </div>
      </section>

      {isAddingAgent && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm p-4 flex items-center justify-center" onClick={() => setIsAddingAgent(false)}>
          <div className="w-full max-w-lg rounded-2xl bg-white dark:bg-gray-800 p-6 shadow-2xl" onClick={(event) => event.stopPropagation()}>
            <div className="flex items-center justify-between mb-4">
              <div>
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Register External Agent</h3>
                <p className="text-sm text-gray-500 dark:text-gray-400">Use this for desktop, Documents, or VM workers that will call the Vercel API.</p>
              </div>
              <button onClick={() => setIsAddingAgent(false)} className="text-gray-400 hover:text-gray-700 dark:hover:text-gray-200">
                <X size={18} />
              </button>
            </div>

            <form className="space-y-3" onSubmit={handleCreateAgent}>
              <input
                required
                value={agentName}
                onChange={(event) => setAgentName(event.target.value)}
                placeholder="Agent name"
                className="w-full rounded-lg border border-gray-200 dark:border-gray-600 bg-white dark:bg-gray-700 px-3 py-2 text-sm"
              />
              <textarea
                value={agentDescription}
                onChange={(event) => setAgentDescription(event.target.value)}
                placeholder="What this worker is responsible for"
                className="min-h-[78px] w-full rounded-lg border border-gray-200 dark:border-gray-600 bg-white dark:bg-gray-700 px-3 py-2 text-sm resize-none"
              />
              <input
                value={runtimeLocation}
                onChange={(event) => setRuntimeLocation(event.target.value)}
                placeholder="Runtime location, e.g. Desktop Mac mini or Ubuntu VM"
                className="w-full rounded-lg border border-gray-200 dark:border-gray-600 bg-white dark:bg-gray-700 px-3 py-2 text-sm"
              />
              <input
                value={telegramBot}
                onChange={(event) => setTelegramBot(event.target.value)}
                placeholder="Telegram bot username or label"
                className="w-full rounded-lg border border-gray-200 dark:border-gray-600 bg-white dark:bg-gray-700 px-3 py-2 text-sm"
              />
              <select
                value={transport}
                onChange={(event) => setTransport(event.target.value as 'telegram' | 'http')}
                className="w-full rounded-lg border border-gray-200 dark:border-gray-600 bg-white dark:bg-gray-700 px-3 py-2 text-sm"
              >
                <option value="telegram">Telegram-connected worker</option>
                <option value="http">HTTP-only worker</option>
              </select>
              {agentError && (
                <div className="rounded-lg border border-red-200 bg-red-50 p-2 text-sm text-red-700 dark:border-red-800 dark:bg-red-950/40 dark:text-red-300">
                  {agentError}
                </div>
              )}
              <div className="flex justify-end gap-2 pt-2">
                <button type="button" onClick={() => setIsAddingAgent(false)} className="px-4 py-2 text-sm text-gray-600 dark:text-gray-300">
                  Cancel
                </button>
                <button type="submit" className="rounded-lg bg-black text-white dark:bg-white dark:text-black px-4 py-2 text-sm font-medium">
                  Create Agent
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </aside>
  );
};
