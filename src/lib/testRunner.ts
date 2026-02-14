import { TestCase, TestResult, TestStatus, TestScenario, TestStep } from '@/types/test';

export class TestRunner {
  /**
   * Run a single test case
   */
  static async runTest(test: TestCase, agentId?: string): Promise<TestResult> {
    const startTime = Date.now();

    try {
      let status: TestStatus = 'pending';
      let errorMessage: string | undefined;
      let stackTrace: string | undefined;

      // Simulate test execution based on type
      switch (test.type) {
        case 'unit':
          status = await this.runUnitTest(test);
          break;
        case 'ui-snapshot':
          status = await this.runUISnapshot(test);
          break;
        case 'scenario':
          status = await this.runScenario(test);
          break;
        case 'integration':
          status = await this.runIntegrationTest(test);
          break;
        default:
          status = 'skipped';
      }

      // Detect flakiness: if a test has both passes and fails in history, mark as flaky
      if (test.passCount > 0 && test.failCount > 0 && status === 'failed') {
        status = 'flaky';
      }

      const duration = Date.now() - startTime;

      return {
        testId: test.id,
        status,
        duration,
        timestamp: Date.now(),
        errorMessage,
        stackTrace,
        agentId,
      };
    } catch (error) {
      const duration = Date.now() - startTime;
      return {
        testId: test.id,
        status: 'failed',
        duration,
        timestamp: Date.now(),
        errorMessage: error instanceof Error ? error.message : 'Unknown error',
        stackTrace: error instanceof Error ? error.stack : undefined,
        agentId,
      };
    }
  }

  /**
   * Run unit tests - simulated for now
   */
  private static async runUnitTest(test: TestCase): Promise<TestStatus> {
    // Simulate test execution delay
    await new Promise(resolve => setTimeout(resolve, Math.random() * 200 + 100));

    // Simulate test results with some randomness
    // In a real implementation, this would execute actual test code
    const rand = Math.random();

    if (test.name.includes('should fail')) return 'failed';
    if (test.name.includes('should be flaky')) {
      return rand > 0.5 ? 'passed' : 'failed';
    }

    return rand > 0.1 ? 'passed' : 'failed';
  }

  /**
   * Run UI snapshot tests
   */
  private static async runUISnapshot(test: TestCase): Promise<TestStatus> {
    // Simulate snapshot comparison
    await new Promise(resolve => setTimeout(resolve, Math.random() * 300 + 200));

    // Simulate snapshot matching
    const rand = Math.random();
    return rand > 0.15 ? 'passed' : 'failed';
  }

  /**
   * Run scenario tests
   */
  private static async runScenario(test: TestCase): Promise<TestStatus> {
    // Simulate scenario execution
    await new Promise(resolve => setTimeout(resolve, Math.random() * 500 + 300));

    const rand = Math.random();
    return rand > 0.2 ? 'passed' : 'failed';
  }

  /**
   * Run integration tests
   */
  private static async runIntegrationTest(test: TestCase): Promise<TestStatus> {
    // Simulate integration test execution
    await new Promise(resolve => setTimeout(resolve, Math.random() * 800 + 400));

    const rand = Math.random();
    return rand > 0.25 ? 'passed' : 'failed';
  }

  /**
   * Run all tests in a suite
   */
  static async runTestSuite(tests: TestCase[], agentId?: string): Promise<TestResult[]> {
    const results: TestResult[] = [];

    for (const test of tests) {
      const result = await this.runTest(test, agentId);
      results.push(result);
    }

    return results;
  }

  /**
   * Run tests in parallel
   */
  static async runTestsParallel(tests: TestCase[], agentId?: string): Promise<TestResult[]> {
    const promises = tests.map(test => this.runTest(test, agentId));
    return Promise.all(promises);
  }

  /**
   * Execute a test scenario step by step
   */
  static async executeScenario(scenario: TestScenario): Promise<{
    status: TestStatus;
    steps: TestStep[];
    duration: number;
  }> {
    const startTime = Date.now();
    const updatedSteps: TestStep[] = [];
    let allPassed = true;

    for (const step of scenario.steps) {
      // Simulate step execution
      await new Promise(resolve => setTimeout(resolve, Math.random() * 200 + 100));

      const passed = Math.random() > 0.2;

      updatedSteps.push({
        ...step,
        actual: passed ? step.expected : 'Unexpected result',
        passed,
      });

      if (!passed) {
        allPassed = false;
        // Fail fast - stop on first failure
        break;
      }
    }

    // Add remaining steps as pending if we failed early
    if (!allPassed && updatedSteps.length < scenario.steps.length) {
      for (let i = updatedSteps.length; i < scenario.steps.length; i++) {
        updatedSteps.push({
          ...scenario.steps[i],
          passed: false,
        });
      }
    }

    const duration = Date.now() - startTime;
    const status: TestStatus = allPassed ? 'passed' : 'failed';

    return {
      status,
      steps: updatedSteps,
      duration,
    };
  }
}

/**
 * Calculate test metrics from test cases
 */
export function calculateTestMetrics(tests: TestCase[]): {
  totalTests: number;
  passed: number;
  failed: number;
  flaky: number;
  pending: number;
  skipped: number;
  passRate: number;
  averageDuration: number;
  lastRunTime?: number;
} {
  const totalTests = tests.length;
  const passed = tests.filter(t => t.status === 'passed').length;
  const failed = tests.filter(t => t.status === 'failed').length;
  const flaky = tests.filter(t => t.status === 'flaky').length;
  const pending = tests.filter(t => t.status === 'pending').length;
  const skipped = tests.filter(t => t.status === 'skipped').length;

  const passRate = totalTests > 0 ? (passed / totalTests) * 100 : 0;

  const testsWithDuration = tests.filter(t => t.duration !== undefined);
  const averageDuration = testsWithDuration.length > 0
    ? testsWithDuration.reduce((sum, t) => sum + (t.duration || 0), 0) / testsWithDuration.length
    : 0;

  const lastRunTimes = tests.map(t => t.lastRun).filter((t): t is number => t !== undefined);
  const lastRunTime = lastRunTimes.length > 0 ? Math.max(...lastRunTimes) : undefined;

  return {
    totalTests,
    passed,
    failed,
    flaky,
    pending,
    skipped,
    passRate,
    averageDuration,
    lastRunTime,
  };
}
