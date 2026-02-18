'use client';

import { useState } from 'react';
import { FileText, Zap, Upload, X, CheckCircle, AlertTriangle } from 'lucide-react';
import { TaskBreakdownService } from '@/lib/taskBreakdown';
import { TaskBreakdownRequest, TaskBreakdownResult, HierarchicalTask } from '@/types/taskHierarchy';
import { DependencyGraph } from './DependencyGraph';

interface TaskBreakdownWizardProps {
  onComplete: (result: TaskBreakdownResult) => void;
  onCancel: () => void;
}

export const TaskBreakdownWizard = ({ onComplete, onCancel }: TaskBreakdownWizardProps) => {
  const [step, setStep] = useState<'input' | 'preview' | 'review'>('input');
  const [sourceType, setSourceType] = useState<'issue' | 'prd' | 'text'>('text');
  const [inputContent, setInputContent] = useState('');
  const [breakdown, setBreakdown] = useState<TaskBreakdownResult | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [selectedTasks, setSelectedTasks] = useState<Set<string>>(new Set());

  const handleBreakdown = async () => {
    if (!inputContent.trim()) return;

    setIsProcessing(true);
    try {
      const request: TaskBreakdownRequest = {
        source: sourceType,
        content: inputContent,
        context: {
          projectType: 'web-app',
          techStack: ['React', 'Next.js', 'Supabase']
        }
      };

      const result = await TaskBreakdownService.breakdownTask(request);
      setBreakdown(result);

      // Select all tasks by default
      const allTaskIds = new Set([
        ...result.epics.map(t => t.id),
        ...result.tickets.map(t => t.id),
        ...result.subtasks.map(t => t.id)
      ]);
      setSelectedTasks(allTaskIds);

      setStep('preview');
    } catch (error) {
      console.error('Error breaking down task:', error);
      alert('Failed to break down task. Please try again.');
    } finally {
      setIsProcessing(false);
    }
  };

  const handleComplete = () => {
    if (!breakdown) return;

    // Filter to only selected tasks
    const filtered: TaskBreakdownResult = {
      epics: breakdown.epics.filter(t => selectedTasks.has(t.id)),
      tickets: breakdown.tickets.filter(t => selectedTasks.has(t.id)),
      subtasks: breakdown.subtasks.filter(t => selectedTasks.has(t.id)),
      dependencies: breakdown.dependencies.filter(d =>
        selectedTasks.has(d.id) && selectedTasks.has(d.dependsOn)
      ),
      suggestedAssignments: breakdown.suggestedAssignments.filter(a =>
        selectedTasks.has(a.taskId)
      )
    };

    onComplete(filtered);
  };

  const toggleTaskSelection = (taskId: string) => {
    const newSelection = new Set(selectedTasks);
    if (newSelection.has(taskId)) {
      newSelection.delete(taskId);
    } else {
      newSelection.add(taskId);
    }
    setSelectedTasks(newSelection);
  };

  const renderTaskCard = (task: HierarchicalTask) => {
    const isSelected = selectedTasks.has(task.id);

    return (
      <div
        key={task.id}
        onClick={() => toggleTaskSelection(task.id)}
        className={`p-4 rounded-lg border-2 cursor-pointer transition-all ${
          isSelected
            ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20'
            : 'border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800'
        }`}
      >
        <div className="flex items-start justify-between mb-2">
          <div className="flex items-center gap-2">
            <input
              type="checkbox"
              checked={isSelected}
              onChange={() => toggleTaskSelection(task.id)}
              className="rounded"
              onClick={(e) => e.stopPropagation()}
            />
            <span className="text-xs font-mono text-gray-600 dark:text-gray-400">
              {task.taskId}
            </span>
            <span className={`text-xs px-2 py-0.5 rounded ${
              task.type === 'epic'
                ? 'bg-purple-100 dark:bg-purple-900/30 text-purple-700 dark:text-purple-300'
                : task.type === 'ticket'
                ? 'bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300'
                : 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300'
            }`}>
              {task.type}
            </span>
          </div>
          <span className={`text-xs font-semibold ${
            task.priority >= 4 ? 'text-red-600 dark:text-red-400' : 'text-gray-600 dark:text-gray-400'
          }`}>
            P{task.priority}
          </span>
        </div>

        <h4 className="font-medium text-gray-900 dark:text-white mb-2">
          {task.title}
        </h4>

        {task.description && (
          <p className="text-sm text-gray-600 dark:text-gray-400 mb-3 line-clamp-2">
            {task.description}
          </p>
        )}

        {/* Definition of Done */}
        {task.definitionOfDone.length > 0 && (
          <div className="mb-3">
            <p className="text-xs font-semibold text-gray-700 dark:text-gray-300 mb-1">
              Definition of Done:
            </p>
            <ul className="text-xs text-gray-600 dark:text-gray-400 space-y-1">
              {task.definitionOfDone.slice(0, 3).map(dod => (
                <li key={dod.id} className="flex items-start gap-1">
                  <CheckCircle size={12} className="mt-0.5 text-gray-400" />
                  <span>{dod.description}</span>
                </li>
              ))}
              {task.definitionOfDone.length > 3 && (
                <li className="text-gray-400">+{task.definitionOfDone.length - 3} more...</li>
              )}
            </ul>
          </div>
        )}

        {/* Risk Flags */}
        {task.riskFlags.length > 0 && (
          <div className="mb-3">
            <div className="flex items-center gap-1 text-xs font-semibold text-red-600 dark:text-red-400 mb-1">
              <AlertTriangle size={12} />
              <span>Risks:</span>
            </div>
            <ul className="text-xs text-gray-600 dark:text-gray-400 space-y-1">
              {task.riskFlags.map(risk => (
                <li key={risk.id}>
                  <span className="font-semibold">{risk.level}:</span> {risk.description}
                </li>
              ))}
            </ul>
          </div>
        )}

        {/* Tags */}
        {task.tags.length > 0 && (
          <div className="flex flex-wrap gap-1">
            {task.tags.map(tag => (
              <span
                key={tag}
                className="text-xs px-2 py-0.5 bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-400 rounded"
              >
                {tag}
              </span>
            ))}
          </div>
        )}

        {task.estimatedHours && (
          <div className="mt-2 text-xs text-gray-500 dark:text-gray-400">
            Est: {task.estimatedHours}h
          </div>
        )}
      </div>
    );
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
      <div className="bg-white dark:bg-gray-800 rounded-xl w-full max-w-6xl max-h-[90vh] overflow-hidden shadow-2xl flex flex-col">
        {/* Header */}
        <div className="p-6 border-b border-gray-200 dark:border-gray-700 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Zap size={24} className="text-blue-600 dark:text-blue-400" />
            <div>
              <h2 className="text-xl font-bold text-gray-900 dark:text-white">
                Automated Task Breakdown
              </h2>
              <p className="text-sm text-gray-600 dark:text-gray-400">
                Break down issues, PRDs, or requirements into structured tasks
              </p>
            </div>
          </div>
          <button
            onClick={onCancel}
            className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
          >
            <X size={24} />
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6">
          {step === 'input' && (
            <div className="space-y-6">
              {/* Source Type Selection */}
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Source Type
                </label>
                <div className="flex gap-2">
                  {(['text', 'issue', 'prd'] as const).map(type => (
                    <button
                      key={type}
                      onClick={() => setSourceType(type)}
                      className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                        sourceType === type
                          ? 'bg-blue-600 text-white'
                          : 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600'
                      }`}
                    >
                      {type === 'text' && <FileText size={16} className="inline mr-1" />}
                      {type === 'issue' && <FileText size={16} className="inline mr-1" />}
                      {type === 'prd' && <FileText size={16} className="inline mr-1" />}
                      {type.toUpperCase()}
                    </button>
                  ))}
                </div>
              </div>

              {/* Input Area */}
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Paste your content below
                </label>
                <textarea
                  value={inputContent}
                  onChange={(e) => setInputContent(e.target.value)}
                  placeholder={`Example:

# Feature: User Authentication

## Requirements
- Implement login page
- Add signup functionality
- Create password reset flow

## Technical Notes
- Use Supabase Auth
- Add email verification
- Implement session management

## Risks
- Security considerations for password storage
- Email delivery reliability`}
                  className="w-full h-96 p-4 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white font-mono text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
                />
              </div>
            </div>
          )}

          {step === 'preview' && breakdown && (
            <div className="space-y-6">
              {/* Summary */}
              <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-4">
                <h3 className="font-semibold text-blue-900 dark:text-blue-100 mb-2">
                  Breakdown Summary
                </h3>
                <div className="grid grid-cols-3 gap-4 text-sm">
                  <div>
                    <span className="text-blue-700 dark:text-blue-300 font-semibold">
                      {breakdown.epics.length}
                    </span>
                    <span className="text-blue-600 dark:text-blue-400 ml-1">Epic(s)</span>
                  </div>
                  <div>
                    <span className="text-blue-700 dark:text-blue-300 font-semibold">
                      {breakdown.tickets.length}
                    </span>
                    <span className="text-blue-600 dark:text-blue-400 ml-1">Ticket(s)</span>
                  </div>
                  <div>
                    <span className="text-blue-700 dark:text-blue-300 font-semibold">
                      {breakdown.subtasks.length}
                    </span>
                    <span className="text-blue-600 dark:text-blue-400 ml-1">Subtask(s)</span>
                  </div>
                </div>
              </div>

              {/* Task List */}
              <div className="space-y-4">
                {breakdown.epics.length > 0 && (
                  <div>
                    <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-3">
                      Epics
                    </h3>
                    <div className="space-y-3">
                      {breakdown.epics.map(renderTaskCard)}
                    </div>
                  </div>
                )}

                {breakdown.tickets.length > 0 && (
                  <div>
                    <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-3">
                      Tickets
                    </h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                      {breakdown.tickets.map(renderTaskCard)}
                    </div>
                  </div>
                )}

                {breakdown.subtasks.length > 0 && (
                  <div>
                    <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-3">
                      Subtasks
                    </h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                      {breakdown.subtasks.map(renderTaskCard)}
                    </div>
                  </div>
                )}
              </div>

              {/* Dependency Visualization */}
              {breakdown.dependencies.length > 0 && (
                <div className="mt-6">
                  <DependencyGraph
                    tasks={[...breakdown.epics, ...breakdown.tickets, ...breakdown.subtasks]}
                    dependencies={breakdown.dependencies}
                  />
                </div>
              )}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-6 border-t border-gray-200 dark:border-gray-700 flex justify-between items-center">
          <div className="text-sm text-gray-600 dark:text-gray-400">
            {step === 'preview' && breakdown && (
              <span>
                {selectedTasks.size} of{' '}
                {breakdown.epics.length + breakdown.tickets.length + breakdown.subtasks.length}{' '}
                tasks selected
              </span>
            )}
          </div>
          <div className="flex gap-3">
            <button
              onClick={onCancel}
              className="px-4 py-2 text-gray-600 dark:text-gray-400 hover:text-gray-800 dark:hover:text-gray-200 transition-colors"
            >
              Cancel
            </button>
            {step === 'input' && (
              <button
                onClick={handleBreakdown}
                disabled={!inputContent.trim() || isProcessing}
                className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
              >
                {isProcessing ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent" />
                    Processing...
                  </>
                ) : (
                  <>
                    <Zap size={16} />
                    Break Down Tasks
                  </>
                )}
              </button>
            )}
            {step === 'preview' && (
              <>
                <button
                  onClick={() => setStep('input')}
                  className="px-4 py-2 bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-300 dark:hover:bg-gray-600 transition-colors"
                >
                  Back
                </button>
                <button
                  onClick={handleComplete}
                  disabled={selectedTasks.size === 0}
                  className="px-6 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors font-medium disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Create {selectedTasks.size} Task(s)
                </button>
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
