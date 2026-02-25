import { AIBreakdownResponse, TaskBreakdownInput, GeneratedEpic, GeneratedTask } from '@/types/taskBreakdown';

/**
 * AI-powered task breakdown service
 * This service analyzes input (issue, PRD, or screenshot) and breaks it down into epics, tasks, and subtasks
 * with Definition of Done, test notes, and risk flags.
 */
export class TaskBreakdownService {
  /**
   * Break down a task from various input types
   */
  async breakdownTask(input: TaskBreakdownInput): Promise<AIBreakdownResponse> {
    // In a real implementation, this would call an AI API (OpenAI, Anthropic, etc.)
    // For now, we'll implement a rule-based system that demonstrates the concept

    if (input.type === 'screenshot') {
      return this.analyzeScreenshot(input.content, input.context);
    } else if (input.type === 'prd') {
      return this.analyzePRD(input.content);
    } else {
      return this.analyzeIssue(input.content);
    }
  }

  /**
   * Analyze a GitHub issue or similar text
   */
  private async analyzeIssue(issueText: string): Promise<AIBreakdownResponse> {
    // Parse the issue text to extract key information
    const lines = issueText.split('\n').filter(l => l.trim());
    const title = lines[0] || 'Untitled Task';

    // Determine complexity based on content
    const isComplex = issueText.length > 500 ||
                      issueText.toLowerCase().includes('implement') ||
                      issueText.toLowerCase().includes('feature');

    if (isComplex) {
      // Create an epic with multiple tasks
      return this.createComplexBreakdown(title, issueText);
    } else {
      // Create a simple task
      return this.createSimpleBreakdown(title, issueText);
    }
  }

  /**
   * Analyze a PRD (Product Requirements Document)
   */
  private async analyzePRD(prdText: string): Promise<AIBreakdownResponse> {
    // PRDs typically contain multiple features/sections
    const sections = this.extractPRDSections(prdText);
    const epics: GeneratedEpic[] = [];

    for (const section of sections) {
      epics.push({
        title: section.title,
        description: section.description,
        priority: section.priority,
        tasks: section.tasks,
      });
    }

    return {
      epics,
      overallEstimate: epics.reduce((sum, epic) =>
        sum + epic.tasks.reduce((taskSum, task) => taskSum + (task.estimatedHours || 0), 0), 0
      ),
      risks: this.identifyRisks(prdText),
      recommendations: this.generateRecommendations(epics),
    };
  }

  /**
   * Analyze a screenshot
   */
  private async analyzeScreenshot(screenshotUrl: string, context?: string): Promise<AIBreakdownResponse> {
    // In a real implementation, this would use vision AI to analyze the screenshot
    // For now, we'll use the context to generate tasks
    const description = context || 'UI implementation based on screenshot';

    return {
      epics: [{
        title: 'UI Implementation',
        description,
        priority: 3,
        tasks: [
          {
            title: 'Create component structure',
            description: 'Set up React components based on the design',
            priority: 3,
            estimatedHours: 4,
            definitionOfDone: [
              'Components created with proper TypeScript types',
              'Component hierarchy matches design',
              'Props interfaces defined',
            ],
            testNotes: [
              'Verify component renders without errors',
              'Check prop types are enforced',
            ],
            riskLevel: 'low',
            tags: ['frontend', 'react', 'ui'],
            requiredSkills: ['React', 'TypeScript', 'CSS'],
          },
          {
            title: 'Implement styling',
            description: 'Apply CSS/Tailwind styling to match the screenshot',
            priority: 3,
            estimatedHours: 3,
            definitionOfDone: [
              'Styling matches screenshot',
              'Responsive design implemented',
              'Dark mode support added',
            ],
            testNotes: [
              'Visual comparison with screenshot',
              'Test on different screen sizes',
              'Verify dark mode appearance',
            ],
            riskLevel: 'low',
            tags: ['frontend', 'css', 'styling'],
            requiredSkills: ['CSS', 'Tailwind', 'Responsive Design'],
          },
          {
            title: 'Add interactivity',
            description: 'Implement user interactions and state management',
            priority: 3,
            estimatedHours: 5,
            definitionOfDone: [
              'All interactive elements functional',
              'State management implemented',
              'Event handlers added',
            ],
            testNotes: [
              'Test all user interactions',
              'Verify state updates correctly',
              'Check edge cases',
            ],
            riskLevel: 'medium',
            tags: ['frontend', 'javascript', 'state'],
            requiredSkills: ['React', 'JavaScript', 'State Management'],
            dependencies: ['Create component structure'],
          },
        ],
      }],
      overallEstimate: 12,
      risks: ['Design may not be fully specified in screenshot'],
      recommendations: ['Get clarification on interactive behavior', 'Confirm responsive breakpoints'],
    };
  }

