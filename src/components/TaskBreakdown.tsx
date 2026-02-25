'use client';

import { useState } from 'react';
import { TaskBreakdownInput, TaskBreakdownResult, Task, TaskDependency } from '@/types/task';
import { AgentWithSkills } from '@/types/agent';
import { analyzeAndBreakdown } from '@/services/taskBreakdownService';
import { Sparkles, FileText, Image, X, ChevronDown, ChevronUp, AlertTriangle } from 'lucide-react';

interface TaskBreakdownProps {
  agents: AgentWithSkills[];
  existingTaskCount: number;
  onBreakdownComplete: (result: TaskBreakdownResult) => void;
  onClose: () => void;
}

export const TaskBreakdown = ({ agents, existingTaskCount, onBreakdownComplete, onClose }: TaskBreakdownProps) => {
  const [inputType, setInputType] = useState<'issue' | 'prd' | 'screenshot'>('issue');
  const [content, setContent] = useState('');
  const [additionalContext, setAdditionalContext] = useState('');
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [result, setResult] = useState<TaskBreakdownResult | null>(null);
  const [expandedSection, setExpandedSection] = useState<string | null>('epics');

  const handleAnalyze = async () => {
    if (!content.trim()) return;

    setIsAnalyzing(true);
    try {
      const input: TaskBreakdownInput = {
        type: inputType,
        content,
        additionalContext,
      };

      const breakdown = await analyzeAndBreakdown(input, agents, existingTaskCount);
      setResult(breakdown);
    } catch (error) {
      console.error('Error analyzing:', error);
      alert('Failed to analyze. Please try again.');
    } finally {
      setIsAnalyzing(false);
    }
  };

  const handleApply = () => {
    if (result) {
      onBreakdownComplete(result);
      onClose();
    }
  };

  const toggleSection = (section: string) => {
    setExpandedSection(expandedSection === section ? null : section);
  };

  const renderTaskPreview = (task: Task) => {
    const agent = result?.suggestedAssignments.find(a => a.taskId === task.id);
    const assignedAgent = agent ? agents.find(a => a.id === agent.agentId) : null;

    return (
      <div key={task.id} className="bg-gray-50 dark:bg-gray-700 p-3 rounded-lg border border-gray-200 dark:border-gray-600">
        <div className="flex items-start justify-between mb-2">
          <div className="flex-1">
            <div className="flex items-center gap-2 mb-1">
              <span className="text-xs font-mono text-gray-500 dark:text-gray-400">{task.taskId}</span>
              <span className="text-xs px-1.5 py-0.5 bg-blue-100 dark:bg-blue-900 text-blue-700 dark:text-blue-300 rounded">
                {task.taskType}
              </span>
              <span className="text-xs px-1.5 py-0.5 bg-purple-100 dark:bg-purple-900 text-purple-700 dark:text-purple-300 rounded">
                P{task.priority}
              </span>
            </div>
            <h4 className="font-semibold text-sm text-gray-900 dark:text-white">{task.title}</h4>
            <p className="text-xs text-gray-600 dark:text-gray-400 mt-1">{task.description}</p>
          </div>
        </div>

        {task.riskFlags && task.riskFlags.length > 0 && (
          <div className="flex items-center gap-1 mb-2 flex-wrap">
            <AlertTriangle size={12} className="text-orange-500" />
            {task.riskFlags.map(risk => (
              <span key={risk} className="text-xs px-1.5 py-0.5 bg-orange-100 dark:bg-orange-900 text-orange-700 dark:text-orange-300 rounded">
                {risk}
              </span>
            ))}
          </div>
        )}

        {task.estimatedHours && (
          <div className="text-xs text-gray-500 dark:text-gray-400 mb-2">
            Est: {task.estimatedHours}h
          </div>
        )}

        {assignedAgent && (
          <div className="flex items-center gap-2 text-xs">
            <div className={`w-5 h-5 rounded-full ${assignedAgent.avatarColor} flex items-center justify-center text-white text-[10px] font-bold`}>
              {assignedAgent.name[0]}
            </div>
            <span className="text-gray-600 dark:text-gray-400">
              {assignedAgent.name} ({Math.round(agent!.confidence * 100)}% match)
            </span>
          </div>
        )}

        {task.definitionOfDone && (
          <details className="mt-2">
            <summary className="text-xs font-semibold text-gray-700 dark:text-gray-300 cursor-pointer">
              Definition of Done
            </summary>
            <pre className="text-xs text-gray-600 dark:text-gray-400 mt-1 whitespace-pre-wrap">{task.definitionOfDone}</pre>
          </details>
        )}

        {task.testNotes && (
          <details className="mt-2">
            <summary className="text-xs font-semibold text-gray-700 dark:text-gray-300 cursor-pointer">
              Test Notes
            </summary>
            <pre className="text-xs text-gray-600 dark:text-gray-400 mt-1 whitespace-pre-wrap">{task.testNotes}</pre>
          </details>
        )}
      </div>
    );
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4" onClick={onClose}>
      <div
        className="bg-white dark:bg-gray-800 rounded-xl w-full max-w-4xl max-h-[90vh] overflow-hidden shadow-2xl flex flex-col"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="p-6 border-b border-gray-200 dark:border-gray-700">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-gradient-to-br from-purple-500 to-blue-500 rounded-lg flex items-center justify-center">
                <Sparkles className="text-white" size={20} />
              </div>
              <div>
                <h2 className="text-xl font-bold text-gray-900 dark:text-white">AI Task Breakdown</h2>
                <p className="text-sm text-gray-500 dark:text-gray-400">
                  Automatically break down issues, PRDs, or screenshots into epics and tasks
                </p>
              </div>
            </div>
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 transition-colors"
            >
              <X size={24} />
            </button>
          </div>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6">
          {!result ? (
            <div className="space-y-4">
              {/* Input Type Selection */}
              <div>
                <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
                  Input Type
                </label>
                <div className="flex gap-2">
                  <button
                    onClick={() => setInputType('issue')}
                    className={`flex-1 py-2 px-4 rounded-lg border-2 transition-colors ${
                      inputType === 'issue'
                        ? 'border-purple-500 bg-purple-50 dark:bg-purple-900/30 text-purple-700 dark:text-purple-300'
                        : 'border-gray-200 dark:border-gray-600 text-gray-600 dark:text-gray-400'
                    }`}
                  >
                    <FileText className="inline mr-2" size={16} />
                    Issue / User Story
                  </button>
                  <button
                    onClick={() => setInputType('prd')}
                    className={`flex-1 py-2 px-4 rounded-lg border-2 transition-colors ${
                      inputType === 'prd'
                        ? 'border-purple-500 bg-purple-50 dark:bg-purple-900/30 text-purple-700 dark:text-purple-300'
                        : 'border-gray-200 dark:border-gray-600 text-gray-600 dark:text-gray-400'
                    }`}
                  >
                    <FileText className="inline mr-2" size={16} />
                    PRD / Spec
                  </button>
                  <button
                    onClick={() => setInputType('screenshot')}
                    className={`flex-1 py-2 px-4 rounded-lg border-2 transition-colors ${
                      inputType === 'screenshot'
                        ? 'border-purple-500 bg-purple-50 dark:bg-purple-900/30 text-purple-700 dark:text-purple-300'
                        : 'border-gray-200 dark:border-gray-600 text-gray-600 dark:text-gray-400'
                    }`}
                  >
                    <Image className="inline mr-2" size={16} />
                    Screenshot
                  </button>
                </div>
              </div>

              {/* Main Input */}
              <div>
                <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
                  {inputType === 'screenshot' ? 'Describe the screenshot' : 'Content'}
                </label>
                <textarea
                  className="w-full border border-gray-200 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white p-3 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 resize-none"
                  rows={10}
                  placeholder={
                    inputType === 'issue'
                      ? 'Paste your issue description here...\nExample: "Add user authentication with login, signup, and password reset"'
                      : inputType === 'prd'
                      ? 'Paste your PRD or specification here...'
                      : 'Describe what you see in the screenshot and what needs to be built...'
                  }
                  value={content}
                  onChange={(e) => setContent(e.target.value)}
                />
              </div>

              {/* Additional Context */}
              <div>
                <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
                  Additional Context (Optional)
                </label>
                <textarea
                  className="w-full border border-gray-200 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white p-3 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 resize-none"
                  rows={3}
                  placeholder="Any additional requirements, constraints, or preferences..."
                  value={additionalContext}
                  onChange={(e) => setAdditionalContext(e.target.value)}
                />
              </div>

              {/* Actions */}
              <div className="flex justify-end gap-3 pt-4">
                <button
                  onClick={onClose}
                  className="px-4 py-2 text-gray-600 dark:text-gray-400 hover:text-gray-800 dark:hover:text-gray-200 transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={handleAnalyze}
                  disabled={!content.trim() || isAnalyzing}
                  className="px-6 py-2 bg-gradient-to-r from-purple-500 to-blue-500 text-white rounded-lg hover:from-purple-600 hover:to-blue-600 transition-colors font-medium disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
                >
                  {isAnalyzing ? (
                    <>
                      <div className="animate-spin w-4 h-4 border-2 border-white border-t-transparent rounded-full" />
                      Analyzing...
                    </>
                  ) : (
                    <>
                      <Sparkles size={16} />
                      Analyze & Breakdown
                    </>
                  )}
                </button>
              </div>
            </div>
          ) : (
            <div className="space-y-4">
              {/* Summary */}
              <div className="bg-gradient-to-r from-purple-50 to-blue-50 dark:from-purple-900/20 dark:to-blue-900/20 p-4 rounded-lg border border-purple-200 dark:border-purple-800">
                <h3 className="font-bold text-gray-900 dark:text-white mb-2">Breakdown Summary</h3>
                <div className="grid grid-cols-4 gap-4 text-center">
                  <div>
                    <div className="text-2xl font-bold text-purple-600 dark:text-purple-400">{result.epics.length}</div>
                    <div className="text-xs text-gray-600 dark:text-gray-400">Epics</div>
                  </div>
                  <div>
                    <div className="text-2xl font-bold text-blue-600 dark:text-blue-400">{result.stories.length}</div>
                    <div className="text-xs text-gray-600 dark:text-gray-400">Stories</div>
                  </div>
                  <div>
                    <div className="text-2xl font-bold text-green-600 dark:text-green-400">{result.subtasks.length}</div>
                    <div className="text-xs text-gray-600 dark:text-gray-400">Subtasks</div>
                  </div>
                  <div>
                    <div className="text-2xl font-bold text-orange-600 dark:text-orange-400">{result.dependencies.length}</div>
                    <div className="text-xs text-gray-600 dark:text-gray-400">Dependencies</div>
                  </div>
                </div>
              </div>

              {/* Epics */}
              {result.epics.length > 0 && (
                <div className="border border-gray-200 dark:border-gray-700 rounded-lg overflow-hidden">
                  <button
                    onClick={() => toggleSection('epics')}
                    className="w-full px-4 py-3 bg-purple-50 dark:bg-purple-900/30 flex items-center justify-between text-left"
                  >
                    <span className="font-semibold text-gray-900 dark:text-white">
                      Epics ({result.epics.length})
                    </span>
                    {expandedSection === 'epics' ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
                  </button>
                  {expandedSection === 'epics' && (
                    <div className="p-4 space-y-3 max-h-64 overflow-y-auto">
                      {result.epics.map(renderTaskPreview)}
                    </div>
                  )}
                </div>
              )}

              {/* Stories */}
              {result.stories.length > 0 && (
                <div className="border border-gray-200 dark:border-gray-700 rounded-lg overflow-hidden">
                  <button
                    onClick={() => toggleSection('stories')}
                    className="w-full px-4 py-3 bg-blue-50 dark:bg-blue-900/30 flex items-center justify-between text-left"
                  >
                    <span className="font-semibold text-gray-900 dark:text-white">
                      Stories ({result.stories.length})
                    </span>
                    {expandedSection === 'stories' ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
                  </button>
                  {expandedSection === 'stories' && (
                    <div className="p-4 space-y-3 max-h-64 overflow-y-auto">
                      {result.stories.map(renderTaskPreview)}
                    </div>
                  )}
                </div>
              )}

              {/* Subtasks */}
              {result.subtasks.length > 0 && (
                <div className="border border-gray-200 dark:border-gray-700 rounded-lg overflow-hidden">
                  <button
                    onClick={() => toggleSection('subtasks')}
                    className="w-full px-4 py-3 bg-green-50 dark:bg-green-900/30 flex items-center justify-between text-left"
                  >
                    <span className="font-semibold text-gray-900 dark:text-white">
                      Subtasks ({result.subtasks.length})
                    </span>
                    {expandedSection === 'subtasks' ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
                  </button>
                  {expandedSection === 'subtasks' && (
                    <div className="p-4 space-y-3 max-h-64 overflow-y-auto">
                      {result.subtasks.map(renderTaskPreview)}
                    </div>
                  )}
                </div>
              )}

              {/* Actions */}
              <div className="flex justify-end gap-3 pt-4 border-t border-gray-200 dark:border-gray-700">
                <button
                  onClick={() => setResult(null)}
                  className="px-4 py-2 text-gray-600 dark:text-gray-400 hover:text-gray-800 dark:hover:text-gray-200 transition-colors"
                >
                  Start Over
                </button>
                <button
                  onClick={handleApply}
                  className="px-6 py-2 bg-gradient-to-r from-purple-500 to-blue-500 text-white rounded-lg hover:from-purple-600 hover:to-blue-600 transition-colors font-medium"
                >
                  Apply Breakdown
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
