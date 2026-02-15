'use client';

import { useState } from 'react';
import { TaskBreakdownEngine } from '@/lib/taskBreakdown';
import { TaskBreakdown, Epic, Ticket, Subtask, RiskLevel } from '@/types/breakdown';
import { AgentRoster, AssignmentScore } from '@/types/agentRoster';
import { AgentOrchestrator } from '@/lib/agentOrchestration';
import {
  FileText,
  Image,
  Type,
  Zap,
  AlertTriangle,
  CheckCircle,
  Clock,
  Users,
  ChevronDown,
  ChevronRight,
  Sparkles,
} from 'lucide-react';

interface TaskBreakdownPanelProps {
  agents: AgentRoster[];
  onImportBreakdown?: (breakdown: TaskBreakdown) => void;
}

export const TaskBreakdownPanel = ({ agents, onImportBreakdown }: TaskBreakdownPanelProps) => {
  const [inputType, setInputType] = useState<'issue' | 'prd' | 'screenshot' | 'text'>('text');
  const [inputContent, setInputContent] = useState('');
  const [breakdown, setBreakdown] = useState<TaskBreakdown | null>(null);
  const [expandedEpics, setExpandedEpics] = useState<Set<string>>(new Set());
  const [expandedTickets, setExpandedTickets] = useState<Set<string>>(new Set());
  const [assignmentScores, setAssignmentScores] = useState<Record<string, AssignmentScore[]>>({});

  const handleBreakdown = () => {
    if (!inputContent.trim()) return;

    const result = TaskBreakdownEngine.breakdown({
      type: inputType,
      content: inputContent,
    });

    setBreakdown(result);

    // Calculate auto-assignment scores for all tickets and subtasks
    const scores: Record<string, AssignmentScore[]> = {};

    result.tickets.forEach(ticket => {
      scores[ticket.id] = AgentOrchestrator.calculateAssignmentScores(ticket, agents);
    });

    result.subtasks.forEach(subtask => {
      scores[subtask.id] = AgentOrchestrator.calculateAssignmentScores(subtask, agents);
    });

    setAssignmentScores(scores);
  };

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

  const getRiskColor = (level: RiskLevel) => {
    switch (level) {
      case 'critical': return 'text-red-600 dark:text-red-400 bg-red-50 dark:bg-red-900/20';
      case 'high': return 'text-orange-600 dark:text-orange-400 bg-orange-50 dark:bg-orange-900/20';
      case 'medium': return 'text-yellow-600 dark:text-yellow-400 bg-yellow-50 dark:bg-yellow-900/20';
      case 'low': return 'text-green-600 dark:text-green-400 bg-green-50 dark:bg-green-900/20';
    }
  };

  const getPriorityLabel = (priority: number) => {
    switch (priority) {
      case 5: return 'Critical';
      case 4: return 'High';
      case 3: return 'Medium';
      case 2: return 'Low';
      case 1: return 'Very Low';
      default: return 'Medium';
    }
  };

  const exampleText = `## User Authentication System
Implement a complete user authentication system with login, signup, and password reset functionality.

- Email/password authentication with validation
- Social login integration (Google, GitHub)
- Password reset flow with email verification
- Session management and security
- User profile management

## Dashboard Analytics
Create an analytics dashboard with real-time data visualization.

- Data aggregation from multiple sources
- Interactive charts and graphs
- Export functionality (PDF, CSV)
- Customizable widgets
- Performance optimization for large datasets`;

  return (
    <div className="flex flex-col h-full bg-gray-50 dark:bg-gray-900 overflow-hidden">
      <div className="p-6 border-b border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800">
        <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
          Task Breakdown & Orchestration
        </h2>
        <p className="text-sm text-gray-600 dark:text-gray-400">
          Break down issues, PRDs, or requirements into epics, tickets, and subtasks with auto-assignment
        </p>
      </div>

      <div className="flex-1 overflow-y-auto p-6">
        {/* Input Section */}
        <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-4 mb-6">
          <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-4">Input</h3>

          <div className="flex gap-2 mb-4">
            <button
              onClick={() => setInputType('text')}
              className={`flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                inputType === 'text'
                  ? 'bg-black dark:bg-white text-white dark:text-black'
                  : 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600'
              }`}
            >
              <Type size={16} />
              Text
            </button>
            <button
              onClick={() => setInputType('issue')}
              className={`flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                inputType === 'issue'
                  ? 'bg-black dark:bg-white text-white dark:text-black'
                  : 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600'
              }`}
            >
              <FileText size={16} />
              GitHub Issue
            </button>
            <button
              onClick={() => setInputType('prd')}
              className={`flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                inputType === 'prd'
                  ? 'bg-black dark:bg-white text-white dark:text-black'
                  : 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600'
              }`}
            >
              <FileText size={16} />
              PRD
            </button>
            <button
              onClick={() => setInputType('screenshot')}
              className={`flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                inputType === 'screenshot'
                  ? 'bg-black dark:bg-white text-white dark:text-black'
                  : 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600'
              }`}
            >
              <Image size={16} />
              Screenshot
            </button>
          </div>

          <textarea
            className="w-full border border-gray-200 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white p-3 rounded-lg h-48 focus:outline-none focus:ring-2 focus:ring-black/10 dark:focus:ring-white/20 resize-none font-mono text-sm"
            placeholder={`Paste your ${inputType} content here...\n\nExample:\n${exampleText}`}
            value={inputContent}
            onChange={e => setInputContent(e.target.value)}
          />

          <div className="flex justify-end mt-4">
            <button
              onClick={handleBreakdown}
              disabled={!inputContent.trim()}
              className="flex items-center gap-2 bg-black dark:bg-white text-white dark:text-black px-4 py-2 rounded-lg font-medium hover:bg-gray-800 dark:hover:bg-gray-200 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <Zap size={16} />
              Generate Breakdown
            </button>
          </div>
        </div>

        {/* Breakdown Results */}
        {breakdown && (
          <div className="space-y-6">
            {/* Summary Stats */}
            <div className="grid grid-cols-4 gap-4">
              <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-4">
                <div className="text-2xl font-bold text-gray-900 dark:text-white">
                  {breakdown.epics.length}
                </div>
                <div className="text-sm text-gray-600 dark:text-gray-400">Epics</div>
              </div>
              <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-4">
                <div className="text-2xl font-bold text-gray-900 dark:text-white">
                  {breakdown.tickets.length}
                </div>
                <div className="text-sm text-gray-600 dark:text-gray-400">Tickets</div>
              </div>
              <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-4">
                <div className="text-2xl font-bold text-gray-900 dark:text-white">
                  {breakdown.subtasks.length}
                </div>
                <div className="text-sm text-gray-600 dark:text-gray-400">Subtasks</div>
              </div>
              <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-4">
                <div className="text-2xl font-bold text-gray-900 dark:text-white">
                  {breakdown.metadata.estimatedTotalEffort}h
                </div>
                <div className="text-sm text-gray-600 dark:text-gray-400">Est. Effort</div>
              </div>
            </div>

            {/* Epics, Tickets, Subtasks */}
            <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-4">
              <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-4">
                Breakdown Structure
              </h3>

              <div className="space-y-2">
                {breakdown.epics.map(epic => (
                  <div key={epic.id} className="border border-gray-200 dark:border-gray-700 rounded-lg">
                    <div
                      className="flex items-center justify-between p-3 cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-700/50"
                      onClick={() => toggleEpic(epic.id)}
                    >
                      <div className="flex items-center gap-2">
                        {expandedEpics.has(epic.id) ? (
                          <ChevronDown size={16} className="text-gray-400" />
                        ) : (
                          <ChevronRight size={16} className="text-gray-400" />
                        )}
                        <span className="text-xs font-semibold text-purple-600 dark:text-purple-400">
                          EPIC
                        </span>
                        <span className="font-medium text-gray-900 dark:text-white">
                          {epic.title}
                        </span>
                      </div>
                      <div className="flex items-center gap-3 text-xs text-gray-600 dark:text-gray-400">
                        <span className="font-medium">P{epic.priority}</span>
                        <span>{epic.tickets.length} tickets</span>
                      </div>
                    </div>

                    {expandedEpics.has(epic.id) && (
                      <div className="border-t border-gray-200 dark:border-gray-700 p-3 pl-8 space-y-2">
                        {breakdown.tickets
                          .filter(t => t.epicId === epic.id)
                          .map(ticket => (
                            <div
                              key={ticket.id}
                              className="border border-gray-200 dark:border-gray-700 rounded-lg"
                            >
                              <div
                                className="flex items-center justify-between p-3 cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-700/50"
                                onClick={() => toggleTicket(ticket.id)}
                              >
                                <div className="flex items-center gap-2">
                                  {expandedTickets.has(ticket.id) ? (
                                    <ChevronDown size={16} className="text-gray-400" />
                                  ) : (
                                    <ChevronRight size={16} className="text-gray-400" />
                                  )}
                                  <span className="text-xs font-semibold text-blue-600 dark:text-blue-400">
                                    TICKET
                                  </span>
                                  <span className="font-medium text-gray-900 dark:text-white">
                                    {ticket.title}
                                  </span>
                                  {ticket.riskFlags.length > 0 && (
                                    <AlertTriangle
                                      size={14}
                                      className="text-orange-500"
                                    />
                                  )}
                                </div>
                                <div className="flex items-center gap-3 text-xs text-gray-600 dark:text-gray-400">
                                  <span className="font-medium">P{ticket.priority}</span>
                                  <span className="flex items-center gap-1">
                                    <Clock size={12} />
                                    {ticket.estimatedEffort}h
                                  </span>
                                </div>
                              </div>

                              {expandedTickets.has(ticket.id) && (
                                <div className="border-t border-gray-200 dark:border-gray-700 p-3 space-y-3">
                                  {/* Description */}
                                  <div className="text-sm text-gray-700 dark:text-gray-300">
                                    {ticket.description}
                                  </div>

                                  {/* Risk Flags */}
                                  {ticket.riskFlags.length > 0 && (
                                    <div>
                                      <div className="text-xs font-semibold text-gray-700 dark:text-gray-300 mb-1">
                                        Risk Flags
                                      </div>
                                      <div className="space-y-1">
                                        {ticket.riskFlags.map(risk => (
                                          <div
                                            key={risk.id}
                                            className={`text-xs px-2 py-1 rounded ${getRiskColor(risk.level)}`}
                                          >
                                            <span className="font-semibold uppercase">
                                              {risk.level}:
                                            </span>{' '}
                                            {risk.description}
                                          </div>
                                        ))}
                                      </div>
                                    </div>
                                  )}

                                  {/* Definition of Done */}
                                  <div>
                                    <div className="text-xs font-semibold text-gray-700 dark:text-gray-300 mb-1">
                                      Definition of Done
                                    </div>
                                    <ul className="space-y-1">
                                      {ticket.definitionOfDone.map((item, idx) => (
                                        <li
                                          key={idx}
                                          className="text-xs text-gray-600 dark:text-gray-400 flex items-start gap-2"
                                        >
                                          <CheckCircle size={12} className="mt-0.5 flex-shrink-0" />
                                          <span>{item}</span>
                                        </li>
                                      ))}
                                    </ul>
                                  </div>

                                  {/* Test Notes */}
                                  <div>
                                    <div className="text-xs font-semibold text-gray-700 dark:text-gray-300 mb-1">
                                      Test Notes
                                    </div>
                                    <ul className="space-y-1">
                                      {ticket.testNotes.map((note, idx) => (
                                        <li
                                          key={idx}
                                          className="text-xs text-gray-600 dark:text-gray-400"
                                        >
                                          • {note}
                                        </li>
                                      ))}
                                    </ul>
                                  </div>

                                  {/* Recommended Agent */}
                                  {assignmentScores[ticket.id]?.[0] && (
                                    <div className="border-t border-gray-200 dark:border-gray-700 pt-3">
                                      <div className="flex items-center gap-2 text-xs font-semibold text-gray-700 dark:text-gray-300 mb-2">
                                        <Sparkles size={12} />
                                        Recommended Agent
                                      </div>
                                      <div className="text-xs bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded p-2">
                                        <div className="font-semibold text-blue-900 dark:text-blue-100">
                                          {agents.find(a => a.id === assignmentScores[ticket.id][0].agentId)?.name}
                                          {' '}
                                          ({assignmentScores[ticket.id][0].score}% match)
                                        </div>
                                        <div className="text-blue-700 dark:text-blue-300 mt-1">
                                          {assignmentScores[ticket.id][0].reasons.join(', ')}
                                        </div>
                                      </div>
                                    </div>
                                  )}

                                  {/* Subtasks */}
                                  {ticket.subtasks.length > 0 && (
                                    <div className="border-t border-gray-200 dark:border-gray-700 pt-3">
                                      <div className="text-xs font-semibold text-gray-700 dark:text-gray-300 mb-2">
                                        Subtasks
                                      </div>
                                      <div className="space-y-2">
                                        {breakdown.subtasks
                                          .filter(s => ticket.subtasks.includes(s.id))
                                          .map(subtask => (
                                            <div
                                              key={subtask.id}
                                              className="bg-gray-50 dark:bg-gray-700 rounded p-2 text-xs"
                                            >
                                              <div className="flex items-center justify-between mb-1">
                                                <span className="font-medium text-gray-900 dark:text-white">
                                                  {subtask.title}
                                                </span>
                                                <span className="text-gray-600 dark:text-gray-400 flex items-center gap-1">
                                                  <Clock size={10} />
                                                  {subtask.estimatedEffort}h
                                                </span>
                                              </div>
                                              {assignmentScores[subtask.id]?.[0] && (
                                                <div className="text-gray-600 dark:text-gray-400">
                                                  Suggested:{' '}
                                                  {agents.find(a => a.id === assignmentScores[subtask.id][0].agentId)?.name}
                                                </div>
                                              )}
                                            </div>
                                          ))}
                                      </div>
                                    </div>
                                  )}
                                </div>
                              )}
                            </div>
                          ))}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>

            {/* Actions */}
            {onImportBreakdown && (
              <div className="flex justify-end">
                <button
                  onClick={() => onImportBreakdown(breakdown)}
                  className="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-lg font-medium transition-colors"
                >
                  Import to Kanban Board
                </button>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};
