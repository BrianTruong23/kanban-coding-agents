'use client';

import { useState, useEffect, useCallback, useMemo } from 'react';
import { TaskDependency } from '@/types/task';
import { createClient } from '@/lib/supabase/client';
import { useAuth } from '@/contexts/AuthContext';

interface DbTaskDependency {
  id: string;
  user_id: string;
  task_id: string;
  depends_on_task_id: string;
  dependency_type: string;
  created_at: string;
}

const mapDbDependency = (db: DbTaskDependency): TaskDependency => ({
  id: db.id,
  taskId: db.task_id,
  dependsOnTaskId: db.depends_on_task_id,
  dependencyType: db.dependency_type as TaskDependency['dependencyType'],
  createdAt: new Date(db.created_at).getTime(),
});

export const useDependencies = () => {
  const [dependencies, setDependencies] = useState<TaskDependency[]>([]);
  const [hasFetched, setHasFetched] = useState(false);
  const { user, isLoading: authLoading } = useAuth();
  const supabase = useMemo(() => createClient(), []);

  useEffect(() => {
    if (authLoading || hasFetched || !user) return;

    const fetchDependencies = async () => {
      const { data, error } = await supabase
        .from('task_dependencies')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) {
        console.error('Error fetching dependencies:', error);
      } else {
        setDependencies((data || []).map(mapDbDependency));
      }
      setHasFetched(true);
    };

    fetchDependencies();
  }, [user, authLoading, hasFetched, supabase]);

  const addDependency = useCallback(async (dependency: Omit<TaskDependency, 'id' | 'createdAt'>) => {
    if (!user) {
      throw new Error('You must be logged in');
    }

    const { data, error } = await supabase
      .from('task_dependencies')
      .insert({
        user_id: user.id,
        task_id: dependency.taskId,
        depends_on_task_id: dependency.dependsOnTaskId,
        dependency_type: dependency.dependencyType,
      })
      .select()
      .single();

    if (error) {
      console.error('Error adding dependency:', error);
      throw new Error(error.message);
    }

    if (data) {
      setDependencies((prev) => [mapDbDependency(data), ...prev]);
    }
  }, [user, supabase]);

  const removeDependency = useCallback(async (dependencyId: string) => {
    if (!user) return;

    const { error } = await supabase
      .from('task_dependencies')
      .delete()
      .eq('id', dependencyId);

    if (error) {
      console.error('Error deleting dependency:', error);
      return;
    }

    setDependencies((prev) => prev.filter((d) => d.id !== dependencyId));
  }, [user, supabase]);

  const getDependenciesForTask = useCallback((taskId: string) => {
    return dependencies.filter(d => d.taskId === taskId);
  }, [dependencies]);

  const getBlockedByTasks = useCallback((taskId: string) => {
    return dependencies.filter(d => d.taskId === taskId);
  }, [dependencies]);

  const getBlockingTasks = useCallback((taskId: string) => {
    return dependencies.filter(d => d.dependsOnTaskId === taskId);
  }, [dependencies]);

  return {
    dependencies,
    addDependency,
    removeDependency,
    getDependenciesForTask,
    getBlockedByTasks,
    getBlockingTasks,
    isLoaded: !authLoading && (hasFetched || !user),
  };
};
