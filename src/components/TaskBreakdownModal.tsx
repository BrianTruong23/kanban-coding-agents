'use client';

import { useState } from 'react';
import { X, Loader2, FileText, GitBranch, CheckSquare, AlertTriangle, Clock, Users } from 'lucide-react';
import { Task, TaskBreakdown } from '@/types/task';
import { TaskBreakdownService } from '@/lib/taskBreakdown';

interface TaskBreakdownModalProps {
  isOpen: boolean;
  onClose: () => void;
  onTasksCreated: (breakdown: TaskBreakdown) => void;
}

const taskBreakdownService = new TaskBreakdownService();

export const TaskBreakdownModal = ({
  isOpen,
  onClose,
  onTasksCreated,
}: TaskBreakdownModalProps) => {
  const [input, setInput] = useState('');
  const [context, setContext] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);
  const [breakdown, setBreakdown] = useState<TaskBreakdown | null>(null);
  const [error, setError] = useState<string | null>(null);

  const handleBreakdown = async () => {
    if (!input.trim()) {
      setError('Please provide a description');
      return;
    }

    setIsProcessing(true);
    setError(null);

    try {
      const result = await taskBreakdownService.breakdownTask(
        {
          title: input.split('\n')[0].substring(0, 100),
          description: input,
          context: context || undefined,
        },
        {
          includeTestNotes: true,
          includeRiskAssessment: true,
        }
      );

      setBreakdown(result);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to break down task');
    } finally {
      setIsProcessing(false);
    }
  };

  const handleCreateTasks = () => {
    if (breakdown) {
      onTasksCreated(breakdown);
      handleReset();
      onClose();
    }
  };

  const handleReset = () => {
    setInput('');
    setContext('');
    setBreakdown(null);
    setError(null);
  };

  const getRiskColor = (risk?: string) => {
    switch (risk) {
      case 'critical': return 'text-red-600 dark:text-red-400';
      case 'high': return 'text-orange-600 dark:text-orange-400';
      case 'medium': return 'text-yellow-600 dark:text-yellow-400';
      case 'low': return 'text-green-600 dark:text-green-400';
      default: return 'text-gray-600 dark:text-gray-400';
    }
  };

  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4"
      onClick={onClose}
    >
      <div
        className="bg-white dark:bg-gray-800 rounded-xl w-full max-w-4xl max-h-[90vh] overflow-hidden shadow-2xl flex flex-col"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200 dark:border-gray-700">
          <div className="flex items-center gap-3">
            <GitBranch className="text-blue-500" size={24} />
            <h2 className="text-xl font-bold text-gray-900 dark:text-white">
              AI Task Breakdown
            </h2>
          </div>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
          >
            <X size={24} />
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6">
          {!breakdown ? (
            // Input Form
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Issue / PRD / Feature Description *
                </label>
                <textarea
                  className="w-full border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white p-3 rounded-lg h-48 focus:outline-none focus:ring-2 focus:ring-blue-500 dark:focus:ring-blue-400 resize-none"
                  placeholder="Paste your GitHub issue, PRD, or describe the feature you want to implement...&#10;&#10;Example:&#10;# Implement User Authentication&#10;- Add login/signup pages&#10;- Integrate with OAuth providers&#10;- Store user sessions&#10;- Add role-based access control"
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  autoFocus
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Additional Context (optional)
                </label>
                <textarea
                  className="w-full border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white p-3 rounded-lg h-24 focus:outline-none focus:ring-2 focus:ring-blue-500 dark:focus:ring-blue-400 resize-none"
                  placeholder="Provide additional context about your tech stack, constraints, or specific requirements..."
                  value={context}
                  onChange={(e) => setContext(e.target.value)}
                />
              </div>

              {error && (
                <div className="p-3 bg-red-50 dark:bg-red-900/30 border border-red-200 dark:border-red-800 rounded-lg text-sm text-red-600 dark:text-red-400">
                  {error}
                </div>
              )}

              <button
                onClick={handleBreakdown}
                disabled={isProcessing || !input.trim()}
                className="w-full bg-blue-600 hover:bg-blue-700 disabled:bg-gray-400 text-white py-3 rounded-lg font-medium flex items-center justify-center gap-2 transition-colors"
              >
                {isProcessing ? (
                  <>
                    <Loader2 size={20} className="animate-spin" />
                    Analyzing and breaking down...
                  </>
                ) : (
                  <>
                    <GitBranch size={20} />
                    Break Down into Tasks
                  </>
                )}
              </button>
            </div>
          ) : (
            // Breakdown Results
            <div className="space-y-6">
              {/* Epic */}
              <div className="border-2 border-purple-200 dark:border-purple-800 rounded-lg p-4 bg-purple-50 dark:bg-purple-900/20">
                <div className="flex items-center gap-2 mb-3">
                  <FileText className="text-purple-600 dark:text-purple-400" size={20} />
                  <span className="text-sm font-semibold text-purple-700 dark:text-purple-300 uppercase">
                    Epic
                  </span>
                  <span className="text-xs text-gray-500 dark:text-gray-400">
                    {breakdown.epic.taskId}
                  </span>
                </div>
                <h3 className="font-bold text-lg text-gray-900 dark:text-white mb-2">
                  {breakdown.epic.title}
                </h3>
                <p className="text-sm text-gray-600 dark:text-gray-400 mb-3">
                  {breakdown.epic.description}
                </p>
                <div className="flex flex-wrap gap-3 text-xs">
                  <span className="flex items-center gap-1">
                    <Clock size={14} />
                    {breakdown.epic.estimatedHours}h estimated
                  </span>
                  <span className={`flex items-center gap-1 ${getRiskColor(breakdown.epic.riskLevel)}`}>
                    <AlertTriangle size={14} />
                    {breakdown.epic.riskLevel || 'low'} risk
                  </span>
                  <span className="flex items-center gap-1">
                    <CheckSquare size={14} />
                    {breakdown.tickets.length} tickets
                  </span>
                </div>
              </div>

              {/* Tickets */}
              <div>
                <h4 className="text-sm font-semibold text-gray-700 dark:text-gray-300 uppercase mb-3 flex items-center gap-2">
                  <CheckSquare size={16} />
                  Tickets ({breakdown.tickets.length})
                </h4>
                <div className="space-y-3">
                  {breakdown.tickets.map((ticket) => (
                    <div
                      key={ticket.id}
                      className="border border-gray-200 dark:border-gray-700 rounded-lg p-3 bg-white dark:bg-gray-800"
                    >
                      <div className="flex items-start justify-between mb-2">
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-1">
                            <span className="text-xs font-mono text-gray-500 dark:text-gray-400">
                              {ticket.taskId}
                            </span>
                            <span className="text-xs px-1.5 py-0.5 bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 rounded">
                              P{ticket.priority}
                            </span>
                            <span className={`text-xs ${getRiskColor(ticket.riskLevel)}`}>
                              {ticket.riskLevel}
                            </span>
                          </div>
                          <h5 className="font-semibold text-gray-900 dark:text-white">
                            {ticket.title}
                          </h5>
                          <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                            {ticket.description}
                          </p>
                        </div>
                        <span className="text-xs text-gray-500 dark:text-gray-400 ml-2">
                          {ticket.estimatedHours}h
                        </span>
                      </div>

                      {/* Subtasks for this ticket */}
                      {breakdown.subtasks.has(ticket.id) && (
                        <div className="mt-3 pl-4 border-l-2 border-gray-200 dark:border-gray-700">
                          <div className="text-xs text-gray-500 dark:text-gray-400 mb-2">
                            Subtasks ({breakdown.subtasks.get(ticket.id)!.length})
                          </div>
                          <div className="space-y-2">
                            {breakdown.subtasks.get(ticket.id)!.map((subtask) => (
                              <div
                                key={subtask.id}
                                className="text-sm bg-gray-50 dark:bg-gray-900/50 p-2 rounded"
                              >
                                <div className="flex items-center justify-between">
                                  <span className="text-gray-700 dark:text-gray-300">
                                    {subtask.title}
                                  </span>
                                  <span className="text-xs text-gray-500 dark:text-gray-400">
                                    {subtask.estimatedHours}h
                                  </span>
                                </div>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}

                      {/* Skills Required */}
                      {ticket.suggestedAgentSkills && ticket.suggestedAgentSkills.length > 0 && (
                        <div className="mt-3 flex items-center gap-2 text-xs">
                          <Users size={14} className="text-gray-400" />
                          <div className="flex flex-wrap gap-1">
                            {ticket.suggestedAgentSkills.map((skill) => (
                              <span
                                key={skill}
                                className="px-2 py-0.5 bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded"
                              >
                                {skill}
                              </span>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </div>

              {/* Summary */}
              <div className="bg-gray-50 dark:bg-gray-900/50 rounded-lg p-4">
                <h4 className="font-semibold text-gray-900 dark:text-white mb-2">Summary</h4>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                  <div>
                    <div className="text-gray-500 dark:text-gray-400">Total Tasks</div>
                    <div className="text-lg font-bold text-gray-900 dark:text-white">
                      {1 + breakdown.tickets.length + Array.from(breakdown.subtasks.values()).flat().length}
                    </div>
                  </div>
                  <div>
                    <div className="text-gray-500 dark:text-gray-400">Tickets</div>
                    <div className="text-lg font-bold text-gray-900 dark:text-white">
                      {breakdown.tickets.length}
                    </div>
                  </div>
                  <div>
                    <div className="text-gray-500 dark:text-gray-400">Subtasks</div>
                    <div className="text-lg font-bold text-gray-900 dark:text-white">
                      {Array.from(breakdown.subtasks.values()).flat().length}
                    </div>
                  </div>
                  <div>
                    <div className="text-gray-500 dark:text-gray-400">Est. Hours</div>
                    <div className="text-lg font-bold text-gray-900 dark:text-white">
                      {breakdown.epic.estimatedHours}h
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-6 border-t border-gray-200 dark:border-gray-700 flex justify-end gap-3">
          {breakdown ? (
            <>
              <button
                onClick={handleReset}
                className="px-4 py-2 text-gray-600 dark:text-gray-400 hover:text-gray-800 dark:hover:text-gray-200 transition-colors"
              >
                Start Over
              </button>
              <button
                onClick={handleCreateTasks}
                className="px-6 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg font-medium transition-colors"
              >
                Create All Tasks
              </button>
            </>
          ) : (
            <button
              onClick={onClose}
              className="px-4 py-2 text-gray-600 dark:text-gray-400 hover:text-gray-800 dark:hover:text-gray-200 transition-colors"
            >
              Cancel
            </button>
          )}
        </div>
      </div>
    </div>
  );
};
