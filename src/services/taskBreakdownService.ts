import { TaskBreakdownInput, TaskBreakdownResult, RiskFlag, DependencyNode } from '@/types/epic';
import { generateId } from '@/lib/utils';

/**
 * Service for analyzing and breaking down tasks into epics, tickets, and subtasks
 */
export class TaskBreakdownService {
  /**
   * Analyzes input (issue/PRD/screenshot) and breaks it down into structured tasks
   */
  static async breakdownTask(input: TaskBreakdownInput): Promise<TaskBreakdownResult> {
    const analysis = this.analyzeContent(input);

    const epic = {
      title: analysis.title,
      description: analysis.description,
      status: 'planned' as const,
      priority: analysis.priority,
    };

    const tickets = analysis.features.map((feature, index) => ({
      taskId: `TICKET-${index + 1}`,
      title: feature.title,
      description: feature.description,
      status: 'backlog' as const,
      priority: feature.priority,
      definitionOfDone: feature.dod,
      testNotes: feature.testNotes,
      riskFlags: feature.risks,
      dependencies: feature.dependencies,
      estimatedHours: feature.estimatedHours,
      tags: feature.tags,
      sprint: undefined,
    }));

    const dependencyGraph = this.buildDependencyGraph(tickets);
    const suggestedAssignments = new Map<string, string>();

    return {
      epic,
      tickets,
      suggestedAssignments,
      dependencyGraph,
    };
  }

