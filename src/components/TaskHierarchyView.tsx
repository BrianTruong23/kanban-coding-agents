'use client';

import { useState } from 'react';
import { Task } from '@/types/task';
import { CodingAgent } from '@/types/agent';
import { ChevronRight, ChevronDown, AlertTriangle, CheckCircle2, Circle } from 'lucide-react';

interface TaskHierarchyViewProps {
  tasks: Task[];
  agents: CodingAgent[];
  onTaskClick?: (task: Task) => void;
}

export const TaskHierarchyView = ({ tasks, agents, onTaskClick }: TaskHierarchyViewProps) => {
  const [expandedTasks, setExpandedTasks] = useState<Set<string>>(new Set());

  const toggleExpand = (taskId: string) => {
    const newExpanded = new Set(expandedTasks);
    if (newExpanded.has(taskId)) {
      newExpanded.delete(taskId);
    } else {
      newExpanded.add(taskId);
    }
    setExpandedTasks(newExpanded);
  };

  // Organize tasks by hierarchy
  const epics = tasks.filter((t) => t.type === 'epic');
  const getChildTasks = (parentId: string, type?: 'ticket' | 'subtask') => {
    return tasks.filter((t) => t.parentTaskId === parentId && (!type || t.type === type));
  };

  const getTaskStatusIcon = (status: string) => {
    switch (status) {
      case 'done':
        return <CheckCircle2 size={16} className="text-green-500" />;
      case 'in-progress':
        return <Circle size={16} className="text-blue-500 fill-blue-500" />;
      case 'review':
        return <Circle size={16} className="text-purple-500 fill-purple-500" />;
      default:
        return <Circle size={16} className="text-gray-400" />;
    }
  };

  const getAgentInfo = (agentId?: string) => {
    if (!agentId) return null;
    return agents.find((a) => a.id === agentId);
  };

  const renderSubtask = (subtask: Task, level: number = 0) => {
    const agent = getAgentInfo(subtask.assignedAgentId);

    return (
      <div
        key={subtask.id}
        className="flex items-center gap-2 p-2 hover:bg-gray-50 dark:hover:bg-gray-700/50 rounded cursor-pointer"
        style={{ paddingLeft: `${level * 24 + 16}px` }}
        onClick={() => onTaskClick?.(subtask)}
      >
        {getTaskStatusIcon(subtask.status)}
        <span className="text-xs font-mono text-gray-500 dark:text-gray-400">
          {subtask.taskId}
        </span>
        <span className="text-sm text-gray-700 dark:text-gray-300 flex-1">
          {subtask.title}
        </span>
        {agent && (
          <div
            className={`w-6 h-6 rounded-full ${agent.avatarColor || 'bg-gray-400'} flex items-center justify-center text-white text-xs font-semibold`}
            title={agent.name}
          >
            {agent.name
              .split(' ')
              .map((n) => n[0])
              .join('')}
          </div>
        )}
      </div>
    );
  };

  const renderTicket = (ticket: Task, level: number = 1) => {
    const isExpanded = expandedTasks.has(ticket.id);
    const subtasks = getChildTasks(ticket.id, 'subtask');
    const hasChildren = subtasks.length > 0;
    const agent = getAgentInfo(ticket.assignedAgentId);
    const completedSubtasks = subtasks.filter((st) => st.status === 'done').length;

    return (
      <div key={ticket.id}>
        <div
          className="flex items-center gap-2 p-3 hover:bg-blue-50 dark:hover:bg-blue-900/20 rounded cursor-pointer border border-blue-200 dark:border-blue-800 mb-2"
          style={{ paddingLeft: `${level * 24}px` }}
          onClick={() => {
            if (hasChildren) {
              toggleExpand(ticket.id);
            }
            onTaskClick?.(ticket);
          }}
        >
          {hasChildren && (
            <button
              onClick={(e) => {
                e.stopPropagation();
                toggleExpand(ticket.id);
              }}
              className="text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200"
            >
              {isExpanded ? <ChevronDown size={16} /> : <ChevronRight size={16} />}
            </button>
          )}
          {!hasChildren && <div className="w-4" />}

          {getTaskStatusIcon(ticket.status)}

          <span className="bg-blue-100 dark:bg-blue-900/30 text-blue-800 dark:text-blue-300 px-2 py-0.5 rounded text-xs font-semibold">
            TICKET
          </span>
          <span className="text-xs font-mono text-gray-500 dark:text-gray-400">
            {ticket.taskId}
          </span>
          <span className="text-sm font-medium text-gray-900 dark:text-white flex-1">
            {ticket.title}
          </span>

          {hasChildren && (
            <span className="text-xs text-gray-500 dark:text-gray-400">
              {completedSubtasks}/{subtasks.length}
            </span>
          )}

          {ticket.estimatedHours && (
            <span className="text-xs text-gray-500 dark:text-gray-400">
              {ticket.estimatedHours}h
            </span>
          )}

          {agent && (
            <div
              className={`w-6 h-6 rounded-full ${agent.avatarColor || 'bg-gray-400'} flex items-center justify-center text-white text-xs font-semibold`}
              title={agent.name}
            >
              {agent.name
                .split(' ')
                .map((n) => n[0])
                .join('')}
            </div>
          )}
        </div>

        {isExpanded && hasChildren && (
          <div className="ml-4 space-y-1 mb-2">
            {subtasks.map((subtask) => renderSubtask(subtask, level + 1))}
          </div>
        )}
      </div>
    );
  };

  const renderEpic = (epic: Task) => {
    const isExpanded = expandedTasks.has(epic.id);
    const tickets = getChildTasks(epic.id, 'ticket');
    const allSubtasks = tickets.flatMap((t) => getChildTasks(t.id, 'subtask'));
    const totalTasks = tickets.length + allSubtasks.length;
    const completedTasks =
      tickets.filter((t) => t.status === 'done').length +
      allSubtasks.filter((st) => st.status === 'done').length;
    const progress = totalTasks > 0 ? (completedTasks / totalTasks) * 100 : 0;
    const hasRisks = epic.riskFlags && epic.riskFlags.length > 0;

    return (
      <div key={epic.id} className="mb-6">
        <div
          className="flex items-center gap-3 p-4 bg-purple-50 dark:bg-purple-900/20 border-2 border-purple-200 dark:border-purple-800 rounded-lg cursor-pointer hover:border-purple-300 dark:hover:border-purple-700 transition-colors"
          onClick={() => {
            toggleExpand(epic.id);
            onTaskClick?.(epic);
          }}
        >
          <button
            onClick={(e) => {
              e.stopPropagation();
              toggleExpand(epic.id);
            }}
            className="text-purple-600 dark:text-purple-400 hover:text-purple-800 dark:hover:text-purple-200"
          >
            {isExpanded ? <ChevronDown size={20} /> : <ChevronRight size={20} />}
          </button>

          {getTaskStatusIcon(epic.status)}

          <span className="bg-purple-600 text-white px-3 py-1 rounded text-sm font-bold">
            EPIC
          </span>
          <span className="text-sm font-mono text-purple-700 dark:text-purple-300">
            {epic.taskId}
          </span>
          <h3 className="text-lg font-bold text-gray-900 dark:text-white flex-1">
            {epic.title}
          </h3>

          {hasRisks && (
            <div className="flex items-center gap-1 text-red-600 dark:text-red-400">
              <AlertTriangle size={16} />
              <span className="text-xs font-semibold">
                {epic.riskFlags!.length} risk{epic.riskFlags!.length > 1 ? 's' : ''}
              </span>
            </div>
          )}

          <div className="flex items-center gap-2">
            <div className="w-24 h-2 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
              <div
                className="h-full bg-purple-600 dark:bg-purple-500 transition-all"
                style={{ width: `${progress}%` }}
              />
            </div>
            <span className="text-xs text-gray-600 dark:text-gray-400">
              {Math.round(progress)}%
            </span>
          </div>
        </div>

        {isExpanded && (
          <div className="mt-3 ml-6 space-y-2">
            {tickets.length === 0 ? (
              <div className="text-sm text-gray-500 dark:text-gray-400 p-3 text-center">
                No tickets in this epic
              </div>
            ) : (
              tickets.map((ticket) => renderTicket(ticket))
            )}
          </div>
        )}
      </div>
    );
  };

  // Standalone tickets and subtasks (not part of epics)
  const standaloneTickets = tasks.filter((t) => t.type === 'ticket' && !t.epicId && !t.parentTaskId);
  const standaloneSubtasks = tasks.filter((t) => t.type === 'subtask' && !t.epicId && !t.parentTaskId);

  return (
    <div className="space-y-4">
      {epics.length === 0 && standaloneTickets.length === 0 && standaloneSubtasks.length === 0 ? (
        <div className="text-center py-12 text-gray-500 dark:text-gray-400">
          <p className="mb-2">No hierarchical tasks yet</p>
          <p className="text-sm">Use the task breakdown feature to create epics, tickets, and subtasks</p>
        </div>
      ) : (
        <>
          {epics.map(renderEpic)}

          {standaloneTickets.length > 0 && (
            <div>
              <h3 className="text-sm font-semibold text-gray-500 dark:text-gray-400 mb-2 uppercase tracking-wide">
                Standalone Tickets
              </h3>
              {standaloneTickets.map((ticket) => renderTicket(ticket, 0))}
            </div>
          )}

          {standaloneSubtasks.length > 0 && (
            <div>
              <h3 className="text-sm font-semibold text-gray-500 dark:text-gray-400 mb-2 uppercase tracking-wide">
                Standalone Tasks
              </h3>
              {standaloneSubtasks.map((subtask) => renderSubtask(subtask, 0))}
            </div>
          )}
        </>
      )}
    </div>
  );
};
