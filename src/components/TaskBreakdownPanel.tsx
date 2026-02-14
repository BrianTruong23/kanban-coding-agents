'use client';

import { useState } from 'react';
import { Task } from '@/types/task';
import { TaskBreakdownInput, BreakdownResult } from '@/types/breakdown';
import { CodingAgent } from '@/types/agent';
import { analyzeAndBreakdown } from '@/lib/taskBreakdown';
import { autoAssignTask } from '@/lib/autoAssignment';
import { generateId, generateTaskId } from '@/lib/utils';
import { Sparkles, FileText, Image, Code, X, AlertTriangle, CheckCircle2, Clock } from 'lucide-react';

interface TaskBreakdownPanelProps {
  agents: CodingAgent[];
  existingTasks: Task[];
  onCreateTasks: (tasks: Task[]) => Promise<void>;
  onClose: () => void;
}

export const TaskBreakdownPanel = ({
  agents,
  existingTasks,
  onCreateTasks,
  onClose,
}: TaskBreakdownPanelProps) => {
  const [inputType, setInputType] = useState<'issue' | 'prd' | 'screenshot'>('issue');
  const [content, setContent] = useState('');
  const [title, setTitle] = useState('');
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [breakdown, setBreakdown] = useState<BreakdownResult | null>(null);
  const [error, setError] = useState<string | null>(null);

  const handleAnalyze = async () => {
    if (!content.trim()) {
      setError('Please enter content to analyze');
      return;
    }

    setIsAnalyzing(true);
    setError(null);

    try {
      const input: TaskBreakdownInput = {
        type: inputType,
        content: content.trim(),
        title: title.trim() || undefined,
      };

      const result = await analyzeAndBreakdown(input);
      setBreakdown(result);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to analyze content');
      console.error(err);
    } finally {
      setIsAnalyzing(false);
    }
  };

  const handleCreateTasks = async () => {
    if (!breakdown) return;

    try {
      const tasksToCreate: Task[] = [];
      let taskNumber = getNextTaskNumber(existingTasks);

      // Create tasks from breakdown
      breakdown.tasks.forEach((taskData, index) => {
        const task: Task = {
          id: generateId(),
          taskId: generateTaskId(taskNumber++),
          title: taskData.title,
          description: taskData.description,
          status: 'backlog',
          type: 'task',
          epicId: breakdown.epic ? 'EPIC-TBD' : undefined,
          priority: taskData.priority,
          tags: taskData.tags,
          estimatedHours: taskData.estimatedHours,
          createdAt: Date.now(),
          updatedAt: Date.now(),
        };

        // Auto-assign agent
        const assignment = autoAssignTask(task, agents);
        if (assignment.success && assignment.assignedAgent) {
          task.assignedAgentId = assignment.assignedAgent.id;
        }

        tasksToCreate.push(task);
      });

      await onCreateTasks(tasksToCreate);
      onClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to create tasks');
      console.error(err);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
      <div className="bg-white dark:bg-gray-800 rounded-xl w-full max-w-4xl max-h-[90vh] overflow-hidden flex flex-col shadow-2xl">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200 dark:border-gray-700">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-gradient-to-br from-purple-500 to-blue-500 rounded-lg flex items-center justify-center">
              <Sparkles size={20} className="text-white" />
            </div>
            <div>
              <h2 className="text-xl font-bold text-gray-900 dark:text-white">
                AI Task Breakdown
              </h2>
              <p className="text-xs text-gray-500 dark:text-gray-400">
                Automatically break down issues, PRDs, or screenshots into actionable tasks
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
        <div className="flex-1 overflow-y-auto p-6 space-y-6">
          {!breakdown ? (
            <>
              {/* Input Type Selection */}
              <div>
                <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
                  Input Type
                </label>
                <div className="flex gap-2">
                  <button
                    onClick={() => setInputType('issue')}
                    className={`flex-1 p-3 border-2 rounded-lg flex items-center gap-2 transition-colors ${
                      inputType === 'issue'
                        ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300'
                        : 'border-gray-200 dark:border-gray-700 hover:border-gray-300 dark:hover:border-gray-600'
                    }`}
                  >
                    <FileText size={20} />
                    <span className="font-medium text-sm">GitHub Issue</span>
                  </button>
                  <button
                    onClick={() => setInputType('prd')}
                    className={`flex-1 p-3 border-2 rounded-lg flex items-center gap-2 transition-colors ${
                      inputType === 'prd'
                        ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300'
                        : 'border-gray-200 dark:border-gray-700 hover:border-gray-300 dark:hover:border-gray-600'
                    }`}
                  >
                    <Code size={20} />
                    <span className="font-medium text-sm">PRD/Spec</span>
                  </button>
                  <button
                    onClick={() => setInputType('screenshot')}
                    className={`flex-1 p-3 border-2 rounded-lg flex items-center gap-2 transition-colors ${
                      inputType === 'screenshot'
                        ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300'
                        : 'border-gray-200 dark:border-gray-700 hover:border-gray-300 dark:hover:border-gray-600'
                    }`}
                  >
                    <Image size={20} />
                    <span className="font-medium text-sm">Screenshot</span>
                  </button>
                </div>
              </div>

              {/* Title */}
              <div>
                <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
                  Title (optional)
                </label>
                <input
                  type="text"
                  value={title}
                  onChange={e => setTitle(e.target.value)}
                  placeholder="e.g., User Authentication System"
                  className="w-full border border-gray-200 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white p-3 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              {/* Content Input */}
              <div>
                <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
                  {inputType === 'issue' && 'Issue Description'}
                  {inputType === 'prd' && 'PRD Content'}
                  {inputType === 'screenshot' && 'Screenshot Description'}
                </label>
                <textarea
                  value={content}
                  onChange={e => setContent(e.target.value)}
                  placeholder={
                    inputType === 'issue'
                      ? 'Paste GitHub issue content here...\n\nExample:\n- Implement user login\n- Add password reset flow\n- Integrate OAuth providers'
                      : inputType === 'prd'
                      ? 'Paste PRD or specification here...'
                      : 'Describe what you see in the screenshot...'
                  }
                  className="w-full border border-gray-200 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white p-3 rounded-lg h-64 focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none font-mono text-sm"
                />
              </div>

              {error && (
                <div className="p-3 bg-red-50 dark:bg-red-900/30 border border-red-200 dark:border-red-800 rounded-lg text-sm text-red-600 dark:text-red-400">
                  {error}
                </div>
              )}

              {/* Actions */}
              <div className="flex justify-end gap-3">
                <button
                  onClick={onClose}
                  className="px-4 py-2 text-gray-600 dark:text-gray-400 hover:text-gray-800 dark:hover:text-gray-200"
                >
                  Cancel
                </button>
                <button
                  onClick={handleAnalyze}
                  disabled={isAnalyzing || !content.trim()}
                  className="px-6 py-2 bg-gradient-to-r from-purple-500 to-blue-500 text-white rounded-lg hover:from-purple-600 hover:to-blue-600 disabled:opacity-50 disabled:cursor-not-allowed font-medium flex items-center gap-2"
                >
                  {isAnalyzing ? (
                    <>
                      <div className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent" />
                      Analyzing...
                    </>
                  ) : (
                    <>
                      <Sparkles size={16} />
                      Analyze & Breakdown
                    </>
                  )}
                </button>
              </div>
            </>
          ) : (
            <>
              {/* Breakdown Results */}
              <div className="space-y-4">
                {/* Epic Summary */}
                {breakdown.epic && (
                  <div className="bg-gradient-to-br from-purple-50 to-blue-50 dark:from-purple-900/20 dark:to-blue-900/20 border border-purple-200 dark:border-purple-800 rounded-lg p-4">
                    <div className="flex items-center gap-2 mb-2">
                      <div className="w-8 h-8 bg-purple-500 rounded-lg flex items-center justify-center">
                        <Sparkles size={16} className="text-white" />
                      </div>
                      <h3 className="font-bold text-purple-900 dark:text-purple-200">
                        Epic: {breakdown.epic.title}
                      </h3>
                    </div>
                    <p className="text-sm text-purple-700 dark:text-purple-300 mb-2">
                      {breakdown.epic.description}
                    </p>
                    <div className="flex items-center gap-4 text-xs text-purple-600 dark:text-purple-400">
                      <span>Priority: {breakdown.epic.priority}</span>
                      <span>Estimated: {breakdown.epic.estimatedEffort} story points</span>
                    </div>
                  </div>
                )}

                {/* Tasks */}
                <div>
                  <h3 className="font-bold text-gray-900 dark:text-white mb-3">
                    {breakdown.tasks.length} Task{breakdown.tasks.length !== 1 ? 's' : ''} Generated
                  </h3>
                  <div className="space-y-3">
                    {breakdown.tasks.map((task, index) => (
                      <div
                        key={index}
                        className="border border-gray-200 dark:border-gray-700 rounded-lg p-4 bg-white dark:bg-gray-750"
                      >
                        <div className="flex items-start justify-between mb-2">
                          <h4 className="font-semibold text-gray-900 dark:text-white">
                            {task.title}
                          </h4>
                          <span className="text-xs font-semibold px-2 py-1 bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded">
                            P{task.priority}
                          </span>
                        </div>
                        <p className="text-sm text-gray-600 dark:text-gray-400 mb-3">
                          {task.description}
                        </p>

                        <div className="flex items-center gap-2 mb-3 flex-wrap">
                          {task.tags.map(tag => (
                            <span
                              key={tag}
                              className="text-xs px-2 py-1 bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 rounded"
                            >
                              {tag}
                            </span>
                          ))}
                          <span className="text-xs text-gray-500 dark:text-gray-400 flex items-center gap-1">
                            <Clock size={12} />
                            {task.estimatedHours}h
                          </span>
                        </div>

                        {/* DoD */}
                        {task.definitionOfDone.length > 0 && (
                          <div className="mb-2">
                            <div className="text-xs font-semibold text-gray-700 dark:text-gray-300 mb-1 flex items-center gap-1">
                              <CheckCircle2 size={12} />
                              Definition of Done
                            </div>
                            <ul className="text-xs text-gray-600 dark:text-gray-400 space-y-1 ml-4">
                              {task.definitionOfDone.map((item, i) => (
                                <li key={i} className="list-disc">
                                  {item}
                                </li>
                              ))}
                            </ul>
                          </div>
                        )}

                        {/* Risk Flags */}
                        {task.riskFlags.length > 0 && (
                          <div className="mb-2">
                            <div className="text-xs font-semibold text-orange-700 dark:text-orange-300 mb-1 flex items-center gap-1">
                              <AlertTriangle size={12} />
                              Risk Flags
                            </div>
                            <div className="space-y-1">
                              {task.riskFlags.map((risk, i) => (
                                <div
                                  key={i}
                                  className="text-xs bg-orange-50 dark:bg-orange-900/20 border border-orange-200 dark:border-orange-800 rounded p-2"
                                >
                                  <div className="font-medium text-orange-900 dark:text-orange-200">
                                    [{risk.severity.toUpperCase()}] {risk.description}
                                  </div>
                                  {risk.mitigation && (
                                    <div className="text-orange-700 dark:text-orange-400 mt-1">
                                      Mitigation: {risk.mitigation}
                                    </div>
                                  )}
                                </div>
                              ))}
                            </div>
                          </div>
                        )}

                        {/* Subtasks */}
                        {task.subtasks.length > 0 && (
                          <div className="text-xs text-gray-500 dark:text-gray-400">
                            {task.subtasks.length} subtask{task.subtasks.length !== 1 ? 's' : ''}
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                </div>

                {/* Dependencies Summary */}
                {breakdown.dependencies.length > 0 && (
                  <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-3">
                    <div className="text-sm font-semibold text-blue-900 dark:text-blue-200 mb-1">
                      {breakdown.dependencies.length} Dependency Relationship(s)
                    </div>
                    <p className="text-xs text-blue-700 dark:text-blue-300">
                      Tasks will be ordered by dependencies during creation
                    </p>
                  </div>
                )}
              </div>

              {error && (
                <div className="p-3 bg-red-50 dark:bg-red-900/30 border border-red-200 dark:border-red-800 rounded-lg text-sm text-red-600 dark:text-red-400">
                  {error}
                </div>
              )}

              {/* Actions */}
              <div className="flex justify-end gap-3 pt-4 border-t border-gray-200 dark:border-gray-700">
                <button
                  onClick={() => setBreakdown(null)}
                  className="px-4 py-2 text-gray-600 dark:text-gray-400 hover:text-gray-800 dark:hover:text-gray-200"
                >
                  Back
                </button>
                <button
                  onClick={handleCreateTasks}
                  className="px-6 py-2 bg-gradient-to-r from-purple-500 to-blue-500 text-white rounded-lg hover:from-purple-600 hover:to-blue-600 font-medium"
                >
                  Create {breakdown.tasks.length} Task{breakdown.tasks.length !== 1 ? 's' : ''}
                </button>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
};

function getNextTaskNumber(existingTasks: Task[]): number {
  let maxTaskNumber = 0;
  existingTasks.forEach(task => {
    if (task.taskId) {
      const match = task.taskId.match(/TASK-(\d+)/);
      if (match) {
        const num = parseInt(match[1], 10);
        if (num > maxTaskNumber) maxTaskNumber = num;
      }
    }
  });
  return maxTaskNumber + 1;
}
