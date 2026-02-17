'use client';

import { Task } from '@/types/task';
import { Subtask } from '@/types/subtask';
import { DefinitionOfDone, TestNote, RiskFlag } from '@/types/breakdown';
import { CheckCircle, Circle, AlertTriangle, Flask, Target, X } from 'lucide-react';

interface TaskDetailsProps {
  task: Task;
  subtasks?: Subtask[];
  definitionOfDone?: DefinitionOfDone;
  testNotes?: TestNote[];
  riskFlags?: RiskFlag[];
  onClose: () => void;
  onSubtaskToggle?: (subtaskId: string, completed: boolean) => void;
}

export const TaskDetails = ({
  task,
  subtasks = [],
  definitionOfDone,
  testNotes = [],
  riskFlags = [],
  onClose,
  onSubtaskToggle,
}: TaskDetailsProps) => {
  const getRiskColor = (level: RiskFlag['level']) => {
    switch (level) {
      case 'critical':
        return 'bg-red-100 dark:bg-red-900/30 border-red-300 dark:border-red-800 text-red-700 dark:text-red-300';
      case 'high':
        return 'bg-orange-100 dark:bg-orange-900/30 border-orange-300 dark:border-orange-800 text-orange-700 dark:text-orange-300';
      case 'medium':
        return 'bg-yellow-100 dark:bg-yellow-900/30 border-yellow-300 dark:border-yellow-800 text-yellow-700 dark:text-yellow-300';
      case 'low':
        return 'bg-blue-100 dark:bg-blue-900/30 border-blue-300 dark:border-blue-800 text-blue-700 dark:text-blue-300';
    }
  };

  const getTestTypeColor = (type: TestNote['testType']) => {
    switch (type) {
      case 'unit':
        return 'bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-300';
      case 'integration':
        return 'bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300';
      case 'e2e':
        return 'bg-purple-100 dark:bg-purple-900/30 text-purple-700 dark:text-purple-300';
      case 'manual':
        return 'bg-orange-100 dark:bg-orange-900/30 text-orange-700 dark:text-orange-300';
    }
  };

  const completedSubtasks = subtasks.filter(s => s.completed).length;
  const totalSubtasks = subtasks.length;
  const progress = totalSubtasks > 0 ? (completedSubtasks / totalSubtasks) * 100 : 0;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
      <div className="bg-white dark:bg-gray-800 rounded-xl w-full max-w-4xl max-h-[90vh] flex flex-col shadow-2xl">
        {/* Header */}
        <div className="p-6 border-b border-gray-200 dark:border-gray-700">
          <div className="flex items-start justify-between">
            <div className="flex-1">
              <div className="flex items-center gap-2 mb-2">
                <span className="text-sm font-mono text-gray-500 dark:text-gray-400">
                  {task.taskId}
                </span>
                <span
                  className={`text-xs px-2 py-0.5 rounded-full ${
                    task.status === 'done'
                      ? 'bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-300'
                      : task.status === 'review'
                      ? 'bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300'
                      : task.status === 'in-progress'
                      ? 'bg-orange-100 dark:bg-orange-900/30 text-orange-700 dark:text-orange-300'
                      : 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300'
                  }`}
                >
                  {task.status}
                </span>
              </div>
              <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
                {task.title}
              </h2>
              {task.description && (
                <p className="text-gray-600 dark:text-gray-400 text-sm">
                  {task.description}
                </p>
              )}
              <div className="flex flex-wrap gap-2 mt-3">
                {task.tags.map(tag => (
                  <span
                    key={tag}
                    className="text-xs px-2 py-1 rounded-full bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300"
                  >
                    {tag}
                  </span>
                ))}
              </div>
            </div>
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 ml-4"
            >
              <X size={24} />
            </button>
          </div>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6">
          {/* Subtasks */}
          {subtasks.length > 0 && (
            <div>
              <div className="flex items-center justify-between mb-3">
                <h3 className="font-semibold text-gray-900 dark:text-white flex items-center gap-2">
                  <CheckCircle size={18} />
                  Subtasks ({completedSubtasks}/{totalSubtasks})
                </h3>
                <span className="text-xs text-gray-500 dark:text-gray-400">
                  {progress.toFixed(0)}% complete
                </span>
              </div>
              <div className="w-full h-2 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden mb-3">
                <div
                  className="h-full bg-green-500 transition-all duration-300"
                  style={{ width: `${progress}%` }}
                />
              </div>
              <div className="space-y-2">
                {subtasks.map(subtask => (
                  <div
                    key={subtask.id}
                    className="flex items-start gap-2 p-3 rounded-lg bg-gray-50 dark:bg-gray-900/50 border border-gray-200 dark:border-gray-700"
                  >
                    <button
                      onClick={() => onSubtaskToggle?.(subtask.id, !subtask.completed)}
                      className="flex-shrink-0 mt-0.5"
                    >
                      {subtask.completed ? (
                        <CheckCircle className="text-green-600 dark:text-green-400" size={18} />
                      ) : (
                        <Circle className="text-gray-400 dark:text-gray-500" size={18} />
                      )}
                    </button>
                    <div className="flex-1">
                      <div
                        className={`text-sm ${
                          subtask.completed
                            ? 'line-through text-gray-500 dark:text-gray-400'
                            : 'text-gray-900 dark:text-white'
                        }`}
                      >
                        {subtask.title}
                      </div>
                      {subtask.description && (
                        <div className="text-xs text-gray-600 dark:text-gray-400 mt-1">
                          {subtask.description}
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Definition of Done */}
          {definitionOfDone && definitionOfDone.criteria.length > 0 && (
            <div>
              <h3 className="font-semibold text-gray-900 dark:text-white mb-3 flex items-center gap-2">
                <Target size={18} />
                Definition of Done
              </h3>
              <div className="space-y-2">
                {definitionOfDone.criteria.map((criterion, idx) => (
                  <div
                    key={idx}
                    className="flex items-start gap-2 text-sm text-gray-700 dark:text-gray-300"
                  >
                    <CheckCircle className="flex-shrink-0 text-green-600 dark:text-green-400 mt-0.5" size={16} />
                    <span>{criterion}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Test Notes */}
          {testNotes.length > 0 && (
            <div>
              <h3 className="font-semibold text-gray-900 dark:text-white mb-3 flex items-center gap-2">
                <Flask size={18} />
                Test Notes
              </h3>
              <div className="space-y-2">
                {testNotes.map(note => (
                  <div
                    key={note.id}
                    className="p-3 rounded-lg bg-gray-50 dark:bg-gray-900/50 border border-gray-200 dark:border-gray-700"
                  >
                    <div className="flex items-center gap-2 mb-1">
                      <span className="font-medium text-sm text-gray-900 dark:text-white">
                        {note.title}
                      </span>
                      <span
                        className={`text-xs px-2 py-0.5 rounded-full ${getTestTypeColor(note.testType)}`}
                      >
                        {note.testType}
                      </span>
                    </div>
                    <p className="text-xs text-gray-600 dark:text-gray-400">
                      {note.description}
                    </p>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Risk Flags */}
          {riskFlags.length > 0 && (
            <div>
              <h3 className="font-semibold text-gray-900 dark:text-white mb-3 flex items-center gap-2">
                <AlertTriangle size={18} />
                Risk Flags
              </h3>
              <div className="space-y-2">
                {riskFlags.map(risk => (
                  <div
                    key={risk.id}
                    className={`p-3 rounded-lg border ${getRiskColor(risk.level)}`}
                  >
                    <div className="flex items-start gap-2">
                      <AlertTriangle className="flex-shrink-0 mt-0.5" size={16} />
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-1">
                          <span className="font-medium text-sm">
                            {risk.description}
                          </span>
                          <span className="text-xs px-2 py-0.5 rounded-full bg-white/50 dark:bg-black/20 uppercase font-semibold">
                            {risk.level}
                          </span>
                        </div>
                        {risk.mitigation && (
                          <div className="text-xs mt-1">
                            <span className="font-semibold">Mitigation:</span> {risk.mitigation}
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-6 border-t border-gray-200 dark:border-gray-700 flex justify-end">
          <button
            onClick={onClose}
            className="px-4 py-2 bg-black dark:bg-white text-white dark:text-black rounded-lg hover:bg-gray-800 dark:hover:bg-gray-200 transition-colors font-medium"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};
