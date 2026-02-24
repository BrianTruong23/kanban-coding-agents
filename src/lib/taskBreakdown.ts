import { Task, TaskBreakdown, TaskDependency, TaskType, RiskLevel } from '@/types/task';
import { generateId, generateTaskId } from './utils';

interface ParsedSection {
  type: 'epic' | 'feature' | 'task' | 'subtask';
  title: string;
  description: string;
  priority?: 1 | 2 | 3 | 4 | 5;
  tags?: string[];
  definitionOfDone?: string[];
  testNotes?: string;
  riskLevel?: RiskLevel;
  riskDescription?: string;
  estimatedHours?: number;
  dependencies?: string[];
}

/**
 * Analyzes input text (PRD, issue, or description) and breaks it down into structured tasks
 */
export class TaskBreakdownParser {
  private existingTaskCount: number;

  constructor(existingTaskCount: number = 0) {
    this.existingTaskCount = existingTaskCount;
  }

  /**
   * Main parsing function that takes raw input and returns structured task breakdown
   */
  parse(input: string, sprint?: string): TaskBreakdown {
    const sections = this.extractSections(input);
    const tasks: Task[] = [];
    const dependencies: TaskDependency[] = [];
    const taskIdMap = new Map<string, string>(); // temp ID to actual ID mapping

    let taskCounter = this.existingTaskCount;

    // First pass: Create all tasks
    sections.forEach((section, index) => {
      const tempId = `temp-${index}`;
      const actualId = generateId();
      taskIdMap.set(tempId, actualId);

      const task: Task = {
        id: actualId,
        taskId: generateTaskId(++taskCounter),
        title: section.title,
        description: section.description,
        status: 'backlog',
        priority: section.priority || 3,
        tags: section.tags || this.extractTags(section.description),
        taskType: this.mapTypeToTaskType(section.type),
        definitionOfDone: section.definitionOfDone || this.extractDoD(section.description),
        testNotes: section.testNotes || this.extractTestNotes(section.description),
        riskLevel: section.riskLevel || this.assessRisk(section.description),
        riskDescription: section.riskDescription || this.extractRiskDescription(section.description),
        estimatedHours: section.estimatedHours || this.estimateHours(section.type, section.description),
        sprint,
        createdAt: Date.now(),
        updatedAt: Date.now(),
        commentsCount: 0,
        attachmentsCount: 0,
      };

      tasks.push(task);
    });

    // Second pass: Create dependencies based on hierarchy
    sections.forEach((section, index) => {
      if (section.dependencies && section.dependencies.length > 0) {
        const taskId = taskIdMap.get(`temp-${index}`)!;

        section.dependencies.forEach(depTitle => {
          const depIndex = sections.findIndex(s => s.title.toLowerCase().includes(depTitle.toLowerCase()));
          if (depIndex !== -1) {
            const dependsOnId = taskIdMap.get(`temp-${depIndex}`)!;
            dependencies.push({
              id: generateId(),
              taskId,
              dependsOnTaskId: dependsOnId,
              dependencyType: 'blocks',
              createdAt: Date.now(),
            });
          }
        });
      }
    });

    // Create parent-child relationships
    this.establishHierarchy(tasks, sections);

    const epics = tasks.filter(t => t.taskType === 'epic');
    const regularTasks = tasks.filter(t => t.taskType === 'task');
    const subtasks = tasks.filter(t => t.taskType === 'subtask');

    return {
      originalInput: input,
      epics,
      tasks: regularTasks,
      subtasks,
      dependencies,
      summary: {
        totalEpics: epics.length,
        totalTasks: regularTasks.length,
        totalSubtasks: subtasks.length,
        estimatedHours: tasks.reduce((sum, t) => sum + (t.estimatedHours || 0), 0),
        highRiskCount: tasks.filter(t => t.riskLevel === 'high' || t.riskLevel === 'critical').length,
      },
    };
  }

