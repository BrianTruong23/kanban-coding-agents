'use client';

import { Epic, Ticket, Subtask, TaskDependency } from '@/types/breakdown';
import { CodingAgent } from '@/types/agent';
import { AlertCircle, Clock, CheckCircle2, Circle, ChevronDown, ChevronRight } from 'lucide-react';
import { useState } from 'react';

interface TaskBreakdownViewProps {
  epics: Epic[];
  tickets: Ticket[];
  subtasks: Subtask[];
  dependencies: TaskDependency[];
  agents: CodingAgent[];
  onTicketClick?: (ticket: Ticket) => void;
  onEpicClick?: (epic: Epic) => void;
}

const getRiskColor = (risk: string) => {
  switch (risk) {
    case 'critical': return 'bg-red-100 text-red-800 border-red-300';
    case 'high': return 'bg-orange-100 text-orange-800 border-orange-300';
    case 'medium': return 'bg-yellow-100 text-yellow-800 border-yellow-300';
    default: return 'bg-green-100 text-green-800 border-green-300';
  }
};

const getStatusIcon = (status: string) => {
  switch (status) {
    case 'done': return <CheckCircle2 className="w-4 h-4 text-green-600" />;
    case 'in-progress': return <Clock className="w-4 h-4 text-blue-600" />;
    case 'review': return <AlertCircle className="w-4 h-4 text-yellow-600" />;
    default: return <Circle className="w-4 h-4 text-gray-400" />;
  }
};

