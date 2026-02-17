'use client';

import { useState, useEffect, useRef } from 'react';
import { Task } from '@/types/task';
import { TaskDependency } from '@/types/epic';
import { GitBranch, AlertCircle, Link2 } from 'lucide-react';

interface TaskDependencyGraphProps {
  tasks: Task[];
  dependencies: TaskDependency[];
  onTaskClick?: (taskId: string) => void;
}

interface GraphNode {
  id: string;
  task: Task;
  x: number;
  y: number;
  dependencies: string[];
  dependents: string[];
  level: number;
}

interface GraphEdge {
  from: string;
  to: string;
  type: TaskDependency['type'];
}

export const TaskDependencyGraph = ({
  tasks,
  dependencies,
  onTaskClick
}: TaskDependencyGraphProps) => {
  const [nodes, setNodes] = useState<GraphNode[]>([]);
  const [edges, setEdges] = useState<GraphEdge[]>([]);
  const [selectedNode, setSelectedNode] = useState<string | null>(null);
  const [viewMode, setViewMode] = useState<'graph' | 'list'>('graph');
  const canvasRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    // Build graph structure
    const graphNodes = buildGraphNodes(tasks, dependencies);
    const graphEdges = buildGraphEdges(dependencies);

    setNodes(graphNodes);
    setEdges(graphEdges);
  }, [tasks, dependencies]);

  const buildGraphNodes = (tasks: Task[], dependencies: TaskDependency[]): GraphNode[] => {
    const taskMap = new Map(tasks.map(t => [t.id, t]));
    const nodes: GraphNode[] = [];

    // Build dependency maps
    const dependencyMap = new Map<string, string[]>();
    const dependentMap = new Map<string, string[]>();

    dependencies.forEach(dep => {
      if (dep.type === 'blocks') {
        const deps = dependencyMap.get(dep.dependentTaskId) || [];
        deps.push(dep.blockedByTaskId);
        dependencyMap.set(dep.dependentTaskId, deps);

        const depts = dependentMap.get(dep.blockedByTaskId) || [];
        depts.push(dep.dependentTaskId);
        dependentMap.set(dep.blockedByTaskId, depts);
      }
    });

    // Calculate levels (depth in dependency tree)
    const levels = new Map<string, number>();
    const calculateLevel = (taskId: string, visited = new Set<string>()): number => {
      if (levels.has(taskId)) return levels.get(taskId)!;
      if (visited.has(taskId)) return 0; // Circular dependency

      visited.add(taskId);
      const deps = dependencyMap.get(taskId) || [];
      const level = deps.length === 0
        ? 0
        : Math.max(...deps.map(d => calculateLevel(d, visited))) + 1;

      levels.set(taskId, level);
      return level;
    };

    tasks.forEach(task => calculateLevel(task.id));

    // Position nodes
    const levelGroups = new Map<number, string[]>();
    tasks.forEach(task => {
      const level = levels.get(task.id) || 0;
      const group = levelGroups.get(level) || [];
      group.push(task.id);
      levelGroups.set(level, group);
    });

    const nodeWidth = 200;
    const nodeHeight = 80;
    const levelSpacing = 250;
    const nodeSpacing = 100;

    tasks.forEach(task => {
      const level = levels.get(task.id) || 0;
      const group = levelGroups.get(level) || [];
      const indexInLevel = group.indexOf(task.id);

      nodes.push({
        id: task.id,
        task,
        x: level * levelSpacing + 50,
        y: indexInLevel * (nodeHeight + nodeSpacing) + 50,
        dependencies: dependencyMap.get(task.id) || [],
        dependents: dependentMap.get(task.id) || [],
        level,
      });
    });

    return nodes;
  };

  const buildGraphEdges = (dependencies: TaskDependency[]): GraphEdge[] => {
    return dependencies.map(dep => ({
      from: dep.blockedByTaskId,
      to: dep.dependentTaskId,
      type: dep.type,
    }));
  };

  const getStatusColor = (status: Task['status']): string => {
    switch (status) {
      case 'done': return 'bg-green-500';
      case 'review': return 'bg-blue-500';
      case 'in-progress': return 'bg-yellow-500';
      case 'backlog': return 'bg-gray-400';
      default: return 'bg-gray-400';
    }
  };

  const getPriorityColor = (priority: number): string => {
    if (priority >= 5) return 'text-red-600';
    if (priority >= 4) return 'text-orange-600';
    if (priority >= 3) return 'text-yellow-600';
    return 'text-gray-600';
  };

  const handleNodeClick = (nodeId: string) => {
    setSelectedNode(nodeId === selectedNode ? null : nodeId);
    if (onTaskClick) onTaskClick(nodeId);
  };

  const getBlockedTasks = (taskId: string): Task[] => {
    const blockedIds = dependencies
      .filter(d => d.blockedByTaskId === taskId && d.type === 'blocks')
      .map(d => d.dependentTaskId);
    return tasks.filter(t => blockedIds.includes(t.id));
  };

  const getBlockingTasks = (taskId: string): Task[] => {
    const blockingIds = dependencies
      .filter(d => d.dependentTaskId === taskId && d.type === 'blocks')
      .map(d => d.blockedByTaskId);
    return tasks.filter(t => blockingIds.includes(t.id));
  };

  if (viewMode === 'list') {
    return (
      <div className="space-y-4">
        <div className="flex justify-between items-center mb-4">
          <h3 className="text-lg font-semibold flex items-center gap-2">
            <GitBranch className="w-5 h-5" />
            Task Dependencies
          </h3>
          <div className="flex gap-2">
            <button
              onClick={() => setViewMode('graph')}
              className="px-3 py-1 text-sm bg-gray-200 dark:bg-gray-700 rounded hover:bg-gray-300 dark:hover:bg-gray-600"
            >
              Graph View
            </button>
            <button
              onClick={() => setViewMode('list')}
              className="px-3 py-1 text-sm bg-blue-500 text-white rounded"
            >
              List View
            </button>
          </div>
        </div>

        {tasks.map(task => {
          const blocking = getBlockingTasks(task.id);
          const blocked = getBlockedTasks(task.id);

          if (blocking.length === 0 && blocked.length === 0) return null;

          return (
            <div
              key={task.id}
              className="p-4 border dark:border-gray-700 rounded-lg bg-white dark:bg-gray-800"
            >
              <div className="flex items-start gap-3">
                <div className={`w-3 h-3 rounded-full mt-1 ${getStatusColor(task.status)}`} />
                <div className="flex-1">
                  <h4 className="font-medium">{task.taskId}: {task.title}</h4>

                  {blocking.length > 0 && (
                    <div className="mt-2">
                      <p className="text-sm text-red-600 dark:text-red-400 flex items-center gap-1">
                        <AlertCircle className="w-4 h-4" />
                        Blocked by:
                      </p>
                      <ul className="ml-6 mt-1 space-y-1">
                        {blocking.map(t => (
                          <li key={t.id} className="text-sm text-gray-600 dark:text-gray-400">
                            {t.taskId}: {t.title}
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}

                  {blocked.length > 0 && (
                    <div className="mt-2">
                      <p className="text-sm text-blue-600 dark:text-blue-400 flex items-center gap-1">
                        <Link2 className="w-4 h-4" />
                        Blocks:
                      </p>
                      <ul className="ml-6 mt-1 space-y-1">
                        {blocked.map(t => (
                          <li key={t.id} className="text-sm text-gray-600 dark:text-gray-400">
                            {t.taskId}: {t.title}
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}
                </div>
              </div>
            </div>
          );
        })}

        {tasks.every(task =>
          getBlockingTasks(task.id).length === 0 &&
          getBlockedTasks(task.id).length === 0
        ) && (
          <div className="text-center py-8 text-gray-500 dark:text-gray-400">
            No task dependencies defined yet
          </div>
        )}
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center mb-4">
        <h3 className="text-lg font-semibold flex items-center gap-2">
          <GitBranch className="w-5 h-5" />
          Task Dependency Graph
        </h3>
        <div className="flex gap-2">
          <button
            onClick={() => setViewMode('graph')}
            className="px-3 py-1 text-sm bg-blue-500 text-white rounded"
          >
            Graph View
          </button>
          <button
            onClick={() => setViewMode('list')}
            className="px-3 py-1 text-sm bg-gray-200 dark:bg-gray-700 rounded hover:bg-gray-300 dark:hover:bg-gray-600"
          >
            List View
          </button>
        </div>
      </div>

      <div
        ref={canvasRef}
        className="relative border dark:border-gray-700 rounded-lg bg-gray-50 dark:bg-gray-900 overflow-auto"
        style={{ minHeight: '500px', maxHeight: '700px' }}
      >
        <svg className="absolute inset-0 w-full h-full" style={{ minWidth: '800px', minHeight: '600px' }}>
          {/* Draw edges */}
          {edges.map((edge, idx) => {
            const fromNode = nodes.find(n => n.id === edge.from);
            const toNode = nodes.find(n => n.id === edge.to);

            if (!fromNode || !toNode) return null;

            const x1 = fromNode.x + 200;
            const y1 = fromNode.y + 40;
            const x2 = toNode.x;
            const y2 = toNode.y + 40;

            const isHighlighted = selectedNode === fromNode.id || selectedNode === toNode.id;

            return (
              <g key={idx}>
                <defs>
                  <marker
                    id={`arrowhead-${idx}`}
                    markerWidth="10"
                    markerHeight="10"
                    refX="9"
                    refY="3"
                    orient="auto"
                  >
                    <polygon
                      points="0 0, 10 3, 0 6"
                      fill={isHighlighted ? '#3b82f6' : '#9ca3af'}
                    />
                  </marker>
                </defs>
                <path
                  d={`M ${x1} ${y1} C ${(x1 + x2) / 2} ${y1}, ${(x1 + x2) / 2} ${y2}, ${x2} ${y2}`}
                  stroke={isHighlighted ? '#3b82f6' : '#9ca3af'}
                  strokeWidth={isHighlighted ? '2' : '1.5'}
                  fill="none"
                  markerEnd={`url(#arrowhead-${idx})`}
                />
              </g>
            );
          })}
        </svg>

        {/* Draw nodes */}
        {nodes.map(node => (
          <div
            key={node.id}
            onClick={() => handleNodeClick(node.id)}
            className={`absolute cursor-pointer transition-all ${
              selectedNode === node.id
                ? 'ring-2 ring-blue-500 shadow-lg scale-105'
                : 'hover:shadow-md'
            }`}
            style={{
              left: `${node.x}px`,
              top: `${node.y}px`,
              width: '200px',
            }}
          >
            <div className="p-3 bg-white dark:bg-gray-800 border dark:border-gray-700 rounded-lg">
              <div className="flex items-start gap-2 mb-2">
                <div className={`w-2 h-2 rounded-full mt-1 flex-shrink-0 ${getStatusColor(node.task.status)}`} />
                <div className="flex-1 min-w-0">
                  <div className="text-xs font-mono text-gray-500 dark:text-gray-400">
                    {node.task.taskId}
                  </div>
                  <div className="text-sm font-medium truncate" title={node.task.title}>
                    {node.task.title}
                  </div>
                </div>
              </div>

              <div className="flex items-center justify-between text-xs">
                <span className={`font-medium ${getPriorityColor(node.task.priority)}`}>
                  P{node.task.priority}
                </span>
                {(node.dependencies.length > 0 || node.dependents.length > 0) && (
                  <div className="flex items-center gap-1 text-gray-500 dark:text-gray-400">
                    {node.dependencies.length > 0 && (
                      <span title="Blocked by">🔴 {node.dependencies.length}</span>
                    )}
                    {node.dependents.length > 0 && (
                      <span title="Blocks">🔵 {node.dependents.length}</span>
                    )}
                  </div>
                )}
              </div>
            </div>
          </div>
        ))}

        {nodes.length === 0 && (
          <div className="absolute inset-0 flex items-center justify-center text-gray-500 dark:text-gray-400">
            No tasks to display
          </div>
        )}
      </div>

      {/* Legend */}
      <div className="flex flex-wrap gap-4 text-xs text-gray-600 dark:text-gray-400 p-3 bg-gray-50 dark:bg-gray-800 rounded">
        <div className="flex items-center gap-2">
          <div className="w-3 h-3 rounded-full bg-gray-400" />
          <span>Backlog</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-3 h-3 rounded-full bg-yellow-500" />
          <span>In Progress</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-3 h-3 rounded-full bg-blue-500" />
          <span>Review</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-3 h-3 rounded-full bg-green-500" />
          <span>Done</span>
        </div>
        <div className="flex items-center gap-2">
          <span>🔴 Blocked by</span>
        </div>
        <div className="flex items-center gap-2">
          <span>🔵 Blocks</span>
        </div>
      </div>
    </div>
  );
};
