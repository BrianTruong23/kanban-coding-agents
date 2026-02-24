'use client';

import { useState, useEffect, useCallback, useMemo } from 'react';
import { TaskDependency, DependencyType } from '@/types/task';
import { createClient } from '@/lib/supabase/client';
import { useAuth } from '@/contexts/AuthContext';

interface DbDependency {
  id: string;
  user_id: string;
  task_id: string;
  depends_on_task_id: string;
  dependency_type: string;
  created_at: string;
}

const mapDbDependencyToDependency = (dbDep: DbDependency): TaskDependency => ({
  id: dbDep.id,
  taskId: dbDep.task_id,
  dependsOnTaskId: dbDep.depends_on_task_id,
  dependencyType: dbDep.dependency_type as DependencyType,
  createdAt: new Date(dbDep.created_at).getTime(),
});

export const useDependencies = () => {
  const [dependencies, setDependencies] = useState<TaskDependency[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const { user } = useAuth();
  const supabase = useMemo(() => createClient(), []);

  useEffect(() => {
    if (!user) {
      setIsLoading(false);
      return;
    }

    const fetchDependencies = async () => {
      setIsLoading(true);
      const { data, error } = await supabase
        .from('task_dependencies')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) {
        console.error('Error fetching dependencies:', error);
      } else {
        setDependencies((data || []).map(mapDbDependencyToDependency));
      }
      setIsLoading(false);
    };

    fetchDependencies();
  }, [user, supabase]);

  const addDependency = useCallback(async (
    taskId: string,
    dependsOnTaskId: string,
    dependencyType: DependencyType = 'blocked_by'
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
      return;
    }

    if (data) {
      setDependencies((prev) => [mapDbDependencyToDependency(data), ...prev]);
    }
  }, [user, supabase]);

  const removeDependency = useCallback(async (dependencyId: string) => {
    if (!user) return;

    const { error } = await supabase
      .from('task_dependencies')
      .delete()
      .eq('id', dependencyId);

    if (error) {
      console.error('Error removing dependency:', error);
      return;
    }

    setDependencies((prev) => prev.filter((d) => d.id !== dependencyId));
  }, [user, supabase]);

  const getDependenciesForTask = useCallback((taskId: string) => {
    return dependencies.filter(d => d.taskId === taskId || d.dependsOnTaskId === taskId);
  }, [dependencies]);

  const getBlockingTasks = useCallback((taskId: string) => {
    return dependencies
      .filter(d => d.taskId === taskId && d.dependencyType === 'blocked_by')
      .map(d => d.dependsOnTaskId);
  }, [dependencies]);

  const getBlockedTasks = useCallback((taskId: string) => {
    return dependencies
      .filter(d => d.dependsOnTaskId === taskId && d.dependencyType === 'blocked_by')
      .map(d => d.taskId);
  }, [dependencies]);

  return {
    dependencies,
    isLoading,
    addDependency,
    removeDependency,
    getDependenciesForTask,
    getBlockingTasks,
    getBlockedTasks,
  };
};
