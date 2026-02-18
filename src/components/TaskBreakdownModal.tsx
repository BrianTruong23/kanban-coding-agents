'use client';

import { useState } from 'react';
import { BreakdownInput, BreakdownResult } from '@/types/breakdown';
import { X, FileText, ImageIcon, Code, Loader2, CheckCircle, AlertTriangle } from 'lucide-react';
import { breakdownTask } from '@/lib/aiBreakdown';
import { DependencyGraph } from './DependencyGraph';

interface TaskBreakdownModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (result: BreakdownResult) => void;
  userId: string;
}

export const TaskBreakdownModal = ({ isOpen, onClose, onSubmit, userId }: TaskBreakdownModalProps) => {
  const [inputType, setInputType] = useState<'issue' | 'prd' | 'screenshot' | 'text'>('text');
  const [content, setContent] = useState('');
  const [imageUrl, setImageUrl] = useState('');
  const [context, setContext] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);
  const [result, setResult] = useState<BreakdownResult | null>(null);
  const [error, setError] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleAnalyze = async () => {
    if (!content.trim()) {
      setError('Please provide content to analyze');
      return;
    }

    setError(null);
    setIsProcessing(true);

    try {
      const input: BreakdownInput = {
        type: inputType,
        content,
        imageUrl: imageUrl || undefined,
        context: context || undefined
      };

      const breakdownResult = await breakdownTask(input, userId);
      setResult(breakdownResult);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to analyze task');
      console.error('Breakdown error:', err);
    } finally {
      setIsProcessing(false);
    }
  };

  const handleSubmit = () => {
    if (result) {
      onSubmit(result);
      handleClose();
    }
  };

  const handleClose = () => {
    setContent('');
    setImageUrl('');
    setContext('');
    setResult(null);
    setError(null);
    onClose();
  };

  const getInputIcon = (type: string) => {
    switch (type) {
      case 'issue':
        return <AlertTriangle className="w-4 h-4" />;
      case 'prd':
        return <FileText className="w-4 h-4" />;
      case 'screenshot':
        return <ImageIcon className="w-4 h-4" />;
      default:
        return <Code className="w-4 h-4" />;
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
      <div className="bg-white dark:bg-gray-800 rounded-xl w-full max-w-5xl max-h-[90vh] flex flex-col shadow-2xl">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200 dark:border-gray-700">
          <div>
            <h2 className="text-xl font-bold text-gray-900 dark:text-white">
              AI Task Breakdown
            </h2>
            <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
              Automatically break down issues, PRDs, or requirements into epics, tickets, and subtasks
            </p>
          </div>
          <button
            onClick={handleClose}
            className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 transition-colors"
          >
            <X size={24} />
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6">
          {!result ? (
            <div className="space-y-6">
              {/* Input Type Selection */}
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">
                  Input Type
                </label>
                <div className="grid grid-cols-4 gap-3">
                  {(['text', 'issue', 'prd', 'screenshot'] as const).map((type) => (
                    <button
                      key={type}
                      onClick={() => setInputType(type)}
                      className={`flex items-center gap-2 px-4 py-3 rounded-lg border-2 transition-all ${
                        inputType === type
                          ? 'border-black dark:border-white bg-gray-50 dark:bg-gray-700'
                          : 'border-gray-200 dark:border-gray-600 hover:border-gray-300 dark:hover:border-gray-500'
                      }`}
                    >
                      {getInputIcon(type)}
                      <span className="text-sm font-medium text-gray-900 dark:text-white capitalize">
                        {type}
                      </span>
                    </button>
                  ))}
                </div>
              </div>

              {/* Main Content Input */}
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  {inputType === 'issue' && 'Issue Description'}
                  {inputType === 'prd' && 'Product Requirements'}
                  {inputType === 'screenshot' && 'Screenshot Description'}
                  {inputType === 'text' && 'Description'}
                </label>
                <textarea
                  value={content}
                  onChange={(e) => setContent(e.target.value)}
                  placeholder={
                    inputType === 'issue'
                      ? 'Paste the issue description here...\n\nExample:\n# User Authentication\nImplement user authentication with email and password...'
                      : inputType === 'prd'
                      ? 'Paste the PRD here...\n\nExample:\n## Feature: Dark Mode\nUsers should be able to toggle between light and dark themes...'
                      : 'Describe what you want to build...'
                  }
                  className="w-full h-64 border border-gray-200 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white p-3 rounded-lg focus:outline-none focus:ring-2 focus:ring-black/10 dark:focus:ring-white/20 resize-none font-mono text-sm"
                />
              </div>

              {/* Screenshot URL (if applicable) */}
              {inputType === 'screenshot' && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Screenshot URL (optional)
                  </label>
                  <input
                    type="url"
                    value={imageUrl}
                    onChange={(e) => setImageUrl(e.target.value)}
                    placeholder="https://example.com/screenshot.png"
                    className="w-full border border-gray-200 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white p-3 rounded-lg focus:outline-none focus:ring-2 focus:ring-black/10 dark:focus:ring-white/20"
                  />
                </div>
              )}

              {/* Additional Context */}
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Additional Context (optional)
                </label>
                <textarea
                  value={context}
                  onChange={(e) => setContext(e.target.value)}
                  placeholder="Any additional context, constraints, or requirements..."
                  className="w-full h-24 border border-gray-200 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white p-3 rounded-lg focus:outline-none focus:ring-2 focus:ring-black/10 dark:focus:ring-white/20 resize-none text-sm"
                />
              </div>

              {/* Error Display */}
              {error && (
                <div className="p-3 bg-red-50 dark:bg-red-900/30 border border-red-200 dark:border-red-800 rounded-lg text-sm text-red-600 dark:text-red-400">
                  {error}
                </div>
              )}
            </div>
          ) : (
            <div className="space-y-6">
              {/* Summary */}
              <div className="bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg p-4">
                <div className="flex items-center gap-2 mb-2">
                  <CheckCircle className="w-5 h-5 text-green-600 dark:text-green-400" />
                  <h3 className="font-semibold text-green-900 dark:text-green-100">
                    Breakdown Complete
                  </h3>
                </div>
                <p className="text-sm text-green-700 dark:text-green-300">{result.summary}</p>
              </div>

              {/* Statistics */}
              <div className="grid grid-cols-3 gap-4">
                <div className="bg-purple-50 dark:bg-purple-900/20 border border-purple-200 dark:border-purple-800 rounded-lg p-4">
                  <div className="text-2xl font-bold text-purple-600 dark:text-purple-400">
                    {result.epics.length}
                  </div>
                  <div className="text-sm text-purple-700 dark:text-purple-300">Epics</div>
                </div>
                <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-4">
                  <div className="text-2xl font-bold text-blue-600 dark:text-blue-400">
                    {result.tickets.length}
                  </div>
                  <div className="text-sm text-blue-700 dark:text-blue-300">Tickets</div>
                </div>
                <div className="bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg p-4">
                  <div className="text-2xl font-bold text-green-600 dark:text-green-400">
                    {result.subtasks.length}
                  </div>
                  <div className="text-sm text-green-700 dark:text-green-300">Subtasks</div>
                </div>
              </div>

              {/* Dependency Graph */}
              <div className="h-96">
                <DependencyGraph
                  tasks={[...result.epics, ...result.tickets, ...result.subtasks]}
                  dependencies={result.dependencies}
                />
              </div>

              {/* Task Details */}
              <div className="space-y-3">
                <h3 className="font-semibold text-gray-900 dark:text-white">Task Details</h3>
                <div className="space-y-2 max-h-64 overflow-y-auto">
                  {[...result.epics, ...result.tickets, ...result.subtasks].map((task) => (
                    <div
                      key={task.id}
                      className="p-3 bg-gray-50 dark:bg-gray-700 rounded-lg border border-gray-200 dark:border-gray-600"
                    >
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-1">
                            <span
                              className={`text-xs font-semibold px-2 py-0.5 rounded ${
                                task.taskType === 'epic'
                                  ? 'bg-purple-200 dark:bg-purple-800 text-purple-800 dark:text-purple-200'
                                  : task.taskType === 'ticket'
                                  ? 'bg-blue-200 dark:bg-blue-800 text-blue-800 dark:text-blue-200'
                                  : 'bg-green-200 dark:bg-green-800 text-green-800 dark:text-green-200'
                              }`}
                            >
                              {task.taskType.toUpperCase()}
                            </span>
                            <span className="text-sm font-medium text-gray-900 dark:text-white">
                              {task.title}
                            </span>
                          </div>
                          <p className="text-xs text-gray-600 dark:text-gray-400">
                            {task.description.substring(0, 100)}
                            {task.description.length > 100 && '...'}
                          </p>
                          <div className="flex items-center gap-3 mt-2 text-xs text-gray-500 dark:text-gray-500">
                            <span>{task.estimatedHours}h</span>
                            <span>•</span>
                            <span>{task.definitionOfDone.length} DoD items</span>
                            {task.riskFlags.length > 0 && (
                              <>
                                <span>•</span>
                                <span className="text-red-500 dark:text-red-400">
                                  {task.riskFlags.length} risks
                                </span>
                              </>
                            )}
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="flex items-center justify-end gap-3 p-6 border-t border-gray-200 dark:border-gray-700">
          <button
            onClick={handleClose}
            className="px-4 py-2 text-gray-600 dark:text-gray-400 hover:text-gray-800 dark:hover:text-gray-200 transition-colors"
          >
            Cancel
          </button>
          {!result ? (
            <button
              onClick={handleAnalyze}
              disabled={isProcessing || !content.trim()}
              className="px-6 py-2 bg-black dark:bg-white text-white dark:text-black rounded-lg hover:bg-gray-800 dark:hover:bg-gray-200 transition-colors font-medium disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
            >
              {isProcessing ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  Analyzing...
                </>
              ) : (
                'Analyze & Break Down'
              )}
            </button>
          ) : (
            <button
              onClick={handleSubmit}
              className="px-6 py-2 bg-black dark:bg-white text-white dark:text-black rounded-lg hover:bg-gray-800 dark:hover:bg-gray-200 transition-colors font-medium"
            >
              Create Tasks
            </button>
          )}
        </div>
      </div>
    </div>
  );
};
