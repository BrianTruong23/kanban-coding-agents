'use client';

import { useState } from 'react';
import { useExecutionTraces } from '@/hooks/useExecutionTraces';
import { ExecutionTraceList } from '@/components/ExecutionTraceList';
import { ExecutionTraceViewer } from '@/components/ExecutionTraceViewer';
import { ReplayModal } from '@/components/ReplayModal';
import { createTraceSummary } from '@/lib/execution-trace';
import { ReplayParameters } from '@/types/execution-trace';
import { ArrowLeft, Upload, BarChart3 } from 'lucide-react';

export default function TracesPage() {
  const {
    traces,
    isLoaded,
    getTrace,
    replayTrace,
    exportTrace,
    importTrace,
    statistics,
  } = useExecutionTraces();

  const [selectedTraceId, setSelectedTraceId] = useState<string | null>(null);
  const [replayModalOpen, setReplayModalOpen] = useState(false);
  const [replayTraceId, setReplayTraceId] = useState<string | null>(null);
  const [showStats, setShowStats] = useState(false);

  const selectedTrace = selectedTraceId
    ? traces.find((t) => t.id === selectedTraceId)
    : null;

  const replayModalTrace = replayTraceId
    ? traces.find((t) => t.id === replayTraceId)
    : null;

  const handleViewTrace = (traceId: string) => {
    setSelectedTraceId(traceId);
  };

  const handleReplayTrace = (traceId: string) => {
    setReplayTraceId(traceId);
    setReplayModalOpen(true);
  };

  const handleReplayConfirm = async (traceId: string, parameters: ReplayParameters) => {
    try {
      const newTrace = await replayTrace(traceId, parameters);
      if (newTrace) {
        alert('Replay started successfully!');
        setSelectedTraceId(newTrace.id);
      }
    } catch (error) {
      alert('Failed to start replay: ' + (error as Error).message);
    }
  };

  const handleExportTrace = (traceId: string) => {
    const json = exportTrace(traceId);
    if (json) {
      const blob = new Blob([json], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `execution-trace-${traceId}.json`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    }
  };

  const handleImportTrace = () => {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = 'application/json';
    input.onchange = async (e) => {
      const file = (e.target as HTMLInputElement).files?.[0];
      if (file) {
        const reader = new FileReader();
        reader.onload = async (event) => {
          try {
            const json = event.target?.result as string;
            await importTrace(json);
            alert('Trace imported successfully!');
          } catch (error) {
            alert('Failed to import trace: ' + (error as Error).message);
          }
        };
        reader.readAsText(file);
      }
    };
    input.click();
  };

  if (!isLoaded) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600 dark:text-gray-400">Loading execution traces...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-950 p-4 md:p-8">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-6">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-4">
              {selectedTraceId && (
                <button
                  onClick={() => setSelectedTraceId(null)}
                  className="flex items-center gap-2 px-3 py-2 bg-white dark:bg-gray-900 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg shadow-md transition-colors"
                >
                  <ArrowLeft className="w-4 h-4" />
                  Back to List
                </button>
              )}
              <h1 className="text-3xl font-bold">Execution Traces</h1>
            </div>
            <div className="flex gap-2">
              <button
                onClick={() => setShowStats(!showStats)}
                className="flex items-center gap-2 px-4 py-2 bg-purple-600 text-white hover:bg-purple-700 rounded-lg shadow-md transition-colors"
              >
                <BarChart3 className="w-4 h-4" />
                {showStats ? 'Hide Stats' : 'Show Stats'}
              </button>
              <button
                onClick={handleImportTrace}
                className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white hover:bg-blue-700 rounded-lg shadow-md transition-colors"
              >
                <Upload className="w-4 h-4" />
                Import
              </button>
            </div>
          </div>

          {/* Statistics */}
          {showStats && (
            <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-8 gap-4 mb-6">
              <div className="p-4 bg-white dark:bg-gray-900 rounded-lg shadow-md">
                <p className="text-xs text-gray-600 dark:text-gray-400">Total Traces</p>
                <p className="text-2xl font-bold">{statistics.totalTraces}</p>
              </div>
              <div className="p-4 bg-green-50 dark:bg-green-900/20 rounded-lg shadow-md">
                <p className="text-xs text-green-600 dark:text-green-400">Successful</p>
                <p className="text-2xl font-bold text-green-700 dark:text-green-300">
                  {statistics.successfulTraces}
                </p>
              </div>
              <div className="p-4 bg-red-50 dark:bg-red-900/20 rounded-lg shadow-md">
                <p className="text-xs text-red-600 dark:text-red-400">Failed</p>
                <p className="text-2xl font-bold text-red-700 dark:text-red-300">
                  {statistics.failedTraces}
                </p>
              </div>
              <div className="p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg shadow-md">
                <p className="text-xs text-blue-600 dark:text-blue-400">Avg Duration</p>
                <p className="text-2xl font-bold text-blue-700 dark:text-blue-300">
                  {Math.floor(statistics.averageDuration / 1000)}s
                </p>
              </div>
              <div className="p-4 bg-white dark:bg-gray-900 rounded-lg shadow-md">
                <p className="text-xs text-gray-600 dark:text-gray-400">Tool Calls</p>
                <p className="text-2xl font-bold">{statistics.totalToolCalls}</p>
              </div>
              <div className="p-4 bg-white dark:bg-gray-900 rounded-lg shadow-md">
                <p className="text-xs text-gray-600 dark:text-gray-400">File Changes</p>
                <p className="text-2xl font-bold">{statistics.totalFileChanges}</p>
              </div>
              <div className="p-4 bg-white dark:bg-gray-900 rounded-lg shadow-md">
                <p className="text-xs text-gray-600 dark:text-gray-400">Tests Passed</p>
                <p className="text-2xl font-bold text-green-600 dark:text-green-400">
                  {statistics.totalTestsPassed}
                </p>
              </div>
              <div className="p-4 bg-white dark:bg-gray-900 rounded-lg shadow-md">
                <p className="text-xs text-gray-600 dark:text-gray-400">Tokens Used</p>
                <p className="text-2xl font-bold">{statistics.totalTokensUsed}</p>
              </div>
            </div>
          )}
        </div>

        {/* Content */}
        {selectedTrace ? (
          <ExecutionTraceViewer
            trace={selectedTrace}
            onReplay={handleReplayTrace}
            onExport={handleExportTrace}
          />
        ) : (
          <ExecutionTraceList
            traces={traces.map(createTraceSummary)}
            onViewTrace={handleViewTrace}
            onReplayTrace={handleReplayTrace}
            onExportTrace={handleExportTrace}
          />
        )}

        {/* Replay Modal */}
        {replayModalTrace && (
          <ReplayModal
            trace={replayModalTrace}
            isOpen={replayModalOpen}
            onClose={() => {
              setReplayModalOpen(false);
              setReplayTraceId(null);
            }}
            onReplay={handleReplayConfirm}
          />
        )}
      </div>
    </div>
  );
}
