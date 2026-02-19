'use client';

import { useState } from 'react';
import { X, FileText, FileCode, Image, Sparkles } from 'lucide-react';
import { TaskBreakdownInput } from '@/types/taskBreakdown';
import { TaskBreakdownService } from '@/services/taskBreakdown';

interface TaskBreakdownModalProps {
  isOpen: boolean;
  onClose: () => void;
  onBreakdownComplete: (result: any) => void;
}

export const TaskBreakdownModal = ({ isOpen, onClose, onBreakdownComplete }: TaskBreakdownModalProps) => {
  const [inputType, setInputType] = useState<'issue' | 'prd' | 'screenshot'>('issue');
  const [content, setContent] = useState('');
  const [imageUrl, setImageUrl] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!content.trim()) return;

    setIsProcessing(true);
    setError(null);

    try {
      const input: TaskBreakdownInput = {
        type: inputType,
        content,
        imageUrl: inputType === 'screenshot' ? imageUrl : undefined
      };

      const result = await TaskBreakdownService.breakdownInput(input);
      onBreakdownComplete(result);

      // Reset form
      setContent('');
      setImageUrl('');
      setInputType('issue');
      onClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to process input');
    } finally {
      setIsProcessing(false);
    }
  };

  const exampleContent = {
    issue: `# User Authentication Feature

Implement a complete user authentication system with login, signup, and password reset functionality.

## Tasks:
- Create login page with email/password fields
- Implement signup flow with validation
- Add password reset via email
- Create session management
- Add protected routes

## Tests:
- Unit test: Auth validation logic
- Integration test: Login/signup flows
- E2E test: Complete user journey

## Risks:
- High: Security vulnerabilities in auth flow
- Medium: Email delivery issues

Priority: High`,
    prd: `# E-commerce Checkout Flow - PRD

## Overview
Build a seamless checkout experience for our e-commerce platform.

## Epic 1: Shopping Cart
- Display cart items with quantities
- Update item quantities
- Remove items from cart
- Calculate totals

## Epic 2: Checkout Process
- Shipping information form
- Payment integration
- Order confirmation
- Email receipts

## Definition of Done:
- All forms validate properly
- Payment processing works with test cards
- Confirmation emails sent successfully
- Mobile responsive design

## Test Notes:
- E2E: Complete purchase flow
- Integration: Payment gateway connection
- Unit: Price calculation logic`,
    screenshot: 'Describe what you see in the screenshot or paste the image URL below.'
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4" onClick={onClose}>
      <div
        className="bg-white dark:bg-gray-800 rounded-xl w-full max-w-3xl shadow-2xl max-h-[90vh] overflow-hidden flex flex-col"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200 dark:border-gray-700">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-purple-100 dark:bg-purple-900/30 rounded-lg">
              <Sparkles className="text-purple-600 dark:text-purple-400" size={24} />
            </div>
            <div>
              <h3 className="text-xl font-bold text-gray-900 dark:text-white">AI Task Breakdown</h3>
              <p className="text-sm text-gray-500 dark:text-gray-400">Break down issues, PRDs, or screenshots into actionable tasks</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 transition-colors"
          >
            <X size={24} />
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6">
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Input Type Selector */}
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">Input Type</label>
              <div className="grid grid-cols-3 gap-3">
                <button
                  type="button"
                  onClick={() => setInputType('issue')}
                  className={`p-4 rounded-lg border-2 transition-all ${
                    inputType === 'issue'
                      ? 'border-purple-500 bg-purple-50 dark:bg-purple-900/20'
                      : 'border-gray-200 dark:border-gray-600 hover:border-gray-300 dark:hover:border-gray-500'
                  }`}
                >
                  <FileText className={`mx-auto mb-2 ${inputType === 'issue' ? 'text-purple-600 dark:text-purple-400' : 'text-gray-400'}`} size={24} />
                  <div className={`text-sm font-medium ${inputType === 'issue' ? 'text-purple-600 dark:text-purple-400' : 'text-gray-700 dark:text-gray-300'}`}>
                    Issue
                  </div>
                </button>
                <button
                  type="button"
                  onClick={() => setInputType('prd')}
                  className={`p-4 rounded-lg border-2 transition-all ${
                    inputType === 'prd'
                      ? 'border-purple-500 bg-purple-50 dark:bg-purple-900/20'
                      : 'border-gray-200 dark:border-gray-600 hover:border-gray-300 dark:hover:border-gray-500'
                  }`}
                >
                  <FileCode className={`mx-auto mb-2 ${inputType === 'prd' ? 'text-purple-600 dark:text-purple-400' : 'text-gray-400'}`} size={24} />
                  <div className={`text-sm font-medium ${inputType === 'prd' ? 'text-purple-600 dark:text-purple-400' : 'text-gray-700 dark:text-gray-300'}`}>
                    PRD
                  </div>
                </button>
                <button
                  type="button"
                  onClick={() => setInputType('screenshot')}
                  className={`p-4 rounded-lg border-2 transition-all ${
                    inputType === 'screenshot'
                      ? 'border-purple-500 bg-purple-50 dark:bg-purple-900/20'
                      : 'border-gray-200 dark:border-gray-600 hover:border-gray-300 dark:hover:border-gray-500'
                  }`}
                >
                  <Image className={`mx-auto mb-2 ${inputType === 'screenshot' ? 'text-purple-600 dark:text-purple-400' : 'text-gray-400'}`} size={24} />
                  <div className={`text-sm font-medium ${inputType === 'screenshot' ? 'text-purple-600 dark:text-purple-400' : 'text-gray-700 dark:text-gray-300'}`}>
                    Screenshot
                  </div>
                </button>
              </div>
            </div>

            {/* Content Input */}
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                {inputType === 'screenshot' ? 'Description' : 'Content'} *
              </label>
              <textarea
                className="w-full border border-gray-200 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white p-3 rounded-lg h-64 focus:outline-none focus:ring-2 focus:ring-purple-500 dark:focus:ring-purple-400 resize-none font-mono text-sm"
                placeholder={exampleContent[inputType]}
                value={content}
                onChange={e => setContent(e.target.value)}
                required
              />
              <p className="mt-2 text-xs text-gray-500 dark:text-gray-400">
                Use markdown format with headings (#), bullet points (-), and clear structure for best results
              </p>
            </div>

            {/* Screenshot URL (optional) */}
            {inputType === 'screenshot' && (
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Image URL (optional)
                </label>
                <input
                  type="url"
                  className="w-full border border-gray-200 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white p-3 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 dark:focus:ring-purple-400"
                  placeholder="https://example.com/screenshot.png"
                  value={imageUrl}
                  onChange={e => setImageUrl(e.target.value)}
                />
              </div>
            )}

            {/* Error Display */}
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
                className="px-5 py-2.5 text-gray-600 dark:text-gray-400 hover:text-gray-800 dark:hover:text-gray-200 transition-colors font-medium"
                disabled={isProcessing}
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={isProcessing || !content.trim()}
                className="px-5 py-2.5 bg-purple-600 hover:bg-purple-700 dark:bg-purple-500 dark:hover:bg-purple-600 text-white rounded-lg transition-colors font-medium disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
              >
                {isProcessing ? (
                  <>
                    <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    Processing...
                  </>
                ) : (
                  <>
                    <Sparkles size={18} />
                    Generate Tasks
                  </>
                )}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};