  /**
   * Analyzes content to extract features and requirements
   */
  private static analyzeContent(input: TaskBreakdownInput) {
    const content = input.content.toLowerCase();

    // Extract title from first line or first sentence
    const lines = input.content.split('\n').filter(l => l.trim());
    const title = lines[0]?.trim() || 'Untitled Epic';

    // Determine priority based on keywords
    const priority = this.detectPriority(content);

    // Extract features from content
    const features = this.extractFeatures(input.content, input.type);

    return {
      title: title.replace(/^#+\s*/, ''), // Remove markdown headers
      description: input.content,
      priority,
      features,
    };
  }

  /**
   * Detects priority based on keywords in content
   */
  private static detectPriority(content: string): 1 | 2 | 3 | 4 | 5 {
    if (content.includes('critical') || content.includes('urgent') || content.includes('blocker')) {
      return 5;
    }
    if (content.includes('high priority') || content.includes('important')) {
      return 4;
    }
    if (content.includes('low priority') || content.includes('nice to have')) {
      return 2;
    }
    return 3; // default medium
  }

  /**
   * Extracts features from content and structures them
   */
  private static extractFeatures(content: string, type: string) {
    const features = [];

    // Look for numbered lists, bullet points, or sections
    const sections = this.splitIntoSections(content);

    for (const section of sections) {
      if (section.trim().length < 10) continue; // Skip too short sections

      const feature = {
        title: this.extractFeatureTitle(section),
        description: section,
        priority: this.detectPriority(section) as 1 | 2 | 3 | 4 | 5,
        dod: this.generateDoD(section),
        testNotes: this.generateTestNotes(section),
        risks: this.identifyRisks(section),
        dependencies: [] as string[],
        estimatedHours: this.estimateEffort(section),
        tags: this.extractTags(section),
      };

      features.push(feature);
    }

    // If no features extracted, create at least one
    if (features.length === 0) {
      features.push({
        title: 'Main Implementation',
        description: content,
        priority: 3 as const,
        dod: ['Implementation completed', 'Code reviewed', 'Tests passing'],
        testNotes: 'Manual testing required',
        risks: [],
        dependencies: [],
        estimatedHours: 8,
        tags: ['feature'],
      });
    }

    return features;
  }

  /**
   * Splits content into logical sections
   */
  private static splitIntoSections(content: string): string[] {
    // Split by headers, numbered items, or bullet points
    const patterns = [
      /\n#+\s+/,  // Markdown headers
      /\n\d+\.\s+/,  // Numbered lists
      /\n[-*]\s+/,  // Bullet points
    ];

    let sections = [content];

    for (const pattern of patterns) {
      const newSections = [];
      for (const section of sections) {
        const parts = section.split(pattern);
        newSections.push(...parts.filter(p => p.trim()));
      }
      if (newSections.length > sections.length) {
        sections = newSections;
        break;
      }
    }

    return sections;
  }

  /**
   * Extracts a feature title from section content
   */
  private static extractFeatureTitle(section: string): string {
    const lines = section.split('\n').filter(l => l.trim());
    if (lines.length === 0) return 'Untitled Feature';

    const firstLine = lines[0].trim();
    // Clean up markdown, numbers, bullets
    return firstLine
      .replace(/^#+\s*/, '')
      .replace(/^\d+\.\s*/, '')
      .replace(/^[-*]\s*/, '')
      .substring(0, 80);
  }

  /**
   * Generates Definition of Done based on content analysis
   */
  private static generateDoD(content: string): string[] {
    const dod = ['Implementation completed', 'Code reviewed'];

    const lower = content.toLowerCase();

    if (lower.includes('test') || lower.includes('spec')) {
      dod.push('Unit tests written and passing');
      dod.push('Integration tests passing');
    }

    if (lower.includes('api') || lower.includes('endpoint')) {
      dod.push('API documentation updated');
    }

    if (lower.includes('ui') || lower.includes('component') || lower.includes('interface')) {
      dod.push('UI/UX approved');
      dod.push('Responsive design verified');
    }

    if (lower.includes('database') || lower.includes('schema') || lower.includes('migration')) {
      dod.push('Database migration tested');
    }

    if (lower.includes('deploy') || lower.includes('production')) {
      dod.push('Deployment plan reviewed');
    }

    dod.push('Documentation updated');

    return dod;
  }

  /**
   * Generates test notes based on content
   */
  private static generateTestNotes(content: string): string {
    const notes = [];
    const lower = content.toLowerCase();

    if (lower.includes('authentication') || lower.includes('login') || lower.includes('auth')) {
      notes.push('Test authentication flows');
    }

    if (lower.includes('api')) {
      notes.push('Test all API endpoints');
      notes.push('Verify error handling');
    }

    if (lower.includes('form')) {
      notes.push('Test form validation');
      notes.push('Test edge cases for input fields');
    }

    if (lower.includes('performance')) {
      notes.push('Run performance benchmarks');
    }

    if (lower.includes('security')) {
      notes.push('Security audit required');
    }

    if (notes.length === 0) {
      notes.push('Manual testing required');
      notes.push('Verify expected behavior');
    }

    return notes.join('\n');
  }

  /**
   * Identifies potential risks in the feature
   */
  private static identifyRisks(content: string): RiskFlag[] {
    const risks: RiskFlag[] = [];
    const lower = content.toLowerCase();

    // Technical risks
    if (lower.includes('migration') || lower.includes('refactor')) {
      risks.push({
        id: generateId(),
        type: 'technical',
        severity: 'high',
        description: 'Code migration may introduce breaking changes',
        mitigationPlan: 'Comprehensive testing and gradual rollout',
        createdAt: Date.now(),
      });
    }

    // Dependency risks
    if (lower.includes('third-party') || lower.includes('library') || lower.includes('integration')) {
      risks.push({
        id: generateId(),
        type: 'dependency',
        severity: 'medium',
        description: 'Relies on external dependencies',
        mitigationPlan: 'Monitor dependency health and have fallback options',
        createdAt: Date.now(),
      });
    }

    // Timeline risks
    if (lower.includes('complex') || lower.includes('large') || lower.includes('extensive')) {
      risks.push({
        id: generateId(),
        type: 'timeline',
        severity: 'medium',
        description: 'Feature complexity may extend timeline',
        mitigationPlan: 'Break into smaller milestones and review progress regularly',
        createdAt: Date.now(),
      });
    }

    // Security risks
    if (lower.includes('authentication') || lower.includes('security') || lower.includes('password') ||
        lower.includes('token') || lower.includes('data privacy')) {
      risks.push({
        id: generateId(),
        type: 'security',
        severity: 'critical',
        description: 'Security-sensitive feature requires careful review',
        mitigationPlan: 'Security audit and penetration testing before deployment',
        createdAt: Date.now(),
      });
    }

    // Performance risks
    if (lower.includes('performance') || lower.includes('optimization') || lower.includes('scale')) {
      risks.push({
        id: generateId(),
        type: 'performance',
        severity: 'medium',
        description: 'Performance considerations need attention',
        mitigationPlan: 'Load testing and performance monitoring',
        createdAt: Date.now(),
      });
    }

    return risks;
  }

  /**
   * Estimates effort in hours based on content complexity
   */
  private static estimateEffort(content: string): number {
    const words = content.split(/\s+/).length;
    const lower = content.toLowerCase();

    let baseHours = 4;

    // Adjust based on content length
    if (words > 200) baseHours += 4;
    else if (words > 100) baseHours += 2;

    // Adjust based on complexity keywords
    const complexityKeywords = ['complex', 'advanced', 'extensive', 'multiple', 'integration'];
    const complexityCount = complexityKeywords.filter(kw => lower.includes(kw)).length;
    baseHours += complexityCount * 2;

    // Adjust based on technical areas
    if (lower.includes('database') || lower.includes('migration')) baseHours += 4;
    if (lower.includes('authentication') || lower.includes('security')) baseHours += 4;
    if (lower.includes('testing') || lower.includes('test')) baseHours += 2;

    return Math.min(baseHours, 40); // Cap at 40 hours for a single ticket
  }

  /**
   * Extracts relevant tags from content
   */
  private static extractTags(content: string): string[] {
    const tags: string[] = [];
    const lower = content.toLowerCase();

    // Technical tags
    if (lower.includes('frontend') || lower.includes('ui') || lower.includes('component')) tags.push('frontend');
    if (lower.includes('backend') || lower.includes('api') || lower.includes('server')) tags.push('backend');
    if (lower.includes('database') || lower.includes('sql')) tags.push('database');
    if (lower.includes('devops') || lower.includes('deploy') || lower.includes('ci/cd')) tags.push('devops');
    if (lower.includes('mobile') || lower.includes('ios') || lower.includes('android')) tags.push('mobile');
    if (lower.includes('test')) tags.push('testing');
    if (lower.includes('security')) tags.push('security');
    if (lower.includes('performance') || lower.includes('optimization')) tags.push('performance');

    // Type tags
    if (lower.includes('bug') || lower.includes('fix') || lower.includes('issue')) tags.push('bug');
    else if (lower.includes('feature') || lower.includes('implement')) tags.push('feature');
    if (lower.includes('refactor') || lower.includes('improve')) tags.push('refactor');
    if (lower.includes('documentation') || lower.includes('docs')) tags.push('documentation');

    // Priority tags
    if (lower.includes('urgent') || lower.includes('critical')) tags.push('urgent');

    // Default if no tags
    if (tags.length === 0) tags.push('feature');

    return [...new Set(tags)]; // Remove duplicates
  }

  /**
   * Builds a dependency graph from tickets
   */
  private static buildDependencyGraph(tickets: any[]): DependencyNode[] {
    return tickets.map(ticket => ({
      ticketId: ticket.taskId,
      title: ticket.title,
      dependsOn: ticket.dependencies || [],
      blockedBy: [],
      criticalPath: false,
    }));
  }

  /**
   * Analyzes dependencies and identifies critical path
   */
  static analyzeDependencies(tickets: any[]): DependencyNode[] {
    const graph = this.buildDependencyGraph(tickets);

    // Calculate blockedBy relationships
    graph.forEach(node => {
      node.blockedBy = graph
        .filter(other => other.dependsOn.includes(node.ticketId))
        .map(other => other.ticketId);
    });

    // Identify critical path (simplified - could use more sophisticated algorithm)
    const calculateDepth = (nodeId: string, visited = new Set<string>()): number => {
      if (visited.has(nodeId)) return 0;
      visited.add(nodeId);

      const node = graph.find(n => n.ticketId === nodeId);
      if (!node || node.dependsOn.length === 0) return 1;

      return 1 + Math.max(...node.dependsOn.map(depId => calculateDepth(depId, new Set(visited))));
    };

    const depths = graph.map(node => ({
      id: node.ticketId,
      depth: calculateDepth(node.ticketId),
    }));

    const maxDepth = Math.max(...depths.map(d => d.depth));

    // Mark nodes on critical path
    graph.forEach(node => {
      const depth = depths.find(d => d.id === node.ticketId)?.depth || 0;
      node.criticalPath = depth >= maxDepth - 1;
    });

    return graph;
  }
}
