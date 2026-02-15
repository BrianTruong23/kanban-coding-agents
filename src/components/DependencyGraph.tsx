'use client';

import { useState, useEffect, useRef } from 'react';
import { DependencyEdge, Epic, Ticket, Subtask } from '@/types/breakdown';
import { ArrowRight, AlertTriangle } from 'lucide-react';

interface DependencyGraphProps {
  epics: Epic[];
  tickets: Ticket[];
  subtasks: Subtask[];
  dependencies: DependencyEdge[];
}

interface Node {
  id: string;
  title: string;
  type: 'epic' | 'ticket' | 'subtask';
  status?: string;
  x: number;
  y: number;
}

export const DependencyGraph = ({ epics, tickets, subtasks, dependencies }: DependencyGraphProps) => {
  const [nodes, setNodes] = useState<Node[]>([]);
  const [selectedNode, setSelectedNode] = useState<string | null>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    // Build node list
    const nodeList: Node[] = [];
    let yOffset = 50;

    // Add epics
    epics.forEach((epic, idx) => {
      nodeList.push({
        id: epic.id,
        title: epic.title,
        type: 'epic',
        x: 50,
        y: yOffset,
      });
      yOffset += 40;
    });

    // Add tickets
    yOffset = 50;
    tickets.forEach((ticket, idx) => {
      nodeList.push({
        id: ticket.id,
        title: ticket.title,
        type: 'ticket',
        status: ticket.status,
        x: 350,
        y: yOffset,
      });
      yOffset += 40;
    });

    // Add subtasks
    yOffset = 50;
    subtasks.forEach((subtask, idx) => {
      nodeList.push({
        id: subtask.id,
        title: subtask.title,
        type: 'subtask',
        status: subtask.status,
        x: 650,
        y: yOffset,
      });
      yOffset += 40;
    });

    setNodes(nodeList);
  }, [epics, tickets, subtasks]);

  useEffect(() => {
    if (!canvasRef.current) return;

    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Clear canvas
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    // Draw dependencies
    dependencies.forEach(dep => {
      const fromNode = nodes.find(n => n.id === dep.from);
      const toNode = nodes.find(n => n.id === dep.to);

      if (fromNode && toNode) {
        ctx.strokeStyle = dep.type === 'blocks' ? '#ef4444' : '#6366f1';
        ctx.lineWidth = 2;
        ctx.setLineDash(dep.type === 'related' ? [5, 5] : []);

        ctx.beginPath();
        ctx.moveTo(fromNode.x, fromNode.y);
        ctx.lineTo(toNode.x, toNode.y);
        ctx.stroke();

        // Draw arrow
        const angle = Math.atan2(toNode.y - fromNode.y, toNode.x - fromNode.x);
        const arrowLength = 10;
        ctx.beginPath();
        ctx.moveTo(toNode.x, toNode.y);
        ctx.lineTo(
          toNode.x - arrowLength * Math.cos(angle - Math.PI / 6),
          toNode.y - arrowLength * Math.sin(angle - Math.PI / 6)
        );
        ctx.moveTo(toNode.x, toNode.y);
        ctx.lineTo(
          toNode.x - arrowLength * Math.cos(angle + Math.PI / 6),
          toNode.y - arrowLength * Math.sin(angle + Math.PI / 6)
        );
        ctx.stroke();
      }
    });

    ctx.setLineDash([]);
  }, [nodes, dependencies]);

  const getNodeColor = (node: Node) => {
    if (node.type === 'epic') return 'bg-purple-100 border-purple-400 text-purple-900';
    if (node.type === 'ticket') return 'bg-blue-100 border-blue-400 text-blue-900';
    return 'bg-green-100 border-green-400 text-green-900';
  };

  const getStatusColor = (status?: string) => {
    switch (status) {
      case 'done': return 'bg-green-500';
      case 'in-progress': return 'bg-yellow-500';
      case 'review': return 'bg-blue-500';
      default: return 'bg-gray-400';
    }
  };

  const hasCircularDependency = () => {
    // Simple cycle detection
    const visited = new Set<string>();
    const recursionStack = new Set<string>();

    const hasCycle = (nodeId: string): boolean => {
      visited.add(nodeId);
      recursionStack.add(nodeId);

      const outgoingEdges = dependencies.filter(d => d.from === nodeId);
      for (const edge of outgoingEdges) {
        if (!visited.has(edge.to)) {
          if (hasCycle(edge.to)) return true;
        } else if (recursionStack.has(edge.to)) {
          return true;
        }
      }

      recursionStack.delete(nodeId);
      return false;
    };

    for (const node of nodes) {
      if (!visited.has(node.id)) {
        if (hasCycle(node.id)) return true;
      }
    }

    return false;
  };

  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-4">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-bold text-gray-900 dark:text-white">
          Dependency Graph
        </h3>
        {hasCircularDependency() && (
          <div className="flex items-center gap-2 text-red-600 dark:text-red-400 text-sm">
            <AlertTriangle size={16} />
            Circular dependency detected
          </div>
        )}
      </div>

      <div className="relative overflow-auto" style={{ height: '600px' }}>
        <canvas
          ref={canvasRef}
          width={900}
          height={Math.max(600, nodes.length * 40)}
          className="absolute top-0 left-0 pointer-events-none"
        />

        <div className="relative" style={{ minHeight: Math.max(600, nodes.length * 40) }}>
          {nodes.map(node => (
            <div
              key={node.id}
              className={`absolute border-2 rounded-lg px-3 py-2 cursor-pointer hover:shadow-md transition-shadow ${getNodeColor(node)} ${
                selectedNode === node.id ? 'ring-2 ring-black dark:ring-white' : ''
              }`}
              style={{
                left: `${node.x}px`,
                top: `${node.y}px`,
                maxWidth: '250px',
              }}
              onClick={() => setSelectedNode(node.id === selectedNode ? null : node.id)}
            >
              <div className="flex items-center gap-2">
                {node.status && (
                  <div className={`w-2 h-2 rounded-full ${getStatusColor(node.status)}`} />
                )}
                <span className="text-xs font-semibold uppercase">{node.type}</span>
              </div>
              <div className="text-sm font-medium mt-1 truncate">{node.title}</div>
            </div>
          ))}
        </div>
      </div>

      <div className="mt-4 flex items-center gap-6 text-xs text-gray-600 dark:text-gray-400">
        <div className="flex items-center gap-2">
          <div className="w-4 h-4 bg-purple-100 border-2 border-purple-400 rounded" />
          <span>Epic</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-4 h-4 bg-blue-100 border-2 border-blue-400 rounded" />
          <span>Ticket</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-4 h-4 bg-green-100 border-2 border-green-400 rounded" />
          <span>Subtask</span>
        </div>
        <div className="flex items-center gap-2">
          <ArrowRight size={16} className="text-blue-600" />
          <span>Requires</span>
        </div>
        <div className="flex items-center gap-2">
          <ArrowRight size={16} className="text-red-600" />
          <span>Blocks</span>
        </div>
      </div>
    </div>
  );
};
