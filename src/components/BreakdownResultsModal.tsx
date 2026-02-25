'use client';

import { useState } from 'react';
import { X, Check, AlertTriangle, Clock, Tags, ChevronDown, ChevronRight, Network } from 'lucide-react';
import { TaskBreakdownResult, DependencyNode } from '@/types/epic';

interface BreakdownResultsModalProps {
  isOpen: boolean;
  result: TaskBreakdownResult | null;
  onClose: () => void;
  onAccept: (result: TaskBreakdownResult) => void;
}

export const BreakdownResultsModal = ({ isOpen, result, onClose, onAccept }: BreakdownResultsModalProps) => {
  const [expandedTickets, setExpandedTickets] = useState<Set<string>>(new Set());
  const [showDependencies, setShowDependencies] = useState(false);

  if (!isOpen || !result) return null;

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
    switch (priority) {
      case 5: return 'text-red-600 dark:text-red-400 bg-red-50 dark:bg-red-900/30';
      case 4: return 'text-orange-600 dark:text-orange-400 bg-orange-50 dark:bg-orange-900/30';
      case 3: return 'text-yellow-600 dark:text-yellow-400 bg-yellow-50 dark:bg-yellow-900/30';
      case 2: return 'text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-900/30';
      case 1: return 'text-gray-600 dark:text-gray-400 bg-gray-50 dark:bg-gray-800/30';
      default: return 'text-gray-600 dark:text-gray-400 bg-gray-50 dark:bg-gray-800/30';
    }
  };

  const getPriorityLabel = (priority: number) => {
    switch (priority) {
      case 5: return 'Critical';
      case 4: return 'High';
      case 3: return 'Medium';
      case 2: return 'Low';
      case 1: return 'Trivial';
      default: return 'Medium';
    }
  };

  const getRiskSeverityColor = (severity: string) => {
    switch (severity) {
      case 'critical': return 'bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-300 border-red-300 dark:border-red-700';
      case 'high': return 'bg-orange-100 dark:bg-orange-900/30 text-orange-700 dark:text-orange-300 border-orange-300 dark:border-orange-700';
      case 'medium': return 'bg-yellow-100 dark:bg-yellow-900/30 text-yellow-700 dark:text-yellow-300 border-yellow-300 dark:border-yellow-700';
      case 'low': return 'bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 border-blue-300 dark:border-blue-700';
      default: return 'bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 border-gray-300 dark:border-gray-600';
    }
  };

  const totalEstimatedHours = result.tickets.reduce((sum, t) => sum + (t.estimatedHours || 0), 0);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
      <div className="bg-white dark:bg-gray-800 rounded-xl w-full max-w-6xl shadow-2xl max-h-[90vh] flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200 dark:border-gray-700">
          <div>
            <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
              Task Breakdown Results
            </h2>
            <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
              Review and accept the generated epic, tickets, and analysis
            </p>
          </div>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
          >
            <X size={24} />
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6">
          {/* Epic Overview */}
          <div className="bg-gradient-to-br from-blue-50 to-indigo-50 dark:from-blue-900/20 dark:to-indigo-900/20 p-5 rounded-lg border border-blue-200 dark:border-blue-800">
            <div className="flex items-start justify-between mb-3">
              <h3 className="text-xl font-bold text-gray-900 dark:text-white">
                {result.epic.title}
              </h3>
              <span className={`px-3 py-1 rounded-full text-xs font-semibold ${getPriorityColor(result.epic.priority)}`}>
                {getPriorityLabel(result.epic.priority)} Priority
              </span>
            </div>
            <p className="text-sm text-gray-700 dark:text-gray-300 whitespace-pre-wrap mb-4">
              {result.epic.description.substring(0, 200)}
              {result.epic.description.length > 200 && '...'}
            </p>
            <div className="flex gap-4 text-sm">
              <div className="flex items-center gap-2 text-gray-600 dark:text-gray-400">
                <Tags size={16} />
                <span>{result.tickets.length} Tickets</span>
              </div>
              <div className="flex items-center gap-2 text-gray-600 dark:text-gray-400">
                <Clock size={16} />
                <span>~{totalEstimatedHours}h estimated</span>
              </div>
            </div>
          </div>

          {/* Dependency Graph Toggle */}
          <button
            onClick={() => setShowDependencies(!showDependencies)}
            className="w-full flex items-center justify-between p-4 bg-gray-50 dark:bg-gray-700/50 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
          >
            <div className="flex items-center gap-2">
              <Network size={20} className="text-purple-600 dark:text-purple-400" />
              <span className="font-semibold text-gray-900 dark:text-white">
                Dependency Graph
              </span>
            </div>
            {showDependencies ? <ChevronDown size={20} /> : <ChevronRight size={20} />}
          </button>

          {showDependencies && (
            <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg p-4">
              <DependencyGraphVisualization dependencies={result.dependencyGraph} />
            </div>
          )}

          {/* Tickets List */}
          <div className="space-y-3">
            <h3 className="text-lg font-bold text-gray-900 dark:text-white flex items-center gap-2">
              <Tags size={20} />
              Generated Tickets
            </h3>

            {result.tickets.map((ticket) => {
              const isExpanded = expandedTickets.has(ticket.taskId);

              return (
                <div
                  key={ticket.taskId}
                  className="bg-white dark:bg-gray-700/50 border border-gray-200 dark:border-gray-600 rounded-lg overflow-hidden"
                >
                  {/* Ticket Header */}
                  <button
                    onClick={() => toggleTicket(ticket.taskId)}
                    className="w-full p-4 flex items-start justify-between hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
                  >
                    <div className="flex-1 text-left">
                      <div className="flex items-center gap-3 mb-2">
                        <span className="text-xs font-mono text-gray-500 dark:text-gray-400">
                          {ticket.taskId}
                        </span>
                        <span className={`px-2 py-0.5 rounded text-xs font-semibold ${getPriorityColor(ticket.priority)}`}>
                          P{ticket.priority}
                        </span>
                        {ticket.estimatedHours && (
                          <span className="text-xs text-gray-500 dark:text-gray-400 flex items-center gap-1">
                            <Clock size={12} />
                            {ticket.estimatedHours}h
                          </span>
                        )}
                      </div>
                      <h4 className="font-semibold text-gray-900 dark:text-white mb-1">
                        {ticket.title}
                      </h4>
                      <div className="flex flex-wrap gap-1 mt-2">
                        {ticket.tags.map((tag, idx) => (
                          <span
                            key={idx}
                            className="px-2 py-0.5 bg-gray-100 dark:bg-gray-600 text-gray-700 dark:text-gray-300 rounded text-xs"
                          >
                            {tag}
                          </span>
                        ))}
                      </div>
                    </div>
                    {isExpanded ? <ChevronDown size={20} /> : <ChevronRight size={20} />}
                  </button>

                  {/* Ticket Details (Expanded) */}
                  {isExpanded && (
                    <div className="border-t border-gray-200 dark:border-gray-600 p-4 space-y-4 bg-gray-50 dark:bg-gray-800/50">
                      {/* Description */}
                      <div>
                        <h5 className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase mb-2">
                          Description
                        </h5>
                        <p className="text-sm text-gray-700 dark:text-gray-300 whitespace-pre-wrap">
                          {ticket.description}
                        </p>
                      </div>

                      {/* Definition of Done */}
                      <div>
                        <h5 className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase mb-2">
                          Definition of Done
                        </h5>
                        <ul className="space-y-1">
                          {ticket.definitionOfDone.map((item, idx) => (
                            <li key={idx} className="flex items-start gap-2 text-sm text-gray-700 dark:text-gray-300">
                              <Check size={16} className="text-green-600 dark:text-green-400 flex-shrink-0 mt-0.5" />
                              <span>{item}</span>
                            </li>
                          ))}
                        </ul>
                      </div>

                      {/* Test Notes */}
                      {ticket.testNotes && (
                        <div>
                          <h5 className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase mb-2">
                            Test Notes
                          </h5>
                          <p className="text-sm text-gray-700 dark:text-gray-300 whitespace-pre-wrap">
                            {ticket.testNotes}
                          </p>
                        </div>
                      )}

                      {/* Risk Flags */}
                      {ticket.riskFlags.length > 0 && (
                        <div>
                          <h5 className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase mb-2">
                            Risk Flags
                          </h5>
                          <div className="space-y-2">
                            {ticket.riskFlags.map((risk) => (
                              <div
                                key={risk.id}
                                className={`p-3 rounded-lg border ${getRiskSeverityColor(risk.severity)}`}
                              >
                                <div className="flex items-start gap-2 mb-1">
                                  <AlertTriangle size={16} className="flex-shrink-0 mt-0.5" />
                                  <div className="flex-1">
                                    <div className="flex items-center gap-2 mb-1">
                                      <span className="text-xs font-semibold uppercase">{risk.type}</span>
                                      <span className="text-xs">({risk.severity})</span>
                                    </div>
                                    <p className="text-sm">{risk.description}</p>
                                    {risk.mitigationPlan && (
                                      <p className="text-xs mt-2 opacity-90">
                                        <strong>Mitigation:</strong> {risk.mitigationPlan}
                                      </p>
                                    )}
                                  </div>
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

        {/* Footer */}
        <div className="flex justify-between items-center p-6 border-t border-gray-200 dark:border-gray-700">
          <p className="text-sm text-gray-500 dark:text-gray-400">
            {result.tickets.length} tickets will be created with full DoD, test notes, and risk analysis
          </p>
          <div className="flex gap-3">
            <button
              onClick={onClose}
              className="px-5 py-2 text-gray-600 dark:text-gray-400 hover:text-gray-800 dark:hover:text-gray-200 transition-colors"
            >
              Cancel
            </button>
            <button
              onClick={() => onAccept(result)}
              className="px-5 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg transition-colors font-medium flex items-center gap-2"
            >
              <Check size={16} />
              Accept & Create Tasks
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

const DependencyGraphVisualization = ({ dependencies }: { dependencies: DependencyNode[] }) => {
  if (dependencies.length === 0) {
    return (
      <p className="text-sm text-gray-500 dark:text-gray-400 text-center py-4">
        No dependencies detected
      </p>
    );
  }

  return (
    <div className="space-y-2">
      {dependencies.map((node) => (
        <div
          key={node.ticketId}
          className={`p-3 rounded-lg border-l-4 ${
            node.criticalPath
              ? 'bg-red-50 dark:bg-red-900/20 border-red-500'
              : 'bg-gray-50 dark:bg-gray-700 border-gray-300 dark:border-gray-600'
          }`}
        >
          <div className="flex items-center gap-2 mb-1">
            <span className="text-xs font-mono text-gray-600 dark:text-gray-400">
              {node.ticketId}
            </span>
            {node.criticalPath && (
              <span className="px-2 py-0.5 bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-300 rounded text-xs font-semibold">
                Critical Path
              </span>
            )}
          </div>
          <p className="text-sm font-medium text-gray-900 dark:text-white mb-2">
            {node.title}
          </p>
          {node.dependsOn.length > 0 && (
            <p className="text-xs text-gray-600 dark:text-gray-400">
              Depends on: {node.dependsOn.join(', ')}
            </p>
          )}
          {node.blockedBy.length > 0 && (
            <p className="text-xs text-gray-600 dark:text-gray-400">
              Blocks: {node.blockedBy.join(', ')}
            </p>
          )}
        </div>
      ))}
    </div>
  );
};
