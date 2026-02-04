'use client';

import { useState, useEffect, useCallback, useRef, useMemo } from 'react';
import { Task } from '@/types/task';
import { createClient } from '@/lib/supabase/client';
import { useAuth } from '@/contexts/AuthContext';

interface DbTask {
  id: string;
  user_id: string;
  task_id: string;
  title: string;
  description: string | null;
  status: string;
  sprint: string | null;
  assigned_agent_id: string | null;
  priority: number;
  tags: string[];
  comments_count: number;
  attachments_count: number;
  created_at: string;
  updated_at: string;
}

const mapDbTaskToTask = (dbTask: DbTask): Task => ({
  id: dbTask.id,
  taskId: dbTask.task_id,
  title: dbTask.title,
  description: dbTask.description || '',
  status: dbTask.status as Task['status'],
  sprint: dbTask.sprint && dbTask.sprint.trim().length > 0 ? dbTask.sprint : undefined,
  assignedAgentId: dbTask.assigned_agent_id || undefined,
  priority: dbTask.priority as Task['priority'],
  tags: dbTask.tags || [],
  commentsCount: dbTask.comments_count,
  attachmentsCount: dbTask.attachments_count,
  createdAt: new Date(dbTask.created_at).getTime(),
  updatedAt: new Date(dbTask.updated_at).getTime(),
});

export const useTasks = () => {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [hasFetched, setHasFetched] = useState(false);
  const { user, isLoading: authLoading } = useAuth();
  const supabase = createClient();
  const fetchingRef = useRef(false);

  useEffect(() => {
    // Skip if auth is loading, already fetched, or currently fetching
    if (authLoading || hasFetched || fetchingRef.current || !user) return;

    fetchingRef.current = true;

    const fetchTasks = async () => {
      const { data, error } = await supabase
        .from('tasks')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) {
        console.error('Error fetching tasks:', error);
      } else {
        setTasks((data || []).map(mapDbTaskToTask));
      }
      setHasFetched(true);
      fetchingRef.current = false;
    };

    fetchTasks();
  }, [user, authLoading, hasFetched, supabase]);

  // Derived loading state
  const isLoaded = useMemo(() => {
    if (authLoading) return false;
    if (!user) return true; // No user = loaded with empty state
    return hasFetched;
  }, [authLoading, user, hasFetched]);

  const addTask = useCallback(async (task: Task) => {
    if (!user) return;

    const { data, error } = await supabase
      .from('tasks')
      .insert({
        user_id: user.id,
        task_id: task.taskId,
        title: task.title,
        description: task.description || null,
        status: task.status,
        sprint: task.sprint || null,
        assigned_agent_id: task.assignedAgentId || null,
        priority: task.priority,
        tags: task.tags,
        comments_count: task.commentsCount || 0,
        attachments_count: task.attachmentsCount || 0,
      })
      .select()
      .single();

    if (error) {
      console.error('Error adding task:', error);
      return;
    }

    if (data) {
      setTasks((prev) => [mapDbTaskToTask(data), ...prev]);
    }
  }, [user, supabase]);

  const updateTask = useCallback(async (updatedTask: Task) => {
    if (!user) return;

    const { error } = await supabase
      .from('tasks')
      .update({
        title: updatedTask.title,
        description: updatedTask.description || null,
        status: updatedTask.status,
        sprint: updatedTask.sprint || null,
        assigned_agent_id: updatedTask.assignedAgentId || null,
        priority: updatedTask.priority,
        tags: updatedTask.tags,
        comments_count: updatedTask.commentsCount || 0,
        attachments_count: updatedTask.attachmentsCount || 0,
      })
      .eq('id', updatedTask.id);

    if (error) {
      console.error('Error updating task:', error);
      return;
    }

    setTasks((prev) =>
      prev.map((t) => (t.id === updatedTask.id ? { ...updatedTask, updatedAt: Date.now() } : t))
    );
  }, [user, supabase]);

  const deleteTask = useCallback(async (taskId: string) => {
    if (!user) return;

    const { error } = await supabase
      .from('tasks')
      .delete()
      .eq('id', taskId);

    if (error) {
      console.error('Error deleting task:', error);
      return;
    }

    setTasks((prev) => prev.filter((t) => t.id !== taskId));
  }, [user, supabase]);

  return {
    tasks,
    addTask,
    updateTask,
    deleteTask,
    isLoaded,
  };
};
