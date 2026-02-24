import { TaskBreakdownRequest, TaskBreakdownResult, RiskFlag } from '@/types/epic';

/**
 * Analyzes text content to break down into epics, tasks, and subtasks
 * This is a rule-based implementation that can be enhanced with AI in the future
 */
export class TaskBreakdownService {
  /**
   * Breaks down an issue/PRD/screenshot into structured tasks
   */
  async breakdownTask(request: TaskBreakdownRequest): Promise<TaskBreakdownResult> {
    const content = request.content.toLowerCase();
    const lines = request.content.split('\n').filter(line => line.trim().length > 0);

    // Analyze content to extract tasks and requirements
    const analysis = this.analyzeContent(lines, content);

    // Generate epic if content is substantial
    const epic = analysis.isLargeProject ? this.generateEpic(request, analysis) : undefined;

    // Generate tasks from analysis
    const tasks = this.generateTasks(analysis, request.type);

    // Generate dependencies
    this.addDependencies(tasks, analysis);

    return {
      epic,
      tasks,
      suggestedAgentAssignments: this.generateAgentSuggestions(tasks),
    };
  }

  private analyzeContent(lines: string[], content: string) {
    // Detect features/requirements
    const features: string[] = [];
    const requirements: string[] = [];
    const technicalDetails: string[] = [];
    const testingNotes: string[] = [];
    const risks: string[] = [];

    // Keywords for categorization
    const featureKeywords = ['feature', 'implement', 'add', 'create', 'build', 'develop'];
    const requirementKeywords = ['must', 'should', 'need', 'require', 'necessary'];
    const technicalKeywords = ['api', 'database', 'frontend', 'backend', 'ui', 'ux', 'component', 'service'];
    const testKeywords = ['test', 'verify', 'validate', 'check', 'ensure'];
    const riskKeywords = ['risk', 'concern', 'issue', 'problem', 'challenge', 'blocker', 'dependency'];

    lines.forEach(line => {
      const lower = line.toLowerCase();

      if (featureKeywords.some(kw => lower.includes(kw))) {
        features.push(line.trim());
      }
      if (requirementKeywords.some(kw => lower.includes(kw))) {
        requirements.push(line.trim());
      }
      if (technicalKeywords.some(kw => lower.includes(kw))) {
        technicalDetails.push(line.trim());
      }
      if (testKeywords.some(kw => lower.includes(kw))) {
        testingNotes.push(line.trim());
      }
      if (riskKeywords.some(kw => lower.includes(kw))) {
        risks.push(line.trim());
      }
    });

    // Detect numbered or bulleted lists
    const bulletPoints = lines.filter(line =>
      /^[\s]*[-*•]/.test(line) || /^[\s]*\d+\./.test(line)
    );

    // Determine project size
    const isLargeProject = features.length > 5 || bulletPoints.length > 8 || lines.length > 20;

    // Extract technologies mentioned
    const technologies = this.extractTechnologies(content);

    return {
      features,
      requirements,
      technicalDetails,
      testingNotes,
      risks,
      bulletPoints,
      isLargeProject,
      technologies,
      totalLines: lines.length,
    };
  }

  private extractTechnologies(content: string): string[] {
    const techPatterns = [
      'react', 'vue', 'angular', 'svelte', 'next.js', 'nuxt',
      'node', 'express', 'fastify', 'nest.js',
      'typescript', 'javascript', 'python', 'java', 'go', 'rust',
      'postgres', 'mysql', 'mongodb', 'redis', 'supabase', 'firebase',
      'docker', 'kubernetes', 'aws', 'gcp', 'azure',
      'graphql', 'rest', 'grpc', 'websocket',
      'jest', 'vitest', 'playwright', 'cypress',
    ];

    return techPatterns.filter(tech =>
      content.toLowerCase().includes(tech)
    );
  }

  private generateEpic(request: TaskBreakdownRequest, analysis: any) {
    const title = this.extractTitle(request.content) || 'New Project Initiative';

    return {
      title,
      description: request.content.substring(0, 500),
      status: 'planning' as const,
      priority: this.determinePriority(analysis),
      tags: this.generateTags(analysis),
    };
  }

