'use client';

import { useTasks } from '@/hooks/useTasks';
import { useAgents } from '@/hooks/useAgents';
import { KanbanBoard } from '@/components/KanbanBoard';

export default function Home() {
  const { tasks, addTask, updateTask, deleteTask, isLoaded: tasksLoaded } = useTasks();
  const { agents, isLoaded: agentsLoaded } = useAgents();

  if (!tasksLoaded || !agentsLoaded) {
    return (
      <div className="flex items-center justify-center min-h-screen text-gray-400">
        Loading kanban board...
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-100 p-4">
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
