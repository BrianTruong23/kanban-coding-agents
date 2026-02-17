'use client';

import { Task } from '@/types/task';
import { TaskDependency } from '@/types/dependency';
import { ArrowRight, AlertCircle, Link2 } from 'lucide-react';

interface DependencyGraphProps {
  tasks: Task[];
  dependencies: TaskDependency[];
  onTaskClick?: (taskId: string) => void;
}

export const DependencyGraph = ({ tasks, dependencies, onTaskClick }: DependencyGraphProps) => {
  const getTaskById = (id: string) => tasks.find(t => t.id === id);

  const getTaskDependencies = (taskId: string) => {
    return dependencies.filter(
      d => d.sourceTaskId === taskId || d.targetTaskId === taskId
    );
  };

  const getDependencyColor = (type: TaskDependency['type']) => {
    switch (type) {
      case 'blocks':
        return 'text-red-600 dark:text-red-400';
      case 'blocked-by':
        return 'text-orange-600 dark:text-orange-400';
      case 'relates-to':
        return 'text-blue-600 dark:text-blue-400';
      default:
        return 'text-gray-600 dark:text-gray-400';
    }
  };

  const getDependencyLabel = (type: TaskDependency['type']) => {
    switch (type) {
      case 'blocks':
        return 'Blocks';
      case 'blocked-by':
        return 'Blocked by';
      case 'relates-to':
        return 'Relates to';
      default:
        return type;
    }
  };

  if (dependencies.length === 0) {
    return (
      <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-8 text-center">
        <Link2 className="mx-auto mb-3 text-gray-400 dark:text-gray-500" size={48} />
        <p className="text-gray-600 dark:text-gray-400">No dependencies defined</p>
        <p className="text-sm text-gray-500 dark:text-gray-500 mt-1">
          Dependencies will appear here when tasks are linked
        </p>
      </div>
    );
  }

  // Group tasks by dependencies
  const taskWithDeps = tasks.filter(task => getTaskDependencies(task.id).length > 0);

  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700">
      <div className="p-4 border-b border-gray-200 dark:border-gray-700">
        <h3 className="font-semibold text-gray-900 dark:text-white flex items-center gap-2">
          <Link2 size={20} />
          Task Dependencies
        </h3>
        <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
          {dependencies.length} dependency link{dependencies.length !== 1 ? 's' : ''} across {taskWithDeps.length} task{taskWithDeps.length !== 1 ? 's' : ''}
        </p>
      </div>

      <div className="p-4 space-y-4 max-h-[500px] overflow-y-auto">
        {taskWithDeps.map(task => {
          const taskDeps = getTaskDependencies(task.id);
          const blockedBy = taskDeps.filter(d => d.targetTaskId === task.id && d.type === 'blocked-by');
          const blocks = taskDeps.filter(d => d.sourceTaskId === task.id && d.type === 'blocks');
          const relatesTo = taskDeps.filter(
            d => (d.sourceTaskId === task.id || d.targetTaskId === task.id) && d.type === 'relates-to'
          );

          return (
            <div
              key={task.id}
              className="bg-gray-50 dark:bg-gray-900/50 rounded-lg p-3 border border-gray-200 dark:border-gray-700"
            >
              <div
                className="font-medium text-gray-900 dark:text-white mb-2 cursor-pointer hover:text-blue-600 dark:hover:text-blue-400 transition-colors flex items-center gap-2"
                onClick={() => onTaskClick?.(task.id)}
              >
                <span className="text-xs font-mono text-gray-500 dark:text-gray-400">
                  {task.taskId}
                </span>
                <span className="text-sm">{task.title}</span>
              </div>

              {blockedBy.length > 0 && (
                <div className="mb-2">
                  <div className="text-xs font-semibold text-orange-600 dark:text-orange-400 mb-1 flex items-center gap-1">
                    <AlertCircle size={12} />
                    Blocked By
                  </div>
                  <div className="space-y-1 ml-4">
                    {blockedBy.map(dep => {
                      const targetTask = getTaskById(dep.targetTaskId === task.id ? dep.sourceTaskId : dep.targetTaskId);
                      return targetTask ? (
                        <div
                          key={dep.id}
                          className="text-xs text-gray-700 dark:text-gray-300 flex items-center gap-1 cursor-pointer hover:text-blue-600 dark:hover:text-blue-400"
                          onClick={() => onTaskClick?.(targetTask.id)}
                        >
                          <ArrowRight size={12} className="text-orange-500" />
                          <span className="font-mono text-gray-500 dark:text-gray-400">{targetTask.taskId}</span>
                          <span>{targetTask.title}</span>
                        </div>
                      ) : null;
                    })}
                  </div>
                </div>
              )}

              {blocks.length > 0 && (
                <div className="mb-2">
                  <div className="text-xs font-semibold text-red-600 dark:text-red-400 mb-1 flex items-center gap-1">
                    <AlertCircle size={12} />
                    Blocks
                  </div>
                  <div className="space-y-1 ml-4">
                    {blocks.map(dep => {
                      const targetTask = getTaskById(dep.targetTaskId);
                      return targetTask ? (
                        <div
                          key={dep.id}
                          className="text-xs text-gray-700 dark:text-gray-300 flex items-center gap-1 cursor-pointer hover:text-blue-600 dark:hover:text-blue-400"
                          onClick={() => onTaskClick?.(targetTask.id)}
                        >
                          <ArrowRight size={12} className="text-red-500" />
                          <span className="font-mono text-gray-500 dark:text-gray-400">{targetTask.taskId}</span>
                          <span>{targetTask.title}</span>
                        </div>
                      ) : null;
                    })}
                  </div>
                </div>
              )}

              {relatesTo.length > 0 && (
                <div>
                  <div className="text-xs font-semibold text-blue-600 dark:text-blue-400 mb-1 flex items-center gap-1">
                    <Link2 size={12} />
                    Related
                  </div>
                  <div className="space-y-1 ml-4">
                    {relatesTo.map(dep => {
                      const relatedTaskId = dep.sourceTaskId === task.id ? dep.targetTaskId : dep.sourceTaskId;
                      const relatedTask = getTaskById(relatedTaskId);
                      return relatedTask ? (
                        <div
                          key={dep.id}
                          className="text-xs text-gray-700 dark:text-gray-300 flex items-center gap-1 cursor-pointer hover:text-blue-600 dark:hover:text-blue-400"
                          onClick={() => onTaskClick?.(relatedTask.id)}
                        >
                          <ArrowRight size={12} className="text-blue-500" />
                          <span className="font-mono text-gray-500 dark:text-gray-400">{relatedTask.taskId}</span>
                          <span>{relatedTask.title}</span>
                        </div>
                      ) : null;
                    })}
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
};
