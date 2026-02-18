'use client';

import { useState } from 'react';
import { FileText, Image, Hash, Wand2, X, ChevronRight, AlertCircle } from 'lucide-react';
import { TaskBreakdownRequest, TaskBreakdownResult, ExtendedTask } from '@/types/taskHierarchy';
import { ExtendedAgent } from '@/types/agentSkills';
import { taskBreakdownService } from '@/services/taskBreakdown';
import { agentAssignmentService } from '@/services/agentAssignment';
import { TaskDependencyGraph } from './TaskDependencyGraph';

interface TaskBreakdownWizardProps {
  agents: ExtendedAgent[];
  onClose: () => void;
  onApply: (result: TaskBreakdownResult) => void;
}

type Step = 'input' | 'preview' | 'review';

export const TaskBreakdownWizard = ({ agents, onClose, onApply }: TaskBreakdownWizardProps) => {
  const [step, setStep] = useState<Step>('input');
  const [sourceType, setSourceType] = useState<'issue' | 'prd' | 'screenshot' | 'text'>('text');
  const [content, setContent] = useState('');
  const [imageUrl, setImageUrl] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);
  const [result, setResult] = useState<TaskBreakdownResult | null>(null);
  const [error, setError] = useState<string | null>(null);

  const handleBreakdown = async () => {
    if (!content.trim()) {
      setError('Please provide content to analyze');
      return;
    }

    setIsProcessing(true);
    setError(null);

    try {
      const request: TaskBreakdownRequest = {
        source: sourceType,
        content,
        imageUrl: imageUrl || undefined,
      };

      const breakdownResult = await taskBreakdownService.breakdown(request);

      // Auto-assign tasks to agents
      const allTasks = [...breakdownResult.epics, ...breakdownResult.tickets, ...breakdownResult.subtasks];
      const assignments = agentAssignmentService.autoAssignTasks(allTasks, agents);

      breakdownResult.suggestedAgentAssignments = assignments;

      setResult(breakdownResult);
      setStep('preview');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to break down tasks');
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

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
      <div className="bg-white dark:bg-gray-800 rounded-xl w-full max-w-6xl max-h-[90vh] overflow-hidden flex flex-col shadow-2xl">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200 dark:border-gray-700">
          <div>
            <h2 className="text-2xl font-bold text-gray-900 dark:text-white flex items-center gap-2">
              <Wand2 size={24} />
              AI Task Breakdown
            </h2>
            <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
              Automatically break down issues, PRDs, or requirements into epics, tickets, and subtasks
            </p>
          </div>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
          >
            <X size={24} />
          </button>
        </div>

        {/* Progress indicator */}
        <div className="flex items-center gap-2 px-6 py-3 bg-gray-50 dark:bg-gray-900/50 border-b border-gray-200 dark:border-gray-700">
          <div className={`flex items-center gap-2 ${step === 'input' ? 'text-black dark:text-white font-semibold' : 'text-gray-400'}`}>
            <div className={`w-6 h-6 rounded-full flex items-center justify-center text-xs ${step === 'input' ? 'bg-black dark:bg-white text-white dark:text-black' : 'bg-gray-300 dark:bg-gray-600'}`}>
              1
            </div>
            <span className="text-sm">Input</span>
          </div>
          <ChevronRight size={16} className="text-gray-400" />
          <div className={`flex items-center gap-2 ${step === 'preview' ? 'text-black dark:text-white font-semibold' : 'text-gray-400'}`}>
            <div className={`w-6 h-6 rounded-full flex items-center justify-center text-xs ${step === 'preview' ? 'bg-black dark:bg-white text-white dark:text-black' : 'bg-gray-300 dark:bg-gray-600'}`}>
              2
            </div>
            <span className="text-sm">Preview</span>
          </div>
          <ChevronRight size={16} className="text-gray-400" />
          <div className={`flex items-center gap-2 ${step === 'review' ? 'text-black dark:text-white font-semibold' : 'text-gray-400'}`}>
            <div className={`w-6 h-6 rounded-full flex items-center justify-center text-xs ${step === 'review' ? 'bg-black dark:bg-white text-white dark:text-black' : 'bg-gray-300 dark:bg-gray-600'}`}>
              3
            </div>
            <span className="text-sm">Review</span>
          </div>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6">
          {step === 'input' && (
            <div className="space-y-6">
              {/* Source Type Selection */}
              <div>
                <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-3">
                  What would you like to analyze?
                </label>
                <div className="grid grid-cols-4 gap-3">
                  <button
                    onClick={() => setSourceType('issue')}
                    className={`p-4 rounded-lg border-2 transition-all ${
                      sourceType === 'issue'
                        ? 'border-black dark:border-white bg-black/5 dark:bg-white/5'
                        : 'border-gray-200 dark:border-gray-600 hover:border-gray-300 dark:hover:border-gray-500'
                    }`}
                  >
                    <Hash size={24} className={sourceType === 'issue' ? 'text-black dark:text-white' : 'text-gray-400'} />
                    <p className={`text-sm font-medium mt-2 ${sourceType === 'issue' ? 'text-black dark:text-white' : 'text-gray-600 dark:text-gray-400'}`}>
                      GitHub Issue
                    </p>
                  </button>

                  <button
                    onClick={() => setSourceType('prd')}
                    className={`p-4 rounded-lg border-2 transition-all ${
                      sourceType === 'prd'
                        ? 'border-black dark:border-white bg-black/5 dark:bg-white/5'
                        : 'border-gray-200 dark:border-gray-600 hover:border-gray-300 dark:hover:border-gray-500'
                    }`}
                  >
                    <FileText size={24} className={sourceType === 'prd' ? 'text-black dark:text-white' : 'text-gray-400'} />
                    <p className={`text-sm font-medium mt-2 ${sourceType === 'prd' ? 'text-black dark:text-white' : 'text-gray-600 dark:text-gray-400'}`}>
                      PRD Document
                    </p>
                  </button>

                  <button
                    onClick={() => setSourceType('screenshot')}
                    className={`p-4 rounded-lg border-2 transition-all ${
                      sourceType === 'screenshot'
                        ? 'border-black dark:border-white bg-black/5 dark:bg-white/5'
                        : 'border-gray-200 dark:border-gray-600 hover:border-gray-300 dark:hover:border-gray-500'
                    }`}
                  >
                    <Image size={24} className={sourceType === 'screenshot' ? 'text-black dark:text-white' : 'text-gray-400'} />
                    <p className={`text-sm font-medium mt-2 ${sourceType === 'screenshot' ? 'text-black dark:text-white' : 'text-gray-600 dark:text-gray-400'}`}>
                      Screenshot
                    </p>
                  </button>

                  <button
                    onClick={() => setSourceType('text')}
                    className={`p-4 rounded-lg border-2 transition-all ${
                      sourceType === 'text'
                        ? 'border-black dark:border-white bg-black/5 dark:bg-white/5'
                        : 'border-gray-200 dark:border-gray-600 hover:border-gray-300 dark:hover:border-gray-500'
                    }`}
                  >
                    <FileText size={24} className={sourceType === 'text' ? 'text-black dark:text-white' : 'text-gray-400'} />
                    <p className={`text-sm font-medium mt-2 ${sourceType === 'text' ? 'text-black dark:text-white' : 'text-gray-600 dark:text-gray-400'}`}>
                      Free Text
                    </p>
                  </button>
                </div>
              </div>

              {/* Content Input */}
              <div>
                <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
                  {sourceType === 'issue' ? 'Paste GitHub Issue Content' :
                   sourceType === 'prd' ? 'Paste PRD Content' :
                   sourceType === 'screenshot' ? 'Describe the Screenshot' :
                   'Describe Your Requirements'}
                </label>
                <textarea
                  className="w-full border border-gray-200 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white p-3 rounded-lg h-64 focus:outline-none focus:ring-2 focus:ring-black/10 dark:focus:ring-white/20 resize-none font-mono text-sm"
                  placeholder={`Example:\n\nImplement user authentication system with the following features:\n- User registration with email verification\n- Login with JWT tokens\n- Password reset functionality\n- OAuth integration (Google, GitHub)\n- Role-based access control\n\nTechnical requirements:\n- Use Supabase for authentication\n- Implement rate limiting\n- Add comprehensive testing`}
                  value={content}
                  onChange={(e) => setContent(e.target.value)}
                />
              </div>

              {/* Image URL (for screenshots) */}
              {sourceType === 'screenshot' && (
                <div>
                  <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
                    Screenshot URL (optional)
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
                <div className="p-3 bg-red-50 dark:bg-red-900/30 border border-red-200 dark:border-red-800 rounded-lg flex items-start gap-2 text-sm text-red-600 dark:text-red-400">
                  <AlertCircle size={18} className="flex-shrink-0 mt-0.5" />
                  <span>{error}</span>
                </div>
              )}
            </div>
          )}

          {step === 'preview' && result && (
            <div className="space-y-6">
              {/* Summary Stats */}
              <div className="grid grid-cols-4 gap-4">
                <div className="bg-purple-50 dark:bg-purple-900/20 border border-purple-200 dark:border-purple-800 rounded-lg p-4">
                  <p className="text-sm text-purple-600 dark:text-purple-400 font-medium">Epics</p>
                  <p className="text-3xl font-bold text-purple-900 dark:text-purple-100 mt-1">{result.epics.length}</p>
                </div>
                <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-4">
                  <p className="text-sm text-blue-600 dark:text-blue-400 font-medium">Tickets</p>
                  <p className="text-3xl font-bold text-blue-900 dark:text-blue-100 mt-1">{result.tickets.length}</p>
                </div>
                <div className="bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg p-4">
                  <p className="text-sm text-green-600 dark:text-green-400 font-medium">Subtasks</p>
                  <p className="text-3xl font-bold text-green-900 dark:text-green-100 mt-1">{result.subtasks.length}</p>
                </div>
                <div className="bg-orange-50 dark:bg-orange-900/20 border border-orange-200 dark:border-orange-800 rounded-lg p-4">
                  <p className="text-sm text-orange-600 dark:text-orange-400 font-medium">Est. Hours</p>
                  <p className="text-3xl font-bold text-orange-900 dark:text-orange-100 mt-1">{result.estimatedTotalHours}</p>
                </div>
              </div>

              {/* Risk Summary */}
              {(result.riskSummary.high > 0 || result.riskSummary.medium > 0) && (
                <div className="bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-lg p-4">
                  <h3 className="font-semibold text-yellow-900 dark:text-yellow-100 mb-2 flex items-center gap-2">
                    <AlertCircle size={18} />
                    Risk Summary
                  </h3>
                  <div className="flex gap-4 text-sm">
                    {result.riskSummary.high > 0 && (
                      <span className="text-red-600 dark:text-red-400 font-medium">
                        {result.riskSummary.high} High Risk
                      </span>
                    )}
                    {result.riskSummary.medium > 0 && (
                      <span className="text-orange-600 dark:text-orange-400 font-medium">
                        {result.riskSummary.medium} Medium Risk
                      </span>
                    )}
                    {result.riskSummary.low > 0 && (
                      <span className="text-yellow-600 dark:text-yellow-400 font-medium">
                        {result.riskSummary.low} Low Risk
                      </span>
                    )}
                  </div>
                </div>
              )}

              {/* Task List Preview */}
              <div>
                <h3 className="font-semibold text-gray-900 dark:text-white mb-3">Generated Tasks</h3>
                <div className="space-y-4 max-h-96 overflow-y-auto">
                  {result.epics.length > 0 && (
                    <TaskTypeSection
                      title="Epics"
                      tasks={result.epics}
                      color="purple"
                      assignments={result.suggestedAgentAssignments}
                      agents={agents}
                    />
                  )}
                  {result.tickets.length > 0 && (
                    <TaskTypeSection
                      title="Tickets"
                      tasks={result.tickets}
                      color="blue"
                      assignments={result.suggestedAgentAssignments}
                      agents={agents}
                    />
                  )}
                  {result.subtasks.length > 0 && (
                    <TaskTypeSection
                      title="Subtasks"
                      tasks={result.subtasks}
                      color="green"
                      assignments={result.suggestedAgentAssignments}
                      agents={agents}
                    />
                  )}
                </div>
              </div>
            </div>
          )}

          {step === 'review' && result && (
            <div className="space-y-6">
              <TaskDependencyGraph
                tasks={[...result.epics, ...result.tickets, ...result.subtasks]}
                dependencies={result.dependencies}
              />
            </div>
          )}
        </div>

        {/* Footer Actions */}
        <div className="flex items-center justify-between p-6 border-t border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-900/50">
          <button
            onClick={onClose}
            className="px-4 py-2 text-gray-600 dark:text-gray-400 hover:text-gray-800 dark:hover:text-gray-200 transition-colors"
          >
            Cancel
          </button>
          <div className="flex gap-3">
            {step === 'preview' && (
              <button
                onClick={() => setStep('input')}
                className="px-4 py-2 text-gray-600 dark:text-gray-400 hover:text-gray-800 dark:hover:text-gray-200 transition-colors"
              >
                Back
              </button>
            )}
            {step === 'review' && (
              <button
                onClick={() => setStep('preview')}
                className="px-4 py-2 text-gray-600 dark:text-gray-400 hover:text-gray-800 dark:hover:text-gray-200 transition-colors"
              >
                Back
              </button>
            )}
            {step === 'input' && (
              <button
                onClick={handleBreakdown}
                disabled={isProcessing || !content.trim()}
                className="px-6 py-2 bg-black dark:bg-white text-white dark:text-black rounded-lg hover:bg-gray-800 dark:hover:bg-gray-200 transition-colors font-medium disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
              >
                {isProcessing ? (
                  <>
                    <div className="w-4 h-4 border-2 border-white dark:border-black border-t-transparent rounded-full animate-spin"></div>
                    Analyzing...
                  </>
                ) : (
                  <>
                    <Wand2 size={18} />
                    Generate Tasks
                  </>
                )}
              </button>
            )}
            {step === 'preview' && (
              <button
                onClick={() => setStep('review')}
                className="px-6 py-2 bg-black dark:bg-white text-white dark:text-black rounded-lg hover:bg-gray-800 dark:hover:bg-gray-200 transition-colors font-medium flex items-center gap-2"
              >
                View Dependencies
                <ChevronRight size={18} />
              </button>
            )}
            {step === 'review' && (
              <button
                onClick={handleApply}
                className="px-6 py-2 bg-black dark:bg-white text-white dark:text-black rounded-lg hover:bg-gray-800 dark:hover:bg-gray-200 transition-colors font-medium"
              >
                Apply to Board
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

// Helper component for displaying task sections
const TaskTypeSection = ({
  title,
  tasks,
  color,
  assignments,
  agents,
}: {
  title: string;
  tasks: ExtendedTask[];
  color: string;
  assignments: Map<string, string>;
  agents: ExtendedAgent[];
}) => {
  const colorClasses = {
    purple: 'bg-purple-50 dark:bg-purple-900/20 border-purple-200 dark:border-purple-800 text-purple-900 dark:text-purple-100',
    blue: 'bg-blue-50 dark:bg-blue-900/20 border-blue-200 dark:border-blue-800 text-blue-900 dark:text-blue-100',
    green: 'bg-green-50 dark:bg-green-900/20 border-green-200 dark:border-green-800 text-green-900 dark:text-green-100',
  };

  return (
    <div>
      <h4 className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">{title}</h4>
      <div className="space-y-2">
        {tasks.map((task) => {
          const agentId = assignments.get(task.id);
          const agent = agentId ? agents.find((a) => a.id === agentId) : null;

          return (
            <div
              key={task.id}
              className={`p-3 rounded-lg border ${colorClasses[color as keyof typeof colorClasses]} text-sm`}
            >
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-1">
                    <span className="font-mono text-xs font-bold">{task.taskId}</span>
                    <span className="font-medium">{task.title}</span>
                  </div>
                  <p className="text-xs opacity-75 mb-2">{task.description}</p>
                  <div className="flex items-center gap-2 text-xs">
                    <span className="px-2 py-0.5 bg-white/50 dark:bg-black/20 rounded">P{task.priority}</span>
                    <span className="px-2 py-0.5 bg-white/50 dark:bg-black/20 rounded">{task.complexity}</span>
                    <span className="px-2 py-0.5 bg-white/50 dark:bg-black/20 rounded">{task.estimatedHours}h</span>
                    {agent && (
                      <span className="px-2 py-0.5 bg-white/50 dark:bg-black/20 rounded">
                        👤 {agent.name}
                      </span>
                    )}
                  </div>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
