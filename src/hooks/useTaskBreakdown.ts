import { useState, useCallback } from 'react';
import { createClient } from '@/lib/supabase/client';
import { Task } from '@/types/task';
import { TaskHierarchy, TaskDependency } from '@/types/task-breakdown';
import { AgentSkill } from '@/types/agent-skills';

export function useTaskBreakdown(userId: string) {
  const [hierarchies, setHierarchies] = useState<TaskHierarchy[]>([]);
  const [dependencies, setDependencies] = useState<TaskDependency[]>([]);
  const [loading, setLoading] = useState(false);

  const supabase = createClient();

  const fetchHierarchies = useCallback(async () => {
    try {
      const { data, error } = await supabase
        .from('task_hierarchy')
        .select('*')
        .eq('user_id', userId)
        .order('position');

      if (error) throw error;

      const converted: TaskHierarchy[] = (data || []).map((item) => ({
        id: item.id,
        userId: item.user_id,
        taskId: item.task_id,
        parentId: item.parent_id,
        hierarchyType: item.hierarchy_type,
        position: item.position,
        definitionOfDone: item.definition_of_done,
        testNotes: item.test_notes,
        riskFlags: item.risk_flags || [],
        estimatedEffort: item.estimated_effort,
        createdAt: new Date(item.created_at).getTime(),
        updatedAt: new Date(item.updated_at).getTime(),
      }));

      setHierarchies(converted);
    } catch (error) {
      console.error('Error fetching hierarchies:', error);
    }
  }, [userId, supabase]);

  const fetchDependencies = useCallback(async () => {
    try {
      const { data, error } = await supabase
        .from('task_dependencies')
        .select('*')
        .eq('user_id', userId);

      if (error) throw error;

      const converted: TaskDependency[] = (data || []).map((item) => ({
        id: item.id,
        userId: item.user_id,
        taskId: item.task_id,
        dependsOnTaskId: item.depends_on_task_id,
        dependencyType: item.dependency_type,
        createdAt: new Date(item.created_at).getTime(),
      }));

      setDependencies(converted);
    } catch (error) {
      console.error('Error fetching dependencies:', error);
    }
  }, [userId, supabase]);

  const createBulkTasksWithMetadata = useCallback(
    async (
      tasks: Task[],
      hierarchies: TaskHierarchy[],
      dependencies: TaskDependency[],
      assignments: Map<string, string>
    ) => {
      setLoading(true);
      try {
        // Insert tasks
        const tasksToInsert = tasks.map((task) => ({
          user_id: userId,
          task_id: task.taskId,
          title: task.title,
          description: task.description,
          status: task.status,
          priority: task.priority,
          tags: task.tags,
          sprint: task.sprint,
          assigned_agent_id: assignments.get(task.id) || null,
          comments_count: 0,
          attachments_count: 0,
        }));

        const { data: insertedTasks, error: tasksError } = await supabase
          .from('tasks')
          .insert(tasksToInsert)
          .select();

        if (tasksError) throw tasksError;

        // Create mapping from temporary IDs to actual database IDs
        const idMapping = new Map<string, string>();
        tasks.forEach((task, index) => {
          if (insertedTasks[index]) {
            idMapping.set(task.id, insertedTasks[index].id);
          }
        });

        // Insert hierarchies with mapped IDs
        const hierarchiesToInsert = hierarchies.map((h) => ({
          user_id: userId,
          task_id: idMapping.get(h.taskId) || h.taskId,
          parent_id: h.parentId ? idMapping.get(h.parentId) : null,
          hierarchy_type: h.hierarchyType,
          position: h.position,
          definition_of_done: h.definitionOfDone,
          test_notes: h.testNotes,
          risk_flags: h.riskFlags,
          estimated_effort: h.estimatedEffort,
        }));

        const { error: hierarchiesError } = await supabase
          .from('task_hierarchy')
          .insert(hierarchiesToInsert);

        if (hierarchiesError) throw hierarchiesError;

        // Insert dependencies with mapped IDs
        if (dependencies.length > 0) {
          const dependenciesToInsert = dependencies.map((d) => ({
            user_id: userId,
            task_id: idMapping.get(d.taskId) || d.taskId,
            depends_on_task_id: idMapping.get(d.dependsOnTaskId) || d.dependsOnTaskId,
            dependency_type: d.dependencyType,
          }));

          const { error: dependenciesError } = await supabase
            .from('task_dependencies')
            .insert(dependenciesToInsert);

          if (dependenciesError) throw dependenciesError;
        }

        // Refresh data
        await fetchHierarchies();
        await fetchDependencies();

        return insertedTasks;
      } catch (error) {
        console.error('Error creating bulk tasks:', error);
        throw error;
      } finally {
        setLoading(false);
      }
    },
    [userId, supabase, fetchHierarchies, fetchDependencies]
  );

  return {
    hierarchies,
    dependencies,
    loading,
    fetchHierarchies,
    fetchDependencies,
    createBulkTasksWithMetadata,
  };
}
