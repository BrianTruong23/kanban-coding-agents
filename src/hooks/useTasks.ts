import { useState, useEffect } from 'react';
import { Task } from '@/types/task';
import { loadTasks, saveTasks } from '@/lib/storage';
import { generateTaskId } from '@/lib/utils';

export const useTasks = () => {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [isLoaded, setIsLoaded] = useState(false);

  useEffect(() => {
    const stored = loadTasks();
    // Ensure all tasks have taskId
    let maxTaskNumber = 0;
    stored.forEach(task => {
      if (task.taskId) {
        const match = task.taskId.match(/TASK-(\d+)/);
        if (match) {
          const num = parseInt(match[1], 10);
          if (num > maxTaskNumber) maxTaskNumber = num;
        }
      }
    });
    
    const tasksWithIds = stored.map((task) => {
      if (!task.taskId) {
        maxTaskNumber++;
        return { ...task, taskId: generateTaskId(maxTaskNumber) };
      }
      return task;
    });
    setTasks(tasksWithIds);
    setIsLoaded(true);
  }, []);

  useEffect(() => {
    if (isLoaded) {
      saveTasks(tasks);
    }
  }, [tasks, isLoaded]);

  const addTask = (task: Task) => {
    setTasks((prev) => [task, ...prev]);
  };

  const updateTask = (updatedTask: Task) => {
    setTasks((prev) =>
      prev.map((t) => (t.id === updatedTask.id ? { ...updatedTask, updatedAt: Date.now() } : t))
    );
  };

  const deleteTask = (taskId: string) => {
    setTasks((prev) => prev.filter((t) => t.id !== taskId));
  };

  return {
    tasks,
    addTask,
    updateTask,
    deleteTask,
    isLoaded,
  };
};
