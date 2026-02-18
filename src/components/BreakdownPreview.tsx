'use client';

import { useState } from 'react';
import { Task } from '@/types/task';
import { BreakdownResult } from '@/lib/taskBreakdown';
import { CheckCircle2, AlertTriangle, Clock, Tag, FileText, X } from 'lucide-react';

interface BreakdownPreviewProps {
  breakdown: BreakdownResult;
  onConfirm: () => void;
  onCancel: () => void;
}

export const BreakdownPreview = ({ breakdown, onConfirm, onCancel }: BreakdownPreviewProps) => {
  const [selectedTask, setSelectedTask] = useState<Task | null>(null);

  const allTasks = [...breakdown.epics, ...breakdown.stories, ...breakdown.subtasks];
  const totalEstimatedHours = allTasks.reduce((sum, task) => sum + (task.estimatedHours || 0), 0);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
      <div className="bg-white dark:bg-gray-800 rounded-xl w-full max-w-6xl shadow-xl max-h-[90vh] overflow-hidden flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200 dark:border-gray-700">
          <div>
            <h3 className="text-xl font-bold text-gray-900 dark:text-white">Task Breakdown Preview</h3>
            <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
              {breakdown.epics.length} epic(s), {breakdown.stories.length} story(ies), {breakdown.subtasks.length} subtask(s)
              {totalEstimatedHours > 0 && ` • Est. ${totalEstimatedHours}h total`}
            </p>
          </div>
          <button onClick={onCancel} className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300">
            <X size={24} />
          </button>
        </div>

        {/* Body */}
        <div className="flex-1 overflow-hidden flex">
          {/* Task List */}
          <div className="flex-1 overflow-y-auto p-6 border-r border-gray-200 dark:border-gray-700">
            <div className="space-y-6">
              {breakdown.epics.map((epic) => {
                const epicStories = breakdown.stories.filter((s) => s.parentTaskId === epic.id);
                return (
                  <div key={epic.id} className="border border-gray-200 dark:border-gray-700 rounded-lg overflow-hidden">
                    {/* Epic Header */}
                    <div
                      onClick={() => setSelectedTask(epic)}
                      className={`p-4 cursor-pointer transition-colors ${
                        selectedTask?.id === epic.id
                          ? 'bg-blue-50 dark:bg-blue-900/20 border-l-4 border-blue-500'
                          : 'bg-gray-50 dark:bg-gray-900/50 hover:bg-gray-100 dark:hover:bg-gray-900'
                      }`}
                    >
                      <div className="flex items-start justify-between gap-3">
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-1">
                            <span className="text-xs font-mono text-gray-500 dark:text-gray-400">
                              {epic.taskId}
                            </span>
                            <span className="px-2 py-0.5 bg-purple-100 dark:bg-purple-900/30 text-purple-700 dark:text-purple-300 text-xs font-medium rounded">
                              EPIC
                            </span>
                            <PriorityBadge priority={epic.priority || 3} />
                          </div>
                          <h4 className="font-semibold text-gray-900 dark:text-white">{epic.title}</h4>
                          {epic.description && (
                            <p className="text-sm text-gray-600 dark:text-gray-400 mt-1 line-clamp-2">
                              {epic.description}
                            </p>
                          )}
                          <div className="flex items-center gap-3 mt-2">
                            {epic.estimatedHours && (
                              <div className="flex items-center gap-1 text-xs text-gray-500 dark:text-gray-400">
                                <Clock size={12} />
                                {epic.estimatedHours}h
                              </div>
                            )}
                            {epic.tags && epic.tags.length > 0 && (
                              <div className="flex items-center gap-1">
                                {epic.tags.slice(0, 3).map((tag) => (
                                  <span key={tag} className="px-2 py-0.5 bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300 text-xs rounded">
                                    {tag}
                                  </span>
                                ))}
                              </div>
                            )}
                          </div>
                        </div>
                        {epic.riskFlags && epic.riskFlags.length > 0 && (
                          <AlertTriangle size={16} className="text-orange-500 flex-shrink-0" />
                        )}
                      </div>
                    </div>

                    {/* Stories under this epic */}
                    {epicStories.length > 0 && (
                      <div className="border-t border-gray-200 dark:border-gray-700">
                        {epicStories.map((story) => {
                          const storySubtasks = breakdown.subtasks.filter((st) => st.parentTaskId === story.id);
                          return (
                            <div key={story.id} className="border-b border-gray-200 dark:border-gray-700 last:border-b-0">
                              <div
                                onClick={() => setSelectedTask(story)}
                                className={`p-3 pl-8 cursor-pointer transition-colors ${
                                  selectedTask?.id === story.id
                                    ? 'bg-blue-50 dark:bg-blue-900/20 border-l-4 border-blue-500'
                                    : 'hover:bg-gray-50 dark:hover:bg-gray-900/30'
                                }`}
                              >
                                <div className="flex items-start justify-between gap-3">
                                  <div className="flex-1">
                                    <div className="flex items-center gap-2 mb-1">
                                      <span className="text-xs font-mono text-gray-500 dark:text-gray-400">
                                        {story.taskId}
                                      </span>
                                      <span className="px-2 py-0.5 bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 text-xs font-medium rounded">
                                        STORY
                                      </span>
                                      <PriorityBadge priority={story.priority || 3} />
                                    </div>
                                    <h5 className="text-sm font-medium text-gray-900 dark:text-white">{story.title}</h5>
                                    {story.estimatedHours && (
                                      <div className="flex items-center gap-1 text-xs text-gray-500 dark:text-gray-400 mt-1">
                                        <Clock size={12} />
                                        {story.estimatedHours}h
                                      </div>
                                    )}
                                  </div>
                                  {story.riskFlags && story.riskFlags.length > 0 && (
                                    <AlertTriangle size={14} className="text-orange-500 flex-shrink-0" />
                                  )}
                                </div>
                              </div>

                              {/* Subtasks under this story */}
                              {storySubtasks.length > 0 && (
                                <div className="bg-gray-50 dark:bg-gray-900/30">
                                  {storySubtasks.map((subtask) => (
                                    <div
                                      key={subtask.id}
                                      onClick={() => setSelectedTask(subtask)}
                                      className={`p-2 pl-16 cursor-pointer transition-colors text-sm border-b border-gray-200 dark:border-gray-700 last:border-b-0 ${
                                        selectedTask?.id === subtask.id
                                          ? 'bg-blue-50 dark:bg-blue-900/20 border-l-4 border-blue-500'
                                          : 'hover:bg-gray-100 dark:hover:bg-gray-900/50'
                                      }`}
                                    >
                                      <div className="flex items-center gap-2">
                                        <CheckCircle2 size={12} className="text-gray-400" />
                                        <span className="text-xs font-mono text-gray-500 dark:text-gray-400">
                                          {subtask.taskId}
                                        </span>
                                        <span className="text-gray-700 dark:text-gray-300">{subtask.title}</span>
                                        {subtask.estimatedHours && (
                                          <span className="text-xs text-gray-500 dark:text-gray-400 ml-auto">
                                            {subtask.estimatedHours}h
                                          </span>
                                        )}
                                      </div>
                                    </div>
                                  ))}
                                </div>
                              )}
                            </div>
                          );
                        })}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>

          {/* Task Details Panel */}
          <div className="w-96 overflow-y-auto p-6 bg-gray-50 dark:bg-gray-900/50">
            {selectedTask ? (
              <div className="space-y-4">
                <div>
                  <div className="text-xs font-mono text-gray-500 dark:text-gray-400 mb-1">
                    {selectedTask.taskId}
                  </div>
                  <h4 className="text-lg font-bold text-gray-900 dark:text-white">{selectedTask.title}</h4>
                  {selectedTask.description && (
                    <p className="text-sm text-gray-600 dark:text-gray-400 mt-2">{selectedTask.description}</p>
                  )}
                </div>

                {selectedTask.definitionOfDone && selectedTask.definitionOfDone.length > 0 && (
                  <div>
                    <h5 className="text-sm font-semibold text-gray-900 dark:text-white mb-2 flex items-center gap-2">
                      <CheckCircle2 size={16} />
                      Definition of Done
                    </h5>
                    <ul className="space-y-1">
                      {selectedTask.definitionOfDone.map((item, idx) => (
                        <li key={idx} className="text-sm text-gray-600 dark:text-gray-400 flex items-start gap-2">
                          <span className="text-green-500 mt-0.5">✓</span>
                          {item}
                        </li>
                      ))}
                    </ul>
                  </div>
                )}

                {selectedTask.testNotes && (
                  <div>
                    <h5 className="text-sm font-semibold text-gray-900 dark:text-white mb-2 flex items-center gap-2">
                      <FileText size={16} />
                      Test Notes
                    </h5>
                    <p className="text-sm text-gray-600 dark:text-gray-400">{selectedTask.testNotes}</p>
                  </div>
                )}

                {selectedTask.riskFlags && selectedTask.riskFlags.length > 0 && (
                  <div>
                    <h5 className="text-sm font-semibold text-gray-900 dark:text-white mb-2 flex items-center gap-2">
                      <AlertTriangle size={16} />
                      Risk Flags
                    </h5>
                    <div className="space-y-2">
                      {selectedTask.riskFlags.map((risk, idx) => (
                        <div key={idx} className={`p-2 rounded border ${getRiskStyles(risk.severity)}`}>
                          <div className="flex items-center gap-2 mb-1">
                            <span className="text-xs font-semibold uppercase">{risk.severity}</span>
                          </div>
                          <p className="text-sm">{risk.description}</p>
                          {risk.mitigation && (
                            <p className="text-xs mt-1 opacity-80">Mitigation: {risk.mitigation}</p>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {selectedTask.tags && selectedTask.tags.length > 0 && (
                  <div>
                    <h5 className="text-sm font-semibold text-gray-900 dark:text-white mb-2 flex items-center gap-2">
                      <Tag size={16} />
                      Tags
                    </h5>
                    <div className="flex flex-wrap gap-2">
                      {selectedTask.tags.map((tag) => (
                        <span key={tag} className="px-2 py-1 bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300 text-xs rounded">
                          {tag}
                        </span>
                      ))}
                    </div>
                  </div>
                )}

                {selectedTask.estimatedHours && (
                  <div>
                    <h5 className="text-sm font-semibold text-gray-900 dark:text-white mb-2 flex items-center gap-2">
                      <Clock size={16} />
                      Estimated Effort
                    </h5>
                    <p className="text-sm text-gray-600 dark:text-gray-400">
                      {selectedTask.estimatedHours} hours
                    </p>
                  </div>
                )}
              </div>
            ) : (
              <div className="text-center py-8 text-gray-400 dark:text-gray-500">
                <FileText size={48} className="mx-auto mb-2 opacity-50" />
                <p className="text-sm">Select a task to view details</p>
              </div>
            )}
          </div>
        </div>

        {/* Footer */}
        <div className="p-6 border-t border-gray-200 dark:border-gray-700 flex justify-between items-center">
          <div className="text-sm text-gray-500 dark:text-gray-400">
            Review the breakdown and click &quot;Create Tasks&quot; to add them to your board
          </div>
          <div className="flex gap-3">
            <button
              onClick={onCancel}
              className="px-4 py-2 text-gray-600 dark:text-gray-400 hover:text-gray-800 dark:hover:text-gray-200 transition-colors"
            >
              Cancel
            </button>
            <button
              onClick={onConfirm}
              className="px-6 py-2 bg-black dark:bg-white text-white dark:text-black rounded-lg hover:bg-gray-800 dark:hover:bg-gray-200 transition-colors font-medium"
            >
              Create Tasks
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

function PriorityBadge({ priority }: { priority: number }) {
  const colors = {
    1: 'bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400',
    2: 'bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300',
    3: 'bg-yellow-100 dark:bg-yellow-900/30 text-yellow-700 dark:text-yellow-300',
    4: 'bg-orange-100 dark:bg-orange-900/30 text-orange-700 dark:text-orange-300',
    5: 'bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-300',
  };

  const labels = {
    1: 'P1',
    2: 'P2',
    3: 'P3',
    4: 'P4',
    5: 'P5',
  };

  return (
    <span className={`px-2 py-0.5 text-xs font-medium rounded ${colors[priority as keyof typeof colors]}`}>
      {labels[priority as keyof typeof labels]}
    </span>
  );
}

function getRiskStyles(severity: 'low' | 'medium' | 'high' | 'critical') {
  switch (severity) {
    case 'critical':
      return 'bg-red-50 dark:bg-red-900/20 border-red-200 dark:border-red-800 text-red-700 dark:text-red-300';
    case 'high':
      return 'bg-orange-50 dark:bg-orange-900/20 border-orange-200 dark:border-orange-800 text-orange-700 dark:text-orange-300';
    case 'medium':
      return 'bg-yellow-50 dark:bg-yellow-900/20 border-yellow-200 dark:border-yellow-800 text-yellow-700 dark:text-yellow-300';
    case 'low':
      return 'bg-blue-50 dark:bg-blue-900/20 border-blue-200 dark:border-blue-800 text-blue-700 dark:text-blue-300';
  }
}
