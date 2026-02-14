'use client';

import { useState } from 'react';
import { TestCase, TestType } from '@/types/test';
import {
  Play,
  RotateCcw,
  CheckCircle2,
  XCircle,
  AlertTriangle,
  Circle,
  ChevronDown,
  ChevronRight,
  Activity,
  Zap,
  Eye,
  GitBranch,
  Box
} from 'lucide-react';
import { CodingAgent } from '@/types/agent';

interface TestHarnessProps {
  tests: TestCase[];
  agents: CodingAgent[];
  metrics: {
    totalTests: number;
    passed: number;
    failed: number;
    flaky: number;
    pending: number;
    skipped: number;
    passRate: number;
    averageDuration: number;
    lastRunTime?: number;
  };
  isRunning: boolean;
  onRunTest: (testId: string, agentId?: string) => void;
  onRunAllTests: (agentId?: string) => void;
  onResetTests: () => void;
}

const TEST_TYPE_ICONS: Record<TestType, React.ReactNode> = {
  'unit': <Zap size={14} />,
  'ui-snapshot': <Eye size={14} />,
  'scenario': <GitBranch size={14} />,
  'integration': <Box size={14} />,
};

const TEST_TYPE_LABELS: Record<TestType, string> = {
  'unit': 'Unit',
  'ui-snapshot': 'UI Snapshot',
  'scenario': 'Scenario',
  'integration': 'Integration',
};

