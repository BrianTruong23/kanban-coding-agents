import { Task, TaskDependency } from '@/types/task';

export interface DependencyNode {
  taskId: string;
  task: Task;
  dependencies: string[]; // IDs of tasks this depends on
  dependents: string[]; // IDs of tasks that depend on this
  level: number; // Depth in the dependency tree
  canStart: boolean; // Whether all dependencies are satisfied
}

export interface DependencyPath {
  from: string;
  to: string;
  path: string[];
}

export interface CriticalPath {
  tasks: Task[];
  totalHours: number;
}

/**
 * Dependency Graph Service
 * Manages and analyzes task dependencies
 */
export class DependencyGraphService {
  /**
   * Build a dependency graph from tasks
   */
  static buildGraph(tasks: Task[]): Map<string, DependencyNode> {
    const graph = new Map<string, DependencyNode>();

    // Initialize nodes
    tasks.forEach(task => {
      const dependencies: string[] = [];
      const dependents: string[] = [];

      // Add dependencies from the task
      if (task.dependencies) {
        task.dependencies.forEach(dep => {
          if (dep.type === 'blocked-by') {
            dependencies.push(dep.taskId);
          } else if (dep.type === 'blocks') {
            dependents.push(dep.taskId);
          }
        });
      }

      // Add parent-child relationships
      if (task.parentId) {
        // Subtasks depend on nothing by default, but parent context
      }

      graph.set(task.id, {
        taskId: task.id,
        task,
        dependencies,
        dependents,
        level: 0,
        canStart: dependencies.length === 0,
      });
    });

    // Build bidirectional links
    tasks.forEach(task => {
      if (task.dependencies) {
        task.dependencies.forEach(dep => {
          if (dep.type === 'blocked-by') {
            const depNode = graph.get(dep.taskId);
            if (depNode && !depNode.dependents.includes(task.id)) {
              depNode.dependents.push(task.id);
            }
          } else if (dep.type === 'blocks') {
            const depNode = graph.get(dep.taskId);
            if (depNode && !depNode.dependencies.includes(task.id)) {
              depNode.dependencies.push(task.id);
            }
          }
        });
      }
    });

    // Calculate levels
    this.calculateLevels(graph);

    // Update canStart status
    graph.forEach(node => {
      node.canStart = this.canTaskStart(node, graph);
    });

    return graph;
  }

  /**
   * Calculate level of each node in the graph (for visualization)
   */
  private static calculateLevels(graph: Map<string, DependencyNode>): void {
    const visited = new Set<string>();
    const visiting = new Set<string>();

    const visit = (nodeId: string): number => {
      if (visited.has(nodeId)) {
        const node = graph.get(nodeId);
        return node?.level || 0;
      }

      if (visiting.has(nodeId)) {
        // Circular dependency detected
        return 0;
      }

      visiting.add(nodeId);

      const node = graph.get(nodeId);
      if (!node) {
        return 0;
      }

      let maxDepLevel = -1;
      node.dependencies.forEach(depId => {
        const depLevel = visit(depId);
        maxDepLevel = Math.max(maxDepLevel, depLevel);
      });

      node.level = maxDepLevel + 1;
      visiting.delete(nodeId);
      visited.add(nodeId);

      return node.level;
    };

    graph.forEach((_, nodeId) => {
      if (!visited.has(nodeId)) {
        visit(nodeId);
      }
    });
  }

  /**
   * Check if a task can start (all dependencies completed)
   */
  private static canTaskStart(node: DependencyNode, graph: Map<string, DependencyNode>): boolean {
    if (node.dependencies.length === 0) {
      return true;
    }

    return node.dependencies.every(depId => {
      const depNode = graph.get(depId);
      return depNode?.task.status === 'done';
    });
  }

  /**
   * Get all tasks that are ready to start
   */
  static getReadyTasks(tasks: Task[]): Task[] {
    const graph = this.buildGraph(tasks);
    const ready: Task[] = [];

    graph.forEach(node => {
      if (node.canStart && node.task.status === 'backlog') {
        ready.push(node.task);
      }
    });

    return ready;
  }

  /**
   * Get blocking tasks (tasks that block others from starting)
   */
  static getBlockingTasks(task: Task, tasks: Task[]): Task[] {
    const graph = this.buildGraph(tasks);
    const node = graph.get(task.id);

    if (!node) {
      return [];
    }

    return node.dependencies
      .map(depId => graph.get(depId)?.task)
      .filter((t): t is Task => t !== undefined && t.status !== 'done');
  }

  /**
   * Get blocked tasks (tasks blocked by this task)
   */
  static getBlockedTasks(task: Task, tasks: Task[]): Task[] {
    const graph = this.buildGraph(tasks);
    const node = graph.get(task.id);

    if (!node) {
      return [];
    }

    return node.dependents
      .map(depId => graph.get(depId)?.task)
      .filter((t): t is Task => t !== undefined);
  }

