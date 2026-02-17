import { useState, useEffect, useMemo } from 'react';
import { TaskDependency, DependencyType } from '@/types/task';
import { createClient } from '@/lib/supabase/client';

export function useTaskDependencies(userId?: string) {
  const [dependencies, setDependencies] = useState<TaskDependency[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const supabase = useMemo(() => createClient(), []);

  useEffect(() => {
    if (!userId) {
      setLoading(false);
      return;
    }

    loadDependencies();

    // Subscribe to changes
    const channel = supabase
      .channel('task_dependencies_changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'task_dependencies',
          filter: `user_id=eq.${userId}`,
        },
        () => {
          loadDependencies();
        }
      )
      .subscribe();

    return () => {
      channel.unsubscribe();
    };
  }, [userId, supabase]);

  async function loadDependencies() {
    try {
      setLoading(true);
      setError(null);

      const { data, error: fetchError } = await supabase
        .from('task_dependencies')
        .select('*')
        .order('created_at', { ascending: false });

      if (fetchError) throw fetchError;

      const mapped: TaskDependency[] = (data || []).map(row => ({
        id: row.id,
        taskId: row.task_id,
        dependsOnTaskId: row.depends_on_task_id,
        dependencyType: row.dependency_type as DependencyType,
        createdAt: new Date(row.created_at).getTime(),
      }));

      setDependencies(mapped);
    } catch (err) {
      console.error('Error loading task dependencies:', err);
      setError(err instanceof Error ? err.message : 'Failed to load dependencies');
    } finally {
      setLoading(false);
    }
  }

  async function addDependency(
    taskId: string,
    dependsOnTaskId: string,
    dependencyType: DependencyType = 'blocks'
  ) {
    try {
      const { data: userData } = await supabase.auth.getUser();
      if (!userData.user) throw new Error('Not authenticated');

      // Check for circular dependency
      if (hasCircularDependency(taskId, dependsOnTaskId)) {
        throw new Error('Cannot create circular dependency');
      }

      const { error: insertError } = await supabase.from('task_dependencies').insert({
        user_id: userData.user.id,
        task_id: taskId,
        depends_on_task_id: dependsOnTaskId,
        dependency_type: dependencyType,
      });

      if (insertError) throw insertError;

      await loadDependencies();
    } catch (err) {
      console.error('Error adding dependency:', err);
      throw err;
    }
  }

  async function removeDependency(dependencyId: string) {
    try {
      const { error: deleteError } = await supabase
        .from('task_dependencies')
        .delete()
        .eq('id', dependencyId);

      if (deleteError) throw deleteError;

      await loadDependencies();
    } catch (err) {
      console.error('Error removing dependency:', err);
      throw err;
    }
  }

  // Get dependencies for a specific task
  function getDependenciesForTask(taskId: string): TaskDependency[] {
    return dependencies.filter(dep => dep.taskId === taskId);
  }

  // Get tasks that depend on a specific task
  function getDependentTasks(taskId: string): TaskDependency[] {
    return dependencies.filter(dep => dep.dependsOnTaskId === taskId);
  }

  // Check if adding a dependency would create a circular dependency
  function hasCircularDependency(taskId: string, dependsOnTaskId: string): boolean {
    const visited = new Set<string>();
    const queue = [dependsOnTaskId];

    while (queue.length > 0) {
      const current = queue.shift()!;

      if (current === taskId) {
        return true; // Found a circular dependency
      }

      if (visited.has(current)) {
        continue;
      }

      visited.add(current);

      // Add all dependencies of the current task to the queue
      const deps = dependencies.filter(d => d.taskId === current);
      deps.forEach(dep => queue.push(dep.dependsOnTaskId));
    }

    return false;
  }

  // Get all blocked tasks (tasks that have dependencies)
  function getBlockedTasks(): string[] {
    return Array.from(new Set(dependencies.map(dep => dep.taskId)));
  }

  // Get dependency map for visualization
  const dependencyMap = useMemo(() => {
    const map = new Map<string, TaskDependency[]>();
    dependencies.forEach(dep => {
      const taskDeps = map.get(dep.taskId) || [];
      taskDeps.push(dep);
      map.set(dep.taskId, taskDeps);
    });
    return map;
  }, [dependencies]);

  // Get reverse dependency map (what depends on each task)
  const reverseDependencyMap = useMemo(() => {
    const map = new Map<string, TaskDependency[]>();
    dependencies.forEach(dep => {
      const dependents = map.get(dep.dependsOnTaskId) || [];
      dependents.push(dep);
      map.set(dep.dependsOnTaskId, dependents);
    });
    return map;
  }, [dependencies]);

  return {
    dependencies,
    dependencyMap,
    reverseDependencyMap,
    loading,
    error,
    addDependency,
    removeDependency,
    getDependenciesForTask,
    getDependentTasks,
    hasCircularDependency,
    getBlockedTasks,
    refresh: loadDependencies,
  };
}
