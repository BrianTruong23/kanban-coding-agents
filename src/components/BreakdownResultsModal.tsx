'use client';

import { useState } from 'react';
import { X, CheckCircle2, AlertCircle, Clock, Zap, ChevronDown, ChevronRight } from 'lucide-react';
import { BreakdownResult, BreakdownEpic, BreakdownTask } from '@/types/breakdown';

interface BreakdownResultsModalProps {
  result: BreakdownResult;
  onClose: () => void;
  onImport: (result: BreakdownResult) => Promise<void>;
}

export const BreakdownResultsModal = ({ result, onClose, onImport }: BreakdownResultsModalProps) => {
  const [expandedEpics, setExpandedEpics] = useState<Set<number>>(new Set([0]));
  const [expandedTasks, setExpandedTasks] = useState<Set<string>>(new Set());
  const [isImporting, setIsImporting] = useState(false);

  const toggleEpic = (index: number) => {
    const newExpanded = new Set(expandedEpics);
    if (newExpanded.has(index)) {
      newExpanded.delete(index);
    } else {
      newExpanded.add(index);
    }
    setExpandedEpics(newExpanded);
  };

  const toggleTask = (id: string) => {
    const newExpanded = new Set(expandedTasks);
    if (newExpanded.has(id)) {
      newExpanded.delete(id);
    } else {
      newExpanded.add(id);
    }
    setExpandedTasks(newExpanded);
  };

  const handleImport = async () => {
    setIsImporting(true);
    try {
      await onImport(result);
      onClose();
    } catch (error) {
      console.error('Import failed:', error);
      alert('Failed to import tasks. Please try again.');
    } finally {
      setIsImporting(false);
    }
  };

  const getRiskColor = (level: string) => {
    switch (level) {
      case 'critical': return 'text-red-600 bg-red-100 dark:bg-red-900/30';
      case 'high': return 'text-orange-600 bg-orange-100 dark:bg-orange-900/30';
      case 'medium': return 'text-yellow-600 bg-yellow-100 dark:bg-yellow-900/30';
      case 'low': return 'text-green-600 bg-green-100 dark:bg-green-900/30';
      default: return 'text-gray-600 bg-gray-100 dark:bg-gray-700';
    }
  };

  const getPriorityLabel = (priority: number) => {
    const labels = ['', 'Low', 'Medium-Low', 'Medium', 'High', 'Critical'];
    return labels[priority] || 'Medium';
  };

  const renderTask = (task: BreakdownTask, epicIndex?: number, taskIndex?: number) => {
    const taskId = `${epicIndex}-${taskIndex}`;
    const isExpanded = expandedTasks.has(taskId);

    return (
      <div key={taskId} className="border border-gray-200 dark:border-gray-600 rounded-lg p-4 bg-white dark:bg-gray-700">
        <div className="flex items-start gap-3">
          <button
            onClick={() => toggleTask(taskId)}
            className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 mt-1"
          >
            {isExpanded ? <ChevronDown size={16} /> : <ChevronRight size={16} />}
          </button>
          <div className="flex-1">
            <div className="flex items-start justify-between gap-2 mb-2">
              <h4 className="font-semibold text-gray-900 dark:text-white">{task.title}</h4>
              <div className="flex items-center gap-2">
                <span className={`text-xs px-2 py-1 rounded ${getRiskColor(task.riskLevel)}`}>
                  {task.riskLevel}
                </span>
                <span className="text-xs px-2 py-1 rounded bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300">
                  P{task.priority}
                </span>
              </div>
            </div>

            <p className="text-sm text-gray-600 dark:text-gray-400 mb-3">{task.description}</p>

            {isExpanded && (
              <div className="space-y-3 mt-3 pt-3 border-t border-gray-200 dark:border-gray-600">
                {/* DoD */}
                <div>
                  <div className="flex items-center gap-2 mb-1">
                    <CheckCircle2 size={14} className="text-green-500" />
                    <span className="text-xs font-semibold text-gray-700 dark:text-gray-300">Definition of Done</span>
                  </div>
                  <p className="text-xs text-gray-600 dark:text-gray-400 pl-5">{task.definitionOfDone}</p>
                </div>

                {/* Test Notes */}
                <div>
                  <div className="flex items-center gap-2 mb-1">
                    <Zap size={14} className="text-yellow-500" />
                    <span className="text-xs font-semibold text-gray-700 dark:text-gray-300">Test Notes</span>
                  </div>
                  <p className="text-xs text-gray-600 dark:text-gray-400 pl-5">{task.testNotes}</p>
                </div>

                {/* Risk */}
                <div>
                  <div className="flex items-center gap-2 mb-1">
                    <AlertCircle size={14} className="text-orange-500" />
                    <span className="text-xs font-semibold text-gray-700 dark:text-gray-300">Risk Assessment</span>
                  </div>
                  <p className="text-xs text-gray-600 dark:text-gray-400 pl-5">{task.riskDescription}</p>
                </div>

                {/* Metadata */}
                <div className="flex items-center gap-4 text-xs text-gray-500 dark:text-gray-400 pl-5">
                  <div className="flex items-center gap-1">
                    <Clock size={12} />
                    {task.estimatedHours}h
                  </div>
                  {task.requiredSkills.length > 0 && (
                    <div className="flex items-center gap-1">
                      <span>Skills:</span>
                      {task.requiredSkills.slice(0, 3).join(', ')}
                      {task.requiredSkills.length > 3 && ` +${task.requiredSkills.length - 3}`}
                    </div>
                  )}
                </div>

                {/* Tags */}
                {task.tags.length > 0 && (
                  <div className="flex flex-wrap gap-1 pl-5">
                    {task.tags.map((tag, i) => (
                      <span key={i} className="text-xs px-2 py-0.5 rounded bg-gray-100 dark:bg-gray-600 text-gray-700 dark:text-gray-300">
                        {tag}
                      </span>
                    ))}
                  </div>
                )}

                {/* Subtasks */}
                {task.subtasks && task.subtasks.length > 0 && (
                  <div className="pl-5">
                    <span className="text-xs font-semibold text-gray-700 dark:text-gray-300 mb-2 block">
                      Subtasks ({task.subtasks.length})
                    </span>
                    <div className="space-y-2">
                      {task.subtasks.map((subtask, i) => (
                        <div key={i} className="text-xs p-2 bg-gray-50 dark:bg-gray-800 rounded border border-gray-200 dark:border-gray-600">
                          <div className="font-medium text-gray-900 dark:text-white mb-1">{subtask.title}</div>
                          <div className="text-gray-600 dark:text-gray-400 mb-1">{subtask.description}</div>
                          <div className="flex items-center gap-2 text-gray-500 dark:text-gray-400">
                            <span className={`px-1.5 py-0.5 rounded ${getRiskColor(subtask.riskLevel)}`}>
                              {subtask.riskLevel}
                            </span>
                            <span>{subtask.estimatedHours}h</span>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </div>
    );
  };

  const renderEpic = (epic: BreakdownEpic, index: number) => {
    const isExpanded = expandedEpics.has(index);

    return (
      <div key={index} className="border-2 border-purple-200 dark:border-purple-700 rounded-lg p-4 bg-purple-50 dark:bg-purple-900/10">
        <div className="flex items-start gap-3 mb-3">
          <button
            onClick={() => toggleEpic(index)}
            className="text-purple-600 dark:text-purple-400 mt-1"
          >
            {isExpanded ? <ChevronDown size={20} /> : <ChevronRight size={20} />}
          </button>
          <div className="flex-1">
            <div className="flex items-start justify-between gap-2">
              <div>
                <h3 className="font-bold text-lg text-purple-900 dark:text-purple-100">{epic.title}</h3>
                <p className="text-sm text-purple-700 dark:text-purple-300 mt-1">{epic.description}</p>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-xs px-2 py-1 rounded bg-purple-200 dark:bg-purple-800 text-purple-800 dark:text-purple-200">
                  {epic.tasks.length} tasks
                </span>
                <span className="text-xs px-2 py-1 rounded bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300">
                  P{epic.priority}
                </span>
              </div>
            </div>
          </div>
        </div>

        {isExpanded && (
          <div className="space-y-3 pl-8">
            {epic.tasks.map((task, taskIndex) => renderTask(task, index, taskIndex))}
          </div>
        )}
      </div>
    );
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4" onClick={onClose}>
      <div className="bg-white dark:bg-gray-800 rounded-xl w-full max-w-6xl max-h-[90vh] shadow-xl flex flex-col" onClick={(e) => e.stopPropagation()}>
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200 dark:border-gray-700">
          <div>
            <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-1">Task Breakdown Results</h2>
            <p className="text-sm text-gray-600 dark:text-gray-400">{result.summary}</p>
          </div>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
          >
            <X size={24} />
          </button>
        </div>

        {/* Stats */}
        <div className="p-6 bg-gray-50 dark:bg-gray-900/50 border-b border-gray-200 dark:border-gray-700">
          <div className="flex items-center gap-6">
            <div>
              <div className="text-2xl font-bold text-gray-900 dark:text-white">{result.epics.length}</div>
              <div className="text-xs text-gray-600 dark:text-gray-400">Epics</div>
            </div>
            <div>
              <div className="text-2xl font-bold text-gray-900 dark:text-white">
                {result.epics.reduce((sum, e) => sum + e.tasks.length, 0) + result.standaloneTasks.length}
              </div>
              <div className="text-xs text-gray-600 dark:text-gray-400">Tasks</div>
            </div>
            <div>
              <div className="text-2xl font-bold text-gray-900 dark:text-white">{result.totalEstimatedHours}h</div>
              <div className="text-xs text-gray-600 dark:text-gray-400">Estimated Hours</div>
            </div>
            {result.suggestedSprint && (
              <div>
                <div className="text-sm font-semibold text-gray-900 dark:text-white">{result.suggestedSprint}</div>
                <div className="text-xs text-gray-600 dark:text-gray-400">Suggested Sprint</div>
              </div>
            )}
          </div>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6 space-y-4">
          {/* Epics */}
          {result.epics.map((epic, index) => renderEpic(epic, index))}

          {/* Standalone Tasks */}
          {result.standaloneTasks.length > 0 && (
            <div>
              <h3 className="font-bold text-gray-900 dark:text-white mb-3">Standalone Tasks</h3>
              <div className="space-y-3">
                {result.standaloneTasks.map((task, index) => renderTask(task, -1, index))}
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-6 border-t border-gray-200 dark:border-gray-700 flex justify-end gap-3">
          <button
            onClick={onClose}
            className="px-4 py-2 text-gray-600 dark:text-gray-400 hover:text-gray-800 dark:hover:text-gray-200 transition-colors"
            disabled={isImporting}
          >
            Cancel
          </button>
          <button
            onClick={handleImport}
            className="px-6 py-2 bg-purple-600 hover:bg-purple-700 text-white rounded-lg transition-colors font-medium disabled:opacity-50 disabled:cursor-not-allowed"
            disabled={isImporting}
          >
            {isImporting ? 'Importing...' : 'Import All to Board'}
          </button>
        </div>
      </div>
    </div>
  );
};
