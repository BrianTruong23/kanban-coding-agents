# Test & Evaluation Harness

This document describes the integrated Test & Evaluation Harness feature for the Kanban Coding Agents board.

## Overview

The Test Harness provides a comprehensive testing framework embedded directly into the Kanban board. It enables agents to automatically run tests, track test results, and display a PM scoreboard showing test status and metrics.

## Features

### 1. Test Types

The harness supports four types of tests:

- **Unit Tests**: Individual component/function tests
- **UI Snapshots**: Visual regression tests for UI components
- **Scenario Tests**: End-to-end workflow tests
- **Integration Tests**: Database, API, and system integration tests

### 2. Test Status Tracking

Each test can have one of the following statuses:

- **Passed** ✓ - Test completed successfully
- **Failed** ✗ - Test encountered an error or assertion failure
- **Flaky** ⚠ - Test has intermittent failures (detected automatically based on history)
- **Pending** ○ - Test hasn't been run yet
- **Skipped** - Test was skipped during execution

### 3. PM Scoreboard

The scoreboard displays real-time metrics:

- **Total Tests**: Number of all tests in the suite
- **Passed**: Count of successful tests
- **Failed**: Count of failed tests
- **Flaky**: Count of tests with intermittent failures
- **Pending**: Count of tests not yet run
- **Pass Rate**: Percentage of tests passing (Passed / Total)

Additional metrics:
- Last run timestamp
- Average test duration in milliseconds

### 4. Automatic Test Execution

The `AutoTestRunner` component automatically triggers test runs when:

- Task status changes (e.g., moved from "In Progress" to "Review")
- Agent assignment changes (runs tests for the newly assigned agent)

Tests are debounced with a 2-second delay to prevent excessive runs.

## Components

### TestHarness Component

Main UI component that displays:
- Collapsible test panel
- PM scoreboard with metrics
- Test filtering by type
- Agent selector for running tests
- Individual test results with details
- Run controls (Run All, Reset)

**Location**: `src/components/TestHarness.tsx`

### AutoTestRunner Component

Invisible component that monitors task and agent changes and automatically triggers test runs.

**Location**: `src/components/AutoTestRunner.tsx`

### Test Runner Service

Core service that executes tests and returns results.

**Features**:
- Individual test execution
- Parallel test execution
- Scenario step-by-step execution
- Flakiness detection
- Result tracking with timestamps

**Location**: `src/lib/testRunner.ts`

## Data Models

### TestCase

```typescript
interface TestCase {
  id: string;
  name: string;
  description?: string;
  type: TestType; // 'unit' | 'ui-snapshot' | 'scenario' | 'integration'
  status: TestStatus; // 'passed' | 'failed' | 'flaky' | 'pending' | 'skipped'
  duration?: number; // in milliseconds
  errorMessage?: string;
  stackTrace?: string;
  lastRun?: number; // timestamp
  runCount: number;
  passCount: number;
  failCount: number;
  flakyCount: number;
  tags?: string[];
  agentId?: string;
  createdAt: number;
  updatedAt: number;
}
```

### TestResult

```typescript
interface TestResult {
  testId: string;
  status: TestStatus;
  duration: number;
  timestamp: number;
  errorMessage?: string;
  stackTrace?: string;
  agentId?: string;
}
```

## Usage

### Running Tests

1. **Run All Tests**: Click the "Run All" button in the test harness header
2. **Run Individual Test**: Click the play button next to any test
3. **Run as Agent**: Select an agent from the dropdown to run tests in that agent's context

### Filtering Tests

Use the "Filter by Type" dropdown to show only specific test types:
- All Types
- Unit Tests
- UI Snapshots
- Scenarios
- Integration

### Resetting Tests

Click the "Reset" button to clear all test results and return tests to pending status.

### Viewing Test Details

Each test card shows:
- Test name and description
- Test type badge
- Current status icon
- Tags (if any)
- Run statistics (runs, passes, fails, flaky count)
- Execution duration
- Error messages (for failed tests)

## Sample Tests

The system comes pre-loaded with 14 sample tests covering:

- Task creation validation
- Agent assignment logic
- Task status transitions
- Sprint filtering functionality
- Kanban board layout snapshots
- Task card rendering
- Agent selector UI
- Complete task workflow scenarios
- Multi-agent collaboration
- Sprint planning scenarios
- Supabase persistence tests
- Authentication flow tests
- Real-time sync tests
- Network latency handling (intentionally flaky)

