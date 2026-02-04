'use client';

import { useState, useEffect } from 'react';
import { Task, TaskStatus } from '@/types/task';
import { CodingAgent } from '@/types/agent';
import { generateId, generateTaskId } from '@/lib/utils';
import { Plus, X, ArrowRight, ArrowLeft } from 'lucide-react';
import { TaskItem } from './TaskItem';
import { AgentSelector } from './AgentSelector';

interface KanbanBoardProps {
  tasks: Task[];
  agents: CodingAgent[];
  onAddTask: (task: Task) => void;
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
  const [error, setError] = useState<string | null>(null);

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
        status: status,
        priority: newTaskPriority,
        tags: tags,
        commentsCount: 0,
        attachmentsCount: 0,
        createdAt: Date.now(),
        updatedAt: Date.now(),
      };
      onAddTask(newTask);
      setNewTaskTitle('');
      setNewTaskDesc('');
      setNewTaskTags('');
      setNewTaskPriority(3);
      setIsAdding(false);
    } catch (err: any) {
      setError(err.message || 'Failed to add task. Please try again.');
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

  return (
    <div className="flex flex-col h-full overflow-hidden">
      {/* Toolbar */}
      <div className="mb-4 flex justify-between items-center">
        <h2 className="text-xl font-bold">Coding Agents Kanban</h2>
        <button 
          onClick={() => setIsAdding(true)}
          className="bg-black text-white px-3 py-1.5 rounded-lg text-sm font-medium flex items-center gap-2 hover:bg-gray-800"
        >
          <Plus size={16} /> New Task
        </button>
      </div>

      {isAdding && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4" onClick={() => setIsAdding(false)}>
          <div className="bg-white p-6 rounded-xl w-full max-w-md shadow-xl" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-bold">Add New Task</h3>
              <button 
                onClick={() => setIsAdding(false)}
                className="text-gray-400 hover:text-gray-600"
              >
                <X size={20} />
              </button>
            </div>
            <form onSubmit={(e) => handleAdd(e, 'backlog')} className="space-y-4">
              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1">Task Title *</label>
                <input 
                  className="w-full border border-gray-200 p-2.5 rounded-lg focus:outline-none focus:ring-2 focus:ring-black/10" 
                  placeholder="e.g., Implement user authentication" 
                  value={newTaskTitle}
                  onChange={e => setNewTaskTitle(e.target.value)}
                  autoFocus
                  required
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1">Description (optional)</label>
                <textarea 
                  className="w-full border border-gray-200 p-2.5 rounded-lg h-24 focus:outline-none focus:ring-2 focus:ring-black/10 resize-none" 
                  placeholder="Describe the task in detail..." 
                  value={newTaskDesc}
                  onChange={e => setNewTaskDesc(e.target.value)}
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1">Priority (1-5)</label>
                <select
                  className="w-full border border-gray-200 p-2.5 rounded-lg focus:outline-none focus:ring-2 focus:ring-black/10"
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
                <label className="block text-xs font-medium text-gray-700 mb-1">Tags (comma-separated)</label>
                <input 
                  className="w-full border border-gray-200 p-2.5 rounded-lg focus:outline-none focus:ring-2 focus:ring-black/10" 
                  placeholder="e.g., frontend, urgent, bug" 
                  value={newTaskTags}
                  onChange={e => setNewTaskTags(e.target.value)}
                />
              </div>
              {error && (
                <div className="p-2 bg-red-50 border border-red-200 rounded text-xs text-red-600">
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
                    setError(null);
                  }} 
                  className="px-4 py-2 text-gray-600 hover:text-gray-800 transition-colors"
                >
                  Cancel
                </button>
                <button 
                  type="submit" 
                  className="px-4 py-2 bg-black text-white rounded-lg hover:bg-gray-800 transition-colors font-medium"
                >
                  Add Task
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Error Display */}
      {error && (
        <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg text-sm text-red-600">
          {error}
        </div>
      )}

      {/* Board */}
      <div className="flex-1 overflow-x-auto">
        <div className="flex gap-4 h-full min-w-[1200px]">
          {COLUMNS.map((col, colIdx) => {
            const columnTasks = tasks.filter(t => t.status === col.id);
            return (
              <div key={col.id} className="flex-1 bg-gray-50 rounded-lg flex flex-col max-h-full border border-gray-200">
                <div className="p-3 font-bold text-sm text-gray-600 uppercase tracking-wider border-b border-gray-200 flex justify-between items-center">
                  <span>{col.title}</span>
                  <span className="bg-gray-200 text-gray-700 px-2.5 py-0.5 rounded-full text-xs font-semibold">
                    {columnTasks.length}
                  </span>
                </div>
                <div className="p-2 flex-1 overflow-y-auto space-y-2">
                  {/* Quick Add Button in Backlog Column */}
                  {col.id === 'backlog' && (
                    <button
                      onClick={() => setIsAdding(true)}
                      className="w-full p-3 border-2 border-dashed border-gray-300 rounded-lg text-gray-400 hover:border-gray-400 hover:text-gray-600 transition-colors flex items-center justify-center gap-2 text-sm font-medium mb-2"
                    >
                      <Plus size={16} />
                      Add Task
                    </button>
                  )}
                  {/* Empty state */}
                  {tasks.length === 0 && col.id === 'backlog' && (
                    <div className="text-center py-8 text-gray-400 text-sm">
                      <p className="mb-1">No tasks yet</p>
                      <p className="text-xs">Click &quot;Add Task&quot; above to get started</p>
                    </div>
                  )}
                  {/* Show message if this column is empty but other columns have items */}
                  {tasks.length > 0 && columnTasks.length === 0 && (
                    <div className="text-center py-4 text-gray-400 text-xs">
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
                            className="text-gray-400 hover:text-black text-xs flex items-center gap-1"
                          >
                            <ArrowLeft size={14} />
                            Prev
                          </button>
                        ) : <div />}
                        
                        {colIdx < COLUMNS.length - 1 ? (
                          <button 
                            onClick={() => handleMove(task, 'next')} 
                            className="text-gray-400 hover:text-black text-xs flex items-center gap-1"
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
