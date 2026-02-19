import type {
  TaskBreakdownInput,
  TaskBreakdownResult,
  GeneratedEpic,
  GeneratedStory,
  GeneratedSubtask
} from '@/types/breakdown';

/**
 * AI-powered task breakdown service
 * This service analyzes issues, PRDs, or screenshots and breaks them down into
 * epics, stories, and subtasks with DoD, acceptance criteria, and risk flags.
 */
export class TaskBreakdownService {
  /**
   * Main method to break down a task from various input sources
   */
  async breakdownTask(input: TaskBreakdownInput): Promise<TaskBreakdownResult> {
    // In a real implementation, this would call an LLM API (e.g., OpenAI, Anthropic)
    // For now, we'll use intelligent parsing and pattern matching

    const content = input.content.toLowerCase();
    const lines = input.content.split('\n').filter(line => line.trim());

    // Analyze the content to generate breakdown
    const epics = this.generateEpics(input.content, lines);
    const suggestedSprints = this.generateSprints(epics);
    const overallRisks = this.identifyOverallRisks(content);
    const recommendedTeamSize = this.calculateTeamSize(epics);

    return {
      epics,
      suggestedSprints,
      overallRisks,
      recommendedTeamSize
    };
  }

  private generateEpics(content: string, lines: string[]): GeneratedEpic[] {
    const epics: GeneratedEpic[] = [];

    // Pattern matching for common feature requests
    const features = this.extractFeatures(content);

    if (features.length === 0) {
      // Create a single epic from the entire content
      epics.push(this.createDefaultEpic(content, lines));
    } else {
      // Create epics for each major feature
      features.forEach(feature => {
        epics.push(this.createEpicFromFeature(feature, content));
      });
    }

    return epics;
  }

  private extractFeatures(content: string): string[] {
    const features: string[] = [];
    const lowerContent = content.toLowerCase();

    // Look for common patterns
    const patterns = [
      /(?:implement|add|create|build)\s+([a-z\s]+?)(?:feature|functionality|system|component)/gi,
      /(?:user|admin|agent)\s+(?:can|should|must)\s+([a-z\s]+)/gi,
      /feature:\s*([^\n]+)/gi,
      /epic:\s*([^\n]+)/gi,
    ];

    patterns.forEach(pattern => {
      let match;
      while ((match = pattern.exec(content)) !== null) {
        if (match[1] && match[1].trim().length > 3) {
          features.push(match[1].trim());
        }
      }
    });

    return [...new Set(features)]; // Remove duplicates
  }

  private createDefaultEpic(content: string, lines: string[]): GeneratedEpic {
    const title = this.extractTitle(content, lines);
    const stories = this.generateStoriesFromContent(content, lines);

    return {
      title: title || 'Main Feature Implementation',
      description: lines.slice(0, 3).join('\n'),
      businessValue: 'Deliver core functionality as specified in requirements',
      estimatedStoryPoints: this.calculateTotalPoints(stories),
      stories
    };
  }

  private createEpicFromFeature(feature: string, fullContent: string): GeneratedEpic {
    const stories = this.generateStoriesForFeature(feature, fullContent);

    return {
      title: this.capitalizeFeature(feature),
      description: `Implementation of ${feature} functionality`,
      businessValue: `Enable users to utilize ${feature} capabilities`,
      estimatedStoryPoints: this.calculateTotalPoints(stories),
      stories
    };
  }

  private generateStoriesFromContent(content: string, lines: string[]): GeneratedStory[] {
    const stories: GeneratedStory[] = [];

    // Identify different aspects of the project
    const aspects = this.identifyAspects(content);

    aspects.forEach(aspect => {
      stories.push(this.createStoryFromAspect(aspect, content));
    });

    // Ensure we have at least one story
    if (stories.length === 0) {
      stories.push(this.createDefaultStory(content));
    }

    return stories;
  }

