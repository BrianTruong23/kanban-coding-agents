'use client';

import { useState, useMemo } from 'react';
import { TaskBreakdown, TaskDependency } from '@/types/breakdown';
import { ArrowRight, Circle, Square, Triangle, AlertCircle } from 'lucide-react';

interface DependencyGraphProps {
  tasks: TaskBreakdown[];
  dependencies: TaskDependency[];
  onTaskClick?: (taskId: string) => void;
}

interface GraphNode {
  task: TaskBreakdown;
  x: number;
  y: number;
  level: number;
}

interface GraphEdge {
  from: GraphNode;
  to: GraphNode;
  dependency: TaskDependency;
}

/**
 * Dependency Graph Visualization Component
 * Displays tasks and their dependencies in a hierarchical graph
 */
export const DependencyGraph = ({ tasks, dependencies, onTaskClick }: DependencyGraphProps) => {
  const [selectedTask, setSelectedTask] = useState<string | null>(null);
  const [viewMode, setViewMode] = useState<'hierarchy' | 'network'>('hierarchy');

  // Build graph structure
  const graph = useMemo(() => {
    // Group tasks by type and level
    const epics = tasks.filter(t => t.taskType === 'epic');
    const tickets = tasks.filter(t => t.taskType === 'ticket');
    const subtasks = tasks.filter(t => t.taskType === 'subtask');

    // Calculate positions for hierarchical layout
    const nodes: GraphNode[] = [];
    const nodeWidth = 200;
    const nodeHeight = 80;
    const levelGap = 150;
    const nodeGap = 40;

    // Position epics (level 0)
    epics.forEach((task, idx) => {
      nodes.push({
        task,
        x: idx * (nodeWidth + nodeGap),
        y: 0,
        level: 0
      });
    });

    // Position tickets (level 1)
    tickets.forEach((task, idx) => {
      nodes.push({
        task,
        x: idx * (nodeWidth + nodeGap),
        y: levelGap,
        level: 1
      });
    });

    // Position subtasks (level 2)
    subtasks.forEach((task, idx) => {
      nodes.push({
        task,
        x: idx * (nodeWidth + nodeGap),
        y: levelGap * 2,
        level: 2
      });
    });

    // Create edges
    const edges: GraphEdge[] = [];
    dependencies.forEach(dep => {
      const fromNode = nodes.find(n => n.task.id === dep.fromTaskId);
      const toNode = nodes.find(n => n.task.id === dep.toTaskId);

      if (fromNode && toNode) {
        edges.push({
          from: fromNode,
          to: toNode,
          dependency: dep
        });
      }
    });

    return { nodes, edges };
  }, [tasks, dependencies]);

  const handleTaskClick = (taskId: string) => {
    setSelectedTask(taskId);
    onTaskClick?.(taskId);
  };

  const getTaskIcon = (type: 'epic' | 'ticket' | 'subtask') => {
    switch (type) {
      case 'epic':
        return <Triangle className="w-4 h-4" fill="currentColor" />;
      case 'ticket':
        return <Square className="w-4 h-4" fill="currentColor" />;
      case 'subtask':
        return <Circle className="w-4 h-4" fill="currentColor" />;
    }
  };

  const getRiskColor = (task: TaskBreakdown) => {
    const maxRisk = task.riskFlags.reduce((max, flag) => {
      const levels = { low: 1, medium: 2, high: 3, critical: 4 };
      return Math.max(max, levels[flag.level]);
    }, 0);

    if (maxRisk === 4) return 'border-red-500 bg-red-50 dark:bg-red-900/20';
    if (maxRisk === 3) return 'border-orange-500 bg-orange-50 dark:bg-orange-900/20';
    if (maxRisk === 2) return 'border-yellow-500 bg-yellow-50 dark:bg-yellow-900/20';
    return 'border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800';
  };

  // Calculate view box dimensions
  const viewBoxWidth = Math.max(...graph.nodes.map(n => n.x)) + 220;
  const viewBoxHeight = Math.max(...graph.nodes.map(n => n.y)) + 120;

  return (
    <div className="flex flex-col h-full">
      {/* Toolbar */}
      <div className="flex items-center justify-between mb-4 p-3 bg-gray-50 dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700">
        <div className="flex items-center gap-4">
          <h3 className="text-sm font-semibold text-gray-700 dark:text-gray-300">
            Dependency Graph
          </h3>
          <div className="flex items-center gap-2 text-xs text-gray-500 dark:text-gray-400">
            <span>{tasks.length} tasks</span>
            <span>•</span>
            <span>{dependencies.length} dependencies</span>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => setViewMode('hierarchy')}
            className={`px-3 py-1 rounded text-xs font-medium transition-colors ${
              viewMode === 'hierarchy'
                ? 'bg-black dark:bg-white text-white dark:text-black'
                : 'bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300'
            }`}
          >
            Hierarchy
          </button>
          <button
            onClick={() => setViewMode('network')}
            className={`px-3 py-1 rounded text-xs font-medium transition-colors ${
              viewMode === 'network'
                ? 'bg-black dark:bg-white text-white dark:text-black'
                : 'bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300'
            }`}
          >
            Network
          </button>
        </div>
      </div>

      {/* Graph */}
      <div className="flex-1 overflow-auto bg-gray-50 dark:bg-gray-900 rounded-lg border border-gray-200 dark:border-gray-700 p-4">
        {tasks.length === 0 ? (
          <div className="flex items-center justify-center h-full text-gray-400 dark:text-gray-500 text-sm">
            No tasks to display
          </div>
        ) : (
          <svg
            width="100%"
            height="100%"
            viewBox={`0 0 ${viewBoxWidth} ${viewBoxHeight}`}
            className="min-h-[400px]"
          >
            {/* Draw edges first (underneath nodes) */}
            {graph.edges.map((edge, idx) => {
              const fromX = edge.from.x + 100; // Center of node
              const fromY = edge.from.y + 40;
              const toX = edge.to.x + 100;
              const toY = edge.to.y + 40;

              const isBlocking = edge.dependency.type === 'blocks';
              const strokeColor = isBlocking ? '#ef4444' : '#6b7280';
              const strokeWidth = isBlocking ? 2 : 1;

              return (
                <g key={idx}>
                  <line
                    x1={fromX}
                    y1={fromY}
                    x2={toX}
                    y2={toY}
                    stroke={strokeColor}
                    strokeWidth={strokeWidth}
                    strokeDasharray={edge.dependency.type === 'relates-to' ? '5,5' : undefined}
                    markerEnd="url(#arrowhead)"
                  />
                </g>
              );
            })}

            {/* Arrow marker definition */}
            <defs>
              <marker
                id="arrowhead"
                markerWidth="10"
                markerHeight="10"
                refX="9"
                refY="3"
                orient="auto"
              >
                <polygon points="0 0, 10 3, 0 6" fill="#6b7280" />
              </marker>
            </defs>

            {/* Draw nodes */}
            {graph.nodes.map((node) => {
              const isSelected = selectedTask === node.task.id;
              const hasRisks = node.task.riskFlags.length > 0;

              return (
                <g
                  key={node.task.id}
                  onClick={() => handleTaskClick(node.task.id)}
                  className="cursor-pointer"
                >
                  {/* Node background */}
                  <rect
                    x={node.x}
                    y={node.y}
                    width={200}
                    height={80}
                    rx={8}
                    className={`${getRiskColor(node.task)} transition-all`}
                    stroke={isSelected ? '#000' : undefined}
                    strokeWidth={isSelected ? 3 : 1}
                  />

                  {/* Task icon */}
                  <g transform={`translate(${node.x + 10}, ${node.y + 10})`}>
                    {node.task.taskType === 'epic' && (
                      <polygon points="8,2 14,14 2,14" className="fill-purple-500" />
                    )}
                    {node.task.taskType === 'ticket' && (
                      <rect x={2} y={2} width={12} height={12} className="fill-blue-500" />
                    )}
                    {node.task.taskType === 'subtask' && (
                      <circle cx={8} cy={8} r={6} className="fill-green-500" />
                    )}
                  </g>

                  {/* Task title */}
                  <text
                    x={node.x + 30}
                    y={node.y + 18}
                    className="text-xs font-semibold fill-gray-900 dark:fill-white"
                  >
                    {node.task.title.length > 25
                      ? node.task.title.substring(0, 25) + '...'
                      : node.task.title}
                  </text>

                  {/* Estimated hours */}
                  <text
                    x={node.x + 10}
                    y={node.y + 38}
                    className="text-[10px] fill-gray-600 dark:fill-gray-400"
                  >
                    {node.task.estimatedHours}h
                  </text>

                  {/* Skills */}
                  <text
                    x={node.x + 10}
                    y={node.y + 52}
                    className="text-[9px] fill-gray-500 dark:fill-gray-500"
                  >
                    {node.task.skillsRequired.slice(0, 2).join(', ')}
                    {node.task.skillsRequired.length > 2 && '...'}
                  </text>

                  {/* Risk indicator */}
                  {hasRisks && (
                    <g transform={`translate(${node.x + 175}, ${node.y + 10})`}>
                      <circle cx={8} cy={8} r={8} className="fill-red-500" />
                      <text x={8} y={12} className="text-[10px] fill-white text-anchor-middle">
                        !
                      </text>
                    </g>
                  )}

                  {/* DoD progress */}
                  {node.task.definitionOfDone.length > 0 && (
                    <text
                      x={node.x + 10}
                      y={node.y + 68}
                      className="text-[9px] fill-gray-500 dark:fill-gray-500"
                    >
                      DoD: {node.task.definitionOfDone.filter(d => d.completed).length}/
                      {node.task.definitionOfDone.length}
                    </text>
                  )}
                </g>
              );
            })}
          </svg>
        )}
      </div>

      {/* Legend */}
      <div className="mt-4 p-3 bg-gray-50 dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700">
        <div className="flex items-center gap-6 text-xs">
          <div className="flex items-center gap-2">
            <Triangle className="w-3 h-3 fill-purple-500 text-purple-500" />
            <span className="text-gray-600 dark:text-gray-400">Epic</span>
          </div>
          <div className="flex items-center gap-2">
            <Square className="w-3 h-3 fill-blue-500 text-blue-500" />
            <span className="text-gray-600 dark:text-gray-400">Ticket</span>
          </div>
          <div className="flex items-center gap-2">
            <Circle className="w-3 h-3 fill-green-500 text-green-500" />
            <span className="text-gray-600 dark:text-gray-400">Subtask</span>
          </div>
          <div className="flex items-center gap-2">
            <ArrowRight className="w-3 h-3 text-gray-600" />
            <span className="text-gray-600 dark:text-gray-400">Requires</span>
          </div>
          <div className="flex items-center gap-2">
            <AlertCircle className="w-3 h-3 text-red-500" />
            <span className="text-gray-600 dark:text-gray-400">Has Risks</span>
          </div>
        </div>
      </div>
    </div>
  );
};