  /**
   * Create a complex breakdown with epics and tasks
   */
  private createComplexBreakdown(title: string, description: string): AIBreakdownResponse {
    const hasBackend = description.toLowerCase().includes('api') ||
                       description.toLowerCase().includes('database') ||
                       description.toLowerCase().includes('backend');
    const hasFrontend = description.toLowerCase().includes('ui') ||
                        description.toLowerCase().includes('frontend') ||
                        description.toLowerCase().includes('interface');

    const epics: GeneratedEpic[] = [];

    if (hasBackend) {
      epics.push({
        title: `${title} - Backend`,
        description: 'Backend implementation',
        priority: 4,
        tasks: [
          {
            title: 'Design database schema',
            description: 'Create database tables and relationships',
            priority: 5,
            estimatedHours: 3,
            definitionOfDone: [
              'Schema diagram created',
              'Tables created in database',
              'Indexes added for performance',
              'RLS policies configured',
            ],
            testNotes: [
              'Verify schema integrity',
              'Test RLS policies',
            ],
            riskLevel: 'medium',
            tags: ['backend', 'database', 'schema'],
            requiredSkills: ['PostgreSQL', 'Database Design'],
          },
          {
            title: 'Implement API endpoints',
            description: 'Create REST/GraphQL endpoints',
            priority: 4,
            estimatedHours: 6,
            definitionOfDone: [
              'All CRUD operations implemented',
              'Input validation added',
              'Error handling implemented',
              'API documented',
            ],
            testNotes: [
              'Test all endpoints with various inputs',
              'Verify error responses',
              'Check authentication/authorization',
            ],
            riskLevel: 'medium',
            tags: ['backend', 'api'],
            requiredSkills: ['API Design', 'Node.js', 'TypeScript'],
            dependencies: ['Design database schema'],
          },
          {
            title: 'Add business logic',
            description: 'Implement core business logic and validation',
            priority: 4,
            estimatedHours: 8,
            definitionOfDone: [
              'Business rules implemented',
              'Data validation added',
              'Edge cases handled',
            ],
            testNotes: [
              'Test business logic with various scenarios',
              'Verify validation rules',
            ],
            riskLevel: 'high',
            tags: ['backend', 'logic'],
            requiredSkills: ['TypeScript', 'Business Logic'],
            dependencies: ['Implement API endpoints'],
          },
        ],
      });
    }

    if (hasFrontend) {
      epics.push({
        title: `${title} - Frontend`,
        description: 'Frontend implementation',
        priority: 3,
        tasks: [
          {
            title: 'Create UI components',
            description: 'Build React components',
            priority: 3,
            estimatedHours: 5,
            definitionOfDone: [
              'Components created',
              'TypeScript types defined',
              'Styling applied',
            ],
            testNotes: [
              'Visual review',
              'Component isolation test',
            ],
            riskLevel: 'low',
            tags: ['frontend', 'react', 'ui'],
            requiredSkills: ['React', 'TypeScript', 'CSS'],
          },
          {
            title: 'Integrate with API',
            description: 'Connect frontend to backend API',
            priority: 3,
            estimatedHours: 4,
            definitionOfDone: [
              'API client implemented',
              'Data fetching added',
              'Loading states handled',
              'Error handling implemented',
            ],
            testNotes: [
              'Test API integration',
              'Verify error handling',
              'Check loading states',
            ],
            riskLevel: 'medium',
            tags: ['frontend', 'api', 'integration'],
            requiredSkills: ['React', 'API Integration'],
            dependencies: ['Create UI components'],
          },
        ],
      });
    }

    // Add testing epic if complex
    if (epics.length > 1) {
      epics.push({
        title: `${title} - Testing & QA`,
        description: 'Testing and quality assurance',
        priority: 3,
        tasks: [
          {
            title: 'Write unit tests',
            description: 'Create unit tests for components and functions',
            priority: 3,
            estimatedHours: 4,
            definitionOfDone: [
              'Test coverage > 80%',
              'All critical paths tested',
              'Tests passing',
            ],
            testNotes: [
              'Run test suite',
              'Check coverage report',
            ],
            riskLevel: 'low',
            tags: ['testing', 'unit-tests'],
            requiredSkills: ['Testing', 'Jest'],
          },
          {
            title: 'Integration testing',
            description: 'Test end-to-end workflows',
            priority: 3,
            estimatedHours: 3,
            definitionOfDone: [
              'E2E tests created',
              'Critical user flows tested',
              'Tests passing',
            ],
            testNotes: [
              'Run E2E test suite',
              'Manual QA verification',
            ],
            riskLevel: 'medium',
            tags: ['testing', 'e2e'],
            requiredSkills: ['Testing', 'E2E Testing'],
          },
        ],
      });
    }

    const totalEstimate = epics.reduce((sum, epic) =>
      sum + epic.tasks.reduce((taskSum, task) => taskSum + (task.estimatedHours || 0), 0), 0
    );

    return {
      epics,
      overallEstimate: totalEstimate,
      risks: this.identifyRisks(description),
      recommendations: this.generateRecommendations(epics),
    };
  }

