'use client';

import { useState } from 'react';
import { X, FileText, AlertTriangle, Upload, Sparkles } from 'lucide-react';
import { breakdownTask, parseGitHubIssue, BreakdownResult } from '@/lib/taskBreakdown';

interface TaskBreakdownModalProps {
  isOpen: boolean;
  onClose: () => void;
  onBreakdownComplete: (result: BreakdownResult) => void;
}

export const TaskBreakdownModal = ({ isOpen, onClose, onBreakdownComplete }: TaskBreakdownModalProps) => {
  const [input, setInput] = useState('');
  const [inputType, setInputType] = useState<'text' | 'issue' | 'prd'>('text');
  const [isProcessing, setIsProcessing] = useState(false);
  const [result, setResult] = useState<BreakdownResult | null>(null);

  const handleBreakdown = async () => {
    if (!input.trim()) return;

    setIsProcessing(true);
    try {
      const parsedInput = inputType === 'issue'
        ? parseGitHubIssue(input)
        : { type: inputType as 'text' | 'prd', content: input };

      const breakdown = await breakdownTask(parsedInput);
      setResult(breakdown);
    } catch (error) {
      console.error('Breakdown failed:', error);
      alert('Failed to breakdown task. Please try again.');
    } finally {
      setIsProcessing(false);
    }
  };

  const handleApply = () => {
    if (result) {
      onBreakdownComplete(result);
      onClose();
      setInput('');
      setResult(null);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
      <div className="bg-white dark:bg-gray-800 rounded-xl w-full max-w-4xl max-h-[90vh] overflow-hidden shadow-xl flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200 dark:border-gray-700">
          <div className="flex items-center gap-3">
            <Sparkles className="text-blue-600 dark:text-blue-400" size={24} />
            <h3 className="text-xl font-bold text-gray-900 dark:text-white">
              AI Task Breakdown
            </h3>
          </div>
          <button
            onClick={onClose}
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
                  Input Type
                </label>
                <div className="flex gap-2">
                  {[
                    { value: 'text', label: 'Text' },
                    { value: 'issue', label: 'GitHub Issue' },
                    { value: 'prd', label: 'PRD' }
                  ].map(type => (
                    <button
                      key={type.value}
                      onClick={() => setInputType(type.value as 'text' | 'issue' | 'prd')}
                      className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                        inputType === type.value
                          ? 'bg-blue-600 text-white'
                          : 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600'
                      }`}
                    >
                      {type.label}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Description
                </label>
                <textarea
                  value={input}
                  onChange={e => setInput(e.target.value)}
                  placeholder={
                    inputType === 'issue'
                      ? 'Paste GitHub issue content here...'
                      : inputType === 'prd'
                      ? 'Paste PRD content here...'
                      : 'Describe the feature or issue to break down...'
                  }
                  className="w-full h-64 px-3 py-2 border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none font-mono text-sm"
                />
              </div>

              <div className="p-4 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg">
                <div className="flex items-start gap-3">
                  <FileText className="text-blue-600 dark:text-blue-400 mt-0.5" size={20} />
                  <div className="text-sm text-blue-900 dark:text-blue-100">
                    <p className="font-semibold mb-1">Breakdown Tips:</p>
                    <ul className="list-disc list-inside space-y-1 text-blue-800 dark:text-blue-200">
                      <li>Use markdown headers (# Epic, ## Story) for structure</li>
                      <li>List items with - or * will become tasks</li>
                      <li>Include keywords like &quot;frontend&quot;, &quot;backend&quot; for auto-tagging</li>
                      <li>Mention priority (P1-P5) or &quot;critical&quot;/&quot;urgent&quot; for prioritization</li>
                    </ul>
                  </div>
                </div>
              </div>
            </div>
          ) : (
            <div className="space-y-6">
              {/* Summary */}
              <div className="p-4 bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg">
                <p className="text-green-900 dark:text-green-100 font-medium">
                  {result.summary}
                </p>
              </div>

              {/* Epics */}
              {result.epics.length > 0 && (
                <div>
                  <h4 className="text-lg font-bold text-gray-900 dark:text-white mb-3">
                    Epics ({result.epics.length})
                  </h4>
                  <div className="space-y-3">
                    {result.epics.map(epic => (
                      <div
                        key={epic.id}
                        className="p-4 border border-gray-200 dark:border-gray-600 rounded-lg bg-purple-50 dark:bg-purple-900/10"
                      >
                        <div className="flex items-start justify-between mb-2">
                          <div>
                            <span className="text-xs font-mono text-purple-600 dark:text-purple-400">
                              {epic.epicId}
                            </span>
                            <h5 className="font-bold text-gray-900 dark:text-white">
                              {epic.title}
                            </h5>
                          </div>
                          <span className="text-xs px-2 py-1 bg-purple-100 dark:bg-purple-900/30 text-purple-700 dark:text-purple-300 rounded">
                            P{epic.priority}
                          </span>
                        </div>
                        <p className="text-sm text-gray-600 dark:text-gray-400">{epic.description}</p>
                        {epic.tags.length > 0 && (
                          <div className="flex gap-1 mt-2">
                            {epic.tags.map(tag => (
                              <span
                                key={tag}
                                className="text-xs px-2 py-0.5 bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded"
                              >
                                {tag}
                              </span>
                            ))}
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Tasks */}
              {result.tasks.length > 0 && (
                <div>
                  <h4 className="text-lg font-bold text-gray-900 dark:text-white mb-3">
                    Tasks ({result.tasks.length})
                  </h4>
                  <div className="space-y-3">
                    {result.tasks.map(task => (
                      <div
                        key={task.id}
                        className="p-4 border border-gray-200 dark:border-gray-600 rounded-lg"
                      >
                        <div className="flex items-start justify-between mb-2">
                          <div className="flex-1">
                            <div className="flex items-center gap-2 mb-1">
                              <span className="text-xs font-mono text-blue-600 dark:text-blue-400">
                                {task.taskId}
                              </span>
                              {task.taskType && (
                                <span className="text-xs px-2 py-0.5 bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 rounded">
                                  {task.taskType}
                                </span>
                              )}
                            </div>
                            <h5 className="font-bold text-gray-900 dark:text-white">{task.title}</h5>
                          </div>
                          <div className="flex items-center gap-2">
                            <span className="text-xs px-2 py-1 bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded">
                              P{task.priority}
                            </span>
                            {task.riskLevel && task.riskLevel !== 'low' && (
                              <span
                                className={`text-xs px-2 py-1 rounded flex items-center gap-1 ${
                                  task.riskLevel === 'critical'
                                    ? 'bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-300'
                                    : task.riskLevel === 'high'
                                    ? 'bg-orange-100 dark:bg-orange-900/30 text-orange-700 dark:text-orange-300'
                                    : 'bg-yellow-100 dark:bg-yellow-900/30 text-yellow-700 dark:text-yellow-300'
                                }`}
                              >
                                <AlertTriangle size={12} />
                                {task.riskLevel}
                              </span>
                            )}
                          </div>
                        </div>

                        <p className="text-sm text-gray-600 dark:text-gray-400 mb-2">
                          {task.description}
                        </p>

                        {task.definitionOfDone && task.definitionOfDone.length > 0 && (
                          <div className="mb-2">
                            <span className="text-xs font-semibold text-gray-700 dark:text-gray-300">
                              DoD:
                            </span>
                            <ul className="list-disc list-inside text-xs text-gray-600 dark:text-gray-400">
                              {task.definitionOfDone.map((item, idx) => (
                                <li key={idx}>{item}</li>
                              ))}
                            </ul>
                          </div>
                        )}

                        {task.testNotes && (
                          <div className="mb-2">
                            <span className="text-xs font-semibold text-gray-700 dark:text-gray-300">
                              Test Notes:
                            </span>
                            <p className="text-xs text-gray-600 dark:text-gray-400">{task.testNotes}</p>
                          </div>
                        )}

                        {task.estimatedHours && (
                          <div className="text-xs text-gray-500 dark:text-gray-400">
                            Est: {task.estimatedHours}h
                          </div>
                        )}

                        {task.tags.length > 0 && (
                          <div className="flex gap-1 mt-2">
                            {task.tags.map(tag => (
                              <span
                                key={tag}
                                className="text-xs px-2 py-0.5 bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded"
                              >
                                {tag}
                              </span>
                            ))}
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="flex items-center justify-end gap-3 p-6 border-t border-gray-200 dark:border-gray-700">
          {!result ? (
            <>
              <button
                onClick={onClose}
                className="px-4 py-2 text-gray-600 dark:text-gray-400 hover:text-gray-800 dark:hover:text-gray-200 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleBreakdown}
                disabled={!input.trim() || isProcessing}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
              >
                {isProcessing ? (
                  <>
                    <div className="animate-spin w-4 h-4 border-2 border-white border-t-transparent rounded-full" />
                    Processing...
                  </>
                ) : (
                  <>
                    <Sparkles size={16} />
                    Break Down Task
                  </>
                )}
              </button>
            </>
          ) : (
            <>
              <button
                onClick={() => {
                  setResult(null);
                  setInput('');
                }}
                className="px-4 py-2 text-gray-600 dark:text-gray-400 hover:text-gray-800 dark:hover:text-gray-200 transition-colors"
              >
                Start Over
              </button>
              <button
                onClick={handleApply}
                className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
              >
                Apply Breakdown
              </button>
            </>
          )}
        </div>
      </div>
    </div>
  );
};
