'use client';

import { useState } from 'react';
import { ExecutionTrace, ToolCall, FileDiff, TestLog, Prompt, Checkpoint } from '@/types/execution-trace';
import {
  Clock,
  CheckCircle,
  XCircle,
  PlayCircle,
  PauseCircle,
  Terminal,
  FileEdit,
  TestTube,
  MessageSquare,
  Bookmark,
  Download,
  Repeat,
  ChevronDown,
  ChevronRight,
} from 'lucide-react';

interface ExecutionTraceViewerProps {
  trace: ExecutionTrace;
  onReplay?: (traceId: string) => void;
  onExport?: (traceId: string) => void;
}

export const ExecutionTraceViewer: React.FC<ExecutionTraceViewerProps> = ({
  trace,
  onReplay,
  onExport,
}) => {
  const [expandedSections, setExpandedSections] = useState<Set<string>>(
    new Set(['overview'])
  );

  const toggleSection = (section: string) => {
    setExpandedSections((prev) => {
      const newSet = new Set(prev);
      if (newSet.has(section)) {
        newSet.delete(section);
      } else {
        newSet.add(section);
      }
      return newSet;
    });
  };

  const getStatusIcon = () => {
    switch (trace.status) {
      case 'success':
        return <CheckCircle className="w-5 h-5 text-green-500" />;
      case 'failed':
        return <XCircle className="w-5 h-5 text-red-500" />;
      case 'running':
        return <PlayCircle className="w-5 h-5 text-blue-500" />;
      case 'paused':
        return <PauseCircle className="w-5 h-5 text-yellow-500" />;
      default:
        return <Clock className="w-5 h-5 text-gray-500" />;
    }
  };

  const formatDuration = (ms: number) => {
    const seconds = Math.floor(ms / 1000);
    const minutes = Math.floor(seconds / 60);
    const hours = Math.floor(minutes / 60);

    if (hours > 0) {
      return `${hours}h ${minutes % 60}m ${seconds % 60}s`;
    } else if (minutes > 0) {
      return `${minutes}m ${seconds % 60}s`;
    } else {
      return `${seconds}s`;
    }
  };

  const formatTimestamp = (timestamp: number) => {
    return new Date(timestamp).toLocaleString();
  };

  const SectionHeader = ({ title, icon, count, sectionKey }: {
    title: string;
    icon: React.ReactNode;
    count?: number;
    sectionKey: string;
  }) => (
    <button
      onClick={() => toggleSection(sectionKey)}
      className="flex items-center justify-between w-full p-3 bg-gray-100 dark:bg-gray-800 hover:bg-gray-200 dark:hover:bg-gray-700 rounded-lg transition-colors"
    >
      <div className="flex items-center gap-2">
        {expandedSections.has(sectionKey) ? (
          <ChevronDown className="w-4 h-4" />
        ) : (
          <ChevronRight className="w-4 h-4" />
        )}
        {icon}
        <span className="font-semibold">{title}</span>
        {count !== undefined && (
          <span className="px-2 py-0.5 text-xs bg-gray-300 dark:bg-gray-600 rounded-full">
            {count}
          </span>
        )}
      </div>
    </button>
  );

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="bg-white dark:bg-gray-900 rounded-lg shadow-md p-6">
        <div className="flex items-start justify-between mb-4">
          <div className="flex items-center gap-3">
            {getStatusIcon()}
            <div>
              <h2 className="text-xl font-bold">Execution Trace</h2>
              <p className="text-sm text-gray-600 dark:text-gray-400">{trace.id}</p>
            </div>
          </div>
          <div className="flex gap-2">
            {onExport && (
              <button
                onClick={() => onExport(trace.id)}
                className="flex items-center gap-2 px-3 py-2 text-sm bg-gray-200 dark:bg-gray-700 hover:bg-gray-300 dark:hover:bg-gray-600 rounded-lg transition-colors"
              >
                <Download className="w-4 h-4" />
                Export
              </button>
            )}
            {onReplay && (
              <button
                onClick={() => onReplay(trace.id)}
                className="flex items-center gap-2 px-3 py-2 text-sm bg-blue-600 text-white hover:bg-blue-700 rounded-lg transition-colors"
              >
                <Repeat className="w-4 h-4" />
                Replay
              </button>
            )}
          </div>
        </div>

        {/* Overview Section */}
        <SectionHeader
          title="Overview"
          icon={<Clock className="w-4 h-4" />}
          sectionKey="overview"
        />
        {expandedSections.has('overview') && (
          <div className="mt-3 grid grid-cols-2 md:grid-cols-4 gap-4 p-3 bg-gray-50 dark:bg-gray-800 rounded-lg">
            <div>
              <p className="text-xs text-gray-600 dark:text-gray-400">Status</p>
              <p className="font-semibold capitalize">{trace.status}</p>
            </div>
            <div>
              <p className="text-xs text-gray-600 dark:text-gray-400">Duration</p>
              <p className="font-semibold">
                {trace.endTime
                  ? formatDuration(trace.endTime - trace.startTime)
                  : 'In progress'}
              </p>
            </div>
            <div>
              <p className="text-xs text-gray-600 dark:text-gray-400">Started</p>
              <p className="font-semibold text-sm">
                {formatTimestamp(trace.startTime)}
              </p>
            </div>
            <div>
              <p className="text-xs text-gray-600 dark:text-gray-400">Tool Calls</p>
              <p className="font-semibold">{trace.metrics.toolCallCount}</p>
            </div>
          </div>
        )}
      </div>

      {/* Metrics */}
      <div className="bg-white dark:bg-gray-900 rounded-lg shadow-md p-6">
        <h3 className="text-lg font-semibold mb-4">Metrics</h3>
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
          <div className="p-3 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
            <p className="text-xs text-blue-600 dark:text-blue-400">Tool Calls</p>
            <p className="text-2xl font-bold text-blue-700 dark:text-blue-300">
              {trace.metrics.toolCallCount}
            </p>
          </div>
          <div className="p-3 bg-green-50 dark:bg-green-900/20 rounded-lg">
            <p className="text-xs text-green-600 dark:text-green-400">File Changes</p>
            <p className="text-2xl font-bold text-green-700 dark:text-green-300">
              {trace.metrics.fileChangesCount}
            </p>
          </div>
          <div className="p-3 bg-purple-50 dark:bg-purple-900/20 rounded-lg">
            <p className="text-xs text-purple-600 dark:text-purple-400">Tests Passed</p>
            <p className="text-2xl font-bold text-purple-700 dark:text-purple-300">
              {trace.metrics.testsPassed}
            </p>
          </div>
          <div className="p-3 bg-red-50 dark:bg-red-900/20 rounded-lg">
            <p className="text-xs text-red-600 dark:text-red-400">Tests Failed</p>
            <p className="text-2xl font-bold text-red-700 dark:text-red-300">
              {trace.metrics.testsFailed}
            </p>
          </div>
          <div className="p-3 bg-yellow-50 dark:bg-yellow-900/20 rounded-lg">
            <p className="text-xs text-yellow-600 dark:text-yellow-400">Tokens</p>
            <p className="text-2xl font-bold text-yellow-700 dark:text-yellow-300">
              {trace.metrics.tokensUsed}
            </p>
          </div>
          <div className="p-3 bg-gray-50 dark:bg-gray-700 rounded-lg">
            <p className="text-xs text-gray-600 dark:text-gray-400">Errors</p>
            <p className="text-2xl font-bold text-gray-700 dark:text-gray-300">
              {trace.metrics.errorCount}
            </p>
          </div>
        </div>
      </div>

      {/* Prompts Section */}
      {trace.prompts.length > 0 && (
        <div className="bg-white dark:bg-gray-900 rounded-lg shadow-md p-6">
          <SectionHeader
            title="Prompts"
            icon={<MessageSquare className="w-4 h-4" />}
            count={trace.prompts.length}
            sectionKey="prompts"
          />
          {expandedSections.has('prompts') && (
            <div className="mt-3 space-y-2">
              {trace.prompts.map((prompt) => (
                <div
                  key={prompt.id}
                  className="p-3 bg-gray-50 dark:bg-gray-800 rounded-lg"
                >
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-xs font-semibold uppercase text-gray-600 dark:text-gray-400">
                      {prompt.role}
                    </span>
                    <span className="text-xs text-gray-500">
                      {formatTimestamp(prompt.timestamp)}
                    </span>
                  </div>
                  <p className="text-sm whitespace-pre-wrap">{prompt.content}</p>
                  {prompt.tokens && (
                    <p className="text-xs text-gray-500 mt-2">
                      Tokens: {prompt.tokens}
                    </p>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Tool Calls Section */}
      {trace.toolCalls.length > 0 && (
        <div className="bg-white dark:bg-gray-900 rounded-lg shadow-md p-6">
          <SectionHeader
            title="Tool Calls"
            icon={<Terminal className="w-4 h-4" />}
            count={trace.toolCalls.length}
            sectionKey="toolCalls"
          />
          {expandedSections.has('toolCalls') && (
            <div className="mt-3 space-y-2">
              {trace.toolCalls.map((toolCall) => (
                <div
                  key={toolCall.id}
                  className={`p-3 rounded-lg ${
                    toolCall.error
                      ? 'bg-red-50 dark:bg-red-900/20'
                      : 'bg-gray-50 dark:bg-gray-800'
                  }`}
                >
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-xs font-semibold uppercase">
                      {toolCall.type}
                    </span>
                    <div className="flex items-center gap-2 text-xs text-gray-500">
                      {toolCall.duration && <span>{toolCall.duration}ms</span>}
                      <span>{formatTimestamp(toolCall.timestamp)}</span>
                    </div>
                  </div>
                  {toolCall.command && (
                    <code className="block text-sm bg-gray-900 dark:bg-gray-950 text-green-400 p-2 rounded mb-2">
                      {toolCall.command}
                    </code>
                  )}
                  <p className="text-sm mb-2">{toolCall.input}</p>
                  {toolCall.output && (
                    <pre className="text-xs bg-gray-900 dark:bg-gray-950 text-gray-300 p-2 rounded overflow-x-auto">
                      {toolCall.output}
                    </pre>
                  )}
                  {toolCall.error && (
                    <p className="text-sm text-red-600 dark:text-red-400 mt-2">
                      Error: {toolCall.error}
                    </p>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* File Diffs Section */}
      {trace.diffs.length > 0 && (
        <div className="bg-white dark:bg-gray-900 rounded-lg shadow-md p-6">
          <SectionHeader
            title="File Changes"
            icon={<FileEdit className="w-4 h-4" />}
            count={trace.diffs.length}
            sectionKey="diffs"
          />
          {expandedSections.has('diffs') && (
            <div className="mt-3 space-y-2">
              {trace.diffs.map((diff) => (
                <div
                  key={diff.id}
                  className="p-3 bg-gray-50 dark:bg-gray-800 rounded-lg"
                >
                  <div className="flex items-center justify-between mb-2">
                    <code className="text-sm font-semibold">{diff.filePath}</code>
                    <div className="flex items-center gap-2">
                      <span
                        className={`text-xs px-2 py-0.5 rounded ${
                          diff.changeType === 'create'
                            ? 'bg-green-200 dark:bg-green-900 text-green-800 dark:text-green-200'
                            : diff.changeType === 'delete'
                            ? 'bg-red-200 dark:bg-red-900 text-red-800 dark:text-red-200'
                            : 'bg-blue-200 dark:bg-blue-900 text-blue-800 dark:text-blue-200'
                        }`}
                      >
                        {diff.changeType}
                      </span>
                      <span className="text-xs text-gray-500">
                        {formatTimestamp(diff.timestamp)}
                      </span>
                    </div>
                  </div>
                  {diff.diff && (
                    <pre className="text-xs bg-gray-900 dark:bg-gray-950 text-gray-300 p-2 rounded overflow-x-auto">
                      {diff.diff}
                    </pre>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Test Logs Section */}
      {trace.testLogs.length > 0 && (
        <div className="bg-white dark:bg-gray-900 rounded-lg shadow-md p-6">
          <SectionHeader
            title="Test Results"
            icon={<TestTube className="w-4 h-4" />}
            count={trace.testLogs.length}
            sectionKey="tests"
          />
          {expandedSections.has('tests') && (
            <div className="mt-3 space-y-2">
              {trace.testLogs.map((test) => (
                <div
                  key={test.id}
                  className={`p-3 rounded-lg ${
                    test.status === 'passed'
                      ? 'bg-green-50 dark:bg-green-900/20'
                      : test.status === 'failed'
                      ? 'bg-red-50 dark:bg-red-900/20'
                      : 'bg-gray-50 dark:bg-gray-800'
                  }`}
                >
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm font-semibold">{test.testName}</span>
                    <div className="flex items-center gap-2">
                      <span
                        className={`text-xs px-2 py-0.5 rounded ${
                          test.status === 'passed'
                            ? 'bg-green-200 dark:bg-green-900 text-green-800 dark:text-green-200'
                            : test.status === 'failed'
                            ? 'bg-red-200 dark:bg-red-900 text-red-800 dark:text-red-200'
                            : 'bg-gray-200 dark:bg-gray-700 text-gray-800 dark:text-gray-200'
                        }`}
                      >
                        {test.status}
                      </span>
                      <span className="text-xs text-gray-500">{test.duration}ms</span>
                    </div>
                  </div>
                  {test.output && (
                    <pre className="text-xs bg-gray-900 dark:bg-gray-950 text-gray-300 p-2 rounded overflow-x-auto">
                      {test.output}
                    </pre>
                  )}
                  {test.error && (
                    <p className="text-sm text-red-600 dark:text-red-400 mt-2">
                      {test.error}
                    </p>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Checkpoints Section */}
      {trace.checkpoints.length > 0 && (
        <div className="bg-white dark:bg-gray-900 rounded-lg shadow-md p-6">
          <SectionHeader
            title="Checkpoints"
            icon={<Bookmark className="w-4 h-4" />}
            count={trace.checkpoints.length}
            sectionKey="checkpoints"
          />
          {expandedSections.has('checkpoints') && (
            <div className="mt-3 space-y-2">
              {trace.checkpoints.map((checkpoint) => (
                <div
                  key={checkpoint.id}
                  className="p-3 bg-gray-50 dark:bg-gray-800 rounded-lg"
                >
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm font-semibold">{checkpoint.label}</span>
                    <span className="text-xs text-gray-500">
                      {formatTimestamp(checkpoint.timestamp)}
                    </span>
                  </div>
                  {checkpoint.description && (
                    <p className="text-sm text-gray-600 dark:text-gray-400">
                      {checkpoint.description}
                    </p>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
};
