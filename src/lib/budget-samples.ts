/**
 * Sample Budget Data and Utilities
 *
 * Provides sample data and helper functions for testing and demonstration purposes.
 */

import { TaskBudget, BudgetLimit, ResourceUsage, BudgetAlert } from '@/types/budget';
import { createDefaultBudget, updateUsage, calculateCost } from './budget-tracker';

/**
 * Sample budget configurations for different task types
 */
export const SAMPLE_BUDGET_TEMPLATES = {
  small: {
    name: 'Small Task',
    description: 'For quick fixes and minor updates',
    limits: {
      tokens: 10_000,
      cost: 1.0,
      time: 600000, // 10 minutes
      retries: 2,
    },
  },
  medium: {
    name: 'Medium Task',
    description: 'For feature development and bug fixes',
    limits: {
      tokens: 50_000,
      cost: 5.0,
      time: 1800000, // 30 minutes
      retries: 3,
    },
  },
  large: {
    name: 'Large Task',
    description: 'For complex features and refactoring',
    limits: {
      tokens: 200_000,
      cost: 20.0,
      time: 7200000, // 2 hours
      retries: 5,
    },
  },
  research: {
    name: 'Research Task',
    description: 'For exploration and analysis',
    limits: {
      tokens: 150_000,
      cost: 15.0,
      time: 5400000, // 90 minutes
      retries: 3,
    },
  },
  critical: {
    name: 'Critical Bug Fix',
    description: 'For urgent production issues',
    limits: {
      tokens: 100_000,
      cost: 50.0, // Higher cost limit for urgency
      time: 3600000, // 1 hour
      retries: 10, // More retries allowed
    },
  },
} as const;

/**
 * Create a sample budget from a template
 */
export function createBudgetFromTemplate(
  taskId: string,
  agentId: string | undefined,
  templateName: keyof typeof SAMPLE_BUDGET_TEMPLATES
): Omit<TaskBudget, 'id' | 'createdAt' | 'updatedAt'> {
  const template = SAMPLE_BUDGET_TEMPLATES[templateName];
  const defaultBudget = createDefaultBudget(taskId, agentId);

  return {
    ...defaultBudget,
    limits: template.limits,
  };
}

/**
 * Simulate resource usage for testing
 */
export function simulateUsage(
  currentUsage: ResourceUsage,
  scenario: 'light' | 'moderate' | 'heavy'
): ResourceUsage {
  const multipliers = {
    light: { tokens: 0.3, cost: 0.3, time: 0.25 },
    moderate: { tokens: 0.6, cost: 0.6, time: 0.5 },
    heavy: { tokens: 0.85, cost: 0.85, time: 0.8 },
  };

  const multiplier = multipliers[scenario];

  return {
    tokens: Math.floor(currentUsage.tokens * multiplier.tokens),
    cost: currentUsage.cost * multiplier.cost,
    time: Math.floor(currentUsage.time * multiplier.time),
    retries: scenario === 'heavy' ? 2 : scenario === 'moderate' ? 1 : 0,
    apiCalls: scenario === 'heavy' ? 50 : scenario === 'moderate' ? 25 : 10,
    fileOperations: scenario === 'heavy' ? 30 : scenario === 'moderate' ? 15 : 5,
  };
}

/**
 * Generate sample usage data that progresses over time
 */
export function generateProgressiveUsage(
  limits: BudgetLimit,
  progressPercentage: number // 0-100
): ResourceUsage {
  const progress = Math.min(Math.max(progressPercentage, 0), 100) / 100;

  // Add some randomness to make it realistic
  const randomFactor = 0.9 + Math.random() * 0.2; // 0.9 to 1.1

  return {
    tokens: limits.tokens ? Math.floor(limits.tokens * progress * randomFactor) : 0,
    cost: limits.cost ? limits.cost * progress * randomFactor : 0,
    time: limits.time ? Math.floor(limits.time * progress * randomFactor) : 0,
    retries: limits.retries ? Math.min(Math.floor(limits.retries * progress), limits.retries) : 0,
    apiCalls: Math.floor(progress * 100 * randomFactor),
    fileOperations: Math.floor(progress * 50 * randomFactor),
  };
}

