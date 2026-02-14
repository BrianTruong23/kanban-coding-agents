'use client';

import { useState, useEffect, useCallback } from 'react';
import { BreakdownTask } from '@/types/breakdown';
import { useAuth } from '@/contexts/AuthContext';

const STORAGE_KEY = 'breakdown-tasks';

export const useBreakdownTasks = () => {
  const [tasks, setTasks] = useState<BreakdownTask[]>([]);
  const [isLoaded, setIsLoaded] = useState(false);
  const { user } = useAuth();

  useEffect(() => {
    if (!user) {
      setTasks([]);
      setIsLoaded(true);
      return;
    }

    const stored = localStorage.getItem(`${STORAGE_KEY}-${user.id}`);
    if (stored) {
      try {
        const parsedTasks = JSON.parse(stored) as BreakdownTask[];
        setTasks(parsedTasks);
      } catch (error) {
        console.error('Failed to parse breakdown tasks from localStorage:', error);
      }
    }

    setIsLoaded(true);
  }, [user]);

  useEffect(() => {
    if (!isLoaded || !user) return;
    localStorage.setItem(`${STORAGE_KEY}-${user.id}`, JSON.stringify(tasks));
  }, [tasks, isLoaded, user]);

  const addTasks = useCallback((newTasks: BreakdownTask[]) => {
    setTasks((prev) => [...prev, ...newTasks]);
  }, []);

  const updateTask = useCallback((updatedTask: BreakdownTask) => {
    setTasks((prev) =>
      prev.map((task) => (task.id === updatedTask.id ? updatedTask : task))
    );
  }, []);

  const deleteTask = useCallback((taskId: string) => {
    setTasks((prev) => prev.filter((task) => task.id !== taskId));
  }, []);

  const clearTasks = useCallback(() => {
    setTasks([]);
  }, []);

  return {
    tasks,
    isLoaded,
    addTasks,
    updateTask,
    deleteTask,
    clearTasks,
  };
};
