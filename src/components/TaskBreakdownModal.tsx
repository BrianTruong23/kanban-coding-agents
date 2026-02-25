'use client';

import { useState } from 'react';
import { X, FileText, Image, Loader2, CheckCircle, AlertTriangle, Zap } from 'lucide-react';
import { breakdownTask, parseScreenshot } from '@/lib/taskBreakdown';
import { BreakdownRequest, BreakdownResponse } from '@/types/breakdown';
import { Task } from '@/types/task';
import { generateId, generateTaskId } from '@/lib/utils';

interface TaskBreakdownModalProps {
  isOpen: boolean;
  onClose: () => void;
  onCreateTasks: (tasks: Task[]) => void;
  existingTaskCount: number;
}

export const TaskBreakdownModal = ({
  isOpen,
  onClose,
  onCreateTasks,
  existingTaskCount,
}: TaskBreakdownModalProps) => {
  const [inputType, setInputType] = useState<'issue' | 'prd' | 'screenshot'>('issue');
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);
  const [breakdown, setBreakdown] = useState<BreakdownResponse | null>(null);
  const [selectedTickets, setSelectedTickets] = useState<Set<string>>(new Set());

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim() || !content.trim()) return;

    setIsProcessing(true);

    try {
      const request: BreakdownRequest = {
        type: inputType,
        title,
        content: inputType === 'screenshot' ? await parseScreenshot(content) : content,
        additionalContext: '',
      };

      const result = await breakdownTask(request);
      setBreakdown(result);

      // Auto-select all tickets
      const allTickets = result.epics.flatMap((epic) =>
        epic.tickets.map((ticket) => `${epic.title}::${ticket.title}`)
      );
      setSelectedTickets(new Set(allTickets));
    } catch (error) {
      console.error('Error breaking down task:', error);
      alert('Failed to break down task. Please try again.');
    } finally {
      setIsProcessing(false);
    }
  };

  const handleCreateTasks = () => {
    if (!breakdown) return;

    const tasks: Task[] = [];
    let taskNumber = existingTaskCount;

    breakdown.epics.forEach((epic) => {
      epic.tickets.forEach((ticket) => {
        const ticketKey = `${epic.title}::${ticket.title}`;
        if (selectedTickets.has(ticketKey)) {
          taskNumber++;
          tasks.push({
            id: generateId(),
            taskId: generateTaskId(taskNumber),
            title: ticket.title,
            description: ticket.description,
            status: 'backlog',
            priority: ticket.priority,
            tags: [...ticket.tags, epic.title.toLowerCase().replace(/\s+/g, '-')],
            commentsCount: 0,
            attachmentsCount: 0,
            createdAt: Date.now(),
            updatedAt: Date.now(),
          });
        }
      });
    });

    onCreateTasks(tasks);
    handleReset();
  };

  const handleReset = () => {
    setTitle('');
    setContent('');
    setBreakdown(null);
    setSelectedTickets(new Set());
    onClose();
  };

  const toggleTicket = (epicTitle: string, ticketTitle: string) => {
    const key = `${epicTitle}::${ticketTitle}`;
    setSelectedTickets((prev) => {
      const newSet = new Set(prev);
      if (newSet.has(key)) {
        newSet.delete(key);
      } else {
        newSet.add(key);
      }
      return newSet;
    });
  };

  const getRiskColor = (level: string) => {
    const colors: Record<string, string> = {
      low: 'text-green-600 bg-green-50 dark:bg-green-900/30',
      medium: 'text-yellow-600 bg-yellow-50 dark:bg-yellow-900/30',
      high: 'text-orange-600 bg-orange-50 dark:bg-orange-900/30',
      critical: 'text-red-600 bg-red-50 dark:bg-red-900/30',
    };
    return colors[level] || colors.low;
  };

  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4"
      onClick={handleReset}
    >
      <div
        className="bg-white dark:bg-gray-800 rounded-xl w-full max-w-6xl max-h-[90vh] overflow-hidden shadow-2xl flex flex-col"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="p-6 border-b border-gray-200 dark:border-gray-700">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
                <Zap className="inline mr-2" size={24} />
                AI Task Breakdown
              </h2>
              <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                Break down issues, PRDs, or screenshots into actionable tasks
              </p>
            </div>
            <button
              onClick={handleReset}
              className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
            >
              <X size={24} />
            </button>
          </div>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6">
          {!breakdown ? (
            // Input Form
            <form onSubmit={handleSubmit} className="space-y-6">
              {/* Input Type Selector */}
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">
                  Input Type
                </label>
                <div className="grid grid-cols-3 gap-3">
                  <button
                    type="button"
                    onClick={() => setInputType('issue')}
                    className={`p-4 border-2 rounded-lg text-center transition-all ${
                      inputType === 'issue'
                        ? 'border-black dark:border-white bg-black dark:bg-white text-white dark:text-black'
                        : 'border-gray-200 dark:border-gray-700 hover:border-gray-300 dark:hover:border-gray-600'
                    }`}
                  >
                    <FileText className="mx-auto mb-2" size={24} />
                    <div className="font-medium">GitHub Issue</div>
                    <div className="text-xs mt-1 opacity-70">Paste issue content</div>
                  </button>
                  <button
                    type="button"
                    onClick={() => setInputType('prd')}
                    className={`p-4 border-2 rounded-lg text-center transition-all ${
                      inputType === 'prd'
                        ? 'border-black dark:border-white bg-black dark:bg-white text-white dark:text-black'
                        : 'border-gray-200 dark:border-gray-700 hover:border-gray-300 dark:hover:border-gray-600'
                    }`}
                  >
                    <FileText className="mx-auto mb-2" size={24} />
                    <div className="font-medium">PRD</div>
                    <div className="text-xs mt-1 opacity-70">Product requirements</div>
                  </button>
                  <button
                    type="button"
                    onClick={() => setInputType('screenshot')}
                    className={`p-4 border-2 rounded-lg text-center transition-all ${
                      inputType === 'screenshot'
                        ? 'border-black dark:border-white bg-black dark:bg-white text-white dark:text-black'
                        : 'border-gray-200 dark:border-gray-700 hover:border-gray-300 dark:hover:border-gray-600'
                    }`}
                  >
                    <Image className="mx-auto mb-2" size={24} />
                    <div className="font-medium">Screenshot</div>
                    <div className="text-xs mt-1 opacity-70">Upload or paste URL</div>
                  </button>
                </div>
              </div>

              {/* Title Input */}
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Title *
                </label>
                <input
                  type="text"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="e.g., Implement user authentication system"
                  className="w-full border border-gray-200 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white p-3 rounded-lg focus:outline-none focus:ring-2 focus:ring-black/10 dark:focus:ring-white/20"
                  required
                />
              </div>

              {/* Content Input */}
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  {inputType === 'screenshot' ? 'Image URL' : 'Description'} *
                </label>
                <textarea
                  value={content}
                  onChange={(e) => setContent(e.target.value)}
                  placeholder={
                    inputType === 'screenshot'
                      ? 'Paste image URL or path...'
                      : 'Describe the feature, requirements, acceptance criteria...'
                  }
                  className="w-full border border-gray-200 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white p-3 rounded-lg h-64 focus:outline-none focus:ring-2 focus:ring-black/10 dark:focus:ring-white/20 resize-none"
                  required
                />
              </div>

              {/* Submit Button */}
              <div className="flex justify-end gap-3">
                <button
                  type="button"
                  onClick={handleReset}
                  className="px-6 py-2.5 text-gray-600 dark:text-gray-400 hover:text-gray-800 dark:hover:text-gray-200 transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isProcessing}
                  className="px-6 py-2.5 bg-black dark:bg-white text-white dark:text-black rounded-lg hover:bg-gray-800 dark:hover:bg-gray-200 transition-colors font-medium flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {isProcessing ? (
                    <>
                      <Loader2 className="animate-spin" size={18} />
                      Processing...
                    </>
                  ) : (
                    <>
                      <Zap size={18} />
                      Break Down Tasks
                    </>
                  )}
                </button>
              </div>
            </form>
          ) : (
            // Breakdown Results
            <div className="space-y-6">
              <div className="bg-green-50 dark:bg-green-900/30 border border-green-200 dark:border-green-800 rounded-lg p-4 flex items-start gap-3">
                <CheckCircle className="text-green-600 dark:text-green-400 flex-shrink-0" size={20} />
                <div>
                  <div className="font-medium text-green-900 dark:text-green-100">
                    Breakdown Complete!
                  </div>
                  <div className="text-sm text-green-700 dark:text-green-300 mt-1">
                    Found {breakdown.epics.length} epic(s) with{' '}
                    {breakdown.epics.reduce((sum, e) => sum + e.tickets.length, 0)} ticket(s).
                    Select the tasks you want to create.
                  </div>
                </div>
              </div>

              {/* Epics and Tickets */}
              {breakdown.epics.map((epic, epicIdx) => (
                <div
                  key={epicIdx}
                  className="border border-gray-200 dark:border-gray-700 rounded-lg overflow-hidden"
                >
                  <div className="bg-gray-100 dark:bg-gray-700 p-4 border-b border-gray-200 dark:border-gray-600">
                    <h3 className="font-bold text-lg text-gray-900 dark:text-white">
                      {epic.title}
                    </h3>
                    <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                      {epic.description}
                    </p>
                  </div>

                  <div className="divide-y divide-gray-200 dark:divide-gray-700">
                    {epic.tickets.map((ticket, ticketIdx) => {
                      const ticketKey = `${epic.title}::${ticket.title}`;
                      const isSelected = selectedTickets.has(ticketKey);

                      return (
                        <div
                          key={ticketIdx}
                          className={`p-4 cursor-pointer transition-colors ${
                            isSelected
                              ? 'bg-blue-50 dark:bg-blue-900/20'
                              : 'hover:bg-gray-50 dark:hover:bg-gray-700/50'
                          }`}
                          onClick={() => toggleTicket(epic.title, ticket.title)}
                        >
                          <div className="flex items-start gap-3">
                            <input
                              type="checkbox"
                              checked={isSelected}
                              onChange={() => {}}
                              className="mt-1 w-4 h-4"
                            />
                            <div className="flex-1">
                              <div className="flex items-start justify-between gap-3">
                                <div className="flex-1">
                                  <h4 className="font-semibold text-gray-900 dark:text-white">
                                    {ticket.title}
                                  </h4>
                                  <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                                    {ticket.description}
                                  </p>
                                </div>
                                <div className="flex items-center gap-2">
                                  <span
                                    className={`text-xs font-semibold px-2 py-1 rounded ${
                                      ticket.priority >= 5
                                        ? 'bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-400'
                                        : ticket.priority >= 4
                                        ? 'bg-orange-100 dark:bg-orange-900/30 text-orange-700 dark:text-orange-400'
                                        : 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-400'
                                    }`}
                                  >
                                    P{ticket.priority}
                                  </span>
                                  {ticket.estimatedHours && (
                                    <span className="text-xs text-gray-500 dark:text-gray-400">
                                      {ticket.estimatedHours}h
                                    </span>
                                  )}
                                </div>
                              </div>

                              {/* Tags */}
                              {ticket.tags.length > 0 && (
                                <div className="flex flex-wrap gap-1 mt-2">
                                  {ticket.tags.map((tag, idx) => (
                                    <span
                                      key={idx}
                                      className="text-xs px-2 py-0.5 bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded"
                                    >
                                      {tag}
                                    </span>
                                  ))}
                                </div>
                              )}

                              {/* Risks */}
                              {ticket.risks.length > 0 && (
                                <div className="mt-3 space-y-1">
                                  {ticket.risks.map((risk, idx) => (
                                    <div
                                      key={idx}
                                      className={`text-xs p-2 rounded flex items-start gap-2 ${getRiskColor(
                                        risk.level
                                      )}`}
                                    >
                                      <AlertTriangle size={14} className="flex-shrink-0 mt-0.5" />
                                      <div>
                                        <span className="font-semibold uppercase">{risk.level}:</span>{' '}
                                        {risk.description}
                                        {risk.mitigation && (
                                          <div className="mt-1 opacity-75">→ {risk.mitigation}</div>
                                        )}
                                      </div>
                                    </div>
                                  ))}
                                </div>
                              )}

                              {/* Subtasks count */}
                              {ticket.subtasks.length > 0 && (
                                <div className="text-xs text-gray-500 dark:text-gray-400 mt-2">
                                  {ticket.subtasks.length} subtask(s)
                                </div>
                              )}
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              ))}

              {/* Actions */}
              <div className="flex justify-between items-center pt-4 border-t border-gray-200 dark:border-gray-700">
                <button
                  onClick={() => setBreakdown(null)}
                  className="text-gray-600 dark:text-gray-400 hover:text-gray-800 dark:hover:text-gray-200 transition-colors"
                >
                  ← Start Over
                </button>
                <div className="flex gap-3">
                  <button
                    onClick={handleReset}
                    className="px-6 py-2.5 text-gray-600 dark:text-gray-400 hover:text-gray-800 dark:hover:text-gray-200 transition-colors"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handleCreateTasks}
                    disabled={selectedTickets.size === 0}
                    className="px-6 py-2.5 bg-black dark:bg-white text-white dark:text-black rounded-lg hover:bg-gray-800 dark:hover:bg-gray-200 transition-colors font-medium disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    Create {selectedTickets.size} Task(s)
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
