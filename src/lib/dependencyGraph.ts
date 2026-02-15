// Dependency Visualization System

import { Ticket, Subtask, TaskDependency } from '@/types/taskBreakdown';

export interface GraphNode {
  id: string;
  label: string;
  type: 'epic' | 'ticket' | 'subtask';
  status: 'backlog' | 'in-progress' | 'review' | 'done';
  priority: number;
  assignedTo?: string;
  estimatedHours?: number;
  x?: number;
  y?: number;
}

export interface GraphEdge {
  source: string;
  target: string;
  type: 'blocks' | 'blocked-by' | 'relates-to' | 'parent-child';
  label?: string;
}

export interface DependencyGraph {
  nodes: GraphNode[];
  edges: GraphEdge[];
  criticalPath?: string[]; // IDs of tasks on critical path
  blockedTasks?: string[]; // IDs of currently blocked tasks
}

export interface CriticalPathAnalysis {
  path: string[];
  totalDuration: number;
  bottlenecks: string[];
}

export class DependencyGraphBuilder {
  /**
   * Build a dependency graph from tasks
   */
  static buildGraph(
    tickets: Ticket[],
    subtasks: Subtask[],
    includeSubtasks: boolean = false
  ): DependencyGraph {
    const nodes: GraphNode[] = [];
    const edges: GraphEdge[] = [];

    // Add ticket nodes
    for (const ticket of tickets) {
      nodes.push({
        id: ticket.id,
        label: ticket.title,
        type: 'ticket',
        status: ticket.status,
        priority: ticket.priority,
        assignedTo: ticket.assignedAgentId,
        estimatedHours: ticket.estimatedHours,
      });

      // Add dependencies as edges
      for (const dep of ticket.dependencies) {
        edges.push({
          source: dep.type === 'blocked-by' ? dep.dependsOn : ticket.id,
          target: dep.type === 'blocked-by' ? ticket.id : dep.dependsOn,
          type: dep.type,
          label: dep.description,
        });
      }
    }

    // Add subtask nodes if requested
    if (includeSubtasks) {
      for (const subtask of subtasks) {
        nodes.push({
          id: subtask.id,
          label: subtask.title,
          type: 'subtask',
          status: subtask.status,
          priority: subtask.priority,
          assignedTo: subtask.assignedAgentId,
          estimatedHours: subtask.estimatedHours,
        });

        // Add parent-child edge
        edges.push({
          source: subtask.ticketId,
          target: subtask.id,
          type: 'parent-child',
        });

        // Add dependencies
        for (const dep of subtask.dependencies) {
          edges.push({
            source: dep.type === 'blocked-by' ? dep.dependsOn : subtask.id,
            target: dep.type === 'blocked-by' ? subtask.id : dep.dependsOn,
            type: dep.type,
            label: dep.description,
          });
        }
      }
    }

    // Calculate positions using force-directed layout
    this.calculateLayout(nodes, edges);

    // Find critical path
    const criticalPath = this.findCriticalPath(nodes, edges);

    // Find blocked tasks
    const blockedTasks = this.findBlockedTasks(nodes, edges);

    return {
      nodes,
      edges,
      criticalPath,
      blockedTasks,
    };
  }

  /**
   * Calculate node positions using a simple force-directed layout
   */
  private static calculateLayout(nodes: GraphNode[], edges: GraphEdge[]): void {
    const width = 1200;
    const height = 800;

    // Group nodes by status for better layout
    const statusGroups: Record<string, GraphNode[]> = {
      backlog: [],
      'in-progress': [],
      review: [],
      done: [],
    };

    for (const node of nodes) {
      statusGroups[node.status].push(node);
    }

    let xOffset = 100;
    const columnWidth = width / 4;

    for (const [status, groupNodes] of Object.entries(statusGroups)) {
      const yStep = height / (groupNodes.length + 1);

      groupNodes.forEach((node, index) => {
        node.x = xOffset + (columnWidth / 2);
        node.y = yStep * (index + 1);
      });

      xOffset += columnWidth;
    }
  }

