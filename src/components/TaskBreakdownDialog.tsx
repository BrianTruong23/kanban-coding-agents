'use client';

import { useState } from 'react';
import { X, FileText, Upload, Image as ImageIcon, Loader2, CheckCircle2 } from 'lucide-react';
import { TaskBreakdownInput, TaskBreakdownResult } from '@/types/breakdown';
import { taskBreakdownService } from '@/services/taskBreakdown';
import { Task } from '@/types/task';
import { AgentWithSkills } from '@/types/agentSkills';
import { agentAssignmentService } from '@/services/agentAssignment';

interface TaskBreakdownDialogProps {
  agents: AgentWithSkills[];
  onClose: () => void;
  onImport: (result: TaskBreakdownResult, assignments: Record<string, string>) => void;
}

export const TaskBreakdownDialog = ({ agents, onClose, onImport }: TaskBreakdownDialogProps) => {
  const [inputType, setInputType] = useState<'issue' | 'prd' | 'screenshot'>('issue');
  const [content, setContent] = useState('');
  const [imageUrl, setImageUrl] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);
  const [result, setResult] = useState<TaskBreakdownResult | null>(null);
  const [error, setError] = useState<string | null>(null);

  const handleBreakdown = async () => {
    if (!content.trim()) {
      setError('Please enter some content to analyze');
      return;
    }

    setIsProcessing(true);
    setError(null);

    try {
      const input: TaskBreakdownInput = {
        type: inputType,
        content,
        imageUrl: inputType === 'screenshot' ? imageUrl : undefined,
      };

      const breakdownResult = await taskBreakdownService.breakdown(input);
      setResult(breakdownResult);
    } catch (err) {
      console.error('Breakdown error:', err);
      setError('Failed to break down the input. Please try again.');
    } finally {
      setIsProcessing(false);
    }
  };

  const handleImport = () => {
    if (!result) return;

    // Resolve skill-based assignments to actual agent IDs
    const resolvedAssignments: Record<string, string> = {};

    Object.entries(result.suggestedAgentAssignments).forEach(([index, skillOrAgentId]) => {
      if (skillOrAgentId.startsWith('skill:')) {
        const skillName = skillOrAgentId.replace('skill:', '');
        const agentId = agentAssignmentService.findAgentBySkill(skillName, agents);
        if (agentId) {
          resolvedAssignments[index] = agentId;
        }
      } else {
        resolvedAssignments[index] = skillOrAgentId;
      }
    });

    onImport(result, resolvedAssignments);
  };

  const exampleContent = {
    issue: `# Implement User Authentication

Add user authentication to the application with the following requirements:

## Tasks
- [ ] Create login page with email/password fields
- [ ] Implement JWT token generation and validation
- [ ] Add registration page with form validation
- [ ] Create password reset functionality
- [ ] Add OAuth integration (Google, GitHub)
- [ ] Implement protected routes middleware
- [ ] Add user profile management page
- [ ] Write tests for authentication flows

## Priority
High priority - blocking other features

## Notes
- Use bcrypt for password hashing
- Store tokens in httpOnly cookies
- Add rate limiting to prevent brute force attacks`,
    prd: `# Product Requirements Document: Task Management Dashboard

## Overview
Build a comprehensive task management dashboard for teams to organize their work.

## Features
1. Task Creation and Management
   - Users can create, edit, and delete tasks
   - Support for task descriptions, priorities, and due dates

2. Team Collaboration
   - Assign tasks to team members
   - Add comments and attachments
   - Real-time notifications

3. Board Views
   - Kanban board view
   - List view with filters
   - Calendar view for deadlines

4. Reporting
   - Team productivity analytics
   - Task completion rates
   - Sprint velocity tracking

## Technical Requirements
- React/Next.js frontend
- Node.js backend with PostgreSQL
- WebSocket for real-time updates
- Cloud storage for attachments`,
    screenshot: `[For screenshot option, describe what you see in the image]

Example: "The screenshot shows a login page mockup with:
- Email and password input fields at the center
- 'Sign In' button below the form
- 'Forgot Password?' link
- Social login options (Google, GitHub) at the bottom
- Logo and welcome message at the top
- Clean, modern design with purple accent colors"`,
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
      <div className="bg-white dark:bg-gray-800 rounded-xl w-full max-w-4xl max-h-[90vh] flex flex-col shadow-2xl">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200 dark:border-gray-700">
          <div>
            <h2 className="text-xl font-bold text-gray-900 dark:text-white">
              Automated Task Breakdown
            </h2>
            <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
              Import an issue, PRD, or screenshot to automatically generate tasks
            </p>
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
          {!result ? (
            <div className="space-y-6">
              {/* Input Type Selector */}
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">
                  Input Type
                </label>
                <div className="grid grid-cols-3 gap-3">
                  <button
                    onClick={() => setInputType('issue')}
                    className={`flex flex-col items-center gap-2 p-4 rounded-lg border-2 transition-all ${
                      inputType === 'issue'
                        ? 'border-black dark:border-white bg-gray-50 dark:bg-gray-700'
                        : 'border-gray-200 dark:border-gray-600 hover:border-gray-300 dark:hover:border-gray-500'
                    }`}
                  >
                    <FileText size={24} />
                    <span className="text-sm font-medium">GitHub Issue</span>
                  </button>
                  <button
                    onClick={() => setInputType('prd')}
                    className={`flex flex-col items-center gap-2 p-4 rounded-lg border-2 transition-all ${
                      inputType === 'prd'
                        ? 'border-black dark:border-white bg-gray-50 dark:bg-gray-700'
                        : 'border-gray-200 dark:border-gray-600 hover:border-gray-300 dark:hover:border-gray-500'
                    }`}
                  >
                    <Upload size={24} />
                    <span className="text-sm font-medium">PRD</span>
                  </button>
                  <button
                    onClick={() => setInputType('screenshot')}
                    className={`flex flex-col items-center gap-2 p-4 rounded-lg border-2 transition-all ${
                      inputType === 'screenshot'
                        ? 'border-black dark:border-white bg-gray-50 dark:bg-gray-700'
                        : 'border-gray-200 dark:border-gray-600 hover:border-gray-300 dark:hover:border-gray-500'
                    }`}
                  >
                    <ImageIcon size={24} />
                    <span className="text-sm font-medium">Screenshot</span>
                  </button>
                </div>
              </div>

              {/* Content Input */}
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  {inputType === 'issue'
                    ? 'Issue Content'
                    : inputType === 'prd'
                    ? 'PRD Content'
                    : 'Screenshot Description'}
                </label>
                <textarea
                  className="w-full border border-gray-200 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white p-3 rounded-lg focus:outline-none focus:ring-2 focus:ring-black/10 dark:focus:ring-white/20 resize-none font-mono text-sm"
                  rows={15}
                  placeholder={exampleContent[inputType]}
                  value={content}
                  onChange={(e) => setContent(e.target.value)}
                />
              </div>

              {inputType === 'screenshot' && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Image URL (optional)
                  </label>
                  <input
                    type="text"
                    className="w-full border border-gray-200 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white p-3 rounded-lg focus:outline-none focus:ring-2 focus:ring-black/10 dark:focus:ring-white/20"
                    placeholder="https://example.com/screenshot.png"
                    value={imageUrl}
                    onChange={(e) => setImageUrl(e.target.value)}
                  />
                </div>
              )}

              {error && (
                <div className="p-3 bg-red-50 dark:bg-red-900/30 border border-red-200 dark:border-red-800 rounded-lg text-sm text-red-600 dark:text-red-400">
                  {error}
                </div>
              )}
            </div>
          ) : (
            <div className="space-y-6">
              {/* Result Summary */}
              <div className="bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg p-4">
                <div className="flex items-center gap-2 mb-2">
                  <CheckCircle2 size={20} className="text-green-600 dark:text-green-400" />
                  <h3 className="font-semibold text-green-900 dark:text-green-100">
                    Breakdown Complete
                  </h3>
                </div>
                <p className="text-sm text-green-700 dark:text-green-300">
                  Generated {result.tasks.length} tasks with {result.dependencies.length}{' '}
                  dependencies
                </p>
              </div>

              {/* Epic Info */}
              <div>
                <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-3">Epic</h3>
                <div className="bg-gray-50 dark:bg-gray-700 rounded-lg p-4">
                  <h4 className="font-semibold text-gray-900 dark:text-white mb-2">
                    {result.epic.title}
                  </h4>
                  <p className="text-sm text-gray-600 dark:text-gray-400 mb-3">
                    {result.epic.description}
                  </p>
                  <div className="flex items-center gap-4 text-xs">
                    <span className="px-2 py-1 bg-white dark:bg-gray-800 rounded">
                      Priority: {result.epic.priority}
                    </span>
                    <span className="px-2 py-1 bg-white dark:bg-gray-800 rounded">
                      Status: {result.epic.status}
                    </span>
                    {result.epic.tags.length > 0 && (
                      <div className="flex gap-1">
                        {result.epic.tags.map((tag) => (
                          <span
                            key={tag}
                            className="px-2 py-1 bg-blue-100 dark:bg-blue-900 text-blue-700 dark:text-blue-300 rounded"
                          >
                            {tag}
                          </span>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              </div>

              {/* Tasks List */}
              <div>
                <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-3">
                  Tasks ({result.tasks.length})
                </h3>
                <div className="space-y-3">
                  {result.tasks.map((task, index) => (
                    <div
                      key={index}
                      className="bg-gray-50 dark:bg-gray-700 rounded-lg p-4 border border-gray-200 dark:border-gray-600"
                    >
                      <div className="flex items-start justify-between mb-2">
                        <h4 className="font-semibold text-gray-900 dark:text-white">{task.title}</h4>
                        <div className="flex items-center gap-2">
                          <span className="text-xs px-2 py-1 bg-white dark:bg-gray-800 rounded">
                            P{task.priority}
                          </span>
                        </div>
                      </div>
                      {task.description && (
                        <p className="text-sm text-gray-600 dark:text-gray-400 mb-2">
                          {task.description}
                        </p>
                      )}
                      {result.suggestedAgentAssignments[index] && (
                        <div className="mt-2 text-xs text-blue-600 dark:text-blue-400">
                          Suggested:{' '}
                          {result.suggestedAgentAssignments[index].replace('skill:', '')}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="flex items-center justify-end gap-3 p-6 border-t border-gray-200 dark:border-gray-700">
          {!result ? (
            <>
              <button
                onClick={onClose}
                className="px-4 py-2 text-gray-600 dark:text-gray-400 hover:text-gray-800 dark:hover:text-gray-200 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleBreakdown}
                disabled={isProcessing || !content.trim()}
                className="px-4 py-2 bg-black dark:bg-white text-white dark:text-black rounded-lg hover:bg-gray-800 dark:hover:bg-gray-200 transition-colors font-medium disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
              >
                {isProcessing ? (
                  <>
                    <Loader2 size={16} className="animate-spin" />
                    Processing...
                  </>
                ) : (
                  'Analyze & Break Down'
                )}
              </button>
            </>
          ) : (
            <>
              <button
                onClick={() => setResult(null)}
                className="px-4 py-2 text-gray-600 dark:text-gray-400 hover:text-gray-800 dark:hover:text-gray-200 transition-colors"
              >
                Start Over
              </button>
              <button
                onClick={handleImport}
                className="px-4 py-2 bg-black dark:bg-white text-white dark:text-black rounded-lg hover:bg-gray-800 dark:hover:bg-gray-200 transition-colors font-medium"
              >
                Import Tasks
              </button>
            </>
          )}
        </div>
      </div>
    </div>
  );
};
