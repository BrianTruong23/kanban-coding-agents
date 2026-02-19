'use client';

import { useState } from 'react';
import { X, Sparkles, AlertTriangle, CheckCircle2, Clock } from 'lucide-react';
import type { TaskBreakdownResult, TaskBreakdownInput } from '@/types/breakdown';
import { taskBreakdownService } from '@/services/taskBreakdownService';

interface TaskBreakdownDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onApply: (result: TaskBreakdownResult) => void;
}

export function TaskBreakdownDialog({ isOpen, onClose, onApply }: TaskBreakdownDialogProps) {
  const [input, setInput] = useState('');
  const [sourceType, setSourceType] = useState<'issue' | 'prd' | 'text'>('text');
  const [isProcessing, setIsProcessing] = useState(false);
  const [result, setResult] = useState<TaskBreakdownResult | null>(null);

  if (!isOpen) return null;

  const handleProcess = async () => {
    if (!input.trim()) return;

    setIsProcessing(true);
    try {
      const breakdownInput: TaskBreakdownInput = {
        source: sourceType,
        content: input
      };

      const breakdown = await taskBreakdownService.breakdownTask(breakdownInput);
      setResult(breakdown);
    } catch (error) {
      console.error('Failed to process task breakdown:', error);
      alert('Failed to process task breakdown. Please try again.');
    } finally {
      setIsProcessing(false);
    }
  };

  const handleApply = () => {
    if (result) {
      onApply(result);
      onClose();
    }
  };

  const handleReset = () => {
    setResult(null);
    setInput('');
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl max-w-6xl w-full max-h-[90vh] overflow-hidden flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200 dark:border-gray-700">
          <div className="flex items-center gap-3">
            <Sparkles className="w-6 h-6 text-purple-500" />
            <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
              AI Task Breakdown
            </h2>
          </div>
          <button
            onClick={onClose}
            className="text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6">
          {!result ? (
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Source Type
                </label>
                <div className="flex gap-2">
                  {(['text', 'issue', 'prd'] as const).map(type => (
                    <button
                      key={type}
                      onClick={() => setSourceType(type)}
                      className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                        sourceType === type
                          ? 'bg-purple-500 text-white'
                          : 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600'
                      }`}
                    >
                      {type.toUpperCase()}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Paste your requirements, issue, or PRD
                </label>
                <textarea
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  placeholder="Example: Implement automated task breakdown and agent orchestration system that can analyze issues and break them into epics, stories, and subtasks..."
                  className="w-full h-64 px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white placeholder-gray-400 dark:placeholder-gray-500 focus:ring-2 focus:ring-purple-500 focus:border-transparent resize-none"
                />
              </div>

              <button
                onClick={handleProcess}
                disabled={!input.trim() || isProcessing}
                className="w-full px-6 py-3 bg-purple-500 text-white rounded-lg font-medium hover:bg-purple-600 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
              >
                {isProcessing ? (
                  <>
                    <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    Processing...
                  </>
                ) : (
                  <>
                    <Sparkles className="w-5 h-5" />
                    Generate Breakdown
                  </>
                )}
              </button>
            </div>
          ) : (
            <div className="space-y-6">
              {/* Summary */}
              <div className="bg-purple-50 dark:bg-purple-900/20 rounded-lg p-4 border border-purple-200 dark:border-purple-800">
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  <div>
                    <div className="text-sm text-gray-600 dark:text-gray-400">Epics</div>
                    <div className="text-2xl font-bold text-purple-600 dark:text-purple-400">
                      {result.epics.length}
                    </div>
                  </div>
                  <div>
                    <div className="text-sm text-gray-600 dark:text-gray-400">Stories</div>
                    <div className="text-2xl font-bold text-purple-600 dark:text-purple-400">
                      {result.epics.reduce((sum, epic) => sum + epic.stories.length, 0)}
                    </div>
                  </div>
                  <div>
                    <div className="text-sm text-gray-600 dark:text-gray-400">Sprints</div>
                    <div className="text-2xl font-bold text-purple-600 dark:text-purple-400">
                      {result.suggestedSprints?.length || 0}
                    </div>
                  </div>
                  <div>
                    <div className="text-sm text-gray-600 dark:text-gray-400">Team Size</div>
                    <div className="text-2xl font-bold text-purple-600 dark:text-purple-400">
                      {result.recommendedTeamSize}
                    </div>
                  </div>
                </div>
              </div>

              {/* Overall Risks */}
              {result.overallRisks.length > 0 && (
                <div className="bg-yellow-50 dark:bg-yellow-900/20 rounded-lg p-4 border border-yellow-200 dark:border-yellow-800">
                  <div className="flex items-center gap-2 mb-2">
                    <AlertTriangle className="w-5 h-5 text-yellow-600 dark:text-yellow-500" />
                    <h3 className="font-semibold text-gray-900 dark:text-white">Overall Risks</h3>
                  </div>
                  <ul className="space-y-1">
                    {result.overallRisks.map((risk, idx) => (
                      <li key={idx} className="text-sm text-gray-700 dark:text-gray-300">
                        • {risk}
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              {/* Epics */}
              <div>
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
                  Generated Breakdown
                </h3>
                <div className="space-y-4">
                  {result.epics.map((epic, epicIdx) => (
                    <div
                      key={epicIdx}
                      className="border border-gray-200 dark:border-gray-700 rounded-lg p-4 bg-gray-50 dark:bg-gray-900"
                    >
                      <div className="flex items-start justify-between mb-2">
                        <div>
                          <h4 className="font-semibold text-gray-900 dark:text-white">
                            Epic: {epic.title}
                          </h4>
                          <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                            {epic.description}
                          </p>
                        </div>
                        <div className="text-sm font-medium text-purple-600 dark:text-purple-400">
                          {epic.estimatedStoryPoints} pts
                        </div>
                      </div>

                      {/* Stories */}
                      <div className="mt-3 space-y-2">
                        {epic.stories.map((story, storyIdx) => (
                          <div
                            key={storyIdx}
                            className="bg-white dark:bg-gray-800 rounded-lg p-3 border border-gray-200 dark:border-gray-700"
                          >
                            <div className="flex items-start justify-between">
                              <div className="flex-1">
                                <div className="flex items-center gap-2">
                                  <h5 className="font-medium text-gray-900 dark:text-white">
                                    {story.title}
                                  </h5>
                                  <span className="text-xs px-2 py-1 bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-400 rounded">
                                    {story.estimatedStoryPoints} pts
                                  </span>
                                </div>
                                <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                                  {story.description}
                                </p>

                                {/* Skills */}
                                <div className="flex flex-wrap gap-1 mt-2">
                                  {story.requiredSkills.map((skill, skillIdx) => (
                                    <span
                                      key={skillIdx}
                                      className="text-xs px-2 py-1 bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded"
                                    >
                                      {skill}
                                    </span>
                                  ))}
                                </div>

                                {/* Risk Flags */}
                                {story.riskFlags.length > 0 && (
                                  <div className="mt-2 space-y-1">
                                    {story.riskFlags.map((risk, riskIdx) => (
                                      <div
                                        key={riskIdx}
                                        className="flex items-start gap-2 text-xs"
                                      >
                                        <AlertTriangle
                                          className={`w-3 h-3 flex-shrink-0 mt-0.5 ${
                                            risk.level === 'critical'
                                              ? 'text-red-500'
                                              : risk.level === 'high'
                                              ? 'text-orange-500'
                                              : 'text-yellow-500'
                                          }`}
                                        />
                                        <span className="text-gray-600 dark:text-gray-400">
                                          {risk.description}
                                        </span>
                                      </div>
                                    ))}
                                  </div>
                                )}

                                {/* Subtasks */}
                                {story.subtasks.length > 0 && (
                                  <div className="mt-2 pl-4 border-l-2 border-gray-200 dark:border-gray-700">
                                    {story.subtasks.map((subtask, subIdx) => (
                                      <div
                                        key={subIdx}
                                        className="text-xs text-gray-600 dark:text-gray-400 flex items-start gap-2 mb-1"
                                      >
                                        <Clock className="w-3 h-3 flex-shrink-0 mt-0.5" />
                                        <div>
                                          <span className="font-medium">{subtask.title}</span>
                                          <span className="text-gray-500 dark:text-gray-500">
                                            {' '}
                                            ({subtask.estimatedHours}h)
                                          </span>
                                        </div>
                                      </div>
                                    ))}
                                  </div>
                                )}
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Suggested Sprints */}
              {result.suggestedSprints && result.suggestedSprints.length > 0 && (
                <div>
                  <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-3">
                    Suggested Sprint Plan
                  </h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                    {result.suggestedSprints.map((sprint, idx) => (
                      <div
                        key={idx}
                        className="border border-gray-200 dark:border-gray-700 rounded-lg p-3 bg-white dark:bg-gray-800"
                      >
                        <h4 className="font-semibold text-gray-900 dark:text-white mb-2">
                          {sprint.sprintName}
                        </h4>
                        <div className="text-sm text-gray-600 dark:text-gray-400">
                          {sprint.stories.length} stories
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="flex items-center justify-end gap-3 p-6 border-t border-gray-200 dark:border-gray-700">
          {result ? (
            <>
              <button
                onClick={handleReset}
                className="px-6 py-2 text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg font-medium"
              >
                Start Over
              </button>
              <button
                onClick={handleApply}
                className="px-6 py-2 bg-purple-500 text-white rounded-lg font-medium hover:bg-purple-600 flex items-center gap-2"
              >
                <CheckCircle2 className="w-5 h-5" />
                Apply to Board
              </button>
            </>
          ) : (
            <button
              onClick={onClose}
              className="px-6 py-2 text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg font-medium"
            >
              Cancel
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
