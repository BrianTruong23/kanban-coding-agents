'use client';

import { useState } from 'react';
import { X, FileText, Image, Code, Loader2, ChevronDown, ChevronRight, AlertTriangle } from 'lucide-react';
import { TaskBreakdownRequest, TaskBreakdownResult } from '@/types/epic';
import { taskBreakdownService } from '@/lib/taskBreakdown';

interface TaskBreakdownModalProps {
  isOpen: boolean;
  onClose: () => void;
  onApply: (result: TaskBreakdownResult) => Promise<void>;
}

export function TaskBreakdownModal({ isOpen, onClose, onApply }: TaskBreakdownModalProps) {
  const [inputType, setInputType] = useState<'issue' | 'prd' | 'screenshot'>('issue');
  const [content, setContent] = useState('');
  const [imageUrl, setImageUrl] = useState('');
  const [context, setContext] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);
  const [result, setResult] = useState<TaskBreakdownResult | null>(null);
  const [expandedTasks, setExpandedTasks] = useState<Set<number>>(new Set());

  if (!isOpen) return null;

  const handleAnalyze = async () => {
    if (!content.trim()) return;

    setIsProcessing(true);
    try {
      const request: TaskBreakdownRequest = {
        type: inputType,
        content,
        imageUrl: imageUrl || undefined,
        context: context || undefined,
      };

      const breakdown = await taskBreakdownService.breakdownTask(request);
      setResult(breakdown);
    } catch (error) {
      console.error('Error analyzing task:', error);
      alert('Failed to analyze task. Please try again.');
    } finally {
      setIsProcessing(false);
    }
  };

  const handleApply = async () => {
    if (!result) return;

    setIsProcessing(true);
    try {
      await onApply(result);
      onClose();
      // Reset state
      setContent('');
      setImageUrl('');
      setContext('');
      setResult(null);
    } catch (error) {
      console.error('Error applying breakdown:', error);
      alert('Failed to create tasks. Please try again.');
    } finally {
      setIsProcessing(false);
    }
  };

  const toggleTask = (index: number) => {
    const newExpanded = new Set(expandedTasks);
    if (newExpanded.has(index)) {
      newExpanded.delete(index);
    } else {
      newExpanded.add(index);
    }
    setExpandedTasks(newExpanded);
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl w-full max-w-4xl max-h-[90vh] overflow-hidden flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200 dark:border-gray-700">
          <h2 className="text-2xl font-bold">Automated Task Breakdown</h2>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6">
          {!result ? (
            <div className="space-y-6">
              {/* Input Type Selection */}
              <div>
                <label className="block text-sm font-medium mb-2">Input Type</label>
                <div className="flex gap-2">
                  <button
                    onClick={() => setInputType('issue')}
                    className={`flex items-center gap-2 px-4 py-2 rounded-lg border transition-colors ${
                      inputType === 'issue'
                        ? 'bg-blue-50 dark:bg-blue-900 border-blue-500 text-blue-700 dark:text-blue-300'
                        : 'border-gray-300 dark:border-gray-600 hover:bg-gray-50 dark:hover:bg-gray-700'
                    }`}
                  >
                    <FileText className="w-4 h-4" />
                    GitHub Issue
                  </button>
                  <button
                    onClick={() => setInputType('prd')}
                    className={`flex items-center gap-2 px-4 py-2 rounded-lg border transition-colors ${
                      inputType === 'prd'
                        ? 'bg-blue-50 dark:bg-blue-900 border-blue-500 text-blue-700 dark:text-blue-300'
                        : 'border-gray-300 dark:border-gray-600 hover:bg-gray-50 dark:hover:bg-gray-700'
                    }`}
                  >
                    <Code className="w-4 h-4" />
                    PRD / Spec
                  </button>
                  <button
                    onClick={() => setInputType('screenshot')}
                    className={`flex items-center gap-2 px-4 py-2 rounded-lg border transition-colors ${
                      inputType === 'screenshot'
                        ? 'bg-blue-50 dark:bg-blue-900 border-blue-500 text-blue-700 dark:text-blue-300'
                        : 'border-gray-300 dark:border-gray-600 hover:bg-gray-50 dark:hover:bg-gray-700'
                    }`}
                  >
                    <Image className="w-4 h-4" />
                    Screenshot
                  </button>
                </div>
              </div>

              {/* Content Input */}
              <div>
                <label className="block text-sm font-medium mb-2">
                  {inputType === 'issue' ? 'Issue Description' : inputType === 'prd' ? 'Product Requirements' : 'Screenshot Description'}
                </label>
                <textarea
                  value={content}
                  onChange={(e) => setContent(e.target.value)}
                  placeholder={
                    inputType === 'issue'
                      ? 'Paste your GitHub issue or feature request...'
                      : inputType === 'prd'
                      ? 'Paste your product requirements document...'
                      : 'Describe what you see in the screenshot...'
                  }
                  className="w-full h-64 px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none"
                />
              </div>

              {/* Image URL (for screenshots) */}
              {inputType === 'screenshot' && (
                <div>
                  <label className="block text-sm font-medium mb-2">Screenshot URL (optional)</label>
                  <input
                    type="url"
                    value={imageUrl}
                    onChange={(e) => setImageUrl(e.target.value)}
                    placeholder="https://example.com/screenshot.png"
                    className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>
              )}

              {/* Additional Context */}
              <div>
                <label className="block text-sm font-medium mb-2">Additional Context (optional)</label>
                <textarea
                  value={context}
                  onChange={(e) => setContext(e.target.value)}
                  placeholder="Any additional information that might help with task breakdown..."
                  className="w-full h-24 px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none"
                />
              </div>

              <button
                onClick={handleAnalyze}
                disabled={isProcessing || !content.trim()}
                className="w-full bg-blue-600 hover:bg-blue-700 disabled:bg-gray-400 text-white px-6 py-3 rounded-lg font-medium transition-colors flex items-center justify-center gap-2"
              >
                {isProcessing ? (
                  <>
                    <Loader2 className="w-5 h-5 animate-spin" />
                    Analyzing...
                  </>
                ) : (
                  'Analyze & Break Down'
                )}
              </button>
            </div>
          ) : (
            <div className="space-y-6">
              {/* Epic Summary */}
              {result.epic && (
                <div className="border border-gray-200 dark:border-gray-700 rounded-lg p-4 bg-purple-50 dark:bg-purple-900/20">
                  <h3 className="text-lg font-semibold mb-2">Epic: {result.epic.title}</h3>
                  <p className="text-sm text-gray-600 dark:text-gray-400 mb-2">{result.epic.description}</p>
                  <div className="flex gap-2">
                    <span className="text-xs bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200 px-2 py-1 rounded">
                      Priority: {result.epic.priority}
                    </span>
                    {result.epic.tags.map(tag => (
                      <span key={tag} className="text-xs bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-200 px-2 py-1 rounded">
                        {tag}
                      </span>
                    ))}
                  </div>
                </div>
              )}

              {/* Tasks */}
              <div>
                <h3 className="text-lg font-semibold mb-3">
                  Tasks ({result.tasks.length})
                </h3>
                <div className="space-y-3">
                  {result.tasks.map((task, index) => (
                    <div
                      key={index}
                      className="border border-gray-200 dark:border-gray-700 rounded-lg overflow-hidden"
                    >
                      <div
                        className="p-4 bg-gray-50 dark:bg-gray-700 cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-600 transition-colors"
                        onClick={() => toggleTask(index)}
                      >
                        <div className="flex items-start justify-between">
                          <div className="flex items-start gap-2 flex-1">
                            {expandedTasks.has(index) ? (
                              <ChevronDown className="w-5 h-5 mt-0.5 flex-shrink-0" />
                            ) : (
                              <ChevronRight className="w-5 h-5 mt-0.5 flex-shrink-0" />
                            )}
                            <div className="flex-1">
                              <h4 className="font-medium">{task.title}</h4>
                              <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                                {task.description}
                              </p>
                              <div className="flex gap-2 mt-2">
                                <span className="text-xs bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200 px-2 py-1 rounded">
                                  Priority: {task.priority}
                                </span>
                                <span className="text-xs bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-200 px-2 py-1 rounded">
                                  {task.subtasks.length} subtasks
                                </span>
                                {task.estimatedHours && (
                                  <span className="text-xs bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200 px-2 py-1 rounded">
                                    ~{task.estimatedHours}h
                                  </span>
                                )}
                              </div>
                            </div>
                          </div>
                        </div>
                      </div>

                      {expandedTasks.has(index) && (
                        <div className="p-4 border-t border-gray-200 dark:border-gray-700 space-y-3">
                          {task.subtasks.map((subtask, subIndex) => (
                            <div
                              key={subIndex}
                              className="border border-gray-200 dark:border-gray-600 rounded p-3 bg-white dark:bg-gray-800"
                            >
                              <h5 className="font-medium text-sm mb-2">{subtask.title}</h5>
                              <p className="text-xs text-gray-600 dark:text-gray-400 mb-2">
                                {subtask.description}
                              </p>

                              {/* Definition of Done */}
                              {subtask.definitionOfDone.length > 0 && (
                                <div className="mb-2">
                                  <p className="text-xs font-medium mb-1">Definition of Done:</p>
                                  <ul className="text-xs text-gray-600 dark:text-gray-400 space-y-0.5 ml-4">
                                    {subtask.definitionOfDone.map((dod, i) => (
                                      <li key={i} className="list-disc">{dod}</li>
                                    ))}
                                  </ul>
                                </div>
                              )}

                              {/* Test Notes */}
                              {subtask.testNotes.length > 0 && (
                                <div className="mb-2">
                                  <p className="text-xs font-medium mb-1">Test Notes:</p>
                                  <ul className="text-xs text-gray-600 dark:text-gray-400 space-y-0.5 ml-4">
                                    {subtask.testNotes.map((note, i) => (
                                      <li key={i} className="list-disc">{note}</li>
                                    ))}
                                  </ul>
                                </div>
                              )}

                              {/* Risk Flags */}
                              {subtask.riskFlags.length > 0 && (
                                <div className="space-y-1">
                                  {subtask.riskFlags.map((risk, i) => (
                                    <div
                                      key={i}
                                      className={`flex items-start gap-2 p-2 rounded text-xs ${
                                        risk.severity === 'critical'
                                          ? 'bg-red-100 dark:bg-red-900/30 text-red-800 dark:text-red-200'
                                          : risk.severity === 'high'
                                          ? 'bg-orange-100 dark:bg-orange-900/30 text-orange-800 dark:text-orange-200'
                                          : risk.severity === 'medium'
                                          ? 'bg-yellow-100 dark:bg-yellow-900/30 text-yellow-800 dark:text-yellow-200'
                                          : 'bg-blue-100 dark:bg-blue-900/30 text-blue-800 dark:text-blue-200'
                                      }`}
                                    >
                                      <AlertTriangle className="w-3 h-3 mt-0.5 flex-shrink-0" />
                                      <div>
                                        <p className="font-medium">{risk.description}</p>
                                        {risk.mitigation && (
                                          <p className="mt-1 opacity-80">Mitigation: {risk.mitigation}</p>
                                        )}
                                      </div>
                                    </div>
                                  ))}
                                </div>
                              )}
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </div>

              <div className="flex gap-3">
                <button
                  onClick={() => setResult(null)}
                  className="flex-1 bg-gray-200 dark:bg-gray-700 hover:bg-gray-300 dark:hover:bg-gray-600 text-gray-900 dark:text-white px-6 py-3 rounded-lg font-medium transition-colors"
                >
                  Back to Edit
                </button>
                <button
                  onClick={handleApply}
                  disabled={isProcessing}
                  className="flex-1 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-400 text-white px-6 py-3 rounded-lg font-medium transition-colors flex items-center justify-center gap-2"
                >
                  {isProcessing ? (
                    <>
                      <Loader2 className="w-5 h-5 animate-spin" />
                      Creating Tasks...
                    </>
                  ) : (
                    'Create All Tasks'
                  )}
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
