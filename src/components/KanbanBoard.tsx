'use client';

import { useState } from 'react';
import { Task, TaskStatus } from '@/types/task';
import { CodingAgent } from '@/types/agent';
import { generateId, generateTaskId } from '@/lib/utils';
import { Plus, X, ArrowRight, ArrowLeft, Sparkles, Users, Network } from 'lucide-react';
import { TaskItem } from './TaskItem';
import { AgentSelector } from './AgentSelector';
import { TaskBreakdownPanel } from './TaskBreakdownPanel';
import { AgentRosterPanel } from './AgentRosterPanel';
import { DependencyGraph } from './DependencyGraph';
import { BreakdownResult, TaskDependency } from '@/types/taskBreakdown';
import {
  AgentSkill,
  AgentPerformanceMetrics,
  AgentAvailability,
  AgentRoster
} from '@/types/agentOrchestration';
import { AgentOrchestrationService } from '@/lib/agentOrchestrationService';

interface KanbanBoardProps {
  tasks: Task[];
  agents: CodingAgent[];
  onAddTask: (task: Task) => Promise<void>;
  onUpdateTask: (task: Task) => void;
  onDeleteTask: (id: string) => void;
}

const COLUMNS: { id: TaskStatus; title: string }[] = [
  { id: 'backlog', title: 'TO DO' },
  { id: 'in-progress', title: 'IN PROGRESS' },
  { id: 'review', title: 'IN REVIEW' },
  { id: 'done', title: 'DONE' },
];

