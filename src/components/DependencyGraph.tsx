'use client';

import { useState, useMemo, useRef } from 'react';
import { TaskDependency, Epic, Ticket, Subtask } from '@/types/taskBreakdown';
import { ArrowRight, Maximize2, Minimize2 } from 'lucide-react';

interface DependencyGraphProps {
  epics?: Epic[];
  tickets?: Ticket[];
  subtasks?: Subtask[];
  dependencies: TaskDependency[];
  onTaskClick?: (taskId: string) => void;
}

interface GraphNode {
  id: string;
  title: string;
  type: 'epic' | 'ticket' | 'subtask';
  x: number;
  y: number;
  status: string;
  priority?: number;
}

interface GraphEdge {
  from: string;
  to: string;
  type: TaskDependency['type'];
}

export const DependencyGraph = ({
  epics = [],
  tickets = [],
  subtasks = [],
  dependencies,
  onTaskClick,
}: DependencyGraphProps) => {
  const [selectedNode, setSelectedNode] = useState<string | null>(null);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const svgRef = useRef<SVGSVGElement>(null);

  // Build graph data structure using useMemo to avoid setState in effect
  const { nodes, edges } = useMemo(() => {
    const graphNodes: GraphNode[] = [];
    const graphEdges: GraphEdge[] = [];

    // Create nodes for each task
    epics.forEach((epic, idx) => {
      graphNodes.push({
        id: epic.id,
        title: epic.epicId,
        type: 'epic',
        x: 100,
        y: 100 + idx * 150,
        status: epic.status,
        priority: epic.priority,
      });
    });

    tickets.forEach((ticket, idx) => {
      graphNodes.push({
        id: ticket.id,
        title: ticket.ticketId,
        type: 'ticket',
        x: 400,
        y: 100 + idx * 100,
        status: ticket.status,
        priority: ticket.priority,
      });

      // Add edge from epic to ticket
      if (ticket.epicId) {
        graphEdges.push({
          from: ticket.epicId,
          to: ticket.id,
          type: 'relates_to',
        });
      }
    });

    subtasks.forEach((subtask, idx) => {
      graphNodes.push({
        id: subtask.id,
        title: subtask.subtaskId,
        type: 'subtask',
        x: 700,
        y: 100 + idx * 80,
        status: subtask.status,
      });

      // Add edge from ticket to subtask
      graphEdges.push({
        from: subtask.ticketId,
        to: subtask.id,
        type: 'relates_to',
      });
    });

    // Add dependency edges
    dependencies.forEach((dep) => {
      graphEdges.push({
        from: dep.sourceTaskId,
        to: dep.targetTaskId,
        type: dep.type,
      });
    });

    // Apply force-directed layout for better positioning
    const layoutNodes = applyForceLayout(graphNodes, graphEdges);

    return { nodes: layoutNodes, edges: graphEdges };
  }, [epics, tickets, subtasks, dependencies]);

  const getNodeColor = (node: GraphNode): string => {
    if (node.type === 'epic') {
      return 'stroke-purple-500 fill-purple-100 dark:fill-purple-900';
    } else if (node.type === 'ticket') {
      return 'stroke-blue-500 fill-blue-100 dark:fill-blue-900';
    } else {
      return 'stroke-green-500 fill-green-100 dark:fill-green-900';
    }
  };

  const getEdgeColor = (type: TaskDependency['type']): string => {
    switch (type) {
      case 'blocks':
        return 'stroke-red-500';
      case 'blocked_by':
        return 'stroke-orange-500';
      case 'relates_to':
        return 'stroke-gray-400 dark:stroke-gray-600';
      case 'duplicates':
        return 'stroke-yellow-500';
      default:
        return 'stroke-gray-400';
    }
  };

  const handleNodeClick = (nodeId: string) => {
    setSelectedNode(nodeId === selectedNode ? null : nodeId);
    if (onTaskClick) {
      onTaskClick(nodeId);
    }
  };

  const getViewBox = () => {
    if (nodes.length === 0) return '0 0 800 600';

    const padding = 50;
    const minX = Math.min(...nodes.map((n) => n.x)) - padding;
    const minY = Math.min(...nodes.map((n) => n.y)) - padding;
    const maxX = Math.max(...nodes.map((n) => n.x)) + padding;
    const maxY = Math.max(...nodes.map((n) => n.y)) + padding;

    return `${minX} ${minY} ${maxX - minX} ${maxY - minY}`;
  };

  if (nodes.length === 0) {
    return (
      <div className="flex items-center justify-center h-64 bg-gray-50 dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700">
        <p className="text-gray-500 dark:text-gray-400">No task dependencies to visualize</p>
      </div>
    );
  }

  return (
    <div
      className={`bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 ${
        isFullscreen ? 'fixed inset-4 z-50' : 'relative'
      }`}
    >
      <div className="p-4 border-b border-gray-200 dark:border-gray-700 flex justify-between items-center">
        <div>
          <h3 className="text-lg font-bold text-gray-900 dark:text-white">Task Dependencies</h3>
          <p className="text-sm text-gray-500 dark:text-gray-400">
            {nodes.length} tasks, {edges.length} dependencies
          </p>
        </div>
        <button
          onClick={() => setIsFullscreen(!isFullscreen)}
          className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded transition-colors"
          title={isFullscreen ? 'Exit fullscreen' : 'Fullscreen'}
        >
          {isFullscreen ? <Minimize2 size={20} /> : <Maximize2 size={20} />}
        </button>
      </div>

      <div className="p-4 overflow-auto" style={{ height: isFullscreen ? 'calc(100% - 80px)' : '500px' }}>
        <svg ref={svgRef} viewBox={getViewBox()} className="w-full h-full">
          {/* Define arrow marker */}
          <defs>
            <marker
              id="arrowhead"
              markerWidth="10"
              markerHeight="10"
              refX="9"
              refY="3"
              orient="auto"
              className="fill-gray-400"
            >
              <polygon points="0 0, 10 3, 0 6" />
            </marker>
            <marker
              id="arrowhead-blocks"
              markerWidth="10"
              markerHeight="10"
              refX="9"
              refY="3"
              orient="auto"
              className="fill-red-500"
            >
              <polygon points="0 0, 10 3, 0 6" />
            </marker>
          </defs>

          {/* Render edges */}
          {edges.map((edge, idx) => {
            const fromNode = nodes.find((n) => n.id === edge.from);
            const toNode = nodes.find((n) => n.id === edge.to);
            if (!fromNode || !toNode) return null;

            const isHighlighted = selectedNode === edge.from || selectedNode === edge.to;
            const markerEnd =
              edge.type === 'blocks' ? 'url(#arrowhead-blocks)' : 'url(#arrowhead)';

            return (
              <line
                key={`${edge.from}-${edge.to}-${idx}`}
                x1={fromNode.x + 50}
                y1={fromNode.y + 25}
                x2={toNode.x}
                y2={toNode.y + 25}
                className={`${getEdgeColor(edge.type)} ${
                  isHighlighted ? 'stroke-[3]' : 'stroke-[2]'
                } ${isHighlighted ? '' : 'opacity-60'}`}
                markerEnd={markerEnd}
                strokeDasharray={edge.type === 'relates_to' ? '5,5' : '0'}
              />
            );
          })}

          {/* Render nodes */}
          {nodes.map((node) => {
            const isSelected = selectedNode === node.id;
            const isRelated =
              selectedNode &&
              edges.some((e) => e.from === selectedNode && e.to === node.id ||
                e.to === selectedNode && e.from === node.id);

            return (
              <g
                key={node.id}
                transform={`translate(${node.x}, ${node.y})`}
                onClick={() => handleNodeClick(node.id)}
                className="cursor-pointer"
              >
                <rect
                  width={node.type === 'epic' ? 120 : node.type === 'ticket' ? 100 : 80}
                  height="50"
                  rx="8"
                  className={`${getNodeColor(node)} ${
                    isSelected
                      ? 'stroke-[4] drop-shadow-lg'
                      : isRelated
                      ? 'stroke-[3]'
                      : 'stroke-[2]'
                  } transition-all`}
                />
                <text
                  x={node.type === 'epic' ? 60 : node.type === 'ticket' ? 50 : 40}
                  y="20"
                  className="text-sm font-bold fill-gray-900 dark:fill-white"
                  textAnchor="middle"
                >
                  {node.title}
                </text>
                <text
                  x={node.type === 'epic' ? 60 : node.type === 'ticket' ? 50 : 40}
                  y="38"
                  className="text-xs fill-gray-600 dark:fill-gray-400"
                  textAnchor="middle"
                >
                  {node.status}
                </text>
              </g>
            );
          })}
        </svg>
      </div>

      {/* Legend */}
      <div className="p-4 border-t border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-900">
        <div className="flex flex-wrap gap-4 text-xs">
          <div className="flex items-center gap-2">
            <div className="w-4 h-4 bg-purple-100 dark:bg-purple-900 border-2 border-purple-500 rounded"></div>
            <span className="text-gray-600 dark:text-gray-400">Epic</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-4 h-4 bg-blue-100 dark:bg-blue-900 border-2 border-blue-500 rounded"></div>
            <span className="text-gray-600 dark:text-gray-400">Ticket</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-4 h-4 bg-green-100 dark:bg-green-900 border-2 border-green-500 rounded"></div>
            <span className="text-gray-600 dark:text-gray-400">Subtask</span>
          </div>
          <div className="flex items-center gap-2">
            <ArrowRight size={16} className="text-red-500" />
            <span className="text-gray-600 dark:text-gray-400">Blocks</span>
          </div>
          <div className="flex items-center gap-2">
            <ArrowRight size={16} className="text-gray-400" strokeDasharray="5,5" />
            <span className="text-gray-600 dark:text-gray-400">Related</span>
          </div>
        </div>
      </div>
    </div>
  );
};

