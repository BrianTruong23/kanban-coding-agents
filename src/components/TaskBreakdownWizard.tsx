'use client';

import { useState } from 'react';
import { Sparkles, FileText, Image as ImageIcon, Check, AlertTriangle } from 'lucide-react';
import { BreakdownInput, BreakdownResult, analyzeAndBreakdown } from '@/lib/taskBreakdown';
import { Task } from '@/types/task';

interface TaskBreakdownWizardProps {
  onComplete: (breakdown: BreakdownResult) => void;
  onCancel: () => void;
  maxTaskNumber: number;
}

export const TaskBreakdownWizard = ({ onComplete, onCancel, maxTaskNumber }: TaskBreakdownWizardProps) => {
  const [step, setStep] = useState<1 | 2 | 3>(1);
  const [inputType, setInputType] = useState<'issue' | 'prd' | 'screenshot'>('issue');
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [priority, setPriority] = useState<1 | 2 | 3 | 4 | 5>(3);
  const [sprint, setSprint] = useState('');
  const [breakdown, setBreakdown] = useState<BreakdownResult | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);

  const handleAnalyze = () => {
    if (!title.trim() || !content.trim()) return;

    setIsProcessing(true);

    // Simulate processing delay
    setTimeout(() => {
      const input: BreakdownInput = {
        type: inputType,
        title: title.trim(),
        content: content.trim(),
        priority,
        sprint: sprint.trim() || undefined,
      };

      const result = analyzeAndBreakdown(input);
      setBreakdown(result);
      setIsProcessing(false);
      setStep(3);
    }, 1000);
  };

  const handleComplete = () => {
    if (breakdown) {
      onComplete(breakdown);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
      <div className="bg-white dark:bg-gray-800 rounded-xl w-full max-w-4xl max-h-[90vh] flex flex-col shadow-2xl">
        {/* Header */}
        <div className="p-6 border-b border-gray-200 dark:border-gray-700">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-gradient-to-br from-purple-500 to-blue-500 rounded-lg">
              <Sparkles size={24} className="text-white" />
            </div>
            <div>
              <h2 className="text-xl font-bold text-gray-900 dark:text-white">
                AI Task Breakdown
              </h2>
              <p className="text-sm text-gray-600 dark:text-gray-400">
                Automatically break down issues, PRDs, or screenshots into epics, tickets, and subtasks
              </p>
            </div>
          </div>

          {/* Progress Indicator */}
          <div className="flex items-center gap-2 mt-4">
            {[1, 2, 3].map((s) => (
              <div key={s} className="flex items-center flex-1">
                <div
                  className={`flex items-center justify-center w-8 h-8 rounded-full font-semibold text-sm ${
                    step >= s
                      ? 'bg-blue-600 text-white'
                      : 'bg-gray-200 dark:bg-gray-700 text-gray-400 dark:text-gray-500'
                  }`}
                >
                  {step > s ? <Check size={16} /> : s}
                </div>
                {s < 3 && (
                  <div
                    className={`flex-1 h-1 mx-2 rounded ${
                      step > s
                        ? 'bg-blue-600'
                        : 'bg-gray-200 dark:bg-gray-700'
                    }`}
                  />
                )}
              </div>
            ))}
          </div>
          <div className="flex justify-between mt-2">
            <span className="text-xs text-gray-600 dark:text-gray-400">Input</span>
            <span className="text-xs text-gray-600 dark:text-gray-400">Configure</span>
            <span className="text-xs text-gray-600 dark:text-gray-400">Review</span>
          </div>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6">
          {/* Step 1: Select Input Type */}
          {step === 1 && (
            <div className="space-y-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">
                  What type of input do you have?
                </label>
                <div className="grid grid-cols-3 gap-3">
                  <button
                    onClick={() => setInputType('issue')}
                    className={`p-4 border-2 rounded-lg flex flex-col items-center gap-2 transition-all ${
                      inputType === 'issue'
                        ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20'
                        : 'border-gray-200 dark:border-gray-700 hover:border-gray-300 dark:hover:border-gray-600'
                    }`}
                  >
                    <FileText
                      size={32}
                      className={inputType === 'issue' ? 'text-blue-600' : 'text-gray-400'}
                    />
                    <span className="font-medium text-sm text-gray-900 dark:text-white">
                      GitHub Issue
                    </span>
                    <span className="text-xs text-gray-500 dark:text-gray-400 text-center">
                      Issue description or bug report
                    </span>
                  </button>

                  <button
                    onClick={() => setInputType('prd')}
                    className={`p-4 border-2 rounded-lg flex flex-col items-center gap-2 transition-all ${
                      inputType === 'prd'
                        ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20'
                        : 'border-gray-200 dark:border-gray-700 hover:border-gray-300 dark:hover:border-gray-600'
                    }`}
                  >
                    <FileText
                      size={32}
                      className={inputType === 'prd' ? 'text-blue-600' : 'text-gray-400'}
                    />
                    <span className="font-medium text-sm text-gray-900 dark:text-white">PRD</span>
                    <span className="text-xs text-gray-500 dark:text-gray-400 text-center">
                      Product Requirements Document
                    </span>
                  </button>

                  <button
                    onClick={() => setInputType('screenshot')}
                    className={`p-4 border-2 rounded-lg flex flex-col items-center gap-2 transition-all ${
                      inputType === 'screenshot'
                        ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20'
                        : 'border-gray-200 dark:border-gray-700 hover:border-gray-300 dark:hover:border-gray-600'
                    }`}
                  >
                    <ImageIcon
                      size={32}
                      className={inputType === 'screenshot' ? 'text-blue-600' : 'text-gray-400'}
                    />
                    <span className="font-medium text-sm text-gray-900 dark:text-white">
                      Screenshot
                    </span>
                    <span className="text-xs text-gray-500 dark:text-gray-400 text-center">
                      UI mockup or design
                    </span>
                  </button>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Title *
                </label>
                <input
                  type="text"
                  placeholder="e.g., Implement User Authentication System"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  className="w-full border border-gray-200 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white p-3 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  autoFocus
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Content *
                </label>
                <textarea
                  placeholder={
                    inputType === 'screenshot'
                      ? 'Describe what you see in the screenshot...'
                      : 'Paste the issue description, PRD content, or requirements...'
                  }
                  value={content}
                  onChange={(e) => setContent(e.target.value)}
                  className="w-full border border-gray-200 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white p-3 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
                  rows={12}
                />
                <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                  Tip: Include numbered lists, bullet points, or sections for better breakdown
                </p>
              </div>
            </div>
          )}

          {/* Step 2: Configure */}
          {step === 2 && (
            <div className="space-y-6">
              <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-4">
                <div className="flex items-start gap-3">
                  <Sparkles size={20} className="text-blue-600 dark:text-blue-400 mt-0.5" />
                  <div>
                    <h3 className="font-semibold text-gray-900 dark:text-white mb-1">
                      Ready to analyze
                    </h3>
                    <p className="text-sm text-gray-600 dark:text-gray-400">
                      The AI will analyze your input and automatically:
                    </p>
                    <ul className="text-sm text-gray-600 dark:text-gray-400 mt-2 space-y-1 list-disc list-inside">
                      <li>Create an epic to organize the work</li>
                      <li>Break down into tickets (tasks)</li>
                      <li>Generate subtasks for each ticket</li>
                      <li>Add Definition of Done for each item</li>
                      <li>Include test notes where relevant</li>
                      <li>Flag potential risks</li>
                      <li>Detect dependencies between tasks</li>
                    </ul>
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Priority
                  </label>
                  <select
                    value={priority}
                    onChange={(e) => setPriority(Number(e.target.value) as 1 | 2 | 3 | 4 | 5)}
                    className="w-full border border-gray-200 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white p-3 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value={1}>1 - Low</option>
                    <option value={2}>2 - Medium-Low</option>
                    <option value={3}>3 - Medium</option>
                    <option value={4}>4 - High</option>
                    <option value={5}>5 - Critical</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Sprint (optional)
                  </label>
                  <input
                    type="text"
                    placeholder="e.g., Sprint 12"
                    value={sprint}
                    onChange={(e) => setSprint(e.target.value)}
                    className="w-full border border-gray-200 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white p-3 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
              </div>

              <div className="bg-gray-50 dark:bg-gray-700/50 rounded-lg p-4">
                <h4 className="font-semibold text-sm text-gray-900 dark:text-white mb-2">
                  Preview
                </h4>
                <div className="space-y-2 text-sm">
                  <div>
                    <span className="text-gray-500 dark:text-gray-400">Type:</span>{' '}
                    <span className="font-medium text-gray-900 dark:text-white capitalize">
                      {inputType}
                    </span>
                  </div>
                  <div>
                    <span className="text-gray-500 dark:text-gray-400">Title:</span>{' '}
                    <span className="font-medium text-gray-900 dark:text-white">{title}</span>
                  </div>
                  <div>
                    <span className="text-gray-500 dark:text-gray-400">Content length:</span>{' '}
                    <span className="font-medium text-gray-900 dark:text-white">
                      {content.length} characters
                    </span>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Step 3: Review Breakdown */}
          {step === 3 && breakdown && (
            <div className="space-y-6">
              {isProcessing ? (
                <div className="flex flex-col items-center justify-center py-12">
                  <div className="animate-spin rounded-full h-12 w-12 border-4 border-blue-200 border-t-blue-600 mb-4" />
                  <p className="text-gray-600 dark:text-gray-400">Analyzing and breaking down...</p>
                </div>
              ) : (
                <>
                  <div className="bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg p-4">
                    <div className="flex items-start gap-3">
                      <Check size={20} className="text-green-600 dark:text-green-400 mt-0.5" />
                      <div>
                        <h3 className="font-semibold text-gray-900 dark:text-white mb-1">
                          Breakdown Complete
                        </h3>
                        <p className="text-sm text-gray-600 dark:text-gray-400">
                          Generated 1 epic, {breakdown.tickets.length} tickets, and{' '}
                          {breakdown.subtasks.length} subtasks with {breakdown.dependencies.length}{' '}
                          dependencies
                        </p>
                      </div>
                    </div>
                  </div>

                  {/* Epic Preview */}
                  <div>
                    <h4 className="font-semibold text-gray-900 dark:text-white mb-2 flex items-center gap-2">
                      Epic
                      <span className="bg-purple-100 dark:bg-purple-900/30 text-purple-800 dark:text-purple-300 px-2 py-0.5 rounded text-xs">
                        EPIC
                      </span>
                    </h4>
                    <div className="bg-gray-50 dark:bg-gray-700/50 rounded-lg p-3 border-l-4 border-purple-500">
                      <div className="font-medium text-gray-900 dark:text-white">
                        {breakdown.epic.title}
                      </div>
                      <div className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                        {breakdown.epic.tags?.join(', ')}
                      </div>
                      {breakdown.epic.riskLevel && breakdown.epic.riskLevel !== 'low' && (
                        <div className="mt-2 flex items-center gap-1 text-xs text-orange-600 dark:text-orange-400">
                          <AlertTriangle size={12} />
                          <span>Risk: {breakdown.epic.riskLevel}</span>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Tickets Preview */}
                  <div>
                    <h4 className="font-semibold text-gray-900 dark:text-white mb-2">
                      Tickets ({breakdown.tickets.length})
                    </h4>
                    <div className="space-y-2 max-h-64 overflow-y-auto">
                      {breakdown.tickets.map((ticket, index) => (
                        <div
                          key={index}
                          className="bg-gray-50 dark:bg-gray-700/50 rounded-lg p-3 border-l-4 border-blue-500"
                        >
                          <div className="font-medium text-sm text-gray-900 dark:text-white">
                            {ticket.title}
                          </div>
                          <div className="text-xs text-gray-600 dark:text-gray-400 mt-1">
                            {ticket.tags?.join(', ')} • Est: {ticket.estimatedHours}h
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Dependencies Preview */}
                  {breakdown.dependencies.length > 0 && (
                    <div>
                      <h4 className="font-semibold text-gray-900 dark:text-white mb-2">
                        Dependencies ({breakdown.dependencies.length})
                      </h4>
                      <div className="bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-lg p-3">
                        <p className="text-sm text-gray-600 dark:text-gray-400">
                          {breakdown.dependencies.length} task dependencies detected and will be
                          created automatically
                        </p>
                      </div>
                    </div>
                  )}
                </>
              )}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-6 border-t border-gray-200 dark:border-gray-700 flex justify-between">
          <button
            onClick={onCancel}
            className="px-4 py-2 text-gray-600 dark:text-gray-400 hover:text-gray-800 dark:hover:text-gray-200 transition-colors"
          >
            Cancel
          </button>
          <div className="flex gap-2">
            {step > 1 && !isProcessing && (
              <button
                onClick={() => setStep((step - 1) as 1 | 2)}
                className="px-4 py-2 border border-gray-200 dark:border-gray-700 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
              >
                Back
              </button>
            )}
            {step < 2 && (
              <button
                onClick={() => setStep(2)}
                disabled={!title.trim() || !content.trim()}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Next
              </button>
            )}
            {step === 2 && (
              <button
                onClick={handleAnalyze}
                disabled={isProcessing}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
              >
                <Sparkles size={16} />
                Analyze & Breakdown
              </button>
            )}
            {step === 3 && !isProcessing && (
              <button
                onClick={handleComplete}
                className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors flex items-center gap-2"
              >
                <Check size={16} />
                Create Tasks
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
