'use client';

import { useState } from 'react';
import { Task, TaskBreakdown, TaskBreakdownInput } from '@/types/task';
import { X, FileText, Image, Code2, Loader2, AlertCircle, CheckCircle2, Clock, AlertTriangle } from 'lucide-react';
import { breakdownTask } from '@/lib/taskBreakdown';

interface TaskBreakdownModalProps {
  isOpen: boolean;
  onClose: () => void;
  onApplyBreakdown: (breakdown: TaskBreakdown) => void;
  existingTaskCount: number;
}

export const TaskBreakdownModal = ({
  isOpen,
  onClose,
  onApplyBreakdown,
  existingTaskCount
}: TaskBreakdownModalProps) => {
  const [inputType, setInputType] = useState<'issue' | 'prd' | 'screenshot'>('issue');
  const [content, setContent] = useState('');
  const [imageUrl, setImageUrl] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);
  const [breakdown, setBreakdown] = useState<TaskBreakdown | null>(null);
  const [error, setError] = useState<string | null>(null);

  const handleBreakdown = async () => {
    if (!content.trim() && inputType !== 'screenshot') {
      setError('Please provide content to analyze');
      return;
    }

    setIsProcessing(true);
    setError(null);

    try {
      const input: TaskBreakdownInput = {
        type: inputType,
        content,
        imageUrl: inputType === 'screenshot' ? imageUrl : undefined
      };

      const result = await breakdownTask(input, existingTaskCount);
      setBreakdown(result);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to break down task');
      console.error(err);
    } finally {
      setIsProcessing(false);
    }
  };

  const handleApply = () => {
    if (breakdown) {
      onApplyBreakdown(breakdown);
      handleClose();
    }
  };

  const handleClose = () => {
    setContent('');
    setImageUrl('');
    setBreakdown(null);
    setError(null);
    onClose();
  };

  const getTotalTasks = () => {
    if (!breakdown) return 0;
    return (breakdown.epic ? 1 : 0) +
           breakdown.stories.length +
           breakdown.tasks.length +
           breakdown.subtasks.length;
  };

  const getTotalEstimatedHours = () => {
    if (!breakdown) return 0;
    const allTasks = [
      ...(breakdown.epic ? [breakdown.epic] : []),
      ...breakdown.stories,
      ...breakdown.tasks,
      ...breakdown.subtasks
    ];
    return allTasks.reduce((sum, task) => sum + (task.estimatedHours || 0), 0);
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4" onClick={handleClose}>
      <div
        className="bg-white dark:bg-gray-800 rounded-xl w-full max-w-4xl max-h-[90vh] overflow-hidden shadow-2xl flex flex-col"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200 dark:border-gray-700">
          <div>
            <h3 className="text-xl font-bold text-gray-900 dark:text-white">AI Task Breakdown</h3>
            <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
              Automatically break down issues, PRDs, or screenshots into structured tasks
            </p>
          </div>
          <button
            onClick={handleClose}
            className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
          >
            <X size={24} />
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6">
          {!breakdown ? (
            <div className="space-y-6">
              {/* Input Type Selection */}
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">
                  Input Type
                </label>
                <div className="grid grid-cols-3 gap-3">
                  <button
                    onClick={() => setInputType('issue')}
                    className={`p-4 rounded-lg border-2 transition-all ${
                      inputType === 'issue'
                        ? 'border-black dark:border-white bg-gray-50 dark:bg-gray-700'
                        : 'border-gray-200 dark:border-gray-600 hover:border-gray-300 dark:hover:border-gray-500'
                    }`}
                  >
                    <FileText className="mx-auto mb-2" size={24} />
                    <div className="text-sm font-medium">GitHub Issue</div>
                  </button>
                  <button
                    onClick={() => setInputType('prd')}
                    className={`p-4 rounded-lg border-2 transition-all ${
                      inputType === 'prd'
                        ? 'border-black dark:border-white bg-gray-50 dark:bg-gray-700'
                        : 'border-gray-200 dark:border-gray-600 hover:border-gray-300 dark:hover:border-gray-500'
                    }`}
                  >
                    <Code2 className="mx-auto mb-2" size={24} />
                    <div className="text-sm font-medium">PRD/Spec</div>
                  </button>
                  <button
                    onClick={() => setInputType('screenshot')}
                    className={`p-4 rounded-lg border-2 transition-all ${
                      inputType === 'screenshot'
                        ? 'border-black dark:border-white bg-gray-50 dark:bg-gray-700'
                        : 'border-gray-200 dark:border-gray-600 hover:border-gray-300 dark:hover:border-gray-500'
                    }`}
                  >
                    <Image className="mx-auto mb-2" size={24} />
                    <div className="text-sm font-medium">Screenshot</div>
                  </button>
                </div>
              </div>

              {/* Content Input */}
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  {inputType === 'screenshot' ? 'Description & Image URL' : 'Content'}
                </label>
                <textarea
                  className="w-full border border-gray-200 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white p-3 rounded-lg h-48 focus:outline-none focus:ring-2 focus:ring-black/10 dark:focus:ring-white/20 resize-none font-mono text-sm"
                  placeholder={
                    inputType === 'issue'
                      ? 'Paste GitHub issue content here...\n\nExample:\nImplement user authentication system\n- Add login page\n- Create API endpoints\n- Setup JWT tokens'
                      : inputType === 'prd'
                      ? 'Paste PRD or specification here...'
                      : 'Describe what you see in the screenshot...'
                  }
                  value={content}
                  onChange={(e) => setContent(e.target.value)}
                />
              </div>

              {inputType === 'screenshot' && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Image URL (optional)
                  </label>
                  <input
                    type="url"
                    className="w-full border border-gray-200 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white p-3 rounded-lg focus:outline-none focus:ring-2 focus:ring-black/10 dark:focus:ring-white/20"
                    placeholder="https://example.com/screenshot.png"
                    value={imageUrl}
                    onChange={(e) => setImageUrl(e.target.value)}
                  />
                </div>
              )}

              {error && (
                <div className="p-3 bg-red-50 dark:bg-red-900/30 border border-red-200 dark:border-red-800 rounded-lg flex items-center gap-2 text-sm text-red-600 dark:text-red-400">
                  <AlertCircle size={16} />
                  {error}
                </div>
              )}

              <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-4 text-sm text-blue-800 dark:text-blue-200">
                <strong>Note:</strong> This is a mock AI service. In production, this would integrate with
                an LLM API (OpenAI, Anthropic, etc.) to intelligently parse and break down tasks.
              </div>
            </div>
          ) : (
            <div className="space-y-6">
              {/* Breakdown Summary */}
              <div className="grid grid-cols-4 gap-4">
                <div className="bg-gray-50 dark:bg-gray-700 rounded-lg p-4">
                  <div className="text-2xl font-bold text-gray-900 dark:text-white">{getTotalTasks()}</div>
                  <div className="text-xs text-gray-600 dark:text-gray-400">Total Tasks</div>
                </div>
                <div className="bg-gray-50 dark:bg-gray-700 rounded-lg p-4">
                  <div className="text-2xl font-bold text-gray-900 dark:text-white">{breakdown.dependencies.length}</div>
                  <div className="text-xs text-gray-600 dark:text-gray-400">Dependencies</div>
                </div>
                <div className="bg-gray-50 dark:bg-gray-700 rounded-lg p-4">
                  <div className="text-2xl font-bold text-gray-900 dark:text-white">{getTotalEstimatedHours()}h</div>
                  <div className="text-xs text-gray-600 dark:text-gray-400">Estimated</div>
                </div>
                <div className="bg-gray-50 dark:bg-gray-700 rounded-lg p-4">
                  <div className="text-2xl font-bold text-gray-900 dark:text-white">
                    {breakdown.tasks.filter(t => t.riskLevel === 'high' || t.riskLevel === 'critical').length}
                  </div>
                  <div className="text-xs text-gray-600 dark:text-gray-400">High Risk</div>
                </div>
              </div>

              {/* Tasks List */}
              <div className="space-y-4">
                {breakdown.epic && <TaskCard task={breakdown.epic} label="Epic" />}
                {breakdown.stories.map((task, i) => (
                  <TaskCard key={task.id} task={task} label={`Story ${i + 1}`} />
                ))}
                {breakdown.tasks.map((task, i) => (
                  <TaskCard key={task.id} task={task} label={`Task ${i + 1}`} />
                ))}
                {breakdown.subtasks.map((task, i) => (
                  <TaskCard key={task.id} task={task} label={`Subtask ${i + 1}`} />
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="flex justify-between items-center gap-3 p-6 border-t border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800/50">
          {breakdown && (
            <button
              onClick={() => setBreakdown(null)}
              className="px-4 py-2 text-gray-600 dark:text-gray-400 hover:text-gray-800 dark:hover:text-gray-200 transition-colors"
            >
              ← Back to Input
            </button>
          )}
          <div className="flex gap-3 ml-auto">
            <button
              onClick={handleClose}
              className="px-4 py-2 text-gray-600 dark:text-gray-400 hover:text-gray-800 dark:hover:text-gray-200 transition-colors"
            >
              Cancel
            </button>
            {!breakdown ? (
              <button
                onClick={handleBreakdown}
                disabled={isProcessing}
                className="px-6 py-2 bg-black dark:bg-white text-white dark:text-black rounded-lg hover:bg-gray-800 dark:hover:bg-gray-200 transition-colors font-medium flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isProcessing ? (
                  <>
                    <Loader2 className="animate-spin" size={16} />
                    Processing...
                  </>
                ) : (
                  'Break Down Task'
                )}
              </button>
            ) : (
              <button
                onClick={handleApply}
                className="px-6 py-2 bg-black dark:bg-white text-white dark:text-black rounded-lg hover:bg-gray-800 dark:hover:bg-gray-200 transition-colors font-medium flex items-center gap-2"
              >
                <CheckCircle2 size={16} />
                Apply Breakdown ({getTotalTasks()} tasks)
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

const TaskCard = ({ task, label }: { task: Task; label: string }) => {
  return (
    <div className="border border-gray-200 dark:border-gray-700 rounded-lg p-4 bg-white dark:bg-gray-800">
      <div className="flex items-start justify-between gap-3 mb-2">
        <div className="flex-1">
          <div className="flex items-center gap-2 mb-1">
            <span className="text-xs font-mono text-gray-500 dark:text-gray-400">{task.taskId}</span>
            <span className="text-xs px-2 py-0.5 rounded bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300">
              {label}
            </span>
            {task.riskLevel && task.riskLevel !== 'low' && (
              <span className={`text-xs px-2 py-0.5 rounded flex items-center gap-1 ${
                task.riskLevel === 'critical' ? 'bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-300' :
                task.riskLevel === 'high' ? 'bg-orange-100 dark:bg-orange-900/30 text-orange-700 dark:text-orange-300' :
                'bg-yellow-100 dark:bg-yellow-900/30 text-yellow-700 dark:text-yellow-300'
              }`}>
                <AlertTriangle size={12} />
                {task.riskLevel} risk
              </span>
            )}
          </div>
          <h4 className="font-medium text-gray-900 dark:text-white">{task.title}</h4>
          <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">{task.description}</p>
        </div>
        {task.estimatedHours && (
          <div className="flex items-center gap-1 text-sm text-gray-600 dark:text-gray-400">
            <Clock size={14} />
            {task.estimatedHours}h
          </div>
        )}
      </div>

      {/* Tags */}
      {task.tags.length > 0 && (
        <div className="flex flex-wrap gap-1 mb-2">
          {task.tags.map((tag) => (
            <span
              key={tag}
              className="px-2 py-0.5 text-xs rounded-full bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300"
            >
              {tag}
            </span>
          ))}
        </div>
      )}

      {/* Definition of Done */}
      {task.definitionOfDone && task.definitionOfDone.length > 0 && (
        <div className="mt-3 pt-3 border-t border-gray-100 dark:border-gray-700">
          <div className="text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">Definition of Done:</div>
          <ul className="text-xs text-gray-600 dark:text-gray-400 space-y-0.5">
            {task.definitionOfDone.map((item, i) => (
              <li key={i} className="flex items-start gap-2">
                <span className="text-gray-400">•</span>
                <span>{item}</span>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
};
