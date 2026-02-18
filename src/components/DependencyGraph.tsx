'use client';

import { HierarchicalTask, TaskDependency } from '@/types/taskHierarchy';
import { useState, useEffect, useRef } from 'react';
import { GitBranch, AlertCircle, CheckCircle2, Circle } from 'lucide-react';

interface DependencyGraphProps {
  tasks: HierarchicalTask[];
  dependencies: TaskDependency[];
  onTaskClick?: (task: HierarchicalTask) => void;
}

interface GraphNode {
  id: string;
  task: HierarchicalTask;
  x: number;
  y: number;
  level: number;
  dependents: string[]; // Tasks that depend on this one
}

export const DependencyGraph = ({ tasks, dependencies, onTaskClick }: DependencyGraphProps) => {
  const [nodes, setNodes] = useState<GraphNode[]>([]);
  const [selectedNode, setSelectedNode] = useState<string | null>(null);
  const svgRef = useRef<SVGSVGElement>(null);

  useEffect(() => {
    // Build dependency graph
    const graph = buildGraph(tasks, dependencies);
    setNodes(graph);
  }, [tasks, dependencies]);

  const buildGraph = (tasks: HierarchicalTask[], deps: TaskDependency[]): GraphNode[] => {
    const nodes: GraphNode[] = [];
    const taskMap = new Map(tasks.map(t => [t.id, t]));

    // Build dependency map (task -> tasks that depend on it)
    const dependencyMap = new Map<string, string[]>();
    deps.forEach(dep => {
      if (!dependencyMap.has(dep.dependsOn)) {
        dependencyMap.set(dep.dependsOn, []);
      }
      dependencyMap.get(dep.dependsOn)!.push(dep.id);
    });

    // Calculate levels using topological sort
    const levels = calculateLevels(tasks, deps);

    // Position nodes
    const levelGroups = new Map<number, HierarchicalTask[]>();
    tasks.forEach(task => {
      const level = levels.get(task.id) || 0;
      if (!levelGroups.has(level)) {
        levelGroups.set(level, []);
      }
      levelGroups.get(level)!.push(task);
    });

    const nodeWidth = 200;
    const nodeHeight = 80;
    const horizontalSpacing = 100;
    const verticalSpacing = 40;

    levelGroups.forEach((tasksInLevel, level) => {
      tasksInLevel.forEach((task, index) => {
        nodes.push({
          id: task.id,
          task,
          x: level * (nodeWidth + horizontalSpacing),
          y: index * (nodeHeight + verticalSpacing),
          level,
          dependents: dependencyMap.get(task.id) || []
        });
      });
    });

    return nodes;
  };

  const calculateLevels = (
    tasks: HierarchicalTask[],
    deps: TaskDependency[]
  ): Map<string, number> => {
    const levels = new Map<string, number>();
    const visited = new Set<string>();

    // Build adjacency list (task -> tasks it depends on)
    const adjList = new Map<string, string[]>();
    deps.forEach(dep => {
      if (!adjList.has(dep.id)) {
        adjList.set(dep.id, []);
      }
      adjList.get(dep.id)!.push(dep.dependsOn);
    });

    const dfs = (taskId: string): number => {
      if (visited.has(taskId)) {
        return levels.get(taskId) || 0;
      }

      visited.add(taskId);
      const dependencies = adjList.get(taskId) || [];

      if (dependencies.length === 0) {
        levels.set(taskId, 0);
        return 0;
      }

      const maxDepLevel = Math.max(...dependencies.map(depId => dfs(depId)));
      const level = maxDepLevel + 1;
      levels.set(taskId, level);
      return level;
    };

    tasks.forEach(task => dfs(task.id));
    return levels;
  };

  const getEdges = () => {
    const edges: Array<{ from: GraphNode; to: GraphNode; type: string }> = [];

    dependencies.forEach(dep => {
      const fromNode = nodes.find(n => n.id === dep.dependsOn);
      const toNode = nodes.find(n => n.id === dep.id);

      if (fromNode && toNode) {
        edges.push({ from: fromNode, to: toNode, type: dep.type });
      }
    });

    return edges;
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'done':
        return 'bg-green-100 dark:bg-green-900/30 border-green-500';
      case 'in-progress':
        return 'bg-blue-100 dark:bg-blue-900/30 border-blue-500';
      case 'review':
        return 'bg-purple-100 dark:bg-purple-900/30 border-purple-500';
      default:
        return 'bg-gray-100 dark:bg-gray-800 border-gray-300 dark:border-gray-600';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'done':
        return <CheckCircle2 size={14} className="text-green-600 dark:text-green-400" />;
      case 'in-progress':
      case 'review':
        return <Circle size={14} className="text-blue-600 dark:text-blue-400" />;
      default:
        return <Circle size={14} className="text-gray-400" />;
    }
  };

  const getPriorityColor = (priority: number) => {
    if (priority >= 4) return 'text-red-600 dark:text-red-400';
    if (priority === 3) return 'text-yellow-600 dark:text-yellow-400';
    return 'text-gray-600 dark:text-gray-400';
  };

  if (tasks.length === 0) {
    return (
      <div className="text-center py-8 text-gray-500 dark:text-gray-400">
        No tasks to visualize
      </div>
    );
  }

  const edges = getEdges();
  const width = Math.max(800, (Math.max(...nodes.map(n => n.level)) + 1) * 300);
  const height = Math.max(400, (Math.max(...nodes.map(n => n.y)) + 100));

  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-4">
      <div className="mb-4 flex items-center gap-2">
        <GitBranch size={20} className="text-gray-600 dark:text-gray-400" />
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
          Task Dependencies
        </h3>
      </div>

      <div className="overflow-auto" style={{ maxHeight: '600px' }}>
        <svg ref={svgRef} width={width} height={height} className="bg-gray-50 dark:bg-gray-900/50 rounded">
          {/* Draw edges */}
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
                className="fill-gray-400 dark:fill-gray-500"
              />
            </marker>
          </defs>

          {edges.map((edge, index) => {
            const fromX = edge.from.x + 200;
            const fromY = edge.from.y + 40;
            const toX = edge.to.x;
            const toY = edge.to.y + 40;

            const isDashed = edge.type === 'relates-to';

            return (
              <g key={index}>
                <line
                  x1={fromX}
                  y1={fromY}
                  x2={toX}
                  y2={toY}
                  className="stroke-gray-400 dark:stroke-gray-500"
                  strokeWidth="2"
                  strokeDasharray={isDashed ? '5,5' : '0'}
                  markerEnd="url(#arrowhead)"
                />
                {edge.type === 'blocks' && (
                  <text
                    x={(fromX + toX) / 2}
                    y={(fromY + toY) / 2 - 5}
                    className="text-xs fill-red-600 dark:fill-red-400"
                    textAnchor="middle"
                  >
                    blocks
                  </text>
                )}
              </g>
            );
          })}

          {/* Draw nodes */}
          {nodes.map(node => (
            <g
              key={node.id}
              transform={`translate(${node.x}, ${node.y})`}
              onClick={() => {
                setSelectedNode(node.id);
                onTaskClick?.(node.task);
              }}
              className="cursor-pointer"
            >
              <foreignObject width="200" height="80">
                <div
                  className={`h-full p-3 rounded-lg border-2 transition-all ${getStatusColor(
                    node.task.status
                  )} ${
                    selectedNode === node.id
                      ? 'ring-2 ring-blue-500 dark:ring-blue-400'
                      : ''
                  }`}
                >
                  <div className="flex items-start justify-between mb-1">
                    <span className="text-xs font-mono text-gray-600 dark:text-gray-400">
                      {node.task.taskId}
                    </span>
                    {getStatusIcon(node.task.status)}
                  </div>
                  <div className="text-sm font-medium text-gray-900 dark:text-white line-clamp-2 mb-1">
                    {node.task.title}
                  </div>
                  <div className="flex items-center gap-2">
                    <span className={`text-xs font-semibold ${getPriorityColor(node.task.priority)}`}>
                      P{node.task.priority}
                    </span>
                    {node.task.riskFlags.length > 0 && (
                      <AlertCircle
                        size={12}
                        className="text-red-600 dark:text-red-400"
                      />
                    )}
                    <span className="text-xs text-gray-500 dark:text-gray-400">
                      {node.task.type}
                    </span>
                  </div>
                </div>
              </foreignObject>
            </g>
          ))}
        </svg>
      </div>

      {/* Legend */}
      <div className="mt-4 pt-4 border-t border-gray-200 dark:border-gray-700">
        <div className="flex gap-6 text-xs text-gray-600 dark:text-gray-400">
          <div className="flex items-center gap-2">
            <div className="w-4 h-0.5 bg-gray-400"></div>
            <span>Blocks</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-4 h-0.5 bg-gray-400 border-dashed"></div>
            <span>Relates to</span>
          </div>
          <div className="flex items-center gap-2">
            <AlertCircle size={12} className="text-red-600 dark:text-red-400" />
            <span>Has risks</span>
          </div>
        </div>
      </div>
    </div>
  );
};