  /**
   * Extracts structured sections from raw input text
   */
  private extractSections(input: string): ParsedSection[] {
    const sections: ParsedSection[] = [];
    const lines = input.split('\n').filter(line => line.trim());

    let currentSection: ParsedSection | null = null;
    let currentDescriptionLines: string[] = [];

    for (const line of lines) {
      const trimmed = line.trim();

      // Detect section headers
      if (this.isSectionHeader(trimmed)) {
        if (currentSection) {
          currentSection.description = currentDescriptionLines.join('\n').trim();
          sections.push(currentSection);
        }

        currentSection = this.createSectionFromHeader(trimmed);
        currentDescriptionLines = [];
      } else if (currentSection) {
        // Check for special markers
        if (trimmed.toLowerCase().startsWith('dod:') || trimmed.toLowerCase().startsWith('definition of done:')) {
          currentSection.definitionOfDone = this.extractDoDFromLine(trimmed);
        } else if (trimmed.toLowerCase().startsWith('test:') || trimmed.toLowerCase().includes('test notes:')) {
          currentSection.testNotes = trimmed.split(':').slice(1).join(':').trim();
        } else if (trimmed.toLowerCase().startsWith('risk:')) {
          const riskInfo = this.parseRiskLine(trimmed);
          currentSection.riskLevel = riskInfo.level;
          currentSection.riskDescription = riskInfo.description;
        } else if (trimmed.toLowerCase().startsWith('estimate:') || trimmed.toLowerCase().includes('hours:')) {
          currentSection.estimatedHours = this.extractHoursFromLine(trimmed);
        } else if (trimmed.toLowerCase().startsWith('depends on:') || trimmed.toLowerCase().startsWith('blocked by:')) {
          currentSection.dependencies = this.extractDependencies(trimmed);
        } else if (trimmed.toLowerCase().startsWith('priority:')) {
          currentSection.priority = this.extractPriority(trimmed);
        } else {
          currentDescriptionLines.push(trimmed);
        }
      } else {
        // No current section, might be a description for an implicit task
        if (!currentSection && sections.length === 0) {
          currentSection = {
            type: 'task',
            title: 'Main Task',
            description: '',
            priority: 3,
          };
        }
        if (currentSection) {
          currentDescriptionLines.push(trimmed);
        }
      }
    }

    // Add the last section
    if (currentSection) {
      currentSection.description = currentDescriptionLines.join('\n').trim();
      sections.push(currentSection);
    }

    // If no sections were found, create a single task from the entire input
    if (sections.length === 0 && input.trim()) {
      sections.push({
        type: 'task',
        title: this.extractTitleFromText(input),
        description: input.trim(),
        priority: 3,
      });
    }

    return sections;
  }

