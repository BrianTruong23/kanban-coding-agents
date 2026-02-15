'use client';

import { useState } from 'react';
import { X, FileText, AlertCircle, Upload, Loader2 } from 'lucide-react';
import { BreakdownRequestType } from '@/types/breakdown';

interface TaskBreakdownDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (type: BreakdownRequestType, input: string) => Promise<void>;
}

export const TaskBreakdownDialog = ({ isOpen, onClose, onSubmit }: TaskBreakdownDialogProps) => {
  const [requestType, setRequestType] = useState<BreakdownRequestType>('issue');
  const [inputText, setInputText] = useState('');
  const [inputUrl, setInputUrl] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setIsProcessing(true);

    try {
      const input = requestType === 'issue' && inputUrl ? inputUrl : inputText;

      if (!input.trim()) {
        setError('Please provide input for the breakdown');
        setIsProcessing(false);
        return;
      }

      await onSubmit(requestType, input);

      // Reset form
      setInputText('');
      setInputUrl('');
      setRequestType('issue');
      onClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to process breakdown');
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4"
      onClick={onClose}
    >
      <div
        className="bg-white dark:bg-gray-800 rounded-xl w-full max-w-2xl shadow-2xl max-h-[90vh] overflow-y-auto"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="sticky top-0 bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 p-6 z-10">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
                AI Task Breakdown
              </h2>
              <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                Break down a PRD, issue, or screenshot into epics, tasks, and subtasks
              </p>
            </div>
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
              disabled={isProcessing}
            >
              <X size={24} />
            </button>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-6">
          {/* Request Type Selection */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">
              Input Type
            </label>
            <div className="grid grid-cols-3 gap-3">
              <button
                type="button"
                onClick={() => setRequestType('issue')}
                className={`p-4 rounded-lg border-2 transition-all ${
                  requestType === 'issue'
                    ? 'border-black dark:border-white bg-gray-50 dark:bg-gray-700'
                    : 'border-gray-200 dark:border-gray-600 hover:border-gray-300 dark:hover:border-gray-500'
                }`}
              >
                <AlertCircle
                  size={24}
                  className={`mx-auto mb-2 ${
                    requestType === 'issue'
                      ? 'text-black dark:text-white'
                      : 'text-gray-400 dark:text-gray-500'
                  }`}
                />
                <span className="text-sm font-medium text-gray-900 dark:text-white">
                  GitHub Issue
                </span>
              </button>

              <button
                type="button"
                onClick={() => setRequestType('prd')}
                className={`p-4 rounded-lg border-2 transition-all ${
                  requestType === 'prd'
                    ? 'border-black dark:border-white bg-gray-50 dark:bg-gray-700'
                    : 'border-gray-200 dark:border-gray-600 hover:border-gray-300 dark:hover:border-gray-500'
                }`}
              >
                <FileText
                  size={24}
                  className={`mx-auto mb-2 ${
                    requestType === 'prd'
                      ? 'text-black dark:text-white'
                      : 'text-gray-400 dark:text-gray-500'
                  }`}
                />
                <span className="text-sm font-medium text-gray-900 dark:text-white">
                  PRD Document
                </span>
              </button>

              <button
                type="button"
                onClick={() => setRequestType('screenshot')}
                className={`p-4 rounded-lg border-2 transition-all ${
                  requestType === 'screenshot'
                    ? 'border-black dark:border-white bg-gray-50 dark:bg-gray-700'
                    : 'border-gray-200 dark:border-gray-600 hover:border-gray-300 dark:hover:border-gray-500'
                }`}
              >
                <Upload
                  size={24}
                  className={`mx-auto mb-2 ${
                    requestType === 'screenshot'
                      ? 'text-black dark:text-white'
                      : 'text-gray-400 dark:text-gray-500'
                  }`}
                />
                <span className="text-sm font-medium text-gray-900 dark:text-white">
                  Screenshot
                </span>
              </button>
            </div>
          </div>

          {/* Input Fields */}
          {requestType === 'issue' && (
            <>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  GitHub Issue URL (optional)
                </label>
                <input
                  type="url"
                  value={inputUrl}
                  onChange={(e) => setInputUrl(e.target.value)}
                  placeholder="https://github.com/owner/repo/issues/123"
                  className="w-full border border-gray-200 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white p-3 rounded-lg focus:outline-none focus:ring-2 focus:ring-black/10 dark:focus:ring-white/20"
                />
              </div>
              <div className="text-center text-sm text-gray-500 dark:text-gray-400">or</div>
            </>
          )}

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              {requestType === 'prd'
                ? 'PRD Content'
                : requestType === 'screenshot'
                ? 'Screenshot Description'
                : 'Issue Description'}
            </label>
            <textarea
              value={inputText}
              onChange={(e) => setInputText(e.target.value)}
              placeholder={
                requestType === 'prd'
                  ? 'Paste your Product Requirements Document here...'
                  : requestType === 'screenshot'
                  ? 'Describe what you see in the screenshot or paste the image URL...'
                  : 'Describe the issue or feature request...'
              }
              rows={10}
              className="w-full border border-gray-200 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white p-3 rounded-lg focus:outline-none focus:ring-2 focus:ring-black/10 dark:focus:ring-white/20 resize-none font-mono text-sm"
            />
            <p className="text-xs text-gray-500 dark:text-gray-400 mt-2">
              The AI will analyze this input and break it down into a structured epic with tasks,
              subtasks, DoD, test notes, and dependencies.
            </p>
          </div>

          {error && (
            <div className="p-3 bg-red-50 dark:bg-red-900/30 border border-red-200 dark:border-red-800 rounded-lg text-sm text-red-600 dark:text-red-400">
              {error}
            </div>
          )}

          {/* Actions */}
          <div className="flex justify-end gap-3 pt-4 border-t border-gray-200 dark:border-gray-700">
            <button
              type="button"
              onClick={onClose}
              disabled={isProcessing}
              className="px-5 py-2.5 text-gray-600 dark:text-gray-400 hover:text-gray-800 dark:hover:text-gray-200 transition-colors disabled:opacity-50"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isProcessing || (!inputText.trim() && !inputUrl.trim())}
              className="px-5 py-2.5 bg-black dark:bg-white text-white dark:text-black rounded-lg hover:bg-gray-800 dark:hover:bg-gray-200 transition-colors font-medium disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
            >
              {isProcessing ? (
                <>
                  <Loader2 size={18} className="animate-spin" />
                  Processing...
                </>
              ) : (
                'Generate Breakdown'
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
