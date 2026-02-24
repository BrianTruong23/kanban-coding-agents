'use client';

import { useState, useEffect, useRef } from 'react';
import { EnhancedTask, TaskDependency } from '@/types/breakdown';
import { GitBranch, AlertCircle, ChevronRight } from 'lucide-react';

interface TaskDependencyGraphProps {
  tasks: EnhancedTask[];
  dependencies: TaskDependency[];
  onTaskClick?: (task: EnhancedTask) => void;
}

interface GraphNode {
  task: EnhancedTask;
  x: number;
  y: number;
  level: number;
}

export const TaskDependencyGraph = ({
  tasks,
  dependencies,
  onTaskClick
}: TaskDependencyGraphProps) => {
  const [selectedTask, setSelectedTask] = useState<EnhancedTask | null>(null);
  const [graphNodes, setGraphNodes] = useState<GraphNode[]>([]);
  const svgRef = useRef<SVGSVGElement>(null);

  useEffect(() => {
    // Build dependency graph layout
    const nodes = buildGraphLayout(tasks, dependencies);
    setGraphNodes(nodes);
  }, [tasks, dependencies]);

  const handleTaskClick = (task: EnhancedTask) => {
    setSelectedTask(task);
    if (onTaskClick) {
      onTaskClick(task);
    }
  };

  // Get tasks that this task depends on
  const getDependencies = (taskId: string) => {
    return dependencies
      .filter(dep => dep.dependentTaskId === taskId)
      .map(dep => tasks.find(t => t.id === dep.dependsOnTaskId))
      .filter(Boolean) as EnhancedTask[];
  };

  // Get tasks that depend on this task
  const getDependents = (taskId: string) => {
    return dependencies
      .filter(dep => dep.dependsOnTaskId === taskId)
      .map(dep => tasks.find(t => t.id === dep.dependentTaskId))
      .filter(Boolean) as EnhancedTask[];
  };

  return (
    <div className="flex flex-col h-full bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700">
      <div className="p-4 border-b border-gray-200 dark:border-gray-700">
        <div className="flex items-center gap-2">
          <GitBranch className="text-gray-600 dark:text-gray-400" size={20} />
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
            Task Dependencies
          </h3>
          <span className="ml-auto text-sm text-gray-500 dark:text-gray-400">
            {tasks.length} tasks, {dependencies.length} dependencies
          </span>
        </div>
      </div>

      <div className="flex-1 overflow-auto p-4">
        {dependencies.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full text-center py-12">
            <GitBranch size={48} className="text-gray-300 dark:text-gray-600 mb-4" />
            <p className="text-gray-500 dark:text-gray-400 text-sm">
              No dependencies defined yet
            </p>
            <p className="text-gray-400 dark:text-gray-500 text-xs mt-2">
              Dependencies help visualize task relationships
            </p>
          </div>
        ) : (
          <div className="space-y-6">
            {/* Visual Graph */}
            <div className="bg-gray-50 dark:bg-gray-900 rounded-lg p-6 overflow-x-auto">
              <svg
                ref={svgRef}
                className="w-full"
                style={{ minHeight: '400px' }}
                viewBox="0 0 1000 600"
              >
                {/* Draw connections */}
                {dependencies.map((dep, idx) => {
                  const fromNode = graphNodes.find(n => n.task.id === dep.dependsOnTaskId);
                  const toNode = graphNodes.find(n => n.task.id === dep.dependentTaskId);

                  if (!fromNode || !toNode) return null;

                  const color = dep.type === 'blocks' ? '#ef4444' :
                               dep.type === 'prerequisite' ? '#f59e0b' : '#6b7280';

                  return (
                    <g key={`dep-${idx}`}>
                      <line
                        x1={fromNode.x + 60}
                        y1={fromNode.y + 20}
                        x2={toNode.x}
                        y2={toNode.y + 20}
                        stroke={color}
                        strokeWidth="2"
                        markerEnd="url(#arrowhead)"
                        opacity="0.6"
                      />
                    </g>
                  );
                })}

                {/* Define arrow marker */}
                <defs>
                  <marker
                    id="arrowhead"
                    markerWidth="10"
                    markerHeight="10"
                    refX="9"
                    refY="3"
                    orient="auto"
                  >
                    <polygon
                      points="0 0, 10 3, 0 6"
                      fill="#6b7280"
                    />
                  </marker>
                </defs>

                {/* Draw nodes */}
                {graphNodes.map((node, idx) => (
                  <g
                    key={`node-${idx}`}
                    transform={`translate(${node.x}, ${node.y})`}
                    onClick={() => handleTaskClick(node.task)}
                    className="cursor-pointer"
                  >
                    <rect
                      width="120"
                      height="40"
                      rx="6"
                      fill={selectedTask?.id === node.task.id ? '#3b82f6' : '#ffffff'}
                      stroke={selectedTask?.id === node.task.id ? '#2563eb' : '#d1d5db'}
                      strokeWidth="2"
                    />
                    <text
                      x="60"
                      y="20"
                      textAnchor="middle"
                      dominantBaseline="middle"
                      fill={selectedTask?.id === node.task.id ? '#ffffff' : '#1f2937'}
                      fontSize="11"
                      fontWeight="500"
                    >
                      {node.task.taskId}
                    </text>
                    <text
                      x="60"
                      y="32"
                      textAnchor="middle"
                      dominantBaseline="middle"
                      fill={selectedTask?.id === node.task.id ? '#e5e7eb' : '#6b7280'}
                      fontSize="9"
                    >
                      {node.task.title.substring(0, 15)}...
                    </text>
                  </g>
                ))}
              </svg>
            </div>

            {/* Legend */}
            <div className="flex items-center gap-6 text-xs">
              <div className="flex items-center gap-2">
                <div className="w-8 h-0.5 bg-red-500"></div>
                <span className="text-gray-600 dark:text-gray-400">Blocks</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-8 h-0.5 bg-amber-500"></div>
                <span className="text-gray-600 dark:text-gray-400">Prerequisite</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-8 h-0.5 bg-gray-500"></div>
                <span className="text-gray-600 dark:text-gray-400">Related</span>
              </div>
            </div>

            {/* Detailed List View */}
            <div className="space-y-3">
              <h4 className="text-sm font-semibold text-gray-700 dark:text-gray-300">
                Dependency Details
              </h4>
              {tasks.map(task => {
                const deps = getDependencies(task.id);
                const dependents = getDependents(task.id);

                if (deps.length === 0 && dependents.length === 0) return null;

                return (
                  <div
                    key={task.id}
                    className="border border-gray-200 dark:border-gray-700 rounded-lg p-3"
                  >
                    <div className="flex items-start gap-2 mb-2">
                      <div className="font-medium text-sm text-gray-900 dark:text-white">
                        {task.taskId}: {task.title}
                      </div>
                    </div>

                    {deps.length > 0 && (
                      <div className="mb-2">
                        <div className="text-xs text-gray-500 dark:text-gray-400 mb-1 flex items-center gap-1">
                          <AlertCircle size={12} />
                          Depends on:
                        </div>
                        <div className="pl-4 space-y-1">
                          {deps.map(dep => (
                            <div
                              key={dep.id}
                              className="text-xs text-gray-600 dark:text-gray-300 flex items-center gap-1"
                            >
                              <ChevronRight size={12} />
                              {dep.taskId}: {dep.title}
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    {dependents.length > 0 && (
                      <div>
                        <div className="text-xs text-gray-500 dark:text-gray-400 mb-1 flex items-center gap-1">
                          <AlertCircle size={12} />
                          Blocks:
                        </div>
                        <div className="pl-4 space-y-1">
                          {dependents.map(dep => (
                            <div
                              key={dep.id}
                              className="text-xs text-gray-600 dark:text-gray-300 flex items-center gap-1"
                            >
                              <ChevronRight size={12} />
                              {dep.taskId}: {dep.title}
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </div>

      {selectedTask && (
        <div className="p-4 border-t border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-900">
          <div className="text-sm">
            <div className="font-semibold text-gray-900 dark:text-white mb-1">
              {selectedTask.taskId}: {selectedTask.title}
            </div>
            <div className="text-xs text-gray-600 dark:text-gray-400">
              {selectedTask.description}
            </div>
            <div className="flex gap-2 mt-2">
              <span className="text-xs px-2 py-1 bg-blue-100 dark:bg-blue-900 text-blue-700 dark:text-blue-300 rounded">
                {selectedTask.status}
              </span>
              <span className="text-xs px-2 py-1 bg-purple-100 dark:bg-purple-900 text-purple-700 dark:text-purple-300 rounded">
                Priority: {selectedTask.priority}
              </span>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

/**
 * Builds a graph layout for tasks based on dependencies
 */
function buildGraphLayout(
  tasks: EnhancedTask[],
  dependencies: TaskDependency[]
): GraphNode[] {
  const nodes: GraphNode[] = [];
  const taskLevels = new Map<string, number>();

  // Calculate levels for each task (topological sort)
  const calculateLevels = () => {
    const visited = new Set<string>();
    const inDegree = new Map<string, number>();

    // Initialize in-degrees
    tasks.forEach(task => inDegree.set(task.id, 0));
    dependencies.forEach(dep => {
      inDegree.set(dep.dependentTaskId, (inDegree.get(dep.dependentTaskId) || 0) + 1);
    });

    // Find tasks with no dependencies (level 0)
    const queue: { taskId: string; level: number }[] = [];
    tasks.forEach(task => {
      if (inDegree.get(task.id) === 0) {
        queue.push({ taskId: task.id, level: 0 });
        taskLevels.set(task.id, 0);
      }
    });

    // BFS to assign levels
    while (queue.length > 0) {
      const { taskId, level } = queue.shift()!;
      visited.add(taskId);

      // Find all dependents
      const dependents = dependencies.filter(d => d.dependsOnTaskId === taskId);

      for (const dep of dependents) {
        const newInDegree = (inDegree.get(dep.dependentTaskId) || 0) - 1;
        inDegree.set(dep.dependentTaskId, newInDegree);

        if (newInDegree === 0) {
          const newLevel = level + 1;
          taskLevels.set(dep.dependentTaskId, newLevel);
          queue.push({ taskId: dep.dependentTaskId, level: newLevel });
        }
      }
    }

    // Assign default level to tasks not reached (no dependencies)
    tasks.forEach(task => {
      if (!taskLevels.has(task.id)) {
        taskLevels.set(task.id, 0);
      }
    });
  };

  calculateLevels();

  // Position nodes based on levels
  const levelGroups = new Map<number, EnhancedTask[]>();
  tasks.forEach(task => {
    const level = taskLevels.get(task.id) || 0;
    if (!levelGroups.has(level)) {
      levelGroups.set(level, []);
    }
    levelGroups.get(level)!.push(task);
  });

  const horizontalSpacing = 160;
  const verticalSpacing = 80;
  const startX = 50;
  const startY = 50;

  levelGroups.forEach((tasksInLevel, level) => {
    tasksInLevel.forEach((task, index) => {
      nodes.push({
        task,
        x: startX + level * horizontalSpacing,
        y: startY + index * verticalSpacing,
        level
      });
    });
  });

  return nodes;
}
