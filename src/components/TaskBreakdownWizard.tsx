'use client';

import { useState } from 'react';
import { Task, TaskDependency } from '@/types/task';
import { Epic } from '@/types/epic';
import { parseInput, breakdownTask, suggestTags } from '@/lib/taskBreakdown';
import { Wand2, FileText, ClipboardList, AlertTriangle, CheckSquare, Clock, X } from 'lucide-react';

interface TaskBreakdownWizardProps {
  onBreakdownComplete: (result: {
    epic: Epic;
    tasks: Task[];
    dependencies: TaskDependency[];
  }) => void;
  onCancel: () => void;
  epicCounter: number;
  taskCounter: number;
}

export const TaskBreakdownWizard = ({
  onBreakdownComplete,
  onCancel,
  epicCounter,
  taskCounter,
}: TaskBreakdownWizardProps) => {
  const [step, setStep] = useState<'input' | 'review' | 'customize'>(input');
  const [inputText, setInputText] = useState('');
  const [inputType, setInputType] = useState<'issue' | 'prd' | 'screenshot'>('issue');
  const [breakdown, setBreakdown] = useState<{
    epic: Epic;
    tasks: Task[];
    dependencies: Array<{ taskId: string; dependsOn: string; type: 'blocks' | 'relates_to' }>;
  } | null>(null);

  const handleGenerate = () => {
    if (!inputText.trim()) return;

    const parsed = parseInput(inputText, inputType);
    const result = breakdownTask(parsed, epicCounter, taskCounter);

    setBreakdown(result);
    setStep('review');
  };

  const handleConfirm = () => {
    if (!breakdown) return;

    // Convert dependencies to TaskDependency format
    const taskMap = new Map(breakdown.tasks.map(t => [t.taskId, t.id]));
    const dependencies: TaskDependency[] = breakdown.dependencies
      .map(dep => ({
        id: `dep-${dep.taskId}-${dep.dependsOn}`,
        taskId: taskMap.get(dep.taskId) || '',
        dependsOnTaskId: taskMap.get(dep.dependsOn) || '',
        dependencyType: dep.type,
        createdAt: Date.now(),
      }))
      .filter(d => d.taskId && d.dependsOnTaskId);

    onBreakdownComplete({
      epic: breakdown.epic,
      tasks: breakdown.tasks,
      dependencies,
    });
  };

  const updateTask = (taskId: string, updates: Partial<Task>) => {
    if (!breakdown) return;

    setBreakdown({
      ...breakdown,
      tasks: breakdown.tasks.map(t =>
        t.taskId === taskId ? { ...t, ...updates } : t
      ),
    });
  };

  const removeTask = (taskId: string) => {
    if (!breakdown) return;

    setBreakdown({
      ...breakdown,
      tasks: breakdown.tasks.filter(t => t.taskId !== taskId),
      dependencies: breakdown.dependencies.filter(
        d => d.taskId !== taskId && d.dependsOn !== taskId
      ),
    });
  };

  if (step === 'input') {
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
        <div className="bg-white dark:bg-gray-800 rounded-xl w-full max-w-3xl shadow-xl max-h-[90vh] overflow-hidden flex flex-col">
          <div className="flex items-center justify-between p-6 border-b border-gray-200 dark:border-gray-700">
            <div className="flex items-center gap-3">
              <Wand2 size={24} className="text-blue-500" />
              <h2 className="text-xl font-bold text-gray-900 dark:text-white">
                AI Task Breakdown
              </h2>
            </div>
            <button
              onClick={onCancel}
              className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
            >
              <X size={20} />
            </button>
          </div>

          <div className="flex-1 overflow-y-auto p-6 space-y-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Input Type
              </label>
              <div className="flex gap-2">
                {(['issue', 'prd', 'screenshot'] as const).map(type => (
                  <button
                    key={type}
                    onClick={() => setInputType(type)}
                    className={`px-4 py-2 rounded-lg font-medium text-sm transition-colors ${
                      inputType === type
                        ? 'bg-blue-500 text-white'
                        : 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600'
                    }`}
                  >
                    {type === 'issue' ? 'GitHub Issue' : type === 'prd' ? 'PRD Document' : 'Screenshot Description'}
                  </button>
                ))}
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Paste your content here
              </label>
              <textarea
                className="w-full h-64 border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white p-4 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none font-mono text-sm"
                placeholder={
                  inputType === 'issue'
                    ? '# Issue Title\n\nDescribe the feature or bug...\n\nAcceptance criteria:\n- [ ] Criteria 1\n- [ ] Criteria 2'
                    : inputType === 'prd'
                    ? '# Product Requirements\n\nObjective: ...\n\nUser Stories:\n1. As a user, I want...\n\nTechnical Requirements:\n- React components\n- API endpoints\n- Database schema'
                    : 'Describe what you see in the screenshot and what needs to be built...'
                }
                value={inputText}
                onChange={e => setInputText(e.target.value)}
              />
            </div>

            <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-4">
              <div className="flex items-start gap-3">
                <Wand2 size={18} className="text-blue-600 dark:text-blue-400 mt-0.5" />
                <div className="text-sm text-blue-800 dark:text-blue-300">
                  <p className="font-medium mb-1">AI will analyze and generate:</p>
                  <ul className="list-disc list-inside space-y-0.5 text-xs">
                    <li>Epic and breakdown into individual tasks</li>
                    <li>Definition of Done for each task</li>
                    <li>Test notes and testing strategy</li>
                    <li>Risk assessment and flags</li>
                    <li>Task dependencies and ordering</li>
                    <li>Estimated time and priority</li>
                  </ul>
                </div>
              </div>
            </div>
          </div>

          <div className="p-6 border-t border-gray-200 dark:border-gray-700 flex justify-end gap-3">
            <button
              onClick={onCancel}
              className="px-4 py-2 text-gray-600 dark:text-gray-400 hover:text-gray-800 dark:hover:text-gray-200 transition-colors"
            >
              Cancel
            </button>
            <button
              onClick={handleGenerate}
              disabled={!inputText.trim()}
              className="px-6 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors font-medium disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
            >
              <Wand2 size={18} />
              Generate Breakdown
            </button>
          </div>
        </div>
      </div>
    );
  }

  if (step === 'review' && breakdown) {
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
        <div className="bg-white dark:bg-gray-800 rounded-xl w-full max-w-5xl shadow-xl max-h-[90vh] overflow-hidden flex flex-col">
          <div className="flex items-center justify-between p-6 border-b border-gray-200 dark:border-gray-700">
            <div>
              <h2 className="text-xl font-bold text-gray-900 dark:text-white">
                Review Task Breakdown
              </h2>
              <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                {breakdown.epic.epicId}: {breakdown.epic.title}
              </p>
            </div>
            <button
              onClick={onCancel}
              className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
            >
              <X size={20} />
            </button>
          </div>

          <div className="flex-1 overflow-y-auto p-6 space-y-4">
            {breakdown.tasks.map((task, idx) => (
              <div
                key={task.taskId}
                className="border border-gray-200 dark:border-gray-700 rounded-lg p-4 bg-gray-50 dark:bg-gray-900"
              >
                <div className="flex items-start justify-between mb-3">
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-2">
                      <span className="font-mono text-sm font-bold text-blue-600 dark:text-blue-400">
                        {task.taskId}
                      </span>
                      <input
                        type="text"
                        value={task.title}
                        onChange={e => updateTask(task.taskId, { title: e.target.value })}
                        className="flex-1 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded px-2 py-1 text-sm font-medium text-gray-900 dark:text-white"
                      />
                      <button
                        onClick={() => removeTask(task.taskId)}
                        className="text-red-500 hover:text-red-700 dark:hover:text-red-400"
                        title="Remove task"
                      >
                        <X size={18} />
                      </button>
                    </div>
                    <textarea
                      value={task.description}
                      onChange={e => updateTask(task.taskId, { description: e.target.value })}
                      className="w-full bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded px-2 py-1.5 text-sm text-gray-700 dark:text-gray-300 resize-none"
                      rows={2}
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4 mb-3">
                  <div>
                    <label className="flex items-center gap-2 text-xs font-medium text-gray-600 dark:text-gray-400 mb-1">
                      <Clock size={14} />
                      Estimated Hours
                    </label>
                    <input
                      type="number"
                      value={task.estimatedHours || ''}
                      onChange={e => updateTask(task.taskId, { estimatedHours: parseInt(e.target.value) || undefined })}
                      className="w-full bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded px-2 py-1 text-sm"
                      min="1"
                    />
                  </div>
                  <div>
                    <label className="flex items-center gap-2 text-xs font-medium text-gray-600 dark:text-gray-400 mb-1">
                      <AlertTriangle size={14} />
                      Risk Level
                    </label>
                    <select
                      value={task.riskLevel || 'low'}
                      onChange={e => updateTask(task.taskId, { riskLevel: e.target.value as any })}
                      className="w-full bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded px-2 py-1 text-sm"
                    >
                      <option value="low">Low</option>
                      <option value="medium">Medium</option>
                      <option value="high">High</option>
                      <option value="critical">Critical</option>
                    </select>
                  </div>
                </div>

                {task.definitionOfDone && task.definitionOfDone.length > 0 && (
                  <div className="mb-3">
                    <label className="flex items-center gap-2 text-xs font-medium text-gray-600 dark:text-gray-400 mb-2">
                      <CheckSquare size={14} />
                      Definition of Done
                    </label>
                    <ul className="space-y-1 text-xs text-gray-700 dark:text-gray-300">
                      {task.definitionOfDone.map((item, i) => (
                        <li key={i} className="flex items-start gap-2">
                          <span className="text-gray-400 mt-0.5">•</span>
                          <span>{item}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                )}

                {task.riskFlags && task.riskFlags.length > 0 && (
                  <div className="flex items-center gap-2 flex-wrap">
                    <AlertTriangle size={14} className="text-amber-500" />
                    {task.riskFlags.map((flag, i) => (
                      <span
                        key={i}
                        className="px-2 py-0.5 bg-amber-100 dark:bg-amber-900/30 text-amber-700 dark:text-amber-400 rounded text-xs font-medium"
                      >
                        {flag}
                      </span>
                    ))}
                  </div>
                )}

                <div className="mt-3 flex items-center gap-2 flex-wrap">
                  {task.tags.map((tag, i) => (
                    <span
                      key={i}
                      className="px-2 py-0.5 bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-400 rounded text-xs"
                    >
                      {tag}
                    </span>
                  ))}
                </div>
              </div>
            ))}

            {breakdown.dependencies.length > 0 && (
              <div className="border border-gray-200 dark:border-gray-700 rounded-lg p-4 bg-blue-50 dark:bg-blue-900/10">
                <h3 className="text-sm font-bold text-gray-900 dark:text-white mb-3 flex items-center gap-2">
                  <FileText size={16} />
                  Dependencies ({breakdown.dependencies.length})
                </h3>
                <ul className="space-y-2 text-sm text-gray-700 dark:text-gray-300">
                  {breakdown.dependencies.map((dep, i) => (
                    <li key={i} className="flex items-center gap-2">
                      <span className="font-mono text-xs font-bold">{dep.taskId}</span>
                      <span className="text-gray-400">→ depends on →</span>
                      <span className="font-mono text-xs font-bold">{dep.dependsOn}</span>
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </div>

          <div className="p-6 border-t border-gray-200 dark:border-gray-700 flex justify-between">
            <button
              onClick={() => setStep('input')}
              className="px-4 py-2 text-gray-600 dark:text-gray-400 hover:text-gray-800 dark:hover:text-gray-200 transition-colors"
            >
              ← Back to Edit
            </button>
            <div className="flex gap-3">
              <button
                onClick={onCancel}
                className="px-4 py-2 text-gray-600 dark:text-gray-400 hover:text-gray-800 dark:hover:text-gray-200 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleConfirm}
                className="px-6 py-2 bg-green-500 text-white rounded-lg hover:bg-green-600 transition-colors font-medium flex items-center gap-2"
              >
                <CheckSquare size={18} />
                Create {breakdown.tasks.length} Tasks
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return null;
};
