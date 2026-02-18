'use client';

import { useState } from 'react';
import { X, FileText, Sparkles, AlertTriangle, CheckCircle2, Clock } from 'lucide-react';
import { TaskBreakdownService } from '@/lib/taskBreakdown';
import { Task, TaskBreakdownResult } from '@/types/task';
import { CodingAgent } from '@/types/agent';
import { agentOrchestrator } from '@/lib/agentOrchestration';

interface TaskBreakdownModalProps {
  isOpen: boolean;
  onClose: () => void;
  onImport: (result: TaskBreakdownResult) => Promise<void>;
  currentTaskCount: number;
  agents: CodingAgent[];
}

export const TaskBreakdownModal = ({
  isOpen,
  onClose,
  onImport,
  currentTaskCount,
  agents,
}: TaskBreakdownModalProps) => {
  const [inputText, setInputText] = useState('');
  const [inputTitle, setInputTitle] = useState('');
  const [inputDescription, setInputDescription] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);
  const [result, setResult] = useState<TaskBreakdownResult | null>(null);
  const [error, setError] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleBreakdown = async () => {
    if (!inputText.trim()) {
      setError('Please enter issue/PRD content');
      return;
    }

    setIsProcessing(true);
    setError(null);

    try {
      const service = new TaskBreakdownService(currentTaskCount);
      const breakdown = service.breakdownIssue({
        title: inputTitle,
        description: inputDescription,
        type: 'text',
        content: inputText,
      });

      // Auto-suggest agents for tasks
      const allTasks = [
        ...(breakdown.epic ? [breakdown.epic] : []),
        ...breakdown.stories,
        ...breakdown.tasks,
        ...breakdown.subtasks,
      ];

      for (const task of allTasks) {
        const matches = agentOrchestrator.findBestAgentsForTask(task, agents, 3);
        task.suggestedAgentIds = matches.map(m => m.agentId);
      }

      setResult(breakdown);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to breakdown task');
      console.error(err);
    } finally {
      setIsProcessing(false);
    }
  };

  const handleImport = async () => {
    if (!result) return;

    setIsProcessing(true);
    try {
      await onImport(result);
      handleClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to import tasks');
    } finally {
      setIsProcessing(false);
    }
  };

  const handleClose = () => {
    setInputText('');
    setInputTitle('');
    setInputDescription('');
    setResult(null);
    setError(null);
    onClose();
  };

  const totalTasks = result
    ? (result.epic ? 1 : 0) + result.stories.length + result.tasks.length + result.subtasks.length
    : 0;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4"
      onClick={handleClose}
    >
      <div
        className="bg-white dark:bg-gray-800 rounded-xl w-full max-w-4xl max-h-[90vh] overflow-hidden shadow-2xl flex flex-col"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200 dark:border-gray-700">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-purple-100 dark:bg-purple-900/30 rounded-lg">
              <Sparkles size={24} className="text-purple-600 dark:text-purple-400" />
            </div>
            <div>
              <h2 className="text-xl font-bold text-gray-900 dark:text-white">
                AI Task Breakdown
              </h2>
              <p className="text-sm text-gray-500 dark:text-gray-400">
                Automatically break down issues/PRDs into epics, stories, and tasks
              </p>
            </div>
          </div>
          <button
            onClick={handleClose}
            className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
          >
            <X size={24} />
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6">
          {!result ? (
            // Input Form
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Issue/Epic Title (optional)
                </label>
                <input
                  type="text"
                  className="w-full border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white p-3 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
                  placeholder="e.g., User Authentication System"
                  value={inputTitle}
                  onChange={(e) => setInputTitle(e.target.value)}
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Description (optional)
                </label>
                <input
                  type="text"
                  className="w-full border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white p-3 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
                  placeholder="Brief description"
                  value={inputDescription}
                  onChange={(e) => setInputDescription(e.target.value)}
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Issue/PRD Content *
                </label>
                <textarea
                  className="w-full border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white p-3 rounded-lg h-64 focus:outline-none focus:ring-2 focus:ring-purple-500 font-mono text-sm"
                  placeholder={`Paste your issue, PRD, or requirements here. For example:

# User Authentication Feature

## Overview
Implement user authentication with email and password

## Requirements
- User registration with email validation
- Login with remember me option
- Password reset functionality
- Session management

## Acceptance Criteria
- Users can register with valid email
- Passwords are securely hashed
- Session expires after 24 hours

## Testing
- Unit tests for auth functions
- Integration tests for login flow
- Test edge cases like invalid emails`}
                  value={inputText}
                  onChange={(e) => setInputText(e.target.value)}
                  required
                />
              </div>

              {error && (
                <div className="p-3 bg-red-50 dark:bg-red-900/30 border border-red-200 dark:border-red-800 rounded-lg text-sm text-red-600 dark:text-red-400">
                  {error}
                </div>
              )}

              <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-4">
                <h4 className="text-sm font-semibold text-blue-900 dark:text-blue-300 mb-2">
                  💡 Tips for better results:
                </h4>
                <ul className="text-xs text-blue-800 dark:text-blue-400 space-y-1">
                  <li>• Use markdown headers (# ## ###) to structure your content</li>
                  <li>• List requirements as bullet points or numbered lists</li>
                  <li>• Include keywords like &quot;frontend&quot;, &quot;backend&quot;, &quot;urgent&quot; for automatic tagging</li>
                  <li>• Mention &quot;Definition of Done&quot; or &quot;Acceptance Criteria&quot; for DoD extraction</li>
                  <li>• Include test cases and edge cases for test note extraction</li>
                </ul>
              </div>
            </div>
          ) : (
            // Results Preview
            <div className="space-y-6">
              {/* Summary */}
              <div className="bg-gradient-to-r from-purple-50 to-blue-50 dark:from-purple-900/20 dark:to-blue-900/20 border border-purple-200 dark:border-purple-800 rounded-lg p-4">
                <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-3">
                  Breakdown Summary
                </h3>
                <div className="grid grid-cols-4 gap-4">
                  {result.epic && (
                    <div className="bg-white dark:bg-gray-800 rounded-lg p-3">
                      <div className="text-2xl font-bold text-purple-600 dark:text-purple-400">1</div>
                      <div className="text-xs text-gray-600 dark:text-gray-400">Epic</div>
                    </div>
                  )}
                  <div className="bg-white dark:bg-gray-800 rounded-lg p-3">
                    <div className="text-2xl font-bold text-blue-600 dark:text-blue-400">
                      {result.stories.length}
                    </div>
                    <div className="text-xs text-gray-600 dark:text-gray-400">Stories</div>
                  </div>
                  <div className="bg-white dark:bg-gray-800 rounded-lg p-3">
                    <div className="text-2xl font-bold text-green-600 dark:text-green-400">
                      {result.tasks.length}
                    </div>
                    <div className="text-xs text-gray-600 dark:text-gray-400">Tasks</div>
                  </div>
                  <div className="bg-white dark:bg-gray-800 rounded-lg p-3">
                    <div className="text-2xl font-bold text-orange-600 dark:text-orange-400">
                      {result.subtasks.length}
                    </div>
                    <div className="text-xs text-gray-600 dark:text-gray-400">Subtasks</div>
                  </div>
                </div>
              </div>

              {/* Task List */}
              <div className="space-y-3">
                {result.epic && <TaskPreview task={result.epic} agents={agents} />}
                {result.stories.map((story) => (
                  <TaskPreview key={story.id} task={story} agents={agents} />
                ))}
                {result.tasks.map((task) => (
                  <TaskPreview key={task.id} task={task} agents={agents} />
                ))}
                {result.subtasks.map((subtask) => (
                  <TaskPreview key={subtask.id} task={subtask} agents={agents} />
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="flex justify-between items-center gap-3 p-6 border-t border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-900">
          <div className="text-sm text-gray-600 dark:text-gray-400">
            {result && `${totalTasks} tasks ready to import`}
          </div>
          <div className="flex gap-3">
            <button
              onClick={handleClose}
              className="px-4 py-2 text-gray-600 dark:text-gray-400 hover:text-gray-800 dark:hover:text-gray-200"
            >
              Cancel
            </button>
            {!result ? (
              <button
                onClick={handleBreakdown}
                disabled={isProcessing || !inputText.trim()}
                className="px-6 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 disabled:opacity-50 disabled:cursor-not-allowed font-medium flex items-center gap-2"
              >
                {isProcessing ? (
                  <>
                    <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    Processing...
                  </>
                ) : (
                  <>
                    <Sparkles size={16} />
                    Break Down
                  </>
                )}
              </button>
            ) : (
              <>
                <button
                  onClick={() => setResult(null)}
                  className="px-4 py-2 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700"
                >
                  Edit Input
                </button>
                <button
                  onClick={handleImport}
                  disabled={isProcessing}
                  className="px-6 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50 font-medium flex items-center gap-2"
                >
                  {isProcessing ? (
                    <>
                      <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                      Importing...
                    </>
                  ) : (
                    <>
                      <CheckCircle2 size={16} />
                      Import All Tasks
                    </>
                  )}
                </button>
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

// Task Preview Component
const TaskPreview = ({ task, agents }: { task: Task; agents: CodingAgent[] }) => {
  const typeColors = {
    epic: 'bg-purple-100 text-purple-800 border-purple-300 dark:bg-purple-900/40 dark:text-purple-300 dark:border-purple-700',
    story: 'bg-blue-100 text-blue-800 border-blue-300 dark:bg-blue-900/40 dark:text-blue-300 dark:border-blue-700',
    task: 'bg-green-100 text-green-800 border-green-300 dark:bg-green-900/40 dark:text-green-300 dark:border-green-700',
    subtask: 'bg-orange-100 text-orange-800 border-orange-300 dark:bg-orange-900/40 dark:text-orange-300 dark:border-orange-700',
  };

  const suggestedAgents = task.suggestedAgentIds
    ?.map(id => agents.find(a => a.id === id))
    .filter(Boolean) as CodingAgent[] | undefined;

  return (
    <div className="border border-gray-200 dark:border-gray-700 rounded-lg p-4 hover:shadow-md transition-shadow">
      <div className="flex items-start justify-between mb-2">
        <div className="flex items-center gap-2 flex-1">
          <span
            className={`text-xs px-2 py-0.5 rounded font-semibold uppercase border ${
              typeColors[task.type]
            }`}
          >
            {task.type}
          </span>
          <span className="text-xs text-gray-500 dark:text-gray-400 font-mono">{task.taskId}</span>
          {task.estimatedEffort && (
            <span className="text-xs text-gray-500 dark:text-gray-400 flex items-center gap-1">
              <Clock size={12} />
              {task.estimatedEffort}h
            </span>
          )}
        </div>
        <div className="flex items-center gap-1">
          {task.tags.map((tag, i) => (
            <span
              key={i}
              className="text-[10px] px-2 py-0.5 rounded bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300"
            >
              {tag}
            </span>
          ))}
        </div>
      </div>

      <h4 className="font-semibold text-gray-900 dark:text-white mb-1">{task.title}</h4>
      {task.description && (
        <p className="text-sm text-gray-600 dark:text-gray-400 mb-2 line-clamp-2">
          {task.description}
        </p>
      )}

      {/* DoD */}
      {task.definitionOfDone && task.definitionOfDone.criteria.length > 0 && (
        <div className="mt-2 text-xs">
          <div className="font-semibold text-gray-700 dark:text-gray-300 mb-1 flex items-center gap-1">
            <CheckCircle2 size={12} />
            Definition of Done:
          </div>
          <ul className="list-disc list-inside text-gray-600 dark:text-gray-400 space-y-0.5">
            {task.definitionOfDone.criteria.slice(0, 3).map((criterion, i) => (
              <li key={i} className="truncate">
                {criterion}
              </li>
            ))}
            {task.definitionOfDone.criteria.length > 3 && (
              <li className="text-gray-500">+{task.definitionOfDone.criteria.length - 3} more</li>
            )}
          </ul>
        </div>
      )}

      {/* Risk Flags */}
      {task.riskFlags && task.riskFlags.length > 0 && (
        <div className="mt-2 flex items-center gap-2 text-xs">
          <AlertTriangle size={12} className="text-amber-600" />
          <span className="text-amber-600 dark:text-amber-400 font-semibold">
            {task.riskFlags.length} risk{task.riskFlags.length > 1 ? 's' : ''} identified
          </span>
        </div>
      )}

      {/* Suggested Agents */}
      {suggestedAgents && suggestedAgents.length > 0 && (
        <div className="mt-3 pt-2 border-t border-gray-200 dark:border-gray-700">
          <div className="text-xs text-gray-600 dark:text-gray-400 mb-1">Suggested agents:</div>
          <div className="flex gap-2">
            {suggestedAgents.slice(0, 3).map((agent) => (
              <div
                key={agent.id}
                className="text-xs px-2 py-1 rounded bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300"
              >
                {agent.name}
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};