  private extractTitle(content: string): string | null {
    const lines = content.split('\n');

    // Look for markdown headers
    for (const line of lines) {
      if (line.startsWith('#')) {
        return line.replace(/^#+\s*/, '').trim();
      }
    }

    // Use first non-empty line
    const firstLine = lines.find(l => l.trim().length > 0);
    return firstLine ? firstLine.trim().substring(0, 100) : null;
  }

  private determinePriority(analysis: any): 1 | 2 | 3 | 4 | 5 {
    const content = [
      ...analysis.features,
      ...analysis.requirements,
      ...analysis.risks
    ].join(' ').toLowerCase();

    if (content.includes('critical') || content.includes('urgent') || content.includes('asap')) {
      return 5;
    }
    if (content.includes('important') || content.includes('high priority')) {
      return 4;
    }
    if (content.includes('low priority') || content.includes('nice to have')) {
      return 2;
    }
    return 3; // Default medium priority
  }

  private generateTags(analysis: any): string[] {
    const tags: string[] = [];

    // Add technology tags
    tags.push(...analysis.technologies);

    // Add category tags based on content
    const content = analysis.features.join(' ') + analysis.technicalDetails.join(' ');
    const lower = content.toLowerCase();

    if (lower.includes('frontend') || lower.includes('ui') || lower.includes('component')) {
      tags.push('frontend');
    }
    if (lower.includes('backend') || lower.includes('api') || lower.includes('server')) {
      tags.push('backend');
    }
    if (lower.includes('database') || lower.includes('db') || lower.includes('sql')) {
      tags.push('database');
    }
    if (lower.includes('test') || lower.includes('qa')) {
      tags.push('testing');
    }
    if (lower.includes('deploy') || lower.includes('devops') || lower.includes('ci/cd')) {
      tags.push('devops');
    }

    return [...new Set(tags)]; // Remove duplicates
  }

  private generateTasks(analysis: any, requestType: string) {
    const tasks: TaskBreakdownResult['tasks'] = [];

    // If we have bullet points, treat each as a potential task
    if (analysis.bulletPoints.length > 0) {
      analysis.bulletPoints.forEach((point: string, index: number) => {
        const cleanPoint = point.replace(/^[\s]*[-*•\d.]+\s*/, '').trim();
        if (cleanPoint.length > 10) { // Ignore very short items
          tasks.push(this.createTaskFromPoint(cleanPoint, analysis, index));
        }
      });
    }

    // If we have features, create tasks from them
    if (analysis.features.length > 0 && tasks.length === 0) {
      analysis.features.forEach((feature: string, index: number) => {
        tasks.push(this.createTaskFromPoint(feature, analysis, index));
      });
    }

    // If no structured content, create a single task
    if (tasks.length === 0) {
      tasks.push(this.createDefaultTask(analysis));
    }

    return tasks;
  }

  private createTaskFromPoint(point: string, analysis: any, index: number) {
    const priority = this.determinePriority({ ...analysis, features: [point] });
    const tags = this.generateTags({ ...analysis, features: [point], technicalDetails: [point] });

    // Generate subtasks
    const subtasks = this.generateSubtasks(point, tags);

    return {
      title: point.substring(0, 100),
      description: point,
      priority,
      tags,
      estimatedHours: this.estimateHours(subtasks.length, tags),
      subtasks,
    };
  }

  private createDefaultTask(analysis: any) {
    const allContent = [
      ...analysis.features,
      ...analysis.requirements,
      ...analysis.technicalDetails,
    ].join('\n');

    return {
      title: this.extractTitle(allContent) || 'Implement feature',
      description: allContent.substring(0, 500),
      priority: 3 as const,
      tags: this.generateTags(analysis),
      estimatedHours: 8,
      subtasks: this.generateSubtasks(allContent, this.generateTags(analysis)),
    };
  }

  private generateSubtasks(taskDescription: string, tags: string[]) {
    const subtasks: any[] = [];
    const lower = taskDescription.toLowerCase();

    // Common subtask patterns based on task type
    const isFrontend = tags.includes('frontend') || lower.includes('ui') || lower.includes('component');
    const isBackend = tags.includes('backend') || lower.includes('api') || lower.includes('endpoint');
    const isDatabase = tags.includes('database') || lower.includes('database') || lower.includes('schema');

    if (isFrontend) {
      subtasks.push({
        title: 'Design component structure and layout',
        description: 'Create the UI component architecture and visual design',
        definitionOfDone: [
          'Component structure is defined',
          'Props and state are identified',
          'Visual design is approved',
        ],
        testNotes: [
          'Verify responsive design',
          'Test accessibility features',
          'Check cross-browser compatibility',
        ],
        riskFlags: [],
        estimatedHours: 4,
      });

      subtasks.push({
        title: 'Implement component logic and state management',
        description: 'Build the interactive functionality',
        definitionOfDone: [
          'All interactive features work correctly',
          'State management is implemented',
          'Error handling is in place',
        ],
        testNotes: [
          'Test all user interactions',
          'Verify state updates correctly',
          'Test error scenarios',
        ],
        riskFlags: [],
        estimatedHours: 6,
      });
    }

    if (isBackend) {
      subtasks.push({
        title: 'Design API endpoints and data models',
        description: 'Define the API structure and data flow',
        definitionOfDone: [
          'API endpoints are documented',
          'Request/response schemas are defined',
          'Data models are designed',
        ],
        testNotes: [
          'Validate request/response formats',
          'Test error responses',
        ],
        riskFlags: [],
        estimatedHours: 3,
      });

      subtasks.push({
        title: 'Implement server-side logic and validation',
        description: 'Build the backend functionality',
        definitionOfDone: [
          'All endpoints are implemented',
          'Input validation is complete',
          'Error handling is robust',
        ],
        testNotes: [
          'Test all API endpoints',
          'Verify validation rules',
          'Test authentication/authorization',
        ],
        riskFlags: [
          {
            severity: 'medium' as const,
            category: 'security' as const,
            description: 'Ensure proper authentication and authorization',
            mitigation: 'Implement comprehensive security checks',
          },
        ],
        estimatedHours: 8,
      });
    }

    if (isDatabase) {
      subtasks.push({
        title: 'Design database schema and migrations',
        description: 'Create database structure',
        definitionOfDone: [
          'Schema is designed and reviewed',
          'Migrations are created',
          'Indexes are optimized',
        ],
        testNotes: [
          'Test migration up and down',
          'Verify data integrity constraints',
        ],
        riskFlags: [
          {
            severity: 'high' as const,
            category: 'technical' as const,
            description: 'Schema changes may affect existing data',
            mitigation: 'Create backup and test migration thoroughly',
          },
        ],
        estimatedHours: 4,
      });
    }

    // Always add testing subtask
    subtasks.push({
      title: 'Write tests and documentation',
      description: 'Create comprehensive tests and update documentation',
      definitionOfDone: [
        'Unit tests are written and passing',
        'Integration tests are complete',
        'Documentation is updated',
      ],
      testNotes: [
        'Achieve >80% code coverage',
        'Test edge cases',
        'Verify documentation accuracy',
      ],
      riskFlags: [],
      estimatedHours: 4,
    });

    return subtasks;
  }

  private estimateHours(subtaskCount: number, tags: string[]): number {
    const baseHours = subtaskCount * 4;

    // Adjust based on complexity
    const complexTags = ['backend', 'database', 'devops', 'security'];
    const hasComplexity = tags.some(tag => complexTags.includes(tag));

    return hasComplexity ? baseHours * 1.5 : baseHours;
  }

  private addDependencies(tasks: TaskBreakdownResult['tasks'], analysis: any) {
    if (tasks.length < 2) return;

    // Add logical dependencies based on task types
    tasks.forEach((task, index) => {
      const tags = task.tags || [];

      // Database tasks should come first
      if (tags.includes('database') && index > 0) {
        const backendTasks = tasks
          .map((t, i) => ({ task: t, index: i }))
          .filter(({ task }) => task.tags.includes('backend'));

        backendTasks.forEach(({ index: targetIndex }) => {
          if (targetIndex > index) {
            if (!tasks[targetIndex].dependencies) {
              tasks[targetIndex].dependencies = [];
            }
            tasks[targetIndex].dependencies!.push({
              targetTaskIndex: index,
              dependencyType: 'requires',
              description: 'Backend requires database schema',
            });
          }
        });
      }

      // Backend should come before frontend
      if (tags.includes('backend')) {
        const frontendTasks = tasks
          .map((t, i) => ({ task: t, index: i }))
          .filter(({ task }) => task.tags.includes('frontend'));

        frontendTasks.forEach(({ index: targetIndex }) => {
          if (targetIndex > index) {
            if (!tasks[targetIndex].dependencies) {
              tasks[targetIndex].dependencies = [];
            }
            tasks[targetIndex].dependencies!.push({
              targetTaskIndex: index,
              dependencyType: 'requires',
              description: 'Frontend requires API endpoints',
            });
          }
        });
      }
    });
  }

  private generateAgentSuggestions(tasks: TaskBreakdownResult['tasks']) {
    const suggestions: TaskBreakdownResult['suggestedAgentAssignments'] = [];

    // This would integrate with actual agent data in a real implementation
    // For now, we'll return suggestions based on task tags
    tasks.forEach((task, index) => {
      const tags = task.tags || [];

      let suggestion = {
        taskIndex: index,
        agentId: '', // Will be filled by the UI based on available agents
        reason: '',
        confidence: 0.7,
      };

      if (tags.includes('frontend') || tags.includes('react')) {
        suggestion.reason = 'Frontend specialist with React expertise';
      } else if (tags.includes('backend') || tags.includes('api')) {
        suggestion.reason = 'Backend specialist with API development skills';
      } else if (tags.includes('database')) {
        suggestion.reason = 'Database specialist';
      } else if (tags.includes('devops')) {
        suggestion.reason = 'DevOps specialist';
      } else {
        suggestion.reason = 'Full-stack developer';
        suggestion.confidence = 0.5;
      }

      if (suggestion.reason) {
        suggestions.push(suggestion);
      }
    });

    return suggestions;
  }
}

// Export singleton instance
export const taskBreakdownService = new TaskBreakdownService();
