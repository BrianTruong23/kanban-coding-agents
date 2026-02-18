'use client';

import { useState } from 'react';
import { Epic, Ticket, Subtask } from '@/types/orchestration';
import { CodingAgent } from '@/types/agent';
import { ChevronDown, ChevronRight, Circle, CheckCircle2, AlertTriangle, Clock, User } from 'lucide-react';

interface TaskHierarchyProps {
  epics: Epic[];
  tickets: Ticket[];
  subtasks: Subtask[];
  agents: CodingAgent[];
  onEpicClick?: (epic: Epic) => void;
  onTicketClick?: (ticket: Ticket) => void;
  onSubtaskClick?: (subtask: Subtask) => void;
}

/**
 * Task Hierarchy Component
 *
 * Displays tasks in a hierarchical tree structure:
 * Epic → Tickets → Subtasks
 *
 * Features:
 * - Collapsible sections
 * - Status indicators
 * - Priority badges
 * - Agent assignments
 * - Progress tracking
 */
export const TaskHierarchy = ({
  epics,
  tickets,
  subtasks,
  agents,
  onEpicClick,
  onTicketClick,
  onSubtaskClick,
}: TaskHierarchyProps) => {
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

  const getStatusIcon = (status: string, size = 16) => {
    switch (status) {
      case 'done':
        return <CheckCircle2 size={size} className="text-green-500" />;
      case 'in-progress':
        return <Clock size={size} className="text-blue-500" />;
      case 'review':
        return <Circle size={size} className="text-purple-500" />;
      default:
        return <Circle size={size} className="text-gray-400" />;
    }
  };

  const getPriorityBadge = (priority: number) => {
    const colors = [
      'bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-400',
      'bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400',
      'bg-yellow-100 dark:bg-yellow-900/30 text-yellow-600 dark:text-yellow-400',
      'bg-orange-100 dark:bg-orange-900/30 text-orange-600 dark:text-orange-400',
      'bg-red-100 dark:bg-red-900/30 text-red-600 dark:text-red-400',
    ];

    const labels = ['Low', 'Medium', 'Medium', 'High', 'Critical'];

    return (
      <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${colors[priority - 1]}`}>
        P{priority} - {labels[priority - 1]}
      </span>
    );
  };

  const getAgent = (agentId?: string) => {
    if (!agentId) return null;
    return agents.find(a => a.id === agentId);
  };

  const calculateProgress = (items: { status: string }[]) => {
    if (items.length === 0) return 0;
    const completed = items.filter(i => i.status === 'done').length;
    return Math.round((completed / items.length) * 100);
  };

  // Organize tickets by epic
  const ticketsByEpic = tickets.reduce((acc, ticket) => {
    const key = ticket.epicId || 'unassigned';
    if (!acc[key]) acc[key] = [];
    acc[key].push(ticket);
    return acc;
  }, {} as Record<string, Ticket[]>);

  // Organize subtasks by ticket
  const subtasksByTicket = subtasks.reduce((acc, subtask) => {
    if (!acc[subtask.ticketId]) acc[subtask.ticketId] = [];
    acc[subtask.ticketId].push(subtask);
    return acc;
  }, {} as Record<string, Subtask[]>);

  // Orphaned tickets (not linked to any epic)
  const orphanedTickets = ticketsByEpic['unassigned'] || [];

  return (
    <div className="space-y-2">
      {/* Epics with their tickets */}
      {epics.map(epic => {
        const epicTickets = ticketsByEpic[epic.id] || [];
        const allSubtasksInEpic = epicTickets.flatMap(t => subtasksByTicket[t.id] || []);
        const allTasksInEpic = [...epicTickets, ...allSubtasksInEpic];
        const progress = calculateProgress(allTasksInEpic);
        const isExpanded = expandedEpics.has(epic.id);

        return (
          <div key={epic.id} className="border border-gray-200 dark:border-gray-700 rounded-lg overflow-hidden bg-white dark:bg-gray-800">
            {/* Epic Header */}
            <div
              className="p-4 cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-750 flex items-center justify-between"
              onClick={() => toggleEpic(epic.id)}
            >
              <div className="flex items-center gap-3 flex-1">
                <button className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300">
                  {isExpanded ? <ChevronDown size={20} /> : <ChevronRight size={20} />}
                </button>
                {getStatusIcon(epic.status, 20)}
                <div className="flex-1" onClick={(e) => { e.stopPropagation(); onEpicClick?.(epic); }}>
                  <div className="flex items-center gap-2">
                    <span className="font-mono text-sm text-gray-500 dark:text-gray-400">{epic.epicId}</span>
                    <h3 className="font-semibold text-gray-900 dark:text-white">{epic.title}</h3>
                  </div>
                  {epic.description && (
                    <p className="text-sm text-gray-600 dark:text-gray-400 mt-1 line-clamp-1">{epic.description}</p>
                  )}
                </div>
                <div className="flex items-center gap-2">
                  {getPriorityBadge(epic.priority)}
                  <div className="text-xs text-gray-500 dark:text-gray-400">
                    {epicTickets.length} {epicTickets.length === 1 ? 'ticket' : 'tickets'}
                  </div>
                </div>
              </div>
            </div>

            {/* Progress Bar */}
            {isExpanded && allTasksInEpic.length > 0 && (
              <div className="px-4 pb-2">
                <div className="flex items-center gap-2">
                  <div className="flex-1 bg-gray-200 dark:bg-gray-700 rounded-full h-2">
                    <div
                      className="bg-green-500 h-2 rounded-full transition-all"
                      style={{ width: `${progress}%` }}
                    />
                  </div>
                  <span className="text-xs font-medium text-gray-600 dark:text-gray-400">{progress}%</span>
                </div>
              </div>
            )}

            {/* Epic Tickets */}
            {isExpanded && (
              <div className="border-t border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-900/50">
                {epicTickets.length === 0 ? (
                  <div className="p-4 text-center text-sm text-gray-400 dark:text-gray-500">
                    No tickets in this epic
                  </div>
                ) : (
                  epicTickets.map(ticket => (
                    <TicketItem
                      key={ticket.id}
                      ticket={ticket}
                      subtasks={subtasksByTicket[ticket.id] || []}
                      agents={agents}
                      isExpanded={expandedTickets.has(ticket.id)}
                      onToggle={() => toggleTicket(ticket.id)}
                      onClick={() => onTicketClick?.(ticket)}
                      onSubtaskClick={onSubtaskClick}
                      getStatusIcon={getStatusIcon}
                      getPriorityBadge={getPriorityBadge}
                      getAgent={getAgent}
                    />
                  ))
                )}
              </div>
            )}
          </div>
        );
      })}

      {/* Orphaned Tickets (not in any epic) */}
      {orphanedTickets.length > 0 && (
        <div className="border border-gray-200 dark:border-gray-700 rounded-lg overflow-hidden bg-white dark:bg-gray-800">
          <div className="p-4 bg-gray-50 dark:bg-gray-900/50 border-b border-gray-200 dark:border-gray-700">
            <h3 className="font-semibold text-gray-900 dark:text-white">Unassigned Tickets</h3>
            <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">Tickets not linked to any epic</p>
          </div>
          <div className="bg-gray-50 dark:bg-gray-900/50">
            {orphanedTickets.map(ticket => (
              <TicketItem
                key={ticket.id}
                ticket={ticket}
                subtasks={subtasksByTicket[ticket.id] || []}
                agents={agents}
                isExpanded={expandedTickets.has(ticket.id)}
                onToggle={() => toggleTicket(ticket.id)}
                onClick={() => onTicketClick?.(ticket)}
                onSubtaskClick={onSubtaskClick}
                getStatusIcon={getStatusIcon}
                getPriorityBadge={getPriorityBadge}
                getAgent={getAgent}
              />
            ))}
          </div>
        </div>
      )}

      {/* Empty State */}
      {epics.length === 0 && orphanedTickets.length === 0 && (
        <div className="text-center py-12 text-gray-400 dark:text-gray-500">
          <p>No tasks yet. Create a breakdown to get started.</p>
        </div>
      )}
    </div>
  );
};

// Ticket Item Component
interface TicketItemProps {
  ticket: Ticket;
  subtasks: Subtask[];
  agents: CodingAgent[];
  isExpanded: boolean;
  onToggle: () => void;
  onClick: () => void;
  onSubtaskClick?: (subtask: Subtask) => void;
  getStatusIcon: (status: string, size?: number) => React.JSX.Element;
  getPriorityBadge: (priority: number) => React.JSX.Element;
  getAgent: (agentId?: string) => CodingAgent | null | undefined;
}

const TicketItem = ({
  ticket,
  subtasks,
  agents,
  isExpanded,
  onToggle,
  onClick,
  onSubtaskClick,
  getStatusIcon,
  getPriorityBadge,
  getAgent,
}: TicketItemProps) => {
  const agent = getAgent(ticket.assignedAgentId);
  const sortedSubtasks = [...subtasks].sort((a, b) => a.orderIndex - b.orderIndex);
  const progress = subtasks.length > 0 ? Math.round((subtasks.filter(s => s.status === 'done').length / subtasks.length) * 100) : 0;

  return (
    <div className="border-b border-gray-200 dark:border-gray-700 last:border-b-0">
      {/* Ticket Header */}
      <div className="p-3 hover:bg-gray-100 dark:hover:bg-gray-800 cursor-pointer flex items-center gap-3">
        <button onClick={onToggle} className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 ml-4">
          {isExpanded ? <ChevronDown size={16} /> : <ChevronRight size={16} />}
        </button>
        {getStatusIcon(ticket.status, 16)}
        <div className="flex-1" onClick={(e) => { e.stopPropagation(); onClick(); }}>
          <div className="flex items-center gap-2">
            <span className="font-mono text-xs text-gray-500 dark:text-gray-400">{ticket.ticketId}</span>
            <span className="font-medium text-sm text-gray-900 dark:text-white">{ticket.title}</span>
          </div>
        </div>
        <div className="flex items-center gap-2">
          {ticket.riskLevel && (
            <span className={`text-xs px-2 py-0.5 rounded-full ${
              ticket.riskLevel === 'critical' ? 'bg-red-100 dark:bg-red-900/30 text-red-600 dark:text-red-400' :
              ticket.riskLevel === 'high' ? 'bg-orange-100 dark:bg-orange-900/30 text-orange-600 dark:text-orange-400' :
              ticket.riskLevel === 'medium' ? 'bg-yellow-100 dark:bg-yellow-900/30 text-yellow-600 dark:text-yellow-400' :
              'bg-green-100 dark:bg-green-900/30 text-green-600 dark:text-green-400'
            }`}>
              <AlertTriangle size={10} className="inline mr-1" />
              {ticket.riskLevel}
            </span>
          )}
          {getPriorityBadge(ticket.priority)}
          {agent && (
            <div className="flex items-center gap-1 text-xs text-gray-600 dark:text-gray-400">
              <User size={12} />
              {agent.name}
            </div>
          )}
          {subtasks.length > 0 && (
            <span className="text-xs text-gray-500 dark:text-gray-400">
              {subtasks.filter(s => s.status === 'done').length}/{subtasks.length}
            </span>
          )}
        </div>
      </div>

      {/* Subtasks */}
      {isExpanded && subtasks.length > 0 && (
        <div className="ml-12 mr-4 mb-2 space-y-1">
          {sortedSubtasks.map(subtask => {
            const subtaskAgent = getAgent(subtask.assignedAgentId);
            return (
              <div
                key={subtask.id}
                className="p-2 rounded bg-white dark:bg-gray-800 hover:bg-gray-50 dark:hover:bg-gray-750 cursor-pointer flex items-center gap-2 text-sm"
                onClick={() => onSubtaskClick?.(subtask)}
              >
                {getStatusIcon(subtask.status, 14)}
                <span className="font-mono text-xs text-gray-400">{subtask.subtaskId}</span>
                <span className="flex-1 text-gray-700 dark:text-gray-300">{subtask.title}</span>
                {subtask.estimatedMinutes && (
                  <span className="text-xs text-gray-500 dark:text-gray-400">
                    {subtask.estimatedMinutes}m
                  </span>
                )}
                {subtaskAgent && (
                  <span className="text-xs text-gray-500 dark:text-gray-400">{subtaskAgent.name}</span>
                )}
              </div>
            );
          })}
        </div>
      )}

      {/* Progress indicator when collapsed */}
      {!isExpanded && subtasks.length > 0 && (
        <div className="ml-12 mr-4 mb-2">
          <div className="flex items-center gap-2">
            <div className="flex-1 bg-gray-200 dark:bg-gray-700 rounded-full h-1">
              <div
                className="bg-blue-500 h-1 rounded-full transition-all"
                style={{ width: `${progress}%` }}
              />
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
