import { useState, useEffect, useMemo } from 'react';
import { createClient } from '@/lib/supabase/client';
import type { TaskDependency, DependencyType } from '@/types/task';

export function useDependencies(userId: string | undefined) {
  const [dependencies, setDependencies] = useState<TaskDependency[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const supabase = useMemo(() => createClient(), []);

  useEffect(() => {
    if (!userId) {
      setDependencies([]);
      setLoading(false);
      return;
    }

    loadDependencies();

    // Subscribe to real-time changes
    const channel = supabase
      .channel('task_dependencies_changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'task_dependencies',
          filter: `user_id=eq.${userId}`,
        },
        () => {
          loadDependencies();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [userId, supabase]);

  const loadDependencies = async () => {
    if (!userId) return;

    try {
      setLoading(true);
      setError(null);

      const { data, error: fetchError } = await supabase
        .from('task_dependencies')
        .select('*')
        .eq('user_id', userId)
        .order('created_at', { ascending: false });

      if (fetchError) throw fetchError;

      const mappedDeps: TaskDependency[] = (data || []).map((row) => ({
        id: row.id,
        taskId: row.task_id,
        dependsOnTaskId: row.depends_on_task_id,
        dependencyType: row.dependency_type as DependencyType,
        createdAt: new Date(row.created_at).getTime(),
      }));

      setDependencies(mappedDeps);
    } catch (err) {
      console.error('Error loading dependencies:', err);
      setError(err instanceof Error ? err.message : 'Failed to load dependencies');
    } finally {
      setLoading(false);
    }
  };

  const addDependency = async (
    dep: Omit<TaskDependency, 'id' | 'createdAt'>
  ) => {
    if (!userId) throw new Error('User not authenticated');

    // Prevent self-dependency
    if (dep.taskId === dep.dependsOnTaskId) {
      throw new Error('A task cannot depend on itself');
    }

    try {
      const { data, error: insertError } = await supabase
        .from('task_dependencies')
        .insert({
          user_id: userId,
          task_id: dep.taskId,
          depends_on_task_id: dep.dependsOnTaskId,
          dependency_type: dep.dependencyType,
        })
        .select()
        .single();

      if (insertError) throw insertError;

      const newDep: TaskDependency = {
        id: data.id,
        taskId: data.task_id,
        dependsOnTaskId: data.depends_on_task_id,
        dependencyType: data.dependency_type as DependencyType,
        createdAt: new Date(data.created_at).getTime(),
      };

      setDependencies((prev) => [...prev, newDep]);
    } catch (err) {
      console.error('Error adding dependency:', err);
      throw err;
    }
  };

  const removeDependency = async (dependencyId: string) => {
    if (!userId) throw new Error('User not authenticated');

    try {
      const { error: deleteError } = await supabase
        .from('task_dependencies')
        .delete()
        .eq('id', dependencyId)
        .eq('user_id', userId);

      if (deleteError) throw deleteError;

      setDependencies((prev) => prev.filter((d) => d.id !== dependencyId));
    } catch (err) {
      console.error('Error removing dependency:', err);
      throw err;
    }
  };

  return {
    dependencies,
    loading,
    error,
    addDependency,
    removeDependency,
    refresh: loadDependencies,
  };
}
