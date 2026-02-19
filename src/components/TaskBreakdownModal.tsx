'use client';

import { useState } from 'react';
import { X, Wand2, FileText, AlertCircle, CheckCircle2 } from 'lucide-react';
import { Task, TaskDependency, ParsedIssue } from '@/types/task';
import { parseIssueText, convertParsedIssueToTasks, PRD_TEMPLATE } from '@/lib/taskBreakdown';
import { AgentWithSkills } from '@/types/agent';
import { autoAssignTasks } from '@/lib/agentAssignment';

interface TaskBreakdownModalProps {
  onClose: () => void;
  onCreateTasks: (tasks: Task[], dependencies: TaskDependency[], assignments: Map<string, string>) => Promise<void>;
  agents: AgentWithSkills[];
  allTasks: Task[];
  nextTaskNumber: number;
}

export const TaskBreakdownModal = ({
  onClose,
  onCreateTasks,
  agents,
  allTasks,
  nextTaskNumber,
}: TaskBreakdownModalProps) => {
  const [issueText, setIssueText] = useState('');
  const [parsed, setParsed] = useState<ParsedIssue | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [autoAssign, setAutoAssign] = useState(true);

  const handleParse = () => {
    try {
      setError(null);
      const result = parseIssueText(issueText);
      setParsed(result);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to parse issue text');
    }
  };

  const handleCreate = async () => {
    if (!parsed) return;

    setIsProcessing(true);
    try {
      const { tasks, dependencies } = convertParsedIssueToTasks(parsed, nextTaskNumber, 'user-id');

      // Auto-assign if enabled
      let assignments = new Map<string, string>();
      if (autoAssign && agents.length > 0) {
        assignments = autoAssignTasks(tasks, agents, allTasks);
      }

      await onCreateTasks(tasks, dependencies, assignments);
      onClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to create tasks');
    } finally {
      setIsProcessing(false);
    }
  };

  const handleLoadTemplate = () => {
    setIssueText(PRD_TEMPLATE);
    setParsed(null);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
      <div className="bg-white dark:bg-gray-800 rounded-xl w-full max-w-6xl max-h-[90vh] overflow-hidden flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200 dark:border-gray-700">
          <div className="flex items-center gap-3">
            <Wand2 className="text-purple-500" size={24} />
            <div>
              <h2 className="text-xl font-bold text-gray-900 dark:text-white">Automated Task Breakdown</h2>
              <p className="text-sm text-gray-500 dark:text-gray-400">
                Parse issues, PRDs, or user stories into epics, tasks, and subtasks
              </p>
            </div>
          </div>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300">
            <X size={20} />
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto">
          <div className="grid grid-cols-2 gap-6 p-6">
            {/* Input Panel */}
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="font-semibold text-gray-900 dark:text-white flex items-center gap-2">
                  <FileText size={18} />
                  Input
                </h3>
                <button
                  onClick={handleLoadTemplate}
                  className="text-xs text-purple-600 dark:text-purple-400 hover:underline"
                >
                  Load Template
                </button>
              </div>

              <textarea
                value={issueText}
                onChange={e => setIssueText(e.target.value)}
                placeholder="Paste your issue, PRD, or user story here...&#10;&#10;Example:&#10;# New Feature&#10;## Epic: User Authentication&#10;### Task: Implement login form&#10;- Build React component&#10;- Add form validation&#10;..."
                className="w-full h-[500px] border border-gray-200 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white p-4 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 resize-none font-mono text-sm"
              />

              <div className="flex items-center gap-2">
                <input
                  type="checkbox"
                  id="auto-assign"
                  checked={autoAssign}
                  onChange={e => setAutoAssign(e.target.checked)}
                  className="rounded"
                />
                <label htmlFor="auto-assign" className="text-sm text-gray-700 dark:text-gray-300">
                  Auto-assign tasks to agents based on skills
                </label>
              </div>

              <button
                onClick={handleParse}
                disabled={!issueText.trim()}
                className="w-full px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center justify-center gap-2"
              >
                <Wand2 size={18} />
                Parse & Preview
              </button>
            </div>

            {/* Preview Panel */}
            <div className="border-l border-gray-200 dark:border-gray-700 pl-6 space-y-4">
              <h3 className="font-semibold text-gray-900 dark:text-white">Preview</h3>

              {error && (
                <div className="p-3 bg-red-50 dark:bg-red-900/30 border border-red-200 dark:border-red-800 rounded-lg flex items-start gap-2">
                  <AlertCircle className="text-red-500 flex-shrink-0 mt-0.5" size={18} />
                  <div className="text-sm text-red-600 dark:text-red-400">{error}</div>
                </div>
              )}

              {parsed ? (
                <div className="space-y-4 max-h-[500px] overflow-y-auto">
                  <div className="p-3 bg-green-50 dark:bg-green-900/30 border border-green-200 dark:border-green-800 rounded-lg flex items-start gap-2">
                    <CheckCircle2 className="text-green-500 flex-shrink-0 mt-0.5" size={18} />
                    <div className="text-sm text-green-600 dark:text-green-400">
                      Parsed successfully! {parsed.epics.length} epic(s),{' '}
                      {parsed.epics.reduce((sum, e) => sum + e.tasks.length, 0)} task(s),{' '}
                      {parsed.dependencies.length} dependency(ies)
                    </div>
                  </div>

                  {/* Epics */}
                  {parsed.epics.map((epic, epicIdx) => (
                    <div
                      key={epicIdx}
                      className="border border-gray-200 dark:border-gray-700 rounded-lg p-4 space-y-3"
                    >
                      <div>
                        <div className="inline-block px-2 py-0.5 bg-purple-100 dark:bg-purple-900/30 text-purple-700 dark:text-purple-400 rounded text-xs font-semibold mb-2">
                          EPIC
                        </div>
                        <h4 className="font-semibold text-gray-900 dark:text-white">{epic.title}</h4>
                        {epic.description && (
                          <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">{epic.description}</p>
                        )}
                      </div>

                      {/* Tasks under epic */}
                      {epic.tasks.map((task, taskIdx) => (
                        <div
                          key={taskIdx}
                          className="ml-4 border-l-2 border-blue-300 dark:border-blue-700 pl-3 space-y-2"
                        >
                          <div>
                            <div className="inline-block px-2 py-0.5 bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-400 rounded text-xs font-semibold mb-1">
                              TASK
                            </div>
                            <h5 className="font-medium text-gray-900 dark:text-white text-sm">{task.title}</h5>
                            {task.description && (
                              <p className="text-xs text-gray-600 dark:text-gray-400 mt-1">{task.description}</p>
                            )}
                          </div>

                          <div className="text-xs space-y-1">
                            {task.estimatedHours && (
                              <div className="text-gray-600 dark:text-gray-400">
                                ⏱️ Est: {task.estimatedHours}h
                              </div>
                            )}
                            {task.requiredSkills.length > 0 && (
                              <div className="flex flex-wrap gap-1">
                                {task.requiredSkills.map((skill, i) => (
                                  <span
                                    key={i}
                                    className="px-1.5 py-0.5 bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded text-xs"
                                  >
                                    {skill}
                                  </span>
                                ))}
                              </div>
                            )}
                            {task.riskFlags.length > 0 && (
                              <div className="text-red-600 dark:text-red-400">⚠️ {task.riskFlags.join(', ')}</div>
                            )}
                            {task.definitionOfDone.length > 0 && (
                              <div className="text-gray-600 dark:text-gray-400">
                                ✓ DoD: {task.definitionOfDone.length} criteria
                              </div>
                            )}
                          </div>

                          {/* Subtasks */}
                          {task.subtasks && task.subtasks.length > 0 && (
                            <div className="ml-4 space-y-1">
                              {task.subtasks.map((subtask, subIdx) => (
                                <div key={subIdx} className="text-xs text-gray-600 dark:text-gray-400">
                                  • {subtask.title} ({subtask.estimatedHours}h)
                                </div>
                              ))}
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  ))}

                  {/* Dependencies */}
                  {parsed.dependencies.length > 0 && (
                    <div className="border border-orange-200 dark:border-orange-800 rounded-lg p-4">
                      <h4 className="font-semibold text-gray-900 dark:text-white mb-2">Dependencies</h4>
                      <div className="space-y-1 text-sm">
                        {parsed.dependencies.map((dep, i) => (
                          <div key={i} className="text-gray-600 dark:text-gray-400">
                            {dep.from} → {dep.type} → {dep.to}
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              ) : (
                <div className="text-center py-12 text-gray-400 dark:text-gray-500">
                  <Wand2 size={48} className="mx-auto mb-4 opacity-50" />
                  <p className="text-sm">Enter issue text and click &quot;Parse & Preview&quot;</p>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="border-t border-gray-200 dark:border-gray-700 p-6 flex justify-between items-center">
          <div className="text-sm text-gray-500 dark:text-gray-400">
            {parsed && (
              <>
                Will create{' '}
                {parsed.epics.length +
                  parsed.epics.reduce((sum, e) => sum + e.tasks.length, 0) +
                  parsed.epics.reduce(
                    (sum, e) => sum + e.tasks.reduce((s, t) => s + (t.subtasks?.length || 0), 0),
                    0
                  )}{' '}
                tasks total
              </>
            )}
          </div>
          <div className="flex gap-3">
            <button
              onClick={onClose}
              className="px-4 py-2 text-gray-600 dark:text-gray-400 hover:text-gray-800 dark:hover:text-gray-200 transition-colors"
            >
              Cancel
            </button>
            <button
              onClick={handleCreate}
              disabled={!parsed || isProcessing}
              className="px-6 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center gap-2"
            >
              {isProcessing ? 'Creating...' : 'Create Tasks'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
