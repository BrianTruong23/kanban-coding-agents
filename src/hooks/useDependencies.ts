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

const mapDbDependency = (db: DbDependency): TaskDependency => ({
  id: db.id,
  taskId: db.task_id,
  dependsOnTaskId: db.depends_on_task_id,
  dependencyType: db.dependency_type as DependencyType,
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

  const addDependency = useCallback(
    async (taskId: string, dependsOnTaskId: string, type: DependencyType = 'blocks') => {
      if (!user) {
        throw new Error('You must be logged in to add dependencies');
      }

      const { data, error } = await supabase
        .from('task_dependencies')
        .insert({
          user_id: user.id,
          task_id: taskId,
          depends_on_task_id: dependsOnTaskId,
          dependency_type: type,
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
    },
    [user, supabase]
  );

  const removeDependency = useCallback(
    async (dependencyId: string) => {
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
    },
    [user, supabase]
  );

  const getDependenciesForTask = useCallback(
    (taskId: string) => {
      return dependencies.filter((d) => d.taskId === taskId || d.dependsOnTaskId === taskId);
    },
    [dependencies]
  );

  return {
    dependencies,
    addDependency,
    removeDependency,
    getDependenciesForTask,
    isLoaded: !authLoading && hasFetched,
  };
};