  /**
   * Create a simple task breakdown
   */
  private createSimpleBreakdown(title: string, description: string): AIBreakdownResponse {
    const priority = this.determinePriority(description);
    const estimatedHours = this.estimateHours(description);
    const riskLevel = this.assessRiskLevel(description);

    return {
      epics: [{
        title,
        description,
        priority,
        tasks: [{
          title,
          description,
          priority,
          estimatedHours,
          definitionOfDone: [
            'Implementation complete',
            'Code reviewed',
            'Tests passing',
          ],
          testNotes: [
            'Manual testing',
            'Verify requirements met',
          ],
          riskLevel,
          tags: this.extractTags(description),
          requiredSkills: this.extractSkills(description),
        }],
      }],
      overallEstimate: estimatedHours,
      risks: this.identifyRisks(description),
      recommendations: ['Review requirements before starting', 'Get feedback early'],
    };
  }

  /**
   * Extract PRD sections
   */
  private extractPRDSections(prdText: string): Array<{
    title: string;
    description: string;
    priority: 1 | 2 | 3 | 4 | 5;
    tasks: GeneratedTask[];
  }> {
    // Simple section extraction based on headers
    const sections: Array<{
      title: string;
      description: string;
      priority: 1 | 2 | 3 | 4 | 5;
      tasks: GeneratedTask[];
    }> = [];

    const lines = prdText.split('\n');
    let currentSection: { title: string; description: string; priority: 1 | 2 | 3 | 4 | 5; tasks: GeneratedTask[] } | null = null;

    for (const line of lines) {
      if (line.startsWith('#') || line.startsWith('##')) {
        if (currentSection) {
          sections.push(currentSection);
        }
        currentSection = {
          title: line.replace(/^#+\s*/, ''),
          description: '',
          priority: 3,
          tasks: [],
        };
      } else if (currentSection) {
        currentSection.description += line + '\n';
      }
    }

    if (currentSection) {
      sections.push(currentSection);
    }

    // Generate tasks for each section
    return sections.map(section => ({
      ...section,
      tasks: this.generateTasksForSection(section.description),
    }));
  }

  /**
   * Generate tasks for a PRD section
   */
  private generateTasksForSection(sectionText: string): GeneratedTask[] {
    // Extract bullet points as potential tasks
    const tasks: GeneratedTask[] = [];
    const lines = sectionText.split('\n');

    for (const line of lines) {
      if (line.trim().match(/^[-*]\s/)) {
        const taskTitle = line.trim().replace(/^[-*]\s/, '');
        tasks.push({
          title: taskTitle,
          description: taskTitle,
          priority: 3,
          estimatedHours: 2,
          definitionOfDone: ['Implementation complete', 'Tests passing'],
          testNotes: ['Manual verification'],
          riskLevel: 'low',
          tags: [],
          requiredSkills: [],
        });
      }
    }

    return tasks.length > 0 ? tasks : [{
      title: 'Implement section',
      description: sectionText.slice(0, 200),
      priority: 3,
      estimatedHours: 4,
      definitionOfDone: ['Implementation complete', 'Tests passing'],
      testNotes: ['Manual verification'],
      riskLevel: 'low',
      tags: [],
      requiredSkills: [],
    }];
  }

  /**
   * Identify risks in the description
   */
  private identifyRisks(description: string): string[] {
    const risks: string[] = [];
    const lower = description.toLowerCase();

    if (lower.includes('migration') || lower.includes('refactor')) {
      risks.push('Breaking changes may affect existing functionality');
    }
    if (lower.includes('performance') || lower.includes('scale')) {
      risks.push('Performance testing required under load');
    }
    if (lower.includes('security') || lower.includes('auth')) {
      risks.push('Security review required');
    }
    if (lower.includes('third-party') || lower.includes('external')) {
      risks.push('Dependency on external services');
    }
    if (description.length < 100) {
      risks.push('Requirements may be underspecified');
    }

    return risks;
  }

  /**
   * Generate recommendations based on epics
   */
  private generateRecommendations(epics: GeneratedEpic[]): string[] {
    const recommendations: string[] = [];
    const totalTasks = epics.reduce((sum, epic) => sum + epic.tasks.length, 0);

    if (epics.length > 3) {
      recommendations.push('Consider breaking this into multiple sprints');
    }
    if (totalTasks > 10) {
      recommendations.push('Large number of tasks - prioritize carefully');
    }

    const hasHighRisk = epics.some(epic =>
      epic.tasks.some(task => task.riskLevel === 'high' || task.riskLevel === 'critical')
    );
    if (hasHighRisk) {
      recommendations.push('Address high-risk items first');
    }

    recommendations.push('Review dependencies before starting');
    recommendations.push('Set up daily standups for coordination');

    return recommendations;
  }

  /**
   * Determine priority from description
   */
  private determinePriority(description: string): 1 | 2 | 3 | 4 | 5 {
    const lower = description.toLowerCase();
    if (lower.includes('critical') || lower.includes('urgent')) return 5;
    if (lower.includes('high priority') || lower.includes('important')) return 4;
    if (lower.includes('low priority')) return 2;
    return 3;
  }

  /**
   * Estimate hours from description
   */
  private estimateHours(description: string): number {
    // Simple heuristic based on length and keywords
    const baseHours = Math.min(Math.ceil(description.length / 200), 8);
    const lower = description.toLowerCase();

    let multiplier = 1;
    if (lower.includes('complex') || lower.includes('advanced')) multiplier = 1.5;
    if (lower.includes('simple') || lower.includes('quick')) multiplier = 0.5;

    return Math.max(1, Math.round(baseHours * multiplier));
  }

  /**
   * Assess risk level from description
   */
  private assessRiskLevel(description: string): 'low' | 'medium' | 'high' | 'critical' {
    const lower = description.toLowerCase();

    if (lower.includes('critical') || lower.includes('security')) return 'critical';
    if (lower.includes('complex') || lower.includes('migration')) return 'high';
    if (lower.includes('integration') || lower.includes('api')) return 'medium';
    return 'low';
  }

  /**
   * Extract tags from description
   */
  private extractTags(description: string): string[] {
    const tags: string[] = [];
    const lower = description.toLowerCase();

    if (lower.includes('frontend') || lower.includes('ui')) tags.push('frontend');
    if (lower.includes('backend') || lower.includes('api')) tags.push('backend');
    if (lower.includes('database') || lower.includes('db')) tags.push('database');
    if (lower.includes('bug') || lower.includes('fix')) tags.push('bug');
    if (lower.includes('feature')) tags.push('feature');
    if (lower.includes('test')) tags.push('testing');

    return tags;
  }

  /**
   * Extract required skills from description
   */
  private extractSkills(description: string): string[] {
    const skills: string[] = [];
    const lower = description.toLowerCase();

    if (lower.includes('react')) skills.push('React');
    if (lower.includes('typescript') || lower.includes('ts')) skills.push('TypeScript');
    if (lower.includes('node') || lower.includes('express')) skills.push('Node.js');
    if (lower.includes('database') || lower.includes('sql')) skills.push('Database');
    if (lower.includes('api')) skills.push('API Design');
    if (lower.includes('css') || lower.includes('style')) skills.push('CSS');

    return skills;
  }
}

export const taskBreakdownService = new TaskBreakdownService();