  private generateStoriesForFeature(feature: string, fullContent: string): GeneratedStory[] {
    const stories: GeneratedStory[] = [];

    // Common story types for any feature
    const storyTypes = [
      {
        suffix: 'UI Implementation',
        skills: ['React', 'TypeScript', 'CSS', 'UI/UX'],
        priority: 3
      },
      {
        suffix: 'Backend Integration',
        skills: ['API', 'Database', 'Backend'],
        priority: 3
      },
      {
        suffix: 'Testing & Validation',
        skills: ['Testing', 'QA'],
        priority: 2
      }
    ];

    storyTypes.forEach(type => {
      stories.push({
        title: `${this.capitalizeFeature(feature)} - ${type.suffix}`,
        description: `Implement ${type.suffix.toLowerCase()} for ${feature}`,
        acceptanceCriteria: this.generateAcceptanceCriteria(feature, type.suffix),
        definitionOfDone: this.generateDefinitionOfDone(),
        testNotes: `Verify ${feature} ${type.suffix.toLowerCase()} works as expected`,
        riskFlags: this.identifyRisks(feature, type.suffix),
        estimatedStoryPoints: this.estimateStoryPoints(type.suffix),
        requiredSkills: type.skills,
        priority: type.priority as 1 | 2 | 3 | 4 | 5,
        subtasks: this.generateSubtasks(type.suffix, type.skills)
      });
    });

    return stories;
  }

  private identifyAspects(content: string): string[] {
    const aspects: string[] = [];
    const lowerContent = content.toLowerCase();

    // Common aspects of software projects
    const aspectKeywords = {
      'Database': ['database', 'schema', 'table', 'migration', 'data model'],
      'Frontend': ['ui', 'interface', 'component', 'page', 'view', 'react'],
      'Backend': ['api', 'endpoint', 'service', 'server', 'backend'],
      'Authentication': ['auth', 'login', 'signup', 'user management', 'permission'],
      'Testing': ['test', 'testing', 'qa', 'validation'],
      'DevOps': ['deploy', 'ci/cd', 'infrastructure', 'docker'],
      'Documentation': ['docs', 'documentation', 'readme']
    };

    Object.entries(aspectKeywords).forEach(([aspect, keywords]) => {
      if (keywords.some(keyword => lowerContent.includes(keyword))) {
        aspects.push(aspect);
      }
    });

    return aspects.length > 0 ? aspects : ['Implementation'];
  }

  private createStoryFromAspect(aspect: string, content: string): GeneratedStory {
    const skillMap: Record<string, string[]> = {
      'Database': ['SQL', 'Database Design', 'Backend'],
      'Frontend': ['React', 'TypeScript', 'CSS', 'UI/UX'],
      'Backend': ['API Development', 'Node.js', 'TypeScript'],
      'Authentication': ['Security', 'Backend', 'API Development'],
      'Testing': ['Testing', 'QA', 'Automation'],
      'DevOps': ['DevOps', 'CI/CD', 'Docker'],
      'Documentation': ['Technical Writing', 'Documentation']
    };

    return {
      title: `${aspect} Implementation`,
      description: `Implement ${aspect.toLowerCase()} functionality as specified in requirements`,
      acceptanceCriteria: this.generateAcceptanceCriteria(aspect, 'Implementation'),
      definitionOfDone: this.generateDefinitionOfDone(),
      testNotes: `Test ${aspect.toLowerCase()} functionality thoroughly`,
      riskFlags: this.identifyRisks(aspect, 'Implementation'),
      estimatedStoryPoints: this.estimateStoryPoints(aspect),
      requiredSkills: skillMap[aspect] || ['General Development'],
      priority: 3,
      subtasks: this.generateSubtasks(aspect, skillMap[aspect] || [])
    };
  }

  private createDefaultStory(content: string): GeneratedStory {
    return {
      title: 'Core Implementation',
      description: content.split('\n').slice(0, 2).join(' '),
      acceptanceCriteria: [
        'All requirements are met',
        'Code is reviewed and approved',
        'Implementation matches specification'
      ],
      definitionOfDone: this.generateDefinitionOfDone(),
      testNotes: 'Comprehensive testing required',
      riskFlags: [],
      estimatedStoryPoints: 5,
      requiredSkills: ['General Development'],
      priority: 3,
      subtasks: []
    };
  }

