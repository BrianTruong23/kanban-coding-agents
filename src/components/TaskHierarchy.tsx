'use client';

import { useState } from 'react';
import { Task } from '@/types/task';
import { ChevronRight, ChevronDown, Layers, CheckCircle, AlertTriangle, Clock } from 'lucide-react';
import { CodingAgent } from '@/types/agent';

interface TaskHierarchyProps {
  tasks: Task[];
  agents: CodingAgent[];
  onTaskClick?: (task: Task) => void;
}

interface TaskNode {
  task: Task;
  children: TaskNode[];
  level: number;
}

export const TaskHierarchy = ({ tasks, agents, onTaskClick }: TaskHierarchyProps) => {
  const [expandedNodes, setExpandedNodes] = useState<Set<string>>(new Set());

  // Build hierarchy
  const buildHierarchy = (): TaskNode[] => {
    const epics = tasks.filter((t) => t.taskType === 'epic');
    const taskMap = new Map<string, Task>();
    tasks.forEach((t) => taskMap.set(t.id, t));

    const buildNode = (task: Task, level: number): TaskNode => {
      const children = tasks
        .filter((t) => t.parentTaskId === task.id)
        .sort((a, b) => {
          // Sort by task type (tasks before subtasks) then by priority
          if (a.taskType !== b.taskType) {
            return a.taskType === 'task' ? -1 : 1;
          }
          return b.priority - a.priority;
        })
        .map((child) => buildNode(child, level + 1));

      return { task, children, level };
    };

    return epics.map((epic) => buildNode(epic, 0));
  };

  const toggleNode = (taskId: string) => {
    const newExpanded = new Set(expandedNodes);
    if (newExpanded.has(taskId)) {
      newExpanded.delete(taskId);
    } else {
      newExpanded.add(taskId);
    }
    setExpandedNodes(newExpanded);
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'done':
        return <CheckCircle size={14} className="text-green-500" />;
      case 'in-progress':
        return <Clock size={14} className="text-blue-500" />;
      case 'review':
        return <Clock size={14} className="text-yellow-500" />;
      default:
        return <div className="w-3.5 h-3.5 rounded-full border-2 border-gray-300 dark:border-gray-600" />;
    }
  };

  const getTaskTypeColor = (type?: string): string => {
    switch (type) {
      case 'epic':
        return 'bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-300';
      case 'subtask':
        return 'bg-gray-100 text-gray-700 dark:bg-gray-700/50 dark:text-gray-300';
      default:
        return 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300';
    }
  };

  const getRiskColor = (risk?: string): string => {
    switch (risk) {
      case 'critical':
        return 'text-red-600 dark:text-red-400';
      case 'high':
        return 'text-orange-600 dark:text-orange-400';
      case 'medium':
        return 'text-yellow-600 dark:text-yellow-400';
      default:
        return 'text-green-600 dark:text-green-400';
    }
  };

  const getAgentName = (agentId?: string): string => {
    if (!agentId) return 'Unassigned';
    const agent = agents.find((a) => a.id === agentId);
    return agent?.name || 'Unknown';
  };

  const getAgentColor = (agentId?: string): string => {
    if (!agentId) return 'bg-gray-400';
    const agent = agents.find((a) => a.id === agentId);
    return agent?.avatarColor || 'bg-gray-400';
  };

  const renderNode = (node: TaskNode): JSX.Element => {
    const isExpanded = expandedNodes.has(node.task.id);
    const hasChildren = node.children.length > 0;
    const indent = node.level * 24;

    return (
      <div key={node.task.id} className="select-none">
        <div
          className="flex items-start gap-2 p-3 hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors cursor-pointer group border-b border-gray-100 dark:border-gray-700/50"
          style={{ paddingLeft: `${12 + indent}px` }}
          onClick={() => {
            if (hasChildren) {
              toggleNode(node.task.id);
            }
            if (onTaskClick) {
              onTaskClick(node.task);
            }
          }}
        >
          {/* Expand/Collapse Button */}
          <button
            className="flex-shrink-0 mt-1"
            onClick={(e) => {
              e.stopPropagation();
              if (hasChildren) {
                toggleNode(node.task.id);
              }
            }}
          >
            {hasChildren ? (
              isExpanded ? (
                <ChevronDown size={16} className="text-gray-400" />
              ) : (
                <ChevronRight size={16} className="text-gray-400" />
              )
            ) : (
              <div className="w-4" />
            )}
          </button>

          {/* Status Icon */}
          <div className="flex-shrink-0 mt-1">{getStatusIcon(node.task.status)}</div>

          {/* Task Info */}
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 flex-wrap">
              {/* Task ID */}
              <span className="font-mono text-xs text-gray-500 dark:text-gray-400">
                {node.task.taskId}
              </span>

              {/* Task Type Badge */}
              <span
                className={`px-2 py-0.5 rounded text-xs font-semibold ${getTaskTypeColor(
                  node.task.taskType
                )}`}
              >
                {(node.task.taskType || 'task').toUpperCase()}
              </span>

              {/* Priority */}
              {node.task.priority >= 4 && (
                <span className="text-xs font-semibold text-red-600 dark:text-red-400">
                  P{node.task.priority}
                </span>
              )}

              {/* Risk Flag */}
              {node.task.riskLevel && node.task.riskLevel !== 'low' && (
                <div className={`flex items-center gap-1 ${getRiskColor(node.task.riskLevel)}`}>
                  <AlertTriangle size={12} />
                  <span className="text-xs font-medium">{node.task.riskLevel}</span>
                </div>
              )}
            </div>

            {/* Task Title */}
            <div className="font-medium text-gray-900 dark:text-white mt-1 group-hover:text-blue-600 dark:group-hover:text-blue-400">
              {node.task.title}
            </div>

            {/* Metadata */}
            <div className="flex items-center gap-3 mt-2 text-xs text-gray-500 dark:text-gray-400">
              {/* Agent */}
              {node.task.assignedAgentId && (
                <div className="flex items-center gap-1.5">
                  <div
                    className={`${getAgentColor(
                      node.task.assignedAgentId
                    )} text-white rounded-full w-5 h-5 flex items-center justify-center text-xs font-bold`}
                  >
                    {getAgentName(node.task.assignedAgentId)
                      .split(' ')
                      .map((n) => n[0])
                      .join('')
                      .toUpperCase()}
                  </div>
                  <span>{getAgentName(node.task.assignedAgentId)}</span>
                </div>
              )}

              {/* Sprint */}
              {node.task.sprint && (
                <span className="bg-gray-100 dark:bg-gray-700 px-2 py-0.5 rounded">
                  {node.task.sprint}
                </span>
              )}

              {/* Estimated Hours */}
              {node.task.estimatedHours && (
                <span className="flex items-center gap-1">
                  <Clock size={12} />
                  {node.task.estimatedHours}h
                </span>
              )}

              {/* Tags */}
              {node.task.tags && node.task.tags.length > 0 && (
                <span className="text-gray-400">• {node.task.tags.join(', ')}</span>
              )}

              {/* Child Count */}
              {hasChildren && (
                <span className="font-medium text-blue-600 dark:text-blue-400">
                  {node.children.length} {node.children.length === 1 ? 'item' : 'items'}
                </span>
              )}
            </div>

            {/* Definition of Done (if epic or expanded task) */}
            {isExpanded && node.task.definitionOfDone && (
              <div className="mt-2 p-2 bg-blue-50 dark:bg-blue-900/20 rounded text-xs">
                <div className="font-semibold text-gray-700 dark:text-gray-300 mb-1">
                  Definition of Done:
                </div>
                <div className="text-gray-600 dark:text-gray-400 whitespace-pre-line">
                  {node.task.definitionOfDone}
                </div>
              </div>
            )}

            {/* Test Notes (if expanded) */}
            {isExpanded && node.task.testNotes && (
              <div className="mt-2 p-2 bg-green-50 dark:bg-green-900/20 rounded text-xs">
                <div className="font-semibold text-gray-700 dark:text-gray-300 mb-1">
                  Test Notes:
                </div>
                <div className="text-gray-600 dark:text-gray-400 whitespace-pre-line">
                  {node.task.testNotes}
                </div>
              </div>
            )}

            {/* Risk Notes (if expanded and has risk) */}
            {isExpanded && node.task.riskNotes && (
              <div className="mt-2 p-2 bg-orange-50 dark:bg-orange-900/20 rounded text-xs">
                <div className="font-semibold text-gray-700 dark:text-gray-300 mb-1 flex items-center gap-1">
                  <AlertTriangle size={12} />
                  Risk Notes:
                </div>
                <div className="text-gray-600 dark:text-gray-400 whitespace-pre-line">
                  {node.task.riskNotes}
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Render children */}
        {isExpanded && hasChildren && (
          <div className="bg-gray-50/50 dark:bg-gray-800/50">
            {node.children.map((child) => renderNode(child))}
          </div>
        )}
      </div>
    );
  };

  const hierarchy = buildHierarchy();

  if (hierarchy.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center h-64 text-gray-400 dark:text-gray-500">
        <Layers size={48} className="mb-2 opacity-50" />
        <p>No epics found</p>
        <p className="text-sm mt-1">Create an epic to organize your tasks</p>
      </div>
    );
  }

  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 overflow-hidden">
      <div className="p-4 border-b border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800/50">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Layers size={20} className="text-gray-600 dark:text-gray-400" />
            <h3 className="font-bold text-gray-900 dark:text-white">Task Hierarchy</h3>
          </div>
          <div className="flex items-center gap-2 text-xs text-gray-500 dark:text-gray-400">
            <span>{hierarchy.length} epic(s)</span>
            <span>•</span>
            <span>{tasks.filter((t) => t.taskType === 'task').length} task(s)</span>
            <span>•</span>
            <span>{tasks.filter((t) => t.taskType === 'subtask').length} subtask(s)</span>
          </div>
        </div>
      </div>
      <div className="overflow-y-auto max-h-[800px]">{hierarchy.map((node) => renderNode(node))}</div>
    </div>
  );
};
