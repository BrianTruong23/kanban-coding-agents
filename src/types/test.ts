export type TestType = 'unit' | 'ui-snapshot' | 'scenario' | 'integration';
export type TestStatus = 'passed' | 'failed' | 'flaky' | 'pending' | 'skipped';

export interface TestCase {
  id: string;
  name: string;
  description?: string;
  type: TestType;
  status: TestStatus;
  duration?: number; // in milliseconds
  errorMessage?: string;
  stackTrace?: string;
  lastRun?: number; // timestamp
  runCount: number;
  passCount: number;
  failCount: number;
  flakyCount: number;
  tags?: string[];
  agentId?: string; // The agent that created/owns this test
  createdAt: number;
  updatedAt: number;
}

export interface TestSuite {
  id: string;
  name: string;
  description?: string;
  tests: TestCase[];
  enabled: boolean;
  autoRun: boolean; // Should agents run this automatically?
  runFrequency?: 'on-task-change' | 'on-agent-assignment' | 'manual' | 'periodic';
  createdAt: number;
  updatedAt: number;
}

export interface TestResult {
  testId: string;
  status: TestStatus;
  duration: number;
  timestamp: number;
  errorMessage?: string;
  stackTrace?: string;
  agentId?: string; // The agent that ran the test
}

export interface TestScenario {
  id: string;
  name: string;
  description?: string;
  steps: TestStep[];
  expectedOutcome: string;
  status: TestStatus;
  lastRun?: number;
  createdAt: number;
  updatedAt: number;
}

export interface TestStep {
  id: string;
  description: string;
  action: string;
  expected: string;
  actual?: string;
  passed?: boolean;
}

export interface TestMetrics {
  totalTests: number;
  passed: number;
  failed: number;
  flaky: number;
  pending: number;
  skipped: number;
  passRate: number;
  averageDuration: number;
  lastRunTime?: number;
}
