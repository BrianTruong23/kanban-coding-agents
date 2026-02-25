import { Task } from '@/types/task';
import { CodingAgent } from '@/types/agent';
import { X, MessageCircle, Paperclip, ArrowUp, ArrowDown, Minus, AlertTriangle, CheckCircle2, FileText, Clock } from 'lucide-react';
import clsx from 'clsx';
import { getInitials, getAvatarColor } from '@/lib/utils';
import { useState } from 'react';

interface TaskItemProps {
  task: Task;
  agents: CodingAgent[];
  onUpdate: (task: Task) => void;
  onDelete: (id: string) => void;
}

export const TaskItem = ({ task, agents, onDelete }: TaskItemProps) => {
  const [showDetails, setShowDetails] = useState(false);
  const assignedAgent = agents.find(a => a.id === task.assignedAgentId);

  const tagColors: { [key: string]: string } = {
    'frontend': 'bg-blue-100 text-blue-700 border-blue-200 dark:bg-blue-900/40 dark:text-blue-300 dark:border-blue-800',
    'backend': 'bg-green-100 text-green-700 border-green-200 dark:bg-green-900/40 dark:text-green-300 dark:border-green-800',
    'bug': 'bg-red-100 text-red-700 border-red-200 dark:bg-red-900/40 dark:text-red-300 dark:border-red-800',
    'feature': 'bg-purple-100 text-purple-700 border-purple-200 dark:bg-purple-900/40 dark:text-purple-300 dark:border-purple-800',
    'urgent': 'bg-orange-100 text-orange-700 border-orange-200 dark:bg-orange-900/40 dark:text-orange-300 dark:border-orange-800',
    'api': 'bg-indigo-100 text-indigo-700 border-indigo-200 dark:bg-indigo-900/40 dark:text-indigo-300 dark:border-indigo-800',
    'ui': 'bg-pink-100 text-pink-700 border-pink-200 dark:bg-pink-900/40 dark:text-pink-300 dark:border-pink-800',
  };

  const getTagColor = (tag: string): string => {
    const lowerTag = tag.toLowerCase();
    return tagColors[lowerTag] || 'bg-gray-100 text-gray-700 border-gray-200 dark:bg-gray-700 dark:text-gray-300 dark:border-gray-600';
  };

  const getPriorityIcon = (priority: number) => {
    if (priority >= 4) return <ArrowUp size={14} className="text-red-600 dark:text-red-400" />;
    if (priority === 3) return <Minus size={14} className="text-yellow-600 dark:text-yellow-400" />;
    return <ArrowDown size={14} className="text-gray-600 dark:text-gray-400" />;
  };

  const avatarColor = assignedAgent
    ? (assignedAgent.avatarColor || getAvatarColor(assignedAgent.name))
    : 'bg-gray-400';

  const getRiskColor = (risk?: string) => {
    switch (risk) {
      case 'critical':
        return 'text-red-600 dark:text-red-400 bg-red-50 dark:bg-red-900/20';
      case 'high':
        return 'text-orange-600 dark:text-orange-400 bg-orange-50 dark:bg-orange-900/20';
      case 'medium':
        return 'text-yellow-600 dark:text-yellow-400 bg-yellow-50 dark:bg-yellow-900/20';
      default:
        return 'text-green-600 dark:text-green-400 bg-green-50 dark:bg-green-900/20';
    }
  };

  return (
    <div
      className="bg-white dark:bg-gray-700 p-3 rounded-lg shadow-sm border border-gray-200 dark:border-gray-600 group relative hover:shadow-md transition-all cursor-pointer"
      onClick={() => setShowDetails(!showDetails)}
    >
      <button
        onClick={(e) => {
          e.stopPropagation();
          onDelete(task.id);
        }}
        className="absolute top-2 right-2 text-gray-300 dark:text-gray-500 hover:text-red-500 dark:hover:text-red-400 opacity-0 group-hover:opacity-100 transition-opacity z-10"
      >
        <X size={14} />
      </button>

      <div className="pr-6">
        {/* Task ID */}
        <div className="flex items-center gap-2 mb-1">
          <div className="text-xs text-gray-500 dark:text-gray-400 font-mono">{task.taskId}</div>
          {task.sprint && (
            <span className="text-[10px] px-2 py-0.5 rounded-full font-semibold uppercase tracking-wide bg-amber-100 text-amber-800 border border-amber-200 dark:bg-amber-900/40 dark:text-amber-200 dark:border-amber-800">
              {task.sprint}
            </span>
          )}
        </div>

        {/* Title */}
        <h4 className="font-semibold text-sm mb-2 text-gray-900 dark:text-white leading-tight">{task.title}</h4>

        {/* Tags */}
        {task.tags.length > 0 && (
          <div className="flex flex-wrap gap-1 mb-2">
            {task.tags.map((tag, idx) => (
              <span
                key={idx}
                className={clsx(
                  "text-[10px] px-2 py-0.5 rounded font-semibold uppercase border",
                  getTagColor(tag)
                )}
              >
                {tag}
              </span>
            ))}
          </div>
        )}

        {/* Risk Flag */}
        {task.riskLevel && task.riskLevel !== 'low' && (
          <div className={clsx(
            "flex items-center gap-1 px-2 py-1 rounded text-xs font-semibold mb-2",
            getRiskColor(task.riskLevel)
          )}>
            <AlertTriangle size={12} />
            <span className="uppercase">{task.riskLevel} RISK</span>
          </div>
        )}

        {/* Footer with icons and assignee */}
        <div className="flex items-center justify-between mt-3 pt-2 border-t border-gray-100 dark:border-gray-600">
          <div className="flex items-center gap-2">
            {/* Priority Icon */}
            <div className="flex items-center">
              {getPriorityIcon(task.priority)}
            </div>

            {/* DoD indicator */}
            {task.definitionOfDone && task.definitionOfDone.length > 0 && (
              <div className="flex items-center gap-1 text-gray-500 dark:text-gray-400" title="Has Definition of Done">
                <CheckCircle2 size={14} />
              </div>
            )}

            {/* Test notes indicator */}
            {task.testNotes && (
              <div className="flex items-center gap-1 text-gray-500 dark:text-gray-400" title="Has test notes">
                <FileText size={14} />
              </div>
            )}

            {/* Estimated hours */}
            {task.estimatedHours && (
              <div className="flex items-center gap-1 text-gray-500 dark:text-gray-400" title={`Estimated: ${task.estimatedHours}h`}>
                <Clock size={14} />
                <span className="text-xs">{task.estimatedHours}h</span>
              </div>
            )}

            {/* Comments */}
            {task.commentsCount !== undefined && task.commentsCount > 0 && (
              <div className="flex items-center gap-1 text-gray-500 dark:text-gray-400">
                <MessageCircle size={14} />
                <span className="text-xs">{task.commentsCount}</span>
              </div>
            )}

            {/* Attachments */}
            {task.attachmentsCount !== undefined && task.attachmentsCount > 0 && (
              <div className="flex items-center gap-1 text-gray-500 dark:text-gray-400">
                <Paperclip size={14} />
                <span className="text-xs">{task.attachmentsCount}</span>
              </div>
            )}
          </div>

          {/* Assigned Agent Avatar */}
          {assignedAgent && (
            <div
              className={clsx(
                "w-6 h-6 rounded-full flex items-center justify-center text-white text-xs font-semibold",
                avatarColor
              )}
              title={assignedAgent.name}
            >
              {assignedAgent.avatar || getInitials(assignedAgent.name)}
            </div>
          )}
        </div>

        {/* Expanded Details */}
        {showDetails && (
          <div className="mt-3 pt-3 border-t border-gray-200 dark:border-gray-600 space-y-2" onClick={(e) => e.stopPropagation()}>
            {/* Description */}
            {task.description && (
              <div>
                <span className="text-xs font-semibold text-gray-700 dark:text-gray-300">Description:</span>
                <p className="text-xs text-gray-600 dark:text-gray-400 mt-1">{task.description}</p>
              </div>
            )}

            {/* Definition of Done */}
            {task.definitionOfDone && task.definitionOfDone.length > 0 && (
              <div>
                <span className="text-xs font-semibold text-gray-700 dark:text-gray-300">Definition of Done:</span>
                <ul className="list-disc list-inside text-xs text-gray-600 dark:text-gray-400 mt-1 space-y-0.5">
                  {task.definitionOfDone.map((item, idx) => (
                    <li key={idx}>{item}</li>
                  ))}
                </ul>
              </div>
            )}

            {/* Test Notes */}
            {task.testNotes && (
              <div>
                <span className="text-xs font-semibold text-gray-700 dark:text-gray-300">Test Notes:</span>
                <p className="text-xs text-gray-600 dark:text-gray-400 mt-1">{task.testNotes}</p>
              </div>
            )}

            {/* Risk Notes */}
            {task.riskNotes && (
              <div>
                <span className="text-xs font-semibold text-gray-700 dark:text-gray-300">Risk Notes:</span>
                <p className="text-xs text-gray-600 dark:text-gray-400 mt-1">{task.riskNotes}</p>
              </div>
            )}

            {/* Effort Tracking */}
            {(task.estimatedHours || task.actualHours) && (
              <div className="flex gap-4 text-xs">
                {task.estimatedHours && (
                  <div>
                    <span className="font-semibold text-gray-700 dark:text-gray-300">Estimated:</span>
                    <span className="text-gray-600 dark:text-gray-400 ml-1">{task.estimatedHours}h</span>
                  </div>
                )}
                {task.actualHours && (
                  <div>
                    <span className="font-semibold text-gray-700 dark:text-gray-300">Actual:</span>
                    <span className="text-gray-600 dark:text-gray-400 ml-1">{task.actualHours}h</span>
                  </div>
                )}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};
