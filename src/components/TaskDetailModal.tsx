'use client';

import { useState } from 'react';
import { Task } from '@/types/task';
import { CodingAgent } from '@/types/agent';
import { X } from 'lucide-react';
import { BudgetManager } from './BudgetManager';
import { TaskBudget } from '@/types/budget';

interface TaskDetailModalProps {
  task: Task;
  agents: CodingAgent[];
  onClose: () => void;
  onUpdate: (task: Task) => void;
}

export const TaskDetailModal = ({ task, agents, onClose, onUpdate }: TaskDetailModalProps) => {
  const [editedTask, setEditedTask] = useState<Task>(task);

  const handleBudgetUpdate = (budget: TaskBudget) => {
    const updatedTask = { ...editedTask, budget };
    setEditedTask(updatedTask);
    onUpdate(updatedTask);
  };

  const handleSave = () => {
    onUpdate(editedTask);
    onClose();
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4"
      onClick={onClose}
    >
      <div
        className="bg-white dark:bg-gray-800 rounded-xl w-full max-w-2xl max-h-[90vh] overflow-y-auto shadow-xl"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="sticky top-0 bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 p-6 flex items-center justify-between">
          <div>
            <div className="text-xs font-mono text-gray-500 dark:text-gray-400 mb-1">
              {task.taskId}
            </div>
            <h2 className="text-xl font-bold text-gray-900 dark:text-white">{task.title}</h2>
          </div>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
          >
            <X size={24} />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 space-y-6">
          {/* Description */}
          <div>
            <h3 className="text-sm font-semibold text-gray-900 dark:text-white mb-2">
              Description
            </h3>
            <p className="text-sm text-gray-700 dark:text-gray-300">
              {task.description || 'No description provided'}
            </p>
          </div>

          {/* Task Info */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <h3 className="text-xs font-semibold text-gray-500 dark:text-gray-400 mb-1">
                Status
              </h3>
              <p className="text-sm text-gray-900 dark:text-white capitalize">
                {task.status.replace('-', ' ')}
              </p>
            </div>
            <div>
              <h3 className="text-xs font-semibold text-gray-500 dark:text-gray-400 mb-1">
                Priority
              </h3>
              <p className="text-sm text-gray-900 dark:text-white">{task.priority}</p>
            </div>
            {task.sprint && (
              <div>
                <h3 className="text-xs font-semibold text-gray-500 dark:text-gray-400 mb-1">
                  Sprint
                </h3>
                <p className="text-sm text-gray-900 dark:text-white">{task.sprint}</p>
              </div>
            )}
            {task.assignedAgentId && (
              <div>
                <h3 className="text-xs font-semibold text-gray-500 dark:text-gray-400 mb-1">
                  Assigned Agent
                </h3>
                <p className="text-sm text-gray-900 dark:text-white">
                  {agents.find((a) => a.id === task.assignedAgentId)?.name || 'Unknown'}
                </p>
              </div>
            )}
          </div>

          {/* Tags */}
          {task.tags.length > 0 && (
            <div>
              <h3 className="text-sm font-semibold text-gray-900 dark:text-white mb-2">Tags</h3>
              <div className="flex flex-wrap gap-2">
                {task.tags.map((tag, idx) => (
                  <span
                    key={idx}
                    className="px-2 py-1 bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded text-xs"
                  >
                    {tag}
                  </span>
                ))}
              </div>
            </div>
          )}

          {/* Budget Management */}
          <div>
            <h3 className="text-sm font-semibold text-gray-900 dark:text-white mb-3">
              Budget & Resources
            </h3>
            <BudgetManager task={editedTask} onUpdateBudget={handleBudgetUpdate} />
          </div>
        </div>

        {/* Footer */}
        <div className="sticky bottom-0 bg-white dark:bg-gray-800 border-t border-gray-200 dark:border-gray-700 p-6 flex justify-end gap-3">
          <button
            onClick={onClose}
            className="px-4 py-2 text-gray-600 dark:text-gray-400 hover:text-gray-800 dark:hover:text-gray-200 transition-colors"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};