  /**
   * Find the critical path (longest path through the graph)
   */
  private static findCriticalPath(nodes: GraphNode[], edges: GraphEdge[]): string[] {
    const adjacencyList = this.buildAdjacencyList(nodes, edges);
    const durations = new Map<string, number>();

    for (const node of nodes) {
      durations.set(node.id, node.estimatedHours || 0);
    }

    // Find all paths and select the longest
    const allPaths = this.findAllPaths(adjacencyList, nodes);

    let longestPath: string[] = [];
    let maxDuration = 0;

    for (const path of allPaths) {
      const duration = path.reduce((sum, nodeId) => sum + (durations.get(nodeId) || 0), 0);
      if (duration > maxDuration) {
        maxDuration = duration;
        longestPath = path;
      }
    }

    return longestPath;
  }

  /**
   * Build adjacency list from edges
   */
  private static buildAdjacencyList(
    nodes: GraphNode[],
    edges: GraphEdge[]
  ): Map<string, string[]> {
    const adjacencyList = new Map<string, string[]>();

    for (const node of nodes) {
      adjacencyList.set(node.id, []);
    }

    for (const edge of edges) {
      if (edge.type === 'blocks' || edge.type === 'parent-child') {
        const neighbors = adjacencyList.get(edge.source) || [];
        neighbors.push(edge.target);
        adjacencyList.set(edge.source, neighbors);
      }
    }

    return adjacencyList;
  }

  /**
   * Find all paths in the graph
   */
  private static findAllPaths(
    adjacencyList: Map<string, string[]>,
    nodes: GraphNode[]
  ): string[][] {
    const paths: string[][] = [];

    // Find root nodes (nodes with no incoming edges)
    const rootNodes = nodes.filter(node => {
      for (const [_, neighbors] of adjacencyList) {
        if (neighbors.includes(node.id)) return false;
      }
      return true;
    });

    // DFS from each root
    for (const root of rootNodes) {
      this.dfsPath(root.id, adjacencyList, [], paths);
    }

    return paths;
  }

  /**
   * DFS helper to find paths
   */
  private static dfsPath(
    nodeId: string,
    adjacencyList: Map<string, string[]>,
    currentPath: string[],
    allPaths: string[][]
  ): void {
    currentPath.push(nodeId);

    const neighbors = adjacencyList.get(nodeId) || [];

    if (neighbors.length === 0) {
      allPaths.push([...currentPath]);
    } else {
      for (const neighbor of neighbors) {
        if (!currentPath.includes(neighbor)) {
          this.dfsPath(neighbor, adjacencyList, currentPath, allPaths);
        }
      }
    }

    currentPath.pop();
  }

  /**
   * Find currently blocked tasks
   */
  private static findBlockedTasks(nodes: GraphNode[], edges: GraphEdge[]): string[] {
    const blocked: string[] = [];

    for (const edge of edges) {
      if (edge.type === 'blocked-by') {
        const blockingNode = nodes.find(n => n.id === edge.source);
        const blockedNode = nodes.find(n => n.id === edge.target);

        if (blockingNode && blockedNode) {
          if (blockingNode.status !== 'done' && blockedNode.status === 'backlog') {
            blocked.push(blockedNode.id);
          }
        }
      }
    }

    return [...new Set(blocked)];
  }

  /**
   * Analyze critical path
   */
  static analyzeCriticalPath(
    criticalPath: string[],
    nodes: GraphNode[]
  ): CriticalPathAnalysis {
    const totalDuration = criticalPath.reduce((sum, nodeId) => {
      const node = nodes.find(n => n.id === nodeId);
      return sum + (node?.estimatedHours || 0);
    }, 0);

    // Bottlenecks are tasks on critical path that are not yet started or in progress
    const bottlenecks = criticalPath.filter(nodeId => {
      const node = nodes.find(n => n.id === nodeId);
      return node && (node.status === 'backlog' || node.status === 'in-progress');
    });

    return {
      path: criticalPath,
      totalDuration,
      bottlenecks,
    };
  }

