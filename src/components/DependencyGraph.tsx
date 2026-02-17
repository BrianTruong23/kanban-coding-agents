'use client';

import { useState, useRef, useEffect } from 'react';
import { Ticket, Subtask, TaskDependency } from '@/types/breakdown';
import { GitBranch, AlertCircle, CheckCircle, Circle } from 'lucide-react';

interface DependencyGraphProps {
  tickets: Ticket[];
  subtasks: Subtask[];
  dependencies: TaskDependency[];
}

interface GraphNode {
  id: string;
  title: string;
  type: 'ticket' | 'subtask';
  status: string;
  x: number;
  y: number;
}

interface GraphEdge {
  from: string;
  to: string;
  type: 'blocks' | 'relates-to' | 'duplicates';
}

export const DependencyGraph = ({ tickets, subtasks, dependencies }: DependencyGraphProps) => {
  const [nodes, setNodes] = useState<GraphNode[]>([]);
  const [edges, setEdges] = useState<GraphEdge[]>([]);
  const [selectedNode, setSelectedNode] = useState<string | null>(null);
  const canvasRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    // Build graph nodes and edges
    buildGraph();
  }, [tickets, subtasks, dependencies]);

  const buildGraph = () => {
    const newNodes: GraphNode[] = [];
    const newEdges: GraphEdge[] = [];

    // Add tickets as nodes
    tickets.forEach((ticket, index) => {
      newNodes.push({
        id: ticket.id,
        title: ticket.title,
        type: 'ticket',
        status: ticket.status,
        x: 100 + (index % 3) * 300,
        y: 100 + Math.floor(index / 3) * 150
      });
    });

    // Add subtasks as nodes
    subtasks.forEach((subtask, index) => {
      newNodes.push({
        id: subtask.id,
        title: subtask.title,
        type: 'subtask',
        status: subtask.status,
        x: 150 + (index % 3) * 300,
        y: 250 + Math.floor(index / 3) * 150
      });
    });

    // Add dependencies as edges
    dependencies.forEach(dep => {
      newEdges.push({
        from: dep.sourceId,
        to: dep.targetId,
        type: dep.type
      });
    });

    // Also add implicit edges from tickets to their subtasks
    tickets.forEach(ticket => {
      ticket.subtasks.forEach(subtaskId => {
        if (!newEdges.some(e => e.from === ticket.id && e.to === subtaskId)) {
          newEdges.push({
            from: ticket.id,
            to: subtaskId,
            type: 'relates-to'
          });
        }
      });
    });

    setNodes(newNodes);
    setEdges(newEdges);
  };

  const getStatusColor = (status: string): string => {
    switch (status) {
      case 'done':
      case 'completed':
        return 'bg-green-500';
      case 'in-progress':
        return 'bg-blue-500';
      case 'review':
        return 'bg-yellow-500';
      case 'blocked':
        return 'bg-red-500';
      default:
        return 'bg-gray-400';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'done':
      case 'completed':
        return <CheckCircle size={16} />;
      case 'blocked':
        return <AlertCircle size={16} />;
      default:
        return <Circle size={16} />;
    }
  };

  const getEdgeColor = (type: string): string => {
    switch (type) {
      case 'blocks':
        return 'stroke-red-500';
      case 'duplicates':
        return 'stroke-yellow-500';
      default:
        return 'stroke-gray-400';
    }
  };

  const handleNodeClick = (nodeId: string) => {
    setSelectedNode(selectedNode === nodeId ? null : nodeId);
  };

  // Find connected nodes
  const getConnectedNodes = (nodeId: string): Set<string> => {
    const connected = new Set<string>();

    edges.forEach(edge => {
      if (edge.from === nodeId) {
        connected.add(edge.to);
      }
      if (edge.to === nodeId) {
        connected.add(edge.from);
      }
    });

    return connected;
  };

  const connectedNodes = selectedNode ? getConnectedNodes(selectedNode) : new Set();

  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg overflow-hidden">
      <div className="p-4 border-b border-gray-200 dark:border-gray-700">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <GitBranch size={20} className="text-gray-600 dark:text-gray-400" />
            <h3 className="text-lg font-bold text-gray-900 dark:text-white">
              Dependency Graph
            </h3>
          </div>
          <div className="flex items-center gap-4 text-xs text-gray-500 dark:text-gray-400">
            <div className="flex items-center gap-1">
              <div className="w-3 h-3 rounded-full bg-blue-500"></div>
              <span>Ticket</span>
            </div>
            <div className="flex items-center gap-1">
              <div className="w-3 h-3 rounded-full bg-purple-500"></div>
              <span>Subtask</span>
            </div>
          </div>
        </div>
      </div>

      {nodes.length === 0 ? (
        <div className="p-8 text-center text-gray-400 dark:text-gray-500">
          <GitBranch size={48} className="mx-auto mb-2 opacity-50" />
          <p>No tasks with dependencies yet</p>
          <p className="text-xs mt-1">Dependencies will appear here when tasks are linked</p>
        </div>
      ) : (
        <div className="relative overflow-auto" style={{ height: '600px' }}>
          <div
            ref={canvasRef}
            className="relative"
            style={{ width: '1200px', height: '800px' }}
          >
            {/* SVG for edges */}
            <svg
              className="absolute inset-0 pointer-events-none"
              style={{ width: '100%', height: '100%' }}
            >
              {edges.map((edge, index) => {
                const fromNode = nodes.find(n => n.id === edge.from);
                const toNode = nodes.find(n => n.id === edge.to);

                if (!fromNode || !toNode) return null;

                const isHighlighted = selectedNode &&
                  (edge.from === selectedNode || edge.to === selectedNode);

                return (
                  <g key={index}>
                    <line
                      x1={fromNode.x + 60}
                      y1={fromNode.y + 20}
                      x2={toNode.x + 60}
                      y2={toNode.y + 20}
                      className={`${getEdgeColor(edge.type)} ${
                        isHighlighted ? 'opacity-100' : 'opacity-30'
                      }`}
                      strokeWidth={isHighlighted ? 3 : 2}
                      strokeDasharray={edge.type === 'relates-to' ? '5,5' : '0'}
                    />
                    {/* Arrow head */}
                    <polygon
                      points={`${toNode.x + 60},${toNode.y + 20} ${toNode.x + 55},${toNode.y + 15} ${toNode.x + 55},${toNode.y + 25}`}
                      className={getEdgeColor(edge.type)}
                      fill="currentColor"
                      opacity={isHighlighted ? 1 : 0.3}
                    />
                  </g>
                );
              })}
            </svg>

            {/* Nodes */}
            {nodes.map(node => {
              const isSelected = selectedNode === node.id;
              const isConnected = connectedNodes.has(node.id);
              const shouldHighlight = !selectedNode || isSelected || isConnected;

              return (
                <div
                  key={node.id}
                  className={`absolute cursor-pointer transition-all ${
                    shouldHighlight ? 'opacity-100' : 'opacity-30'
                  } ${isSelected ? 'ring-2 ring-blue-500 scale-105' : ''}`}
                  style={{
                    left: `${node.x}px`,
                    top: `${node.y}px`,
                    width: '220px'
                  }}
                  onClick={() => handleNodeClick(node.id)}
                >
                  <div
                    className={`p-3 rounded-lg border-2 shadow-md ${
                      node.type === 'ticket'
                        ? 'bg-blue-50 dark:bg-blue-900/20 border-blue-300 dark:border-blue-700'
                        : 'bg-purple-50 dark:bg-purple-900/20 border-purple-300 dark:border-purple-700'
                    }`}
                  >
                    <div className="flex items-start justify-between gap-2 mb-1">
                      <span className={`text-xs font-semibold px-2 py-0.5 rounded ${
                        node.type === 'ticket'
                          ? 'bg-blue-200 dark:bg-blue-800 text-blue-800 dark:text-blue-200'
                          : 'bg-purple-200 dark:bg-purple-800 text-purple-800 dark:text-purple-200'
                      }`}>
                        {node.type.toUpperCase()}
                      </span>
                      <div className={`${getStatusColor(node.status)} text-white p-1 rounded`}>
                        {getStatusIcon(node.status)}
                      </div>
                    </div>
                    <p className="text-sm font-medium text-gray-900 dark:text-white line-clamp-2">
                      {node.title}
                    </p>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Legend */}
      <div className="p-4 border-t border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-900">
        <div className="flex items-center gap-6 text-xs text-gray-600 dark:text-gray-400">
          <div className="flex items-center gap-2">
            <div className="w-8 h-0.5 bg-red-500"></div>
            <span>Blocks</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-8 h-0.5 bg-gray-400" style={{ backgroundImage: 'repeating-linear-gradient(to right, currentColor 0, currentColor 5px, transparent 5px, transparent 10px)' }}></div>
            <span>Relates To</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-8 h-0.5 bg-yellow-500"></div>
            <span>Duplicates</span>
          </div>
        </div>
      </div>
    </div>
  );
};
