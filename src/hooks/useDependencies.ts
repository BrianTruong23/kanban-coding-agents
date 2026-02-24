'use client';

import { useState, useEffect, useCallback, useMemo } from 'react';
import { TaskDependency } from '@/types/epic';
import { createClient } from '@/lib/supabase/client';
import { useAuth } from '@/contexts/AuthContext';

interface DbDependency {
  id: string;
  user_id: string;
  source_task_id: string;
  target_task_id: string;
  dependency_type: string;
  description: string | null;
  created_at: string;
}

const mapDbDependencyToTaskDependency = (dbDep: DbDependency): TaskDependency => ({
  id: dbDep.id,
  sourceTaskId: dbDep.source_task_id,
  targetTaskId: dbDep.target_task_id,
  dependencyType: dbDep.dependency_type as TaskDependency['dependencyType'],
  description: dbDep.description || undefined,
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

  const isLoaded = useMemo(() => {
    if (authLoading) return false;
    if (!user) return true;
    return hasFetched;
  }, [authLoading, user, hasFetched]);

  const addDependency = useCallback(async (dependency: Omit<TaskDependency, 'id' | 'createdAt'>) => {
    if (!user) {
      throw new Error('You must be logged in to add dependencies');
    }

    const { data, error } = await supabase
      .from('task_dependencies')
      .insert({
        user_id: user.id,
        source_task_id: dependency.sourceTaskId,
        target_task_id: dependency.targetTaskId,
        dependency_type: dependency.dependencyType,
        description: dependency.description || null,
      })
      .select()
      .single();

    if (error) {
      console.error('Error adding dependency:', error);
      throw new Error(error.message);
    }

    if (data) {
      setDependencies((prev) => [mapDbDependencyToTaskDependency(data), ...prev]);
    }
  }, [user, supabase]);

  const deleteDependency = useCallback(async (dependencyId: string) => {
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

  return {
    dependencies,
    addDependency,
    deleteDependency,
    isLoaded,
  };
};
