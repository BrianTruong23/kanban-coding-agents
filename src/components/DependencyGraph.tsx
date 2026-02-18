'use client';

import { useState, useEffect, useRef } from 'react';
import { DependencyGraph as DependencyGraphType, DependencyNode, DependencyEdge } from '@/types/orchestration';
import { GitBranch, AlertTriangle, ChevronRight } from 'lucide-react';

interface DependencyGraphProps {
  graph: DependencyGraphType;
  onNodeClick?: (nodeId: string) => void;
  highlightedNodeId?: string;
}

interface LayoutNode extends DependencyNode {
  x: number;
  y: number;
  level: number;
}

/**
 * Dependency Graph Visualization Component
 *
 * Displays task dependencies as a directed graph with:
 * - Hierarchical layout (topological sort)
 * - Color-coded nodes by status
 * - Visual edge types (blocks, related, requires)
 * - Interactive node selection
 */
export const DependencyGraph = ({ graph, onNodeClick, highlightedNodeId }: DependencyGraphProps) => {
  const [layoutNodes, setLayoutNodes] = useState<LayoutNode[]>([]);
  const [selectedNodeId, setSelectedNodeId] = useState<string | null>(null);
  const svgRef = useRef<SVGSVGElement>(null);

  // Layout parameters
  const NODE_WIDTH = 180;
  const NODE_HEIGHT = 60;
  const LEVEL_HEIGHT = 120;
  const NODE_SPACING = 40;

  useEffect(() => {
    calculateLayout();
  }, [graph]);

  /**
   * Calculate hierarchical layout using topological sort
   */
  const calculateLayout = () => {
    if (graph.nodes.length === 0) {
      setLayoutNodes([]);
      return;
    }

    // Build adjacency list for dependencies
    const adjacencyList = new Map<string, string[]>();
    const inDegree = new Map<string, number>();

    // Initialize
    graph.nodes.forEach(node => {
      adjacencyList.set(node.id, []);
      inDegree.set(node.id, 0);
    });

    // Build graph
    graph.edges.forEach(edge => {
      adjacencyList.get(edge.target)?.push(edge.source);
      inDegree.set(edge.source, (inDegree.get(edge.source) || 0) + 1);
    });

    // Topological sort to determine levels
    const levels = new Map<string, number>();
    const queue: string[] = [];

    // Start with nodes that have no dependencies (in-degree 0)
    graph.nodes.forEach(node => {
      if (inDegree.get(node.id) === 0) {
        queue.push(node.id);
        levels.set(node.id, 0);
      }
    });

    while (queue.length > 0) {
      const nodeId = queue.shift()!;
      const currentLevel = levels.get(nodeId) || 0;

      adjacencyList.get(nodeId)?.forEach(dependentId => {
        const newDegree = (inDegree.get(dependentId) || 0) - 1;
        inDegree.set(dependentId, newDegree);

        // Update level to be max of current and parent level + 1
        const newLevel = Math.max(levels.get(dependentId) || 0, currentLevel + 1);
        levels.set(dependentId, newLevel);

        if (newDegree === 0) {
          queue.push(dependentId);
        }
      });
    }

    // Group nodes by level
    const nodesByLevel = new Map<number, DependencyNode[]>();
    graph.nodes.forEach(node => {
      const level = levels.get(node.id) || 0;
      if (!nodesByLevel.has(level)) {
        nodesByLevel.set(level, []);
      }
      nodesByLevel.get(level)!.push(node);
    });

    // Calculate positions
    const positioned: LayoutNode[] = [];
    let maxWidth = 0;

    nodesByLevel.forEach((nodesAtLevel, level) => {
      const levelWidth = nodesAtLevel.length * (NODE_WIDTH + NODE_SPACING) - NODE_SPACING;
      maxWidth = Math.max(maxWidth, levelWidth);

      nodesAtLevel.forEach((node, index) => {
        const x = index * (NODE_WIDTH + NODE_SPACING) + NODE_WIDTH / 2;
        const y = level * LEVEL_HEIGHT + NODE_HEIGHT / 2;

        positioned.push({
          ...node,
          x,
          y,
          level,
        });
      });
    });

    setLayoutNodes(positioned);
  };

  /**
   * Get color for node based on status
   */
  const getNodeColor = (status: string): { bg: string; border: string; text: string } => {
    switch (status) {
      case 'done':
        return { bg: 'bg-green-50 dark:bg-green-900/20', border: 'border-green-500', text: 'text-green-700 dark:text-green-400' };
      case 'in-progress':
        return { bg: 'bg-blue-50 dark:bg-blue-900/20', border: 'border-blue-500', text: 'text-blue-700 dark:text-blue-400' };
      case 'review':
        return { bg: 'bg-purple-50 dark:bg-purple-900/20', border: 'border-purple-500', text: 'text-purple-700 dark:text-purple-400' };
      default:
        return { bg: 'bg-gray-50 dark:bg-gray-800', border: 'border-gray-300 dark:border-gray-600', text: 'text-gray-700 dark:text-gray-300' };
    }
  };

  /**
   * Get edge style based on dependency type
   */
  const getEdgeStyle = (type: string): { stroke: string; strokeDasharray: string } => {
    switch (type) {
      case 'blocks':
        return { stroke: 'stroke-red-500', strokeDasharray: '' };
      case 'requires':
        return { stroke: 'stroke-blue-500', strokeDasharray: '' };
      case 'related':
        return { stroke: 'stroke-gray-400', strokeDasharray: '5,5' };
      default:
        return { stroke: 'stroke-gray-400', strokeDasharray: '' };
    }
  };

  /**
   * Get priority indicator
   */
  const getPriorityIndicator = (priority?: number) => {
    if (!priority) return null;

    if (priority >= 4) {
      return <AlertTriangle size={14} className="text-red-500" />;
    } else if (priority >= 3) {
      return <AlertTriangle size={14} className="text-yellow-500" />;
    }
    return null;
  };

  const handleNodeClick = (nodeId: string) => {
    setSelectedNodeId(nodeId);
    onNodeClick?.(nodeId);
  };

  if (graph.nodes.length === 0) {
    return (
      <div className="flex items-center justify-center h-64 text-gray-400 dark:text-gray-500 text-sm">
        <div className="text-center">
          <GitBranch size={48} className="mx-auto mb-3 opacity-30" />
          <p>No dependencies to display</p>
        </div>
      </div>
    );
  }

  // Calculate SVG dimensions
  const maxLevel = Math.max(...layoutNodes.map(n => n.level), 0);
  const maxNodesAtLevel = Math.max(...Array.from({ length: maxLevel + 1 }, (_, level) =>
    layoutNodes.filter(n => n.level === level).length
  ));

  const svgWidth = Math.max(600, maxNodesAtLevel * (NODE_WIDTH + NODE_SPACING));
  const svgHeight = Math.max(400, (maxLevel + 1) * LEVEL_HEIGHT + 100);

  return (
    <div className="w-full h-full overflow-auto bg-white dark:bg-gray-900 rounded-lg border border-gray-200 dark:border-gray-700">
      <div className="p-4 border-b border-gray-200 dark:border-gray-700">
        <div className="flex items-center justify-between">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white flex items-center gap-2">
            <GitBranch size={20} />
            Task Dependencies
          </h3>
          <div className="flex items-center gap-4 text-xs">
            <div className="flex items-center gap-2">
              <div className="w-3 h-0.5 bg-red-500" />
              <span className="text-gray-600 dark:text-gray-400">Blocks</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-3 h-0.5 bg-blue-500" />
              <span className="text-gray-600 dark:text-gray-400">Requires</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-3 h-0.5 bg-gray-400" style={{ strokeDasharray: '3,3' }} />
              <span className="text-gray-600 dark:text-gray-400">Related</span>
            </div>
          </div>
        </div>
      </div>

      <div className="p-6 overflow-auto">
        <svg
          ref={svgRef}
          width={svgWidth}
          height={svgHeight}
          className="mx-auto"
        >
          {/* Render edges first (below nodes) */}
          <g>
            {graph.edges.map(edge => {
              const sourceNode = layoutNodes.find(n => n.id === edge.source);
              const targetNode = layoutNodes.find(n => n.id === edge.target);

              if (!sourceNode || !targetNode) return null;

              const edgeStyle = getEdgeStyle(edge.type);

              // Calculate arrow points
              const dx = targetNode.x - sourceNode.x;
              const dy = targetNode.y - sourceNode.y;
              const angle = Math.atan2(dy, dx);

              // End point adjusted for node size
              const endX = targetNode.x - (NODE_WIDTH / 2) * Math.cos(angle);
              const endY = targetNode.y - (NODE_HEIGHT / 2) * Math.sin(angle);

              return (
                <g key={edge.id}>
                  {/* Line */}
                  <line
                    x1={sourceNode.x}
                    y1={sourceNode.y}
                    x2={endX}
                    y2={endY}
                    className={edgeStyle.stroke}
                    strokeWidth={2}
                    strokeDasharray={edgeStyle.strokeDasharray}
                    markerEnd="url(#arrowhead)"
                  />
                </g>
              );
            })}
          </g>

          {/* Arrow marker definition */}
          <defs>
            <marker
              id="arrowhead"
              markerWidth="10"
              markerHeight="10"
              refX="9"
              refY="3"
              orient="auto"
              markerUnits="strokeWidth"
            >
              <path d="M0,0 L0,6 L9,3 z" fill="currentColor" className="text-gray-400" />
            </marker>
          </defs>

          {/* Render nodes */}
          <g>
            {layoutNodes.map(node => {
              const colors = getNodeColor(node.status);
              const isHighlighted = node.id === highlightedNodeId;
              const isSelected = node.id === selectedNodeId;

              return (
                <g
                  key={node.id}
                  transform={`translate(${node.x - NODE_WIDTH / 2}, ${node.y - NODE_HEIGHT / 2})`}
                  onClick={() => handleNodeClick(node.id)}
                  className="cursor-pointer"
                >
                  {/* Node background */}
                  <rect
                    width={NODE_WIDTH}
                    height={NODE_HEIGHT}
                    rx={8}
                    className={`${colors.bg} border-2 ${colors.border} ${isHighlighted || isSelected ? 'shadow-lg' : 'shadow'}`}
                    strokeWidth={isHighlighted || isSelected ? 3 : 2}
                  />

                  {/* Node content */}
                  <foreignObject width={NODE_WIDTH} height={NODE_HEIGHT}>
                    <div className="p-2 h-full flex flex-col justify-between">
                      {/* Header */}
                      <div className="flex items-start justify-between gap-1">
                        <span className="text-xs font-mono text-gray-500 dark:text-gray-400">
                          {node.displayId}
                        </span>
                        {getPriorityIndicator(node.priority)}
                      </div>

                      {/* Title */}
                      <p className={`text-xs font-medium ${colors.text} line-clamp-2 flex-1`}>
                        {node.title}
                      </p>

                      {/* Footer */}
                      <div className="flex items-center justify-between">
                        <span className="text-xs px-1.5 py-0.5 rounded bg-gray-200 dark:bg-gray-700 text-gray-600 dark:text-gray-300">
                          {node.type}
                        </span>
                        <ChevronRight size={12} className="text-gray-400" />
                      </div>
                    </div>
                  </foreignObject>
                </g>
              );
            })}
          </g>
        </svg>
      </div>
    </div>
  );
};
