'use client';

import { useState } from 'react';
import { X, FileText, Image, Code, Loader2, Sparkles } from 'lucide-react';
import { BreakdownInput, BreakdownInputType, BreakdownResult } from '@/types/breakdown';
import { breakdownTask, createSimpleBreakdown } from '@/lib/taskBreakdown';

interface TaskBreakdownModalProps {
  isOpen: boolean;
  onClose: () => void;
  onBreakdownComplete: (result: BreakdownResult) => void;
}

export const TaskBreakdownModal = ({ isOpen, onClose, onBreakdownComplete }: TaskBreakdownModalProps) => {
  const [inputType, setInputType] = useState<BreakdownInputType>('text');
  const [content, setContent] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [useAI, setUseAI] = useState(true);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!content.trim()) return;

    setIsProcessing(true);
    setError(null);

    try {
      const input: BreakdownInput = {
        type: inputType,
        content,
      };

      let result: BreakdownResult;

      if (useAI) {
        try {
          result = await breakdownTask(input);
        } catch (aiError) {
          console.warn('AI breakdown failed, falling back to simple breakdown:', aiError);
          setError('AI service unavailable. Using basic breakdown instead.');
          result = createSimpleBreakdown(input);
        }
      } else {
        result = createSimpleBreakdown(input);
      }

      onBreakdownComplete(result);
      handleClose();
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to breakdown task';
      setError(message);
    } finally {
      setIsProcessing(false);
    }
  };

  const handleClose = () => {
    setContent('');
    setError(null);
    setInputType('text');
    onClose();
  };

  const inputTypes = [
    { value: 'text' as BreakdownInputType, label: 'Text/Issue', icon: FileText },
    { value: 'prd' as BreakdownInputType, label: 'PRD', icon: Code },
    { value: 'screenshot' as BreakdownInputType, label: 'Screenshot', icon: Image },
  ];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4" onClick={handleClose}>
      <div className="bg-white dark:bg-gray-800 p-6 rounded-xl w-full max-w-2xl shadow-xl max-h-[90vh] overflow-y-auto" onClick={(e) => e.stopPropagation()}>
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <Sparkles className="text-purple-500" size={24} />
            <h3 className="text-lg font-bold text-gray-900 dark:text-white">AI Task Breakdown</h3>
          </div>
          <button
            onClick={handleClose}
            className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
          >
            <X size={20} />
          </button>
        </div>

        <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">
          Paste an issue description, PRD, or screenshot URL. AI will break it down into epics, tasks, and subtasks with DoD, test notes, and risk assessment.
        </p>

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Input Type Selection */}
          <div>
            <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-2">Input Type</label>
            <div className="flex gap-2">
              {inputTypes.map(({ value, label, icon: Icon }) => (
                <button
                  key={value}
                  type="button"
                  onClick={() => setInputType(value)}
                  className={`flex-1 flex items-center justify-center gap-2 px-4 py-2 rounded-lg border-2 transition-colors ${
                    inputType === value
                      ? 'border-purple-500 bg-purple-50 dark:bg-purple-900/20 text-purple-700 dark:text-purple-300'
                      : 'border-gray-200 dark:border-gray-600 text-gray-600 dark:text-gray-400 hover:border-gray-300 dark:hover:border-gray-500'
                  }`}
                >
                  <Icon size={16} />
                  <span className="text-sm font-medium">{label}</span>
                </button>
              ))}
            </div>
          </div>

          {/* Content Input */}
          <div>
            <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">
              {inputType === 'screenshot' ? 'Screenshot URL' : 'Content'}
            </label>
            <textarea
              className="w-full border border-gray-200 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white p-3 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 dark:focus:ring-purple-400 resize-none"
              placeholder={
                inputType === 'screenshot'
                  ? 'Paste screenshot URL or describe the visual requirements...'
                  : inputType === 'prd'
                  ? 'Paste your Product Requirements Document here...'
                  : 'Paste issue description or requirements here...'
              }
              value={content}
              onChange={(e) => setContent(e.target.value)}
              rows={12}
              required
              disabled={isProcessing}
            />
          </div>

          {/* AI Toggle */}
          <div className="flex items-center gap-2 p-3 bg-gray-50 dark:bg-gray-700/50 rounded-lg">
            <input
              type="checkbox"
              id="useAI"
              checked={useAI}
              onChange={(e) => setUseAI(e.target.checked)}
              className="w-4 h-4 rounded border-gray-300 text-purple-500 focus:ring-purple-500"
            />
            <label htmlFor="useAI" className="text-sm text-gray-700 dark:text-gray-300 cursor-pointer">
              Use AI-powered breakdown (Claude 3.5 Sonnet)
            </label>
          </div>

          {error && (
            <div className="p-3 bg-yellow-50 dark:bg-yellow-900/30 border border-yellow-200 dark:border-yellow-800 rounded-lg text-sm text-yellow-700 dark:text-yellow-400">
              {error}
            </div>
          )}

          <div className="flex justify-end gap-2 pt-2">
            <button
              type="button"
              onClick={handleClose}
              className="px-4 py-2 text-gray-600 dark:text-gray-400 hover:text-gray-800 dark:hover:text-gray-200 transition-colors"
              disabled={isProcessing}
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-4 py-2 bg-purple-600 hover:bg-purple-700 text-white rounded-lg transition-colors font-medium flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
              disabled={isProcessing || !content.trim()}
            >
              {isProcessing ? (
                <>
                  <Loader2 size={16} className="animate-spin" />
                  Processing...
                </>
              ) : (
                <>
                  <Sparkles size={16} />
                  Break Down Task
                </>
              )}
            </button>
          </div>
        </form>

        <div className="mt-4 pt-4 border-t border-gray-200 dark:border-gray-700">
          <p className="text-xs text-gray-500 dark:text-gray-400">
            💡 <strong>Tip:</strong> The more detailed your input, the better the breakdown will be. Include acceptance criteria, technical constraints, and known risks.
          </p>
        </div>
      </div>
    </div>
  );
};
