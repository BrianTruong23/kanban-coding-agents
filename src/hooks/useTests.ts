import { useState, useEffect, useCallback } from 'react';
import { TestCase, TestSuite, TestResult, TestStatus } from '@/types/test';
import { TestRunner, calculateTestMetrics } from '@/lib/testRunner';
import { getSampleTests } from '@/lib/sampleTests';

export function useTests() {
  const [tests, setTests] = useState<TestCase[]>([]);
  const [suites, setSuites] = useState<TestSuite[]>([]);
  const [isRunning, setIsRunning] = useState(false);
  const [isLoaded, setIsLoaded] = useState(false);

  // Load tests from localStorage or use samples
  useEffect(() => {
    const loadTests = () => {
      try {
        const stored = localStorage.getItem('test-cases');
        if (stored) {
          const parsedTests = JSON.parse(stored);
          setTests(parsedTests);
        } else {
          // Initialize with sample tests
          const sampleTests = getSampleTests();
          setTests(sampleTests);
          localStorage.setItem('test-cases', JSON.stringify(sampleTests));
        }
      } catch (error) {
        console.error('Failed to load tests:', error);
        // Fallback to sample tests
        const sampleTests = getSampleTests();
        setTests(sampleTests);
      }
      setIsLoaded(true);
    };

    loadTests();
  }, []);

  // Save tests to localStorage whenever they change
  useEffect(() => {
    if (isLoaded && tests.length > 0) {
      try {
        localStorage.setItem('test-cases', JSON.stringify(tests));
      } catch (error) {
        console.error('Failed to save tests:', error);
      }
    }
  }, [tests, isLoaded]);

  const addTest = useCallback((test: TestCase) => {
    setTests(prev => [...prev, test]);
  }, []);

  const updateTest = useCallback((updatedTest: TestCase) => {
    setTests(prev => prev.map(t => t.id === updatedTest.id ? updatedTest : t));
  }, []);

  const deleteTest = useCallback((testId: string) => {
    setTests(prev => prev.filter(t => t.id !== testId));
  }, []);

  const runTest = useCallback(async (testId: string, agentId?: string) => {
    const test = tests.find(t => t.id === testId);
    if (!test) return;

    setIsRunning(true);

    try {
      const result = await TestRunner.runTest(test, agentId);

      // Update test with result
      const updatedTest: TestCase = {
        ...test,
        status: result.status,
        duration: result.duration,
        errorMessage: result.errorMessage,
        stackTrace: result.stackTrace,
        lastRun: result.timestamp,
        runCount: test.runCount + 1,
        passCount: result.status === 'passed' ? test.passCount + 1 : test.passCount,
        failCount: result.status === 'failed' ? test.failCount + 1 : test.failCount,
        flakyCount: result.status === 'flaky' ? test.flakyCount + 1 : test.flakyCount,
        updatedAt: Date.now(),
      };

      updateTest(updatedTest);
    } catch (error) {
      console.error('Failed to run test:', error);
    } finally {
      setIsRunning(false);
    }
  }, [tests, updateTest]);

  const runAllTests = useCallback(async (agentId?: string) => {
    if (tests.length === 0) return;

    setIsRunning(true);

    try {
      const results = await TestRunner.runTestsParallel(tests, agentId);

      // Update all tests with results
      const updatedTests = tests.map(test => {
        const result = results.find(r => r.testId === test.id);
        if (!result) return test;

        return {
          ...test,
          status: result.status,
          duration: result.duration,
          errorMessage: result.errorMessage,
          stackTrace: result.stackTrace,
          lastRun: result.timestamp,
          runCount: test.runCount + 1,
          passCount: result.status === 'passed' ? test.passCount + 1 : test.passCount,
          failCount: result.status === 'failed' ? test.failCount + 1 : test.failCount,
          flakyCount: result.status === 'flaky' ? test.flakyCount + 1 : test.flakyCount,
          updatedAt: Date.now(),
        };
      });

      setTests(updatedTests);
    } catch (error) {
      console.error('Failed to run tests:', error);
    } finally {
      setIsRunning(false);
    }
  }, [tests]);

  const resetTests = useCallback(() => {
    const resetTests = tests.map(test => ({
      ...test,
      status: 'pending' as TestStatus,
      duration: undefined,
      errorMessage: undefined,
      stackTrace: undefined,
      lastRun: undefined,
      runCount: 0,
      passCount: 0,
      failCount: 0,
      flakyCount: 0,
    }));
    setTests(resetTests);
  }, [tests]);

  const metrics = calculateTestMetrics(tests);

  return {
    tests,
    suites,
    metrics,
    isRunning,
    isLoaded,
    addTest,
    updateTest,
    deleteTest,
    runTest,
    runAllTests,
    resetTests,
  };
}
