'use client';

import { useState } from 'react';
import { X, Sparkles, CheckCircle2, AlertTriangle } from 'lucide-react';
import { Task } from '@/types/task';
import { TaskBreakdownService, BreakdownInput } from '@/lib/taskBreakdown';

interface TaskBreakdownModalProps {
  isOpen: boolean;
  onClose: () => void;
  onTasksCreated: (tasks: Task[]) => void;
}

export const TaskBreakdownModal = ({ isOpen, onClose, onTasksCreated }: TaskBreakdownModalProps) => {
  const [input, setInput] = useState('');
  const [inputType, setInputType] = useState<'issue' | 'prd' | 'text'>('text');
  const [isProcessing, setIsProcessing] = useState(false);
  const [breakdown, setBreakdown] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleBreakdown = async () => {
    if (!input.trim()) {
      setError('Please enter some content to break down');
      return;
    }

    setIsProcessing(true);
    setError(null);

    try {
      const breakdownInput: BreakdownInput = {
        type: inputType,
        content: input,
      };

      const result = await TaskBreakdownService.breakdownTask(breakdownInput);
      setBreakdown(result);
    } catch (err) {
      setError('Failed to break down task. Please try again.');
      console.error(err);
    } finally {
      setIsProcessing(false);
    }
  };

  const handleCreateTasks = () => {
    if (!breakdown) return;

    const tasks: Task[] = [
      breakdown.epic as Task,
      ...breakdown.tickets.map((t: any) => t as Task),
      ...breakdown.subtasks.map((s: any) => s as Task),
    ];

    // Add dependencies to tasks
    breakdown.dependencies.forEach((deps: string[], taskId: string) => {
      const task = tasks.find(t => t.id === taskId);
      if (task) {
        task.dependencies = deps.map(depId => ({
          taskId: depId,
          type: 'blocked-by' as const,
        }));
      }
    });

    onTasksCreated(tasks);
    handleClose();
  };

  const handleClose = () => {
    setInput('');
    setBreakdown(null);
    setError(null);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
      <div className="bg-white dark:bg-gray-800 rounded-xl w-full max-w-4xl max-h-[90vh] overflow-hidden flex flex-col shadow-2xl">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200 dark:border-gray-700">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-purple-100 dark:bg-purple-900/30 rounded-lg">
              <Sparkles className="text-purple-600 dark:text-purple-400" size={20} />
            </div>
            <div>
              <h3 className="text-lg font-bold text-gray-900 dark:text-white">
                Automated Task Breakdown
              </h3>
              <p className="text-xs text-gray-500 dark:text-gray-400">
                Paste an issue, PRD, or description to generate epics, tickets, and subtasks
              </p>
            </div>
          </div>
          <button
            onClick={handleClose}
            className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
          >
            <X size={20} />
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6">
          {!breakdown ? (
            <div className="space-y-4">
              {/* Input Type Selector */}
              <div>
                <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Input Type
                </label>
                <div className="flex gap-2">
                  {(['text', 'issue', 'prd'] as const).map(type => (
                    <button
                      key={type}
                      onClick={() => setInputType(type)}
                      className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                        inputType === type
                          ? 'bg-black dark:bg-white text-white dark:text-black'
                          : 'bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-gray-600'
                      }`}
                    >
                      {type.toUpperCase()}
                    </button>
                  ))}
                </div>
              </div>

              {/* Input Area */}
              <div>
                <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Content to Break Down
                </label>
                <textarea
                  className="w-full border border-gray-200 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white p-3 rounded-lg h-64 focus:outline-none focus:ring-2 focus:ring-purple-500 dark:focus:ring-purple-400 resize-none font-mono text-sm"
                  placeholder={`Example:
# Implement User Authentication

## Requirements
- Users should be able to sign up with email/password
- Users should be able to log in
- Implement JWT tokens for session management
- Add password reset functionality

## Acceptance Criteria
- All authentication endpoints working
- Tests passing
- Security best practices followed

## Risks
- Security vulnerabilities if not implemented correctly
- Performance issues with token validation`}
                  value={input}
                  onChange={e => setInput(e.target.value)}
                />
              </div>

              {error && (
                <div className="p-3 bg-red-50 dark:bg-red-900/30 border border-red-200 dark:border-red-800 rounded-lg text-sm text-red-600 dark:text-red-400 flex items-start gap-2">
                  <AlertTriangle size={16} className="flex-shrink-0 mt-0.5" />
                  <span>{error}</span>
                </div>
              )}
            </div>
          ) : (
            <div className="space-y-6">
              {/* Epic */}
              <div className="border border-purple-200 dark:border-purple-800 rounded-lg p-4 bg-purple-50 dark:bg-purple-900/20">
                <div className="flex items-center gap-2 mb-2">
                  <span className="text-xs font-bold text-purple-600 dark:text-purple-400">EPIC</span>
                  <span className="text-xs text-purple-600 dark:text-purple-400">{breakdown.epic.taskId}</span>
                </div>
                <h4 className="font-semibold text-gray-900 dark:text-white mb-1">{breakdown.epic.title}</h4>
                <p className="text-sm text-gray-600 dark:text-gray-400 line-clamp-2">
                  {breakdown.epic.description}
                </p>
                {breakdown.epic.riskFlags && breakdown.epic.riskFlags.length > 0 && (
                  <div className="mt-2 flex flex-wrap gap-1">
                    {breakdown.epic.riskFlags.map((risk: any, idx: number) => (
                      <span
                        key={idx}
                        className={`text-xs px-2 py-0.5 rounded-full ${
                          risk.level === 'critical'
                            ? 'bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-400'
                            : risk.level === 'high'
                            ? 'bg-orange-100 dark:bg-orange-900/30 text-orange-700 dark:text-orange-400'
                            : 'bg-yellow-100 dark:bg-yellow-900/30 text-yellow-700 dark:text-yellow-400'
                        }`}
                      >
                        {risk.level} risk
                      </span>
                    ))}
                  </div>
                )}
              </div>

              {/* Tickets */}
              <div>
                <h5 className="text-sm font-bold text-gray-700 dark:text-gray-300 mb-3">
                  Tickets ({breakdown.tickets.length})
                </h5>
                <div className="space-y-2">
                  {breakdown.tickets.map((ticket: any) => (
                    <div
                      key={ticket.id}
                      className="border border-gray-200 dark:border-gray-700 rounded-lg p-3 bg-white dark:bg-gray-800/50"
                    >
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-1">
                            <span className="text-xs font-mono text-gray-500 dark:text-gray-400">
                              {ticket.taskId}
                            </span>
                            <span className="text-xs px-2 py-0.5 bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-400 rounded">
                              Priority {ticket.priority}
                            </span>
                          </div>
                          <h6 className="font-medium text-gray-900 dark:text-white text-sm mb-1">
                            {ticket.title}
                          </h6>
                          {ticket.tags && ticket.tags.length > 0 && (
                            <div className="flex flex-wrap gap-1">
                              {ticket.tags.map((tag: string) => (
                                <span
                                  key={tag}
                                  className="text-xs px-2 py-0.5 bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded"
                                >
                                  {tag}
                                </span>
                              ))}
                            </div>
                          )}
                          {ticket.definitionOfDone && (
                            <div className="mt-2 text-xs text-gray-500 dark:text-gray-400">
                              <span className="font-semibold">DoD:</span> {ticket.definitionOfDone.criteria.length} criteria
                            </div>
                          )}
                          {ticket.estimatedHours && (
                            <div className="mt-1 text-xs text-gray-500 dark:text-gray-400">
                              Est: {ticket.estimatedHours}h
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Subtasks */}
              {breakdown.subtasks.length > 0 && (
                <div>
                  <h5 className="text-sm font-bold text-gray-700 dark:text-gray-300 mb-3">
                    Subtasks ({breakdown.subtasks.length})
                  </h5>
                  <div className="space-y-1">
                    {breakdown.subtasks.slice(0, 10).map((subtask: any) => (
                      <div
                        key={subtask.id}
                        className="text-sm text-gray-600 dark:text-gray-400 flex items-center gap-2 pl-4"
                      >
                        <CheckCircle2 size={14} className="text-gray-400" />
                        <span className="text-xs font-mono">{subtask.taskId}</span>
                        <span>{subtask.title}</span>
                      </div>
                    ))}
                    {breakdown.subtasks.length > 10 && (
                      <div className="text-xs text-gray-500 dark:text-gray-400 pl-4">
                        ... and {breakdown.subtasks.length - 10} more
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* Dependencies */}
              {breakdown.dependencies.size > 0 && (
                <div className="p-3 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg">
                  <h5 className="text-sm font-bold text-blue-700 dark:text-blue-400 mb-2">
                    Dependencies Detected
                  </h5>
                  <p className="text-xs text-blue-600 dark:text-blue-400">
                    {breakdown.dependencies.size} task(s) have dependencies that will be automatically configured
                  </p>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="flex justify-end gap-2 p-6 border-t border-gray-200 dark:border-gray-700">
          <button
            onClick={handleClose}
            className="px-4 py-2 text-gray-600 dark:text-gray-400 hover:text-gray-800 dark:hover:text-gray-200 transition-colors"
          >
            Cancel
          </button>
          {!breakdown ? (
            <button
              onClick={handleBreakdown}
              disabled={isProcessing || !input.trim()}
              className="px-4 py-2 bg-purple-600 hover:bg-purple-700 text-white rounded-lg transition-colors font-medium disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
            >
              {isProcessing ? (
                <>
                  <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  Processing...
                </>
              ) : (
                <>
                  <Sparkles size={16} />
                  Break Down Task
                </>
              )}
            </button>
          ) : (
            <>
              <button
                onClick={() => setBreakdown(null)}
                className="px-4 py-2 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
              >
                Edit Input
              </button>
              <button
                onClick={handleCreateTasks}
                className="px-4 py-2 bg-black dark:bg-white text-white dark:text-black rounded-lg hover:bg-gray-800 dark:hover:bg-gray-200 transition-colors font-medium"
              >
                Create All Tasks
              </button>
            </>
          )}
        </div>
      </div>
    </div>
  );
};
