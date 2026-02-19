import { Epic } from '@/types/epic';
import { Task, TaskStatus } from '@/types/task';
import { Subtask } from '@/types/subtask';
import { TaskDependency } from '@/types/dependency';
import { DefinitionOfDone } from '@/types/definitionOfDone';
import { TestNote, TestType } from '@/types/testNote';
import { RiskFlag, RiskLevel } from '@/types/riskFlag';
import { TaskBreakdownInput, TaskBreakdownResult, ParsedTaskItem } from '@/types/taskBreakdown';
import { generateId } from '@/lib/utils';

/**
 * Parse input text (issue, PRD, or description) and break it down into structured tasks
 */
export class TaskBreakdownService {

  /**
   * Main entry point for breaking down input into epics, tasks, and subtasks
   */
  static async breakdownInput(input: TaskBreakdownInput): Promise<TaskBreakdownResult> {
    const { content, type } = input;

    // Parse the content based on type
    const parsed = this.parseContent(content, type);

    // Generate IDs and structure the data
    const result = this.structureBreakdown(parsed);

    return result;
  }

  /**
   * Parse content into structured format
   */
  private static parseContent(content: string, type: string): {
    epics: Array<{ title: string; description: string; tasks: ParsedTaskItem[] }>;
  } {
    // This is a simplified parser. In a real implementation, you might use:
    // - NLP/AI to understand the content
    // - Markdown parser for structured PRDs
    // - Image analysis for screenshots

    const lines = content.split('\n').filter(line => line.trim());
    const epics: Array<{ title: string; description: string; tasks: ParsedTaskItem[] }> = [];
    let currentEpic: { title: string; description: string; tasks: ParsedTaskItem[] } | null = null;
    let currentTask: ParsedTaskItem | null = null;

    for (const line of lines) {
      const trimmed = line.trim();

      // Epic detection (# header or "Epic:" prefix)
      if (trimmed.match(/^#\s+/) || trimmed.toLowerCase().startsWith('epic:')) {
        if (currentTask && currentEpic) {
          currentEpic.tasks.push(currentTask);
          currentTask = null;
        }
        if (currentEpic) {
          epics.push(currentEpic);
        }

        const title = trimmed.replace(/^#\s+/, '').replace(/^epic:\s*/i, '');
        currentEpic = {
          title,
          description: '',
          tasks: []
        };
      }
      // Task detection (## header, bullet points, or numbered list)
      else if (trimmed.match(/^##\s+/) || trimmed.match(/^[-*]\s+/) || trimmed.match(/^\d+\.\s+/)) {
        if (currentTask && currentEpic) {
          currentEpic.tasks.push(currentTask);
        }

        const title = trimmed
          .replace(/^##\s+/, '')
          .replace(/^[-*]\s+/, '')
          .replace(/^\d+\.\s+/, '');

        currentTask = {
          title,
          description: '',
          priority: this.detectPriority(title),
          tags: this.detectTags(title),
          subtasks: [],
          definitionOfDone: [],
          testNotes: [],
          riskFlags: [],
          dependencies: []
        };

        // Ensure we have an epic
        if (!currentEpic) {
          currentEpic = {
            title: 'General Tasks',
            description: 'Auto-generated epic for uncategorized tasks',
            tasks: []
          };
        }
      }
      // Subtask detection (indented bullets or checkboxes)
      else if (trimmed.match(/^\s{2,}[-*]\s+/) || trimmed.match(/^- \[[ x]\]/)) {
        if (currentTask) {
          const subtaskTitle = trimmed
            .replace(/^\s+[-*]\s+/, '')
            .replace(/^- \[[ x]\]\s*/, '');
          currentTask.subtasks.push(subtaskTitle);
        }
      }
      // DoD detection
      else if (trimmed.toLowerCase().includes('definition of done') || trimmed.toLowerCase().includes('acceptance criteria')) {
        // Next lines will be DoD items
        continue;
      }
      // Test notes detection
      else if (trimmed.toLowerCase().includes('test') && trimmed.includes(':')) {
        if (currentTask) {
          const testNote = trimmed.split(':')[1]?.trim() || trimmed;
          const testType = this.detectTestType(trimmed);
          currentTask.testNotes.push({ note: testNote, testType });
        }
      }
      // Risk detection
      else if (trimmed.toLowerCase().includes('risk') || trimmed.toLowerCase().includes('blocker')) {
        if (currentTask) {
          const riskLevel = this.detectRiskLevel(trimmed);
          currentTask.riskFlags.push({
            level: riskLevel,
            description: trimmed,
            mitigation: undefined
          });
        }
      }
      // Description continuation
      else if (trimmed && currentTask) {
        if (!currentTask.description) {
          currentTask.description = trimmed;
        } else {
          currentTask.description += ' ' + trimmed;
        }
      } else if (trimmed && currentEpic && !currentTask) {
        if (!currentEpic.description) {
          currentEpic.description = trimmed;
        } else {
          currentEpic.description += ' ' + trimmed;
        }
      }
    }

    // Push remaining task and epic
    if (currentTask && currentEpic) {
      currentEpic.tasks.push(currentTask);
    }
    if (currentEpic) {
      epics.push(currentEpic);
    }

    // If no epics were found, create a default one
    if (epics.length === 0) {
      epics.push({
        title: 'Project Tasks',
        description: content.substring(0, 200),
        tasks: [{
          title: 'Main Task',
          description: content,
          priority: 3,
          tags: [],
          subtasks: [],
          definitionOfDone: [],
          testNotes: [],
          riskFlags: []
        }]
      });
    }

    return { epics };
  }

  /**
   * Convert parsed data into proper typed structures with IDs
   */
  private static structureBreakdown(parsed: {
    epics: Array<{ title: string; description: string; tasks: ParsedTaskItem[] }>;
  }): TaskBreakdownResult {
    const epics: Epic[] = [];
    const tasks: Task[] = [];
    const subtasks: Subtask[] = [];
    const dependencies: TaskDependency[] = [];
    const definitionsOfDone: DefinitionOfDone[] = [];
    const testNotes: TestNote[] = [];
    const riskFlags: RiskFlag[] = [];

    let epicCounter = 1;
    let taskCounter = 1;

    parsed.epics.forEach(epicData => {
      const epicId = generateId();
      const epic: Epic = {
        id: epicId,
        epicId: `EPIC-${epicCounter++}`,
        title: epicData.title,
        description: epicData.description,
        status: 'backlog',
        priority: 3,
        createdAt: Date.now(),
        updatedAt: Date.now()
      };
      epics.push(epic);

      epicData.tasks.forEach(taskData => {
        const taskId = generateId();
        const task: Task = {
          id: taskId,
          taskId: `TASK-${taskCounter++}`,
          title: taskData.title,
          description: taskData.description,
          status: 'backlog' as TaskStatus,
          priority: taskData.priority,
          tags: taskData.tags,
          commentsCount: 0,
          attachmentsCount: 0,
          createdAt: Date.now(),
          updatedAt: Date.now()
        };
        tasks.push(task);

        // Create subtasks
        taskData.subtasks.forEach((subtaskTitle, index) => {
          const subtask: Subtask = {
            id: generateId(),
            taskId: task.id,
            title: subtaskTitle,
            completed: false,
            orderIndex: index,
            createdAt: Date.now(),
            updatedAt: Date.now()
          };
          subtasks.push(subtask);
        });

        // Create DoD items
        taskData.definitionOfDone.forEach((criterion, index) => {
          const dod: DefinitionOfDone = {
            id: generateId(),
            taskId: task.id,
            criterion,
            completed: false,
            orderIndex: index,
            createdAt: Date.now()
          };
          definitionsOfDone.push(dod);
        });

        // Create test notes
        taskData.testNotes.forEach(noteData => {
          const testNote: TestNote = {
            id: generateId(),
            taskId: task.id,
            note: noteData.note,
            testType: noteData.testType as TestType | undefined,
            createdAt: Date.now(),
            updatedAt: Date.now()
          };
          testNotes.push(testNote);
        });

        // Create risk flags
        taskData.riskFlags.forEach(riskData => {
          const risk: RiskFlag = {
            id: generateId(),
            taskId: task.id,
            riskLevel: riskData.level as RiskLevel,
            description: riskData.description,
            mitigationStrategy: riskData.mitigation,
            resolved: false,
            createdAt: Date.now(),
            updatedAt: Date.now()
          };
          riskFlags.push(risk);
        });
      });
    });

    return {
      epics,
      tasks,
      subtasks,
      dependencies,
      definitionsOfDone,
      testNotes,
      riskFlags
    };
  }

  /**
   * Detect priority from text
   */
  private static detectPriority(text: string): 1 | 2 | 3 | 4 | 5 {
    const lower = text.toLowerCase();
    if (lower.includes('critical') || lower.includes('urgent') || lower.includes('p1')) return 5;
    if (lower.includes('high') || lower.includes('important') || lower.includes('p2')) return 4;
    if (lower.includes('medium') || lower.includes('p3')) return 3;
    if (lower.includes('low') || lower.includes('p4')) return 2;
    return 3; // default medium
  }

  /**
   * Detect tags from text
   */
  private static detectTags(text: string): string[] {
    const tags: string[] = [];
    const lower = text.toLowerCase();

    if (lower.includes('frontend') || lower.includes('ui') || lower.includes('react')) tags.push('frontend');
    if (lower.includes('backend') || lower.includes('api') || lower.includes('server')) tags.push('backend');
    if (lower.includes('database') || lower.includes('db')) tags.push('database');
    if (lower.includes('test') || lower.includes('testing')) tags.push('testing');
    if (lower.includes('bug') || lower.includes('fix')) tags.push('bug');
    if (lower.includes('feature') || lower.includes('new')) tags.push('feature');
    if (lower.includes('refactor')) tags.push('refactor');
    if (lower.includes('docs') || lower.includes('documentation')) tags.push('documentation');

    return tags;
  }

  /**
   * Detect test type from text
   */
  private static detectTestType(text: string): string | undefined {
    const lower = text.toLowerCase();
    if (lower.includes('unit')) return 'unit';
    if (lower.includes('integration')) return 'integration';
    if (lower.includes('e2e') || lower.includes('end-to-end')) return 'e2e';
    if (lower.includes('manual')) return 'manual';
    return undefined;
  }

  /**
   * Detect risk level from text
   */
  private static detectRiskLevel(text: string): string {
    const lower = text.toLowerCase();
    if (lower.includes('critical') || lower.includes('blocker')) return 'critical';
    if (lower.includes('high')) return 'high';
    if (lower.includes('medium')) return 'medium';
    return 'low';
  }
}
