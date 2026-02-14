'use client';

import { useState } from 'react';
import { ExecutionTraceSummary, ExecutionStatus } from '@/types/execution-trace';
import {
  Clock,
  CheckCircle,
  XCircle,
  PlayCircle,
  PauseCircle,
  Eye,
  Download,
  Repeat,
  Filter,
} from 'lucide-react';

interface ExecutionTraceListProps {
  traces: ExecutionTraceSummary[];
  onViewTrace: (traceId: string) => void;
  onReplayTrace: (traceId: string) => void;
  onExportTrace: (traceId: string) => void;
}

export const ExecutionTraceList: React.FC<ExecutionTraceListProps> = ({
  traces,
  onViewTrace,
  onReplayTrace,
  onExportTrace,
}) => {
  const [statusFilter, setStatusFilter] = useState<ExecutionStatus | 'all'>('all');
  const [sortBy, setSortBy] = useState<'date' | 'duration'>('date');

  const getStatusIcon = (status: ExecutionStatus) => {
    switch (status) {
      case 'success':
        return <CheckCircle className="w-4 h-4 text-green-500" />;
      case 'failed':
        return <XCircle className="w-4 h-4 text-red-500" />;
      case 'running':
        return <PlayCircle className="w-4 h-4 text-blue-500" />;
      case 'paused':
        return <PauseCircle className="w-4 h-4 text-yellow-500" />;
      default:
        return <Clock className="w-4 h-4 text-gray-500" />;
    }
  };

  const getStatusColor = (status: ExecutionStatus) => {
    switch (status) {
      case 'success':
        return 'bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-200';
      case 'failed':
        return 'bg-red-100 text-red-800 dark:bg-red-900/20 dark:text-red-200';
      case 'running':
        return 'bg-blue-100 text-blue-800 dark:bg-blue-900/20 dark:text-blue-200';
      case 'paused':
        return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/20 dark:text-yellow-200';
      default:
        return 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-200';
    }
  };

  const formatDuration = (ms: number) => {
    const seconds = Math.floor(ms / 1000);
    const minutes = Math.floor(seconds / 60);
    const hours = Math.floor(minutes / 60);

    if (hours > 0) {
      return `${hours}h ${minutes % 60}m`;
    } else if (minutes > 0) {
      return `${minutes}m ${seconds % 60}s`;
    } else {
      return `${seconds}s`;
    }
  };

  const formatTimestamp = (timestamp: number) => {
    const date = new Date(timestamp);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMins / 60);
    const diffDays = Math.floor(diffHours / 24);

    if (diffMins < 1) {
      return 'Just now';
    } else if (diffMins < 60) {
      return `${diffMins} min${diffMins === 1 ? '' : 's'} ago`;
    } else if (diffHours < 24) {
      return `${diffHours} hour${diffHours === 1 ? '' : 's'} ago`;
    } else if (diffDays < 7) {
      return `${diffDays} day${diffDays === 1 ? '' : 's'} ago`;
    } else {
      return date.toLocaleDateString();
    }
  };

  const filteredTraces = traces
    .filter((trace) => statusFilter === 'all' || trace.status === statusFilter)
    .sort((a, b) => {
      if (sortBy === 'date') {
        return b.startTime - a.startTime;
      } else {
        const aDuration = a.duration || 0;
        const bDuration = b.duration || 0;
        return bDuration - aDuration;
      }
    });

  return (
    <div className="space-y-4">
      {/* Filters */}
      <div className="flex flex-wrap items-center gap-4 p-4 bg-white dark:bg-gray-900 rounded-lg shadow-md">
        <div className="flex items-center gap-2">
          <Filter className="w-4 h-4 text-gray-600 dark:text-gray-400" />
          <span className="text-sm font-medium">Filters:</span>
        </div>
        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value as ExecutionStatus | 'all')}
          className="px-3 py-1.5 text-sm border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 focus:outline-none focus:ring-2 focus:ring-blue-500"
        >
          <option value="all">All Status</option>
          <option value="success">Success</option>
          <option value="failed">Failed</option>
          <option value="running">Running</option>
          <option value="paused">Paused</option>
          <option value="pending">Pending</option>
          <option value="cancelled">Cancelled</option>
        </select>
        <select
          value={sortBy}
          onChange={(e) => setSortBy(e.target.value as 'date' | 'duration')}
          className="px-3 py-1.5 text-sm border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 focus:outline-none focus:ring-2 focus:ring-blue-500"
        >
          <option value="date">Sort by Date</option>
          <option value="duration">Sort by Duration</option>
        </select>
        <div className="ml-auto text-sm text-gray-600 dark:text-gray-400">
          {filteredTraces.length} trace{filteredTraces.length === 1 ? '' : 's'}
        </div>
      </div>

      {/* Trace List */}
      {filteredTraces.length === 0 ? (
        <div className="p-8 text-center bg-white dark:bg-gray-900 rounded-lg shadow-md">
          <Clock className="w-12 h-12 mx-auto text-gray-400 mb-3" />
          <p className="text-gray-600 dark:text-gray-400">No execution traces found</p>
        </div>
      ) : (
        <div className="space-y-3">
          {filteredTraces.map((trace) => (
            <div
              key={trace.id}
              className="bg-white dark:bg-gray-900 rounded-lg shadow-md p-4 hover:shadow-lg transition-shadow"
            >
              <div className="flex items-start justify-between gap-4">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-2">
                    {getStatusIcon(trace.status)}
                    <span
                      className={`px-2 py-0.5 text-xs font-semibold rounded ${getStatusColor(
                        trace.status
                      )}`}
                    >
                      {trace.status}
                    </span>
                    <span className="text-sm text-gray-600 dark:text-gray-400">
                      {formatTimestamp(trace.startTime)}
                    </span>
                  </div>
                  <p className="text-sm font-mono text-gray-700 dark:text-gray-300 mb-3 truncate">
                    {trace.id}
                  </p>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-3 text-sm">
                    <div>
                      <p className="text-gray-600 dark:text-gray-400 text-xs">
                        Duration
                      </p>
                      <p className="font-semibold">
                        {trace.duration ? formatDuration(trace.duration) : 'N/A'}
                      </p>
                    </div>
                    <div>
                      <p className="text-gray-600 dark:text-gray-400 text-xs">
                        Tool Calls
                      </p>
                      <p className="font-semibold">{trace.metrics.toolCallCount}</p>
                    </div>
                    <div>
                      <p className="text-gray-600 dark:text-gray-400 text-xs">
                        File Changes
                      </p>
                      <p className="font-semibold">{trace.metrics.fileChangesCount}</p>
                    </div>
                    <div>
                      <p className="text-gray-600 dark:text-gray-400 text-xs">Tests</p>
                      <p className="font-semibold">
                        <span className="text-green-600 dark:text-green-400">
                          {trace.metrics.testsPassed}
                        </span>
                        {' / '}
                        <span className="text-red-600 dark:text-red-400">
                          {trace.metrics.testsFailed}
                        </span>
                      </p>
                    </div>
                  </div>
                </div>
                <div className="flex flex-col gap-2">
                  <button
                    onClick={() => onViewTrace(trace.id)}
                    className="flex items-center gap-2 px-3 py-1.5 text-sm bg-blue-600 text-white hover:bg-blue-700 rounded-lg transition-colors whitespace-nowrap"
                  >
                    <Eye className="w-4 h-4" />
                    View
                  </button>
                  <button
                    onClick={() => onReplayTrace(trace.id)}
                    className="flex items-center gap-2 px-3 py-1.5 text-sm bg-green-600 text-white hover:bg-green-700 rounded-lg transition-colors whitespace-nowrap"
                  >
                    <Repeat className="w-4 h-4" />
                    Replay
                  </button>
                  <button
                    onClick={() => onExportTrace(trace.id)}
                    className="flex items-center gap-2 px-3 py-1.5 text-sm bg-gray-600 text-white hover:bg-gray-700 rounded-lg transition-colors whitespace-nowrap"
                  >
                    <Download className="w-4 h-4" />
                    Export
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};
