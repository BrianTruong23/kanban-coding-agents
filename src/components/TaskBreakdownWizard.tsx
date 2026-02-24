'use client';

import { useState } from 'react';
import { X, Wand2, FileText, Image, Loader2 } from 'lucide-react';
import { TaskBreakdownInput, TaskBreakdownResult } from '@/types/task';
import { breakdownTask } from '@/services/taskBreakdown';

interface TaskBreakdownWizardProps {
  onComplete: (result: TaskBreakdownResult) => void;
  onCancel: () => void;
}

export const TaskBreakdownWizard = ({ onComplete, onCancel }: TaskBreakdownWizardProps) => {
  const [step, setStep] = useState<'input' | 'processing' | 'preview'>('input');
  const [inputType, setInputType] = useState<'issue' | 'prd' | 'text'>('issue');
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [result, setResult] = useState<TaskBreakdownResult | null>(null);
  const [error, setError] = useState<string | null>(null);

  const handleAnalyze = async () => {
    if (!title.trim() || !description.trim()) {
      setError('Please provide both title and description');
      return;
    }

    setError(null);
    setStep('processing');

    try {
      const input: TaskBreakdownInput = {
        title,
        description,
        type: inputType,
      };

      const breakdown = await breakdownTask(input);
      setResult(breakdown);
      setStep('preview');
    } catch (err) {
      console.error('Error breaking down task:', err);
      setError('Failed to analyze task. Please try again.');
      setStep('input');
    }
  };

  const handleConfirm = () => {
    if (result) {
      onComplete(result);
    }
  };

  const getRiskColor = (risk: string) => {
    switch (risk) {
      case 'critical': return 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400';
      case 'high': return 'bg-orange-100 text-orange-800 dark:bg-orange-900/30 dark:text-orange-400';
      case 'medium': return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400';
      case 'low': return 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400';
      default: return 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300';
    }
  };

  const getPriorityColor = (priority: number) => {
    if (priority >= 5) return 'text-red-600 dark:text-red-400';
    if (priority >= 4) return 'text-orange-600 dark:text-orange-400';
    if (priority >= 3) return 'text-yellow-600 dark:text-yellow-400';
    return 'text-green-600 dark:text-green-400';
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
      <div className="bg-white dark:bg-gray-800 rounded-xl w-full max-w-4xl max-h-[90vh] overflow-hidden shadow-2xl flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200 dark:border-gray-700">
          <div className="flex items-center gap-3">
            <div className="bg-gradient-to-br from-purple-500 to-pink-500 p-2 rounded-lg">
              <Wand2 className="text-white" size={24} />
            </div>
            <div>
              <h2 className="text-xl font-bold text-gray-900 dark:text-white">
                Task Breakdown Wizard
              </h2>
              <p className="text-sm text-gray-500 dark:text-gray-400">
                AI-powered epic, task, and subtask generation
              </p>
            </div>
          </div>
          <button
            onClick={onCancel}
            className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
          >
            <X size={24} />
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6">
          {step === 'input' && (
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
                        ? 'border-purple-500 bg-purple-50 dark:bg-purple-900/20'
                        : 'border-gray-200 dark:border-gray-600 hover:border-gray-300'
                    }`}
                  >
                    <FileText className="mx-auto mb-2" size={24} />
                    <div className="text-sm font-medium">GitHub Issue</div>
                  </button>
                  <button
                    onClick={() => setInputType('prd')}
                    className={`p-4 rounded-lg border-2 transition-all ${
                      inputType === 'prd'
                        ? 'border-purple-500 bg-purple-50 dark:bg-purple-900/20'
                        : 'border-gray-200 dark:border-gray-600 hover:border-gray-300'
                    }`}
                  >
                    <FileText className="mx-auto mb-2" size={24} />
                    <div className="text-sm font-medium">PRD</div>
                  </button>
                  <button
                    onClick={() => setInputType('text')}
                    className={`p-4 rounded-lg border-2 transition-all ${
                      inputType === 'text'
                        ? 'border-purple-500 bg-purple-50 dark:bg-purple-900/20'
                        : 'border-gray-200 dark:border-gray-600 hover:border-gray-300'
                    }`}
                  >
                    <FileText className="mx-auto mb-2" size={24} />
                    <div className="text-sm font-medium">Free Text</div>
                  </button>
                </div>
              </div>

              {/* Title Input */}
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Feature/Epic Title *
                </label>
                <input
                  type="text"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="e.g., User Authentication System"
                  className="w-full border border-gray-200 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white p-3 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
                />
              </div>

              {/* Description Input */}
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Requirements/Description *
                </label>
                <textarea
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="Describe the feature, requirements, acceptance criteria, and technical details...

Example:
- Implement JWT-based authentication
- User registration with email validation
- Password reset functionality
- Role-based access control (admin, user)

Technical requirements:
- Use Supabase for auth
- Add middleware for protected routes
- Implement session management"
                  className="w-full border border-gray-200 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white p-3 rounded-lg h-64 focus:outline-none focus:ring-2 focus:ring-purple-500 resize-none font-mono text-sm"
                />
                <p className="mt-2 text-xs text-gray-500 dark:text-gray-400">
                  💡 Tip: Include features, acceptance criteria, technical details, and constraints for better breakdown
                </p>
              </div>

              {error && (
                <div className="p-3 bg-red-50 dark:bg-red-900/30 border border-red-200 dark:border-red-800 rounded-lg text-sm text-red-600 dark:text-red-400">
                  {error}
                </div>
              )}
            </div>
          )}

          {step === 'processing' && (
            <div className="flex flex-col items-center justify-center py-16">
              <Loader2 className="animate-spin text-purple-500 mb-4" size={48} />
              <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">
                Analyzing Requirements...
              </h3>
              <p className="text-gray-500 dark:text-gray-400 text-center max-w-md">
                Breaking down your feature into epics, tasks, and subtasks with risk assessment and dependencies
              </p>
            </div>
          )}

          {step === 'preview' && result && (
            <div className="space-y-6">
              {/* Epic Summary */}
              <div className="bg-gradient-to-r from-purple-50 to-pink-50 dark:from-purple-900/20 dark:to-pink-900/20 p-4 rounded-lg border border-purple-200 dark:border-purple-800">
                <div className="flex items-start justify-between mb-2">
                  <h3 className="text-lg font-bold text-gray-900 dark:text-white">
                    📦 Epic: {result.epic.title}
                  </h3>
                  <span className={`px-2 py-1 rounded text-xs font-semibold ${getRiskColor(result.epic.riskLevel)}`}>
                    {result.epic.riskLevel.toUpperCase()}
                  </span>
                </div>
                <p className="text-sm text-gray-600 dark:text-gray-300 mb-2">
                  {result.epic.description.substring(0, 200)}...
                </p>
                <div className="text-xs text-gray-500 dark:text-gray-400">
                  Estimated: {result.epic.estimatedHours}h total
                </div>
              </div>

              {/* Tasks */}
              <div>
                <h4 className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-3 flex items-center gap-2">
                  <span className="bg-purple-100 dark:bg-purple-900/30 text-purple-800 dark:text-purple-400 px-2 py-1 rounded text-xs">
                    {result.tasks.length} TASKS
                  </span>
                  {result.dependencies.length > 0 && (
                    <span className="bg-blue-100 dark:bg-blue-900/30 text-blue-800 dark:text-blue-400 px-2 py-1 rounded text-xs">
                      {result.dependencies.length} DEPENDENCIES
                    </span>
                  )}
                </h4>
                <div className="space-y-3">
                  {result.tasks.map((task, idx) => (
                    <div
                      key={idx}
                      className="border border-gray-200 dark:border-gray-700 rounded-lg p-4 bg-white dark:bg-gray-900"
                    >
                      <div className="flex items-start justify-between mb-2">
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-1">
                            <span className={`font-semibold ${getPriorityColor(task.priority)}`}>
                              P{task.priority}
                            </span>
                            <h5 className="font-semibold text-gray-900 dark:text-white">
                              {task.title}
                            </h5>
                          </div>
                          <p className="text-sm text-gray-600 dark:text-gray-400 mb-2">
                            {task.description}
                          </p>
                        </div>
                        <span className={`px-2 py-1 rounded text-xs font-semibold ml-2 ${getRiskColor(task.riskLevel)}`}>
                          {task.riskLevel}
                        </span>
                      </div>

                      {/* Tags */}
                      {task.tags.length > 0 && (
                        <div className="flex flex-wrap gap-1 mb-2">
                          {task.tags.map((tag, i) => (
                            <span
                              key={i}
                              className="px-2 py-0.5 bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 text-xs rounded"
                            >
                              {tag}
                            </span>
                          ))}
                        </div>
                      )}

                      {/* Suggested Skills */}
                      {task.suggestedSkills.length > 0 && (
                        <div className="text-xs text-gray-500 dark:text-gray-400 mb-2">
                          💡 Skills: {task.suggestedSkills.join(', ')}
                        </div>
                      )}

                      {/* DoD and Test Notes */}
                      <div className="grid grid-cols-2 gap-2 text-xs">
                        <div>
                          <span className="font-semibold text-gray-700 dark:text-gray-300">DoD:</span>
                          <span className="text-gray-600 dark:text-gray-400 ml-1">{task.definitionOfDone}</span>
                        </div>
                        <div>
                          <span className="font-semibold text-gray-700 dark:text-gray-300">Test:</span>
                          <span className="text-gray-600 dark:text-gray-400 ml-1">{task.testNotes}</span>
                        </div>
                      </div>

                      {/* Subtasks */}
                      {task.subtasks && task.subtasks.length > 0 && (
                        <div className="mt-3 pl-4 border-l-2 border-gray-200 dark:border-gray-700">
                          <div className="text-xs font-semibold text-gray-600 dark:text-gray-400 mb-2">
                            Subtasks ({task.subtasks.length}):
                          </div>
                          <div className="space-y-1">
                            {task.subtasks.map((subtask, subIdx) => (
                              <div key={subIdx} className="text-xs text-gray-600 dark:text-gray-400">
                                • {subtask.title} ({subtask.estimatedHours}h)
                              </div>
                            ))}
                          </div>
                        </div>
                      )}

                      <div className="mt-2 text-xs text-gray-500 dark:text-gray-400">
                        Est. {task.estimatedHours}h
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="border-t border-gray-200 dark:border-gray-700 p-6 flex justify-end gap-3">
          <button
            onClick={onCancel}
            className="px-6 py-2 text-gray-600 dark:text-gray-400 hover:text-gray-800 dark:hover:text-gray-200 transition-colors"
          >
            Cancel
          </button>
          {step === 'input' && (
            <button
              onClick={handleAnalyze}
              className="px-6 py-2 bg-gradient-to-r from-purple-500 to-pink-500 text-white rounded-lg hover:from-purple-600 hover:to-pink-600 transition-all font-medium flex items-center gap-2"
            >
              <Wand2 size={16} />
              Analyze & Break Down
            </button>
          )}
          {step === 'preview' && (
            <button
              onClick={handleConfirm}
              className="px-6 py-2 bg-gradient-to-r from-purple-500 to-pink-500 text-white rounded-lg hover:from-purple-600 hover:to-pink-600 transition-all font-medium"
            >
              Create Tasks
            </button>
          )}
        </div>
      </div>
    </div>
  );
};