/**
 * Simulate a series of API calls with realistic usage patterns
 */
export function simulateAPICallSequence(
  model: 'claude-3-opus' | 'claude-3-sonnet' | 'claude-3-haiku' | 'gpt-4' | 'gpt-3.5-turbo',
  numberOfCalls: number
): ResourceUsage {
  let totalUsage: ResourceUsage = {
    tokens: 0,
    cost: 0,
    time: 0,
    retries: 0,
    apiCalls: 0,
    fileOperations: 0,
  };

  for (let i = 0; i < numberOfCalls; i++) {
    // Simulate varying input/output sizes
    const inputTokens = 500 + Math.floor(Math.random() * 1500); // 500-2000 tokens
    const outputTokens = 200 + Math.floor(Math.random() * 800); // 200-1000 tokens
    const callTime = 2000 + Math.floor(Math.random() * 3000); // 2-5 seconds

    const cost = calculateCost(inputTokens, outputTokens, model);

    totalUsage = updateUsage(totalUsage, {
      tokens: inputTokens + outputTokens,
      cost: cost,
      time: callTime,
      apiCalls: 1,
    });

    // Random chance of retry
    if (Math.random() < 0.1) {
      // 10% chance of retry
      totalUsage = updateUsage(totalUsage, { retries: 1 });
    }

    // Random file operations
    if (Math.random() < 0.3) {
      // 30% chance of file op
      totalUsage = updateUsage(totalUsage, {
        fileOperations: Math.floor(Math.random() * 3) + 1,
      });
    }
  }

  return totalUsage;
}

/**
 * Generate sample alerts for testing
 */
export function generateSampleAlerts(budgetId: string, count: number = 3): BudgetAlert[] {
  const alertTypes: Array<'warning' | 'critical' | 'exceeded'> = [
    'warning',
    'critical',
    'exceeded',
  ];
  const resourceTypes: Array<'tokens' | 'cost' | 'time' | 'retries'> = [
    'tokens',
    'cost',
    'time',
    'retries',
  ];

  const alerts: BudgetAlert[] = [];
  const now = Date.now();

  for (let i = 0; i < count; i++) {
    const type = alertTypes[Math.floor(Math.random() * alertTypes.length)];
    const resourceType = resourceTypes[Math.floor(Math.random() * resourceTypes.length)];
    const threshold = type === 'warning' ? 80 : type === 'critical' ? 90 : 100;
    const currentUsage = type === 'warning' ? 82 : type === 'critical' ? 95 : 105;
    const limit = 100;

    alerts.push({
      id: `alert-${i}-${Date.now()}`,
      budgetId,
      timestamp: now - (count - i) * 600000, // Spread over 10 min intervals
      type,
      resourceType,
      message: `${resourceType} budget ${type}: ${currentUsage}% used`,
      threshold,
      currentUsage,
      limit,
    });
  }

  return alerts;
}

/**
 * Simulate a complete task execution with realistic usage pattern
 */
