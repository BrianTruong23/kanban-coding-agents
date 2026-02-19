'use client';

import { useState } from 'react';
import { X, FileText, Github, Image, Type, Sparkles, ChevronRight, AlertTriangle } from 'lucide-react';
import { BreakdownInput } from '@/types/breakdown';

interface TaskBreakdownWizardProps {
  onBreakdown: (input: BreakdownInput) => Promise<void>;
  onClose: () => void;
}

type SourceType = 'issue' | 'prd' | 'screenshot' | 'text';

export const TaskBreakdownWizard = ({ onBreakdown, onClose }: TaskBreakdownWizardProps) => {
  const [step, setStep] = useState<1 | 2>(1);
  const [sourceType, setSourceType] = useState<SourceType>('text');
  const [content, setContent] = useState('');
  const [context, setContext] = useState('');
  const [imageUrl, setImageUrl] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!content.trim()) return;

    setIsProcessing(true);
    try {
      const input: BreakdownInput = {
        source: sourceType,
        content,
        context: context || undefined,
        imageUrl: imageUrl || undefined,
      };
      await onBreakdown(input);
      onClose();
    } catch (error) {
      console.error('Breakdown failed:', error);
    } finally {
      setIsProcessing(false);
    }
  };

  const sourceOptions = [
    {
      type: 'text' as SourceType,
      icon: Type,
      title: 'Plain Text',
      description: 'Paste or type task requirements',
    },
    {
      type: 'issue' as SourceType,
      icon: Github,
      title: 'GitHub Issue',
      description: 'Paste GitHub issue content',
    },
    {
      type: 'prd' as SourceType,
      icon: FileText,
      title: 'PRD',
      description: 'Product Requirements Document',
    },
    {
      type: 'screenshot' as SourceType,
      icon: Image,
      title: 'Screenshot',
      description: 'Analyze screenshot or mockup',
    },
  ];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
      <div className="bg-white dark:bg-gray-800 rounded-xl w-full max-w-3xl shadow-2xl overflow-hidden">
        {/* Header */}
        <div className="bg-gradient-to-r from-blue-600 to-purple-600 p-6 text-white">
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center gap-3">
              <Sparkles size={24} />
              <h2 className="text-2xl font-bold">Task Breakdown Wizard</h2>
            </div>
            <button
              onClick={onClose}
              className="text-white/80 hover:text-white transition-colors"
              disabled={isProcessing}
            >
              <X size={24} />
            </button>
          </div>
          <p className="text-white/90 text-sm">
            Automatically break down requirements into epics, tickets, and subtasks
          </p>
        </div>

        {/* Progress indicator */}
        <div className="bg-gray-100 dark:bg-gray-700/50 px-6 py-3">
          <div className="flex items-center gap-2 text-sm">
            <div className={`px-3 py-1 rounded-full ${step === 1 ? 'bg-blue-600 text-white' : 'bg-gray-300 dark:bg-gray-600 text-gray-700 dark:text-gray-300'}`}>
              1. Source
            </div>
            <ChevronRight size={16} className="text-gray-400" />
            <div className={`px-3 py-1 rounded-full ${step === 2 ? 'bg-blue-600 text-white' : 'bg-gray-300 dark:bg-gray-600 text-gray-700 dark:text-gray-300'}`}>
              2. Content
            </div>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="p-6">
          {/* Step 1: Select Source */}
          {step === 1 && (
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-3">
                  Select Input Source
                </label>
                <div className="grid grid-cols-2 gap-3">
                  {sourceOptions.map((option) => {
                    const Icon = option.icon;
                    return (
                      <button
                        key={option.type}
                        type="button"
                        onClick={() => setSourceType(option.type)}
                        className={`p-4 rounded-lg border-2 transition-all text-left ${
                          sourceType === option.type
                            ? 'border-blue-600 bg-blue-50 dark:bg-blue-900/20'
                            : 'border-gray-200 dark:border-gray-600 hover:border-gray-300 dark:hover:border-gray-500'
                        }`}
                      >
                        <Icon
                          size={24}
                          className={`mb-2 ${
                            sourceType === option.type
                              ? 'text-blue-600 dark:text-blue-400'
                              : 'text-gray-400'
                          }`}
                        />
                        <div className="font-semibold text-gray-900 dark:text-white text-sm mb-1">
                          {option.title}
                        </div>
                        <div className="text-xs text-gray-500 dark:text-gray-400">
                          {option.description}
                        </div>
                      </button>
                    );
                  })}
                </div>
              </div>

              <div className="flex justify-end pt-4">
                <button
                  type="button"
                  onClick={() => setStep(2)}
                  className="px-6 py-2.5 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium flex items-center gap-2"
                >
                  Next
                  <ChevronRight size={18} />
                </button>
              </div>
            </div>
          )}

          {/* Step 2: Enter Content */}
          {step === 2 && (
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
                  Content *
                </label>
                <textarea
                  className="w-full border border-gray-200 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white p-3 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none font-mono text-sm"
                  placeholder={getPlaceholder(sourceType)}
                  value={content}
                  onChange={(e) => setContent(e.target.value)}
                  rows={12}
                  required
                  autoFocus
                />
                <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                  {getHelpText(sourceType)}
                </p>
              </div>

              {sourceType === 'screenshot' && (
                <div>
                  <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
                    Image URL
                  </label>
                  <input
                    type="url"
                    className="w-full border border-gray-200 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white p-3 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
                    placeholder="https://example.com/screenshot.png"
                    value={imageUrl}
                    onChange={(e) => setImageUrl(e.target.value)}
                  />
                </div>
              )}

              <div>
                <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
                  Additional Context (optional)
                </label>
                <textarea
                  className="w-full border border-gray-200 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white p-3 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none text-sm"
                  placeholder="Add any additional context, constraints, or requirements..."
                  value={context}
                  onChange={(e) => setContext(e.target.value)}
                  rows={3}
                />
              </div>

              {/* Info box */}
              <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-4 flex gap-3">
                <AlertTriangle size={20} className="text-blue-600 dark:text-blue-400 flex-shrink-0 mt-0.5" />
                <div className="text-sm">
                  <div className="font-semibold text-blue-900 dark:text-blue-200 mb-1">
                    What happens next?
                  </div>
                  <ul className="text-blue-800 dark:text-blue-300 space-y-1">
                    <li>• Tasks will be broken down into epics, tickets, and subtasks</li>
                    <li>• Each task will include Definition of Done and test notes</li>
                    <li>• Risk flags will be identified automatically</li>
                    <li>• Dependencies between tasks will be detected</li>
                  </ul>
                </div>
              </div>

              <div className="flex justify-between pt-4">
                <button
                  type="button"
                  onClick={() => setStep(1)}
                  className="px-6 py-2.5 text-gray-600 dark:text-gray-400 hover:text-gray-800 dark:hover:text-gray-200 transition-colors font-medium"
                  disabled={isProcessing}
                >
                  Back
                </button>
                <button
                  type="submit"
                  disabled={!content.trim() || isProcessing}
                  className="px-6 py-2.5 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
                >
                  {isProcessing ? (
                    <>
                      <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                      Processing...
                    </>
                  ) : (
                    <>
                      <Sparkles size={18} />
                      Generate Breakdown
                    </>
                  )}
                </button>
              </div>
            </div>
          )}
        </form>
      </div>
    </div>
  );
};

