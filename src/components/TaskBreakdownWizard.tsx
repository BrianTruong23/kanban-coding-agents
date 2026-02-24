'use client';

import { useState } from 'react';
import { Sparkles, FileText, Image, AlertTriangle, CheckCircle, Loader2 } from 'lucide-react';
import { TaskBreakdownInput, TaskBreakdownResult } from '@/types/breakdown';
import { analyzeAndBreakdownTask } from '@/lib/taskBreakdown';

interface TaskBreakdownWizardProps {
  existingTaskCount: number;
  onBreakdownComplete: (result: TaskBreakdownResult) => void;
  onCancel: () => void;
}

type InputMode = 'text' | 'issue' | 'prd' | 'screenshot';

export const TaskBreakdownWizard = ({
  existingTaskCount,
  onBreakdownComplete,
  onCancel
}: TaskBreakdownWizardProps) => {
  const [mode, setMode] = useState<InputMode>('text');
  const [inputText, setInputText] = useState('');
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [previewResult, setPreviewResult] = useState<TaskBreakdownResult | null>(null);
  const [error, setError] = useState<string | null>(null);

  const handleAnalyze = async () => {
    if (!inputText.trim()) {
      setError('Please provide some input to analyze');
      return;
    }

    setIsAnalyzing(true);
    setError(null);

    try {
      const input: TaskBreakdownInput = {
        source: mode === 'issue' ? 'issue' : mode === 'prd' ? 'prd' : 'text',
        content: inputText
      };

      const result = await analyzeAndBreakdownTask(input, existingTaskCount);
      setPreviewResult(result);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to analyze input');
      console.error('Analysis error:', err);
    } finally {
      setIsAnalyzing(false);
    }
  };

  const handleConfirm = () => {
    if (previewResult) {
      onBreakdownComplete(previewResult);
    }
  };

  const handleReset = () => {
    setPreviewResult(null);
    setInputText('');
    setError(null);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
      <div className="bg-white dark:bg-gray-800 rounded-xl w-full max-w-4xl max-h-[90vh] overflow-hidden shadow-2xl">
        {/* Header */}
        <div className="p-6 border-b border-gray-200 dark:border-gray-700 bg-gradient-to-r from-purple-50 to-blue-50 dark:from-purple-900/20 dark:to-blue-900/20">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-purple-500 rounded-lg">
              <Sparkles className="text-white" size={24} />
            </div>
            <div>
              <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
                AI Task Breakdown
              </h2>
              <p className="text-sm text-gray-600 dark:text-gray-400">
                Automatically break down work into epics, tasks, and subtasks
              </p>
            </div>
          </div>
        </div>

        <div className="p-6 overflow-y-auto max-h-[calc(90vh-180px)]">
          {!previewResult ? (
            <div className="space-y-6">
              {/* Mode Selection */}
              <div>
                <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-3">
                  Input Type
                </label>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                  <button
                    onClick={() => setMode('text')}
                    className={`p-4 border-2 rounded-lg transition-all ${
                      mode === 'text'
                        ? 'border-purple-500 bg-purple-50 dark:bg-purple-900/20'
                        : 'border-gray-200 dark:border-gray-600 hover:border-gray-300'
                    }`}
                  >
                    <FileText size={24} className="mx-auto mb-2 text-purple-500" />
                    <div className="text-sm font-medium text-gray-900 dark:text-white">Text</div>
                  </button>
                  <button
                    onClick={() => setMode('issue')}
                    className={`p-4 border-2 rounded-lg transition-all ${
                      mode === 'issue'
                        ? 'border-purple-500 bg-purple-50 dark:bg-purple-900/20'
                        : 'border-gray-200 dark:border-gray-600 hover:border-gray-300'
                    }`}
                  >
                    <FileText size={24} className="mx-auto mb-2 text-blue-500" />
                    <div className="text-sm font-medium text-gray-900 dark:text-white">GitHub Issue</div>
                  </button>
                  <button
                    onClick={() => setMode('prd')}
                    className={`p-4 border-2 rounded-lg transition-all ${
                      mode === 'prd'
                        ? 'border-purple-500 bg-purple-50 dark:bg-purple-900/20'
                        : 'border-gray-200 dark:border-gray-600 hover:border-gray-300'
                    }`}
                  >
                    <FileText size={24} className="mx-auto mb-2 text-green-500" />
                    <div className="text-sm font-medium text-gray-900 dark:text-white">PRD</div>
                  </button>
                  <button
                    onClick={() => setMode('screenshot')}
                    className={`p-4 border-2 rounded-lg transition-all ${
                      mode === 'screenshot'
                        ? 'border-purple-500 bg-purple-50 dark:bg-purple-900/20'
                        : 'border-gray-200 dark:border-gray-600 hover:border-gray-300'
                    }`}
                  >
                    <Image size={24} className="mx-auto mb-2 text-orange-500" />
                    <div className="text-sm font-medium text-gray-900 dark:text-white">Screenshot</div>
                  </button>
                </div>
              </div>

              {/* Input Area */}
              <div>
                <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
                  {mode === 'issue' && 'Paste GitHub Issue'}
                  {mode === 'prd' && 'Paste PRD Content'}
                  {mode === 'screenshot' && 'Describe Screenshot'}
                  {mode === 'text' && 'Describe What You Want to Build'}
                </label>
                <textarea
                  value={inputText}
                  onChange={(e) => setInputText(e.target.value)}
                  placeholder={
                    mode === 'issue'
                      ? 'Paste the issue title and description...'
                      : mode === 'prd'
                      ? 'Paste the PRD content...'
                      : mode === 'screenshot'
                      ? 'Describe what you see in the screenshot and what needs to be implemented...'
                      : 'Describe the feature or task you want to implement...\n\nExample: "Implement user authentication with email/password and social login. Include signup, login, password reset, and profile management."'
                  }
                  className="w-full h-64 border border-gray-200 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white p-4 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 resize-none font-mono text-sm"
                />
                <div className="mt-2 text-xs text-gray-500 dark:text-gray-400">
                  Provide as much detail as possible for better breakdown results
                </div>
              </div>

              {/* Example Templates */}
              <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-4">
                <div className="text-sm font-semibold text-blue-900 dark:text-blue-300 mb-2">
                  💡 Tips for better results:
                </div>
                <ul className="text-xs text-blue-800 dark:text-blue-400 space-y-1 list-disc list-inside">
                  <li>Include specific requirements and acceptance criteria</li>
                  <li>Mention technologies or frameworks if relevant</li>
                  <li>Describe user flows and interactions</li>
                  <li>Note any dependencies or constraints</li>
                  <li>Mention security or performance considerations</li>
                </ul>
              </div>

              {error && (
                <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-4 flex items-start gap-3">
                  <AlertTriangle className="text-red-500 flex-shrink-0 mt-0.5" size={20} />
                  <div className="text-sm text-red-800 dark:text-red-400">{error}</div>
                </div>
              )}
            </div>
          ) : (
            <TaskBreakdownPreview result={previewResult} />
          )}
        </div>

        {/* Footer */}
        <div className="p-6 border-t border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-900 flex justify-between">
          <button
            onClick={onCancel}
            className="px-6 py-2 text-gray-600 dark:text-gray-400 hover:text-gray-800 dark:hover:text-gray-200 transition-colors font-medium"
          >
            Cancel
          </button>
          <div className="flex gap-3">
            {previewResult && (
              <button
                onClick={handleReset}
                className="px-6 py-2 bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-300 dark:hover:bg-gray-600 transition-colors font-medium"
              >
                Start Over
              </button>
            )}
            {!previewResult ? (
              <button
                onClick={handleAnalyze}
                disabled={isAnalyzing || !inputText.trim()}
                className="px-6 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 disabled:bg-gray-300 dark:disabled:bg-gray-700 disabled:cursor-not-allowed transition-colors font-medium flex items-center gap-2"
              >
                {isAnalyzing ? (
                  <>
                    <Loader2 className="animate-spin" size={16} />
                    Analyzing...
                  </>
                ) : (
                  <>
                    <Sparkles size={16} />
                    Analyze & Break Down
                  </>
                )}
              </button>
            ) : (
              <button
                onClick={handleConfirm}
                className="px-6 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors font-medium flex items-center gap-2"
              >
                <CheckCircle size={16} />
                Create Tasks
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

const TaskBreakdownPreview = ({ result }: { result: TaskBreakdownResult }) => {
  const allTasks = [...result.tasks, ...result.subtasks];
  const totalEstimatedHours = allTasks.reduce((sum, task) => sum + (task.estimatedHours || 0), 0);
  const totalRisks = allTasks.reduce((sum, task) => sum + (task.riskFlags?.length || 0), 0);

  return (
    <div className="space-y-6">
      {/* Summary */}
      <div className="bg-gradient-to-r from-green-50 to-blue-50 dark:from-green-900/20 dark:to-blue-900/20 border border-green-200 dark:border-green-800 rounded-lg p-6">
        <div className="flex items-start gap-4">
          <CheckCircle className="text-green-600 dark:text-green-400 flex-shrink-0 mt-1" size={24} />
          <div className="flex-1">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
              Breakdown Complete!
            </h3>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
              <div>
                <div className="text-gray-500 dark:text-gray-400">Epic</div>
                <div className="text-xl font-bold text-gray-900 dark:text-white">
                  {result.epic.title ? 1 : 0}
                </div>
              </div>
              <div>
                <div className="text-gray-500 dark:text-gray-400">Tasks</div>
                <div className="text-xl font-bold text-gray-900 dark:text-white">
                  {result.tasks.length}
                </div>
              </div>
              <div>
                <div className="text-gray-500 dark:text-gray-400">Subtasks</div>
                <div className="text-xl font-bold text-gray-900 dark:text-white">
                  {result.subtasks.length}
                </div>
              </div>
              <div>
                <div className="text-gray-500 dark:text-gray-400">Est. Hours</div>
                <div className="text-xl font-bold text-gray-900 dark:text-white">
                  {totalEstimatedHours}h
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Epic */}
      {result.epic.title && (
        <div className="border border-purple-200 dark:border-purple-800 rounded-lg p-4 bg-purple-50 dark:bg-purple-900/20">
          <div className="flex items-start gap-3">
            <div className="px-2 py-1 bg-purple-600 text-white text-xs font-bold rounded">
              EPIC
            </div>
            <div className="flex-1">
              <div className="font-semibold text-gray-900 dark:text-white">{result.epic.title}</div>
              <div className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                {result.epic.description}
              </div>
              {result.epic.definitionOfDone && result.epic.definitionOfDone.length > 0 && (
                <div className="mt-3">
                  <div className="text-xs font-semibold text-gray-700 dark:text-gray-300 mb-1">
                    Definition of Done:
                  </div>
                  <ul className="space-y-1">
                    {result.epic.definitionOfDone.map((dod, idx) => (
                      <li key={idx} className="text-xs text-gray-600 dark:text-gray-400 flex items-start gap-2">
                        <CheckCircle size={12} className="mt-0.5 flex-shrink-0" />
                        {dod.description}
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Tasks */}
      <div className="space-y-3">
        <h4 className="text-sm font-semibold text-gray-700 dark:text-gray-300">
          Tasks ({result.tasks.length})
        </h4>
        {result.tasks.map((task, idx) => (
          <div key={idx} className="border border-gray-200 dark:border-gray-700 rounded-lg p-4">
            <div className="flex items-start justify-between gap-3 mb-2">
              <div className="flex-1">
                <div className="font-medium text-gray-900 dark:text-white">
                  {task.taskId}: {task.title}
                </div>
                <div className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                  {task.description}
                </div>
              </div>
              <div className="flex gap-2 flex-shrink-0">
                {task.priority && (
                  <span className="px-2 py-1 bg-blue-100 dark:bg-blue-900 text-blue-700 dark:text-blue-300 text-xs rounded">
                    P{task.priority}
                  </span>
                )}
                {task.estimatedHours && (
                  <span className="px-2 py-1 bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 text-xs rounded">
                    {task.estimatedHours}h
                  </span>
                )}
              </div>
            </div>

            {task.tags && task.tags.length > 0 && (
              <div className="flex gap-1 flex-wrap mb-2">
                {task.tags.map((tag, tagIdx) => (
                  <span
                    key={tagIdx}
                    className="px-2 py-0.5 bg-purple-100 dark:bg-purple-900 text-purple-700 dark:text-purple-300 text-xs rounded"
                  >
                    {tag}
                  </span>
                ))}
              </div>
            )}

            {task.riskFlags && task.riskFlags.length > 0 && (
              <div className="mt-2 space-y-1">
                {task.riskFlags.map((risk, riskIdx) => (
                  <div
                    key={riskIdx}
                    className={`text-xs p-2 rounded flex items-start gap-2 ${
                      risk.level === 'critical'
                        ? 'bg-red-50 dark:bg-red-900/20 text-red-700 dark:text-red-400'
                        : risk.level === 'high'
                        ? 'bg-orange-50 dark:bg-orange-900/20 text-orange-700 dark:text-orange-400'
                        : 'bg-yellow-50 dark:bg-yellow-900/20 text-yellow-700 dark:text-yellow-400'
                    }`}
                  >
                    <AlertTriangle size={12} className="flex-shrink-0 mt-0.5" />
                    <div>
                      <div className="font-semibold">{risk.level.toUpperCase()}: {risk.description}</div>
                      {risk.mitigation && (
                        <div className="mt-1">Mitigation: {risk.mitigation}</div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}

            {/* Show subtasks for this task */}
            {result.subtasks.filter(st => st.parentTaskId === task.id).length > 0 && (
              <div className="mt-3 pl-4 border-l-2 border-gray-200 dark:border-gray-700">
                <div className="text-xs font-semibold text-gray-600 dark:text-gray-400 mb-2">
                  Subtasks:
                </div>
                <div className="space-y-2">
                  {result.subtasks
                    .filter(st => st.parentTaskId === task.id)
                    .map((subtask, stIdx) => (
                      <div
                        key={stIdx}
                        className="text-sm text-gray-700 dark:text-gray-300 flex items-start gap-2"
                      >
                        <CheckCircle size={14} className="mt-0.5 flex-shrink-0 text-gray-400" />
                        <div>
                          <span className="font-medium">{subtask.taskId}:</span> {subtask.title}
                        </div>
                      </div>
                    ))}
                </div>
              </div>
            )}
          </div>
        ))}
      </div>

      {/* Dependencies */}
      {result.dependencies.length > 0 && (
        <div className="border border-gray-200 dark:border-gray-700 rounded-lg p-4">
          <h4 className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-3">
            Dependencies ({result.dependencies.length})
          </h4>
          <div className="space-y-2 text-sm">
            {result.dependencies.map((dep, idx) => (
              <div key={idx} className="text-gray-600 dark:text-gray-400">
                Task depends on completion of previous task ({dep.type})
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Warnings */}
      {totalRisks > 0 && (
        <div className="bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 rounded-lg p-4">
          <div className="flex items-start gap-3">
            <AlertTriangle className="text-amber-600 dark:text-amber-400 flex-shrink-0" size={20} />
            <div className="text-sm text-amber-800 dark:text-amber-400">
              <strong>{totalRisks} risk flag(s)</strong> identified. Review carefully before proceeding.
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
