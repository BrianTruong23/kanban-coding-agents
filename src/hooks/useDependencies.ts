'use client';

import { useState, useEffect, useCallback, useMemo } from 'react';
import { TaskDependency, DependencyType } from '@/types/dependency';
import { createClient } from '@/lib/supabase/client';
import { useAuth } from '@/contexts/AuthContext';

interface DbDependency {
  id: string;
  source_task_id: string;
  target_task_id: string;
  dependency_type: string;
  created_at: string;
}

const mapDbDependencyToDependency = (dbDep: DbDependency): TaskDependency => ({
  id: dbDep.id,
  sourceTaskId: dbDep.source_task_id,
  targetTaskId: dbDep.target_task_id,
  type: dbDep.dependency_type as DependencyType,
  createdAt: new Date(dbDep.created_at).getTime(),
});

export const useDependencies = () => {
  const [dependencies, setDependencies] = useState<TaskDependency[]>([]);
  const [isLoaded, setIsLoaded] = useState(false);
  const { user, isLoading: authLoading } = useAuth();
  const supabase = useMemo(() => createClient(), []);

  useEffect(() => {
    if (authLoading || !user) return;

    const fetchDependencies = async () => {
      const { data, error } = await supabase
        .from('task_dependencies')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) {
        console.error('Error fetching dependencies:', error);
      } else {
        setDependencies((data || []).map(mapDbDependencyToDependency));
      }
      setIsLoaded(true);
    };

    fetchDependencies();
  }, [user, authLoading, supabase]);

  const addDependency = useCallback(
    async (dependency: Omit<TaskDependency, 'id' | 'createdAt'>) => {
      if (!user) return;

      const { data, error } = await supabase
        .from('task_dependencies')
        .insert({
          source_task_id: dependency.sourceTaskId,
          target_task_id: dependency.targetTaskId,
          dependency_type: dependency.type,
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
    },
    [user, supabase]
  );

  const deleteDependency = useCallback(
    async (dependencyId: string) => {
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
    },
    [user, supabase]
  );

  return {
    dependencies,
    addDependency,
    deleteDependency,
    isLoaded,
  };
};