  private generateAcceptanceCriteria(feature: string, context: string): string[] {
    const criteria: string[] = [];

    if (context.includes('UI')) {
      criteria.push(`UI components for ${feature} are implemented and responsive`);
      criteria.push(`User interactions work as expected`);
      criteria.push(`Design matches specifications`);
    }

    if (context.includes('Backend')) {
      criteria.push(`API endpoints for ${feature} are functional`);
      criteria.push(`Data validation is in place`);
      criteria.push(`Error handling is implemented`);
    }

    if (context.includes('Testing')) {
      criteria.push(`Unit tests achieve >80% coverage`);
      criteria.push(`Integration tests pass`);
      criteria.push(`Edge cases are tested`);
    }

    // Generic criteria
    if (criteria.length === 0) {
      criteria.push(`${feature} functionality works as specified`);
      criteria.push('Code follows project standards');
      criteria.push('All tests pass');
    }

    return criteria;
  }

  private generateDefinitionOfDone(): string[] {
    return [
      'Code is written and committed',
      'Unit tests are written and passing',
      'Code review is completed',
      'Documentation is updated',
      'No critical bugs remain',
      'Feature is deployed to staging'
    ];
  }

  private identifyRisks(feature: string, context: string): Array<{
    level: 'low' | 'medium' | 'high' | 'critical';
    description: string;
    mitigation?: string;
  }> {
    const risks: Array<{
      level: 'low' | 'medium' | 'high' | 'critical';
      description: string;
      mitigation?: string;
    }> = [];

    const lowerFeature = feature.toLowerCase();

    // Security-related features
    if (lowerFeature.includes('auth') || lowerFeature.includes('security') || lowerFeature.includes('permission')) {
      risks.push({
        level: 'high',
        description: 'Security vulnerabilities could expose user data',
        mitigation: 'Conduct security review and penetration testing'
      });
    }

    // Database-related features
    if (lowerFeature.includes('database') || lowerFeature.includes('data') || context.includes('Backend')) {
      risks.push({
        level: 'medium',
        description: 'Data migration or schema changes could cause data loss',
        mitigation: 'Test migrations thoroughly and create backups'
      });
    }

    // Performance-critical features
    if (lowerFeature.includes('performance') || lowerFeature.includes('optimization')) {
      risks.push({
        level: 'medium',
        description: 'Performance improvements might introduce bugs',
        mitigation: 'Benchmark before and after changes'
      });
    }

    // External integrations
    if (lowerFeature.includes('api') || lowerFeature.includes('integration') || lowerFeature.includes('third-party')) {
      risks.push({
        level: 'medium',
        description: 'External service dependencies could fail',
        mitigation: 'Implement retry logic and fallback mechanisms'
      });
    }

    return risks;
  }

  private estimateStoryPoints(context: string): number {
    const pointsMap: Record<string, number> = {
      'UI Implementation': 5,
      'Backend Integration': 8,
      'Testing & Validation': 3,
      'Database': 8,
      'Frontend': 5,
      'Backend': 8,
      'Authentication': 13,
      'Testing': 3,
      'DevOps': 8,
      'Documentation': 2
    };

    return pointsMap[context] || 5;
  }

  private generateSubtasks(context: string, skills: string[]): GeneratedSubtask[] {
    const subtasks: GeneratedSubtask[] = [];

    if (context.includes('UI') || context === 'Frontend') {
      subtasks.push(
        {
          title: 'Design component structure',
          description: 'Plan and design the component architecture',
          estimatedHours: 2,
          requiredSkills: ['React', 'TypeScript']
        },
        {
          title: 'Implement UI components',
          description: 'Build the UI components according to design',
          estimatedHours: 8,
          requiredSkills: ['React', 'TypeScript', 'CSS']
        },
        {
          title: 'Add responsive styling',
          description: 'Ensure components work on all screen sizes',
          estimatedHours: 4,
          requiredSkills: ['CSS', 'UI/UX']
        }
      );
    }

    if (context.includes('Backend') || context === 'Backend') {
      subtasks.push(
        {
          title: 'Design API endpoints',
          description: 'Define API contract and data models',
          estimatedHours: 3,
          requiredSkills: ['API Development', 'Backend']
        },
        {
          title: 'Implement business logic',
          description: 'Write the core business logic',
          estimatedHours: 10,
          requiredSkills: ['Backend', 'TypeScript']
        },
        {
          title: 'Add validation and error handling',
          description: 'Implement input validation and error handling',
          estimatedHours: 4,
          requiredSkills: ['Backend', 'Security']
        }
      );
    }

    if (context.includes('Database')) {
      subtasks.push(
        {
          title: 'Design database schema',
          description: 'Create schema design and migration scripts',
          estimatedHours: 4,
          requiredSkills: ['Database Design', 'SQL']
        },
        {
          title: 'Write migration scripts',
          description: 'Implement database migrations',
          estimatedHours: 3,
          requiredSkills: ['SQL', 'Backend']
        },
        {
          title: 'Test data integrity',
          description: 'Verify data constraints and relationships',
          estimatedHours: 2,
          requiredSkills: ['Database', 'Testing']
        }
      );
    }

    if (context.includes('Testing')) {
      subtasks.push(
        {
          title: 'Write unit tests',
          description: 'Create comprehensive unit tests',
          estimatedHours: 6,
          requiredSkills: ['Testing', 'TypeScript']
        },
        {
          title: 'Write integration tests',
          description: 'Create integration tests for workflows',
          estimatedHours: 8,
          requiredSkills: ['Testing', 'QA']
        }
      );
    }

    return subtasks;
  }

