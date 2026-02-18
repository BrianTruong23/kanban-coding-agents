'use client';

import { useState } from 'react';
import { X, FileText, Image, AlertCircle, Loader2 } from 'lucide-react';
import { breakdownTask, BreakdownInput, BreakdownResult } from '@/lib/taskBreakdown';

interface TaskBreakdownModalProps {
  isOpen: boolean;
  onClose: () => void;
  onBreakdownComplete: (result: BreakdownResult) => void;
  startTaskNumber: number;
}

export const TaskBreakdownModal = ({ isOpen, onClose, onBreakdownComplete, startTaskNumber }: TaskBreakdownModalProps) => {
  const [input, setInput] = useState('');
  const [inputType, setInputType] = useState<'issue' | 'prd' | 'screenshot'>('issue');
  const [isProcessing, setIsProcessing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleBreakdown = async () => {
    if (!input.trim()) {
      setError('Please provide input to break down');
      return;
    }

    setIsProcessing(true);
    setError(null);

    try {
      const breakdownInput: BreakdownInput = {
        source: input,
        type: inputType,
      };

      const result = await breakdownTask(breakdownInput, startTaskNumber);
      onBreakdownComplete(result);
      onClose();
      setInput('');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to break down task');
    } finally {
      setIsProcessing(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4" onClick={onClose}>
      <div className="bg-white dark:bg-gray-800 rounded-xl w-full max-w-4xl shadow-xl max-h-[90vh] overflow-hidden flex flex-col" onClick={(e) => e.stopPropagation()}>
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200 dark:border-gray-700">
          <div>
            <h3 className="text-xl font-bold text-gray-900 dark:text-white">AI Task Breakdown</h3>
            <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
              Break down issues, PRDs, or screenshots into epics, stories, and subtasks
            </p>
          </div>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
          >
            <X size={24} />
          </button>
        </div>

        {/* Body */}
        <div className="flex-1 overflow-y-auto p-6">
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
                      ? 'border-black dark:border-white bg-black/5 dark:bg-white/5'
                      : 'border-gray-200 dark:border-gray-600 hover:border-gray-300 dark:hover:border-gray-500'
                  }`}
                >
                  <FileText size={24} className="mx-auto mb-2 text-gray-700 dark:text-gray-300" />
                  <div className="text-sm font-medium text-gray-900 dark:text-white">Issue</div>
                  <div className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                    GitHub issue or bug report
                  </div>
                </button>

                <button
                  onClick={() => setInputType('prd')}
                  className={`p-4 rounded-lg border-2 transition-all ${
                    inputType === 'prd'
                      ? 'border-black dark:border-white bg-black/5 dark:bg-white/5'
                      : 'border-gray-200 dark:border-gray-600 hover:border-gray-300 dark:hover:border-gray-500'
                  }`}
                >
                  <FileText size={24} className="mx-auto mb-2 text-gray-700 dark:text-gray-300" />
                  <div className="text-sm font-medium text-gray-900 dark:text-white">PRD</div>
                  <div className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                    Product requirements document
                  </div>
                </button>

                <button
                  onClick={() => setInputType('screenshot')}
                  className={`p-4 rounded-lg border-2 transition-all ${
                    inputType === 'screenshot'
                      ? 'border-black dark:border-white bg-black/5 dark:bg-white/5'
                      : 'border-gray-200 dark:border-gray-600 hover:border-gray-300 dark:hover:border-gray-500'
                  }`}
                >
                  <Image size={24} className="mx-auto mb-2 text-gray-700 dark:text-gray-300" />
                  <div className="text-sm font-medium text-gray-900 dark:text-white">Screenshot</div>
                  <div className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                    UI mockup or design
                  </div>
                </button>
              </div>
            </div>

            {/* Input Text */}
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                {inputType === 'screenshot' ? 'Screenshot Description' : 'Input Content'}
              </label>
              <textarea
                value={input}
                onChange={(e) => setInput(e.target.value)}
                placeholder={getPlaceholder(inputType)}
                className="w-full border border-gray-200 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white p-4 rounded-lg h-96 focus:outline-none focus:ring-2 focus:ring-black/10 dark:focus:ring-white/20 resize-none font-mono text-sm"
              />
              <p className="text-xs text-gray-500 dark:text-gray-400 mt-2">
                Tip: Use markdown headers (## Epic:, ## Story:) and bullet points for better structure
              </p>
            </div>

            {/* Info Box */}
            <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-4">
              <div className="flex gap-3">
                <AlertCircle size={20} className="text-blue-600 dark:text-blue-400 flex-shrink-0 mt-0.5" />
                <div className="text-sm text-blue-800 dark:text-blue-200">
                  <p className="font-medium mb-1">How it works:</p>
                  <ul className="list-disc list-inside space-y-1 text-xs">
                    <li>The system will parse your input and identify epics, stories, and subtasks</li>
                    <li>Automatically generate Definition of Done (DoD) and test notes</li>
                    <li>Detect and flag potential risks based on keywords</li>
                    <li>Extract tags and estimate effort for each task</li>
                    <li>You can review and modify the breakdown before creating tasks</li>
                  </ul>
                </div>
              </div>
            </div>

            {/* Error Display */}
            {error && (
              <div className="bg-red-50 dark:bg-red-900/30 border border-red-200 dark:border-red-800 rounded-lg p-3 text-sm text-red-600 dark:text-red-400">
                {error}
              </div>
            )}
          </div>
        </div>

        {/* Footer */}
        <div className="p-6 border-t border-gray-200 dark:border-gray-700 flex justify-between items-center">
          <div className="text-sm text-gray-500 dark:text-gray-400">
            {input.trim() ? `${input.trim().split('\n').length} lines` : 'No input yet'}
          </div>
          <div className="flex gap-3">
            <button
              onClick={onClose}
              disabled={isProcessing}
              className="px-4 py-2 text-gray-600 dark:text-gray-400 hover:text-gray-800 dark:hover:text-gray-200 transition-colors disabled:opacity-50"
            >
              Cancel
            </button>
            <button
              onClick={handleBreakdown}
              disabled={isProcessing || !input.trim()}
              className="px-6 py-2 bg-black dark:bg-white text-white dark:text-black rounded-lg hover:bg-gray-800 dark:hover:bg-gray-200 transition-colors font-medium disabled:opacity-50 flex items-center gap-2"
            >
              {isProcessing ? (
                <>
                  <Loader2 size={16} className="animate-spin" />
                  Processing...
                </>
              ) : (
                'Break Down Tasks'
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

function getPlaceholder(type: 'issue' | 'prd' | 'screenshot'): string {
  switch (type) {
    case 'issue':
      return `Example:
## Epic: User Authentication
Implement a complete user authentication system

## Story: Login page
Create a login page with email and password fields
- [ ] Create login form component
- [ ] Add form validation
- [ ] Integrate with API

Definition of Done:
- Users can log in with email/password
- Form validates inputs
- Error messages are clear

Risks:
- Security vulnerabilities in auth flow`;

    case 'prd':
      return `Example:
## Epic: E-commerce Checkout
Build a complete checkout flow for the e-commerce platform

## Story: Shopping cart
Implement shopping cart functionality
- [ ] Display cart items
- [ ] Update quantities
- [ ] Calculate totals

## Story: Payment processing
Integrate payment gateway
- [ ] Add payment form
- [ ] Process payments
- [ ] Handle errors

Testing:
- Test all payment scenarios
- Verify security compliance`;

    case 'screenshot':
      return `Describe what you see in the screenshot:

Example:
The screenshot shows a dashboard with:
- Navigation bar at the top
- Sidebar with menu items
- Main content area with charts
- Data table below charts

Required features:
- Responsive layout
- Dark mode support
- Interactive charts`;
  }
}
