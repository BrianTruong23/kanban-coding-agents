'use client';

import { useState } from 'react';
import { X, FileText, Upload, Link2, Sparkles } from 'lucide-react';
import { IssueInput } from '@/types/breakdown';
import { TaskBreakdownService } from '@/lib/taskBreakdown';

interface TaskBreakdownModalProps {
  isOpen: boolean;
  onClose: () => void;
  onBreakdownComplete: (result: any) => void;
  userId: string;
}

export const TaskBreakdownModal = ({
  isOpen,
  onClose,
  onBreakdownComplete,
  userId
}: TaskBreakdownModalProps) => {
  const [inputType, setInputType] = useState<'text' | 'github-issue' | 'prd'>('text');
  const [content, setContent] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);
  const [githubUrl, setGithubUrl] = useState('');

  if (!isOpen) return null;

  const handleBreakdown = async () => {
    if (!content.trim()) return;

    setIsProcessing(true);
    try {
      const input: IssueInput = {
        type: inputType,
        content: content,
        metadata: {}
      };

      // Perform breakdown
      const result = TaskBreakdownService.breakdownIssue(input, userId);

      // Pass result back to parent
      onBreakdownComplete(result);

      // Reset and close
      setContent('');
      setGithubUrl('');
      onClose();
    } catch (error) {
      console.error('Error breaking down task:', error);
      alert('Failed to breakdown task. Please try again.');
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
        className="bg-white dark:bg-gray-800 rounded-xl w-full max-w-3xl shadow-xl max-h-[90vh] overflow-hidden flex flex-col"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="p-6 border-b border-gray-200 dark:border-gray-700">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-purple-100 dark:bg-purple-900/30 rounded-lg">
                <Sparkles size={24} className="text-purple-600 dark:text-purple-400" />
              </div>
              <div>
                <h2 className="text-xl font-bold text-gray-900 dark:text-white">
                  Automated Task Breakdown
                </h2>
                <p className="text-sm text-gray-500 dark:text-gray-400">
                  Paste your issue, PRD, or description and let AI break it down into actionable tasks
                </p>
              </div>
            </div>
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
            >
              <X size={24} />
            </button>
          </div>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6">
          {/* Input Type Selector */}
          <div className="mb-6">
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Input Type
            </label>
            <div className="flex gap-2">
              <button
                onClick={() => setInputType('text')}
                className={`flex-1 p-3 rounded-lg border-2 transition-all ${
                  inputType === 'text'
                    ? 'border-purple-500 bg-purple-50 dark:bg-purple-900/20 text-purple-700 dark:text-purple-300'
                    : 'border-gray-200 dark:border-gray-600 text-gray-600 dark:text-gray-400 hover:border-gray-300 dark:hover:border-gray-500'
                }`}
              >
                <FileText size={20} className="mx-auto mb-1" />
                <span className="text-xs font-medium">Text/PRD</span>
              </button>
              <button
                onClick={() => setInputType('github-issue')}
                className={`flex-1 p-3 rounded-lg border-2 transition-all ${
                  inputType === 'github-issue'
                    ? 'border-purple-500 bg-purple-50 dark:bg-purple-900/20 text-purple-700 dark:text-purple-300'
                    : 'border-gray-200 dark:border-gray-600 text-gray-600 dark:text-gray-400 hover:border-gray-300 dark:hover:border-gray-500'
                }`}
              >
                <Link2 size={20} className="mx-auto mb-1" />
                <span className="text-xs font-medium">GitHub Issue</span>
              </button>
            </div>
          </div>

          {/* GitHub URL Input */}
          {inputType === 'github-issue' && (
            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                GitHub Issue URL
              </label>
              <input
                type="url"
                value={githubUrl}
                onChange={(e) => setGithubUrl(e.target.value)}
                placeholder="https://github.com/owner/repo/issues/123"
                className="w-full border border-gray-200 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white p-3 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
              />
            </div>
          )}

          {/* Content Input */}
          <div className="mb-6">
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              {inputType === 'github-issue' ? 'Or paste issue content directly' : 'Task Description'}
            </label>
            <textarea
              value={content}
              onChange={(e) => setContent(e.target.value)}
              placeholder={`Paste your ${inputType === 'prd' ? 'Product Requirements Document (PRD)' : 'task description'} here...

Example:
# User Authentication System

Implement a complete user authentication system with the following features:

1. User registration with email verification
2. Login/logout functionality
3. Password reset via email
4. Session management
5. OAuth integration (Google, GitHub)
6. Two-factor authentication
7. User profile management

Technical Requirements:
- Use JWT for session tokens
- Store passwords securely (bcrypt)
- Rate limiting on auth endpoints
- Implement CSRF protection`}
              className="w-full border border-gray-200 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white p-3 rounded-lg h-64 focus:outline-none focus:ring-2 focus:ring-purple-500 resize-none font-mono text-sm"
            />
          </div>

          {/* Info Box */}
          <div className="p-4 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg">
            <h4 className="text-sm font-semibold text-blue-900 dark:text-blue-300 mb-2">
              What will be generated:
            </h4>
            <ul className="text-xs text-blue-800 dark:text-blue-400 space-y-1">
              <li>• <strong>Epics:</strong> High-level project phases (for complex tasks)</li>
              <li>• <strong>Tickets:</strong> Actionable work items with priorities</li>
              <li>• <strong>Subtasks:</strong> Detailed implementation steps</li>
              <li>• <strong>Definition of Done:</strong> Completion criteria for each task</li>
              <li>• <strong>Test Notes:</strong> Testing requirements and scenarios</li>
              <li>• <strong>Risk Flags:</strong> Potential blockers and mitigation strategies</li>
              <li>• <strong>Dependencies:</strong> Task relationships and ordering</li>
            </ul>
          </div>
        </div>

        {/* Footer */}
        <div className="p-6 border-t border-gray-200 dark:border-gray-700">
          <div className="flex justify-end gap-3">
            <button
              onClick={onClose}
              disabled={isProcessing}
              className="px-6 py-2 text-gray-600 dark:text-gray-400 hover:text-gray-800 dark:hover:text-gray-200 transition-colors disabled:opacity-50"
            >
              Cancel
            </button>
            <button
              onClick={handleBreakdown}
              disabled={!content.trim() || isProcessing}
              className="px-6 py-2 bg-purple-600 hover:bg-purple-700 text-white rounded-lg transition-colors font-medium disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
            >
              {isProcessing ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent"></div>
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
        </div>
      </div>
    </div>
  );
};
