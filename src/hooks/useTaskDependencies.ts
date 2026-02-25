import { useState, useEffect, useMemo } from 'react';
import { createClient } from '@/lib/supabase/client';
import { TaskDependency } from '@/types/task';
import { useAuth } from '@/contexts/AuthContext';

export function useTaskDependencies() {
  const [dependencies, setDependencies] = useState<TaskDependency[]>([]);
  const [isLoaded, setIsLoaded] = useState(false);
  const { user } = useAuth();
  const supabase = useMemo(() => createClient(), []);

  useEffect(() => {
    if (!user) {
      setDependencies([]);
      setIsLoaded(true);
      return;
    }

    loadDependencies();

    // Set up real-time subscription
    const channel = supabase
      .channel('task_dependencies_changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'task_dependencies',
          filter: `user_id=eq.${user.id}`
        },
        () => {
          loadDependencies();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [user, supabase]);

  const loadDependencies = async () => {
    if (!user) return;

    try {
      const { data, error } = await supabase
        .from('task_dependencies')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });

      if (error) throw error;

      const deps: TaskDependency[] = (data || []).map((dep: any) => ({
        id: dep.id,
        taskId: dep.task_id,
        dependsOnTaskId: dep.depends_on_task_id,
        dependencyType: dep.dependency_type,
        createdAt: new Date(dep.created_at).getTime()
      }));

      setDependencies(deps);
    } catch (error) {
      console.error('Error loading dependencies:', error);
    } finally {
      setIsLoaded(true);
    }
  };

  const addDependency = async (dependency: Omit<TaskDependency, 'id' | 'createdAt'>) => {
    if (!user) return;

    try {
      const { data, error } = await supabase
        .from('task_dependencies')
        .insert({
          user_id: user.id,
          task_id: dependency.taskId,
          depends_on_task_id: dependency.dependsOnTaskId,
          dependency_type: dependency.dependencyType
        })
        .select()
        .single();

      if (error) throw error;

      const newDep: TaskDependency = {
        id: data.id,
        taskId: data.task_id,
        dependsOnTaskId: data.depends_on_task_id,
        dependencyType: data.dependency_type,
        createdAt: new Date(data.created_at).getTime()
      };

      setDependencies(prev => [...prev, newDep]);
    } catch (error) {
      console.error('Error adding dependency:', error);
      throw error;
    }
  };

  const deleteDependency = async (id: string) => {
    if (!user) return;

    try {
      const { error } = await supabase
        .from('task_dependencies')
        .delete()
        .eq('id', id)
        .eq('user_id', user.id);

      if (error) throw error;

      setDependencies(prev => prev.filter(dep => dep.id !== id));
    } catch (error) {
      console.error('Error deleting dependency:', error);
      throw error;
    }
  };

  return {
    dependencies,
    isLoaded,
    addDependency,
    deleteDependency
  };
}