  private isSectionHeader(line: string): boolean {
    // Matches patterns like "# Epic:", "## Feature:", "### Task:", bullet points, etc.
    return /^(#{1,6}\s+)?(epic|feature|task|subtask|story|user story)[:.\s-]/i.test(line) ||
           /^[\-\*]\s+(epic|feature|task|subtask|story)[:.\s-]/i.test(line) ||
           /^\d+\.\s+/i.test(line);
  }

  private createSectionFromHeader(line: string): ParsedSection {
    const epicPattern = /epic/i;
    const featurePattern = /feature/i;
    const subtaskPattern = /subtask/i;

    let type: ParsedSection['type'] = 'task';
    if (epicPattern.test(line)) type = 'epic';
    else if (featurePattern.test(line)) type = 'feature';
    else if (subtaskPattern.test(line)) type = 'subtask';

    // Extract title - everything after the header marker
    const title = line
      .replace(/^(#{1,6}\s+)?/i, '')
      .replace(/^[\-\*]\s+/i, '')
      .replace(/^\d+\.\s+/i, '')
      .replace(/^(epic|feature|task|subtask|story|user story)[:.\s-]/i, '')
      .trim();

    return {
      type,
      title: title || 'Untitled',
      description: '',
      priority: type === 'epic' ? 4 : 3,
    };
  }

  private extractTitleFromText(text: string): string {
    const firstLine = text.split('\n')[0].trim();
    return firstLine.substring(0, 100);
  }

  private extractTags(description: string): string[] {
    const tags: string[] = [];

    // Look for technology keywords
    const techKeywords = ['react', 'nextjs', 'typescript', 'api', 'database', 'ui', 'ux', 'backend', 'frontend', 'devops', 'testing'];
    techKeywords.forEach(keyword => {
      if (description.toLowerCase().includes(keyword)) {
        tags.push(keyword);
      }
    });

    // Look for #hashtags
    const hashtagPattern = /#(\w+)/g;
    let match;
    while ((match = hashtagPattern.exec(description)) !== null) {
      tags.push(match[1].toLowerCase());
    }

    return [...new Set(tags)]; // Remove duplicates
  }

  private extractDoD(description: string): string[] {
    const dod: string[] = [];
    const lines = description.split('\n');
    let inDodSection = false;

    for (const line of lines) {
      const trimmed = line.trim();
      if (trimmed.toLowerCase().includes('definition of done') || trimmed.toLowerCase().includes('acceptance criteria')) {
        inDodSection = true;
        continue;
      }
      if (inDodSection) {
        if (trimmed.startsWith('-') || trimmed.startsWith('*') || trimmed.startsWith('•')) {
          dod.push(trimmed.substring(1).trim());
        } else if (trimmed.match(/^\d+\./)) {
          dod.push(trimmed.replace(/^\d+\./, '').trim());
        } else if (trimmed && !this.isSectionHeader(trimmed)) {
          dod.push(trimmed);
        }
      }
    }

    // Default DoD if none found
    if (dod.length === 0) {
      dod.push('Code implemented and reviewed');
      dod.push('Tests passing');
      dod.push('Documentation updated');
    }

    return dod;
  }

  private extractDoDFromLine(line: string): string[] {
    const content = line.split(':').slice(1).join(':').trim();
    return content.split(',').map(item => item.trim()).filter(item => item.length > 0);
  }

  private extractTestNotes(description: string): string | undefined {
    const testPattern = /(test|testing|qa):\s*(.+)/i;
    const match = description.match(testPattern);
    return match ? match[2].trim() : undefined;
  }

  private assessRisk(description: string): RiskLevel {
    const lowerDesc = description.toLowerCase();

    // High-risk keywords
    if (lowerDesc.includes('migration') || lowerDesc.includes('security') || lowerDesc.includes('authentication') ||
        lowerDesc.includes('payment') || lowerDesc.includes('breaking change')) {
      return 'high';
    }

    // Medium-risk keywords
    if (lowerDesc.includes('database') || lowerDesc.includes('api') || lowerDesc.includes('integration') ||
        lowerDesc.includes('complex') || lowerDesc.includes('refactor')) {
      return 'medium';
    }

    // Low-risk keywords
    if (lowerDesc.includes('ui') || lowerDesc.includes('style') || lowerDesc.includes('text') ||
        lowerDesc.includes('simple') || lowerDesc.includes('minor')) {
      return 'low';
    }

    return 'none';
  }

  private extractRiskDescription(description: string): string | undefined {
    const riskPattern = /risk:\s*(.+)/i;
    const match = description.match(riskPattern);
    return match ? match[1].trim() : undefined;
  }

  private parseRiskLine(line: string): { level: RiskLevel; description?: string } {
    const content = line.split(':').slice(1).join(':').trim().toLowerCase();

    if (content.includes('critical')) return { level: 'critical', description: content };
    if (content.includes('high')) return { level: 'high', description: content };
    if (content.includes('medium')) return { level: 'medium', description: content };
    if (content.includes('low')) return { level: 'low', description: content };

    return { level: 'medium', description: content };
  }

  private extractHoursFromLine(line: string): number {
    const hoursPattern = /(\d+(?:\.\d+)?)\s*(hours?|hrs?|h)/i;
    const match = line.match(hoursPattern);
    return match ? parseFloat(match[1]) : 0;
  }

  private extractDependencies(line: string): string[] {
    const content = line.split(':').slice(1).join(':').trim();
    return content.split(',').map(dep => dep.trim()).filter(dep => dep.length > 0);
  }

  private extractPriority(line: string): 1 | 2 | 3 | 4 | 5 {
    const priorityPattern = /(\d)/;
    const match = line.match(priorityPattern);
    const priority = match ? parseInt(match[1]) : 3;
    return Math.max(1, Math.min(5, priority)) as 1 | 2 | 3 | 4 | 5;
  }

  private estimateHours(type: string, description: string): number {
    const wordCount = description.split(/\s+/).length;

    // Base estimates by type
    let baseHours = 0;
    switch (type) {
      case 'epic':
        baseHours = 40;
        break;
      case 'feature':
        baseHours = 16;
        break;
      case 'subtask':
        baseHours = 2;
        break;
      default:
        baseHours = 8;
    }

    // Adjust based on description complexity
    const complexityMultiplier = Math.min(2, 1 + (wordCount / 200));

    return Math.round(baseHours * complexityMultiplier);
  }

  private mapTypeToTaskType(type: string): TaskType {
    if (type === 'epic') return 'epic';
    if (type === 'subtask') return 'subtask';
    return 'task';
  }

  private establishHierarchy(tasks: Task[], sections: ParsedSection[]): void {
    let lastEpicId: string | undefined;
    let lastTaskId: string | undefined;

    tasks.forEach((task, index) => {
      const section = sections[index];

      if (task.taskType === 'epic') {
        lastEpicId = task.id;
        lastTaskId = undefined;
      } else if (task.taskType === 'task') {
        if (lastEpicId) {
          task.parentTaskId = lastEpicId;
        }
        lastTaskId = task.id;
      } else if (task.taskType === 'subtask') {
        if (lastTaskId) {
          task.parentTaskId = lastTaskId;
        } else if (lastEpicId) {
          task.parentTaskId = lastEpicId;
        }
      }
    });
  }
}

/**
 * Quick helper function to break down a simple task description
 */
export function quickBreakdown(input: string, existingTaskCount: number = 0, sprint?: string): TaskBreakdown {
  const parser = new TaskBreakdownParser(existingTaskCount);
  return parser.parse(input, sprint);
}
