'use client';

import { useState, useEffect, useCallback, useMemo } from 'react';
import { TaskDependency } from '@/types/dependencies';
import { createClient } from '@/lib/supabase/client';
import { useAuth } from '@/contexts/AuthContext';

interface DbDependency {
  id: string;
  user_id: string;
  source_task_id: string;
  target_task_id: string;
  dependency_type: string;
  created_at: string;
}

const mapDbDependency = (db: DbDependency): TaskDependency => ({
  id: db.id,
  sourceTaskId: db.source_task_id,
  targetTaskId: db.target_task_id,
  type: db.dependency_type as TaskDependency['type'],
  createdAt: new Date(db.created_at).getTime(),
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
        setDependencies((data || []).map(mapDbDependency));
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
          user_id: user.id,
          source_task_id: dependency.sourceTaskId,
          target_task_id: dependency.targetTaskId,
          dependency_type: dependency.type,
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
    async (id: string) => {
      if (!user) return;

      const { error } = await supabase
        .from('task_dependencies')
        .delete()
        .eq('id', id);

      if (error) {
        console.error('Error removing dependency:', error);
        return;
      }

      setDependencies((prev) => prev.filter((d) => d.id !== id));
    },
    [user, supabase]
  );

  const getDependenciesForTask = useCallback(
    (taskId: string) => {
      return dependencies.filter(
        (d) => d.sourceTaskId === taskId || d.targetTaskId === taskId
      );
    },
    [dependencies]
  );

  return {
    dependencies,
    addDependency,
    removeDependency,
    getDependenciesForTask,
    isLoaded,
  };
};
