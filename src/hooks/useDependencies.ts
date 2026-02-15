'use client';

import { useState, useEffect, useCallback, useMemo } from 'react';
import { TaskDependency } from '@/types/dependency';
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

const mapDbDependencyToTaskDependency = (dbDep: DbDependency): TaskDependency => ({
  id: dbDep.id,
  taskId: dbDep.task_id,
  dependsOnTaskId: dbDep.depends_on_task_id,
  dependencyType: dbDep.dependency_type as TaskDependency['dependencyType'],
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
        .order('created_at', { ascending: false });

      if (error) {
        console.error('Error fetching dependencies:', error);
      } else {
        setDependencies((data || []).map(mapDbDependencyToTaskDependency));
      }
      setHasFetched(true);
    };

    fetchDependencies();
  }, [user, authLoading, hasFetched, supabase]);

  const addDependency = useCallback(
    async (dependency: Omit<TaskDependency, 'id' | 'createdAt'>) => {
      if (!user) return;

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
        return;
      }

      if (data) {
        setDependencies((prev) => [mapDbDependencyToTaskDependency(data), ...prev]);
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

  return {
    dependencies,
    addDependency,
    removeDependency,
    isLoaded: hasFetched,
  };
};
