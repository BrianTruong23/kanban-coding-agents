'use client';

import { useState } from 'react';
import { ExecutionTrace, ReplayParameters } from '@/types/execution-trace';
import { X, Play, Bookmark } from 'lucide-react';

interface ReplayModalProps {
  trace: ExecutionTrace;
  isOpen: boolean;
  onClose: () => void;
  onReplay: (traceId: string, parameters: ReplayParameters) => void;
}

export const ReplayModal: React.FC<ReplayModalProps> = ({
  trace,
  isOpen,
  onClose,
  onReplay,
}) => {
  const [startFromCheckpoint, setStartFromCheckpoint] = useState<string>('');
  const [stopAtCheckpoint, setStopAtCheckpoint] = useState<string>('');
  const [dryRun, setDryRun] = useState(false);

  if (!isOpen) return null;

  const handleReplay = () => {
    const parameters: ReplayParameters = {
      dryRun,
    };

    if (startFromCheckpoint) {
      parameters.startFromCheckpoint = startFromCheckpoint;
    }
    if (stopAtCheckpoint) {
      parameters.stopAtCheckpoint = stopAtCheckpoint;
    }

    onReplay(trace.id, parameters);
    onClose();
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white dark:bg-gray-900 rounded-lg shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b dark:border-gray-700">
          <div>
            <h2 className="text-xl font-bold">Replay Execution Trace</h2>
            <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
              Configure replay parameters for trace: {trace.id}
            </p>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Body */}
        <div className="p-6 space-y-6">
          {/* Dry Run Option */}
          <div className="flex items-start gap-3">
            <input
              type="checkbox"
              id="dryRun"
              checked={dryRun}
              onChange={(e) => setDryRun(e.target.checked)}
              className="mt-1 w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
            />
            <div className="flex-1">
              <label htmlFor="dryRun" className="font-medium cursor-pointer">
                Dry Run
              </label>
              <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                Simulate the execution without actually making changes. This is useful
                for previewing what would happen during a replay.
              </p>
            </div>
          </div>

          {/* Checkpoint Selection */}
          {trace.checkpoints.length > 0 && (
            <>
              <div>
                <label className="block font-medium mb-2">
                  <Bookmark className="w-4 h-4 inline mr-2" />
                  Start From Checkpoint (Optional)
                </label>
                <p className="text-sm text-gray-600 dark:text-gray-400 mb-3">
                  Resume execution from a specific checkpoint instead of starting from
                  the beginning.
                </p>
                <select
                  value={startFromCheckpoint}
                  onChange={(e) => setStartFromCheckpoint(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="">Start from beginning</option>
                  {trace.checkpoints.map((checkpoint) => (
                    <option key={checkpoint.id} value={checkpoint.id}>
                      {checkpoint.label}
                      {checkpoint.description && ` - ${checkpoint.description}`}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block font-medium mb-2">
                  <Bookmark className="w-4 h-4 inline mr-2" />
                  Stop At Checkpoint (Optional)
                </label>
                <p className="text-sm text-gray-600 dark:text-gray-400 mb-3">
                  Stop execution at a specific checkpoint instead of running to
                  completion.
                </p>
                <select
                  value={stopAtCheckpoint}
                  onChange={(e) => setStopAtCheckpoint(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="">Run to completion</option>
                  {trace.checkpoints.map((checkpoint) => (
                    <option key={checkpoint.id} value={checkpoint.id}>
                      {checkpoint.label}
                      {checkpoint.description && ` - ${checkpoint.description}`}
                    </option>
                  ))}
                </select>
              </div>
            </>
          )}

          {trace.checkpoints.length === 0 && (
            <div className="p-4 bg-yellow-50 dark:bg-yellow-900/20 rounded-lg">
              <p className="text-sm text-yellow-800 dark:text-yellow-200">
                This trace has no checkpoints. The replay will start from the beginning
                and run to completion.
              </p>
            </div>
          )}

          {/* Trace Summary */}
          <div className="p-4 bg-gray-50 dark:bg-gray-800 rounded-lg">
            <h3 className="font-semibold mb-3">Original Trace Summary</h3>
            <div className="grid grid-cols-2 gap-3 text-sm">
              <div>
                <p className="text-gray-600 dark:text-gray-400">Status</p>
                <p className="font-semibold capitalize">{trace.status}</p>
              </div>
              <div>
                <p className="text-gray-600 dark:text-gray-400">Tool Calls</p>
                <p className="font-semibold">{trace.metrics.toolCallCount}</p>
              </div>
              <div>
                <p className="text-gray-600 dark:text-gray-400">File Changes</p>
                <p className="font-semibold">{trace.metrics.fileChangesCount}</p>
              </div>
              <div>
                <p className="text-gray-600 dark:text-gray-400">Tests Run</p>
                <p className="font-semibold">
                  {trace.metrics.testsPassed + trace.metrics.testsFailed}
                </p>
              </div>
            </div>
          </div>

          {/* Warning */}
          {!dryRun && (
            <div className="p-4 bg-red-50 dark:bg-red-900/20 rounded-lg">
              <p className="text-sm text-red-800 dark:text-red-200">
                <strong>Warning:</strong> Replaying this trace will execute the same
                commands and make the same changes as the original execution. Make sure
                you understand the implications before proceeding.
              </p>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="flex items-center justify-end gap-3 p-6 border-t dark:border-gray-700">
          <button
            onClick={onClose}
            className="px-4 py-2 border border-gray-300 dark:border-gray-600 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={handleReplay}
            className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white hover:bg-blue-700 rounded-lg transition-colors"
          >
            <Play className="w-4 h-4" />
            {dryRun ? 'Simulate Replay' : 'Start Replay'}
          </button>
        </div>
      </div>
    </div>
  );
};
