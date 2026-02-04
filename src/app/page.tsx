'use client';

import { useTasks } from '@/hooks/useTasks';
import { useAgents } from '@/hooks/useAgents';
import { KanbanBoard } from '@/components/KanbanBoard';
import { ThemeToggle } from '@/components/ThemeToggle';

export default function Home() {
  const { tasks, addTask, updateTask, deleteTask, isLoaded: tasksLoaded } = useTasks();
  const { agents, isLoaded: agentsLoaded } = useAgents();

  if (!tasksLoaded || !agentsLoaded) {
    return (
      <div className="flex items-center justify-center min-h-screen text-gray-400 dark:text-gray-500">
        Loading kanban board...
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-100 dark:bg-gray-900 p-4 transition-colors">
      <div className="fixed top-4 right-4 z-50">
        <ThemeToggle />
      </div>
      <main className="max-w-[1800px] mx-auto h-[calc(100vh-2rem)]">
        <KanbanBoard
          tasks={tasks}
          agents={agents}
          onAddTask={addTask}
          onUpdateTask={updateTask}
          onDeleteTask={deleteTask}
        />
      </main>
    </div>
  );
}