  /**
   * Get task dependencies (what tasks depend on this task)
   */
  static getTaskDependents(taskId: string, edges: GraphEdge[]): string[] {
    return edges
      .filter(e => e.source === taskId && e.type === 'blocks')
      .map(e => e.target);
  }

  /**
   * Get task blockers (what tasks are blocking this task)
   */
  static getTaskBlockers(taskId: string, edges: GraphEdge[]): string[] {
    return edges
      .filter(e => e.target === taskId && e.type === 'blocked-by')
      .map(e => e.source);
  }

  /**
   * Check if a task is ready to start (no blockers)
   */
  static isTaskReady(taskId: string, edges: GraphEdge[], nodes: GraphNode[]): boolean {
    const blockers = this.getTaskBlockers(taskId, edges);

    for (const blockerId of blockers) {
      const blocker = nodes.find(n => n.id === blockerId);
      if (blocker && blocker.status !== 'done') {
        return false;
      }
    }

    return true;
  }

  /**
   * Get next available tasks (ready to start)
   */
  static getNextAvailableTasks(nodes: GraphNode[], edges: GraphEdge[]): GraphNode[] {
    return nodes.filter(
      node =>
        node.status === 'backlog' &&
        this.isTaskReady(node.id, edges, nodes)
    );
  }

  /**
   * Export graph to DOT format (for Graphviz)
   */
  static exportToDot(graph: DependencyGraph): string {
    let dot = 'digraph DependencyGraph {\n';
    dot += '  rankdir=LR;\n';
    dot += '  node [shape=box, style=rounded];\n\n';

    // Add nodes
    for (const node of graph.nodes) {
      const color = this.getNodeColor(node.status);
      const shape = node.type === 'epic' ? 'box3d' : 'box';
      dot += `  "${node.id}" [label="${node.label}", fillcolor="${color}", style="filled,rounded", shape="${shape}"];\n`;
    }

    dot += '\n';

    // Add edges
    for (const edge of graph.edges) {
      const style = edge.type === 'parent-child' ? 'dashed' : 'solid';
      const label = edge.label ? ` [label="${edge.label}"]` : '';
      dot += `  "${edge.source}" -> "${edge.target}" [style="${style}"${label}];\n`;
    }

    dot += '}\n';

    return dot;
  }

  /**
   * Get color based on status
   */
  private static getNodeColor(status: string): string {
    switch (status) {
      case 'done': return '#90EE90';
      case 'review': return '#FFD700';
      case 'in-progress': return '#87CEEB';
      case 'backlog': return '#D3D3D3';
      default: return '#FFFFFF';
    }
  }

  /**
   * Export graph to Mermaid format
   */
  static exportToMermaid(graph: DependencyGraph): string {
    let mermaid = 'graph LR\n';

    // Add nodes with styling
    for (const node of graph.nodes) {
      const statusClass = node.status.replace('-', '_');
      mermaid += `  ${node.id}["${node.label}"]:::${statusClass}\n`;
    }

    mermaid += '\n';

    // Add edges
    for (const edge of graph.edges) {
      const arrow = edge.type === 'parent-child' ? '-..->' : '-->';
      const label = edge.label ? `|${edge.label}|` : '';
      mermaid += `  ${edge.source} ${arrow}${label} ${edge.target}\n`;
    }

    mermaid += '\n';

    // Add styling
    mermaid += 'classDef backlog fill:#D3D3D3\n';
    mermaid += 'classDef in_progress fill:#87CEEB\n';
    mermaid += 'classDef review fill:#FFD700\n';
    mermaid += 'classDef done fill:#90EE90\n';

    return mermaid;
  }
}
