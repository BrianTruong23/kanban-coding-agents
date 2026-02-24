'use client';

import { useState, useEffect, useRef } from 'react';
import { Task, TaskDependency } from '@/types/task';
import { AlertTriangle, CheckCircle, Clock, XCircle } from 'lucide-react';

interface DependencyGraphProps {
  tasks: Task[];
  dependencies: TaskDependency[];
  onTaskClick?: (task: Task) => void;
}

interface GraphNode {
  task: Task;
  x: number;
  y: number;
  level: number;
  dependencies: string[];
}

export const DependencyGraph = ({ tasks, dependencies, onTaskClick }: DependencyGraphProps) => {
  const canvasRef = useRef<HTMLDivElement>(null);
  const [nodes, setNodes] = useState<GraphNode[]>([]);
  const [selectedTask, setSelectedTask] = useState<string | null>(null);

  useEffect(() => {
    // Build dependency graph
    const taskMap = new Map(tasks.map(t => [t.id, t]));
    const depMap = new Map<string, string[]>();

    dependencies.forEach(dep => {
      const deps = depMap.get(dep.taskId) || [];
      deps.push(dep.dependsOnTaskId);
      depMap.set(dep.taskId, deps);
    });

    // Calculate levels (topological sort)
    const levels = calculateLevels(tasks, dependencies);
    const levelGroups = new Map<number, Task[]>();

    tasks.forEach(task => {
      const level = levels.get(task.id) || 0;
      const group = levelGroups.get(level) || [];
      group.push(task);
      levelGroups.set(level, group);
    });

    // Position nodes
    const graphNodes: GraphNode[] = [];
    const nodeWidth = 180;
    const nodeHeight = 80;
    const levelSpacing = 200;
    const nodeSpacing = 100;

    levelGroups.forEach((tasksInLevel, level) => {
      tasksInLevel.forEach((task, index) => {
        graphNodes.push({
          task,
          x: level * levelSpacing + 50,
          y: index * nodeSpacing + 50,
          level,
          dependencies: depMap.get(task.id) || [],
        });
      });
    });

    setNodes(graphNodes);
  }, [tasks, dependencies]);

  const getStatusColor = (status: Task['status']) => {
    switch (status) {
      case 'done':
        return 'bg-green-100 dark:bg-green-900/30 border-green-500';
      case 'in-progress':
        return 'bg-blue-100 dark:bg-blue-900/30 border-blue-500';
      case 'review':
        return 'bg-purple-100 dark:bg-purple-900/30 border-purple-500';
      default:
        return 'bg-gray-100 dark:bg-gray-800 border-gray-400';
    }
  };

  const getStatusIcon = (status: Task['status']) => {
    switch (status) {
      case 'done':
        return <CheckCircle size={14} className="text-green-600 dark:text-green-400" />;
      case 'in-progress':
        return <Clock size={14} className="text-blue-600 dark:text-blue-400" />;
      case 'review':
        return <AlertTriangle size={14} className="text-purple-600 dark:text-purple-400" />;
      default:
        return <XCircle size={14} className="text-gray-500" />;
    }
  };

  const getRiskColor = (riskLevel: Task['riskLevel']) => {
    switch (riskLevel) {
      case 'critical':
      case 'high':
        return 'text-red-600 dark:text-red-400';
      case 'medium':
        return 'text-yellow-600 dark:text-yellow-400';
      default:
        return 'text-gray-500';
    }
  };

  const handleTaskClick = (task: Task) => {
    setSelectedTask(task.id);
    onTaskClick?.(task);
  };

  if (tasks.length === 0) {
    return (
      <div className="flex items-center justify-center h-64 text-gray-500 dark:text-gray-400">
        No tasks to visualize
      </div>
    );
  }

  if (dependencies.length === 0) {
    return (
      <div className="flex items-center justify-center h-64 text-gray-500 dark:text-gray-400">
        No dependencies to visualize. Add dependencies between tasks to see the graph.
      </div>
    );
  }

  return (
    <div className="relative w-full h-full overflow-auto bg-gray-50 dark:bg-gray-900 rounded-lg border border-gray-200 dark:border-gray-700">
      <div ref={canvasRef} className="relative min-h-[600px] p-8">
        {/* SVG for drawing connections */}
        <svg className="absolute top-0 left-0 w-full h-full pointer-events-none" style={{ zIndex: 0 }}>
          {nodes.map(node => {
            const taskDeps = dependencies.filter(d => d.taskId === node.task.id);
            return taskDeps.map(dep => {
              const depNode = nodes.find(n => n.task.id === dep.dependsOnTaskId);
              if (!depNode) return null;

              const x1 = node.x;
              const y1 = node.y + 40;
              const x2 = depNode.x + 180;
              const y2 = depNode.y + 40;

              const isSelected = selectedTask === node.task.id || selectedTask === depNode.task.id;

              return (
                <g key={`${node.task.id}-${dep.dependsOnTaskId}`}>
                  <line
                    x1={x1}
                    y1={y1}
                    x2={x2}
                    y2={y2}
                    stroke={isSelected ? '#3b82f6' : '#9ca3af'}
                    strokeWidth={isSelected ? 2 : 1}
                    strokeDasharray={dep.dependencyType === 'related' ? '5,5' : undefined}
                    markerEnd="url(#arrowhead)"
                  />
                </g>
              );
            });
          })}
          <defs>
            <marker
              id="arrowhead"
              markerWidth="10"
              markerHeight="10"
              refX="9"
              refY="3"
              orient="auto"
            >
              <polygon points="0 0, 10 3, 0 6" fill="#9ca3af" />
            </marker>
          </defs>
        </svg>

        {/* Task nodes */}
        {nodes.map(node => (
          <div
            key={node.task.id}
            className={`absolute cursor-pointer transition-all ${getStatusColor(node.task.status)} border-2 rounded-lg p-3 shadow-md hover:shadow-lg ${
              selectedTask === node.task.id ? 'ring-2 ring-blue-500 scale-105' : ''
            }`}
            style={{
              left: node.x,
              top: node.y,
              width: 180,
              zIndex: 1,
            }}
            onClick={() => handleTaskClick(node.task)}
          >
            <div className="flex items-start justify-between mb-1">
              <span className="text-xs font-mono text-gray-500 dark:text-gray-400">
                {node.task.taskId}
              </span>
              {getStatusIcon(node.task.status)}
            </div>
            <h4 className="text-sm font-semibold text-gray-900 dark:text-white mb-1 line-clamp-2">
              {node.task.title}
            </h4>
            <div className="flex items-center justify-between text-xs">
              <span className={`font-medium ${getRiskColor(node.task.riskLevel)}`}>
                {node.task.riskLevel !== 'none' && `⚠ ${node.task.riskLevel}`}
              </span>
              {node.task.estimatedHours && (
                <span className="text-gray-500 dark:text-gray-400">
                  {node.task.estimatedHours}h
                </span>
              )}
            </div>
            {node.task.taskType !== 'task' && (
              <div className="mt-1">
                <span className="text-xs px-1.5 py-0.5 rounded bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300">
                  {node.task.taskType}
                </span>
              </div>
            )}
          </div>
        ))}
      </div>

      {/* Legend */}
      <div className="absolute bottom-4 right-4 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg p-3 shadow-lg">
        <h4 className="text-xs font-semibold text-gray-700 dark:text-gray-300 mb-2">Legend</h4>
        <div className="space-y-1 text-xs">
          <div className="flex items-center gap-2">
            <div className="w-4 h-1 bg-gray-400"></div>
            <span className="text-gray-600 dark:text-gray-400">Blocks</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-4 h-1 bg-gray-400 border-dashed border-t-2 border-gray-400"></div>
            <span className="text-gray-600 dark:text-gray-400">Related</span>
          </div>
        </div>
      </div>
    </div>
  );
};