function getPlaceholder(sourceType: SourceType): string {
  switch (sourceType) {
    case 'text':
      return `# Epic: User Authentication
- Implement login page
- Add password reset
- Create registration flow

# Epic: Dashboard
- Build analytics widgets
- Add data visualization
  * Chart component
  * Table component`;

    case 'issue':
      return `### Description
Implement user authentication system

### Acceptance Criteria
- [ ] Users can log in with email/password
- [ ] Users can reset password
- [ ] Sessions persist for 7 days

### Technical Notes
- Use JWT for auth
- Implement OAuth providers`;

    case 'prd':
      return `## Overview
This feature adds a comprehensive user authentication system...

## Requirements
1. Login/Logout functionality
2. Password reset via email
3. Social login (Google, GitHub)

## User Stories
- As a user, I want to log in securely...`;

    case 'screenshot':
      return `Describe what's shown in the screenshot:

- Navigation bar with logo and menu
- Hero section with CTA button
- Features grid with 3 columns
- Footer with links`;

    default:
      return '';
  }
}

function getHelpText(sourceType: SourceType): string {
  switch (sourceType) {
    case 'text':
      return 'Use # for epics, - for tickets, and * for subtasks';
    case 'issue':
      return 'Paste the full GitHub issue content including description and acceptance criteria';
    case 'prd':
      return 'Include all requirements, user stories, and technical specifications';
    case 'screenshot':
      return 'Describe the UI elements and interactions shown in the screenshot';
    default:
      return '';
  }
}
