/**
 * Task Breakdown Service Tests
 *
 * These tests validate the core task breakdown functionality.
 * Run with: npm test (if Jest is configured)
 */

import { taskBreakdownService } from '../task-breakdown';
import { TaskBreakdownInput } from '@/types/task-breakdown';

describe('TaskBreakdownService', () => {
  const userId = 'test-user-123';

  describe('analyzeComplexity', () => {
    it('should classify simple tasks correctly', async () => {
      const input: TaskBreakdownInput = {
        type: 'text',
        content: 'Add a button to the homepage',
      };

      const analysis = await taskBreakdownService.analyzeComplexity(input);

      expect(analysis.complexity).toBe('simple');
      expect(analysis.recommendedSplit.taskCount).toBe(1);
      expect(analysis.recommendedSplit.subtaskCount).toBe(0);
    });

    it('should classify moderate tasks correctly', async () => {
      const input: TaskBreakdownInput = {
        type: 'issue',
        content: 'A'.repeat(1500), // 1500 chars
      };

      const analysis = await taskBreakdownService.analyzeComplexity(input);

      expect(analysis.complexity).toBe('moderate');
      expect(analysis.recommendedSplit.taskCount).toBeGreaterThan(1);
    });

    it('should classify complex tasks correctly', async () => {
      const input: TaskBreakdownInput = {
        type: 'prd',
        content: 'A'.repeat(2500), // 2500 chars
      };

      const analysis = await taskBreakdownService.analyzeComplexity(input);

      expect(analysis.complexity).toBe('complex');
      expect(analysis.recommendedSplit.taskCount).toBeGreaterThanOrEqual(5);
    });

    it('should extract technical stack from content', async () => {
      const input: TaskBreakdownInput = {
        type: 'text',
        content: 'Build a React application with TypeScript and Node.js backend',
      };

      const analysis = await taskBreakdownService.analyzeComplexity(input);

      expect(analysis.technicalStack).toContain('React');
      expect(analysis.technicalStack).toContain('TypeScript');
      expect(analysis.technicalStack).toContain('Node.js');
    });

    it('should extract required skills', async () => {
      const input: TaskBreakdownInput = {
        type: 'text',
        content: 'Frontend work with React and backend API development',
      };

      const analysis = await taskBreakdownService.analyzeComplexity(input);

      expect(analysis.requiredSkills.length).toBeGreaterThan(0);
      const categories = analysis.requiredSkills.map(s => s.category);
      expect(categories).toContain('frontend');
      expect(categories).toContain('backend');
    });
  });

  describe('breakdownTask', () => {
    it('should generate tasks from simple input', async () => {
      const input: TaskBreakdownInput = {
        type: 'text',
        content: 'Add dark mode support to the application',
      };

      const result = await taskBreakdownService.breakdownTask(input, userId);

      expect(result.tasks.length).toBeGreaterThan(0);
      expect(result.tasks[0]).toHaveProperty('id');
      expect(result.tasks[0]).toHaveProperty('taskId');
      expect(result.tasks[0]).toHaveProperty('title');
      expect(result.tasks[0]).toHaveProperty('status');
      expect(result.tasks[0].status).toBe('backlog');
    });

    it('should generate DoD criteria for each task', async () => {
      const input: TaskBreakdownInput = {
        type: 'text',
        content: 'Implement user authentication',
      };

      const result = await taskBreakdownService.breakdownTask(input, userId);

      expect(result.definitionsOfDone.length).toBeGreaterThan(0);

      const firstTaskDoD = result.definitionsOfDone.filter(
        dod => dod.taskId === result.tasks[0].id
      );
      expect(firstTaskDoD.length).toBeGreaterThan(0);
      expect(firstTaskDoD[0]).toHaveProperty('criteria');
      expect(firstTaskDoD[0].isCompleted).toBe(false);
    });

    it('should generate test notes', async () => {
      const input: TaskBreakdownInput = {
        type: 'text',
        content: 'Build a user registration form',
      };

      const result = await taskBreakdownService.breakdownTask(input, userId);

      expect(result.testNotes.length).toBeGreaterThan(0);
      expect(result.testNotes[0]).toHaveProperty('type');
      expect(result.testNotes[0]).toHaveProperty('description');
      expect(['unit', 'integration', 'e2e', 'manual', 'performance']).toContain(
        result.testNotes[0].type
      );
    });

    it('should generate subtasks for complex tasks', async () => {
      const input: TaskBreakdownInput = {
        type: 'prd',
        content: 'A'.repeat(2000), // Complex task
      };

      const result = await taskBreakdownService.breakdownTask(input, userId);

      expect(result.subtasks.length).toBeGreaterThan(0);
      expect(result.subtasks[0]).toHaveProperty('taskId');
      expect(result.subtasks[0]).toHaveProperty('title');
      expect(result.subtasks[0]).toHaveProperty('order');
      expect(result.subtasks[0].status).toBe('pending');
    });

    it('should generate risk flags for complex tasks', async () => {
      const input: TaskBreakdownInput = {
        type: 'prd',
        content: 'A'.repeat(3000), // Very complex task
      };

      const result = await taskBreakdownService.breakdownTask(input, userId);

      expect(result.riskFlags.length).toBeGreaterThan(0);
      expect(result.riskFlags[0]).toHaveProperty('severity');
      expect(result.riskFlags[0]).toHaveProperty('category');
      expect(result.riskFlags[0]).toHaveProperty('description');
      expect(['low', 'medium', 'high', 'critical']).toContain(
        result.riskFlags[0].severity
      );
    });

    it('should generate epic for very complex tasks', async () => {
      const input: TaskBreakdownInput = {
        type: 'prd',
        content: 'A'.repeat(6000), // Very complex task
      };

      const result = await taskBreakdownService.breakdownTask(input, userId);

      expect(result.epic).toBeDefined();
      expect(result.epic?.epicId).toMatch(/^EPIC-\d+$/);
      expect(result.epic?.status).toBe('planning');
    });

    it('should generate task requirements', async () => {
      const input: TaskBreakdownInput = {
        type: 'text',
        content: 'Build a React frontend with TypeScript',
      };

      const result = await taskBreakdownService.breakdownTask(input, userId);

      expect(result.requirements.length).toBeGreaterThan(0);
      expect(result.requirements[0]).toHaveProperty('skillCategory');
      expect(result.requirements[0]).toHaveProperty('skillName');
      expect(result.requirements[0]).toHaveProperty('requiredProficiency');
      expect(result.requirements[0].requiredProficiency).toBeGreaterThanOrEqual(1);
      expect(result.requirements[0].requiredProficiency).toBeLessThanOrEqual(5);
    });

    it('should assign appropriate priority based on complexity', async () => {
      const simpleInput: TaskBreakdownInput = {
        type: 'text',
        content: 'Fix a typo',
      };

      const complexInput: TaskBreakdownInput = {
        type: 'prd',
        content: 'A'.repeat(6000),
      };

      const simpleResult = await taskBreakdownService.breakdownTask(simpleInput, userId);
      const complexResult = await taskBreakdownService.breakdownTask(complexInput, userId);

      expect(simpleResult.tasks[0].priority).toBeLessThan(complexResult.tasks[0].priority);
    });
  });

  describe('edge cases', () => {
    it('should handle empty content gracefully', async () => {
      const input: TaskBreakdownInput = {
        type: 'text',
        content: '',
      };

      const result = await taskBreakdownService.breakdownTask(input, userId);

      expect(result.tasks.length).toBeGreaterThan(0);
    });

    it('should handle very long content', async () => {
      const input: TaskBreakdownInput = {
        type: 'prd',
        content: 'A'.repeat(10000),
      };

      const result = await taskBreakdownService.breakdownTask(input, userId);

      expect(result.tasks.length).toBeGreaterThan(0);
      expect(result.epic).toBeDefined();
    });

    it('should handle special characters in content', async () => {
      const input: TaskBreakdownInput = {
        type: 'text',
        content: 'Task with special chars: @#$%^&*()_+-={}[]|\\:";\'<>?,./`~',
      };

      const result = await taskBreakdownService.breakdownTask(input, userId);

      expect(result.tasks.length).toBeGreaterThan(0);
      expect(result.tasks[0].title).toBeDefined();
    });
  });
});
