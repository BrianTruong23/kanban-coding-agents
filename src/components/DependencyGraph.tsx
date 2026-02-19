'use client';

import { useState, useEffect, useRef } from 'react';
import { Task } from '@/types/task';
import { TaskDependency } from '@/types/dependency';
import { X, Maximize2, Minimize2 } from 'lucide-react';

interface DependencyGraphProps {
  tasks: Task[];
  dependencies: TaskDependency[];
  onClose?: () => void;
}

interface Node {
  id: string;
  taskId: string;
  title: string;
  status: string;
  x: number;
  y: number;
}

interface Edge {
  from: string;
  to: string;
  type: string;
}

export const DependencyGraph = ({ tasks, dependencies, onClose }: DependencyGraphProps) => {
  const [nodes, setNodes] = useState<Node[]>([]);
  const [edges, setEdges] = useState<Edge[]>([]);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    // Build graph data
    const taskMap = new Map(tasks.map(t => [t.id, t]));
    const graphNodes: Node[] = [];
    const graphEdges: Edge[] = [];

    // Create nodes
    tasks.forEach((task, index) => {
      const cols = 4;
      const col = index % cols;
      const row = Math.floor(index / cols);

      graphNodes.push({
        id: task.id,
        taskId: task.taskId,
        title: task.title,
        status: task.status,
        x: 100 + col * 250,
        y: 100 + row * 150
      });
    });

    // Create edges
    dependencies.forEach(dep => {
      if (taskMap.has(dep.taskId) && taskMap.has(dep.dependsOnTaskId)) {
        graphEdges.push({
          from: dep.dependsOnTaskId,
          to: dep.taskId,
          type: dep.dependencyType
        });
      }
    });

    setNodes(graphNodes);
    setEdges(graphEdges);
  }, [tasks, dependencies]);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas || nodes.length === 0) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Set canvas size
    const container = containerRef.current;
    if (container) {
      canvas.width = container.clientWidth;
      canvas.height = container.clientHeight;
    }

    // Clear canvas
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    // Draw edges
    edges.forEach(edge => {
      const fromNode = nodes.find(n => n.id === edge.from);
      const toNode = nodes.find(n => n.id === edge.to);

      if (fromNode && toNode) {
        ctx.beginPath();
        ctx.moveTo(fromNode.x + 80, fromNode.y + 40);
        ctx.lineTo(toNode.x, toNode.y + 40);

        // Style based on dependency type
        if (edge.type === 'blocks') {
          ctx.strokeStyle = '#ef4444'; // red
          ctx.lineWidth = 2;
        } else if (edge.type === 'blocked-by') {
          ctx.strokeStyle = '#f59e0b'; // amber
          ctx.lineWidth = 2;
        } else {
          ctx.strokeStyle = '#6b7280'; // gray
          ctx.lineWidth = 1;
          ctx.setLineDash([5, 5]);
        }

        ctx.stroke();
        ctx.setLineDash([]);

        // Draw arrow
        const angle = Math.atan2(toNode.y - fromNode.y, toNode.x - fromNode.x - 80);
        const arrowSize = 10;
        ctx.beginPath();
        ctx.moveTo(toNode.x, toNode.y + 40);
        ctx.lineTo(
          toNode.x - arrowSize * Math.cos(angle - Math.PI / 6),
          toNode.y + 40 - arrowSize * Math.sin(angle - Math.PI / 6)
        );
        ctx.lineTo(
          toNode.x - arrowSize * Math.cos(angle + Math.PI / 6),
          toNode.y + 40 - arrowSize * Math.sin(angle + Math.PI / 6)
        );
        ctx.closePath();
        ctx.fillStyle = ctx.strokeStyle;
        ctx.fill();
      }
    });
  }, [nodes, edges]);

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'backlog': return '#6b7280';
      case 'in-progress': return '#3b82f6';
      case 'review': return '#f59e0b';
      case 'done': return '#10b981';
      default: return '#6b7280';
    }
  };

  return (
    <div
      ref={containerRef}
      className={`${isFullscreen ? 'fixed inset-0 z-50' : 'relative'} bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 overflow-hidden`}
      style={{ height: isFullscreen ? '100vh' : '600px' }}
    >
      {/* Header */}
      <div className="absolute top-0 left-0 right-0 bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 p-4 flex items-center justify-between z-10">
        <h3 className="text-lg font-bold text-gray-900 dark:text-white">Task Dependencies</h3>
        <div className="flex items-center gap-2">
          <button
            onClick={() => setIsFullscreen(!isFullscreen)}
            className="p-2 text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white transition-colors"
          >
            {isFullscreen ? <Minimize2 size={20} /> : <Maximize2 size={20} />}
          </button>
          {onClose && (
            <button
              onClick={onClose}
              className="p-2 text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white transition-colors"
            >
              <X size={20} />
            </button>
          )}
        </div>
      </div>

      {/* Legend */}
      <div className="absolute top-16 left-4 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg p-3 z-10 text-xs">
        <div className="font-semibold text-gray-900 dark:text-white mb-2">Legend</div>
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <div className="w-4 h-0.5 bg-red-500"></div>
            <span className="text-gray-700 dark:text-gray-300">Blocks</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-4 h-0.5 bg-amber-500"></div>
            <span className="text-gray-700 dark:text-gray-300">Blocked By</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-4 h-0.5 bg-gray-500 border-dashed"></div>
            <span className="text-gray-700 dark:text-gray-300">Related</span>
          </div>
        </div>
      </div>

      {/* Canvas for edges */}
      <canvas
        ref={canvasRef}
        className="absolute inset-0"
        style={{ marginTop: '64px' }}
      />

      {/* Nodes */}
      <div className="absolute inset-0 overflow-auto" style={{ marginTop: '64px', padding: '20px' }}>
        <div className="relative" style={{ width: '1200px', height: '800px' }}>
          {nodes.map(node => (
            <div
              key={node.id}
              className="absolute bg-white dark:bg-gray-700 border-2 rounded-lg p-3 shadow-lg cursor-pointer hover:shadow-xl transition-shadow"
              style={{
                left: node.x,
                top: node.y,
                width: '160px',
                borderColor: getStatusColor(node.status)
              }}
            >
              <div className="text-xs font-bold text-gray-500 dark:text-gray-400 mb-1">{node.taskId}</div>
              <div className="text-sm font-medium text-gray-900 dark:text-white line-clamp-2">
                {node.title}
              </div>
              <div className="mt-2">
                <span
                  className="inline-block px-2 py-0.5 rounded text-xs font-medium text-white"
                  style={{ backgroundColor: getStatusColor(node.status) }}
                >
                  {node.status}
                </span>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Empty state */}
      {nodes.length === 0 && (
        <div className="absolute inset-0 flex items-center justify-center" style={{ marginTop: '64px' }}>
          <div className="text-center text-gray-500 dark:text-gray-400">
            <p className="text-lg font-medium mb-2">No dependencies yet</p>
            <p className="text-sm">Add task dependencies to visualize them here</p>
          </div>
        </div>
      )}
    </div>
  );
};