/**
 * Calculate task levels for graph layout (topological sort)
 */
function calculateLevels(tasks: Task[], dependencies: TaskDependency[]): Map<string, number> {
  const levels = new Map<string, number>();
  const inDegree = new Map<string, number>();
  const adjList = new Map<string, string[]>();

  // Initialize
  tasks.forEach(task => {
    inDegree.set(task.id, 0);
    adjList.set(task.id, []);
  });

  // Build adjacency list and calculate in-degrees
  dependencies.forEach(dep => {
    const list = adjList.get(dep.dependsOnTaskId) || [];
    list.push(dep.taskId);
    adjList.set(dep.dependsOnTaskId, list);

    const degree = inDegree.get(dep.taskId) || 0;
    inDegree.set(dep.taskId, degree + 1);
  });

  // BFS to assign levels
  const queue: string[] = [];
  tasks.forEach(task => {
    if ((inDegree.get(task.id) || 0) === 0) {
      queue.push(task.id);
      levels.set(task.id, 0);
    }
  });

  while (queue.length > 0) {
    const taskId = queue.shift()!;
    const currentLevel = levels.get(taskId) || 0;

    const neighbors = adjList.get(taskId) || [];
    neighbors.forEach(neighborId => {
      const degree = (inDegree.get(neighborId) || 0) - 1;
      inDegree.set(neighborId, degree);

      const neighborLevel = levels.get(neighborId) || 0;
      levels.set(neighborId, Math.max(neighborLevel, currentLevel + 1));

      if (degree === 0) {
        queue.push(neighborId);
      }
    });
  }

  return levels;
}
