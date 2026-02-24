'use client';

import { useState } from 'react';
import { Task, TaskStatus, TaskBreakdownResult } from '@/types/task';
import { CodingAgent } from '@/types/agent';
import { generateId, generateTaskId } from '@/lib/utils';
import { Wand2, Network, Users, Plus, X, ArrowRight, ArrowLeft } from 'lucide-react';
import { TaskItem } from './TaskItem';
import { AgentSelector } from './AgentSelector';
import { TaskBreakdownWizard } from './TaskBreakdownWizard';
import { DependencyGraph } from './DependencyGraph';
import { AgentRosterManager } from './AgentRosterManager';
import { useDependencies } from '@/hooks/useDependencies';
import { useAgentSkills } from '@/hooks/useAgentSkills';
import { autoAssignAgentsToTasks } from '@/services/autoAssignment';

interface EnhancedKanbanBoardProps {
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

type ViewMode = 'board' | 'dependencies' | 'agents';

export const EnhancedKanbanBoard = ({
  tasks,
  agents,
  onAddTask,
  onUpdateTask,
  onDeleteTask,
}: EnhancedKanbanBoardProps) => {
  const [viewMode, setViewMode] = useState<ViewMode>('board');
  const [isAdding, setIsAdding] = useState(false);
  const [showBreakdownWizard, setShowBreakdownWizard] = useState(false);
  const [newTaskTitle, setNewTaskTitle] = useState('');
  const [newTaskDesc, setNewTaskDesc] = useState('');
  const [newTaskPriority, setNewTaskPriority] = useState<1 | 2 | 3 | 4 | 5>(3);
  const [newTaskTags, setNewTaskTags] = useState('');
  const [newTaskSprint, setNewTaskSprint] = useState('');
  const [selectedSprint, setSelectedSprint] = useState<'all' | 'none' | string>('all');
  const [error, setError] = useState<string | null>(null);

  const { dependencies, addDependency } = useDependencies();
  const { addSkill, updateSkill, removeSkill } = useAgentSkills();

  const sprintOptions = Array.from(
    new Set(tasks.map((task) => task.sprint).filter((sprint): sprint is string => Boolean(sprint)))
  );
  const hasUnassignedSprint = tasks.some((task) => !task.sprint);
  const visibleTasks = tasks.filter((task) => {
    if (selectedSprint === 'all') return true;
    if (selectedSprint === 'none') return !task.sprint;
    return task.sprint === selectedSprint;
  });

  const handleAdd = async (e: React.FormEvent, status: TaskStatus = 'backlog') => {
    e.preventDefault();
    if (!newTaskTitle.trim()) return;

    setError(null);
    try {
      const tags = newTaskTags.split(',').map((t) => t.trim()).filter((t) => t.length > 0);
      let maxTaskNumber = 0;
      tasks.forEach((task) => {
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
        taskType: 'task',
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

  const handleBreakdownComplete = async (result: TaskBreakdownResult) => {
    try {
      // Create epic
      let maxTaskNumber = 0;
      tasks.forEach((task) => {
        if (task.taskId) {
          const match = task.taskId.match(/TASK-(\d+)/);
          if (match) {
            const num = parseInt(match[1], 10);
            if (num > maxTaskNumber) maxTaskNumber = num;
          }
        }
      });

      const epic: Task = {
        id: generateId(),
        taskId: generateTaskId(maxTaskNumber + 1),
        title: result.epic.title,
        description: result.epic.description,
        status: 'backlog',
        priority: 4,
        tags: [],
        commentsCount: 0,
        attachmentsCount: 0,
        createdAt: Date.now(),
        updatedAt: Date.now(),
        taskType: 'epic',
        riskLevel: result.epic.riskLevel,
        estimatedHours: result.epic.estimatedHours,
      };

      await onAddTask(epic);

      // Create tasks and subtasks
      const createdTaskIds: string[] = [];

      for (let i = 0; i < result.tasks.length; i++) {
        const taskDef = result.tasks[i];
        maxTaskNumber++;

        const taskId = generateId();
        const task: Task = {
          id: taskId,
          taskId: generateTaskId(maxTaskNumber),
          title: taskDef.title,
          description: taskDef.description,
          status: 'backlog',
          priority: taskDef.priority,
          tags: taskDef.tags,
          commentsCount: 0,
          attachmentsCount: 0,
          createdAt: Date.now(),
          updatedAt: Date.now(),
          taskType: 'task',
          parentTaskId: epic.id,
          definitionOfDone: taskDef.definitionOfDone,
          testNotes: taskDef.testNotes,
          riskLevel: taskDef.riskLevel,
          estimatedHours: taskDef.estimatedHours,
        };

        await onAddTask(task);
        createdTaskIds.push(taskId);

        // Create subtasks
        if (taskDef.subtasks) {
          for (const subtaskDef of taskDef.subtasks) {
            maxTaskNumber++;
            const subtask: Task = {
              id: generateId(),
              taskId: generateTaskId(maxTaskNumber),
              title: subtaskDef.title,
              description: subtaskDef.description,
              status: 'backlog',
              priority: taskDef.priority,
              tags: taskDef.tags,
              commentsCount: 0,
              attachmentsCount: 0,
              createdAt: Date.now(),
              updatedAt: Date.now(),
              taskType: 'subtask',
              parentTaskId: taskId,
              estimatedHours: subtaskDef.estimatedHours,
            };
            await onAddTask(subtask);
          }
        }
      }

      // Create dependencies
      for (const dep of result.dependencies) {
        if (createdTaskIds[dep.fromTaskIndex] && createdTaskIds[dep.toTaskIndex]) {
          await addDependency(
            createdTaskIds[dep.fromTaskIndex],
            createdTaskIds[dep.toTaskIndex],
            dep.type
          );
        }
      }

      // Auto-assign agents based on skills
      const taskSkillsMap = new Map<string, string[]>();
      createdTaskIds.forEach((id, idx) => {
        taskSkillsMap.set(id, result.tasks[idx]?.suggestedSkills || []);
      });

      const newTasks = tasks.filter(t => createdTaskIds.includes(t.id));
      const assignments = autoAssignAgentsToTasks(newTasks, agents, taskSkillsMap);

      assignments.forEach((agentId, taskId) => {
        const task = tasks.find(t => t.id === taskId);
        if (task) {
          onUpdateTask({ ...task, assignedAgentId: agentId });
        }
      });

      setShowBreakdownWizard(false);
    } catch (err) {
      console.error('Error creating tasks from breakdown:', err);
      setError('Failed to create tasks from breakdown');
    }
  };

  const handleMove = (task: Task, direction: 'next' | 'prev') => {
    const currentIndex = COLUMNS.findIndex((c) => c.id === task.status);
    if (currentIndex === -1) return;

    const newIndex = direction === 'next' ? currentIndex + 1 : currentIndex - 1;
    if (newIndex < 0 || newIndex >= COLUMNS.length) return;

    const newStatus = COLUMNS[newIndex].id;
    onUpdateTask({ ...task, status: newStatus });
  };

  const handleAssignAgent = (task: Task, agentId: string | undefined) => {
    onUpdateTask({ ...task, assignedAgentId: agentId });
  };

  const getTaskTypeIcon = (taskType: string) => {
    switch (taskType) {
      case 'epic': return '📦';
      case 'subtask': return '🔸';
      default: return '📋';
    }
  };

  return (
    <div className="flex flex-col h-full overflow-hidden">
      {/* Toolbar */}
      <div className="mb-4 flex justify-between items-center">
        <div className="flex items-center gap-3">
          <h2 className="text-xl font-bold text-gray-900 dark:text-white">Coding Agents Kanban</h2>

          {/* View Mode Switcher */}
          <div className="flex bg-gray-100 dark:bg-gray-800 rounded-lg p-1">
            <button
              onClick={() => setViewMode('board')}
              className={`px-3 py-1.5 rounded text-sm font-medium transition-all ${
                viewMode === 'board'
                  ? 'bg-white dark:bg-gray-700 text-gray-900 dark:text-white shadow-sm'
                  : 'text-gray-600 dark:text-gray-400'
              }`}
            >
              Board
            </button>
            <button
              onClick={() => setViewMode('dependencies')}
              className={`px-3 py-1.5 rounded text-sm font-medium transition-all flex items-center gap-1 ${
                viewMode === 'dependencies'
                  ? 'bg-white dark:bg-gray-700 text-gray-900 dark:text-white shadow-sm'
                  : 'text-gray-600 dark:text-gray-400'
              }`}
            >
              <Network size={16} />
              Dependencies
            </button>
            <button
              onClick={() => setViewMode('agents')}
              className={`px-3 py-1.5 rounded text-sm font-medium transition-all flex items-center gap-1 ${
                viewMode === 'agents'
                  ? 'bg-white dark:bg-gray-700 text-gray-900 dark:text-white shadow-sm'
                  : 'text-gray-600 dark:text-gray-400'
              }`}
            >
              <Users size={16} />
              Agents
            </button>
          </div>
        </div>

        <div className="flex items-center gap-3">
          {viewMode === 'board' && (
            <>
              <div className="flex items-center gap-2">
                <span className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wide">
                  Sprint
                </span>
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
              <button
                onClick={() => setShowBreakdownWizard(true)}
                className="bg-gradient-to-r from-purple-500 to-pink-500 text-white px-3 py-1.5 rounded-lg text-sm font-medium flex items-center gap-2 hover:from-purple-600 hover:to-pink-600 transition-all shadow-md"
              >
                <Wand2 size={16} />
                AI Breakdown
              </button>
            </>
          )}
          <button
            onClick={() => setIsAdding(true)}
            className="bg-black dark:bg-white text-white dark:text-black px-3 py-1.5 rounded-lg text-sm font-medium flex items-center gap-2 hover:bg-gray-800 dark:hover:bg-gray-200 transition-colors"
          >
            <Plus size={16} /> New Task
          </button>
        </div>
      </div>

      {/* Task Breakdown Wizard */}
      {showBreakdownWizard && (
        <TaskBreakdownWizard
          onComplete={handleBreakdownComplete}
          onCancel={() => setShowBreakdownWizard(false)}
        />
      )}

      {/* Quick Add Modal */}
      {isAdding && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4" onClick={() => setIsAdding(false)}>
          <div className="bg-white dark:bg-gray-800 p-6 rounded-xl w-full max-w-md shadow-xl" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-bold text-gray-900 dark:text-white">Add New Task</h3>
              <button onClick={() => setIsAdding(false)} className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300">
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
                  onChange={(e) => setNewTaskTitle(e.target.value)}
                  autoFocus
                  required
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">Description</label>
                <textarea
                  className="w-full border border-gray-200 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white p-2.5 rounded-lg h-24 focus:outline-none focus:ring-2 focus:ring-black/10 dark:focus:ring-white/20 resize-none"
                  placeholder="Describe the task..."
                  value={newTaskDesc}
                  onChange={(e) => setNewTaskDesc(e.target.value)}
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">Priority (1-5)</label>
                <select
                  className="w-full border border-gray-200 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white p-2.5 rounded-lg focus:outline-none focus:ring-2 focus:ring-black/10 dark:focus:ring-white/20"
                  value={newTaskPriority}
                  onChange={(e) => setNewTaskPriority(Number(e.target.value) as 1 | 2 | 3 | 4 | 5)}
                >
                  <option value={1}>1 - Low</option>
                  <option value={2}>2 - Medium-Low</option>
                  <option value={3}>3 - Medium</option>
                  <option value={4}>4 - High</option>
                  <option value={5}>5 - Critical</option>
                </select>
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">Tags</label>
                <input
                  className="w-full border border-gray-200 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white p-2.5 rounded-lg focus:outline-none focus:ring-2 focus:ring-black/10 dark:focus:ring-white/20"
                  placeholder="e.g., frontend, urgent"
                  value={newTaskTags}
                  onChange={(e) => setNewTaskTags(e.target.value)}
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">Sprint</label>
                <input
                  className="w-full border border-gray-200 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white p-2.5 rounded-lg focus:outline-none focus:ring-2 focus:ring-black/10 dark:focus:ring-white/20"
                  placeholder="e.g., Sprint 12"
                  value={newTaskSprint}
                  onChange={(e) => setNewTaskSprint(e.target.value)}
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
                  onClick={() => setIsAdding(false)}
                  className="px-4 py-2 text-gray-600 dark:text-gray-400 hover:text-gray-800 dark:hover:text-gray-200"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-black dark:bg-white text-white dark:text-black rounded-lg hover:bg-gray-800 dark:hover:bg-gray-200 font-medium"
                >
                  Add Task
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Main Content Area */}
      <div className="flex-1 overflow-hidden">
        {viewMode === 'board' && (
          <div className="overflow-x-auto h-full">
            <div className="flex gap-4 h-full min-w-[1200px]">
              {COLUMNS.map((col, colIdx) => {
                const columnTasks = visibleTasks.filter((t) => t.status === col.id);
                return (
                  <div
                    key={col.id}
                    className="flex-1 bg-gray-50 dark:bg-gray-800 rounded-lg flex flex-col max-h-full border border-gray-200 dark:border-gray-700"
                  >
                    <div className="p-3 font-bold text-sm text-gray-600 dark:text-gray-300 uppercase tracking-wider border-b border-gray-200 dark:border-gray-700 flex justify-between items-center">
                      <span>{col.title}</span>
                      <span className="bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300 px-2.5 py-0.5 rounded-full text-xs font-semibold">
                        {columnTasks.length}
                      </span>
                    </div>
                    <div className="p-2 flex-1 overflow-y-auto space-y-2">
                      {col.id === 'backlog' && (
                        <button
                          onClick={() => setIsAdding(true)}
                          className="w-full p-3 border-2 border-dashed border-gray-300 dark:border-gray-600 rounded-lg text-gray-400 dark:text-gray-500 hover:border-gray-400 dark:hover:border-gray-500 hover:text-gray-600 dark:hover:text-gray-400 transition-colors flex items-center justify-center gap-2 text-sm font-medium mb-2"
                        >
                          <Plus size={16} />
                          Add Task
                        </button>
                      )}
                      {columnTasks.map((task) => (
                        <div key={task.id} className="relative">
                          <div className="absolute -left-1 top-2 text-lg">{getTaskTypeIcon(task.taskType)}</div>
                          <TaskItem task={task} agents={agents} onUpdate={onUpdateTask} onDelete={onDeleteTask} />
                          <div className="mt-2 flex items-center justify-between px-1">
                            {colIdx > 0 ? (
                              <button
                                onClick={() => handleMove(task, 'prev')}
                                className="text-gray-400 hover:text-black dark:hover:text-white text-xs flex items-center gap-1"
                              >
                                <ArrowLeft size={14} />
                                Prev
                              </button>
                            ) : (
                              <div />
                            )}
                            {colIdx < COLUMNS.length - 1 ? (
                              <button
                                onClick={() => handleMove(task, 'next')}
                                className="text-gray-400 hover:text-black dark:hover:text-white text-xs flex items-center gap-1"
                              >
                                Next
                                <ArrowRight size={14} />
                              </button>
                            ) : (
                              <div />
                            )}
                          </div>
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
        )}

        {viewMode === 'dependencies' && (
          <DependencyGraph
            tasks={tasks}
            dependencies={dependencies}
            onTaskClick={(taskId) => {
              const task = tasks.find(t => t.id === taskId);
              if (task) {
                console.log('Task clicked:', task);
              }
            }}
          />
        )}

        {viewMode === 'agents' && (
          <AgentRosterManager
            agents={agents}
            onAddSkill={addSkill}
            onUpdateSkill={updateSkill}
            onRemoveSkill={removeSkill}
          />
        )}
      </div>
    </div>
  );
};