/**
 * Simple force-directed layout algorithm to position nodes
 */
function applyForceLayout(nodes: GraphNode[], edges: GraphEdge[]): GraphNode[] {
  const layoutNodes = [...nodes];
  const iterations = 50;
  const repulsion = 5000;
  const attraction = 0.1;
  const damping = 0.5;

  for (let iter = 0; iter < iterations; iter++) {
    // Calculate repulsion between all nodes
    for (let i = 0; i < layoutNodes.length; i++) {
      let fx = 0;
      let fy = 0;

      for (let j = 0; j < layoutNodes.length; j++) {
        if (i === j) continue;

        const dx = layoutNodes[i].x - layoutNodes[j].x;
        const dy = layoutNodes[i].y - layoutNodes[j].y;
        const dist = Math.sqrt(dx * dx + dy * dy) || 1;

        const force = repulsion / (dist * dist);
        fx += (dx / dist) * force;
        fy += (dy / dist) * force;
      }

      // Calculate attraction along edges
      edges.forEach((edge) => {
        let otherIdx = -1;
        let sign = 0;

        if (edge.from === layoutNodes[i].id) {
          otherIdx = layoutNodes.findIndex((n) => n.id === edge.to);
          sign = 1;
        } else if (edge.to === layoutNodes[i].id) {
          otherIdx = layoutNodes.findIndex((n) => n.id === edge.from);
          sign = -1;
        }

        if (otherIdx !== -1) {
          const dx = layoutNodes[otherIdx].x - layoutNodes[i].x;
          const dy = layoutNodes[otherIdx].y - layoutNodes[i].y;
          const dist = Math.sqrt(dx * dx + dy * dy) || 1;

          fx += sign * dx * attraction;
          fy += sign * dy * attraction;
        }
      });

      // Apply forces with damping
      layoutNodes[i].x += fx * damping;
      layoutNodes[i].y += fy * damping;
    }
  }

  return layoutNodes;
}
