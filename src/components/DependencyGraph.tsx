'use client';

import { useEffect, useRef } from 'react';
import { Task, TaskDependency } from '@/types/task';
import { X, GitBranch } from 'lucide-react';

interface DependencyGraphProps {
  tasks: Task[];
  dependencies: TaskDependency[];
  onClose: () => void;
}

export const DependencyGraph = ({ tasks, dependencies, onClose }: DependencyGraphProps) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    if (!canvasRef.current) return;

    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Set canvas size
    const rect = canvas.getBoundingClientRect();
    canvas.width = rect.width * window.devicePixelRatio;
    canvas.height = rect.height * window.devicePixelRatio;
    ctx.scale(window.devicePixelRatio, window.devicePixelRatio);

    // Clear canvas
    ctx.clearRect(0, 0, rect.width, rect.height);

    // Create a map of task IDs to positions
    const taskPositions = new Map<string, { x: number; y: number }>();

    // Layout tasks in layers based on dependencies
    const layers = layoutTasksInLayers(tasks, dependencies);

    const layerHeight = rect.height / (layers.length + 1);
    const nodeRadius = 30;

    layers.forEach((layer, layerIndex) => {
      const y = (layerIndex + 1) * layerHeight;
      const layerWidth = rect.width / (layer.length + 1);

      layer.forEach((task, taskIndex) => {
        const x = (taskIndex + 1) * layerWidth;
        taskPositions.set(task.id, { x, y });
      });
    });

    // Draw dependency lines
    ctx.strokeStyle = '#9ca3af';
    ctx.lineWidth = 2;

    dependencies.forEach((dep) => {
      const fromPos = taskPositions.get(dep.dependsOnTaskId);
      const toPos = taskPositions.get(dep.taskId);

      if (fromPos && toPos) {
        ctx.beginPath();
        ctx.moveTo(fromPos.x, fromPos.y);
        ctx.lineTo(toPos.x, toPos.y);
        ctx.stroke();

        // Draw arrow
        const angle = Math.atan2(toPos.y - fromPos.y, toPos.x - fromPos.x);
        const arrowLength = 10;
        ctx.beginPath();
        ctx.moveTo(toPos.x, toPos.y);
        ctx.lineTo(
          toPos.x - arrowLength * Math.cos(angle - Math.PI / 6),
          toPos.y - arrowLength * Math.sin(angle - Math.PI / 6)
        );
        ctx.moveTo(toPos.x, toPos.y);
        ctx.lineTo(
          toPos.x - arrowLength * Math.cos(angle + Math.PI / 6),
          toPos.y - arrowLength * Math.sin(angle + Math.PI / 6)
        );
        ctx.stroke();
      }
    });

    // Draw task nodes
    tasks.forEach((task) => {
      const pos = taskPositions.get(task.id);
      if (!pos) return;

      // Node circle
      const taskTypeColors: Record<string, string> = {
        epic: '#9333ea',
        story: '#3b82f6',
        subtask: '#6b7280',
      };

      ctx.fillStyle = taskTypeColors[task.taskType] || '#6b7280';
      ctx.beginPath();
      ctx.arc(pos.x, pos.y, nodeRadius, 0, Math.PI * 2);
      ctx.fill();

      // Task ID text
      ctx.fillStyle = '#ffffff';
      ctx.font = 'bold 10px sans-serif';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText(task.taskId, pos.x, pos.y);
    });
  }, [tasks, dependencies]);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
      <div className="bg-white dark:bg-gray-800 p-6 rounded-xl w-full max-w-6xl h-[80vh] shadow-xl flex flex-col">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h2 className="text-xl font-bold text-gray-900 dark:text-white flex items-center gap-2">
              <GitBranch className="text-blue-500" />
              Task Dependency Graph
            </h2>
            <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
              Visualize task dependencies and relationships
            </p>
          </div>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
          >
            <X size={24} />
          </button>
        </div>

        <div className="flex-1 border border-gray-200 dark:border-gray-700 rounded-lg bg-gray-50 dark:bg-gray-900 overflow-hidden relative">
          <canvas ref={canvasRef} className="w-full h-full" />

          {tasks.length === 0 && (
            <div className="absolute inset-0 flex items-center justify-center">
              <div className="text-center text-gray-400 dark:text-gray-500">
                <GitBranch size={48} className="mx-auto mb-2 opacity-50" />
                <p>No tasks to visualize</p>
              </div>
            </div>
          )}
        </div>

        <div className="mt-4 flex items-center gap-4 text-sm">
          <div className="flex items-center gap-2">
            <div className="w-4 h-4 rounded-full bg-purple-600"></div>
            <span className="text-gray-600 dark:text-gray-400">Epic</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-4 h-4 rounded-full bg-blue-600"></div>
            <span className="text-gray-600 dark:text-gray-400">Story</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-4 h-4 rounded-full bg-gray-600"></div>
            <span className="text-gray-600 dark:text-gray-400">Subtask</span>
          </div>
        </div>

        {dependencies.length > 0 && (
          <div className="mt-4 p-3 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg">
            <div className="text-sm font-medium text-blue-900 dark:text-blue-200">
              {dependencies.length} Dependenc{dependencies.length !== 1 ? 'ies' : 'y'}
            </div>
            <div className="text-xs text-blue-700 dark:text-blue-300 mt-1 space-y-1">
              {dependencies.slice(0, 5).map((dep, i) => {
                const fromTask = tasks.find((t) => t.id === dep.dependsOnTaskId);
                const toTask = tasks.find((t) => t.id === dep.taskId);
                return (
                  <div key={i}>
                    {fromTask?.taskId} → {toTask?.taskId}
                  </div>
                );
              })}
              {dependencies.length > 5 && (
                <div className="text-xs opacity-70">
                  +{dependencies.length - 5} more...
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

/**
 * Layout tasks in layers for visualization
 * Tasks with no dependencies are in layer 0
 * Tasks that depend on layer N tasks are in layer N+1
 */
function layoutTasksInLayers(tasks: Task[], dependencies: TaskDependency[]): Task[][] {
  const layers: Task[][] = [];
  const taskLayers = new Map<string, number>();
  const processed = new Set<string>();

  // Helper to get dependencies for a task
  const getDependencies = (taskId: string): string[] => {
    return dependencies
      .filter((d) => d.taskId === taskId)
      .map((d) => d.dependsOnTaskId);
  };

  // Process tasks in order
  const processTask = (task: Task): number => {
    if (processed.has(task.id)) {
      return taskLayers.get(task.id) || 0;
    }

    const deps = getDependencies(task.id);

    if (deps.length === 0) {
      // No dependencies, goes in layer 0
      taskLayers.set(task.id, 0);
      processed.add(task.id);
      return 0;
    }

    // Find max layer of dependencies
    let maxDepLayer = -1;
    deps.forEach((depId) => {
      const depTask = tasks.find((t) => t.id === depId);
      if (depTask) {
        const depLayer = processTask(depTask);
        maxDepLayer = Math.max(maxDepLayer, depLayer);
      }
    });

    const layer = maxDepLayer + 1;
    taskLayers.set(task.id, layer);
    processed.add(task.id);
    return layer;
  };

  // Process all tasks
  tasks.forEach((task) => processTask(task));

  // Group tasks by layer
  tasks.forEach((task) => {
    const layer = taskLayers.get(task.id) || 0;
    if (!layers[layer]) {
      layers[layer] = [];
    }
    layers[layer].push(task);
  });

  return layers.filter((layer) => layer.length > 0);
}
