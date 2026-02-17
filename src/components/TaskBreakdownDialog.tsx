'use client';

import { useState } from 'react';
import { X, Loader, AlertTriangle, CheckCircle } from 'lucide-react';
import { TaskBreakdownInput, TaskBreakdownResult } from '@/types/task';
import { breakdownTask } from '@/lib/taskBreakdown';

interface TaskBreakdownDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onBreakdownComplete: (result: TaskBreakdownResult) => void;
}

export const TaskBreakdownDialog = ({ isOpen, onClose, onBreakdownComplete }: TaskBreakdownDialogProps) => {
  const [content, setContent] = useState('');
  const [contentType, setContentType] = useState<'issue' | 'prd' | 'screenshot'>('issue');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<TaskBreakdownResult | null>(null);

  if (!isOpen) return null;

  const handleBreakdown = async () => {
    if (!content.trim()) {
      setError('Please provide content to break down');
      return;
    }

    setLoading(true);
    setError(null);
    setResult(null);

    try {
      const input: TaskBreakdownInput = {
        content: content.trim(),
        contentType,
      };

      const breakdown = await breakdownTask(input);
      setResult(breakdown);
    } catch (err) {
      console.error('Breakdown error:', err);
      setError(err instanceof Error ? err.message : 'Failed to break down task');
    } finally {
      setLoading(false);
    }
  };

  const handleApply = () => {
    if (result) {
      onBreakdownComplete(result);
      onClose();
      // Reset state
      setContent('');
      setResult(null);
      setError(null);
    }
  };

  const handleCancel = () => {
    setContent('');
    setResult(null);
    setError(null);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
      <div className="bg-white dark:bg-gray-800 rounded-xl w-full max-w-4xl max-h-[90vh] overflow-hidden flex flex-col shadow-xl">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200 dark:border-gray-700">
          <h2 className="text-xl font-bold text-gray-900 dark:text-white">
            Automated Task Breakdown
          </h2>
          <button
            onClick={handleCancel}
            className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
          >
            <X size={24} />
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6">
          {!result ? (
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Content Type
                </label>
                <div className="flex gap-2">
                  {(['issue', 'prd', 'screenshot'] as const).map(type => (
                    <button
                      key={type}
                      onClick={() => setContentType(type)}
                      className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                        contentType === type
                          ? 'bg-black dark:bg-white text-white dark:text-black'
                          : 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600'
                      }`}
                    >
                      {type === 'issue' ? 'GitHub Issue' : type === 'prd' ? 'PRD' : 'Screenshot'}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Content
                </label>
                <textarea
                  value={content}
                  onChange={e => setContent(e.target.value)}
                  placeholder={`Paste your ${contentType} content here...\n\nExample:\n# Epic: User Authentication\nImplement user authentication system\n\n## Task: Setup Auth Service\n- Create auth endpoints\n- Add JWT token generation\nPriority: High\nEstimate: 8 hours\n\nDoD:\n- API endpoints created\n- Tests passing\n- Documentation updated\n\nRisk: Medium complexity, third-party integration`}
                  className="w-full h-96 border border-gray-200 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white p-3 rounded-lg focus:outline-none focus:ring-2 focus:ring-black/10 dark:focus:ring-white/20 resize-none font-mono text-sm"
                />
              </div>

              <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-4">
                <h3 className="text-sm font-semibold text-blue-900 dark:text-blue-300 mb-2">
                  Formatting Tips:
                </h3>
                <ul className="text-xs text-blue-800 dark:text-blue-400 space-y-1">
                  <li>• Use <code>#</code> for epics, <code>##</code> for tasks, <code>###</code> for subtasks</li>
                  <li>• Add <code>Priority: High/Medium/Low</code> to set priority</li>
                  <li>• Add <code>Estimate: X hours</code> for time estimates</li>
                  <li>• Use <code>DoD:</code> section with bullet points for Definition of Done</li>
                  <li>• Use <code>Risk:</code> section to identify risks</li>
                  <li>• Use <code>Test:</code> section for testing notes</li>
                </ul>
              </div>

              {error && (
                <div className="bg-red-50 dark:bg-red-900/30 border border-red-200 dark:border-red-800 rounded-lg p-3 flex items-start gap-2">
                  <AlertTriangle size={18} className="text-red-600 dark:text-red-400 flex-shrink-0 mt-0.5" />
                  <span className="text-sm text-red-600 dark:text-red-400">{error}</span>
                </div>
              )}
            </div>
          ) : (
            <div className="space-y-4">
              <div className="bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg p-4 flex items-start gap-3">
                <CheckCircle size={24} className="text-green-600 dark:text-green-400 flex-shrink-0" />
                <div className="flex-1">
                  <h3 className="text-sm font-semibold text-green-900 dark:text-green-300 mb-1">
                    Breakdown Complete!
                  </h3>
                  <p className="text-sm text-green-800 dark:text-green-400">{result.summary}</p>
                </div>
              </div>

              {/* Summary */}
              <div className="grid grid-cols-3 gap-4">
                <div className="bg-purple-50 dark:bg-purple-900/20 border border-purple-200 dark:border-purple-800 rounded-lg p-4">
                  <div className="text-2xl font-bold text-purple-900 dark:text-purple-300">
                    {result.epics.length}
                  </div>
                  <div className="text-sm text-purple-700 dark:text-purple-400">Epics</div>
                </div>
                <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-4">
                  <div className="text-2xl font-bold text-blue-900 dark:text-blue-300">
                    {result.tasks.length}
                  </div>
                  <div className="text-sm text-blue-700 dark:text-blue-400">Tasks</div>
                </div>
                <div className="bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg p-4">
                  <div className="text-2xl font-bold text-green-900 dark:text-green-300">
                    {result.subtasks.length}
                  </div>
                  <div className="text-sm text-green-700 dark:text-green-400">Subtasks</div>
                </div>
              </div>

              {/* Task List Preview */}
              <div className="space-y-3">
                {result.epics.length > 0 && (
                  <div>
                    <h3 className="text-sm font-semibold text-gray-900 dark:text-white mb-2">Epics</h3>
                    <div className="space-y-2">
                      {result.epics.map(epic => (
                        <div
                          key={epic.id}
                          className="bg-purple-50 dark:bg-purple-900/20 border border-purple-200 dark:border-purple-800 rounded-lg p-3"
                        >
                          <div className="flex items-start justify-between gap-2">
                            <div className="flex-1">
                              <div className="text-xs font-semibold text-purple-600 dark:text-purple-400">
                                {epic.taskId}
                              </div>
                              <div className="text-sm font-medium text-gray-900 dark:text-white">
                                {epic.title}
                              </div>
                              {epic.riskLevel && (
                                <span className="inline-block mt-1 text-xs px-2 py-0.5 bg-orange-100 dark:bg-orange-900 text-orange-700 dark:text-orange-300 rounded">
                                  Risk: {epic.riskLevel}
                                </span>
                              )}
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {result.tasks.length > 0 && (
                  <div>
                    <h3 className="text-sm font-semibold text-gray-900 dark:text-white mb-2">Tasks</h3>
                    <div className="space-y-2">
                      {result.tasks.slice(0, 5).map(task => (
                        <div
                          key={task.id}
                          className="bg-gray-50 dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-lg p-3"
                        >
                          <div className="flex items-start justify-between gap-2">
                            <div className="flex-1">
                              <div className="text-xs font-semibold text-gray-600 dark:text-gray-400">
                                {task.taskId}
                              </div>
                              <div className="text-sm font-medium text-gray-900 dark:text-white">
                                {task.title}
                              </div>
                              <div className="flex items-center gap-2 mt-1">
                                {task.estimatedHours && (
                                  <span className="text-xs text-gray-500 dark:text-gray-400">
                                    {task.estimatedHours}h
                                  </span>
                                )}
                                {task.definitionOfDone.length > 0 && (
                                  <span className="text-xs text-gray-500 dark:text-gray-400">
                                    {task.definitionOfDone.length} DoD items
                                  </span>
                                )}
                                {task.riskLevel && (
                                  <span className="text-xs px-2 py-0.5 bg-orange-100 dark:bg-orange-900 text-orange-700 dark:text-orange-300 rounded">
                                    {task.riskLevel}
                                  </span>
                                )}
                              </div>
                            </div>
                          </div>
                        </div>
                      ))}
                      {result.tasks.length > 5 && (
                        <div className="text-xs text-gray-500 dark:text-gray-400 text-center py-2">
                          + {result.tasks.length - 5} more tasks
                        </div>
                      )}
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-6 border-t border-gray-200 dark:border-gray-700 flex justify-end gap-3">
          <button
            onClick={handleCancel}
            className="px-4 py-2 text-gray-600 dark:text-gray-400 hover:text-gray-800 dark:hover:text-gray-200 transition-colors"
          >
            Cancel
          </button>
          {!result ? (
            <button
              onClick={handleBreakdown}
              disabled={loading || !content.trim()}
              className="px-4 py-2 bg-black dark:bg-white text-white dark:text-black rounded-lg hover:bg-gray-800 dark:hover:bg-gray-200 transition-colors font-medium disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
            >
              {loading && <Loader size={16} className="animate-spin" />}
              {loading ? 'Breaking Down...' : 'Break Down'}
            </button>
          ) : (
            <button
              onClick={handleApply}
              className="px-4 py-2 bg-black dark:bg-white text-white dark:text-black rounded-lg hover:bg-gray-800 dark:hover:bg-gray-200 transition-colors font-medium"
            >
              Apply Breakdown
            </button>
          )}
        </div>
      </div>
    </div>
  );
};
