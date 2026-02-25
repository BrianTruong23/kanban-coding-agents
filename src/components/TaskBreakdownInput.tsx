'use client';

import { useState } from 'react';
import { X, FileText, Image, Code, Sparkles } from 'lucide-react';
import { TaskBreakdownInput } from '@/types/task-breakdown';

interface TaskBreakdownInputProps {
  onSubmit: (input: TaskBreakdownInput) => void;
  onClose: () => void;
}

export function TaskBreakdownInputModal({ onSubmit, onClose }: TaskBreakdownInputProps) {
  const [inputType, setInputType] = useState<'issue' | 'prd' | 'screenshot'>('issue');
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [content, setContent] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (!title.trim() || !content.trim()) {
      alert('Please provide both title and content');
      return;
    }

    onSubmit({
      title,
      description,
      type: inputType,
      content,
    });
  };

  const examples = {
    issue: `Example:
As a user, I want to be able to filter tasks by sprint and status so that I can focus on specific work items.

Acceptance Criteria:
- Add dropdown filters for sprint and status
- Filters should work together (AND logic)
- Persist filter selection in localStorage
- Show task count for active filters

Technical Notes:
- Use existing sprint data from tasks
- Update visibleTasks computed property`,

    prd: `Example:
# Product Requirement: Team Analytics Dashboard

## Overview
Build an analytics dashboard to help teams track productivity and performance metrics.

## Features
1. Task Completion Metrics
   - Tasks completed per week/month
   - Average completion time
   - Completion rate by agent

2. Sprint Analytics
   - Sprint velocity trends
   - Burndown charts
   - Sprint completion percentage

3. Agent Performance
   - Individual productivity metrics
   - Task distribution
   - Quality scores

## Technical Requirements
- Real-time updates
- Export to CSV/PDF
- Mobile responsive design`,

    screenshot: `Describe what you see in the screenshot or paste the requirements text.

Example:
The screenshot shows a complex form with multiple sections:
1. User profile section with avatar upload
2. Personal information fields (name, email, phone)
3. Address form with autocomplete
4. Payment method integration
5. Preferences and notifications toggles

The form should support:
- Real-time validation
- Auto-save drafts
- Multi-step wizard
- Progress indicator`,
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-xl max-w-4xl w-full max-h-[90vh] flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-purple-100 rounded-lg">
              <Sparkles className="w-6 h-6 text-purple-600" />
            </div>
            <div>
              <h2 className="text-2xl font-bold text-gray-900">AI Task Breakdown</h2>
              <p className="text-sm text-gray-600">
                Automatically break down your requirements into epics, tickets, and subtasks
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        {/* Content */}
        <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto p-6">
          {/* Input Type Selection */}
          <div className="mb-6">
            <label className="block text-sm font-medium text-gray-700 mb-3">
              Input Type
            </label>
            <div className="grid grid-cols-3 gap-3">
              <button
                type="button"
                onClick={() => setInputType('issue')}
                className={`flex items-center gap-2 p-4 rounded-lg border-2 transition-all ${
                  inputType === 'issue'
                    ? 'border-blue-500 bg-blue-50 text-blue-700'
                    : 'border-gray-200 hover:border-gray-300'
                }`}
              >
                <Code className="w-5 h-5" />
                <div className="text-left">
                  <div className="font-medium">GitHub Issue</div>
                  <div className="text-xs text-gray-600">User stories & issues</div>
                </div>
              </button>

              <button
                type="button"
                onClick={() => setInputType('prd')}
                className={`flex items-center gap-2 p-4 rounded-lg border-2 transition-all ${
                  inputType === 'prd'
                    ? 'border-blue-500 bg-blue-50 text-blue-700'
                    : 'border-gray-200 hover:border-gray-300'
                }`}
              >
                <FileText className="w-5 h-5" />
                <div className="text-left">
                  <div className="font-medium">PRD</div>
                  <div className="text-xs text-gray-600">Product requirements</div>
                </div>
              </button>

              <button
                type="button"
                onClick={() => setInputType('screenshot')}
                className={`flex items-center gap-2 p-4 rounded-lg border-2 transition-all ${
                  inputType === 'screenshot'
                    ? 'border-blue-500 bg-blue-50 text-blue-700'
                    : 'border-gray-200 hover:border-gray-300'
                }`}
              >
                <Image className="w-5 h-5" />
                <div className="text-left">
                  <div className="font-medium">Screenshot</div>
                  <div className="text-xs text-gray-600">UI/mockup description</div>
                </div>
              </button>
            </div>
          </div>

          {/* Title */}
          <div className="mb-4">
            <label htmlFor="title" className="block text-sm font-medium text-gray-700 mb-2">
              Title *
            </label>
            <input
              id="title"
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="e.g., User Authentication System"
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              required
            />
          </div>

          {/* Description */}
          <div className="mb-4">
            <label htmlFor="description" className="block text-sm font-medium text-gray-700 mb-2">
              Short Description
            </label>
            <input
              id="description"
              type="text"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Brief summary of the feature or requirement"
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          {/* Content */}
          <div className="mb-4">
            <label htmlFor="content" className="block text-sm font-medium text-gray-700 mb-2">
              Content *
            </label>
            <textarea
              id="content"
              value={content}
              onChange={(e) => setContent(e.target.value)}
              placeholder={examples[inputType]}
              rows={12}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 font-mono text-sm"
              required
            />
          </div>

          {/* Info box */}
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
            <div className="flex gap-3">
              <Sparkles className="w-5 h-5 text-blue-600 flex-shrink-0 mt-0.5" />
              <div className="text-sm text-blue-900">
                <p className="font-medium mb-1">How it works:</p>
                <ul className="list-disc list-inside space-y-1 text-blue-800">
                  <li>AI analyzes your input to identify features and requirements</li>
                  <li>Automatically creates epics, tickets, and subtasks with proper hierarchy</li>
                  <li>Generates definition of done, test notes, and identifies risk flags</li>
                  <li>Recommends agent assignments based on skills and workload</li>
                  <li>Maps dependencies between tasks</li>
                </ul>
              </div>
            </div>
          </div>
        </form>

        {/* Footer */}
        <div className="flex items-center justify-end gap-3 p-6 border-t border-gray-200 bg-gray-50">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-100 transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={handleSubmit}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors flex items-center gap-2"
          >
            <Sparkles className="w-4 h-4" />
            Generate Breakdown
          </button>
        </div>
      </div>
    </div>
  );
}
