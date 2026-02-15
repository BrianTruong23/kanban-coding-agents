'use client';

import { useState } from 'react';
import { X, Loader2, FileText, Image, Code, AlertTriangle } from 'lucide-react';
import { TaskBreakdownInput, BreakdownTask } from '@/types/breakdown';
import { breakdownTask, convertToKanbanTask } from '@/lib/taskBreakdown';
import { Task } from '@/types/task';
import { CodingAgent } from '@/types/agent';
import { autoAssignTasks } from '@/lib/agentOrchestration';

interface TaskBreakdownModalProps {
  isOpen: boolean;
  onClose: () => void;
  onTasksCreated: (tasks: Task[]) => void;
  agents: CodingAgent[];
}

export const TaskBreakdownModal = ({
  isOpen,
  onClose,
  onTasksCreated,
  agents,
}: TaskBreakdownModalProps) => {
  const [inputType, setInputType] = useState<'issue' | 'prd' | 'screenshot' | 'text'>('text');
  const [content, setContent] = useState('');
  const [context, setContext] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);
  const [breakdownResult, setBreakdownResult] = useState<{
    tasks: BreakdownTask[];
    summary: string;
    totalEstimatedHours: number;
  } | null>(null);
  const [selectedTasks, setSelectedTasks] = useState<Set<string>>(new Set());

  if (!isOpen) return null;

  const handleBreakdown = async () => {
    if (!content.trim()) return;

    setIsProcessing(true);
    try {
      const input: TaskBreakdownInput = {
        type: inputType,
        content,
        context: context || undefined,
      };

      const result = await breakdownTask(input);
      setBreakdownResult(result);

      // Auto-assign tasks to agents
      const assignments = autoAssignTasks(result.tasks, agents);
      result.tasks.forEach((task) => {
        const assignedAgentId = assignments.get(task.id);
        if (assignedAgentId) {
          task.suggestedAgentId = assignedAgentId;
          task.assignedAgentId = assignedAgentId;
        }
      });

      // Select all tasks by default
      setSelectedTasks(new Set(result.tasks.map((t) => t.id)));
    } catch (error) {
      console.error('Error breaking down task:', error);
      alert('Failed to break down task. Please try again.');
    } finally {
      setIsProcessing(false);
    }
  };

  const handleCreateTasks = async () => {
    if (!breakdownResult) return;

    const tasksToCreate = breakdownResult.tasks
      .filter((task) => selectedTasks.has(task.id))
      .map((breakdownTask) => {
        const kanbanTask = convertToKanbanTask(breakdownTask);
        return {
          ...kanbanTask,
          assignedAgentId: breakdownTask.assignedAgentId,
        } as Task;
      });

    onTasksCreated(tasksToCreate as Task[]);
    handleClose();
  };

  const handleClose = () => {
    setContent('');
    setContext('');
    setBreakdownResult(null);
    setSelectedTasks(new Set());
    onClose();
  };

  const toggleTaskSelection = (taskId: string) => {
    const newSelection = new Set(selectedTasks);
    if (newSelection.has(taskId)) {
      newSelection.delete(taskId);
    } else {
      newSelection.add(taskId);
    }
    setSelectedTasks(newSelection);
  };

  const getRiskColor = (level: string) => {
    switch (level) {
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

  const getTypeColor = (type: string) => {
    switch (type) {
      case 'epic':
        return 'bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-300';
      case 'story':
        return 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300';
      case 'task':
        return 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300';
      case 'subtask':
        return 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300';
      default:
        return 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300';
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4"
      onClick={handleClose}
    >
      <div
        className="bg-white dark:bg-gray-800 rounded-xl w-full max-w-4xl max-h-[90vh] overflow-hidden shadow-xl flex flex-col"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200 dark:border-gray-700">
          <div>
            <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
              AI Task Breakdown
            </h2>
            <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
              Automatically break down issues, PRDs, or requirements into structured tasks
            </p>
          </div>
          <button
            onClick={handleClose}
            className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
          >
            <X size={24} />
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6">
          {!breakdownResult ? (
            <div className="space-y-6">
              {/* Input Type Selector */}
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">
                  Input Type
                </label>
                <div className="grid grid-cols-4 gap-3">
                  {[
                    { type: 'text', icon: FileText, label: 'Free Text' },
                    { type: 'issue', icon: Code, label: 'GitHub Issue' },
                    { type: 'prd', icon: FileText, label: 'PRD' },
                    { type: 'screenshot', icon: Image, label: 'Screenshot' },
                  ].map(({ type, icon: Icon, label }) => (
                    <button
                      key={type}
                      onClick={() => setInputType(type as any)}
                      className={`p-4 rounded-lg border-2 transition-colors flex flex-col items-center gap-2 ${
                        inputType === type
                          ? 'border-black dark:border-white bg-gray-50 dark:bg-gray-700'
                          : 'border-gray-200 dark:border-gray-600 hover:border-gray-300 dark:hover:border-gray-500'
                      }`}
                    >
                      <Icon size={24} />
                      <span className="text-sm font-medium">{label}</span>
                    </button>
                  ))}
                </div>
              </div>

              {/* Content Input */}
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  {inputType === 'issue' ? 'Issue Description' :
                   inputType === 'prd' ? 'PRD Content' :
                   inputType === 'screenshot' ? 'Screenshot Description' :
                   'Task Description'} *
                </label>
                <textarea
                  className="w-full border border-gray-200 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white p-3 rounded-lg h-48 focus:outline-none focus:ring-2 focus:ring-black/10 dark:focus:ring-white/20 resize-none font-mono text-sm"
                  placeholder={
                    inputType === 'issue'
                      ? 'Paste the issue description here...\n\nExample:\n# User Authentication System\n\nImplement a secure authentication system with login, signup, and OAuth support. Should include JWT tokens, password reset, and email verification.'
                      : inputType === 'prd'
                      ? 'Paste the PRD content here...'
                      : inputType === 'screenshot'
                      ? 'Describe what you see in the screenshot and what needs to be built...'
                      : 'Describe the feature or task you want to break down...\n\nExample:\nBuild a task management dashboard with drag-and-drop functionality, real-time updates, and agent assignment capabilities.'
                  }
                  value={content}
                  onChange={(e) => setContent(e.target.value)}
                  autoFocus
                />
              </div>

              {/* Context Input */}
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Additional Context (Optional)
                </label>
                <textarea
                  className="w-full border border-gray-200 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white p-3 rounded-lg h-24 focus:outline-none focus:ring-2 focus:ring-black/10 dark:focus:ring-white/20 resize-none text-sm"
                  placeholder="Add any additional context, constraints, or requirements..."
                  value={context}
                  onChange={(e) => setContext(e.target.value)}
                />
              </div>

              {/* Actions */}
              <div className="flex justify-end gap-3 pt-4">
                <button
                  onClick={handleClose}
                  className="px-6 py-2.5 text-gray-600 dark:text-gray-400 hover:text-gray-800 dark:hover:text-gray-200 transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={handleBreakdown}
                  disabled={!content.trim() || isProcessing}
                  className="px-6 py-2.5 bg-black dark:bg-white text-white dark:text-black rounded-lg hover:bg-gray-800 dark:hover:bg-gray-200 transition-colors font-medium disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
                >
                  {isProcessing ? (
                    <>
                      <Loader2 size={18} className="animate-spin" />
                      Analyzing...
                    </>
                  ) : (
                    'Breakdown Tasks'
                  )}
                </button>
              </div>
            </div>
          ) : (
            <div className="space-y-6">
              {/* Summary */}
              <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-4">
                <h3 className="text-sm font-semibold text-blue-900 dark:text-blue-300 mb-2">
                  Breakdown Summary
                </h3>
                <p className="text-sm text-blue-800 dark:text-blue-400 whitespace-pre-line">
                  {breakdownResult.summary}
                </p>
              </div>

              {/* Tasks List */}
              <div>
                <div className="flex items-center justify-between mb-3">
                  <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                    Generated Tasks ({breakdownResult.tasks.length})
                  </h3>
                  <button
                    onClick={() => {
                      if (selectedTasks.size === breakdownResult.tasks.length) {
                        setSelectedTasks(new Set());
                      } else {
                        setSelectedTasks(new Set(breakdownResult.tasks.map((t) => t.id)));
                      }
                    }}
                    className="text-sm text-blue-600 dark:text-blue-400 hover:underline"
                  >
                    {selectedTasks.size === breakdownResult.tasks.length
                      ? 'Deselect All'
                      : 'Select All'}
                  </button>
                </div>

                <div className="space-y-3 max-h-96 overflow-y-auto">
                  {breakdownResult.tasks.map((task) => {
                    const agent = agents.find((a) => a.id === task.suggestedAgentId);
                    return (
                      <div
                        key={task.id}
                        className={`border rounded-lg p-4 transition-all cursor-pointer ${
                          selectedTasks.has(task.id)
                            ? 'border-black dark:border-white bg-gray-50 dark:bg-gray-700/50'
                            : 'border-gray-200 dark:border-gray-600 hover:border-gray-300 dark:hover:border-gray-500'
                        }`}
                        onClick={() => toggleTaskSelection(task.id)}
                      >
                        <div className="flex items-start gap-3">
                          <input
                            type="checkbox"
                            checked={selectedTasks.has(task.id)}
                            onChange={() => toggleTaskSelection(task.id)}
                            className="mt-1"
                          />
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2 mb-2">
                              <span
                                className={`px-2 py-0.5 rounded text-xs font-semibold ${getTypeColor(
                                  task.type
                                )}`}
                              >
                                {task.type.toUpperCase()}
                              </span>
                              <span className="text-xs font-mono text-gray-500 dark:text-gray-400">
                                {task.taskId}
                              </span>
                              {task.estimatedHours && (
                                <span className="text-xs text-gray-500 dark:text-gray-400">
                                  ~{task.estimatedHours}h
                                </span>
                              )}
                            </div>
                            <h4 className="font-semibold text-gray-900 dark:text-white mb-1">
                              {task.title}
                            </h4>
                            <p className="text-sm text-gray-600 dark:text-gray-400 mb-2 line-clamp-2">
                              {task.description}
                            </p>

                            {/* Risk Flags */}
                            {task.riskFlags.length > 0 && (
                              <div className="flex items-center gap-2 mb-2">
                                <AlertTriangle size={14} className="text-orange-500" />
                                {task.riskFlags.map((risk, idx) => (
                                  <span
                                    key={idx}
                                    className={`text-xs ${getRiskColor(risk.level)}`}
                                  >
                                    {risk.level.toUpperCase()}: {risk.description}
                                  </span>
                                ))}
                              </div>
                            )}

                            {/* Assigned Agent */}
                            {agent && (
                              <div className="flex items-center gap-2 text-xs text-gray-600 dark:text-gray-400">
                                <span className="font-medium">Suggested:</span>
                                <div
                                  className={`w-5 h-5 rounded-full flex items-center justify-center text-white text-xs font-semibold ${
                                    agent.avatarColor || 'bg-gray-500'
                                  }`}
                                >
                                  {agent.avatar}
                                </div>
                                <span>{agent.name}</span>
                              </div>
                            )}

                            {/* Tags */}
                            {task.tags.length > 0 && (
                              <div className="flex flex-wrap gap-1 mt-2">
                                {task.tags.map((tag) => (
                                  <span
                                    key={tag}
                                    className="px-2 py-0.5 bg-gray-100 dark:bg-gray-600 text-gray-700 dark:text-gray-300 rounded text-xs"
                                  >
                                    {tag}
                                  </span>
                                ))}
                              </div>
                            )}
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Actions */}
              <div className="flex justify-between items-center pt-4 border-t border-gray-200 dark:border-gray-700">
                <button
                  onClick={() => setBreakdownResult(null)}
                  className="text-sm text-gray-600 dark:text-gray-400 hover:text-gray-800 dark:hover:text-gray-200"
                >
                  ← Back to Input
                </button>
                <div className="flex gap-3">
                  <button
                    onClick={handleClose}
                    className="px-6 py-2.5 text-gray-600 dark:text-gray-400 hover:text-gray-800 dark:hover:text-gray-200 transition-colors"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handleCreateTasks}
                    disabled={selectedTasks.size === 0}
                    className="px-6 py-2.5 bg-black dark:bg-white text-white dark:text-black rounded-lg hover:bg-gray-800 dark:hover:bg-gray-200 transition-colors font-medium disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    Create {selectedTasks.size} Task{selectedTasks.size !== 1 ? 's' : ''}
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
