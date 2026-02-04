import { Task } from '@/types/task';
import { CodingAgent } from '@/types/agent';
import { X } from 'lucide-react';
import { getInitials, getAvatarColor } from '@/lib/utils';
import clsx from 'clsx';

interface AgentSelectorProps {
  task: Task;
  agents: CodingAgent[];
  onAssign: (agentId: string | undefined) => void;
}

export const AgentSelector = ({ task, agents, onAssign }: AgentSelectorProps) => {
  const assignedAgent = agents.find(a => a.id === task.assignedAgentId);

  if (assignedAgent) {
    const avatarColor = assignedAgent.avatarColor || getAvatarColor(assignedAgent.name);
    return (
      <div className="flex items-center justify-between p-2 bg-blue-50 dark:bg-blue-900/30 rounded-lg border border-blue-200 dark:border-blue-800">
        <div className="flex items-center gap-2">
          <div
            className={clsx(
              "w-5 h-5 rounded-full flex items-center justify-center text-white text-[10px] font-semibold",
              avatarColor
            )}
          >
            {assignedAgent.avatar || getInitials(assignedAgent.name)}
          </div>
          <span className="text-xs font-medium text-blue-700 dark:text-blue-300">{assignedAgent.name}</span>
        </div>
        <button
          onClick={() => onAssign(undefined)}
          className="text-blue-400 hover:text-blue-600 dark:text-blue-400 dark:hover:text-blue-300"
          title="Unassign agent"
        >
          <X size={14} />
        </button>
      </div>
    );
  }

  return (
    <select
      value=""
      onChange={(e) => onAssign(e.target.value || undefined)}
      className="w-full text-xs border border-gray-200 dark:border-gray-600 rounded-lg p-2 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-blue-500/20 dark:focus:ring-blue-400/20"
    >
      <option value="">Assign to agent...</option>
      {agents.map(agent => (
        <option key={agent.id} value={agent.id}>
          {agent.name}
        </option>
      ))}
    </select>
  );
};
