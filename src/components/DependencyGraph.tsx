'use client';

import { useMemo } from 'react';
import { Task } from '@/types/task';
import { TaskDependency } from '@/types/task-breakdown';
import { GitBranch, AlertCircle } from 'lucide-react';

interface DependencyGraphProps {
  tasks: Task[];
  dependencies: TaskDependency[];
}

export function DependencyGraph({ tasks, dependencies }: DependencyGraphProps) {
  const taskMap = useMemo(() => {
    const map = new Map<string, Task>();
    tasks.forEach((task) => map.set(task.id, task));
    return map;
  }, [tasks]);

  const blockedTasks = useMemo(() => {
    const blocked = new Set<string>();
    dependencies.forEach((dep) => {
      const blockingTask = taskMap.get(dep.dependsOnTaskId);
      if (blockingTask && blockingTask.status !== 'done') {
        blocked.add(dep.taskId);
      }
    });
    return blocked;
  }, [dependencies, taskMap]);

  const taskDependencies = useMemo(() => {
    const deps = new Map<string, TaskDependency[]>();
    dependencies.forEach((dep) => {
      const existing = deps.get(dep.taskId) || [];
      existing.push(dep);
      deps.set(dep.taskId, existing);
    });
    return deps;
  }, [dependencies]);

  if (dependencies.length === 0) {
    return (
      <div className="text-center py-8 text-gray-500">
        <GitBranch className="w-12 h-12 mx-auto mb-2 opacity-50" />
        <p>No task dependencies configured</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2 text-sm text-gray-600">
        <GitBranch className="w-4 h-4" />
        <span>{dependencies.length} dependencies</span>
        {blockedTasks.size > 0 && (
          <>
            <span>•</span>
            <AlertCircle className="w-4 h-4 text-orange-500" />
            <span className="text-orange-600">{blockedTasks.size} tasks blocked</span>
          </>
        )}
      </div>

      <div className="space-y-3">
        {Array.from(taskDependencies.entries()).map(([taskId, deps]) => {
          const task = taskMap.get(taskId);
          if (!task) return null;

          const isBlocked = blockedTasks.has(taskId);

          return (
            <div
              key={taskId}
              className={`border rounded-lg p-3 ${
                isBlocked
                  ? 'border-orange-300 bg-orange-50'
                  : 'border-gray-200 bg-white'
              }`}
            >
              <div className="flex items-start gap-2 mb-2">
                <span className="text-xs font-mono text-gray-500">{task.taskId}</span>
                <h4 className="flex-1 font-medium text-gray-900">{task.title}</h4>
                {isBlocked && (
                  <span className="inline-flex items-center px-2 py-0.5 rounded text-xs bg-orange-100 text-orange-800 border border-orange-300">
                    <AlertCircle className="w-3 h-3 mr-1" />
                    Blocked
                  </span>
                )}
              </div>

              <div className="space-y-2 pl-4">
                {deps.map((dep) => {
                  const depTask = taskMap.get(dep.dependsOnTaskId);
                  if (!depTask) return null;

                  const isBlocking = depTask.status !== 'done';

                  return (
                    <div key={dep.id} className="flex items-center gap-2 text-sm">
                      <div className="w-6 h-6 flex items-center justify-center">
                        <div className="w-px h-full bg-gray-300" />
                        <div className="absolute w-2 h-2 rounded-full bg-gray-400" />
                      </div>
                      <span className="text-xs text-gray-500">{dep.dependencyType}</span>
                      <span className="text-xs font-mono text-gray-500">
                        {depTask.taskId}
                      </span>
                      <span className={isBlocking ? 'text-orange-600' : 'text-gray-600'}>
                        {depTask.title}
                      </span>
                      <span
                        className={`ml-auto px-2 py-0.5 rounded text-xs ${
                          depTask.status === 'done'
                            ? 'bg-green-100 text-green-700'
                            : depTask.status === 'in-progress'
                            ? 'bg-blue-100 text-blue-700'
                            : 'bg-gray-100 text-gray-700'
                        }`}
                      >
                        {depTask.status}
                      </span>
                    </div>
                  );
                })}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
