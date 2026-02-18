'use client';

import { useState } from 'react';
import { useAgents } from '@/hooks/useAgents';
import { AutomatedBreakdown } from '@/components/AutomatedBreakdown';
import { TaskHierarchy } from '@/components/TaskHierarchy';
import { DependencyGraph } from '@/components/DependencyGraph';
import { BreakdownResult, Epic, Ticket, Subtask, TaskDependency, DependencyGraph as DependencyGraphType } from '@/types/orchestration';
import { Sparkles, List, GitBranch } from 'lucide-react';

/**
 * Orchestration Demo Page
 *
 * Demonstrates the automated task breakdown and agent orchestration features
 */
export default function OrchestrationPage() {
  const { agents, isLoaded } = useAgents();
  const [view, setView] = useState<'breakdown' | 'hierarchy' | 'dependencies'>('breakdown');

  // Demo data
  const [epics, setEpics] = useState<Epic[]>([]);
  const [tickets, setTickets] = useState<Ticket[]>([]);
  const [subtasks, setSubtasks] = useState<Subtask[]>([]);
  const [dependencies, setDependencies] = useState<TaskDependency[]>([]);

  const handleAcceptBreakdown = async (result: BreakdownResult) => {
    // Convert generated items to actual format with IDs
    const newEpics: Epic[] = result.epics.map((e, idx) => ({
      id: `epic-${Date.now()}-${idx}`,
      epicId: `EPIC-${epics.length + idx + 1}`,
      title: e.title,
      description: e.description,
      status: 'backlog' as const,
      priority: e.priority,
      tags: e.tags,
      createdAt: Date.now(),
      updatedAt: Date.now(),
    }));

    const newTickets: Ticket[] = result.tickets.map((t, idx) => ({
      id: `ticket-${Date.now()}-${idx}`,
      epicId: t.epicIndex !== undefined ? newEpics[t.epicIndex]?.id : undefined,
      ticketId: `TICKET-${tickets.length + idx + 1}`,
      title: t.title,
      description: t.description,
      status: 'backlog' as const,
      priority: t.priority,
      tags: t.tags,
      definitionOfDone: t.definitionOfDone.map((dod, dodIdx) => ({
        id: `dod-${idx}-${dodIdx}`,
        description: dod,
        completed: false,
      })),
      testNotes: t.testNotes,
      riskLevel: t.riskLevel,
      riskDescription: t.riskDescription,
      storyPoints: t.storyPoints,
      estimatedHours: t.estimatedHours,
      suggestedSkills: t.suggestedSkills,
      createdAt: Date.now(),
      updatedAt: Date.now(),
    }));

    const newSubtasks: Subtask[] = result.subtasks.map((s, idx) => ({
      id: `subtask-${Date.now()}-${idx}`,
      ticketId: newTickets[s.ticketIndex]?.id || '',
      subtaskId: `SUB-${subtasks.length + idx + 1}`,
      title: s.title,
      description: s.description,
      status: 'backlog' as const,
      orderIndex: s.orderIndex,
      estimatedMinutes: s.estimatedMinutes,
      createdAt: Date.now(),
      updatedAt: Date.now(),
    }));

    const newDependencies: TaskDependency[] = result.dependencies.map((d, idx) => ({
      id: `dep-${Date.now()}-${idx}`,
      sourceType: d.sourceType,
      sourceId: d.sourceType === 'epic' ? newEpics[d.sourceIndex]?.id || '' :
                d.sourceType === 'ticket' ? newTickets[d.sourceIndex]?.id || '' :
                newSubtasks[d.sourceIndex]?.id || '',
      targetType: d.targetType,
      targetId: d.targetType === 'epic' ? newEpics[d.targetIndex]?.id || '' :
                d.targetType === 'ticket' ? newTickets[d.targetIndex]?.id || '' :
                newSubtasks[d.targetIndex]?.id || '',
      dependencyType: d.dependencyType,
      createdAt: Date.now(),
    }));

    // Add to state
    setEpics([...epics, ...newEpics]);
    setTickets([...tickets, ...newTickets]);
    setSubtasks([...subtasks, ...newSubtasks]);
    setDependencies([...dependencies, ...newDependencies]);

    // Switch to hierarchy view
    setView('hierarchy');
  };

  const getDependencyGraph = (): DependencyGraphType => {
    const nodes = [
      ...epics.map(e => ({
        id: e.id,
        type: 'epic' as const,
        displayId: e.epicId,
        title: e.title,
        status: e.status,
        priority: e.priority,
      })),
      ...tickets.map(t => ({
        id: t.id,
        type: 'ticket' as const,
        displayId: t.ticketId,
        title: t.title,
        status: t.status,
        priority: t.priority,
        assignedAgentId: t.assignedAgentId,
      })),
      ...subtasks.map(s => ({
        id: s.id,
        type: 'subtask' as const,
        displayId: s.subtaskId,
        title: s.title,
        status: s.status,
        assignedAgentId: s.assignedAgentId,
      })),
    ];

    const edges = dependencies.map(d => ({
      id: d.id,
      source: d.sourceId,
      target: d.targetId,
      type: d.dependencyType,
    }));

    return { nodes, edges };
  };

  if (!isLoaded) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <p className="text-gray-400">Loading...</p>
      </div>
    );
  }

  return (
    <div className="h-screen flex flex-col bg-gray-50 dark:bg-gray-900">
      {/* Header */}
      <header className="bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 p-4">
        <div className="max-w-7xl mx-auto">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold text-gray-900 dark:text-white flex items-center gap-2">
                <Sparkles size={28} className="text-purple-500" />
                Agent Orchestration
              </h1>
              <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                Automated task breakdown and intelligent agent assignment
              </p>
            </div>
            {(epics.length > 0 || tickets.length > 0 || subtasks.length > 0) && (
              <div className="flex gap-2">
                <button
                  onClick={() => setView('breakdown')}
                  className={`px-4 py-2 rounded-lg flex items-center gap-2 ${
                    view === 'breakdown'
                      ? 'bg-purple-100 dark:bg-purple-900/30 text-purple-700 dark:text-purple-400'
                      : 'text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700'
                  }`}
                >
                  <Sparkles size={16} />
                  New Breakdown
                </button>
                <button
                  onClick={() => setView('hierarchy')}
                  className={`px-4 py-2 rounded-lg flex items-center gap-2 ${
                    view === 'hierarchy'
                      ? 'bg-purple-100 dark:bg-purple-900/30 text-purple-700 dark:text-purple-400'
                      : 'text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700'
                  }`}
                >
                  <List size={16} />
                  Hierarchy
                </button>
                <button
                  onClick={() => setView('dependencies')}
                  className={`px-4 py-2 rounded-lg flex items-center gap-2 ${
                    view === 'dependencies'
                      ? 'bg-purple-100 dark:bg-purple-900/30 text-purple-700 dark:text-purple-400'
                      : 'text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700'
                  }`}
                >
                  <GitBranch size={16} />
                  Dependencies
                </button>
              </div>
            )}
          </div>
        </div>
      </header>

      {/* Content */}
      <main className="flex-1 overflow-hidden">
        <div className="h-full max-w-7xl mx-auto p-6">
          {view === 'breakdown' && (
            <div className="h-full bg-white dark:bg-gray-800 rounded-lg shadow-lg overflow-hidden">
              <AutomatedBreakdown
                agents={agents}
                onAccept={handleAcceptBreakdown}
              />
            </div>
          )}

          {view === 'hierarchy' && (
            <div className="h-full bg-white dark:bg-gray-800 rounded-lg shadow-lg overflow-auto p-6">
              {epics.length === 0 && tickets.length === 0 && subtasks.length === 0 ? (
                <div className="flex items-center justify-center h-full text-gray-400 dark:text-gray-500">
                  <div className="text-center">
                    <List size={48} className="mx-auto mb-3 opacity-30" />
                    <p>No tasks yet. Create a breakdown to get started.</p>
                  </div>
                </div>
              ) : (
                <TaskHierarchy
                  epics={epics}
                  tickets={tickets}
                  subtasks={subtasks}
                  agents={agents}
                  onEpicClick={(epic) => console.log('Epic clicked:', epic)}
                  onTicketClick={(ticket) => console.log('Ticket clicked:', ticket)}
                  onSubtaskClick={(subtask) => console.log('Subtask clicked:', subtask)}
                />
              )}
            </div>
          )}

          {view === 'dependencies' && (
            <div className="h-full">
              <DependencyGraph graph={getDependencyGraph()} />
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
