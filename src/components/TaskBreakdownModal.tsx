'use client';

import { useState } from 'react';
import { X, Upload, FileText, Image as ImageIcon, Loader2, ChevronDown, ChevronRight } from 'lucide-react';
import { BreakdownInput, BreakdownResult } from '@/types/breakdown';
import { breakdownTask } from '@/lib/taskBreakdown';

interface TaskBreakdownModalProps {
  isOpen: boolean;
  onClose: () => void;
  onBreakdownComplete: (result: BreakdownResult) => void;
}

export const TaskBreakdownModal = ({
  isOpen,
  onClose,
  onBreakdownComplete,
}: TaskBreakdownModalProps) => {
  const [inputType, setInputType] = useState<'text' | 'issue' | 'prd' | 'screenshot'>('text');
  const [content, setContent] = useState('');
  const [imageUrl, setImageUrl] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);
  const [result, setResult] = useState<BreakdownResult | null>(null);
  const [expandedTickets, setExpandedTickets] = useState<Set<number>>(new Set());

  if (!isOpen) return null;

  const handleSubmit = async () => {
    if (!content.trim()) return;

    setIsProcessing(true);
    try {
      const input: BreakdownInput = {
        type: inputType,
        content,
        imageUrl: inputType === 'screenshot' ? imageUrl : undefined,
      };

      const breakdown = await breakdownTask(input);
      setResult(breakdown);
    } catch (error) {
      console.error('Error breaking down task:', error);
      alert('Failed to break down task. Please try again.');
    } finally {
      setIsProcessing(false);
    }
  };

  const handleAcceptBreakdown = () => {
    if (result) {
      onBreakdownComplete(result);
      handleClose();
    }
  };

  const handleClose = () => {
    setContent('');
    setImageUrl('');
    setResult(null);
    setExpandedTickets(new Set());
    onClose();
  };

  const toggleTicket = (index: number) => {
    const newExpanded = new Set(expandedTickets);
    if (newExpanded.has(index)) {
      newExpanded.delete(index);
    } else {
      newExpanded.add(index);
    }
    setExpandedTickets(newExpanded);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
      <div className="bg-white dark:bg-gray-800 rounded-xl w-full max-w-4xl max-h-[90vh] overflow-hidden flex flex-col shadow-2xl">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200 dark:border-gray-700">
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
            AI Task Breakdown
          </h2>
          <button
            onClick={handleClose}
            className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
          >
            <X size={24} />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-6">
          {!result ? (
            <>
              {/* Input Type Selection */}
              <div className="mb-6">
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">
                  Input Type
                </label>
                <div className="grid grid-cols-4 gap-3">
                  {[
                    { value: 'text', label: 'Plain Text', icon: FileText },
                    { value: 'issue', label: 'GitHub Issue', icon: FileText },
                    { value: 'prd', label: 'PRD', icon: FileText },
                    { value: 'screenshot', label: 'Screenshot', icon: ImageIcon },
                  ].map((type) => (
                    <button
                      key={type.value}
                      onClick={() => setInputType(type.value as typeof inputType)}
                      className={`p-4 border-2 rounded-lg flex flex-col items-center gap-2 transition-all ${
                        inputType === type.value
                          ? 'border-black dark:border-white bg-gray-50 dark:bg-gray-700'
                          : 'border-gray-200 dark:border-gray-600 hover:border-gray-300 dark:hover:border-gray-500'
                      }`}
                    >
                      <type.icon size={24} />
                      <span className="text-sm font-medium">{type.label}</span>
                    </button>
                  ))}
                </div>
              </div>

              {/* Content Input */}
              <div className="mb-6">
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  {inputType === 'issue'
                    ? 'Paste GitHub Issue Content'
                    : inputType === 'prd'
                    ? 'Paste PRD Content'
                    : inputType === 'screenshot'
                    ? 'Describe the Screenshot'
                    : 'Describe the Task'}
                </label>
                <textarea
                  className="w-full h-64 border border-gray-200 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white p-4 rounded-lg focus:outline-none focus:ring-2 focus:ring-black/10 dark:focus:ring-white/20 resize-none font-mono text-sm"
                  placeholder={
                    inputType === 'issue'
                      ? '# Add user authentication\n\nImplement JWT-based authentication...'
                      : inputType === 'prd'
                      ? '# Product Requirements\n\n## Overview\nBuild a task management system...'
                      : inputType === 'screenshot'
                      ? 'The screenshot shows a kanban board with three columns...'
                      : 'Describe your task, feature, or project...'
                  }
                  value={content}
                  onChange={(e) => setContent(e.target.value)}
                />
              </div>

              {/* Screenshot URL */}
              {inputType === 'screenshot' && (
                <div className="mb-6">
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Screenshot URL (optional)
                  </label>
                  <input
                    type="text"
                    className="w-full border border-gray-200 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white p-3 rounded-lg focus:outline-none focus:ring-2 focus:ring-black/10 dark:focus:ring-white/20"
                    placeholder="https://example.com/screenshot.png"
                    value={imageUrl}
                    onChange={(e) => setImageUrl(e.target.value)}
                  />
                </div>
              )}
            </>
          ) : (
            /* Breakdown Result */
            <div className="space-y-6">
              {/* Epic */}
              <div className="border-2 border-blue-500 dark:border-blue-400 rounded-lg p-5 bg-blue-50 dark:bg-blue-900/20">
                <div className="flex items-start justify-between mb-3">
                  <h3 className="text-lg font-bold text-gray-900 dark:text-white">
                    Epic: {result.epic.title}
                  </h3>
                  <div className="flex gap-2">
                    <span className="px-2.5 py-1 bg-blue-500 text-white text-xs font-semibold rounded-full">
                      Priority {result.epic.priority}
                    </span>
                    <span className="px-2.5 py-1 bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300 text-xs font-semibold rounded-full">
                      ~{result.epic.estimatedHours}h
                    </span>
                  </div>
                </div>
                <p className="text-sm text-gray-700 dark:text-gray-300 mb-3">
                  {result.epic.description}
                </p>
                <div className="flex flex-wrap gap-2">
                  {result.epic.tags.map((tag) => (
                    <span
                      key={tag}
                      className="px-2 py-1 bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-300 text-xs rounded border border-gray-200 dark:border-gray-600"
                    >
                      {tag}
                    </span>
                  ))}
                </div>
              </div>

              {/* Tickets */}
              <div className="space-y-3">
                <h4 className="text-lg font-bold text-gray-900 dark:text-white">
                  Breakdown: {result.tickets.length} Tickets
                </h4>
                {result.tickets.map((ticket, index) => {
                  const isExpanded = expandedTickets.has(index);
                  return (
                    <div
                      key={index}
                      className="border border-gray-200 dark:border-gray-600 rounded-lg overflow-hidden"
                    >
                      <button
                        onClick={() => toggleTicket(index)}
                        className="w-full p-4 flex items-start justify-between hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
                      >
                        <div className="flex items-start gap-3 flex-1 text-left">
                          {isExpanded ? (
                            <ChevronDown size={20} className="mt-0.5 flex-shrink-0" />
                          ) : (
                            <ChevronRight size={20} className="mt-0.5 flex-shrink-0" />
                          )}
                          <div className="flex-1">
                            <h5 className="font-semibold text-gray-900 dark:text-white mb-1">
                              {index + 1}. {ticket.title}
                            </h5>
                            <div className="flex flex-wrap gap-2">
                              <span className="text-xs text-gray-500 dark:text-gray-400">
                                ~{ticket.estimatedHours}h
                              </span>
                              <span className="text-xs text-gray-500 dark:text-gray-400">
                                Priority {ticket.priority}
                              </span>
                              {ticket.dependencies.length > 0 && (
                                <span className="text-xs text-orange-600 dark:text-orange-400">
                                  {ticket.dependencies.length} dependencies
                                </span>
                              )}
                            </div>
                          </div>
                        </div>
                      </button>

                      {isExpanded && (
                        <div className="p-4 border-t border-gray-200 dark:border-gray-600 bg-gray-50 dark:bg-gray-800 space-y-4">
                          <div>
                            <p className="text-sm text-gray-700 dark:text-gray-300">
                              {ticket.description}
                            </p>
                          </div>

                          {/* DoD */}
                          {ticket.definitionOfDone.length > 0 && (
                            <div>
                              <h6 className="text-xs font-semibold text-gray-600 dark:text-gray-400 uppercase mb-2">
                                Definition of Done
                              </h6>
                              <ul className="space-y-1">
                                {ticket.definitionOfDone.map((dod, i) => (
                                  <li
                                    key={i}
                                    className="text-sm text-gray-700 dark:text-gray-300 flex items-start gap-2"
                                  >
                                    <span className="text-green-500 mt-0.5">✓</span>
                                    {dod}
                                  </li>
                                ))}
                              </ul>
                            </div>
                          )}

                          {/* Test Notes */}
                          {ticket.testNotes.length > 0 && (
                            <div>
                              <h6 className="text-xs font-semibold text-gray-600 dark:text-gray-400 uppercase mb-2">
                                Test Notes
                              </h6>
                              <ul className="space-y-1">
                                {ticket.testNotes.map((note, i) => (
                                  <li
                                    key={i}
                                    className="text-sm text-gray-700 dark:text-gray-300 flex items-start gap-2"
                                  >
                                    <span className="px-1.5 py-0.5 bg-blue-100 dark:bg-blue-900 text-blue-700 dark:text-blue-300 text-xs rounded">
                                      {note.type}
                                    </span>
                                    {note.description}
                                  </li>
                                ))}
                              </ul>
                            </div>
                          )}

                          {/* Risk Flags */}
                          {ticket.riskFlags.length > 0 && (
                            <div>
                              <h6 className="text-xs font-semibold text-gray-600 dark:text-gray-400 uppercase mb-2">
                                Risk Flags
                              </h6>
                              <ul className="space-y-2">
                                {ticket.riskFlags.map((risk, i) => (
                                  <li
                                    key={i}
                                    className={`p-2 rounded text-sm ${
                                      risk.level === 'critical'
                                        ? 'bg-red-100 dark:bg-red-900/30 text-red-800 dark:text-red-300'
                                        : risk.level === 'high'
                                        ? 'bg-orange-100 dark:bg-orange-900/30 text-orange-800 dark:text-orange-300'
                                        : 'bg-yellow-100 dark:bg-yellow-900/30 text-yellow-800 dark:text-yellow-300'
                                    }`}
                                  >
                                    <div className="font-semibold">{risk.description}</div>
                                    {risk.mitigation && (
                                      <div className="text-xs mt-1">
                                        Mitigation: {risk.mitigation}
                                      </div>
                                    )}
                                  </li>
                                ))}
                              </ul>
                            </div>
                          )}

                          {/* Required Skills */}
                          {ticket.requiredSkills.length > 0 && (
                            <div>
                              <h6 className="text-xs font-semibold text-gray-600 dark:text-gray-400 uppercase mb-2">
                                Required Skills
                              </h6>
                              <div className="flex flex-wrap gap-2">
                                {ticket.requiredSkills.map((skill) => (
                                  <span
                                    key={skill}
                                    className="px-2 py-1 bg-purple-100 dark:bg-purple-900/30 text-purple-700 dark:text-purple-300 text-xs rounded"
                                  >
                                    {skill}
                                  </span>
                                ))}
                              </div>
                            </div>
                          )}

                          {/* Tags */}
                          <div className="flex flex-wrap gap-2">
                            {ticket.tags.map((tag) => (
                              <span
                                key={tag}
                                className="px-2 py-1 bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300 text-xs rounded"
                              >
                                {tag}
                              </span>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-6 border-t border-gray-200 dark:border-gray-700 flex justify-end gap-3">
          {!result ? (
            <>
              <button
                onClick={handleClose}
                className="px-6 py-2.5 text-gray-600 dark:text-gray-400 hover:text-gray-800 dark:hover:text-gray-200 transition-colors font-medium"
              >
                Cancel
              </button>
              <button
                onClick={handleSubmit}
                disabled={!content.trim() || isProcessing}
                className="px-6 py-2.5 bg-black dark:bg-white text-white dark:text-black rounded-lg hover:bg-gray-800 dark:hover:bg-gray-200 transition-colors font-medium disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
              >
                {isProcessing ? (
                  <>
                    <Loader2 size={18} className="animate-spin" />
                    Processing...
                  </>
                ) : (
                  'Generate Breakdown'
                )}
              </button>
            </>
          ) : (
            <>
              <button
                onClick={() => setResult(null)}
                className="px-6 py-2.5 text-gray-600 dark:text-gray-400 hover:text-gray-800 dark:hover:text-gray-200 transition-colors font-medium"
              >
                Edit Input
              </button>
              <button
                onClick={handleAcceptBreakdown}
                className="px-6 py-2.5 bg-black dark:bg-white text-white dark:text-black rounded-lg hover:bg-gray-800 dark:hover:bg-gray-200 transition-colors font-medium"
              >
                Create {result.tickets.length} Tasks
              </button>
            </>
          )}
        </div>
      </div>
    </div>
  );
};
