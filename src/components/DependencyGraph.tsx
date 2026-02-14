'use client';

import { useEffect, useRef, useState } from 'react';
import { BreakdownTask, TaskDependency } from '@/types/breakdown';
import { GitBranch, Maximize2, Minimize2 } from 'lucide-react';

interface DependencyGraphProps {
  tasks: BreakdownTask[];
  dependencies: TaskDependency[];
  onTaskClick?: (task: BreakdownTask) => void;
}

interface Node {
  id: string;
  task: BreakdownTask;
  x: number;
  y: number;
  level: number;
}

interface Edge {
  from: string;
  to: string;
  type: 'blocks' | 'related' | 'child-of';
}

export const DependencyGraph = ({ tasks, dependencies, onTaskClick }: DependencyGraphProps) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [nodes, setNodes] = useState<Node[]>([]);
  const [edges, setEdges] = useState<Edge[]>([]);
  const [hoveredNode, setHoveredNode] = useState<string | null>(null);
  const [isExpanded, setIsExpanded] = useState(false);

  useEffect(() => {
    // Build graph structure
    const nodeMap = new Map<string, Node>();
    const edgeList: Edge[] = [];

    // Create dependency map for level calculation
    const dependencyMap = new Map<string, Set<string>>();
    dependencies.forEach((dep) => {
      if (!dependencyMap.has(dep.dependsOn)) {
        dependencyMap.set(dep.dependsOn, new Set());
      }
      const task = tasks.find(t => {
        const matchingDep = t.dependencies.find(d => d.id === dep.id);
        return matchingDep !== undefined;
      });
      if (task) {
        dependencyMap.get(dep.dependsOn)?.add(task.id);
      }
    });

    // Calculate levels using topological sort
    const levels = new Map<string, number>();
    const calculateLevel = (taskId: string, visited = new Set<string>()): number => {
      if (levels.has(taskId)) return levels.get(taskId)!;
      if (visited.has(taskId)) return 0; // Circular dependency

      visited.add(taskId);

      const task = tasks.find((t) => t.id === taskId);
      if (!task || task.dependencies.length === 0) {
        levels.set(taskId, 0);
        return 0;
      }

      const maxDepLevel = Math.max(
        ...task.dependencies.map((dep) => calculateLevel(dep.dependsOn, visited))
      );

      const level = maxDepLevel + 1;
      levels.set(taskId, level);
      return level;
    };

    tasks.forEach((task) => calculateLevel(task.id));

    // Group tasks by level
    const levelGroups = new Map<number, BreakdownTask[]>();
    tasks.forEach((task) => {
      const level = levels.get(task.id) || 0;
      if (!levelGroups.has(level)) {
        levelGroups.set(level, []);
      }
      levelGroups.get(level)?.push(task);
    });

    // Position nodes
    const nodeWidth = 200;
    const nodeHeight = 80;
    const horizontalSpacing = 250;
    const verticalSpacing = 120;
    const maxLevels = Math.max(...Array.from(levels.values()), 0) + 1;

    tasks.forEach((task) => {
      const level = levels.get(task.id) || 0;
      const tasksInLevel = levelGroups.get(level) || [];
      const indexInLevel = tasksInLevel.indexOf(task);

      const x = 50 + level * horizontalSpacing;
      const y = 50 + indexInLevel * verticalSpacing;

      nodeMap.set(task.id, {
        id: task.id,
        task,
        x,
        y,
        level,
      });
    });

    // Build edges
    dependencies.forEach((dep) => {
      const task = tasks.find(t => t.dependencies.some(d => d.id === dep.id));
      if (task) {
        edgeList.push({
          from: dep.dependsOn,
          to: task.id,
          type: dep.type,
        });
      }
    });

    setNodes(Array.from(nodeMap.values()));
    setEdges(edgeList);
  }, [tasks, dependencies]);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Clear canvas
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    // Draw edges
    edges.forEach((edge) => {
      const fromNode = nodes.find((n) => n.id === edge.from);
      const toNode = nodes.find((n) => n.id === edge.to);

      if (!fromNode || !toNode) return;

      ctx.beginPath();
      ctx.moveTo(fromNode.x + 200, fromNode.y + 40);
      ctx.lineTo(toNode.x, toNode.y + 40);

      // Different colors for different edge types
      switch (edge.type) {
        case 'blocks':
          ctx.strokeStyle = '#ef4444'; // Red
          ctx.lineWidth = 2;
          break;
        case 'child-of':
          ctx.strokeStyle = '#3b82f6'; // Blue
          ctx.lineWidth = 2;
          break;
        case 'related':
          ctx.strokeStyle = '#94a3b8'; // Gray
          ctx.lineWidth = 1;
          ctx.setLineDash([5, 5]);
          break;
      }

      ctx.stroke();
      ctx.setLineDash([]);

      // Draw arrow
      const angle = Math.atan2(
        toNode.y + 40 - (fromNode.y + 40),
        toNode.x - (fromNode.x + 200)
      );
      const arrowLength = 10;

      ctx.beginPath();
      ctx.moveTo(toNode.x, toNode.y + 40);
      ctx.lineTo(
        toNode.x - arrowLength * Math.cos(angle - Math.PI / 6),
        toNode.y + 40 - arrowLength * Math.sin(angle - Math.PI / 6)
      );
      ctx.moveTo(toNode.x, toNode.y + 40);
      ctx.lineTo(
        toNode.x - arrowLength * Math.cos(angle + Math.PI / 6),
        toNode.y + 40 - arrowLength * Math.sin(angle + Math.PI / 6)
      );
      ctx.stroke();
    });
  }, [nodes, edges]);

  const handleNodeClick = (node: Node) => {
    if (onTaskClick) {
      onTaskClick(node.task);
    }
  };

  const getTypeColor = (type: string): string => {
    switch (type) {
      case 'epic':
        return 'bg-purple-500 dark:bg-purple-600';
      case 'ticket':
        return 'bg-blue-500 dark:bg-blue-600';
      case 'subtask':
        return 'bg-green-500 dark:bg-green-600';
      default:
        return 'bg-gray-500 dark:bg-gray-600';
    }
  };

  const getPriorityColor = (priority: number): string => {
    if (priority >= 5) return 'text-red-500';
    if (priority >= 4) return 'text-orange-500';
    if (priority >= 3) return 'text-yellow-500';
    return 'text-gray-400';
  };

  if (tasks.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center h-64 text-gray-400 dark:text-gray-500">
        <GitBranch size={48} className="mb-2" />
        <p>No tasks to visualize</p>
      </div>
    );
  }

  return (
    <div className={`relative ${isExpanded ? 'fixed inset-0 z-50 bg-white dark:bg-gray-900' : ''}`}>
      <div className="flex items-center justify-between mb-4 p-4">
        <div>
          <h3 className="text-lg font-bold text-gray-900 dark:text-white flex items-center gap-2">
            <GitBranch size={20} />
            Dependency Graph
          </h3>
          <div className="flex gap-4 mt-2 text-xs">
            <div className="flex items-center gap-2">
              <div className="w-8 h-0.5 bg-red-500"></div>
              <span className="text-gray-600 dark:text-gray-400">Blocks</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-8 h-0.5 bg-blue-500"></div>
              <span className="text-gray-600 dark:text-gray-400">Child-of</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-8 h-0.5 bg-gray-400" style={{ borderTop: '1px dashed' }}></div>
              <span className="text-gray-600 dark:text-gray-400">Related</span>
            </div>
          </div>
        </div>
        <button
          onClick={() => setIsExpanded(!isExpanded)}
          className="p-2 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg transition-colors"
          title={isExpanded ? 'Minimize' : 'Maximize'}
        >
          {isExpanded ? <Minimize2 size={20} /> : <Maximize2 size={20} />}
        </button>
      </div>

      <div className="relative overflow-auto" style={{ height: isExpanded ? 'calc(100vh - 100px)' : '400px' }}>
        <canvas
          ref={canvasRef}
          width={Math.max(1200, (Math.max(...nodes.map((n) => n.level)) + 1) * 250 + 100)}
          height={Math.max(600, nodes.length * 100)}
          className="absolute top-0 left-0"
        />
        <div className="relative">
          {nodes.map((node) => (
            <div
              key={node.id}
              className={`absolute cursor-pointer transition-all ${
                hoveredNode === node.id ? 'scale-105 z-10' : ''
              }`}
              style={{
                left: node.x,
                top: node.y,
                width: 200,
              }}
              onClick={() => handleNodeClick(node)}
              onMouseEnter={() => setHoveredNode(node.id)}
              onMouseLeave={() => setHoveredNode(null)}
            >
              <div className={`p-3 rounded-lg border-2 bg-white dark:bg-gray-800 shadow-lg ${
                hoveredNode === node.id
                  ? 'border-blue-500 dark:border-blue-400'
                  : 'border-gray-200 dark:border-gray-700'
              }`}>
                <div className="flex items-start justify-between mb-1">
                  <span className={`text-xs font-bold px-2 py-0.5 rounded text-white ${getTypeColor(node.task.type)}`}>
                    {node.task.taskId}
                  </span>
                  <span className={`text-lg ${getPriorityColor(node.task.priority)}`}>
                    {'!'.repeat(Math.min(node.task.priority, 3))}
                  </span>
                </div>
                <p className="text-sm font-medium text-gray-900 dark:text-white line-clamp-2">
                  {node.task.title}
                </p>
                <div className="mt-2 flex flex-wrap gap-1">
                  {node.task.tags.slice(0, 2).map((tag) => (
                    <span
                      key={tag}
                      className="text-xs px-1.5 py-0.5 bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300 rounded"
                    >
                      {tag}
                    </span>
                  ))}
                  {node.task.tags.length > 2 && (
                    <span className="text-xs px-1.5 py-0.5 bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300 rounded">
                      +{node.task.tags.length - 2}
                    </span>
                  )}
                </div>
                {node.task.riskFlags.length > 0 && (
                  <div className="mt-1 text-xs text-red-500 dark:text-red-400 flex items-center gap-1">
                    ⚠ {node.task.riskFlags.length} risk{node.task.riskFlags.length > 1 ? 's' : ''}
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
