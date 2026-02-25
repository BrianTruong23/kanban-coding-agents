'use client';

import { useState } from 'react';
import { X, Upload, FileText, Image as ImageIcon, Loader2, AlertTriangle } from 'lucide-react';
import { TaskBreakdownInput, TaskBreakdownResult } from '@/types/epic';
import { TaskBreakdownService } from '@/services/taskBreakdownService';

interface TaskBreakdownModalProps {
  isOpen: boolean;
  onClose: () => void;
  onBreakdownComplete: (result: TaskBreakdownResult) => void;
}

export const TaskBreakdownModal = ({ isOpen, onClose, onBreakdownComplete }: TaskBreakdownModalProps) => {
  const [inputType, setInputType] = useState<'issue' | 'prd' | 'screenshot'>('issue');
  const [content, setContent] = useState('');
  const [context, setContext] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!content.trim()) {
      setError('Please provide content to analyze');
      return;
    }

    setIsProcessing(true);
    setError(null);

    try {
      const input: TaskBreakdownInput = {
        type: inputType,
        content: content.trim(),
        context: context.trim() || undefined,
      };

      const result = await TaskBreakdownService.breakdownTask(input);
      onBreakdownComplete(result);
      onClose();

      // Reset form
      setContent('');
      setContext('');
      setInputType('issue');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to process task breakdown');
      console.error('Task breakdown error:', err);
    } finally {
      setIsProcessing(false);
    }
  };

  const handleClose = () => {
    if (!isProcessing) {
      onClose();
      setError(null);
    }
  };

  const exampleContent = {
    issue: `# User Authentication Feature

Implement a complete user authentication system with the following requirements:

1. Login page with email/password
2. Sign up page with validation
3. Password reset functionality
4. Session management
5. Protected routes
6. User profile page

The system should use JWT tokens and integrate with our existing API.`,

    prd: `# Mobile App Redesign - Product Requirements

## Overview
Redesign the mobile application to improve user experience and performance.

## Key Features
- Modern UI with Material Design 3
- Dark mode support
- Improved navigation flow
- Offline mode capability
- Push notifications
- Performance optimization (< 2s load time)

## Timeline
Sprint 1-2 (4 weeks)

## Success Metrics
- 20% increase in user engagement
- 50% reduction in load time`,

    screenshot: `Screenshot Analysis Context:

Please describe what you see in the screenshot or what changes need to be made.

For example:
- Redesign the dashboard layout
- Add new chart components
- Fix alignment issues in the header
- Implement the design from the mockup`,
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
      <div className="bg-white dark:bg-gray-800 rounded-xl w-full max-w-3xl shadow-2xl max-h-[90vh] flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200 dark:border-gray-700">
          <div>
            <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
              Automated Task Breakdown
            </h2>
            <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
              AI-powered analysis to break down issues into actionable tasks
            </p>
          </div>
          <button
            onClick={handleClose}
            disabled={isProcessing}
            className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 disabled:opacity-50"
          >
            <X size={24} />
          </button>
        </div>

        {/* Content */}
        <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto p-6 space-y-6">
          {/* Input Type Selection */}
          <div>
            <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-3">
              Input Type
            </label>
            <div className="grid grid-cols-3 gap-3">
              <button
                type="button"
                onClick={() => setInputType('issue')}
                className={`p-4 rounded-lg border-2 transition-all flex flex-col items-center gap-2 ${
                  inputType === 'issue'
                    ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20'
                    : 'border-gray-200 dark:border-gray-600 hover:border-gray-300 dark:hover:border-gray-500'
                }`}
              >
                <FileText size={24} className={inputType === 'issue' ? 'text-blue-500' : 'text-gray-400'} />
                <span className={`text-sm font-medium ${
                  inputType === 'issue' ? 'text-blue-700 dark:text-blue-300' : 'text-gray-600 dark:text-gray-400'
                }`}>
                  GitHub Issue
                </span>
              </button>

              <button
                type="button"
                onClick={() => setInputType('prd')}
                className={`p-4 rounded-lg border-2 transition-all flex flex-col items-center gap-2 ${
                  inputType === 'prd'
                    ? 'border-green-500 bg-green-50 dark:bg-green-900/20'
                    : 'border-gray-200 dark:border-gray-600 hover:border-gray-300 dark:hover:border-gray-500'
                }`}
              >
                <FileText size={24} className={inputType === 'prd' ? 'text-green-500' : 'text-gray-400'} />
                <span className={`text-sm font-medium ${
                  inputType === 'prd' ? 'text-green-700 dark:text-green-300' : 'text-gray-600 dark:text-gray-400'
                }`}>
                  PRD / Spec
                </span>
              </button>

              <button
                type="button"
                onClick={() => setInputType('screenshot')}
                className={`p-4 rounded-lg border-2 transition-all flex flex-col items-center gap-2 ${
                  inputType === 'screenshot'
                    ? 'border-purple-500 bg-purple-50 dark:bg-purple-900/20'
                    : 'border-gray-200 dark:border-gray-600 hover:border-gray-300 dark:hover:border-gray-500'
                }`}
              >
                <ImageIcon size={24} className={inputType === 'screenshot' ? 'text-purple-500' : 'text-gray-400'} />
                <span className={`text-sm font-medium ${
                  inputType === 'screenshot' ? 'text-purple-700 dark:text-purple-300' : 'text-gray-600 dark:text-gray-400'
                }`}>
                  Screenshot
                </span>
              </button>
            </div>
          </div>

          {/* Content Input */}
          <div>
            <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
              {inputType === 'screenshot' ? 'Description' : 'Content'} *
            </label>
            <textarea
              value={content}
              onChange={(e) => setContent(e.target.value)}
              placeholder={exampleContent[inputType]}
              className="w-full h-64 border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white p-3 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 dark:focus:ring-blue-400 resize-none font-mono text-sm"
              required
              disabled={isProcessing}
            />
            <p className="text-xs text-gray-500 dark:text-gray-400 mt-2">
              Tip: Provide detailed requirements, acceptance criteria, or feature descriptions for best results
            </p>
          </div>

          {/* Context Input */}
          <div>
            <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
              Additional Context (Optional)
            </label>
            <textarea
              value={context}
              onChange={(e) => setContext(e.target.value)}
              placeholder="Any additional information about the project, constraints, or preferences..."
              className="w-full h-24 border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white p-3 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 dark:focus:ring-blue-400 resize-none text-sm"
              disabled={isProcessing}
            />
          </div>

          {/* Error Display */}
          {error && (
            <div className="flex items-start gap-2 p-3 bg-red-50 dark:bg-red-900/30 border border-red-200 dark:border-red-800 rounded-lg">
              <AlertTriangle size={20} className="text-red-600 dark:text-red-400 flex-shrink-0 mt-0.5" />
              <p className="text-sm text-red-600 dark:text-red-400">{error}</p>
            </div>
          )}
        </form>

        {/* Footer */}
        <div className="flex justify-between items-center p-6 border-t border-gray-200 dark:border-gray-700">
          <p className="text-xs text-gray-500 dark:text-gray-400">
            Analysis will generate epics, tickets, subtasks, DoD, test notes, and risk flags
          </p>
          <div className="flex gap-3">
            <button
              type="button"
              onClick={handleClose}
              disabled={isProcessing}
              className="px-5 py-2 text-gray-600 dark:text-gray-400 hover:text-gray-800 dark:hover:text-gray-200 transition-colors disabled:opacity-50"
            >
              Cancel
            </button>
            <button
              onClick={handleSubmit}
              disabled={isProcessing || !content.trim()}
              className="px-5 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors font-medium disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
            >
              {isProcessing ? (
                <>
                  <Loader2 size={16} className="animate-spin" />
                  Analyzing...
                </>
              ) : (
                <>
                  <Upload size={16} />
                  Analyze & Break Down
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
