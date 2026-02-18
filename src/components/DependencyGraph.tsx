'use client';

import { useEffect, useRef, useState } from 'react';
import { Task, TaskDependency } from '@/types/task';
import { AlertTriangle, GitBranch } from 'lucide-react';

interface DependencyGraphProps {
  tasks: Task[];
  dependencies: TaskDependency[];
  onTaskClick?: (taskId: string) => void;
}

interface Node {
  id: string;
  taskId: string;
  title: string;
  status: string;
  x: number;
  y: number;
  level: number;
}

interface Edge {
  from: string;
  to: string;
  type: string;
}

/**
 * Dependency Graph Visualization Component
 * Displays task dependencies in a directed acyclic graph (DAG)
 */
export const DependencyGraph = ({ tasks, dependencies, onTaskClick }: DependencyGraphProps) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [nodes, setNodes] = useState<Node[]>([]);
  const [edges, setEdges] = useState<Edge[]>([]);
  const [hoveredNode, setHoveredNode] = useState<string | null>(null);
  const [selectedNode, setSelectedNode] = useState<string | null>(null);

  useEffect(() => {
    // Build graph structure
    const taskMap = new Map(tasks.map(t => [t.id, t]));
    const graphNodes: Node[] = [];
    const graphEdges: Edge[] = [];

    // Calculate node levels (topological sort)
    const levels = new Map<string, number>();
    const visited = new Set<string>();

    const calculateLevel = (taskId: string): number => {
      if (levels.has(taskId)) return levels.get(taskId)!;
      if (visited.has(taskId)) return 0; // Cycle detection

      visited.add(taskId);

      // Find dependencies
      const deps = dependencies.filter(d => d.taskId === taskId);
      if (deps.length === 0) {
        levels.set(taskId, 0);
        return 0;
      }

      const maxDepLevel = Math.max(
        ...deps.map(d => calculateLevel(d.dependsOnTaskId))
      );
      const level = maxDepLevel + 1;
      levels.set(taskId, level);
      return level;
    };

    // Calculate levels for all tasks
    tasks.forEach(task => calculateLevel(task.id));

    // Group tasks by level
    const levelGroups = new Map<number, string[]>();
    levels.forEach((level, taskId) => {
      if (!levelGroups.has(level)) {
        levelGroups.set(level, []);
      }
      levelGroups.get(level)!.push(taskId);
    });

    // Position nodes
    const nodeWidth = 180;
    const nodeHeight = 60;
    const horizontalSpacing = 220;
    const verticalSpacing = 100;
    const maxLevel = Math.max(...Array.from(levels.values()), 0);

    levels.forEach((level, taskId) => {
      const task = taskMap.get(taskId);
      if (!task) return;

      const tasksAtLevel = levelGroups.get(level) || [];
      const indexInLevel = tasksAtLevel.indexOf(taskId);
      const totalAtLevel = tasksAtLevel.length;

      // Center tasks at each level
      const y = level * verticalSpacing + 50;
      const x = (indexInLevel - (totalAtLevel - 1) / 2) * horizontalSpacing + 400;

      graphNodes.push({
        id: task.id,
        taskId: task.taskId,
        title: task.title,
        status: task.status,
        x,
        y,
        level,
      });
    });

    // Create edges
    dependencies.forEach(dep => {
      graphEdges.push({
        from: dep.dependsOnTaskId,
        to: dep.taskId,
        type: dep.dependencyType,
      });
    });

    setNodes(graphNodes);
    setEdges(graphEdges);
  }, [tasks, dependencies]);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Set canvas size
    canvas.width = canvas.offsetWidth;
    canvas.height = canvas.offsetHeight;

    // Clear canvas
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    // Draw edges
    edges.forEach(edge => {
      const fromNode = nodes.find(n => n.id === edge.from);
      const toNode = nodes.find(n => n.id === edge.to);

      if (!fromNode || !toNode) return;

      ctx.beginPath();
      ctx.moveTo(fromNode.x, fromNode.y + 30);
      ctx.lineTo(toNode.x, toNode.y - 30);

      // Style based on dependency type
      if (edge.type === 'blocks' || edge.type === 'blocked-by') {
        ctx.strokeStyle = '#ef4444'; // Red for blocking
        ctx.lineWidth = 2;
      } else {
        ctx.strokeStyle = '#94a3b8'; // Gray for related
        ctx.lineWidth = 1;
      }

      ctx.stroke();

      // Draw arrowhead
      const angle = Math.atan2(toNode.y - fromNode.y, toNode.x - fromNode.x);
      const arrowSize = 8;
      ctx.beginPath();
      ctx.moveTo(toNode.x, toNode.y - 30);
      ctx.lineTo(
        toNode.x - arrowSize * Math.cos(angle - Math.PI / 6),
        toNode.y - 30 - arrowSize * Math.sin(angle - Math.PI / 6)
      );
      ctx.lineTo(
        toNode.x - arrowSize * Math.cos(angle + Math.PI / 6),
        toNode.y - 30 - arrowSize * Math.sin(angle + Math.PI / 6)
      );
      ctx.closePath();
      ctx.fillStyle = ctx.strokeStyle;
      ctx.fill();
    });

    // Draw nodes
    nodes.forEach(node => {
      const isHovered = hoveredNode === node.id;
      const isSelected = selectedNode === node.id;

      // Node background
      ctx.fillStyle = isSelected
        ? '#3b82f6'
        : isHovered
        ? '#e0f2fe'
        : '#ffffff';
      ctx.strokeStyle = isSelected ? '#2563eb' : '#cbd5e1';
      ctx.lineWidth = isSelected ? 3 : 1;

      const nodeWidth = 160;
      const nodeHeight = 50;
      const radius = 6;

      ctx.beginPath();
      ctx.roundRect(
        node.x - nodeWidth / 2,
        node.y - nodeHeight / 2,
        nodeWidth,
        nodeHeight,
        radius
      );
      ctx.fill();
      ctx.stroke();

      // Task ID
      ctx.fillStyle = isSelected ? '#ffffff' : '#64748b';
      ctx.font = 'bold 10px sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText(node.taskId, node.x, node.y - 12);

      // Task title (truncated)
      ctx.fillStyle = isSelected ? '#ffffff' : '#1e293b';
      ctx.font = '12px sans-serif';
      const maxWidth = nodeWidth - 20;
      let title = node.title;
      if (ctx.measureText(title).width > maxWidth) {
        while (ctx.measureText(title + '...').width > maxWidth && title.length > 0) {
          title = title.slice(0, -1);
        }
        title += '...';
      }
      ctx.fillText(title, node.x, node.y + 5);

      // Status indicator
      const statusColors: Record<string, string> = {
        backlog: '#94a3b8',
        'in-progress': '#3b82f6',
        review: '#f59e0b',
        done: '#10b981',
      };
      ctx.fillStyle = statusColors[node.status] || '#94a3b8';
      ctx.beginPath();
      ctx.arc(node.x, node.y + 18, 3, 0, 2 * Math.PI);
      ctx.fill();
    });
  }, [nodes, edges, hoveredNode, selectedNode]);

  const handleCanvasClick = (e: React.MouseEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const rect = canvas.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;

    const nodeWidth = 160;
    const nodeHeight = 50;

    const clickedNode = nodes.find(
      node =>
        x >= node.x - nodeWidth / 2 &&
        x <= node.x + nodeWidth / 2 &&
        y >= node.y - nodeHeight / 2 &&
        y <= node.y + nodeHeight / 2
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

    const nodeWidth = 160;
    const nodeHeight = 50;

    const hoveredNode = nodes.find(
      node =>
        x >= node.x - nodeWidth / 2 &&
        x <= node.x + nodeWidth / 2 &&
        y >= node.y - nodeHeight / 2 &&
        y <= node.y + nodeHeight / 2
    );

    setHoveredNode(hoveredNode?.id || null);
    canvas.style.cursor = hoveredNode ? 'pointer' : 'default';
  };

  if (dependencies.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center h-64 text-gray-400 dark:text-gray-500">
        <GitBranch size={48} className="mb-4" />
        <p className="text-sm">No dependencies defined</p>
        <p className="text-xs mt-1">Add dependencies to visualize task relationships</p>
      </div>
    );
  }

  return (
    <div className="w-full h-full relative">
      <div className="absolute top-4 right-4 flex items-center gap-4 text-xs text-gray-600 dark:text-gray-400">
        <div className="flex items-center gap-2">
          <div className="w-4 h-0.5 bg-red-500"></div>
          <span>Blocks/Blocked</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-4 h-0.5 bg-gray-400"></div>
          <span>Related</span>
        </div>
      </div>
      <canvas
        ref={canvasRef}
        onClick={handleCanvasClick}
        onMouseMove={handleCanvasMouseMove}
        className="w-full h-full"
        style={{ minHeight: '400px' }}
      />
    </div>
  );
};
