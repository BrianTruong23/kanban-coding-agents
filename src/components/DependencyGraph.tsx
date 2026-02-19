'use client';

import React, { useState, useEffect, useRef } from 'react';
import { Task, TaskDependency } from '@/types/task';
import { GitBranch, AlertTriangle, ChevronDown, ChevronRight } from 'lucide-react';

interface DependencyGraphProps {
  tasks: Task[];
  dependencies: TaskDependency[];
  onTaskClick?: (taskId: string) => void;
}

interface TreeNode {
  task: Task;
  children: TreeNode[];
  dependencies: TaskDependency[];
}

export const DependencyGraph = ({ tasks, dependencies, onTaskClick }: DependencyGraphProps) => {
  const [viewMode, setViewMode] = useState<'tree' | 'graph'>('tree');
  const [expandedNodes, setExpandedNodes] = useState<Set<string>>(new Set());

  // Build dependency tree
  const buildDependencyTree = (): TreeNode[] => {
    const taskMap = new Map(tasks.map(task => [task.id, task]));
    const nodeMap = new Map<string, TreeNode>();

    // Initialize all nodes
    for (const task of tasks) {
      nodeMap.set(task.id, {
        task,
        children: [],
        dependencies: dependencies.filter(d => d.taskId === task.id)
      });
    }

    // Build parent-child relationships
    for (const task of tasks) {
      if (task.parentTaskId) {
        const parentNode = nodeMap.get(task.parentTaskId);
        const childNode = nodeMap.get(task.id);
        if (parentNode && childNode) {
          parentNode.children.push(childNode);
        }
      }
    }

    // Find root nodes (epics or tasks without parents)
    const rootNodes: TreeNode[] = [];
    for (const [id, node] of nodeMap) {
      const task = node.task;
      if (!task.parentTaskId || task.taskType === 'epic') {
        rootNodes.push(node);
      }
    }

    return rootNodes;
  };

  const toggleNode = (nodeId: string) => {
    const newExpanded = new Set(expandedNodes);
    if (newExpanded.has(nodeId)) {
      newExpanded.delete(nodeId);
    } else {
      newExpanded.add(nodeId);
    }
    setExpandedNodes(newExpanded);
  };

  const renderTreeNode = (node: TreeNode, depth = 0): React.ReactElement => {
    const isExpanded = expandedNodes.has(node.task.id);
    const hasChildren = node.children.length > 0;
    const hasDependencies = node.dependencies.length > 0;

    const typeColors = {
      epic: 'bg-purple-100 dark:bg-purple-900/30 border-purple-300 dark:border-purple-700',
      story: 'bg-blue-100 dark:bg-blue-900/30 border-blue-300 dark:border-blue-700',
      task: 'bg-green-100 dark:bg-green-900/30 border-green-300 dark:border-green-700',
      subtask: 'bg-gray-100 dark:bg-gray-700 border-gray-300 dark:border-gray-600'
    };

    const riskColors = {
      critical: 'text-red-600 dark:text-red-400',
      high: 'text-orange-600 dark:text-orange-400',
      medium: 'text-yellow-600 dark:text-yellow-400',
      low: 'text-blue-600 dark:text-blue-400',
      none: 'text-gray-400 dark:text-gray-500'
    };

    return (
      <div key={node.task.id} className="ml-0">
        <div
          className={`flex items-start gap-2 p-3 mb-2 rounded-lg border ${
            typeColors[node.task.taskType || 'task']
          } cursor-pointer hover:shadow-md transition-shadow`}
          style={{ marginLeft: `${depth * 24}px` }}
          onClick={() => onTaskClick?.(node.task.id)}
        >
          {/* Expand/Collapse Button */}
          {hasChildren && (
            <button
              onClick={(e) => {
                e.stopPropagation();
                toggleNode(node.task.id);
              }}
              className="flex-shrink-0 text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200"
            >
              {isExpanded ? <ChevronDown size={18} /> : <ChevronRight size={18} />}
            </button>
          )}

          {!hasChildren && <div className="w-[18px]" />}

          {/* Task Content */}
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-1">
              <span className="text-xs font-mono text-gray-500 dark:text-gray-400">
                {node.task.taskId}
              </span>
              <span className="text-xs px-2 py-0.5 rounded bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600">
                {node.task.taskType || 'task'}
              </span>
              {node.task.riskLevel && node.task.riskLevel !== 'none' && (
                <span className={`flex items-center gap-1 text-xs ${riskColors[node.task.riskLevel]}`}>
                  <AlertTriangle size={12} />
                  {node.task.riskLevel}
                </span>
              )}
            </div>
            <div className="font-medium text-sm text-gray-900 dark:text-white mb-1">
              {node.task.title}
            </div>
            <div className="flex items-center gap-3 text-xs text-gray-600 dark:text-gray-400">
              {node.task.estimatedHours && (
                <span>{node.task.estimatedHours}h estimated</span>
              )}
              {hasChildren && (
                <span>{node.children.length} subtask{node.children.length !== 1 ? 's' : ''}</span>
              )}
              {hasDependencies && (
                <span className="flex items-center gap-1">
                  <GitBranch size={12} />
                  {node.dependencies.length} dep{node.dependencies.length !== 1 ? 's' : ''}
                </span>
              )}
            </div>
          </div>

          {/* Status Badge */}
          <div className="flex-shrink-0">
            <span className={`text-xs px-2 py-1 rounded ${
              node.task.status === 'done' ? 'bg-green-200 dark:bg-green-900 text-green-800 dark:text-green-200' :
              node.task.status === 'in-progress' ? 'bg-blue-200 dark:bg-blue-900 text-blue-800 dark:text-blue-200' :
              node.task.status === 'review' ? 'bg-purple-200 dark:bg-purple-900 text-purple-800 dark:text-purple-200' :
              'bg-gray-200 dark:bg-gray-700 text-gray-800 dark:text-gray-200'
            }`}>
              {node.task.status}
            </span>
          </div>
        </div>

        {/* Render children if expanded */}
        {isExpanded && hasChildren && (
          <div className="ml-6 border-l-2 border-gray-300 dark:border-gray-600 pl-2">
            {node.children.map(child => renderTreeNode(child, depth + 1))}
          </div>
        )}
      </div>
    );
  };

  const renderGraphView = () => {
    const epics = tasks.filter(t => t.taskType === 'epic');
    const stories = tasks.filter(t => t.taskType === 'story');
    const regularTasks = tasks.filter(t => t.taskType === 'task');
    const subtasks = tasks.filter(t => t.taskType === 'subtask');

    return (
      <div className="space-y-6">
        {epics.length > 0 && (
          <div>
            <h3 className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2 flex items-center gap-2">
              <div className="w-3 h-3 bg-purple-500 rounded" />
              Epics ({epics.length})
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {epics.map(task => renderTaskCard(task))}
            </div>
          </div>
        )}

        {stories.length > 0 && (
          <div>
            <h3 className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2 flex items-center gap-2">
              <div className="w-3 h-3 bg-blue-500 rounded" />
              Stories ({stories.length})
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
              {stories.map(task => renderTaskCard(task))}
            </div>
          </div>
        )}

        {regularTasks.length > 0 && (
          <div>
            <h3 className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2 flex items-center gap-2">
              <div className="w-3 h-3 bg-green-500 rounded" />
              Tasks ({regularTasks.length})
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
              {regularTasks.map(task => renderTaskCard(task))}
            </div>
          </div>
        )}

        {subtasks.length > 0 && (
          <div>
            <h3 className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2 flex items-center gap-2">
              <div className="w-3 h-3 bg-gray-500 rounded" />
              Subtasks ({subtasks.length})
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-2">
              {subtasks.map(task => renderTaskCard(task))}
            </div>
          </div>
        )}
      </div>
    );
  };

  const renderTaskCard = (task: Task) => {
    const taskDeps = dependencies.filter(d => d.taskId === task.id);

    return (
      <div
        key={task.id}
        className="p-3 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg hover:shadow-md transition-shadow cursor-pointer"
        onClick={() => onTaskClick?.(task.id)}
      >
        <div className="flex items-center justify-between mb-2">
          <span className="text-xs font-mono text-gray-500 dark:text-gray-400">
            {task.taskId}
          </span>
          {task.riskLevel && task.riskLevel !== 'none' && (
            <AlertTriangle size={14} className="text-orange-500" />
          )}
        </div>
        <div className="font-medium text-sm text-gray-900 dark:text-white mb-1">
          {task.title}
        </div>
        <div className="flex items-center justify-between text-xs text-gray-600 dark:text-gray-400">
          {task.estimatedHours && <span>{task.estimatedHours}h</span>}
          {taskDeps.length > 0 && (
            <span className="flex items-center gap-1">
              <GitBranch size={10} />
              {taskDeps.length}
            </span>
          )}
        </div>
      </div>
    );
  };

  const rootNodes = buildDependencyTree();

  return (
    <div className="w-full h-full flex flex-col">
      {/* Header */}
      <div className="flex items-center justify-between mb-4 pb-3 border-b border-gray-200 dark:border-gray-700">
        <h2 className="text-lg font-bold text-gray-900 dark:text-white flex items-center gap-2">
          <GitBranch size={20} />
          Task Dependencies
        </h2>
        <div className="flex gap-2">
          <button
            onClick={() => setViewMode('tree')}
            className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${
              viewMode === 'tree'
                ? 'bg-black dark:bg-white text-white dark:text-black'
                : 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600'
            }`}
          >
            Tree View
          </button>
          <button
            onClick={() => setViewMode('graph')}
            className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${
              viewMode === 'graph'
                ? 'bg-black dark:bg-white text-white dark:text-black'
                : 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600'
            }`}
          >
            Grid View
          </button>
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto">
        {tasks.length === 0 ? (
          <div className="flex items-center justify-center h-64 text-gray-400 dark:text-gray-500">
            <div className="text-center">
              <GitBranch size={48} className="mx-auto mb-2 opacity-50" />
              <p>No tasks to visualize</p>
            </div>
          </div>
        ) : viewMode === 'tree' ? (
          <div className="space-y-2">
            {rootNodes.map(node => renderTreeNode(node))}
          </div>
        ) : (
          renderGraphView()
        )}
      </div>
    </div>
  );
};
