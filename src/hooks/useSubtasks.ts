'use client';

import { useState, useEffect, useCallback, useMemo } from 'react';
import { Subtask } from '@/types/subtask';
import { createClient } from '@/lib/supabase/client';
import { useAuth } from '@/contexts/AuthContext';

interface DbSubtask {
  id: string;
  parent_task_id: string;
  title: string;
  description: string | null;
  completed: boolean;
  assigned_agent_id: string | null;
  estimated_hours: number | null;
  actual_hours: number | null;
  created_at: string;
  updated_at: string;
}

const mapDbSubtaskToSubtask = (dbSubtask: DbSubtask): Subtask => ({
  id: dbSubtask.id,
  parentTaskId: dbSubtask.parent_task_id,
  title: dbSubtask.title,
  description: dbSubtask.description || '',
  completed: dbSubtask.completed,
  assignedAgentId: dbSubtask.assigned_agent_id || undefined,
  estimatedHours: dbSubtask.estimated_hours || undefined,
  actualHours: dbSubtask.actual_hours || undefined,
  createdAt: new Date(dbSubtask.created_at).getTime(),
  updatedAt: new Date(dbSubtask.updated_at).getTime(),
});

export const useSubtasks = (taskId?: string) => {
  const [subtasks, setSubtasks] = useState<Subtask[]>([]);
  const [isLoaded, setIsLoaded] = useState(false);
  const { user, isLoading: authLoading } = useAuth();
  const supabase = useMemo(() => createClient(), []);

  useEffect(() => {
    if (authLoading || !user || !taskId) return;

    const fetchSubtasks = async () => {
      const { data, error } = await supabase
        .from('subtasks')
        .select('*')
        .eq('parent_task_id', taskId)
        .order('created_at', { ascending: true });

      if (error) {
        console.error('Error fetching subtasks:', error);
      } else {
        setSubtasks((data || []).map(mapDbSubtaskToSubtask));
      }
      setIsLoaded(true);
    };

    fetchSubtasks();
  }, [user, authLoading, taskId, supabase]);

  const addSubtask = useCallback(async (subtask: Omit<Subtask, 'id' | 'createdAt' | 'updatedAt'>) => {
    if (!user) return;

    const { data, error } = await supabase
      .from('subtasks')
      .insert({
        parent_task_id: subtask.parentTaskId,
        title: subtask.title,
        description: subtask.description || null,
        completed: subtask.completed,
        assigned_agent_id: subtask.assignedAgentId || null,
        estimated_hours: subtask.estimatedHours || null,
        actual_hours: subtask.actualHours || null,
      })
      .select()
      .single();

    if (error) {
      console.error('Error adding subtask:', error);
      return;
    }

    if (data) {
      setSubtasks((prev) => [...prev, mapDbSubtaskToSubtask(data)]);
    }
  }, [user, supabase]);

  const updateSubtask = useCallback(async (updatedSubtask: Subtask) => {
    if (!user) return;

    const { error } = await supabase
      .from('subtasks')
      .update({
        title: updatedSubtask.title,
        description: updatedSubtask.description || null,
        completed: updatedSubtask.completed,
        assigned_agent_id: updatedSubtask.assignedAgentId || null,
        estimated_hours: updatedSubtask.estimatedHours || null,
        actual_hours: updatedSubtask.actualHours || null,
      })
      .eq('id', updatedSubtask.id);

    if (error) {
      console.error('Error updating subtask:', error);
      return;
    }

    setSubtasks((prev) =>
      prev.map((s) => (s.id === updatedSubtask.id ? { ...updatedSubtask, updatedAt: Date.now() } : s))
    );
  }, [user, supabase]);

  const deleteSubtask = useCallback(async (subtaskId: string) => {
    if (!user) return;

    const { error } = await supabase
      .from('subtasks')
      .delete()
      .eq('id', subtaskId);

    if (error) {
      console.error('Error deleting subtask:', error);
      return;
    }

    setSubtasks((prev) => prev.filter((s) => s.id !== subtaskId));
  }, [user, supabase]);

  return {
    subtasks,
    addSubtask,
    updateSubtask,
    deleteSubtask,
    isLoaded,
  };
};
