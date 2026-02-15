'use client';

import { useState } from 'react';
import { BreakdownRequest, BreakdownResult } from '@/types/breakdown';
import { breakdownTask, generateRiskMitigation } from '@/lib/taskBreakdown';
import { FileText, Image, Code, Sparkles, AlertTriangle, CheckCircle } from 'lucide-react';

interface TaskBreakdownWizardProps {
  onComplete: (result: BreakdownResult) => void;
  onCancel: () => void;
}

export default function TaskBreakdownWizard({
  onComplete,
  onCancel,
}: TaskBreakdownWizardProps) {
  const [step, setStep] = useState<'input' | 'preview' | 'confirm'>('input');
  const [sourceType, setSourceType] = useState<BreakdownRequest['source']>('text');
  const [content, setContent] = useState('');
  const [imageUrl, setImageUrl] = useState('');
  const [context, setContext] = useState('');
  const [breakdownResult, setBreakdownResult] = useState<BreakdownResult | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);

  const handleAnalyze = async () => {
    setIsProcessing(true);

    const request: BreakdownRequest = {
      source: sourceType,
      content,
      imageUrl: sourceType === 'screenshot' ? imageUrl : undefined,
      context,
    };

    try {
      // Simulate processing delay
      await new Promise(resolve => setTimeout(resolve, 1000));

      const result = breakdownTask(request);

      // Add risk mitigation suggestions
      const riskSuggestions = generateRiskMitigation(result.tickets);
      result.suggestions.riskMitigation = riskSuggestions;

      setBreakdownResult(result);
      setStep('preview');
    } catch (error) {
      console.error('Error analyzing task:', error);
      alert('Error analyzing task. Please try again.');
    } finally {
      setIsProcessing(false);
    }
  };

  const handleConfirm = () => {
    if (breakdownResult) {
      onComplete(breakdownResult);
    }
  };

  const renderInputStep = () => (
    <div className="space-y-6">
      {/* Source Type Selection */}
      <div>
        <label className="block text-sm font-medium mb-2">Source Type</label>
        <div className="grid grid-cols-4 gap-3">
          {[
            { value: 'text', icon: FileText, label: 'Text/PRD' },
            { value: 'issue', icon: Code, label: 'GitHub Issue' },
            { value: 'screenshot', icon: Image, label: 'Screenshot' },
            { value: 'prd', icon: FileText, label: 'Product Doc' },
          ].map(({ value, icon: Icon, label }) => (
            <button
              key={value}
              onClick={() => setSourceType(value as BreakdownRequest['source'])}
              className={`p-4 border rounded-lg flex flex-col items-center gap-2 transition-all ${
                sourceType === value
                  ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20'
                  : 'border-gray-300 dark:border-gray-600 hover:border-gray-400'
              }`}
            >
              <Icon className="w-6 h-6" />
              <span className="text-sm font-medium">{label}</span>
            </button>
          ))}
        </div>
      </div>

      {/* Content Input */}
      <div>
        <label className="block text-sm font-medium mb-2">
          {sourceType === 'screenshot' ? 'Screenshot Description' : 'Content'}
        </label>
        <textarea
          value={content}
          onChange={(e) => setContent(e.target.value)}
          placeholder={getPlaceholderText(sourceType)}
          className="w-full h-64 px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
        />
        <p className="text-xs text-gray-500 mt-1">
          Tip: Be as detailed as possible. Include features, requirements, constraints, and priorities.
        </p>
      </div>

      {/* Screenshot URL (if screenshot selected) */}
      {sourceType === 'screenshot' && (
        <div>
          <label className="block text-sm font-medium mb-2">Screenshot URL (optional)</label>
          <input
            type="text"
            value={imageUrl}
            onChange={(e) => setImageUrl(e.target.value)}
            placeholder="https://example.com/screenshot.png"
            className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          />
        </div>
      )}

      {/* Additional Context */}
      <div>
        <label className="block text-sm font-medium mb-2">Additional Context (optional)</label>
        <textarea
          value={context}
          onChange={(e) => setContext(e.target.value)}
          placeholder="Any additional context, constraints, or preferences..."
          className="w-full h-24 px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
        />
      </div>

      {/* Actions */}
      <div className="flex gap-3">
        <button
          onClick={handleAnalyze}
          disabled={!content.trim() || isProcessing}
          className="flex-1 px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed flex items-center justify-center gap-2"
        >
          {isProcessing ? (
            <>
              <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
              Analyzing...
            </>
          ) : (
            <>
              <Sparkles className="w-5 h-5" />
              Analyze & Break Down
            </>
          )}
        </button>
        <button
          onClick={onCancel}
          className="px-6 py-3 border border-gray-300 dark:border-gray-600 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700"
        >
          Cancel
        </button>
      </div>
    </div>
  );

  const renderPreviewStep = () => {
    if (!breakdownResult) return null;

    const { epics, tickets, subtasks, suggestions } = breakdownResult;
    const totalEffort = tickets.reduce((sum, t) => sum + t.estimatedEffort, 0);
    const highRiskCount = tickets.filter(t => t.riskLevel === 'high' || t.riskLevel === 'critical').length;

    return (
      <div className="space-y-6">
        {/* Summary */}
        <div className="bg-gradient-to-r from-green-50 to-blue-50 dark:from-green-900/20 dark:to-blue-900/20 rounded-lg p-6">
          <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
            <CheckCircle className="w-5 h-5 text-green-600" />
            Breakdown Complete
          </h3>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div>
              <div className="text-2xl font-bold">{epics.length}</div>
              <div className="text-sm text-gray-600 dark:text-gray-400">Epic{epics.length !== 1 ? 's' : ''}</div>
            </div>
            <div>
              <div className="text-2xl font-bold">{tickets.length}</div>
              <div className="text-sm text-gray-600 dark:text-gray-400">Ticket{tickets.length !== 1 ? 's' : ''}</div>
            </div>
            <div>
              <div className="text-2xl font-bold">{subtasks.length}</div>
              <div className="text-sm text-gray-600 dark:text-gray-400">Subtask{subtasks.length !== 1 ? 's' : ''}</div>
            </div>
            <div>
              <div className="text-2xl font-bold">{totalEffort}h</div>
              <div className="text-sm text-gray-600 dark:text-gray-400">Est. Effort</div>
            </div>
          </div>
        </div>

        {/* Risk Warnings */}
        {highRiskCount > 0 && (
          <div className="bg-orange-50 dark:bg-orange-900/20 border border-orange-200 dark:border-orange-800 rounded-lg p-4">
            <div className="flex items-start gap-2">
              <AlertTriangle className="w-5 h-5 text-orange-600 mt-0.5" />
              <div>
                <h4 className="font-semibold text-sm">Risk Alert</h4>
                <p className="text-sm text-gray-700 dark:text-gray-300">
                  {highRiskCount} ticket{highRiskCount !== 1 ? 's' : ''} flagged as high risk. Review mitigation suggestions below.
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Preview Lists */}
        <div className="space-y-4">
          {/* Epics */}
          {epics.length > 0 && (
            <div>
              <h4 className="font-semibold mb-2">Epics ({epics.length})</h4>
              <div className="space-y-2">
                {epics.map((epic, i) => (
                  <div key={i} className="border border-gray-200 dark:border-gray-700 rounded p-3">
                    <div className="font-medium">{epic.title}</div>
                    <div className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                      {epic.description.substring(0, 150)}...
                    </div>
                    <div className="text-xs text-gray-500 mt-2">
                      Risk: {epic.riskLevel} • Est. {epic.estimatedEffort}h
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Tickets */}
          {tickets.length > 0 && (
            <div>
              <h4 className="font-semibold mb-2">Tickets ({tickets.length})</h4>
              <div className="space-y-2 max-h-96 overflow-y-auto">
                {tickets.map((ticket, i) => (
                  <div key={i} className="border border-gray-200 dark:border-gray-700 rounded p-3">
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="font-mono text-sm font-semibold text-blue-600 dark:text-blue-400">
                          {ticket.ticketId}
                        </div>
                        <div className="font-medium">{ticket.title}</div>
                        <div className="text-xs text-gray-500 mt-1">
                          {ticket.requiredSkills.join(', ')} • {ticket.estimatedEffort}h • {ticket.riskLevel} risk
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Risk Mitigation */}
          {suggestions.riskMitigation.length > 0 && (
            <div>
              <h4 className="font-semibold mb-2">Risk Mitigation Suggestions</h4>
              <div className="space-y-2">
                {suggestions.riskMitigation.map((suggestion, i) => (
                  <div key={i} className="bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded p-3">
                    <div className="text-sm font-medium">{suggestion.risk}</div>
                    <div className="text-sm text-gray-700 dark:text-gray-300 mt-1">
                      {suggestion.mitigation}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Actions */}
        <div className="flex gap-3">
          <button
            onClick={handleConfirm}
            className="flex-1 px-6 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 flex items-center justify-center gap-2"
          >
            <CheckCircle className="w-5 h-5" />
            Confirm & Create Tasks
          </button>
          <button
            onClick={() => setStep('input')}
            className="px-6 py-3 border border-gray-300 dark:border-gray-600 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700"
          >
            Back to Edit
          </button>
        </div>
      </div>
    );
  };

  return (
    <div className="bg-white dark:bg-gray-900 rounded-lg shadow-xl max-w-4xl w-full max-h-[90vh] overflow-y-auto">
      {/* Header */}
      <div className="sticky top-0 bg-white dark:bg-gray-900 border-b border-gray-200 dark:border-gray-700 p-6 z-10">
        <h2 className="text-2xl font-bold">Task Breakdown Wizard</h2>
        <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
          Automatically break down issues, PRDs, or screenshots into epics, tickets, and subtasks
        </p>

        {/* Progress Steps */}
        <div className="flex items-center gap-2 mt-4">
          {['Input', 'Preview', 'Confirm'].map((label, i) => (
            <div key={label} className="flex items-center">
              <div
                className={`px-3 py-1 rounded text-sm ${
                  step === ['input', 'preview', 'confirm'][i]
                    ? 'bg-blue-600 text-white'
                    : 'bg-gray-200 dark:bg-gray-700 text-gray-600 dark:text-gray-400'
                }`}
              >
                {i + 1}. {label}
              </div>
              {i < 2 && <div className="w-8 h-0.5 bg-gray-300 dark:bg-gray-600" />}
            </div>
          ))}
        </div>
      </div>

      {/* Content */}
      <div className="p-6">
        {step === 'input' && renderInputStep()}
        {step === 'preview' && renderPreviewStep()}
      </div>
    </div>
  );
}

function getPlaceholderText(sourceType: BreakdownRequest['source']): string {
  switch (sourceType) {
    case 'issue':
      return `Paste your GitHub issue here...

Example:
# Add User Authentication
We need to implement user authentication with email/password and OAuth.

Requirements:
- Email/password login
- Google OAuth integration
- JWT token management
- Password reset flow
- Remember me functionality`;

    case 'prd':
      return `Paste your Product Requirements Document here...

Example:
## Feature: Task Management System

### Overview
Build a task management system that allows users to create, assign, and track tasks.

### Requirements
1. Users can create tasks with title, description, priority
2. Tasks can be assigned to team members
3. Task status tracking (To Do, In Progress, Done)
4. Filtering and search capabilities`;

    case 'screenshot':
      return `Describe what you see in the screenshot...

Example:
The screenshot shows a dashboard with:
- Top navigation bar with logo and user menu
- Sidebar with navigation links
- Main content area with statistics cards
- Data table with pagination
- Action buttons for CRUD operations`;

    default:
      return `Enter your task description here...

Example:
Implement a real-time chat feature with:
- One-on-one messaging
- Group chats
- File attachments
- Read receipts
- Push notifications`;
  }
}
