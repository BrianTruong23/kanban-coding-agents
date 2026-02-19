'use client';

import { useState, useEffect, useCallback, useMemo } from 'react';
import { TaskDependency, DependencyType } from '@/types/task';
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
  dependencyType: db.dependency_type as DependencyType,
  createdAt: new Date(db.created_at).getTime(),
});

export const useTaskDependencies = () => {
  const [dependencies, setDependencies] = useState<TaskDependency[]>([]);
  const [isLoaded, setIsLoaded] = useState(false);
  const { user, isLoading: authLoading } = useAuth();
  const supabase = useMemo(() => createClient(), []);

  // Fetch dependencies
  useEffect(() => {
    if (authLoading || !user || isLoaded) return;

    const fetchDependencies = async () => {
      const { data, error } = await supabase
        .from('task_dependencies')
        .select('*');

      if (error) {
        console.error('Error fetching dependencies:', error);
      } else {
        setDependencies((data || []).map(mapDbDependency));
      }

      setIsLoaded(true);
    };

    fetchDependencies();
  }, [user, authLoading, isLoaded, supabase]);

  // Add dependency
  const addDependency = useCallback(async (
    taskId: string,
    dependsOnTaskId: string,
    dependencyType: DependencyType = 'blocks'
  ) => {
    if (!user) return;

    const { data, error } = await supabase
      .from('task_dependencies')
      .insert({
        user_id: user.id,
        task_id: taskId,
        depends_on_task_id: dependsOnTaskId,
        dependency_type: dependencyType,
      })
      .select()
      .single();

    if (error) {
      console.error('Error adding dependency:', error);
      throw error;
    }

    if (data) {
      setDependencies(prev => [...prev, mapDbDependency(data)]);
    }
  }, [user, supabase]);

  // Delete dependency
  const deleteDependency = useCallback(async (dependencyId: string) => {
    if (!user) return;

    const { error } = await supabase
      .from('task_dependencies')
      .delete()
      .eq('id', dependencyId);

    if (error) {
      console.error('Error deleting dependency:', error);
      throw error;
    }

    setDependencies(prev => prev.filter(d => d.id !== dependencyId));
  }, [user, supabase]);

  // Bulk add dependencies
  const addDependencies = useCallback(async (deps: Omit<TaskDependency, 'id' | 'createdAt'>[]) => {
    if (!user || deps.length === 0) return;

    const { data, error } = await supabase
      .from('task_dependencies')
      .insert(
        deps.map(d => ({
          user_id: user.id,
          task_id: d.taskId,
          depends_on_task_id: d.dependsOnTaskId,
          dependency_type: d.dependencyType,
        }))
      )
      .select();

    if (error) {
      console.error('Error adding dependencies:', error);
      throw error;
    }

    if (data) {
      setDependencies(prev => [...prev, ...data.map(mapDbDependency)]);
    }
  }, [user, supabase]);

  return {
    dependencies,
    addDependency,
    deleteDependency,
    addDependencies,
    isLoaded,
  };
};
