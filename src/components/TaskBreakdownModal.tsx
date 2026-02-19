'use client';

import { useState } from 'react';
import { X, Wand2, FileText, Image, AlertTriangle } from 'lucide-react';
import { Task } from '@/types/task';
import { breakdownTask, quickBreakdown, BreakdownInput } from '@/lib/taskBreakdown';

interface TaskBreakdownModalProps {
  isOpen: boolean;
  onClose: () => void;
  onBreakdownComplete: (tasks: Task[]) => void;
  existingTaskCount: number;
}

export const TaskBreakdownModal = ({
  isOpen,
  onClose,
  onBreakdownComplete,
  existingTaskCount,
}: TaskBreakdownModalProps) => {
  const [inputType, setInputType] = useState<'issue' | 'prd' | 'text'>('text');
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [content, setContent] = useState('');
  const [breakdownType, setBreakdownType] = useState<'full' | 'quick'>('full');
  const [isProcessing, setIsProcessing] = useState(false);
  const [previewResult, setPreviewResult] = useState<{
    epic: Task;
    tickets: Task[];
    subtasks: Task[];
  } | null>(null);

  if (!isOpen) return null;

  const handlePreview = () => {
    if (!title.trim() || !content.trim()) return;

    setIsProcessing(true);

    const input: BreakdownInput = {
      title,
      description,
      type: inputType,
      content,
    };

    try {
      if (breakdownType === 'full') {
        const result = breakdownTask(input, existingTaskCount);
        setPreviewResult(result);
      } else {
        const tasks = quickBreakdown(title, content, existingTaskCount);
        setPreviewResult({
          epic: tasks[0],
          tickets: [],
          subtasks: tasks.slice(1),
        });
      }
    } catch (error) {
      console.error('Breakdown error:', error);
    } finally {
      setIsProcessing(false);
    }
  };

  const handleConfirm = () => {
    if (!previewResult) return;

    const allTasks = [
      previewResult.epic,
      ...previewResult.tickets,
      ...previewResult.subtasks,
    ].filter(Boolean);

    onBreakdownComplete(allTasks);
    handleClose();
  };

  const handleClose = () => {
    setTitle('');
    setDescription('');
    setContent('');
    setPreviewResult(null);
    onClose();
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4"
      onClick={handleClose}
    >
      <div
        className="bg-white dark:bg-gray-800 rounded-xl w-full max-w-4xl max-h-[90vh] overflow-hidden shadow-2xl flex flex-col"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="p-6 border-b border-gray-200 dark:border-gray-700">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-purple-100 dark:bg-purple-900/30 rounded-lg">
                <Wand2 className="text-purple-600 dark:text-purple-400" size={24} />
              </div>
              <div>
                <h2 className="text-xl font-bold text-gray-900 dark:text-white">
                  Automated Task Breakdown
                </h2>
                <p className="text-sm text-gray-500 dark:text-gray-400">
                  Break down issues, PRDs, or text into structured tasks
                </p>
              </div>
            </div>
            <button
              onClick={handleClose}
              className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
            >
              <X size={24} />
            </button>
          </div>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6">
          {!previewResult ? (
            <div className="space-y-6">
              {/* Input Type Selection */}
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Input Type
                </label>
                <div className="flex gap-3">
                  <button
                    type="button"
                    onClick={() => setInputType('issue')}
                    className={`flex-1 p-3 rounded-lg border-2 transition-all ${
                      inputType === 'issue'
                        ? 'border-purple-500 bg-purple-50 dark:bg-purple-900/20'
                        : 'border-gray-200 dark:border-gray-600'
                    }`}
                  >
                    <AlertTriangle size={20} className="mx-auto mb-1" />
                    <div className="text-sm font-medium">GitHub Issue</div>
                  </button>
                  <button
                    type="button"
                    onClick={() => setInputType('prd')}
                    className={`flex-1 p-3 rounded-lg border-2 transition-all ${
                      inputType === 'prd'
                        ? 'border-purple-500 bg-purple-50 dark:bg-purple-900/20'
                        : 'border-gray-200 dark:border-gray-600'
                    }`}
                  >
                    <FileText size={20} className="mx-auto mb-1" />
                    <div className="text-sm font-medium">PRD/Document</div>
                  </button>
                  <button
                    type="button"
                    onClick={() => setInputType('text')}
                    className={`flex-1 p-3 rounded-lg border-2 transition-all ${
                      inputType === 'text'
                        ? 'border-purple-500 bg-purple-50 dark:bg-purple-900/20'
                        : 'border-gray-200 dark:border-gray-600'
                    }`}
                  >
                    <FileText size={20} className="mx-auto mb-1" />
                    <div className="text-sm font-medium">Plain Text</div>
                  </button>
                </div>
              </div>

              {/* Breakdown Type */}
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Breakdown Type
                </label>
                <div className="flex gap-3">
                  <button
                    type="button"
                    onClick={() => setBreakdownType('full')}
                    className={`flex-1 p-3 rounded-lg border-2 transition-all ${
                      breakdownType === 'full'
                        ? 'border-purple-500 bg-purple-50 dark:bg-purple-900/20'
                        : 'border-gray-200 dark:border-gray-600'
                    }`}
                  >
                    <div className="text-sm font-medium">Full Breakdown</div>
                    <div className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                      Epic → Tickets → Subtasks
                    </div>
                  </button>
                  <button
                    type="button"
                    onClick={() => setBreakdownType('quick')}
                    className={`flex-1 p-3 rounded-lg border-2 transition-all ${
                      breakdownType === 'quick'
                        ? 'border-purple-500 bg-purple-50 dark:bg-purple-900/20'
                        : 'border-gray-200 dark:border-gray-600'
                    }`}
                  >
                    <div className="text-sm font-medium">Quick Breakdown</div>
                    <div className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                      Ticket → Subtasks
                    </div>
                  </button>
                </div>
              </div>

              {/* Title */}
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Title *
                </label>
                <input
                  type="text"
                  className="w-full border border-gray-200 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white p-3 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
                  placeholder="e.g., Implement User Authentication System"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                />
              </div>

              {/* Description */}
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Brief Description
                </label>
                <input
                  type="text"
                  className="w-full border border-gray-200 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white p-3 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
                  placeholder="One-line summary of the work"
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                />
              </div>

              {/* Content */}
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Detailed Content *
                </label>
                <textarea
                  className="w-full border border-gray-200 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white p-3 rounded-lg h-48 focus:outline-none focus:ring-2 focus:ring-purple-500 resize-none font-mono text-sm"
                  placeholder={`Paste your issue, PRD, or requirements here...

Example:
- Implement user login with email/password
- Add OAuth support (Google, GitHub)
- Create password reset flow
- Add email verification
- Implement session management
- Add role-based access control

Risks:
- OAuth provider downtime
- Email delivery reliability

Test:
- Verify login works with valid credentials
- Test password reset flow end-to-end`}
                  value={content}
                  onChange={(e) => setContent(e.target.value)}
                />
              </div>

              {/* Actions */}
              <div className="flex justify-end gap-3">
                <button
                  type="button"
                  onClick={handleClose}
                  className="px-4 py-2 text-gray-600 dark:text-gray-400 hover:text-gray-800 dark:hover:text-gray-200 transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={handlePreview}
                  disabled={!title.trim() || !content.trim() || isProcessing}
                  className="px-6 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors font-medium disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
                >
                  <Wand2 size={18} />
                  {isProcessing ? 'Processing...' : 'Generate Breakdown'}
                </button>
              </div>
            </div>
          ) : (
            <div className="space-y-6">
              {/* Preview Header */}
              <div className="bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg p-4">
                <h3 className="font-semibold text-green-900 dark:text-green-100 mb-2">
                  Breakdown Complete!
                </h3>
                <p className="text-sm text-green-700 dark:text-green-300">
                  {breakdownType === 'full'
                    ? `Generated 1 epic, ${previewResult.tickets.length} tickets, and ${previewResult.subtasks.length} subtasks`
                    : `Generated 1 ticket and ${previewResult.subtasks.length} subtasks`}
                </p>
              </div>

              {/* Epic Preview */}
              {breakdownType === 'full' && (
                <div className="border border-purple-200 dark:border-purple-800 rounded-lg p-4">
                  <div className="flex items-center gap-2 mb-2">
                    <span className="bg-purple-100 dark:bg-purple-900/30 text-purple-800 dark:text-purple-300 px-2 py-1 rounded text-xs font-semibold">
                      EPIC
                    </span>
                    <span className="text-sm font-mono text-gray-500 dark:text-gray-400">
                      {previewResult.epic.taskId}
                    </span>
                  </div>
                  <h4 className="font-semibold text-gray-900 dark:text-white">
                    {previewResult.epic.title}
                  </h4>
                  {previewResult.epic.riskFlags && previewResult.epic.riskFlags.length > 0 && (
                    <div className="mt-2 flex gap-2">
                      {previewResult.epic.riskFlags.map((risk, idx) => (
                        <span
                          key={idx}
                          className="bg-red-100 dark:bg-red-900/30 text-red-800 dark:text-red-300 px-2 py-1 rounded text-xs flex items-center gap-1"
                        >
                          <AlertTriangle size={12} />
                          {risk.level}
                        </span>
                      ))}
                    </div>
                  )}
                </div>
              )}

              {/* Tickets Preview */}
              {breakdownType === 'full' && previewResult.tickets.length > 0 && (
                <div className="space-y-3">
                  <h4 className="font-semibold text-gray-700 dark:text-gray-300">
                    Tickets ({previewResult.tickets.length})
                  </h4>
                  <div className="space-y-2 max-h-60 overflow-y-auto">
                    {previewResult.tickets.map((ticket) => (
                      <div
                        key={ticket.id}
                        className="border border-blue-200 dark:border-blue-800 rounded-lg p-3"
                      >
                        <div className="flex items-center gap-2 mb-1">
                          <span className="bg-blue-100 dark:bg-blue-900/30 text-blue-800 dark:text-blue-300 px-2 py-0.5 rounded text-xs font-semibold">
                            TICKET
                          </span>
                          <span className="text-xs font-mono text-gray-500 dark:text-gray-400">
                            {ticket.taskId}
                          </span>
                        </div>
                        <div className="text-sm text-gray-900 dark:text-white">
                          {ticket.title}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Subtasks Preview */}
              {previewResult.subtasks.length > 0 && (
                <div className="space-y-3">
                  <h4 className="font-semibold text-gray-700 dark:text-gray-300">
                    Subtasks ({previewResult.subtasks.length})
                  </h4>
                  <div className="space-y-2 max-h-60 overflow-y-auto">
                    {previewResult.subtasks.slice(0, 10).map((subtask) => (
                      <div
                        key={subtask.id}
                        className="border border-gray-200 dark:border-gray-600 rounded-lg p-2 pl-6"
                      >
                        <div className="flex items-center gap-2">
                          <span className="text-xs font-mono text-gray-500 dark:text-gray-400">
                            {subtask.taskId}
                          </span>
                          <span className="text-sm text-gray-700 dark:text-gray-300">
                            {subtask.title}
                          </span>
                        </div>
                      </div>
                    ))}
                    {previewResult.subtasks.length > 10 && (
                      <div className="text-xs text-gray-500 dark:text-gray-400 text-center">
                        ... and {previewResult.subtasks.length - 10} more
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* Actions */}
              <div className="flex justify-end gap-3 pt-4 border-t border-gray-200 dark:border-gray-700">
                <button
                  type="button"
                  onClick={() => setPreviewResult(null)}
                  className="px-4 py-2 text-gray-600 dark:text-gray-400 hover:text-gray-800 dark:hover:text-gray-200 transition-colors"
                >
                  Back
                </button>
                <button
                  type="button"
                  onClick={handleConfirm}
                  className="px-6 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors font-medium"
                >
                  Create All Tasks
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
