'use client';

import { useState } from 'react';
import { FileText, GitBranch, Image, Sparkles, X, AlertTriangle, CheckCircle2 } from 'lucide-react';
import { TaskBreakdownInput, AIBreakdownResponse } from '@/types/taskBreakdown';
import { taskBreakdownService } from '@/services/taskBreakdownService';

interface TaskBreakdownWizardProps {
  onComplete: (breakdown: AIBreakdownResponse) => void;
  onCancel: () => void;
}

export const TaskBreakdownWizard = ({ onComplete, onCancel }: TaskBreakdownWizardProps) => {
  const [step, setStep] = useState<'input' | 'processing' | 'review'>('input');
  const [inputType, setInputType] = useState<'issue' | 'prd' | 'screenshot'>('issue');
  const [content, setContent] = useState('');
  const [context, setContext] = useState('');
  const [breakdown, setBreakdown] = useState<AIBreakdownResponse | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);

  const handleAnalyze = async () => {
    if (!content.trim()) return;

    setIsProcessing(true);
    setStep('processing');

    try {
      const input: TaskBreakdownInput = {
        type: inputType,
        content,
        context: context || undefined,
      };

      const result = await taskBreakdownService.breakdownTask(input);
      setBreakdown(result);
      setStep('review');
    } catch (error) {
      console.error('Failed to analyze:', error);
      alert('Failed to analyze input. Please try again.');
      setStep('input');
    } finally {
      setIsProcessing(false);
    }
  };

  const handleConfirm = () => {
    if (breakdown) {
      onComplete(breakdown);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-2xl w-full max-w-4xl max-h-[90vh] overflow-hidden flex flex-col">
        {/* Header */}
        <div className="p-6 border-b border-gray-200 dark:border-gray-700">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-purple-100 dark:bg-purple-900/30 rounded-lg">
                <Sparkles className="text-purple-600 dark:text-purple-400" size={24} />
              </div>
              <div>
                <h2 className="text-xl font-bold text-gray-900 dark:text-white">AI Task Breakdown</h2>
                <p className="text-sm text-gray-500 dark:text-gray-400 mt-0.5">
                  Break down complex work into manageable tasks
                </p>
              </div>
            </div>
            <button
              onClick={onCancel}
              className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
            >
              <X size={20} className="text-gray-600 dark:text-gray-400" />
            </button>
          </div>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6">
          {step === 'input' && (
            <div className="space-y-6">
              {/* Input Type Selection */}
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">
                  Input Type
                </label>
                <div className="grid grid-cols-3 gap-3">
                  <button
                    onClick={() => setInputType('issue')}
                    className={`p-4 border-2 rounded-lg transition-all ${
                      inputType === 'issue'
                        ? 'border-purple-500 bg-purple-50 dark:bg-purple-900/20'
                        : 'border-gray-200 dark:border-gray-700 hover:border-gray-300 dark:hover:border-gray-600'
                    }`}
                  >
                    <GitBranch className="mx-auto mb-2" size={24} />
                    <div className="text-sm font-medium">GitHub Issue</div>
                  </button>
                  <button
                    onClick={() => setInputType('prd')}
                    className={`p-4 border-2 rounded-lg transition-all ${
                      inputType === 'prd'
                        ? 'border-purple-500 bg-purple-50 dark:bg-purple-900/20'
                        : 'border-gray-200 dark:border-gray-700 hover:border-gray-300 dark:hover:border-gray-600'
                    }`}
                  >
                    <FileText className="mx-auto mb-2" size={24} />
                    <div className="text-sm font-medium">PRD</div>
                  </button>
                  <button
                    onClick={() => setInputType('screenshot')}
                    className={`p-4 border-2 rounded-lg transition-all ${
                      inputType === 'screenshot'
                        ? 'border-purple-500 bg-purple-50 dark:bg-purple-900/20'
                        : 'border-gray-200 dark:border-gray-700 hover:border-gray-300 dark:hover:border-gray-600'
                    }`}
                  >
                    <Image className="mx-auto mb-2" size={24} />
                    <div className="text-sm font-medium">Screenshot</div>
                  </button>
                </div>
              </div>

              {/* Content Input */}
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  {inputType === 'issue' && 'Issue Description'}
                  {inputType === 'prd' && 'Product Requirements'}
                  {inputType === 'screenshot' && 'Screenshot URL'}
                </label>
                {inputType === 'screenshot' ? (
                  <input
                    type="text"
                    value={content}
                    onChange={(e) => setContent(e.target.value)}
                    placeholder="https://example.com/screenshot.png"
                    className="w-full border border-gray-200 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white p-3 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
                  />
                ) : (
                  <textarea
                    value={content}
                    onChange={(e) => setContent(e.target.value)}
                    placeholder={
                      inputType === 'issue'
                        ? 'Paste your GitHub issue or feature request here...'
                        : 'Paste your PRD or requirements document here...'
                    }
                    className="w-full border border-gray-200 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white p-3 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 resize-none h-48"
                  />
                )}
              </div>

              {/* Context Input */}
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Additional Context (Optional)
                </label>
                <textarea
                  value={context}
                  onChange={(e) => setContext(e.target.value)}
                  placeholder="Any additional information that might help..."
                  className="w-full border border-gray-200 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white p-3 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 resize-none h-24"
                />
              </div>
            </div>
          )}

          {step === 'processing' && (
            <div className="flex flex-col items-center justify-center py-16">
              <div className="animate-spin rounded-full h-16 w-16 border-4 border-purple-500 border-t-transparent mb-4"></div>
              <p className="text-lg font-medium text-gray-900 dark:text-white">Analyzing...</p>
              <p className="text-sm text-gray-500 dark:text-gray-400 mt-2">
                Breaking down your work into actionable tasks
              </p>
            </div>
          )}

          {step === 'review' && breakdown && (
            <div className="space-y-6">
              {/* Summary */}
              <div className="bg-purple-50 dark:bg-purple-900/20 rounded-lg p-4">
                <div className="grid grid-cols-3 gap-4 text-center">
                  <div>
                    <div className="text-2xl font-bold text-purple-600 dark:text-purple-400">
                      {breakdown.epics.length}
                    </div>
                    <div className="text-xs text-gray-600 dark:text-gray-400 mt-1">Epics</div>
                  </div>
                  <div>
                    <div className="text-2xl font-bold text-purple-600 dark:text-purple-400">
                      {breakdown.epics.reduce((sum, epic) => sum + epic.tasks.length, 0)}
                    </div>
                    <div className="text-xs text-gray-600 dark:text-gray-400 mt-1">Tasks</div>
                  </div>
                  <div>
                    <div className="text-2xl font-bold text-purple-600 dark:text-purple-400">
                      {breakdown.overallEstimate || 'N/A'}h
                    </div>
                    <div className="text-xs text-gray-600 dark:text-gray-400 mt-1">Estimated</div>
                  </div>
                </div>
              </div>

              {/* Risks */}
              {breakdown.risks.length > 0 && (
                <div className="bg-orange-50 dark:bg-orange-900/20 border border-orange-200 dark:border-orange-800 rounded-lg p-4">
                  <div className="flex items-center gap-2 mb-3">
                    <AlertTriangle size={18} className="text-orange-600 dark:text-orange-400" />
                    <h3 className="font-semibold text-orange-900 dark:text-orange-200">Risks Identified</h3>
                  </div>
                  <ul className="space-y-1">
                    {breakdown.risks.map((risk, idx) => (
                      <li key={idx} className="text-sm text-orange-800 dark:text-orange-300">
                        • {risk}
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              {/* Recommendations */}
              {breakdown.recommendations.length > 0 && (
                <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-4">
                  <div className="flex items-center gap-2 mb-3">
                    <CheckCircle2 size={18} className="text-blue-600 dark:text-blue-400" />
                    <h3 className="font-semibold text-blue-900 dark:text-blue-200">Recommendations</h3>
                  </div>
                  <ul className="space-y-1">
                    {breakdown.recommendations.map((rec, idx) => (
                      <li key={idx} className="text-sm text-blue-800 dark:text-blue-300">
                        • {rec}
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              {/* Epics & Tasks */}
              <div>
                <h3 className="font-semibold text-gray-900 dark:text-white mb-3">Breakdown Preview</h3>
                <div className="space-y-4">
                  {breakdown.epics.map((epic, epicIdx) => (
                    <div
                      key={epicIdx}
                      className="border border-gray-200 dark:border-gray-700 rounded-lg overflow-hidden"
                    >
                      <div className="bg-gray-50 dark:bg-gray-900/50 p-3">
                        <div className="font-medium text-gray-900 dark:text-white">{epic.title}</div>
                        <div className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                          {epic.tasks.length} tasks • Priority {epic.priority}
                        </div>
                      </div>
                      <div className="divide-y divide-gray-200 dark:divide-gray-700">
                        {epic.tasks.map((task, taskIdx) => (
                          <div key={taskIdx} className="p-3">
                            <div className="flex items-start justify-between gap-2">
                              <div className="flex-1">
                                <div className="text-sm font-medium text-gray-900 dark:text-white">
                                  {task.title}
                                </div>
                                <div className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                                  {task.estimatedHours}h • Risk: {task.riskLevel}
                                  {task.requiredSkills.length > 0 && ` • Skills: ${task.requiredSkills.join(', ')}`}
                                </div>
                              </div>
                              <span
                                className={`text-xs px-2 py-0.5 rounded ${
                                  task.riskLevel === 'critical'
                                    ? 'bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-400'
                                    : task.riskLevel === 'high'
                                    ? 'bg-orange-100 dark:bg-orange-900/30 text-orange-700 dark:text-orange-400'
                                    : task.riskLevel === 'medium'
                                    ? 'bg-yellow-100 dark:bg-yellow-900/30 text-yellow-700 dark:text-yellow-400'
                                    : 'bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400'
                                }`}
                              >
                                P{task.priority}
                              </span>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-6 border-t border-gray-200 dark:border-gray-700 flex justify-end gap-3">
          <button
            onClick={onCancel}
            className="px-4 py-2 text-gray-600 dark:text-gray-400 hover:text-gray-800 dark:hover:text-gray-200 transition-colors"
          >
            Cancel
          </button>
          {step === 'input' && (
            <button
              onClick={handleAnalyze}
              disabled={!content.trim() || isProcessing}
              className="px-4 py-2 bg-purple-600 hover:bg-purple-700 disabled:bg-gray-400 text-white rounded-lg transition-colors font-medium flex items-center gap-2"
            >
              <Sparkles size={16} />
              Analyze
            </button>
          )}
          {step === 'review' && (
            <>
              <button
                onClick={() => {
                  setStep('input');
                  setBreakdown(null);
                }}
                className="px-4 py-2 border border-gray-200 dark:border-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 rounded-lg transition-colors"
              >
                Back
              </button>
              <button
                onClick={handleConfirm}
                className="px-4 py-2 bg-purple-600 hover:bg-purple-700 text-white rounded-lg transition-colors font-medium"
              >
                Create Tasks
              </button>
            </>
          )}
        </div>
      </div>
    </div>
  );
};
