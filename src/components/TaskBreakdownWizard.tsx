'use client';

import { useState } from 'react';
import { Task, TaskBreakdown } from '@/types/task';
import { CodingAgent } from '@/types/agent';
import { quickBreakdown } from '@/lib/taskBreakdown';
import { autoAssignTask, findBestAgentsForTask } from '@/lib/agentMatcher';
import { FileText, Wand2, CheckCircle, AlertTriangle, Users, X } from 'lucide-react';

interface TaskBreakdownWizardProps {
  agents: CodingAgent[];
  existingTaskCount: number;
  sprint?: string;
  onBreakdownComplete: (breakdown: TaskBreakdown) => void;
  onClose: () => void;
}

export const TaskBreakdownWizard = ({
  agents,
  existingTaskCount,
  sprint,
  onBreakdownComplete,
  onClose,
}: TaskBreakdownWizardProps) => {
  const [step, setStep] = useState<'input' | 'preview' | 'assign'>('input');
  const [input, setInput] = useState('');
  const [breakdown, setBreakdown] = useState<TaskBreakdown | null>(null);
  const [autoAssign, setAutoAssign] = useState(true);
  const [isProcessing, setIsProcessing] = useState(false);

  const handleAnalyze = () => {
    if (!input.trim()) return;

    setIsProcessing(true);
    try {
      const result = quickBreakdown(input, existingTaskCount, sprint);
      setBreakdown(result);
      setStep('preview');
    } catch (error) {
      console.error('Error analyzing input:', error);
      alert('Failed to analyze input. Please try again.');
    } finally {
      setIsProcessing(false);
    }
  };

  const handleConfirm = () => {
    if (!breakdown) return;

    if (autoAssign) {
      // Auto-assign agents to tasks
      const allTasks = [...breakdown.epics, ...breakdown.tasks, ...breakdown.subtasks];
      allTasks.forEach(task => {
        const agentId = autoAssignTask(task, agents);
        if (agentId) {
          task.assignedAgentId = agentId;
        }
      });
    }

    onBreakdownComplete(breakdown);
  };

  const getRiskBadge = (riskLevel: Task['riskLevel']) => {
    if (riskLevel === 'none') return null;

    const colors = {
      low: 'bg-yellow-100 dark:bg-yellow-900/30 text-yellow-700 dark:text-yellow-400',
      medium: 'bg-orange-100 dark:bg-orange-900/30 text-orange-700 dark:text-orange-400',
      high: 'bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-400',
      critical: 'bg-red-200 dark:bg-red-900/50 text-red-900 dark:text-red-300',
    };

    return (
      <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${colors[riskLevel]}`}>
        ⚠ {riskLevel}
      </span>
    );
  };

  const getTaskTypeIcon = (taskType: Task['taskType']) => {
    switch (taskType) {
      case 'epic':
        return '📦';
      case 'subtask':
        return '📝';
      default:
        return '✓';
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
      <div className="bg-white dark:bg-gray-800 rounded-xl w-full max-w-4xl max-h-[90vh] overflow-hidden shadow-2xl flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200 dark:border-gray-700">
          <div className="flex items-center gap-3">
            <Wand2 className="text-blue-600 dark:text-blue-400" size={24} />
            <div>
              <h2 className="text-xl font-bold text-gray-900 dark:text-white">
                Task Breakdown Wizard
              </h2>
              <p className="text-sm text-gray-500 dark:text-gray-400">
                {step === 'input' && 'Paste your PRD, issue, or requirements'}
                {step === 'preview' && 'Review the generated breakdown'}
                {step === 'assign' && 'Configure agent assignments'}
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

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6">
          {step === 'input' && (
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Paste your requirements, PRD, or issue description
                </label>
                <textarea
                  className="w-full h-96 border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white p-4 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 font-mono text-sm resize-none"
                  placeholder={`Example:

# Epic: User Authentication System
Build a complete authentication system with login, signup, and password recovery.

## Feature: Login Page
- Create login UI with email and password fields
- Implement form validation
- Add "Remember me" checkbox
DoD: User can login, errors are displayed, session persists
Test: Manual and automated testing required
Risk: Medium - Integration with backend API
Estimate: 8 hours

## Feature: Signup Page
- Design signup form with email, password, confirm password
- Add email verification flow
- Implement password strength indicator
Risk: High - Email delivery and verification critical
Estimate: 12 hours

...add more features, tasks, or subtasks`}
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  autoFocus
                />
              </div>

              <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-4">
                <h3 className="text-sm font-semibold text-blue-900 dark:text-blue-300 mb-2 flex items-center gap-2">
                  <FileText size={16} />
                  Tips for better results:
                </h3>
                <ul className="text-sm text-blue-800 dark:text-blue-400 space-y-1 list-disc list-inside">
                  <li>Use headers (# Epic:, ## Task:, ### Subtask:) to organize tasks</li>
                  <li>Include "DoD:", "Test:", "Risk:", and "Estimate:" for detailed breakdown</li>
                  <li>Add tags like #frontend, #api, #database for skill matching</li>
                  <li>Use "Depends on:" or "Blocked by:" to specify dependencies</li>
                </ul>
              </div>
            </div>
          )}

          {step === 'preview' && breakdown && (
            <div className="space-y-6">
              {/* Summary */}
              <div className="bg-gradient-to-r from-blue-50 to-purple-50 dark:from-blue-900/20 dark:to-purple-900/20 rounded-lg p-4">
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-3">
                  Breakdown Summary
                </h3>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  <div className="bg-white dark:bg-gray-800 rounded-lg p-3 text-center">
                    <div className="text-2xl font-bold text-blue-600 dark:text-blue-400">
                      {breakdown.summary.totalEpics}
                    </div>
                    <div className="text-xs text-gray-600 dark:text-gray-400">Epics</div>
                  </div>
                  <div className="bg-white dark:bg-gray-800 rounded-lg p-3 text-center">
                    <div className="text-2xl font-bold text-green-600 dark:text-green-400">
                      {breakdown.summary.totalTasks}
                    </div>
                    <div className="text-xs text-gray-600 dark:text-gray-400">Tasks</div>
                  </div>
                  <div className="bg-white dark:bg-gray-800 rounded-lg p-3 text-center">
                    <div className="text-2xl font-bold text-purple-600 dark:text-purple-400">
                      {breakdown.summary.totalSubtasks}
                    </div>
                    <div className="text-xs text-gray-600 dark:text-gray-400">Subtasks</div>
                  </div>
                  <div className="bg-white dark:bg-gray-800 rounded-lg p-3 text-center">
                    <div className="text-2xl font-bold text-orange-600 dark:text-orange-400">
                      {breakdown.summary.estimatedHours}h
                    </div>
                    <div className="text-xs text-gray-600 dark:text-gray-400">Estimated</div>
                  </div>
                </div>
                {breakdown.summary.highRiskCount > 0 && (
                  <div className="mt-3 flex items-center gap-2 text-sm text-orange-700 dark:text-orange-400">
                    <AlertTriangle size={16} />
                    <span>{breakdown.summary.highRiskCount} high-risk tasks detected</span>
                  </div>
                )}
              </div>

              {/* Tasks */}
              <div className="space-y-4">
                {breakdown.epics.length > 0 && (
                  <div>
                    <h4 className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
                      Epics ({breakdown.epics.length})
                    </h4>
                    <div className="space-y-2">
                      {breakdown.epics.map(task => (
                        <TaskPreviewCard key={task.id} task={task} agents={agents} />
                      ))}
                    </div>
                  </div>
                )}

                {breakdown.tasks.length > 0 && (
                  <div>
                    <h4 className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
                      Tasks ({breakdown.tasks.length})
                    </h4>
                    <div className="space-y-2">
                      {breakdown.tasks.map(task => (
                        <TaskPreviewCard key={task.id} task={task} agents={agents} />
                      ))}
                    </div>
                  </div>
                )}

                {breakdown.subtasks.length > 0 && (
                  <div>
                    <h4 className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
                      Subtasks ({breakdown.subtasks.length})
                    </h4>
                    <div className="space-y-2">
                      {breakdown.subtasks.map(task => (
                        <TaskPreviewCard key={task.id} task={task} agents={agents} />
                      ))}
                    </div>
                  </div>
                )}
              </div>

              {/* Dependencies */}
              {breakdown.dependencies.length > 0 && (
                <div className="bg-gray-50 dark:bg-gray-800 rounded-lg p-4">
                  <h4 className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
                    Dependencies ({breakdown.dependencies.length})
                  </h4>
                  <div className="text-xs text-gray-600 dark:text-gray-400 space-y-1">
                    {breakdown.dependencies.map(dep => {
                      const task = [...breakdown.epics, ...breakdown.tasks, ...breakdown.subtasks].find(t => t.id === dep.taskId);
                      const depTask = [...breakdown.epics, ...breakdown.tasks, ...breakdown.subtasks].find(t => t.id === dep.dependsOnTaskId);
                      return (
                        <div key={dep.id} className="flex items-center gap-2">
                          <span className="font-mono">{task?.taskId}</span>
                          <span>→</span>
                          <span className="font-mono">{depTask?.taskId}</span>
                          <span className="text-gray-500">({dep.dependencyType})</span>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between p-6 border-t border-gray-200 dark:border-gray-700">
          <div className="flex items-center gap-4">
            {step === 'preview' && (
              <label className="flex items-center gap-2 text-sm text-gray-700 dark:text-gray-300 cursor-pointer">
                <input
                  type="checkbox"
                  checked={autoAssign}
                  onChange={(e) => setAutoAssign(e.target.checked)}
                  className="w-4 h-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                />
                <Users size={16} />
                Auto-assign agents based on skills
              </label>
            )}
          </div>

          <div className="flex items-center gap-3">
            {step === 'input' ? (
              <>
                <button
                  onClick={onClose}
                  className="px-4 py-2 text-gray-600 dark:text-gray-400 hover:text-gray-800 dark:hover:text-gray-200"
                >
                  Cancel
                </button>
                <button
                  onClick={handleAnalyze}
                  disabled={!input.trim() || isProcessing}
                  className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2 font-medium"
                >
                  <Wand2 size={16} />
                  {isProcessing ? 'Analyzing...' : 'Analyze & Break Down'}
                </button>
              </>
            ) : (
              <>
                <button
                  onClick={() => setStep('input')}
                  className="px-4 py-2 text-gray-600 dark:text-gray-400 hover:text-gray-800 dark:hover:text-gray-200"
                >
                  Back
                </button>
                <button
                  onClick={handleConfirm}
                  className="px-6 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 flex items-center gap-2 font-medium"
                >
                  <CheckCircle size={16} />
                  Create {breakdown?.summary.totalEpics + breakdown?.summary.totalTasks + breakdown?.summary.totalSubtasks || 0} Tasks
                </button>
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

const TaskPreviewCard = ({ task, agents }: { task: Task; agents: CodingAgent[] }) => {
  const [showDetails, setShowDetails] = useState(false);
  const bestAgents = findBestAgentsForTask(task, agents, 3);

  const getRiskBadge = (riskLevel: Task['riskLevel']) => {
    if (riskLevel === 'none') return null;

    const colors = {
      low: 'bg-yellow-100 dark:bg-yellow-900/30 text-yellow-700 dark:text-yellow-400',
      medium: 'bg-orange-100 dark:bg-orange-900/30 text-orange-700 dark:text-orange-400',
      high: 'bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-400',
      critical: 'bg-red-200 dark:bg-red-900/50 text-red-900 dark:text-red-300',
    };

    return (
      <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${colors[riskLevel]}`}>
        ⚠ {riskLevel}
      </span>
    );
  };

  return (
    <div className="bg-white dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-lg p-3">
      <div
        className="flex items-start justify-between cursor-pointer"
        onClick={() => setShowDetails(!showDetails)}
      >
        <div className="flex-1">
          <div className="flex items-center gap-2 mb-1">
            <span className="text-xs font-mono text-gray-500 dark:text-gray-400">
              {task.taskId}
            </span>
            <span className="text-xs px-1.5 py-0.5 rounded bg-gray-200 dark:bg-gray-600 text-gray-700 dark:text-gray-300">
              {task.taskType}
            </span>
            {getRiskBadge(task.riskLevel)}
          </div>
          <h5 className="text-sm font-semibold text-gray-900 dark:text-white">
            {task.title}
          </h5>
        </div>
        <div className="flex items-center gap-2 text-xs text-gray-500 dark:text-gray-400">
          {task.estimatedHours && <span>{task.estimatedHours}h</span>}
          <span className="text-gray-400">
            {showDetails ? '▲' : '▼'}
          </span>
        </div>
      </div>

      {showDetails && (
        <div className="mt-3 pt-3 border-t border-gray-200 dark:border-gray-600 space-y-2 text-sm">
          {task.description && (
            <p className="text-gray-600 dark:text-gray-400 text-xs">
              {task.description}
            </p>
          )}
          {task.tags.length > 0 && (
            <div className="flex flex-wrap gap-1">
              {task.tags.map(tag => (
                <span
                  key={tag}
                  className="text-xs px-2 py-0.5 rounded-full bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-400"
                >
                  #{tag}
                </span>
              ))}
            </div>
          )}
          {task.definitionOfDone && task.definitionOfDone.length > 0 && (
            <div>
              <span className="text-xs font-semibold text-gray-700 dark:text-gray-300">
                Definition of Done:
              </span>
              <ul className="text-xs text-gray-600 dark:text-gray-400 list-disc list-inside">
                {task.definitionOfDone.map((item, idx) => (
                  <li key={idx}>{item}</li>
                ))}
              </ul>
            </div>
          )}
          {bestAgents.length > 0 && (
            <div>
              <span className="text-xs font-semibold text-gray-700 dark:text-gray-300">
                Best Matches:
              </span>
              <div className="flex flex-wrap gap-2 mt-1">
                {bestAgents.map(match => (
                  <div
                    key={match.agentId}
                    className="text-xs px-2 py-1 rounded bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400"
                  >
                    {match.agent.name} ({Math.round(match.overallScore)}%)
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
};