export function simulateTaskExecution(
  limits: BudgetLimit,
  taskComplexity: 'simple' | 'moderate' | 'complex'
): {
  finalUsage: ResourceUsage;
  timeline: Array<{ timestamp: number; usage: ResourceUsage; event: string }>;
} {
  const timeline: Array<{ timestamp: number; usage: ResourceUsage; event: string }> = [];
  let currentUsage: ResourceUsage = {
    tokens: 0,
    cost: 0,
    time: 0,
    retries: 0,
    apiCalls: 0,
    fileOperations: 0,
  };

  const startTime = Date.now();

  // Define phases based on complexity
  const phases = {
    simple: [
      { name: 'Analysis', progress: 0.3, duration: 300000 },
      { name: 'Implementation', progress: 0.7, duration: 600000 },
      { name: 'Testing', progress: 1.0, duration: 300000 },
    ],
    moderate: [
      { name: 'Analysis', progress: 0.2, duration: 600000 },
      { name: 'Planning', progress: 0.35, duration: 300000 },
      { name: 'Implementation', progress: 0.7, duration: 1200000 },
      { name: 'Testing', progress: 0.9, duration: 600000 },
      { name: 'Review', progress: 1.0, duration: 300000 },
    ],
    complex: [
      { name: 'Analysis', progress: 0.15, duration: 900000 },
      { name: 'Planning', progress: 0.25, duration: 600000 },
      { name: 'Implementation', progress: 0.6, duration: 2400000 },
      { name: 'Testing', progress: 0.8, duration: 1200000 },
      { name: 'Debugging', progress: 0.9, duration: 600000 },
      { name: 'Review', progress: 1.0, duration: 300000 },
    ],
  };

  const selectedPhases = phases[taskComplexity];

  selectedPhases.forEach((phase, index) => {
    const phaseUsage = generateProgressiveUsage(limits, phase.progress * 100);

    currentUsage = phaseUsage;
    timeline.push({
      timestamp: startTime + selectedPhases.slice(0, index + 1).reduce((sum, p) => sum + p.duration, 0),
      usage: { ...currentUsage },
      event: `${phase.name} completed`,
    });
  });

  return {
    finalUsage: currentUsage,
    timeline,
  };
}

/**
 * Get budget recommendation based on task tags
 */
export function recommendBudget(
  tags: string[]
): keyof typeof SAMPLE_BUDGET_TEMPLATES {
  const tagStr = tags.join(' ').toLowerCase();

  if (tagStr.includes('critical') || tagStr.includes('urgent') || tagStr.includes('hotfix')) {
    return 'critical';
  }

  if (
    tagStr.includes('research') ||
    tagStr.includes('analysis') ||
    tagStr.includes('investigation')
  ) {
    return 'research';
  }

  if (
    tagStr.includes('refactor') ||
    tagStr.includes('architecture') ||
    tagStr.includes('major')
  ) {
    return 'large';
  }

  if (tagStr.includes('feature') || tagStr.includes('enhancement')) {
    return 'medium';
  }

  return 'small';
}

/**
 * Calculate estimated completion time based on current usage rate
 */
export function estimateCompletion(
  currentUsage: ResourceUsage,
  limits: BudgetLimit,
  elapsedTime: number
): {
  estimatedTotalTime?: number;
  estimatedRemainingTime?: number;
  projectedCost?: number;
  projectedTokens?: number;
  completionPercentage: number;
} {
  // Calculate average percentage across resources
  const percentages: number[] = [];

  if (limits.tokens) {
    percentages.push((currentUsage.tokens / limits.tokens) * 100);
  }
  if (limits.cost) {
    percentages.push((currentUsage.cost / limits.cost) * 100);
  }
  if (limits.time) {
    percentages.push((currentUsage.time / limits.time) * 100);
  }

  const avgPercentage = percentages.length > 0
    ? percentages.reduce((sum, p) => sum + p, 0) / percentages.length
    : 0;

  const completionPercentage = Math.min(avgPercentage, 100);

  if (completionPercentage === 0) {
    return { completionPercentage: 0 };
  }

  const estimatedTotalTime = (elapsedTime / completionPercentage) * 100;
  const estimatedRemainingTime = estimatedTotalTime - elapsedTime;

  const projectedCost = limits.cost
    ? (currentUsage.cost / completionPercentage) * 100
    : undefined;

  const projectedTokens = limits.tokens
    ? Math.floor((currentUsage.tokens / completionPercentage) * 100)
    : undefined;

  return {
    estimatedTotalTime,
    estimatedRemainingTime,
    projectedCost,
    projectedTokens,
    completionPercentage,
  };
}