export default function TaskBreakdownView({
  epics,
  tickets,
  subtasks,
  dependencies,
  agents,
  onTicketClick,
  onEpicClick,
}: TaskBreakdownViewProps) {
  const [expandedEpics, setExpandedEpics] = useState<Set<string>>(new Set());
  const [expandedTickets, setExpandedTickets] = useState<Set<string>>(new Set());

  const toggleEpic = (epicId: string) => {
    setExpandedEpics(prev => {
      const next = new Set(prev);
      if (next.has(epicId)) {
        next.delete(epicId);
      } else {
        next.add(epicId);
      }
      return next;
    });
  };

  const toggleTicket = (ticketId: string) => {
    setExpandedTickets(prev => {
      const next = new Set(prev);
      if (next.has(ticketId)) {
        next.delete(ticketId);
      } else {
        next.add(ticketId);
      }
      return next;
    });
  };

  const getTicketsForEpic = (epicId: string) => {
    return tickets.filter(t => t.epicId === epicId);
  };

  const getSubtasksForTicket = (ticketId: string) => {
    return subtasks.filter(s => s.ticketId === ticketId);
  };

  const getAgent = (agentId?: string) => {
    return agents.find(a => a.id === agentId);
  };

  const getDependenciesForTask = (taskId: string) => {
    return dependencies.filter(d => d.sourceId === taskId || d.targetId === taskId);
  };

  const orphanedTickets = tickets.filter(t => !t.epicId);

  return (
    <div className="space-y-4">
      {/* Epics */}
      {epics.map(epic => {
        const epicTickets = getTicketsForEpic(epic.id);
        const isExpanded = expandedEpics.has(epic.id);
        const totalEffort = epicTickets.reduce((sum, t) => sum + t.estimatedEffort, 0);
        const completedTickets = epicTickets.filter(t => t.status === 'done').length;

        return (
          <div key={epic.id} className="border border-gray-200 dark:border-gray-700 rounded-lg overflow-hidden">
            {/* Epic Header */}
            <div
              className="bg-gradient-to-r from-purple-50 to-blue-50 dark:from-purple-900/20 dark:to-blue-900/20 p-4 cursor-pointer"
              onClick={() => toggleEpic(epic.id)}
            >
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <div className="flex items-center gap-2">
                    <button onClick={(e) => { e.stopPropagation(); toggleEpic(epic.id); }}>
                      {isExpanded ? <ChevronDown className="w-5 h-5" /> : <ChevronRight className="w-5 h-5" />}
                    </button>
                    {getStatusIcon(epic.status)}
                    <h3 className="text-lg font-semibold">{epic.title}</h3>
                    <span className={`px-2 py-1 rounded text-xs font-medium ${getRiskColor(epic.riskLevel)}`}>
                      {epic.riskLevel.toUpperCase()}
                    </span>
                  </div>
                  <p className="text-sm text-gray-600 dark:text-gray-400 mt-2 ml-12">{epic.description}</p>
                  <div className="flex items-center gap-4 mt-2 ml-12 text-sm text-gray-600 dark:text-gray-400">
                    <span>📊 {completedTickets}/{epicTickets.length} tickets</span>
                    <span>⏱️ {totalEffort}h estimated</span>
                    <span>🎯 Status: {epic.status}</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Epic Tickets */}
            {isExpanded && (
              <div className="bg-white dark:bg-gray-800 p-4 space-y-2">
                {epicTickets.length === 0 ? (
                  <p className="text-sm text-gray-500 italic">No tickets in this epic yet</p>
                ) : (
                  epicTickets.map(ticket => {
                    const ticketSubtasks = getSubtasksForTicket(ticket.id);
                    const isTicketExpanded = expandedTickets.has(ticket.id);
                    const agent = getAgent(ticket.assignedAgentId);
                    const ticketDeps = getDependenciesForTask(ticket.id);

                    return (
                      <div key={ticket.id} className="border border-gray-200 dark:border-gray-600 rounded-md overflow-hidden">
                        {/* Ticket Header */}
                        <div
                          className="bg-gray-50 dark:bg-gray-700 p-3 cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-600"
                          onClick={() => toggleTicket(ticket.id)}
                        >
                          <div className="flex items-start gap-2">
                            <button onClick={(e) => { e.stopPropagation(); toggleTicket(ticket.id); }}>
                              {isTicketExpanded ? <ChevronDown className="w-4 h-4" /> : <ChevronRight className="w-4 h-4" />}
                            </button>
                            {getStatusIcon(ticket.status)}
                            <div className="flex-1">
                              <div className="flex items-center gap-2">
                                <span className="font-mono text-sm font-semibold text-blue-600 dark:text-blue-400">
                                  {ticket.ticketId}
                                </span>
                                <span className="font-medium">{ticket.title}</span>
                                <span className={`px-2 py-0.5 rounded text-xs ${getRiskColor(ticket.riskLevel)}`}>
                                  {ticket.riskLevel}
                                </span>
                              </div>
                              <div className="flex items-center gap-3 mt-1 text-xs text-gray-600 dark:text-gray-400">
                                <span>⏱️ {ticket.estimatedEffort}h</span>
                                {ticket.requiredSkills.length > 0 && (
                                  <span>🛠️ {ticket.requiredSkills.join(', ')}</span>
                                )}
                                {agent && (
                                  <span>👤 {agent.name}</span>
                                )}
                                {ticketDeps.length > 0 && (
                                  <span>🔗 {ticketDeps.length} dependencies</span>
                                )}
                              </div>
                            </div>
                          </div>
                        </div>

                        {/* Ticket Details */}
                        {isTicketExpanded && (
                          <div className="p-3 bg-white dark:bg-gray-800 space-y-3">
                            <p className="text-sm text-gray-700 dark:text-gray-300">{ticket.description}</p>

                            {/* Definition of Done */}
                            {ticket.definitionOfDone.length > 0 && (
                              <div>
                                <h5 className="text-xs font-semibold text-gray-700 dark:text-gray-300 mb-1">
                                  Definition of Done:
                                </h5>
                                <ul className="list-disc list-inside text-sm text-gray-600 dark:text-gray-400 space-y-1">
                                  {ticket.definitionOfDone.map((dod, i) => (
                                    <li key={i}>{dod}</li>
                                  ))}
                                </ul>
                              </div>
                            )}

                            {/* Test Notes */}
                            {ticket.testNotes.length > 0 && (
                              <div>
                                <h5 className="text-xs font-semibold text-gray-700 dark:text-gray-300 mb-1">
                                  Test Notes:
                                </h5>
                                <ul className="list-disc list-inside text-sm text-gray-600 dark:text-gray-400 space-y-1">
                                  {ticket.testNotes.map((note, i) => (
                                    <li key={i}>{note}</li>
                                  ))}
                                </ul>
                              </div>
                            )}

                            {/* Subtasks */}
                            {ticketSubtasks.length > 0 && (
                              <div>
                                <h5 className="text-xs font-semibold text-gray-700 dark:text-gray-300 mb-2">
                                  Subtasks:
                                </h5>
                                <div className="space-y-1">
                                  {ticketSubtasks.map(subtask => {
                                    const subAgent = getAgent(subtask.assignedAgentId);
                                    return (
                                      <div
                                        key={subtask.id}
                                        className="flex items-center gap-2 text-sm p-2 bg-gray-50 dark:bg-gray-700 rounded"
                                      >
                                        <input
                                          type="checkbox"
                                          checked={subtask.completed}
                                          readOnly
                                          className="w-4 h-4"
                                        />
                                        <span className={subtask.completed ? 'line-through text-gray-500' : ''}>
                                          {subtask.title}
                                        </span>
                                        <span className="text-xs text-gray-500">({subtask.estimatedEffort}h)</span>
                                        {subAgent && (
                                          <span className="text-xs text-gray-500">- {subAgent.name}</span>
                                        )}
                                      </div>
                                    );
                                  })}
                                </div>
                              </div>
                            )}

                            {/* Dependencies */}
                            {ticketDeps.length > 0 && (
                              <div>
                                <h5 className="text-xs font-semibold text-gray-700 dark:text-gray-300 mb-1">
                                  Dependencies:
                                </h5>
                                <div className="text-xs text-gray-600 dark:text-gray-400 space-y-1">
                                  {ticketDeps.map(dep => (
                                    <div key={dep.id}>
                                      {dep.sourceId === ticket.id ? (
                                        <span>➡️ {dep.dependencyType} {dep.targetType} {dep.targetId}</span>
                                      ) : (
                                        <span>⬅️ {dep.dependencyType} by {dep.sourceType} {dep.sourceId}</span>
                                      )}
                                    </div>
                                  ))}
                                </div>
                              </div>
                            )}
                          </div>
                        )}
                      </div>
                    );
                  })
                )}
              </div>
            )}
          </div>
        );
      })}

      {/* Orphaned Tickets (not assigned to any epic) */}
      {orphanedTickets.length > 0 && (
        <div className="border border-gray-200 dark:border-gray-700 rounded-lg overflow-hidden">
          <div className="bg-gray-100 dark:bg-gray-700 p-4">
            <h3 className="text-lg font-semibold">Standalone Tickets</h3>
            <p className="text-sm text-gray-600 dark:text-gray-400">Tickets not assigned to any epic</p>
          </div>
          <div className="bg-white dark:bg-gray-800 p-4 space-y-2">
            {orphanedTickets.map(ticket => {
              const agent = getAgent(ticket.assignedAgentId);
              return (
                <div
                  key={ticket.id}
                  className="border border-gray-200 dark:border-gray-600 rounded p-3 hover:bg-gray-50 dark:hover:bg-gray-700 cursor-pointer"
                  onClick={() => onTicketClick?.(ticket)}
                >
                  <div className="flex items-center gap-2">
                    {getStatusIcon(ticket.status)}
                    <span className="font-mono text-sm font-semibold text-blue-600 dark:text-blue-400">
                      {ticket.ticketId}
                    </span>
                    <span className="font-medium">{ticket.title}</span>
                    <span className={`px-2 py-0.5 rounded text-xs ${getRiskColor(ticket.riskLevel)}`}>
                      {ticket.riskLevel}
                    </span>
                  </div>
                  <div className="flex items-center gap-3 mt-2 text-xs text-gray-600 dark:text-gray-400">
                    <span>⏱️ {ticket.estimatedEffort}h</span>
                    {ticket.requiredSkills.length > 0 && (
                      <span>🛠️ {ticket.requiredSkills.join(', ')}</span>
                    )}
                    {agent && <span>👤 {agent.name}</span>}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
