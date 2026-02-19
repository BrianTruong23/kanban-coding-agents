'use client';

import { useEffect, useRef, useState } from 'react';
import { Task, TaskDependency } from '@/types/task';
import { ArrowRight, AlertCircle } from 'lucide-react';

interface DependencyGraphProps {
  tasks: Task[];
  onTaskClick?: (task: Task) => void;
}

interface GraphNode {
  task: Task;
  x: number;
  y: number;
  level: number;
}

interface GraphEdge {
  from: Task;
  to: Task;
  type: 'blocks' | 'blocked-by' | 'relates-to';
}

export const DependencyGraph = ({ tasks, onTaskClick }: DependencyGraphProps) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const [hoveredTask, setHoveredTask] = useState<Task | null>(null);
  const [nodes, setNodes] = useState<GraphNode[]>([]);
  const [edges, setEdges] = useState<GraphEdge[]>([]);

  useEffect(() => {
    // Build graph structure
    const tasksWithDeps = tasks.filter((t) => t.dependencies && t.dependencies.length > 0);
    const graphEdges: GraphEdge[] = [];

    tasksWithDeps.forEach((task) => {
      task.dependencies?.forEach((dep) => {
        const dependentTask = tasks.find((t) => t.id === dep.taskId);
        if (dependentTask) {
          graphEdges.push({
            from: dep.type === 'blocks' ? task : dependentTask,
            to: dep.type === 'blocks' ? dependentTask : task,
            type: dep.type,
          });
        }
      });
    });

    setEdges(graphEdges);

    // Organize nodes by dependency levels
    const taskLevels = new Map<string, number>();
    const visited = new Set<string>();

    const calculateLevel = (task: Task, level: number = 0): number => {
      if (visited.has(task.id)) {
        return taskLevels.get(task.id) || 0;
      }

      visited.add(task.id);
      const deps = task.dependencies || [];
      let maxLevel = level;

      deps.forEach((dep) => {
        const depTask = tasks.find((t) => t.id === dep.taskId);
        if (depTask) {
          const depLevel = calculateLevel(depTask, level + 1);
          maxLevel = Math.max(maxLevel, depLevel + 1);
        }
      });

      taskLevels.set(task.id, maxLevel);
      return maxLevel;
    };

    // Calculate levels for all tasks with dependencies
    const allRelevantTasks = new Set<Task>();
    graphEdges.forEach((edge) => {
      allRelevantTasks.add(edge.from);
      allRelevantTasks.add(edge.to);
    });

    allRelevantTasks.forEach((task) => calculateLevel(task));

    // Position nodes
    const levelGroups = new Map<number, Task[]>();
    allRelevantTasks.forEach((task) => {
      const level = taskLevels.get(task.id) || 0;
      if (!levelGroups.has(level)) {
        levelGroups.set(level, []);
      }
      levelGroups.get(level)!.push(task);
    });

    const nodeWidth = 200;
    const nodeHeight = 60;
    const levelSpacing = 250;
    const nodeSpacing = 100;

    const graphNodes: GraphNode[] = [];
    levelGroups.forEach((tasksInLevel, level) => {
      const x = level * levelSpacing + 100;
      tasksInLevel.forEach((task, index) => {
        const y = index * (nodeHeight + nodeSpacing) + 100;
        graphNodes.push({
          task,
          x,
          y,
          level,
        });
      });
    });

    setNodes(graphNodes);
  }, [tasks]);

  useEffect(() => {
    const canvas = canvasRef.current;
    const container = containerRef.current;
    if (!canvas || !container) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Set canvas size
    const width = container.clientWidth;
    const height = Math.max(container.clientHeight, nodes.length * 150);
    canvas.width = width;
    canvas.height = height;

    // Clear canvas
    ctx.clearRect(0, 0, width, height);

    // Draw edges
    edges.forEach((edge) => {
      const fromNode = nodes.find((n) => n.task.id === edge.from.id);
      const toNode = nodes.find((n) => n.task.id === edge.to.id);
      if (!fromNode || !toNode) return;

      const fromX = fromNode.x + 200;
      const fromY = fromNode.y + 30;
      const toX = toNode.x;
      const toY = toNode.y + 30;

      ctx.beginPath();
      ctx.moveTo(fromX, fromY);

      // Bezier curve for better visualization
      const controlX = (fromX + toX) / 2;
      ctx.bezierCurveTo(controlX, fromY, controlX, toY, toX, toY);

      if (edge.type === 'blocks') {
        ctx.strokeStyle = '#ef4444'; // red
        ctx.lineWidth = 2;
      } else if (edge.type === 'blocked-by') {
        ctx.strokeStyle = '#f59e0b'; // orange
        ctx.lineWidth = 2;
      } else {
        ctx.strokeStyle = '#6b7280'; // gray
        ctx.lineWidth = 1;
        ctx.setLineDash([5, 5]);
      }

      ctx.stroke();
      ctx.setLineDash([]);

      // Draw arrow
      const angle = Math.atan2(toY - fromY, toX - controlX);
      const arrowLength = 10;
      ctx.beginPath();
      ctx.moveTo(toX, toY);
      ctx.lineTo(
        toX - arrowLength * Math.cos(angle - Math.PI / 6),
        toY - arrowLength * Math.sin(angle - Math.PI / 6)
      );
      ctx.lineTo(
        toX - arrowLength * Math.cos(angle + Math.PI / 6),
        toY - arrowLength * Math.sin(angle + Math.PI / 6)
      );
      ctx.closePath();
      ctx.fillStyle = ctx.strokeStyle;
      ctx.fill();
    });
  }, [nodes, edges]);

  const getStatusColor = (status: string) => {
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

  if (nodes.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center h-64 text-gray-500 dark:text-gray-400">
        <AlertCircle size={48} className="mb-4 opacity-50" />
        <p className="text-lg font-medium">No Dependencies Found</p>
        <p className="text-sm mt-2">Tasks with dependencies will appear here</p>
      </div>
    );
  }

  return (
    <div className="relative w-full h-full" ref={containerRef}>
      {/* Legend */}
      <div className="absolute top-4 right-4 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg p-3 shadow-lg z-10">
        <h4 className="text-xs font-semibold text-gray-700 dark:text-gray-300 mb-2">
          Dependency Types
        </h4>
        <div className="space-y-1 text-xs">
          <div className="flex items-center gap-2">
            <div className="w-8 h-0.5 bg-red-500"></div>
            <span className="text-gray-600 dark:text-gray-400">Blocks</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-8 h-0.5 bg-orange-500"></div>
            <span className="text-gray-600 dark:text-gray-400">Blocked By</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-8 h-0.5 bg-gray-400 border-dashed border-t"></div>
            <span className="text-gray-600 dark:text-gray-400">Related To</span>
          </div>
        </div>
      </div>

      {/* Canvas for edges */}
      <canvas ref={canvasRef} className="absolute inset-0 pointer-events-none" />

      {/* Nodes */}
      <div className="relative">
        {nodes.map((node) => (
          <div
            key={node.task.id}
            className={`absolute w-[200px] border-2 rounded-lg p-3 cursor-pointer transition-all hover:shadow-lg hover:scale-105 ${getStatusColor(
              node.task.status
            )}`}
            style={{
              left: `${node.x}px`,
              top: `${node.y}px`,
            }}
            onClick={() => onTaskClick?.(node.task)}
            onMouseEnter={() => setHoveredTask(node.task)}
            onMouseLeave={() => setHoveredTask(null)}
          >
            <div className="text-xs font-mono text-gray-600 dark:text-gray-400 mb-1">
              {node.task.taskId}
            </div>
            <div className="text-sm font-semibold text-gray-900 dark:text-white truncate">
              {node.task.title}
            </div>
            <div className="text-xs text-gray-500 dark:text-gray-400 mt-1 capitalize">
              {node.task.status.replace('-', ' ')}
            </div>
          </div>
        ))}
      </div>

      {/* Hover tooltip */}
      {hoveredTask && (
        <div className="absolute bottom-4 left-4 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg p-4 shadow-xl max-w-md z-10">
          <div className="flex items-center gap-2 mb-2">
            <span className="text-xs font-mono text-gray-500 dark:text-gray-400">
              {hoveredTask.taskId}
            </span>
            <span
              className={`text-xs px-2 py-0.5 rounded ${
                hoveredTask.type === 'epic'
                  ? 'bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-300'
                  : hoveredTask.type === 'ticket'
                  ? 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300'
                  : 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300'
              }`}
            >
              {hoveredTask.type || 'task'}
            </span>
          </div>
          <h4 className="font-semibold text-gray-900 dark:text-white mb-2">
            {hoveredTask.title}
          </h4>
          {hoveredTask.description && (
            <p className="text-sm text-gray-600 dark:text-gray-400 line-clamp-3">
              {hoveredTask.description}
            </p>
          )}
          {hoveredTask.dependencies && hoveredTask.dependencies.length > 0 && (
            <div className="mt-3 pt-3 border-t border-gray-200 dark:border-gray-700">
              <div className="text-xs font-semibold text-gray-500 dark:text-gray-400 mb-1">
                Dependencies:
              </div>
              {hoveredTask.dependencies.map((dep, idx) => {
                const depTask = tasks.find((t) => t.id === dep.taskId);
                return (
                  <div key={idx} className="text-xs text-gray-600 dark:text-gray-400 flex items-center gap-1">
                    <ArrowRight size={12} />
                    {dep.type}: {depTask?.taskId || 'Unknown'}
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}
    </div>
  );
};
