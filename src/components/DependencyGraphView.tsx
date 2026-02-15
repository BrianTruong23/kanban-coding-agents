'use client';

import { useState, useEffect } from 'react';
import { GitBranch, AlertCircle, CheckCircle, Clock } from 'lucide-react';
import { DependencyGraphBuilder, DependencyGraph } from '@/lib/dependencyGraph';
import { Ticket, Subtask } from '@/types/taskBreakdown';

interface DependencyGraphViewProps {
  tickets: Ticket[];
  subtasks: Subtask[];
}

export function DependencyGraphView({ tickets, subtasks }: DependencyGraphViewProps) {
  const [showSubtasks, setShowSubtasks] = useState(false);
  const [exportFormat, setExportFormat] = useState<'mermaid' | 'dot'>('mermaid');

  // Build graph on every render based on props
  const graph = tickets.length > 0
    ? DependencyGraphBuilder.buildGraph(tickets, subtasks, showSubtasks)
    : null;

  const handleExport = () => {
    if (!graph) return;

    const content =
      exportFormat === 'mermaid'
        ? DependencyGraphBuilder.exportToMermaid(graph)
        : DependencyGraphBuilder.exportToDot(graph);

    const blob = new Blob([content], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `dependency-graph.${exportFormat === 'mermaid' ? 'mmd' : 'dot'}`;
    a.click();
    URL.revokeObjectURL(url);
  };

  if (!graph) {
    return (
      <div className="flex items-center justify-center h-full bg-white dark:bg-gray-800 rounded-lg shadow-lg">
        <p className="text-gray-600 dark:text-gray-400">No tasks to visualize</p>
      </div>
    );
  }

  const criticalPathAnalysis = graph.criticalPath
    ? DependencyGraphBuilder.analyzeCriticalPath(graph.criticalPath, graph.nodes)
    : null;

  const nextAvailable = DependencyGraphBuilder.getNextAvailableTasks(graph.nodes, graph.edges);

  return (
    <div className="flex flex-col h-full bg-white dark:bg-gray-800 rounded-lg shadow-lg overflow-hidden">
      {/* Header */}
      <div className="p-4 border-b border-gray-200 dark:border-gray-700">
        <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-100">
          Dependency Graph
        </h2>
        <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
          Visualize task dependencies and critical paths
        </p>
      </div>

      {/* Controls */}
      <div className="p-4 border-b border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-900/50">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <label className="flex items-center gap-2 text-sm text-gray-700 dark:text-gray-300">
              <input
                type="checkbox"
                checked={showSubtasks}
                onChange={(e) => setShowSubtasks(e.target.checked)}
                className="rounded"
              />
              Show Subtasks
            </label>

            <select
              value={exportFormat}
              onChange={(e) => setExportFormat(e.target.value as 'mermaid' | 'dot')}
              className="px-2 py-1 text-sm border border-gray-300 dark:border-gray-600 rounded bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100"
            >
              <option value="mermaid">Mermaid</option>
              <option value="dot">GraphViz DOT</option>
            </select>
          </div>

          <button
            onClick={handleExport}
            className="px-3 py-1.5 text-sm bg-blue-500 text-white rounded hover:bg-blue-600"
          >
            Export Graph
          </button>
        </div>
      </div>

      {/* Stats */}
      <div className="p-4 border-b border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-900/50">
        <div className="grid grid-cols-4 gap-4">
          <div className="text-center">
            <div className="text-2xl font-bold text-gray-900 dark:text-gray-100">
              {graph.nodes.length}
            </div>
            <div className="text-xs text-gray-600 dark:text-gray-400">Total Tasks</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-blue-600 dark:text-blue-400">
              {graph.edges.length}
            </div>
            <div className="text-xs text-gray-600 dark:text-gray-400">Dependencies</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-red-600 dark:text-red-400">
              {graph.blockedTasks?.length || 0}
            </div>
            <div className="text-xs text-gray-600 dark:text-gray-400">Blocked</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-green-600 dark:text-green-400">
              {nextAvailable.length}
            </div>
            <div className="text-xs text-gray-600 dark:text-gray-400">Ready</div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 overflow-auto p-4">
        {/* Critical Path */}
        {criticalPathAnalysis && criticalPathAnalysis.path.length > 0 && (
          <div className="mb-4 p-4 border border-orange-300 dark:border-orange-700 rounded-lg bg-orange-50 dark:bg-orange-900/20">
            <div className="flex items-center gap-2 mb-2">
              <GitBranch className="w-4 h-4 text-orange-600 dark:text-orange-400" />
              <h3 className="font-semibold text-orange-900 dark:text-orange-100">Critical Path</h3>
            </div>
            <div className="text-sm text-orange-800 dark:text-orange-200 mb-2">
              Total Duration: {criticalPathAnalysis.totalDuration} hours
            </div>
            <div className="flex flex-wrap gap-2">
              {criticalPathAnalysis.path.map((nodeId, idx) => {
                const node = graph.nodes.find((n) => n.id === nodeId);
                if (!node) return null;

                return (
                  <div key={nodeId} className="flex items-center gap-1">
                    <span className="px-2 py-1 text-xs bg-orange-200 dark:bg-orange-800 text-orange-900 dark:text-orange-100 rounded">
                      {node.label}
                    </span>
                    {idx < criticalPathAnalysis.path.length - 1 && (
                      <span className="text-orange-600 dark:text-orange-400">→</span>
                    )}
                  </div>
                );
              })}
            </div>
            {criticalPathAnalysis.bottlenecks.length > 0 && (
              <div className="mt-2">
                <p className="text-xs font-medium text-orange-800 dark:text-orange-200">
                  Bottlenecks:
                </p>
                <div className="flex gap-1 mt-1">
                  {criticalPathAnalysis.bottlenecks.map((nodeId) => {
                    const node = graph.nodes.find((n) => n.id === nodeId);
                    return (
                      <span
                        key={nodeId}
                        className="px-2 py-0.5 text-xs bg-red-200 dark:bg-red-800 text-red-900 dark:text-red-100 rounded"
                      >
                        {node?.label}
                      </span>
                    );
                  })}
                </div>
              </div>
            )}
          </div>
        )}

        {/* Blocked Tasks */}
        {graph.blockedTasks && graph.blockedTasks.length > 0 && (
          <div className="mb-4 p-4 border border-red-300 dark:border-red-700 rounded-lg bg-red-50 dark:bg-red-900/20">
            <div className="flex items-center gap-2 mb-2">
              <AlertCircle className="w-4 h-4 text-red-600 dark:text-red-400" />
              <h3 className="font-semibold text-red-900 dark:text-red-100">Blocked Tasks</h3>
            </div>
            <div className="space-y-2">
              {graph.blockedTasks.map((taskId) => {
                const node = graph.nodes.find((n) => n.id === taskId);
                const blockers = DependencyGraphBuilder.getTaskBlockers(taskId, graph.edges);

                return (
                  <div key={taskId} className="text-sm">
                    <div className="font-medium text-red-900 dark:text-red-100">
                      {node?.label}
                    </div>
                    <div className="text-xs text-red-700 dark:text-red-300">
                      Blocked by:{' '}
                      {blockers
                        .map((blockerId) => {
                          const blocker = graph.nodes.find((n) => n.id === blockerId);
                          return blocker?.label;
                        })
                        .join(', ')}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* Next Available Tasks */}
        {nextAvailable.length > 0 && (
          <div className="mb-4 p-4 border border-green-300 dark:border-green-700 rounded-lg bg-green-50 dark:bg-green-900/20">
            <div className="flex items-center gap-2 mb-2">
              <CheckCircle className="w-4 h-4 text-green-600 dark:text-green-400" />
              <h3 className="font-semibold text-green-900 dark:text-green-100">
                Ready to Start ({nextAvailable.length})
              </h3>
            </div>
            <div className="grid grid-cols-2 gap-2">
              {nextAvailable.map((node) => (
                <div
                  key={node.id}
                  className="p-2 bg-white dark:bg-gray-800 border border-green-200 dark:border-green-700 rounded"
                >
                  <div className="text-sm font-medium text-gray-900 dark:text-gray-100">
                    {node.label}
                  </div>
                  <div className="flex items-center gap-2 mt-1 text-xs text-gray-600 dark:text-gray-400">
                    <Clock className="w-3 h-3" />
                    {node.estimatedHours || 0}h
                    <span className="ml-auto">P{node.priority}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Visual Graph Representation */}
        <div className="p-4 border border-gray-300 dark:border-gray-700 rounded-lg bg-gray-50 dark:bg-gray-900/50">
          <h3 className="font-semibold text-gray-900 dark:text-gray-100 mb-3">Graph Visualization</h3>
          <div className="relative w-full h-96 overflow-auto bg-white dark:bg-gray-800 rounded border border-gray-200 dark:border-gray-700">
            <svg width="1200" height="800" className="absolute top-0 left-0">
              {/* Draw edges */}
              {graph.edges.map((edge, idx) => {
                const source = graph.nodes.find((n) => n.id === edge.source);
                const target = graph.nodes.find((n) => n.id === edge.target);

                if (!source || !target || !source.x || !source.y || !target.x || !target.y) {
                  return null;
                }

                const isCritical = graph.criticalPath?.includes(source.id) && graph.criticalPath?.includes(target.id);

                return (
                  <g key={idx}>
                    <line
                      x1={source.x}
                      y1={source.y}
                      x2={target.x}
                      y2={target.y}
                      stroke={isCritical ? '#f97316' : '#9ca3af'}
                      strokeWidth={isCritical ? 2 : 1}
                      strokeDasharray={edge.type === 'parent-child' ? '5,5' : '0'}
                      markerEnd="url(#arrowhead)"
                    />
                  </g>
                );
              })}

              {/* Define arrowhead marker */}
              <defs>
                <marker
                  id="arrowhead"
                  markerWidth="10"
                  markerHeight="10"
                  refX="9"
                  refY="3"
                  orient="auto"
                >
                  <polygon points="0 0, 10 3, 0 6" fill="#9ca3af" />
                </marker>
              </defs>

              {/* Draw nodes */}
              {graph.nodes.map((node) => {
                if (!node.x || !node.y) return null;

                const isBlocked = graph.blockedTasks?.includes(node.id);
                const isCritical = graph.criticalPath?.includes(node.id);
                const isReady = nextAvailable.some((n) => n.id === node.id);

                let fillColor = '#e5e7eb'; // gray
                if (node.status === 'done') fillColor = '#86efac'; // green
                else if (node.status === 'review') fillColor = '#fde047'; // yellow
                else if (node.status === 'in-progress') fillColor = '#7dd3fc'; // blue
                else if (isBlocked) fillColor = '#fca5a5'; // red

                let borderColor = '#9ca3af';
                if (isCritical) borderColor = '#f97316'; // orange
                else if (isReady) borderColor = '#22c55e'; // green

                return (
                  <g key={node.id}>
                    <rect
                      x={node.x - 60}
                      y={node.y - 20}
                      width="120"
                      height="40"
                      fill={fillColor}
                      stroke={borderColor}
                      strokeWidth={isCritical ? 2 : 1}
                      rx="4"
                    />
                    <text
                      x={node.x}
                      y={node.y + 5}
                      textAnchor="middle"
                      className="text-xs fill-gray-900 dark:fill-gray-100"
                    >
                      {node.label.length > 20 ? node.label.substring(0, 17) + '...' : node.label}
                    </text>
                  </g>
                );
              })}
            </svg>
          </div>
          <div className="mt-3 flex gap-4 text-xs text-gray-600 dark:text-gray-400">
            <div className="flex items-center gap-1">
              <div className="w-3 h-3 bg-gray-200 border border-gray-400 rounded"></div>
              Backlog
            </div>
            <div className="flex items-center gap-1">
              <div className="w-3 h-3 bg-blue-300 border border-gray-400 rounded"></div>
              In Progress
            </div>
            <div className="flex items-center gap-1">
              <div className="w-3 h-3 bg-yellow-200 border border-gray-400 rounded"></div>
              Review
            </div>
            <div className="flex items-center gap-1">
              <div className="w-3 h-3 bg-green-300 border border-gray-400 rounded"></div>
              Done
            </div>
            <div className="flex items-center gap-1">
              <div className="w-3 h-3 border-2 border-orange-500 rounded"></div>
              Critical Path
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
