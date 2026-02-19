'use client';

import { useState, useEffect, useCallback, useMemo } from 'react';
import { TaskDependency, DependencyType } from '@/types/dependency';
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

const mapDbDepToDep = (dbDep: DbTaskDependency): TaskDependency => ({
  id: dbDep.id,
  taskId: dbDep.task_id,
  dependsOnTaskId: dbDep.depends_on_task_id,
  dependencyType: dbDep.dependency_type as DependencyType,
  createdAt: new Date(dbDep.created_at).getTime(),
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
        .order('created_at', { ascending: true });

      if (error) {
        console.error('Error fetching dependencies:', error);
      } else {
        setDependencies((data || []).map(mapDbDepToDep));
      }
      setHasFetched(true);
    };

    fetchDependencies();
  }, [user, authLoading, hasFetched, supabase]);

  const addDependency = useCallback(async (dep: Omit<TaskDependency, 'id' | 'createdAt'>) => {
    if (!user) return;

    const { data, error } = await supabase
      .from('task_dependencies')
      .insert({
        user_id: user.id,
        task_id: dep.taskId,
        depends_on_task_id: dep.dependsOnTaskId,
        dependency_type: dep.dependencyType,
      })
      .select()
      .single();

    if (error) {
      console.error('Error adding dependency:', error);
      return;
    }

    if (data) {
      setDependencies((prev) => [...prev, mapDbDepToDep(data)]);
    }
  }, [user, supabase]);

  const deleteDependency = useCallback(async (depId: string) => {
    if (!user) return;

    const { error } = await supabase
      .from('task_dependencies')
      .delete()
      .eq('id', depId);

    if (error) {
      console.error('Error deleting dependency:', error);
      return;
    }

    setDependencies((prev) => prev.filter((d) => d.id !== depId));
  }, [user, supabase]);

  return {
    dependencies,
    addDependency,
    deleteDependency,
    isLoaded: hasFetched,
  };
};