export const KanbanBoard = ({ tasks, agents, onAddTask, onUpdateTask, onDeleteTask }: KanbanBoardProps) => {
  const [isAdding, setIsAdding] = useState(false);
  const [newTaskTitle, setNewTaskTitle] = useState('');
  const [newTaskDesc, setNewTaskDesc] = useState('');
  const [newTaskPriority, setNewTaskPriority] = useState<1 | 2 | 3 | 4 | 5>(3);
  const [newTaskTags, setNewTaskTags] = useState('');
  const [newTaskSprint, setNewTaskSprint] = useState('');
  const [selectedSprint, setSelectedSprint] = useState<'all' | 'none' | string>('all');
  const [error, setError] = useState<string | null>(null);

  // New state for orchestration features
  const [showBreakdownPanel, setShowBreakdownPanel] = useState(false);
  const [showRosterPanel, setShowRosterPanel] = useState(false);
  const [showDependencyGraph, setShowDependencyGraph] = useState(false);
  const [dependencies, setDependencies] = useState<TaskDependency[]>([]);

  // Mock agent skills and performance (in production, this would come from a database)
  const [agentSkills] = useState<Map<string, AgentSkill[]>>(new Map());
  const [agentPerformance] = useState<Map<string, AgentPerformanceMetrics>>(new Map());
  const [agentAvailability] = useState<Map<string, AgentAvailability>>(new Map());

  const sprintOptions = Array.from(
    new Set(tasks.map((task) => task.sprint).filter((sprint): sprint is string => Boolean(sprint)))
  );
  const hasUnassignedSprint = tasks.some((task) => !task.sprint);
  const visibleTasks = tasks.filter((task) => {
    if (selectedSprint === 'all') return true;
    if (selectedSprint === 'none') return !task.sprint;
    return task.sprint === selectedSprint;
  });

  // Build agent roster
  const agentRoster: AgentRoster[] = AgentOrchestrationService.buildAgentRoster(
    agents,
    agentSkills,
    agentPerformance,
    agentAvailability,
    tasks
  );

  const handleAdd = async (e: React.FormEvent, status: TaskStatus = 'backlog') => {
    e.preventDefault();
    if (!newTaskTitle.trim()) return;

    setError(null);
    try {
      const tags = newTaskTags.split(',').map(t => t.trim()).filter(t => t.length > 0);
      // Find the highest task number
      let maxTaskNumber = 0;
      tasks.forEach(task => {
        if (task.taskId) {
          const match = task.taskId.match(/TASK-(\d+)/);
          if (match) {
            const num = parseInt(match[1], 10);
            if (num > maxTaskNumber) maxTaskNumber = num;
          }
        }
      });
      const newTask: Task = {
        id: generateId(),
        taskId: generateTaskId(maxTaskNumber + 1),
        title: newTaskTitle,
        description: newTaskDesc,
        sprint: newTaskSprint.trim() || undefined,
        status: status,
        priority: newTaskPriority,
        tags: tags,
        commentsCount: 0,
        attachmentsCount: 0,
        createdAt: Date.now(),
        updatedAt: Date.now(),
      };
      await onAddTask(newTask);
      setNewTaskTitle('');
      setNewTaskDesc('');
      setNewTaskTags('');
      setNewTaskPriority(3);
      setNewTaskSprint('');
      setIsAdding(false);
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Failed to add task. Please try again.';
      setError(message);
      console.error(err);
    }
  };

  const handleMove = (task: Task, direction: 'next' | 'prev') => {
    const currentIndex = COLUMNS.findIndex(c => c.id === task.status);
    if (currentIndex === -1) return;

    const newIndex = direction === 'next' ? currentIndex + 1 : currentIndex - 1;
    if (newIndex < 0 || newIndex >= COLUMNS.length) return;

    const newStatus = COLUMNS[newIndex].id;
    onUpdateTask({ ...task, status: newStatus });
  };

  const handleAssignAgent = (task: Task, agentId: string | undefined) => {
    onUpdateTask({ ...task, assignedAgentId: agentId });
  };

  const handleBreakdownComplete = async (result: BreakdownResult) => {
    try {
      // Store dependencies
      setDependencies(prev => [...prev, ...result.dependencies]);

      // Create tasks from breakdown
      const tasksToCreate: Task[] = [];
      const allBreakdowns = [
        ...(result.hierarchy.epic ? [result.hierarchy.epic] : []),
        ...result.hierarchy.tickets,
        ...result.hierarchy.subtasks
      ];

      let maxTaskNumber = 0;
      tasks.forEach(task => {
        if (task.taskId) {
          const match = task.taskId.match(/TASK-(\d+)/);
          if (match) {
            const num = parseInt(match[1], 10);
            if (num > maxTaskNumber) maxTaskNumber = num;
          }
        }
      });

      for (const breakdown of allBreakdowns) {
        maxTaskNumber++;
        const newTask: Task = {
          id: generateId(),
          taskId: generateTaskId(maxTaskNumber),
          title: breakdown.acceptanceCriteria[0] || `${breakdown.type} task`,
          description: breakdown.technicalNotes || '',
          status: 'backlog',
          priority: 3,
          tags: [breakdown.type],
          commentsCount: 0,
          attachmentsCount: 0,
          createdAt: Date.now(),
          updatedAt: Date.now(),
        };

        tasksToCreate.push(newTask);
      }

      // Add all tasks
      for (const task of tasksToCreate) {
        await onAddTask(task);
      }

      setShowBreakdownPanel(false);
    } catch (err) {
      console.error('Error creating tasks from breakdown:', err);
      setError('Failed to create tasks from breakdown');
    }
  };

  const handleUpdateSkills = (agentId: string, skills: AgentSkill[]) => {
    agentSkills.set(agentId, skills);
  };

  const handleUpdatePerformance = (agentId: string, metrics: AgentPerformanceMetrics) => {
    agentPerformance.set(agentId, metrics);
  };

  const handleUpdateAvailability = (agentId: string, availability: AgentAvailability) => {
    agentAvailability.set(agentId, availability);
  };

  return (
    <div className="flex flex-col h-full overflow-hidden">
      {/* Toolbar */}
      <div className="mb-4 flex justify-between items-center">
        <h2 className="text-xl font-bold text-gray-900 dark:text-white">Coding Agents Kanban</h2>
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2">
            <span className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wide">Sprint</span>
            <select
              className="border border-gray-200 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white px-3 py-1.5 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-black/10 dark:focus:ring-white/20"
              value={selectedSprint}
              onChange={(e) => setSelectedSprint(e.target.value)}
            >
              <option value="all">All Sprints</option>
              {hasUnassignedSprint && <option value="none">No Sprint</option>}
              {sprintOptions.map((sprint) => (
                <option key={sprint} value={sprint}>
                  {sprint}
                </option>
              ))}
            </select>
          </div>

          {/* New Orchestration Buttons */}
          <button
            onClick={() => setShowDependencyGraph(true)}
            className="bg-purple-500 dark:bg-purple-600 text-white px-3 py-1.5 rounded-lg text-sm font-medium flex items-center gap-2 hover:bg-purple-600 dark:hover:bg-purple-700 transition-colors"
            title="View Task Dependencies"
          >
            <Network size={16} /> Dependencies
          </button>
          <button
            onClick={() => setShowRosterPanel(true)}
            className="bg-blue-500 dark:bg-blue-600 text-white px-3 py-1.5 rounded-lg text-sm font-medium flex items-center gap-2 hover:bg-blue-600 dark:hover:bg-blue-700 transition-colors"
            title="Manage Agent Roster"
          >
            <Users size={16} /> Agents
          </button>
          <button
            onClick={() => setShowBreakdownPanel(true)}
            className="bg-gradient-to-r from-purple-500 to-blue-500 text-white px-3 py-1.5 rounded-lg text-sm font-medium flex items-center gap-2 hover:from-purple-600 hover:to-blue-600 transition-all"
            title="Auto-breakdown Task"
          >
            <Sparkles size={16} /> Auto Breakdown
          </button>
          <button
            onClick={() => setIsAdding(true)}
            className="bg-black dark:bg-white text-white dark:text-black px-3 py-1.5 rounded-lg text-sm font-medium flex items-center gap-2 hover:bg-gray-800 dark:hover:bg-gray-200 transition-colors"
          >
            <Plus size={16} /> New Task
          </button>
        </div>
      </div>

      {isAdding && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4" onClick={() => setIsAdding(false)}>
          <div className="bg-white dark:bg-gray-800 p-6 rounded-xl w-full max-w-md shadow-xl" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-bold text-gray-900 dark:text-white">Add New Task</h3>
              <button
                onClick={() => setIsAdding(false)}
                className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
              >
                <X size={20} />
              </button>
            </div>
            <form onSubmit={(e) => handleAdd(e, 'backlog')} className="space-y-4">
              <div>
                <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">Task Title *</label>
                <input
                  className="w-full border border-gray-200 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white p-2.5 rounded-lg focus:outline-none focus:ring-2 focus:ring-black/10 dark:focus:ring-white/20"
                  placeholder="e.g., Implement user authentication"
                  value={newTaskTitle}
                  onChange={e => setNewTaskTitle(e.target.value)}
                  autoFocus
                  required
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">Description (optional)</label>
                <textarea
                  className="w-full border border-gray-200 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white p-2.5 rounded-lg h-24 focus:outline-none focus:ring-2 focus:ring-black/10 dark:focus:ring-white/20 resize-none"
                  placeholder="Describe the task in detail..."
                  value={newTaskDesc}
                  onChange={e => setNewTaskDesc(e.target.value)}
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">Priority (1-5)</label>
                <select
                  className="w-full border border-gray-200 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white p-2.5 rounded-lg focus:outline-none focus:ring-2 focus:ring-black/10 dark:focus:ring-white/20"
                  value={newTaskPriority}
                  onChange={e => setNewTaskPriority(Number(e.target.value) as 1 | 2 | 3 | 4 | 5)}
                >
                  <option value={1}>1 - Low</option>
                  <option value={2}>2 - Medium-Low</option>
                  <option value={3}>3 - Medium</option>
                  <option value={4}>4 - High</option>
                  <option value={5}>5 - Critical</option>
                </select>
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">Tags (comma-separated)</label>
                <input
                  className="w-full border border-gray-200 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white p-2.5 rounded-lg focus:outline-none focus:ring-2 focus:ring-black/10 dark:focus:ring-white/20"
                  placeholder="e.g., frontend, urgent, bug"
                  value={newTaskTags}
                  onChange={e => setNewTaskTags(e.target.value)}
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">Sprint (optional)</label>
                <input
                  className="w-full border border-gray-200 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white p-2.5 rounded-lg focus:outline-none focus:ring-2 focus:ring-black/10 dark:focus:ring-white/20"
                  placeholder="e.g., Sprint 12"
                  value={newTaskSprint}
                  onChange={e => setNewTaskSprint(e.target.value)}
                />
              </div>
              {error && (
                <div className="p-2 bg-red-50 dark:bg-red-900/30 border border-red-200 dark:border-red-800 rounded text-xs text-red-600 dark:text-red-400">
                  {error}
                </div>
              )}
              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => {
                    setIsAdding(false);
                    setNewTaskTitle('');
                    setNewTaskDesc('');
                    setNewTaskTags('');
                    setNewTaskPriority(3);
                    setNewTaskSprint('');
                    setError(null);
                  }}
                  className="px-4 py-2 text-gray-600 dark:text-gray-400 hover:text-gray-800 dark:hover:text-gray-200 transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-black dark:bg-white text-white dark:text-black rounded-lg hover:bg-gray-800 dark:hover:bg-gray-200 transition-colors font-medium"
                >
                  Add Task
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Task Breakdown Panel */}
      {showBreakdownPanel && (
        <div className="fixed inset-0 z-50 flex items-end justify-end bg-black/50 backdrop-blur-sm">
          <div className="w-full md:w-2/3 lg:w-1/2 h-full bg-white dark:bg-gray-800 shadow-2xl overflow-hidden flex flex-col">
            <div className="flex items-center justify-between p-4 border-b border-gray-200 dark:border-gray-700">
              <h2 className="text-xl font-semibold text-gray-800 dark:text-gray-200">Automated Task Breakdown</h2>
              <button
                onClick={() => setShowBreakdownPanel(false)}
                className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
              >
                <X size={20} className="text-gray-600 dark:text-gray-400" />
              </button>
            </div>
            <div className="flex-1 overflow-auto">
              <TaskBreakdownPanel onBreakdownComplete={handleBreakdownComplete} />
            </div>
          </div>
        </div>
      )}

      {/* Agent Roster Panel */}
      {showRosterPanel && (
        <div className="fixed inset-0 z-50 flex items-end justify-end bg-black/50 backdrop-blur-sm">
          <div className="w-full md:w-2/3 lg:w-1/2 h-full bg-white dark:bg-gray-800 shadow-2xl overflow-hidden flex flex-col">
            <div className="flex items-center justify-between p-4 border-b border-gray-200 dark:border-gray-700">
              <h2 className="text-xl font-semibold text-gray-800 dark:text-gray-200">Agent Roster Management</h2>
              <button
                onClick={() => setShowRosterPanel(false)}
                className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
              >
                <X size={20} className="text-gray-600 dark:text-gray-400" />
              </button>
            </div>
            <div className="flex-1 overflow-auto">
              <AgentRosterPanel
                roster={agentRoster}
                onUpdateSkills={handleUpdateSkills}
                onUpdatePerformance={handleUpdatePerformance}
                onUpdateAvailability={handleUpdateAvailability}
              />
            </div>
          </div>
        </div>
      )}

      {/* Dependency Graph */}
      {showDependencyGraph && (
        <DependencyGraph
          tasks={tasks}
          dependencies={dependencies}
          onClose={() => setShowDependencyGraph(false)}
        />
      )}

      {/* Error Display */}
      {error && (
        <div className="mb-4 p-3 bg-red-50 dark:bg-red-900/30 border border-red-200 dark:border-red-800 rounded-lg text-sm text-red-600 dark:text-red-400">
          {error}
        </div>
      )}

      {/* Board */}
      <div className="flex-1 overflow-x-auto">
        <div className="flex gap-4 h-full min-w-[1200px]">
          {COLUMNS.map((col, colIdx) => {
            const columnTasks = visibleTasks.filter(t => t.status === col.id);
            return (
              <div key={col.id} className="flex-1 bg-gray-50 dark:bg-gray-800 rounded-lg flex flex-col max-h-full border border-gray-200 dark:border-gray-700">
                <div className="p-3 font-bold text-sm text-gray-600 dark:text-gray-300 uppercase tracking-wider border-b border-gray-200 dark:border-gray-700 flex justify-between items-center">
                  <span>{col.title}</span>
                  <span className="bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300 px-2.5 py-0.5 rounded-full text-xs font-semibold">
                    {columnTasks.length}
                  </span>
                </div>
                <div className="p-2 flex-1 overflow-y-auto space-y-2">
                  {/* Quick Add Button in Backlog Column */}
                  {col.id === 'backlog' && (
                    <button
                      onClick={() => setIsAdding(true)}
                      className="w-full p-3 border-2 border-dashed border-gray-300 dark:border-gray-600 rounded-lg text-gray-400 dark:text-gray-500 hover:border-gray-400 dark:hover:border-gray-500 hover:text-gray-600 dark:hover:text-gray-400 transition-colors flex items-center justify-center gap-2 text-sm font-medium mb-2"
                    >
                      <Plus size={16} />
                      Add Task
                    </button>
                  )}
                  {/* Empty state */}
                  {tasks.length === 0 && col.id === 'backlog' && (
                    <div className="text-center py-8 text-gray-400 dark:text-gray-500 text-sm">
                      <p className="mb-1">No tasks yet</p>
                      <p className="text-xs">Click &quot;Add Task&quot; above to get started</p>
                    </div>
                  )}
                  {tasks.length > 0 && visibleTasks.length === 0 && col.id === 'backlog' && (
                    <div className="text-center py-6 text-gray-400 dark:text-gray-500 text-sm">
                      <p className="mb-1">No tasks in this sprint</p>
                      <p className="text-xs">Try selecting another sprint</p>
                    </div>
                  )}
                  {/* Show message if this column is empty but other columns have items */}
                  {visibleTasks.length > 0 && columnTasks.length === 0 && (
                    <div className="text-center py-4 text-gray-400 dark:text-gray-500 text-xs">
                      No items in {col.title.toLowerCase()}
                    </div>
                  )}
                  {columnTasks.map(task => (
                    <div key={task.id} className="relative">
                      <TaskItem
                        task={task}
                        agents={agents}
                        onUpdate={onUpdateTask}
                        onDelete={onDeleteTask}
                      />
                      <div className="mt-2 flex items-center justify-between px-1">
                        {colIdx > 0 ? (
                          <button
                            onClick={() => handleMove(task, 'prev')}
                            className="text-gray-400 hover:text-black dark:hover:text-white text-xs flex items-center gap-1 transition-colors"
                          >
                            <ArrowLeft size={14} />
                            Prev
                          </button>
                        ) : <div />}

                        {colIdx < COLUMNS.length - 1 ? (
                          <button
                            onClick={() => handleMove(task, 'next')}
                            className="text-gray-400 hover:text-black dark:hover:text-white text-xs flex items-center gap-1 transition-colors"
                          >
                            Next
                            <ArrowRight size={14} />
                          </button>
                        ) : <div />}
                      </div>
                      {/* Agent Assignment - show in all columns */}
                      <div className="mt-2 px-1">
                        <AgentSelector
                          task={task}
                          agents={agents}
                          onAssign={(agentId) => handleAssignAgent(task, agentId)}
                        />
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};
