'use client';

import { useState } from 'react';
import { Zap, FileText, Image as ImageIcon, Loader2, ChevronDown, ChevronUp, CheckCircle2, AlertTriangle } from 'lucide-react';
import { TaskBreakdownInput, TaskBreakdownResult } from '@/types/task-breakdown';
import { taskBreakdownService } from '@/lib/ai/task-breakdown';

interface TaskBreakdownPanelProps {
  onBreakdownComplete: (result: TaskBreakdownResult) => void;
  userId: string;
}

export const TaskBreakdownPanel = ({ onBreakdownComplete, userId }: TaskBreakdownPanelProps) => {
  const [isOpen, setIsOpen] = useState(false);
  const [inputType, setInputType] = useState<'issue' | 'prd' | 'screenshot' | 'text'>('text');
  const [content, setContent] = useState('');
  const [context, setContext] = useState('');
  const [imageUrl, setImageUrl] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);
  const [result, setResult] = useState<TaskBreakdownResult | null>(null);
  const [expandedSections, setExpandedSections] = useState<Set<string>>(new Set(['tasks']));

  const handleBreakdown = async () => {
    if (!content.trim()) return;

    setIsProcessing(true);
    try {
      const input: TaskBreakdownInput = {
        type: inputType,
        content: content.trim(),
        imageUrl: imageUrl.trim() || undefined,
        context: context.trim() || undefined,
      };

      const breakdownResult = await taskBreakdownService.breakdownTask(input, userId);
      setResult(breakdownResult);
      onBreakdownComplete(breakdownResult);
    } catch (error) {
      console.error('Error breaking down task:', error);
      alert('Failed to breakdown task. Please try again.');
    } finally {
      setIsProcessing(false);
    }
  };

  const toggleSection = (section: string) => {
    const newExpanded = new Set(expandedSections);
    if (newExpanded.has(section)) {
      newExpanded.delete(section);
    } else {
      newExpanded.add(section);
    }
    setExpandedSections(newExpanded);
  };

  const resetForm = () => {
    setContent('');
    setContext('');
    setImageUrl('');
    setResult(null);
  };

  return (
    <div className="border dark:border-gray-700 rounded-lg bg-white dark:bg-gray-800 mb-6">
      {/* Header */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="w-full p-4 flex items-center justify-between hover:bg-gray-50 dark:hover:bg-gray-750 rounded-t-lg"
      >
        <div className="flex items-center gap-3">
          <Zap className="w-5 h-5 text-purple-600" />
          <h2 className="text-lg font-semibold">AI Task Breakdown</h2>
          <span className="text-xs px-2 py-1 bg-purple-100 dark:bg-purple-900 text-purple-800 dark:text-purple-200 rounded-full">
            Beta
          </span>
        </div>
        {isOpen ? <ChevronUp className="w-5 h-5" /> : <ChevronDown className="w-5 h-5" />}
      </button>

      {/* Content */}
      {isOpen && (
        <div className="p-4 border-t dark:border-gray-700 space-y-4">
          {!result ? (
            <>
              {/* Input Type Selection */}
              <div>
                <label className="block text-sm font-medium mb-2">Input Type</label>
                <div className="grid grid-cols-4 gap-2">
                  {(['text', 'issue', 'prd', 'screenshot'] as const).map((type) => (
                    <button
                      key={type}
                      onClick={() => setInputType(type)}
                      className={`px-3 py-2 rounded text-sm font-medium transition-colors ${
                        inputType === type
                          ? 'bg-purple-600 text-white'
                          : 'bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600'
                      }`}
                    >
                      {type === 'text' && <FileText className="w-4 h-4 inline mr-1" />}
                      {type === 'screenshot' && <ImageIcon className="w-4 h-4 inline mr-1" />}
                      {type.charAt(0).toUpperCase() + type.slice(1)}
                    </button>
                  ))}
                </div>
              </div>

              {/* Main Content Input */}
              <div>
                <label className="block text-sm font-medium mb-2">
                  {inputType === 'issue' && 'GitHub Issue / Ticket Description'}
                  {inputType === 'prd' && 'Product Requirements Document (PRD)'}
                  {inputType === 'screenshot' && 'Screenshot Description'}
                  {inputType === 'text' && 'General Description'}
                </label>
                <textarea
                  value={content}
                  onChange={(e) => setContent(e.target.value)}
                  className="w-full h-40 px-3 py-2 border dark:border-gray-600 rounded-lg bg-white dark:bg-gray-900 resize-y"
                  placeholder={
                    inputType === 'issue'
                      ? 'Paste your GitHub issue or ticket description here...'
                      : inputType === 'prd'
                      ? 'Paste your PRD content here...'
                      : inputType === 'screenshot'
                      ? 'Describe what needs to be built based on the screenshot...'
                      : 'Describe the feature or requirement...'
                  }
                />
              </div>

              {/* Screenshot URL (for screenshot type) */}
              {inputType === 'screenshot' && (
                <div>
                  <label className="block text-sm font-medium mb-2">
                    Screenshot URL (optional)
                  </label>
                  <input
                    type="url"
                    value={imageUrl}
                    onChange={(e) => setImageUrl(e.target.value)}
                    className="w-full px-3 py-2 border dark:border-gray-600 rounded-lg bg-white dark:bg-gray-900"
                    placeholder="https://example.com/screenshot.png"
                  />
                </div>
              )}

              {/* Additional Context */}
              <div>
                <label className="block text-sm font-medium mb-2">
                  Additional Context (optional)
                </label>
                <textarea
                  value={context}
                  onChange={(e) => setContext(e.target.value)}
                  className="w-full h-20 px-3 py-2 border dark:border-gray-600 rounded-lg bg-white dark:bg-gray-900 resize-y"
                  placeholder="Add any additional context about the project, tech stack, or constraints..."
                />
              </div>

              {/* Action Buttons */}
              <div className="flex gap-2">
                <button
                  onClick={handleBreakdown}
                  disabled={!content.trim() || isProcessing}
                  className="flex-1 px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                >
                  {isProcessing ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      Analyzing...
                    </>
                  ) : (
                    <>
                      <Zap className="w-4 h-4" />
                      Break Down Tasks
                    </>
                  )}
                </button>
              </div>
            </>
          ) : (
            <>
              {/* Results Display */}
              <div className="space-y-4">
                {/* Summary */}
                <div className="p-4 bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg">
                  <div className="flex items-center gap-2 text-green-800 dark:text-green-200 mb-2">
                    <CheckCircle2 className="w-5 h-5" />
                    <h3 className="font-semibold">Breakdown Complete!</h3>
                  </div>
                  <div className="text-sm text-green-700 dark:text-green-300 space-y-1">
                    {result.epic && <p>• Generated 1 epic</p>}
                    <p>• Generated {result.tasks.length} task(s)</p>
                    <p>• Created {result.subtasks.length} subtask(s)</p>
                    <p>• Defined {result.definitionsOfDone.length} DoD criteria</p>
                    <p>• Added {result.testNotes.length} test notes</p>
                    <p>• Identified {result.riskFlags.length} risk flags</p>
                  </div>
                </div>

                {/* Epic Section */}
                {result.epic && (
                  <div className="border dark:border-gray-700 rounded-lg overflow-hidden">
                    <button
                      onClick={() => toggleSection('epic')}
                      className="w-full p-3 bg-gray-50 dark:bg-gray-750 flex items-center justify-between hover:bg-gray-100 dark:hover:bg-gray-700"
                    >
                      <span className="font-medium">Epic</span>
                      {expandedSections.has('epic') ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                    </button>
                    {expandedSections.has('epic') && (
                      <div className="p-4">
                        <div className="space-y-2">
                          <p className="font-mono text-sm text-gray-500">{result.epic.epicId}</p>
                          <p className="font-semibold">{result.epic.title}</p>
                          <p className="text-sm text-gray-600 dark:text-gray-400">{result.epic.description}</p>
                        </div>
                      </div>
                    )}
                  </div>
                )}

                {/* Tasks Section */}
                <div className="border dark:border-gray-700 rounded-lg overflow-hidden">
                  <button
                    onClick={() => toggleSection('tasks')}
                    className="w-full p-3 bg-gray-50 dark:bg-gray-750 flex items-center justify-between hover:bg-gray-100 dark:hover:bg-gray-700"
                  >
                    <span className="font-medium">Tasks ({result.tasks.length})</span>
                    {expandedSections.has('tasks') ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                  </button>
                  {expandedSections.has('tasks') && (
                    <div className="p-4 space-y-3">
                      {result.tasks.map((task) => (
                        <div key={task.id} className="p-3 bg-gray-50 dark:bg-gray-750 rounded-lg">
                          <div className="flex items-start justify-between mb-2">
                            <div>
                              <span className="font-mono text-xs text-gray-500">{task.taskId}</span>
                              <p className="font-medium">{task.title}</p>
                            </div>
                            <span className="text-xs px-2 py-1 bg-blue-100 dark:bg-blue-900 text-blue-800 dark:text-blue-200 rounded">
                              P{task.priority}
                            </span>
                          </div>
                          <p className="text-sm text-gray-600 dark:text-gray-400 mb-2">{task.description}</p>
                          {task.tags.length > 0 && (
                            <div className="flex flex-wrap gap-1">
                              {task.tags.map((tag) => (
                                <span key={tag} className="text-xs px-2 py-0.5 bg-gray-200 dark:bg-gray-700 rounded">
                                  {tag}
                                </span>
                              ))}
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                {/* Risk Flags Section */}
                {result.riskFlags.length > 0 && (
                  <div className="border dark:border-gray-700 rounded-lg overflow-hidden">
                    <button
                      onClick={() => toggleSection('risks')}
                      className="w-full p-3 bg-gray-50 dark:bg-gray-750 flex items-center justify-between hover:bg-gray-100 dark:hover:bg-gray-700"
                    >
                      <span className="font-medium flex items-center gap-2">
                        <AlertTriangle className="w-4 h-4 text-orange-600" />
                        Risk Flags ({result.riskFlags.length})
                      </span>
                      {expandedSections.has('risks') ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                    </button>
                    {expandedSections.has('risks') && (
                      <div className="p-4 space-y-2">
                        {result.riskFlags.map((risk) => (
                          <div key={risk.id} className="p-3 bg-orange-50 dark:bg-orange-900/20 border border-orange-200 dark:border-orange-800 rounded">
                            <div className="flex items-start justify-between mb-1">
                              <span className="text-sm font-medium">{risk.description}</span>
                              <span className={`text-xs px-2 py-0.5 rounded ${
                                risk.severity === 'critical' ? 'bg-red-100 dark:bg-red-900 text-red-800 dark:text-red-200' :
                                risk.severity === 'high' ? 'bg-orange-100 dark:bg-orange-900 text-orange-800 dark:text-orange-200' :
                                'bg-yellow-100 dark:bg-yellow-900 text-yellow-800 dark:text-yellow-200'
                              }`}>
                                {risk.severity}
                              </span>
                            </div>
                            {risk.mitigation && (
                              <p className="text-xs text-gray-600 dark:text-gray-400 mt-1">
                                Mitigation: {risk.mitigation}
                              </p>
                            )}
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                )}

                {/* Action Buttons */}
                <div className="flex gap-2">
                  <button
                    onClick={resetForm}
                    className="flex-1 px-4 py-2 bg-gray-200 dark:bg-gray-700 rounded-lg hover:bg-gray-300 dark:hover:bg-gray-600"
                  >
                    Start New Breakdown
                  </button>
                  <button
                    onClick={() => setIsOpen(false)}
                    className="flex-1 px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700"
                  >
                    Close Panel
                  </button>
                </div>
              </div>
            </>
          )}
        </div>
      )}
    </div>
  );
};
