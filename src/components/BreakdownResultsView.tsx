'use client';

import { useState } from 'react';
import { BreakdownResult } from '@/types/breakdown';
import { CodingAgent } from '@/types/agent';
import {
  Layers,
  Ticket,
  CheckSquare,
  AlertTriangle,
  TestTube,
  GitBranch,
  ChevronDown,
  ChevronRight,
  Clock,
  Tag
} from 'lucide-react';

interface BreakdownResultsViewProps {
  result: BreakdownResult;
  agents: CodingAgent[];
  onApprove: () => void;
  onCancel: () => void;
}

export const BreakdownResultsView = ({
  result,
  agents,
  onApprove,
  onCancel
}: BreakdownResultsViewProps) => {
  const [expandedEpics, setExpandedEpics] = useState<Set<string>>(new Set());
  const [expandedTickets, setExpandedTickets] = useState<Set<string>>(new Set());

  const toggleEpic = (epicId: string) => {
    const newExpanded = new Set(expandedEpics);
    if (newExpanded.has(epicId)) {
      newExpanded.delete(epicId);
    } else {
      newExpanded.add(epicId);
    }
    setExpandedEpics(newExpanded);
  };

  const toggleTicket = (ticketId: string) => {
    const newExpanded = new Set(expandedTickets);
    if (newExpanded.has(ticketId)) {
      newExpanded.delete(ticketId);
    } else {
      newExpanded.add(ticketId);
    }
    setExpandedTickets(newExpanded);
  };

  const getPriorityColor = (priority: number) => {
    if (priority >= 5) return 'text-red-600 dark:text-red-400';
    if (priority >= 4) return 'text-orange-600 dark:text-orange-400';
    return 'text-yellow-600 dark:text-yellow-400';
  };

  const getRiskColor = (severity: string) => {
    switch (severity) {
      case 'critical': return 'bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-300 border-red-300 dark:border-red-700';
      case 'high': return 'bg-orange-100 dark:bg-orange-900/30 text-orange-700 dark:text-orange-300 border-orange-300 dark:border-orange-700';
      case 'medium': return 'bg-yellow-100 dark:bg-yellow-900/30 text-yellow-700 dark:text-yellow-300 border-yellow-300 dark:border-yellow-700';
      default: return 'bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 border-blue-300 dark:border-blue-700';
    }
  };

  return (
    <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg overflow-hidden">
      {/* Header */}
      <div className="p-6 bg-gradient-to-r from-purple-600 to-blue-600 text-white">
        <h2 className="text-2xl font-bold mb-2">Task Breakdown Results</h2>
        <p className="text-purple-100">
          Review the generated breakdown and approve to add to your board
        </p>
        <div className="mt-4 flex gap-4 text-sm">
          <div className="flex items-center gap-2">
            <Layers size={16} />
            <span>{result.epics.length} Epics</span>
          </div>
          <div className="flex items-center gap-2">
            <Ticket size={16} />
            <span>{result.tickets.length} Tickets</span>
          </div>
          <div className="flex items-center gap-2">
            <CheckSquare size={16} />
            <span>{result.subtasks.length} Subtasks</span>
          </div>
          <div className="flex items-center gap-2">
            <GitBranch size={16} />
            <span>{result.dependencies.length} Dependencies</span>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="p-6 max-h-[600px] overflow-y-auto">
        {/* Epics */}
        {result.epics.length > 0 && (
          <div className="mb-6">
            <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-3 flex items-center gap-2">
              <Layers size={20} className="text-purple-600 dark:text-purple-400" />
              Epics
            </h3>
            <div className="space-y-3">
              {result.epics.map((epic) => (
                <div
                  key={epic.id}
                  className="border-2 border-purple-200 dark:border-purple-800 rounded-lg overflow-hidden"
                >
                  <button
                    onClick={() => toggleEpic(epic.id)}
                    className="w-full p-4 bg-purple-50 dark:bg-purple-900/20 flex items-center justify-between hover:bg-purple-100 dark:hover:bg-purple-900/30 transition-colors"
                  >
                    <div className="flex items-center gap-3">
                      {expandedEpics.has(epic.id) ? (
                        <ChevronDown size={20} />
                      ) : (
                        <ChevronRight size={20} />
                      )}
                      <span className="font-semibold text-gray-900 dark:text-white">
                        {epic.title}
                      </span>
                    </div>
                    <span className="text-xs px-2 py-1 bg-purple-200 dark:bg-purple-800 rounded">
                      {epic.tickets.length} tickets
                    </span>
                  </button>
                  {expandedEpics.has(epic.id) && (
                    <div className="p-4 bg-white dark:bg-gray-800">
                      <p className="text-sm text-gray-600 dark:text-gray-400">
                        {epic.description}
                      </p>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Tickets */}
        <div className="mb-6">
          <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-3 flex items-center gap-2">
            <Ticket size={20} className="text-blue-600 dark:text-blue-400" />
            Tickets
          </h3>
          <div className="space-y-3">
            {result.tickets.map((ticket) => {
              const ticketSubtasks = result.subtasks.filter(s => s.ticketId === ticket.id);
              const totalRisks = ticket.riskFlags.filter(r => r.severity === 'critical' || r.severity === 'high').length;

              return (
                <div
                  key={ticket.id}
                  className="border-2 border-gray-200 dark:border-gray-700 rounded-lg overflow-hidden"
                >
                  <button
                    onClick={() => toggleTicket(ticket.id)}
                    className="w-full p-4 bg-gray-50 dark:bg-gray-900 flex items-center justify-between hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
                  >
                    <div className="flex items-center gap-3 flex-1">
                      {expandedTickets.has(ticket.id) ? (
                        <ChevronDown size={20} />
                      ) : (
                        <ChevronRight size={20} />
                      )}
                      <div className="text-left flex-1">
                        <div className="flex items-center gap-2 mb-1">
                          <span className="font-mono text-xs text-gray-500 dark:text-gray-400">
                            {ticket.taskId}
                          </span>
                          <span className="font-semibold text-gray-900 dark:text-white">
                            {ticket.title}
                          </span>
                        </div>
                        <div className="flex items-center gap-3 text-xs">
                          <span className={`font-semibold ${getPriorityColor(ticket.priority)}`}>
                            P{ticket.priority}
                          </span>
                          {ticket.estimatedHours && (
                            <span className="flex items-center gap-1 text-gray-500 dark:text-gray-400">
                              <Clock size={12} />
                              {ticket.estimatedHours}h
                            </span>
                          )}
                          {ticketSubtasks.length > 0 && (
                            <span className="text-gray-500 dark:text-gray-400">
                              {ticketSubtasks.length} subtasks
                            </span>
                          )}
                          {totalRisks > 0 && (
                            <span className="flex items-center gap-1 text-red-600 dark:text-red-400">
                              <AlertTriangle size={12} />
                              {totalRisks} risks
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                    {ticket.tags.length > 0 && (
                      <div className="flex gap-1">
                        {ticket.tags.slice(0, 3).map((tag, idx) => (
                          <span
                            key={idx}
                            className="px-2 py-1 bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 text-xs rounded"
                          >
                            {tag}
                          </span>
                        ))}
                      </div>
                    )}
                  </button>

                  {expandedTickets.has(ticket.id) && (
                    <div className="p-4 bg-white dark:bg-gray-800 space-y-4">
                      {/* Description */}
                      <div>
                        <h4 className="text-sm font-semibold text-gray-900 dark:text-white mb-2">
                          Description
                        </h4>
                        <p className="text-sm text-gray-600 dark:text-gray-400">
                          {ticket.description}
                        </p>
                      </div>

                      {/* Definition of Done */}
                      {ticket.definitionOfDone.criteria.length > 0 && (
                        <div>
                          <h4 className="text-sm font-semibold text-gray-900 dark:text-white mb-2 flex items-center gap-2">
                            <CheckSquare size={16} />
                            Definition of Done
                          </h4>
                          <ul className="space-y-1">
                            {ticket.definitionOfDone.criteria.map((criteria) => (
                              <li
                                key={criteria.id}
                                className="text-sm text-gray-600 dark:text-gray-400 flex items-start gap-2"
                              >
                                <span className="text-gray-400 dark:text-gray-500">•</span>
                                {criteria.description}
                              </li>
                            ))}
                          </ul>
                        </div>
                      )}

                      {/* Test Notes */}
                      {ticket.testNotes.length > 0 && (
                        <div>
                          <h4 className="text-sm font-semibold text-gray-900 dark:text-white mb-2 flex items-center gap-2">
                            <TestTube size={16} />
                            Test Notes
                          </h4>
                          <div className="space-y-2">
                            {ticket.testNotes.map((note) => (
                              <div
                                key={note.id}
                                className="text-sm p-2 bg-gray-50 dark:bg-gray-900 rounded"
                              >
                                <div className="flex items-center gap-2 mb-1">
                                  <span className="px-2 py-0.5 bg-blue-200 dark:bg-blue-800 text-blue-800 dark:text-blue-200 text-xs rounded">
                                    {note.type}
                                  </span>
                                  <span className={`text-xs ${
                                    note.priority === 'high' ? 'text-red-600 dark:text-red-400' : 'text-gray-500 dark:text-gray-400'
                                  }`}>
                                    {note.priority} priority
                                  </span>
                                </div>
                                <p className="text-gray-600 dark:text-gray-400">{note.description}</p>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}

                      {/* Risk Flags */}
                      {ticket.riskFlags.length > 0 && (
                        <div>
                          <h4 className="text-sm font-semibold text-gray-900 dark:text-white mb-2 flex items-center gap-2">
                            <AlertTriangle size={16} />
                            Risk Flags
                          </h4>
                          <div className="space-y-2">
                            {ticket.riskFlags.map((risk) => (
                              <div
                                key={risk.id}
                                className={`p-3 rounded border ${getRiskColor(risk.severity)}`}
                              >
                                <div className="flex items-center justify-between mb-2">
                                  <span className="text-sm font-semibold uppercase">
                                    {risk.severity} - {risk.category}
                                  </span>
                                </div>
                                <p className="text-sm mb-2">{risk.description}</p>
                                {risk.mitigation && (
                                  <p className="text-xs opacity-75">
                                    <strong>Mitigation:</strong> {risk.mitigation}
                                  </p>
                                )}
                              </div>
                            ))}
                          </div>
                        </div>
                      )}

                      {/* Subtasks */}
                      {ticketSubtasks.length > 0 && (
                        <div>
                          <h4 className="text-sm font-semibold text-gray-900 dark:text-white mb-2">
                            Subtasks ({ticketSubtasks.length})
                          </h4>
                          <div className="space-y-2">
                            {ticketSubtasks.map((subtask) => (
                              <div
                                key={subtask.id}
                                className="p-3 bg-gray-50 dark:bg-gray-900 rounded border border-gray-200 dark:border-gray-700"
                              >
                                <div className="flex items-center justify-between">
                                  <span className="text-sm font-medium text-gray-900 dark:text-white">
                                    {subtask.title}
                                  </span>
                                  {subtask.estimatedHours && (
                                    <span className="text-xs text-gray-500 dark:text-gray-400 flex items-center gap-1">
                                      <Clock size={12} />
                                      {subtask.estimatedHours}h
                                    </span>
                                  )}
                                </div>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* Footer Actions */}
      <div className="p-6 border-t border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-900">
        <div className="flex justify-end gap-3">
          <button
            onClick={onCancel}
            className="px-6 py-2 text-gray-600 dark:text-gray-400 hover:text-gray-800 dark:hover:text-gray-200 transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={onApprove}
            className="px-6 py-2 bg-purple-600 hover:bg-purple-700 text-white rounded-lg transition-colors font-medium"
          >
            Approve & Add to Board
          </button>
        </div>
      </div>
    </div>
  );
};
