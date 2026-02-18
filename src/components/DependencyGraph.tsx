'use client';

import { Task, TaskDependency } from '@/types/task';
import { useEffect, useRef, useState } from 'react';
import { GitBranch, AlertCircle, CheckCircle2, Circle } from 'lucide-react';

interface DependencyGraphProps {
  tasks: Task[];
  dependencies: TaskDependency[];
  onTaskClick?: (taskId: string) => void;
}

interface GraphNode {
  id: string;
  task: Task;
  x: number;
  y: number;
  level: number;
  dependents: string[];
  dependencies: string[];
}

export const DependencyGraph = ({ tasks, dependencies, onTaskClick }: DependencyGraphProps) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [nodes, setNodes] = useState<GraphNode[]>([]);
  const [selectedNode, setSelectedNode] = useState<string | null>(null);
  const [hoveredNode, setHoveredNode] = useState<string | null>(null);

  useEffect(() => {
    // Build dependency graph
    const taskMap = new Map(tasks.map(t => [t.id, t]));
    const dependencyMap = new Map<string, string[]>();
    const dependentMap = new Map<string, string[]>();

    // Build adjacency lists
    dependencies.forEach(dep => {
      const deps = dependencyMap.get(dep.taskId) || [];
      deps.push(dep.dependsOnTaskId);
      dependencyMap.set(dep.taskId, deps);

      const dependents = dependentMap.get(dep.dependsOnTaskId) || [];
      dependents.push(dep.taskId);
      dependentMap.set(dep.dependsOnTaskId, dependents);
    });

    // Calculate levels using topological sort
    const levels = new Map<string, number>();
    const visited = new Set<string>();

    const calculateLevel = (taskId: string): number => {
      if (levels.has(taskId)) return levels.get(taskId)!;
      if (visited.has(taskId)) return 0; // Circular dependency

      visited.add(taskId);
      const deps = dependencyMap.get(taskId) || [];
      const maxDepLevel = deps.length > 0
        ? Math.max(...deps.map(calculateLevel))
        : -1;
      const level = maxDepLevel + 1;
      levels.set(taskId, level);
      return level;
    };

    tasks.forEach(task => calculateLevel(task.id));

    // Group tasks by level
    const levelGroups = new Map<number, string[]>();
    levels.forEach((level, taskId) => {
      const group = levelGroups.get(level) || [];
      group.push(taskId);
      levelGroups.set(level, group);
    });

    // Calculate positions
    const nodeWidth = 180;
    const nodeHeight = 80;
    const horizontalGap = 100;
    const verticalGap = 120;
    const maxLevel = Math.max(...Array.from(levels.values()));

    const graphNodes: GraphNode[] = [];
    tasks.forEach(task => {
      const level = levels.get(task.id) || 0;
      const levelTasks = levelGroups.get(level) || [];
      const indexInLevel = levelTasks.indexOf(task.id);
      const levelHeight = levelTasks.length * (nodeHeight + verticalGap);

      graphNodes.push({
        id: task.id,
        task,
        x: level * (nodeWidth + horizontalGap) + 50,
        y: indexInLevel * (nodeHeight + verticalGap) + 50 + (indexInLevel * 20),
        level,
        dependents: dependentMap.get(task.id) || [],
        dependencies: dependencyMap.get(task.id) || [],
      });
    });

    setNodes(graphNodes);
  }, [tasks, dependencies]);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Set canvas size
    const maxX = Math.max(...nodes.map(n => n.x)) + 250;
    const maxY = Math.max(...nodes.map(n => n.y)) + 150;
    canvas.width = Math.max(maxX, 800);
    canvas.height = Math.max(maxY, 600);

    // Clear canvas
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    // Draw dependencies (arrows)
    dependencies.forEach(dep => {
      const fromNode = nodes.find(n => n.id === dep.dependsOnTaskId);
      const toNode = nodes.find(n => n.id === dep.taskId);

      if (!fromNode || !toNode) return;

      const fromX = fromNode.x + 160;
      const fromY = fromNode.y + 40;
      const toX = toNode.x;
      const toY = toNode.y + 40;

      // Highlight if either node is selected
      const isHighlighted = selectedNode === fromNode.id || selectedNode === toNode.id;

      ctx.strokeStyle = isHighlighted ? '#3b82f6' : '#cbd5e1';
      ctx.lineWidth = isHighlighted ? 3 : 2;
      ctx.beginPath();
      ctx.moveTo(fromX, fromY);

      // Bezier curve for better visibility
      const ctrlX = fromX + (toX - fromX) / 2;
      ctx.bezierCurveTo(ctrlX, fromY, ctrlX, toY, toX, toY);
      ctx.stroke();

      // Draw arrow head
      const arrowSize = 8;
      ctx.beginPath();
      ctx.moveTo(toX, toY);
      ctx.lineTo(toX - arrowSize, toY - arrowSize / 2);
      ctx.lineTo(toX - arrowSize, toY + arrowSize / 2);
      ctx.closePath();
      ctx.fillStyle = isHighlighted ? '#3b82f6' : '#cbd5e1';
      ctx.fill();
    });

    // Draw nodes
    nodes.forEach(node => {
      const isSelected = selectedNode === node.id;
      const isHovered = hoveredNode === node.id;
      const isHighlighted = isSelected || isHovered;

      // Node background
      ctx.fillStyle = isHighlighted ? '#dbeafe' : '#ffffff';
      ctx.strokeStyle = isSelected ? '#3b82f6' : '#e2e8f0';
      ctx.lineWidth = isSelected ? 3 : 2;

      const radius = 8;
      const x = node.x;
      const y = node.y;
      const width = 160;
      const height = 70;

      // Rounded rectangle
      ctx.beginPath();
      ctx.moveTo(x + radius, y);
      ctx.lineTo(x + width - radius, y);
      ctx.quadraticCurveTo(x + width, y, x + width, y + radius);
      ctx.lineTo(x + width, y + height - radius);
      ctx.quadraticCurveTo(x + width, y + height, x + width - radius, y + height);
      ctx.lineTo(x + radius, y + height);
      ctx.quadraticCurveTo(x, y + height, x, y + height - radius);
      ctx.lineTo(x, y + radius);
      ctx.quadraticCurveTo(x, y, x + radius, y);
      ctx.closePath();
      ctx.fill();
      ctx.stroke();

      // Task ID
      ctx.fillStyle = '#64748b';
      ctx.font = 'bold 11px sans-serif';
      ctx.fillText(node.task.taskId, x + 8, y + 18);

      // Task title (truncated)
      ctx.fillStyle = '#0f172a';
      ctx.font = '12px sans-serif';
      const title = node.task.title.length > 20
        ? node.task.title.substring(0, 20) + '...'
        : node.task.title;
      ctx.fillText(title, x + 8, y + 35);

      // Status indicator
      const statusColors: Record<string, string> = {
        'backlog': '#94a3b8',
        'in-progress': '#3b82f6',
        'review': '#f59e0b',
        'done': '#10b981',
      };
      ctx.fillStyle = statusColors[node.task.status] || '#94a3b8';
      ctx.beginPath();
      ctx.arc(x + 8, y + 50, 4, 0, Math.PI * 2);
      ctx.fill();

      ctx.fillStyle = '#64748b';
      ctx.font = '10px sans-serif';
      ctx.fillText(node.task.status, x + 18, y + 54);

      // Priority indicator
      if (node.task.priority >= 4) {
        ctx.fillStyle = node.task.priority === 5 ? '#ef4444' : '#f59e0b';
        ctx.font = 'bold 10px sans-serif';
        ctx.fillText(`P${node.task.priority}`, x + width - 25, y + 18);
      }
    });
  }, [nodes, selectedNode, hoveredNode, dependencies]);

  const handleCanvasClick = (e: React.MouseEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const rect = canvas.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;

    // Check if click is on a node
    const clickedNode = nodes.find(
      n => x >= n.x && x <= n.x + 160 && y >= n.y && y <= n.y + 70
    );

    if (clickedNode) {
      setSelectedNode(clickedNode.id);
      onTaskClick?.(clickedNode.id);
    } else {
      setSelectedNode(null);
    }
  };

  const handleCanvasMouseMove = (e: React.MouseEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const rect = canvas.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;

    const hoveredNode = nodes.find(
      n => x >= n.x && x <= n.x + 160 && y >= n.y && y <= n.y + 70
    );

    setHoveredNode(hoveredNode?.id || null);
    canvas.style.cursor = hoveredNode ? 'pointer' : 'default';
  };

  if (tasks.length === 0) {
    return (
      <div className="p-8 text-center text-gray-500 dark:text-gray-400">
        <GitBranch size={48} className="mx-auto mb-4 opacity-50" />
        <p>No tasks to visualize</p>
      </div>
    );
  }

  const selectedTask = selectedNode ? tasks.find(t => t.id === selectedNode) : null;

  return (
    <div className="flex flex-col h-full">
      <div className="flex items-center justify-between mb-4 px-4 pt-4">
        <div className="flex items-center gap-2">
          <GitBranch size={20} className="text-gray-600 dark:text-gray-400" />
          <h3 className="text-lg font-bold text-gray-900 dark:text-white">Dependency Graph</h3>
        </div>
        <div className="flex items-center gap-4 text-xs text-gray-600 dark:text-gray-400">
          <div className="flex items-center gap-1">
            <Circle size={12} className="text-gray-400 fill-gray-400" />
            <span>Backlog</span>
          </div>
          <div className="flex items-center gap-1">
            <Circle size={12} className="text-blue-500 fill-blue-500" />
            <span>In Progress</span>
          </div>
          <div className="flex items-center gap-1">
            <Circle size={12} className="text-amber-500 fill-amber-500" />
            <span>Review</span>
          </div>
          <div className="flex items-center gap-1">
            <CheckCircle2 size={12} className="text-green-500" />
            <span>Done</span>
          </div>
        </div>
      </div>

      <div className="flex-1 overflow-auto bg-gray-50 dark:bg-gray-900 rounded-lg">
        <canvas
          ref={canvasRef}
          onClick={handleCanvasClick}
          onMouseMove={handleCanvasMouseMove}
          className="cursor-default"
        />
      </div>

      {selectedTask && (
        <div className="mt-4 p-4 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg">
          <h4 className="font-bold text-sm text-gray-900 dark:text-white mb-2">
            {selectedTask.taskId}: {selectedTask.title}
          </h4>
          <p className="text-xs text-gray-600 dark:text-gray-400 mb-3">
            {selectedTask.description}
          </p>
          <div className="flex items-center gap-4 text-xs">
            <div>
              <span className="text-gray-500 dark:text-gray-400">Status:</span>{' '}
              <span className="font-medium text-gray-900 dark:text-white">{selectedTask.status}</span>
            </div>
            <div>
              <span className="text-gray-500 dark:text-gray-400">Priority:</span>{' '}
              <span className="font-medium text-gray-900 dark:text-white">{selectedTask.priority}</span>
            </div>
            {selectedTask.estimatedHours && (
              <div>
                <span className="text-gray-500 dark:text-gray-400">Estimated:</span>{' '}
                <span className="font-medium text-gray-900 dark:text-white">
                  {selectedTask.estimatedHours}h
                </span>
              </div>
            )}
          </div>
          {selectedTask.riskFlags && selectedTask.riskFlags.length > 0 && (
            <div className="mt-3 flex items-start gap-2">
              <AlertCircle size={14} className="text-amber-500 mt-0.5" />
              <div className="flex flex-wrap gap-1">
                {selectedTask.riskFlags.map((flag, i) => (
                  <span
                    key={i}
                    className="px-2 py-0.5 bg-amber-100 dark:bg-amber-900/30 text-amber-700 dark:text-amber-400 rounded text-xs"
                  >
                    {flag}
                  </span>
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
};