**Location**: `src/lib/sampleTests.ts`

## Persistence

Test results are automatically saved to browser localStorage:
- Key: `test-cases`
- Tests are loaded on page load
- Results persist across sessions
- Tests auto-save after each run

## Architecture

```
┌─────────────────────────────────────────────────────────┐
│                      Main Page                          │
│  ┌─────────────────────────────────────────────────┐   │
│  │           AutoTestRunner (invisible)            │   │
│  │  - Monitors task/agent changes                  │   │
│  │  - Triggers automatic test runs                 │   │
│  └─────────────────────────────────────────────────┘   │
│  ┌─────────────────────────────────────────────────┐   │
│  │              TestHarness UI                     │   │
│  │  ┌────────────────────────────────────────┐    │   │
│  │  │        PM Scoreboard                   │    │   │
│  │  │  Total | Passed | Failed | Flaky | %  │    │   │
│  │  └────────────────────────────────────────┘    │   │
│  │  ┌────────────────────────────────────────┐    │   │
│  │  │        Test List                       │    │   │
│  │  │  • Unit Tests                          │    │   │
│  │  │  • UI Snapshots                        │    │   │
│  │  │  • Scenarios                           │    │   │
│  │  │  • Integration Tests                   │    │   │
│  │  └────────────────────────────────────────┘    │   │
│  └─────────────────────────────────────────────────┘   │
│  ┌─────────────────────────────────────────────────┐   │
│  │              Kanban Board                       │   │
│  └─────────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────────┘
```

## Future Enhancements

Potential improvements:

1. **Real Test Execution**: Replace simulated tests with actual test frameworks (Jest, Playwright)
2. **Test Creation UI**: Add UI to create custom tests
3. **Test Suites**: Group tests into configurable suites
4. **Scheduled Runs**: Periodic automatic test execution
5. **Test History**: Track test results over time with charts
6. **Notifications**: Alert on test failures
7. **CI/CD Integration**: Connect with GitHub Actions or other CI systems
8. **Agent-Specific Tests**: Tests that only run for certain agents
9. **Test Dependencies**: Define test execution order
10. **Code Coverage**: Track code coverage metrics

## API Reference

### useTests Hook

```typescript
const {
  tests,        // TestCase[] - All test cases
  metrics,      // TestMetrics - Calculated metrics
  isRunning,    // boolean - Whether tests are running
  isLoaded,     // boolean - Whether tests are loaded
  runTest,      // (testId: string, agentId?: string) => void
  runAllTests,  // (agentId?: string) => void
  resetTests,   // () => void
} = useTests();
```

### TestRunner Methods

```typescript
// Run a single test
TestRunner.runTest(test: TestCase, agentId?: string): Promise<TestResult>

// Run all tests in parallel
TestRunner.runTestsParallel(tests: TestCase[], agentId?: string): Promise<TestResult[]>

// Execute a scenario step by step
TestRunner.executeScenario(scenario: TestScenario): Promise<{
  status: TestStatus;
  steps: TestStep[];
  duration: number;
}>
```

### Calculate Metrics

```typescript
import { calculateTestMetrics } from '@/lib/testRunner';

const metrics = calculateTestMetrics(tests);
// Returns: {
//   totalTests, passed, failed, flaky, pending, skipped,
//   passRate, averageDuration, lastRunTime
// }
```

## Troubleshooting

### Tests Not Running

- Check browser console for errors
- Ensure `isRunning` is false before triggering new runs
- Verify localStorage is not full

### Auto-Run Not Working

- Check that AutoTestRunner is mounted
- Verify `enabled` prop is `true`
- Check console for debounce messages

### Tests Showing as Flaky

- Flaky status is auto-detected when a test has both passes and fails in history
- Review test implementation for race conditions or timing issues
- Consider adding retries or increasing timeouts

## Contributing

To add new test types:

1. Add type to `TestType` in `src/types/test.ts`
2. Implement test runner logic in `src/lib/testRunner.ts`
3. Add icon and label in `TestHarness.tsx`
4. Create sample tests in `src/lib/sampleTests.ts`

## License

Part of the Kanban Coding Agents project.
