'use client';

import { useMemo } from 'react';
import { Task, TaskDependency } from '@/types/task';
import { ArrowRight, AlertTriangle, Link as LinkIcon } from 'lucide-react';

interface DependencyGraphProps {
  tasks: Task[];
  dependencies: TaskDependency[];
  onTaskClick?: (taskId: string) => void;
}

interface GraphNode {
  task: Task;
  dependencies: TaskDependency[];
  dependents: TaskDependency[];
  level: number;
}

export const DependencyGraph = ({ tasks, dependencies, onTaskClick }: DependencyGraphProps) => {
  const graph = useMemo(() => {
    // Build graph structure
    const nodes: Map<string, GraphNode> = new Map();

    // Initialize nodes
    tasks.forEach(task => {
      nodes.set(task.id, {
        task,
        dependencies: dependencies.filter(d => d.taskId === task.id),
        dependents: dependencies.filter(d => d.dependsOnTaskId === task.id),
        level: 0,
      });
    });

    // Calculate levels (for layout)
    const calculateLevels = () => {
      let changed = true;
      let iterations = 0;
      const maxIterations = 100;

      while (changed && iterations < maxIterations) {
        changed = false;
        iterations++;

        nodes.forEach((node, taskId) => {
          node.dependencies.forEach(dep => {
            const depNode = nodes.get(dep.dependsOnTaskId);
            if (depNode && node.level <= depNode.level) {
              node.level = depNode.level + 1;
              changed = true;
            }
          });
        });
      }
    };

    calculateLevels();

    // Group by level
    const levels: Map<number, GraphNode[]> = new Map();
    nodes.forEach(node => {
      const levelNodes = levels.get(node.level) || [];
      levelNodes.push(node);
      levels.set(node.level, levelNodes);
    });

    return { nodes, levels };
  }, [tasks, dependencies]);

  const maxLevel = Math.max(...Array.from(graph.levels.keys()));

  if (tasks.length === 0) {
    return (
      <div className="flex items-center justify-center h-64 text-gray-400 dark:text-gray-500">
        <div className="text-center">
          <LinkIcon size={48} className="mx-auto mb-2 opacity-50" />
          <p>No tasks to display</p>
        </div>
      </div>
    );
  }

  if (dependencies.length === 0) {
    return (
      <div className="flex items-center justify-center h-64 text-gray-400 dark:text-gray-500">
        <div className="text-center">
          <LinkIcon size={48} className="mx-auto mb-2 opacity-50" />
          <p>No dependencies defined</p>
          <p className="text-sm mt-1">Tasks are independent</p>
        </div>
      </div>
    );
  }

  const renderNode = (node: GraphNode) => {
    const { task, dependencies: deps, dependents } = node;
    const hasRisks = task.riskFlags && task.riskFlags.length > 0;

    return (
      <div
        key={task.id}
        className={`bg-white dark:bg-gray-700 rounded-lg border-2 p-3 min-w-[200px] max-w-[250px] cursor-pointer hover:shadow-lg transition-shadow ${
          hasRisks
            ? 'border-orange-400 dark:border-orange-600'
            : 'border-gray-200 dark:border-gray-600'
        }`}
        onClick={() => onTaskClick?.(task.id)}
      >
        <div className="flex items-start justify-between mb-2">
          <div className="flex-1">
            <div className="flex items-center gap-1 mb-1">
              <span className="text-xs font-mono text-gray-500 dark:text-gray-400">{task.taskId}</span>
              {task.taskType && (
                <span className={`text-xs px-1.5 py-0.5 rounded ${
                  task.taskType === 'epic'
                    ? 'bg-purple-100 dark:bg-purple-900 text-purple-700 dark:text-purple-300'
                    : task.taskType === 'story'
                    ? 'bg-blue-100 dark:bg-blue-900 text-blue-700 dark:text-blue-300'
                    : 'bg-green-100 dark:bg-green-900 text-green-700 dark:text-green-300'
                }`}>
                  {task.taskType}
                </span>
              )}
            </div>
            <h4 className="font-semibold text-sm text-gray-900 dark:text-white line-clamp-2">
              {task.title}
            </h4>
          </div>
        </div>

        <div className="flex items-center justify-between text-xs text-gray-500 dark:text-gray-400 mt-2">
          <span className={`px-1.5 py-0.5 rounded ${
            task.status === 'done'
              ? 'bg-green-100 dark:bg-green-900 text-green-700 dark:text-green-300'
              : task.status === 'in-progress'
              ? 'bg-blue-100 dark:bg-blue-900 text-blue-700 dark:text-blue-300'
              : 'bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300'
          }`}>
            {task.status}
          </span>
          <span>P{task.priority}</span>
        </div>

        {hasRisks && (
          <div className="flex items-center gap-1 mt-2">
            <AlertTriangle size={12} className="text-orange-500" />
            <span className="text-xs text-orange-600 dark:text-orange-400">
              {task.riskFlags!.length} risk(s)
            </span>
          </div>
        )}

        {(deps.length > 0 || dependents.length > 0) && (
          <div className="flex items-center gap-3 mt-2 text-xs text-gray-500 dark:text-gray-400 border-t border-gray-200 dark:border-gray-600 pt-2">
            {deps.length > 0 && (
              <span title="Depends on">
                ← {deps.length}
              </span>
            )}
            {dependents.length > 0 && (
              <span title="Blocks">
                {dependents.length} →
              </span>
            )}
          </div>
        )}
      </div>
    );
  };

  return (
    <div className="w-full overflow-x-auto">
      <div className="inline-flex flex-col gap-8 p-6 min-w-full">
        {Array.from({ length: maxLevel + 1 }, (_, level) => {
          const levelNodes = graph.levels.get(level) || [];
          if (levelNodes.length === 0) return null;

          return (
            <div key={level} className="flex flex-col gap-4">
              <div className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wide">
                {level === 0 ? 'Foundation' : `Level ${level}`}
              </div>
              <div className="flex items-start gap-6 flex-wrap">
                {levelNodes.map((node, index) => (
                  <div key={node.task.id} className="relative">
                    {renderNode(node)}

                    {/* Draw dependency arrows */}
                    {index < levelNodes.length - 1 && (
                      <div className="absolute top-1/2 -right-3 transform -translate-y-1/2">
                        <ArrowRight size={20} className="text-gray-300 dark:text-gray-600" />
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          );
        })}
      </div>

      {/* Legend */}
      <div className="p-4 bg-gray-50 dark:bg-gray-800 border-t border-gray-200 dark:border-gray-700">
        <div className="text-xs font-semibold text-gray-700 dark:text-gray-300 mb-2">Legend</div>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 text-xs">
          <div className="flex items-center gap-2">
            <div className="w-4 h-4 bg-purple-100 dark:bg-purple-900 rounded"></div>
            <span className="text-gray-600 dark:text-gray-400">Epic</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-4 h-4 bg-blue-100 dark:bg-blue-900 rounded"></div>
            <span className="text-gray-600 dark:text-gray-400">Story</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-4 h-4 bg-green-100 dark:bg-green-900 rounded"></div>
            <span className="text-gray-600 dark:text-gray-400">Subtask</span>
          </div>
          <div className="flex items-center gap-2">
            <AlertTriangle size={16} className="text-orange-500" />
            <span className="text-gray-600 dark:text-gray-400">Has Risks</span>
          </div>
        </div>
      </div>
    </div>
  );
};