  /**
   * Find critical path (longest path of dependent tasks)
   */
  static findCriticalPath(tasks: Task[]): CriticalPath {
    const graph = this.buildGraph(tasks);
    let longestPath: Task[] = [];
    let maxHours = 0;

    // Find all leaf nodes (no dependents)
    const leafNodes: DependencyNode[] = [];
    graph.forEach(node => {
      if (node.dependents.length === 0) {
        leafNodes.push(node);
      }
    });

    // For each leaf, trace back to find longest path
    leafNodes.forEach(leaf => {
      const { path, hours } = this.findLongestPath(leaf, graph);
      if (hours > maxHours) {
        maxHours = hours;
        longestPath = path;
      }
    });

    return {
      tasks: longestPath,
      totalHours: maxHours,
    };
  }

  /**
   * Find longest path from a node to root
   */
  private static findLongestPath(
    node: DependencyNode,
    graph: Map<string, DependencyNode>
  ): { path: Task[]; hours: number } {
    const taskHours = node.task.estimatedHours || 0;

    if (node.dependencies.length === 0) {
      return {
        path: [node.task],
        hours: taskHours,
      };
    }

    let longestSubPath: Task[] = [];
    let maxSubHours = 0;

    node.dependencies.forEach(depId => {
      const depNode = graph.get(depId);
      if (depNode) {
        const { path, hours } = this.findLongestPath(depNode, graph);
        if (hours > maxSubHours) {
          maxSubHours = hours;
          longestSubPath = path;
        }
      }
    });

    return {
      path: [...longestSubPath, node.task],
      hours: maxSubHours + taskHours,
    };
  }

  /**
   * Detect circular dependencies
   */
  static detectCircularDependencies(tasks: Task[]): string[][] {
    const graph = this.buildGraph(tasks);
    const cycles: string[][] = [];
    const visited = new Set<string>();
    const recursionStack = new Set<string>();

    const detectCycle = (nodeId: string, path: string[]): void => {
      if (recursionStack.has(nodeId)) {
        // Found a cycle
        const cycleStart = path.indexOf(nodeId);
        cycles.push(path.slice(cycleStart));
        return;
      }

      if (visited.has(nodeId)) {
        return;
      }

      visited.add(nodeId);
      recursionStack.add(nodeId);

      const node = graph.get(nodeId);
      if (node) {
        node.dependencies.forEach(depId => {
          detectCycle(depId, [...path, nodeId]);
        });
      }

      recursionStack.delete(nodeId);
    };

    graph.forEach((_, nodeId) => {
      if (!visited.has(nodeId)) {
        detectCycle(nodeId, []);
      }
    });

    return cycles;
  }

  /**
   * Get dependency visualization data (for rendering)
   */
  static getVisualizationData(tasks: Task[]): {
    nodes: { id: string; label: string; level: number; status: string }[];
    edges: { from: string; to: string; type: string }[];
  } {
    const graph = this.buildGraph(tasks);

    const nodes = Array.from(graph.values()).map(node => ({
      id: node.taskId,
      label: node.task.taskId || node.task.title.slice(0, 20),
      level: node.level,
      status: node.task.status,
    }));

    const edges: { from: string; to: string; type: string }[] = [];
    graph.forEach(node => {
      node.dependencies.forEach(depId => {
        edges.push({
          from: depId,
          to: node.taskId,
          type: 'blocks',
        });
      });
    });

    return { nodes, edges };
  }

  /**
   * Add dependency between tasks
   */
  static addDependency(
    task: Task,
    dependsOnTaskId: string,
    type: 'blocks' | 'blocked-by' | 'relates-to' = 'blocked-by'
  ): Task {
    const dependencies = task.dependencies || [];

    // Check if dependency already exists
    const exists = dependencies.some(
      dep => dep.taskId === dependsOnTaskId && dep.type === type
    );

    if (exists) {
      return task;
    }

    return {
      ...task,
      dependencies: [...dependencies, { taskId: dependsOnTaskId, type }],
    };
  }

  /**
   * Remove dependency from task
   */
  static removeDependency(task: Task, dependencyTaskId: string): Task {
    if (!task.dependencies) {
      return task;
    }

    return {
      ...task,
      dependencies: task.dependencies.filter(dep => dep.taskId !== dependencyTaskId),
    };
  }

  /**
   * Get task hierarchy (epics -> tickets -> subtasks)
   */
  static getTaskHierarchy(tasks: Task[]): Map<string, Task[]> {
    const hierarchy = new Map<string, Task[]>();

    // Group by parent
    tasks.forEach(task => {
      const parentId = task.parentId || 'root';
      const children = hierarchy.get(parentId) || [];
      children.push(task);
      hierarchy.set(parentId, children);
    });

    return hierarchy;
  }

  /**
   * Get all descendants of a task
   */
  static getDescendants(task: Task, tasks: Task[]): Task[] {
    const descendants: Task[] = [];
    const queue = [task.id];

    while (queue.length > 0) {
      const currentId = queue.shift()!;
      const children = tasks.filter(t => t.parentId === currentId);

      children.forEach(child => {
        descendants.push(child);
        queue.push(child.id);
      });
    }

    return descendants;
  }

  /**
   * Get all ancestors of a task
   */
  static getAncestors(task: Task, tasks: Task[]): Task[] {
    const ancestors: Task[] = [];
    let current = task;

    while (current.parentId) {
      const parent = tasks.find(t => t.id === current.parentId);
      if (!parent) break;

      ancestors.push(parent);
      current = parent;
    }

    return ancestors;
  }
}