export const TestHarness = ({
  tests,
  agents,
  metrics,
  isRunning,
  onRunTest,
  onRunAllTests,
  onResetTests,
}: TestHarnessProps) => {
  const [isExpanded, setIsExpanded] = useState(true);
  const [selectedType, setSelectedType] = useState<TestType | 'all'>('all');
  const [selectedAgent, setSelectedAgent] = useState<string>('');

  const filteredTests = selectedType === 'all'
    ? tests
    : tests.filter(t => t.type === selectedType);

  const getStatusIcon = (status: TestCase['status']) => {
    switch (status) {
      case 'passed':
        return <CheckCircle2 size={16} className="text-green-500" />;
      case 'failed':
        return <XCircle size={16} className="text-red-500" />;
      case 'flaky':
        return <AlertTriangle size={16} className="text-yellow-500" />;
      case 'pending':
        return <Circle size={16} className="text-gray-400" />;
      case 'skipped':
        return <Circle size={16} className="text-gray-300" />;
    }
  };

  const getStatusColor = (status: TestCase['status']) => {
    switch (status) {
      case 'passed':
        return 'bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400 border-green-200 dark:border-green-800';
      case 'failed':
        return 'bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-400 border-red-200 dark:border-red-800';
      case 'flaky':
        return 'bg-yellow-100 dark:bg-yellow-900/30 text-yellow-700 dark:text-yellow-400 border-yellow-200 dark:border-yellow-800';
      case 'pending':
        return 'bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-400 border-gray-200 dark:border-gray-600';
      case 'skipped':
        return 'bg-gray-50 dark:bg-gray-800 text-gray-500 dark:text-gray-500 border-gray-200 dark:border-gray-700';
    }
  };

  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 shadow-sm">
      {/* Header */}
      <div className="p-4 border-b border-gray-200 dark:border-gray-700">
        <div className="flex items-center justify-between mb-3">
          <button
            onClick={() => setIsExpanded(!isExpanded)}
            className="flex items-center gap-2 font-bold text-gray-900 dark:text-white hover:text-gray-700 dark:hover:text-gray-300 transition-colors"
          >
            {isExpanded ? <ChevronDown size={20} /> : <ChevronRight size={20} />}
            <Activity size={20} />
            <span>Test & Evaluation Harness</span>
          </button>
          <div className="flex items-center gap-2">
            <button
              onClick={() => onRunAllTests(selectedAgent || undefined)}
              disabled={isRunning || tests.length === 0}
              className="flex items-center gap-1.5 px-3 py-1.5 bg-green-600 hover:bg-green-700 disabled:bg-gray-400 text-white rounded-lg text-sm font-medium transition-colors disabled:cursor-not-allowed"
            >
              <Play size={14} />
              {isRunning ? 'Running...' : 'Run All'}
            </button>
            <button
              onClick={onResetTests}
              disabled={isRunning}
              className="flex items-center gap-1.5 px-3 py-1.5 bg-gray-600 hover:bg-gray-700 disabled:bg-gray-400 text-white rounded-lg text-sm font-medium transition-colors disabled:cursor-not-allowed"
            >
              <RotateCcw size={14} />
              Reset
            </button>
          </div>
        </div>

        {/* PM Scoreboard */}
        <div className="grid grid-cols-2 md:grid-cols-6 gap-3">
          <div className="bg-gray-50 dark:bg-gray-700 p-3 rounded-lg">
            <div className="text-xs text-gray-500 dark:text-gray-400 mb-1">Total</div>
            <div className="text-2xl font-bold text-gray-900 dark:text-white">{metrics.totalTests}</div>
          </div>
          <div className="bg-green-50 dark:bg-green-900/20 p-3 rounded-lg border border-green-200 dark:border-green-800">
            <div className="text-xs text-green-600 dark:text-green-400 mb-1">Passed</div>
            <div className="text-2xl font-bold text-green-700 dark:text-green-400">{metrics.passed}</div>
          </div>
          <div className="bg-red-50 dark:bg-red-900/20 p-3 rounded-lg border border-red-200 dark:border-red-800">
            <div className="text-xs text-red-600 dark:text-red-400 mb-1">Failed</div>
            <div className="text-2xl font-bold text-red-700 dark:text-red-400">{metrics.failed}</div>
          </div>
          <div className="bg-yellow-50 dark:bg-yellow-900/20 p-3 rounded-lg border border-yellow-200 dark:border-yellow-800">
            <div className="text-xs text-yellow-600 dark:text-yellow-400 mb-1">Flaky</div>
            <div className="text-2xl font-bold text-yellow-700 dark:text-yellow-400">{metrics.flaky}</div>
          </div>
          <div className="bg-gray-50 dark:bg-gray-700 p-3 rounded-lg">
            <div className="text-xs text-gray-500 dark:text-gray-400 mb-1">Pending</div>
            <div className="text-2xl font-bold text-gray-700 dark:text-gray-300">{metrics.pending}</div>
          </div>
          <div className="bg-blue-50 dark:bg-blue-900/20 p-3 rounded-lg border border-blue-200 dark:border-blue-800">
            <div className="text-xs text-blue-600 dark:text-blue-400 mb-1">Pass Rate</div>
            <div className="text-2xl font-bold text-blue-700 dark:text-blue-400">
              {metrics.passRate.toFixed(0)}%
            </div>
          </div>
        </div>

        {/* Last run info */}
        {metrics.lastRunTime && (
          <div className="mt-3 text-xs text-gray-500 dark:text-gray-400">
            Last run: {new Date(metrics.lastRunTime).toLocaleString()} •
            Avg duration: {metrics.averageDuration.toFixed(0)}ms
          </div>
        )}
      </div>

      {/* Test List */}
      {isExpanded && (
        <div className="p-4">
          {/* Filters */}
          <div className="flex gap-3 mb-4">
            <div className="flex-1">
              <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">
                Filter by Type
              </label>
              <select
                className="w-full border border-gray-200 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white px-3 py-1.5 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-black/10 dark:focus:ring-white/20"
                value={selectedType}
                onChange={(e) => setSelectedType(e.target.value as TestType | 'all')}
              >
                <option value="all">All Types</option>
                <option value="unit">Unit Tests</option>
                <option value="ui-snapshot">UI Snapshots</option>
                <option value="scenario">Scenarios</option>
                <option value="integration">Integration</option>
              </select>
            </div>
            <div className="flex-1">
              <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">
                Run as Agent (optional)
              </label>
              <select
                className="w-full border border-gray-200 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white px-3 py-1.5 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-black/10 dark:focus:ring-white/20"
                value={selectedAgent}
                onChange={(e) => setSelectedAgent(e.target.value)}
              >
                <option value="">No Agent</option>
                {agents.map((agent) => (
                  <option key={agent.id} value={agent.id}>
                    {agent.name}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Tests */}
          <div className="space-y-2 max-h-96 overflow-y-auto">
            {filteredTests.length === 0 ? (
              <div className="text-center py-8 text-gray-400 dark:text-gray-500 text-sm">
                No tests found
              </div>
            ) : (
              filteredTests.map((test) => (
                <div
                  key={test.id}
                  className={`p-3 rounded-lg border ${getStatusColor(test.status)} transition-all`}
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex items-start gap-2 flex-1 min-w-0">
                      {getStatusIcon(test.status)}
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1">
                          <span className="font-medium text-sm truncate">{test.name}</span>
                          <span className="flex items-center gap-1 text-xs px-1.5 py-0.5 bg-white/50 dark:bg-black/20 rounded">
                            {TEST_TYPE_ICONS[test.type]}
                            {TEST_TYPE_LABELS[test.type]}
                          </span>
                        </div>
                        {test.description && (
                          <p className="text-xs opacity-80 mb-1">{test.description}</p>
                        )}
                        {test.tags && test.tags.length > 0 && (
                          <div className="flex gap-1 flex-wrap">
                            {test.tags.map((tag, idx) => (
                              <span
                                key={idx}
                                className="text-xs px-1.5 py-0.5 bg-white/50 dark:bg-black/20 rounded"
                              >
                                {tag}
                              </span>
                            ))}
                          </div>
                        )}
                        {test.runCount > 0 && (
                          <div className="text-xs opacity-70 mt-1">
                            Runs: {test.runCount} •
                            Pass: {test.passCount} •
                            Fail: {test.failCount}
                            {test.flakyCount > 0 && ` • Flaky: ${test.flakyCount}`}
                            {test.duration && ` • ${test.duration}ms`}
                          </div>
                        )}
                        {test.errorMessage && (
                          <div className="text-xs mt-2 p-2 bg-red-50 dark:bg-red-900/20 rounded border border-red-200 dark:border-red-800">
                            {test.errorMessage}
                          </div>
                        )}
                      </div>
                    </div>
                    <button
                      onClick={() => onRunTest(test.id, selectedAgent || undefined)}
                      disabled={isRunning}
                      className="flex-shrink-0 p-1.5 hover:bg-white/50 dark:hover:bg-black/20 rounded transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                      title="Run this test"
                    >
                      <Play size={14} />
                    </button>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  );
};
