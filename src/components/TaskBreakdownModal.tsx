'use client';

import { useState } from 'react';
import { X, Loader2, FileText, Image, Code, AlertTriangle, CheckCircle } from 'lucide-react';
import { analyzeAndBreakdown, BreakdownResult } from '@/lib/taskBreakdown';
import { Task } from '@/types/task';

interface TaskBreakdownModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: (result: BreakdownResult) => Promise<void>;
}

export const TaskBreakdownModal = ({ isOpen, onClose, onConfirm }: TaskBreakdownModalProps) => {
  const [inputType, setInputType] = useState<'issue' | 'prd' | 'screenshot'>('issue');
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [result, setResult] = useState<BreakdownResult | null>(null);
  const [error, setError] = useState<string | null>(null);

  const handleAnalyze = async () => {
    if (!content.trim()) {
      setError('Please provide content to analyze');
      return;
    }

    setIsAnalyzing(true);
    setError(null);

    try {
      const breakdownResult = await analyzeAndBreakdown({
        type: inputType,
        content,
        title,
      });
      setResult(breakdownResult);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to analyze content');
    } finally {
      setIsAnalyzing(false);
    }
  };

  const handleConfirm = async () => {
    if (!result) return;

    try {
      await onConfirm(result);
      handleClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to create tasks');
    }
  };

  const handleClose = () => {
    setTitle('');
    setContent('');
    setResult(null);
    setError(null);
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
      <div className="bg-white dark:bg-gray-800 rounded-xl w-full max-w-4xl max-h-[90vh] overflow-hidden flex flex-col shadow-xl">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200 dark:border-gray-700">
          <div>
            <h2 className="text-xl font-bold text-gray-900 dark:text-white">
              Automated Task Breakdown
            </h2>
            <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
              Analyze issues, PRDs, or screenshots to generate structured tasks
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
          {!result ? (
            <div className="space-y-6">
              {/* Input Type Selection */}
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">
                  Input Type
                </label>
                <div className="grid grid-cols-3 gap-3">
                  <button
                    onClick={() => setInputType('issue')}
                    className={`p-4 rounded-lg border-2 transition-all ${
                      inputType === 'issue'
                        ? 'border-black dark:border-white bg-gray-50 dark:bg-gray-700'
                        : 'border-gray-200 dark:border-gray-600 hover:border-gray-300 dark:hover:border-gray-500'
                    }`}
                  >
                    <Code size={24} className="mx-auto mb-2 text-gray-700 dark:text-gray-300" />
                    <div className="text-sm font-medium text-gray-900 dark:text-white">Issue</div>
                  </button>
                  <button
                    onClick={() => setInputType('prd')}
                    className={`p-4 rounded-lg border-2 transition-all ${
                      inputType === 'prd'
                        ? 'border-black dark:border-white bg-gray-50 dark:bg-gray-700'
                        : 'border-gray-200 dark:border-gray-600 hover:border-gray-300 dark:hover:border-gray-500'
                    }`}
                  >
                    <FileText size={24} className="mx-auto mb-2 text-gray-700 dark:text-gray-300" />
                    <div className="text-sm font-medium text-gray-900 dark:text-white">PRD</div>
                  </button>
                  <button
                    onClick={() => setInputType('screenshot')}
                    className={`p-4 rounded-lg border-2 transition-all ${
                      inputType === 'screenshot'
                        ? 'border-black dark:border-white bg-gray-50 dark:bg-gray-700'
                        : 'border-gray-200 dark:border-gray-600 hover:border-gray-300 dark:hover:border-gray-500'
                    }`}
                  >
                    <Image size={24} className="mx-auto mb-2 text-gray-700 dark:text-gray-300" />
                    <div className="text-sm font-medium text-gray-900 dark:text-white">Screenshot</div>
                  </button>
                </div>
              </div>

              {/* Title */}
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Title (optional)
                </label>
                <input
                  type="text"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="e.g., User Authentication Feature"
                  className="w-full border border-gray-200 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white p-3 rounded-lg focus:outline-none focus:ring-2 focus:ring-black/10 dark:focus:ring-white/20"
                />
              </div>

              {/* Content */}
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Content
                </label>
                <textarea
                  value={content}
                  onChange={(e) => setContent(e.target.value)}
                  placeholder={
                    inputType === 'issue'
                      ? 'Paste your GitHub issue, feature request, or bug report here...'
                      : inputType === 'prd'
                      ? 'Paste your Product Requirements Document here...'
                      : 'Upload a screenshot or paste a description...'
                  }
                  className="w-full border border-gray-200 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white p-3 rounded-lg h-64 focus:outline-none focus:ring-2 focus:ring-black/10 dark:focus:ring-white/20 resize-none"
                />
              </div>

              {error && (
                <div className="p-3 bg-red-50 dark:bg-red-900/30 border border-red-200 dark:border-red-800 rounded-lg text-sm text-red-600 dark:text-red-400 flex items-start gap-2">
                  <AlertTriangle size={16} className="mt-0.5 flex-shrink-0" />
                  <span>{error}</span>
                </div>
              )}
            </div>
          ) : (
            <div className="space-y-6">
              {/* Analysis Result */}
              <div className="flex items-start gap-3 p-4 bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg">
                <CheckCircle size={20} className="text-green-600 dark:text-green-400 mt-0.5 flex-shrink-0" />
                <div>
                  <h3 className="font-medium text-green-900 dark:text-green-100">
                    Analysis Complete
                  </h3>
                  <p className="text-sm text-green-700 dark:text-green-300 mt-1">
                    Generated {result.epics.length} epics, {result.tasks.length} tasks, and{' '}
                    {result.subtasks.length} subtasks with {result.dependencies.length} dependencies
                  </p>
                </div>
              </div>

              {/* Epics */}
              {result.epics.length > 0 && (
                <div>
                  <h3 className="font-semibold text-gray-900 dark:text-white mb-3">
                    Epics ({result.epics.length})
                  </h3>
                  <div className="space-y-2">
                    {result.epics.map((epic) => (
                      <div
                        key={epic.id}
                        className="p-3 border border-gray-200 dark:border-gray-700 rounded-lg bg-purple-50 dark:bg-purple-900/20"
                      >
                        <div className="flex items-start justify-between">
                          <div className="flex-1">
                            <div className="flex items-center gap-2">
                              <span className="text-xs font-mono text-purple-600 dark:text-purple-400">
                                {epic.epicId}
                              </span>
                              <span className="font-medium text-gray-900 dark:text-white">
                                {epic.title}
                              </span>
                            </div>
                            <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                              {epic.description}
                            </p>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Tasks */}
              <div>
                <h3 className="font-semibold text-gray-900 dark:text-white mb-3">
                  Tasks ({result.tasks.length})
                </h3>
                <div className="space-y-2 max-h-64 overflow-y-auto">
                  {result.tasks.map((task) => (
                    <div
                      key={task.id}
                      className="p-3 border border-gray-200 dark:border-gray-700 rounded-lg"
                    >
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <div className="flex items-center gap-2 flex-wrap">
                            <span className="text-xs font-mono text-gray-500 dark:text-gray-400">
                              {task.taskId}
                            </span>
                            <span className="font-medium text-gray-900 dark:text-white">
                              {task.title}
                            </span>
                            {task.riskLevel && task.riskLevel !== 'low' && (
                              <span
                                className={`text-xs px-2 py-0.5 rounded-full ${
                                  task.riskLevel === 'critical'
                                    ? 'bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-400'
                                    : task.riskLevel === 'high'
                                    ? 'bg-orange-100 dark:bg-orange-900/30 text-orange-700 dark:text-orange-400'
                                    : 'bg-yellow-100 dark:bg-yellow-900/30 text-yellow-700 dark:text-yellow-400'
                                }`}
                              >
                                {task.riskLevel} risk
                              </span>
                            )}
                            {task.estimatedHours && (
                              <span className="text-xs text-gray-500 dark:text-gray-400">
                                ~{task.estimatedHours}h
                              </span>
                            )}
                          </div>
                          {task.requiredSkills && task.requiredSkills.length > 0 && (
                            <div className="flex gap-1 mt-2 flex-wrap">
                              {task.requiredSkills.map((skill) => (
                                <span
                                  key={skill}
                                  className="text-xs px-2 py-0.5 bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-400 rounded"
                                >
                                  {skill}
                                </span>
                              ))}
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Required Skills Summary */}
              {result.suggestedSkills.length > 0 && (
                <div>
                  <h3 className="font-semibold text-gray-900 dark:text-white mb-3">
                    Required Skills
                  </h3>
                  <div className="flex gap-2 flex-wrap">
                    {result.suggestedSkills.map((skill) => (
                      <span
                        key={skill}
                        className="px-3 py-1 bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded-full text-sm"
                      >
                        {skill}
                      </span>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="flex justify-end gap-3 p-6 border-t border-gray-200 dark:border-gray-700">
          <button
            onClick={handleClose}
            className="px-4 py-2 text-gray-600 dark:text-gray-400 hover:text-gray-800 dark:hover:text-gray-200 transition-colors"
          >
            Cancel
          </button>
          {!result ? (
            <button
              onClick={handleAnalyze}
              disabled={isAnalyzing || !content.trim()}
              className="px-4 py-2 bg-black dark:bg-white text-white dark:text-black rounded-lg hover:bg-gray-800 dark:hover:bg-gray-200 transition-colors font-medium disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
            >
              {isAnalyzing ? (
                <>
                  <Loader2 size={16} className="animate-spin" />
                  Analyzing...
                </>
              ) : (
                'Analyze & Generate Tasks'
              )}
            </button>
          ) : (
            <button
              onClick={handleConfirm}
              className="px-4 py-2 bg-black dark:bg-white text-white dark:text-black rounded-lg hover:bg-gray-800 dark:hover:bg-gray-200 transition-colors font-medium"
            >
              Create Tasks
            </button>
          )}
        </div>
      </div>
    </div>
  );
};