  private generateSprints(epics: GeneratedEpic[]): Array<{
    sprintName: string;
    stories: string[];
  }> {
    const sprints: Array<{
      sprintName: string;
      stories: string[];
    }> = [];

    let currentSprint = 1;
    let currentSprintPoints = 0;
    const maxSprintPoints = 20; // Typical sprint capacity
    let currentStories: string[] = [];

    epics.forEach(epic => {
      epic.stories.forEach(story => {
        if (currentSprintPoints + story.estimatedStoryPoints > maxSprintPoints && currentStories.length > 0) {
          // Start new sprint
          sprints.push({
            sprintName: `Sprint ${currentSprint}`,
            stories: [...currentStories]
          });
          currentSprint++;
          currentSprintPoints = 0;
          currentStories = [];
        }

        currentStories.push(story.title);
        currentSprintPoints += story.estimatedStoryPoints;
      });
    });

    // Add remaining stories
    if (currentStories.length > 0) {
      sprints.push({
        sprintName: `Sprint ${currentSprint}`,
        stories: currentStories
      });
    }

    return sprints;
  }

  private identifyOverallRisks(content: string): string[] {
    const risks: string[] = [];

    if (content.includes('migration') || content.includes('database change')) {
      risks.push('Database migration complexity - ensure proper backup and rollback plan');
    }

    if (content.includes('breaking change') || content.includes('refactor')) {
      risks.push('Breaking changes may affect existing functionality - thorough testing required');
    }

    if (content.includes('performance') || content.includes('scale')) {
      risks.push('Performance requirements need validation under load');
    }

    if (content.includes('third-party') || content.includes('external api')) {
      risks.push('External dependencies introduce potential points of failure');
    }

    return risks;
  }

  private calculateTeamSize(epics: GeneratedEpic[]): number {
    const totalPoints = epics.reduce((sum, epic) => sum + epic.estimatedStoryPoints, 0);

    // Assume each developer can handle 8-10 story points per sprint
    // and we want to complete in 2-3 sprints
    const pointsPerDeveloperPerSprint = 9;
    const targetSprints = 2;

    return Math.max(2, Math.ceil(totalPoints / (pointsPerDeveloperPerSprint * targetSprints)));
  }

  private calculateTotalPoints(stories: GeneratedStory[]): number {
    return stories.reduce((sum, story) => sum + story.estimatedStoryPoints, 0);
  }

  private extractTitle(content: string, lines: string[]): string {
    // Look for title patterns
    const titlePatterns = [
      /^#\s*(.+)$/m,
      /^title:\s*(.+)$/im,
      /^issue:\s*(.+)$/im,
    ];

    for (const pattern of titlePatterns) {
      const match = content.match(pattern);
      if (match) {
        return match[1].trim();
      }
    }

    // Use first non-empty line
    return lines[0] || 'Feature Implementation';
  }

  private capitalizeFeature(feature: string): string {
    return feature
      .split(' ')
      .map(word => word.charAt(0).toUpperCase() + word.slice(1))
      .join(' ');
  }
}

// Export singleton instance
export const taskBreakdownService = new TaskBreakdownService();
