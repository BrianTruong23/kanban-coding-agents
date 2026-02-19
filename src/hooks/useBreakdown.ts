'use client';

import { useState, useEffect, useMemo } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { createClient } from '@/lib/supabase/client';
import {
  Epic,
  Ticket,
  Subtask,
  TaskDependency,
  BreakdownResult,
} from '@/types/breakdown';

export function useBreakdown() {
  const { user } = useAuth();
  const [epics, setEpics] = useState<Epic[]>([]);
  const [tickets, setTickets] = useState<Ticket[]>([]);
  const [subtasks, setSubtasks] = useState<Subtask[]>([]);
  const [dependencies, setDependencies] = useState<TaskDependency[]>([]);
  const [isLoaded, setIsLoaded] = useState(false);

  const supabase = useMemo(() => createClient(), []);

  useEffect(() => {
    if (user) {
      loadBreakdown();
    }
  }, [user]);

  const loadBreakdown = async () => {
    if (!user) return;

    try {
      const [epicsRes, ticketsRes, subtasksRes, depsRes] = await Promise.all([
        supabase.from('epics').select('*').eq('user_id', user.id).order('created_at', { ascending: false }),
        supabase.from('tickets').select('*').eq('user_id', user.id).order('created_at', { ascending: false }),
        supabase.from('subtasks').select('*').eq('user_id', user.id).order('created_at', { ascending: false }),
        supabase.from('task_dependencies').select('*').eq('user_id', user.id),
      ]);

      if (epicsRes.data) {
        setEpics(
          epicsRes.data.map((e) => ({
            id: e.id,
            epicId: e.epic_id,
            title: e.title,
            description: e.description || '',
            status: e.status,
            priority: e.priority,
            sprint: e.sprint,
            tags: e.tags || [],
            estimatedStoryPoints: e.estimated_story_points,
            actualStoryPoints: e.actual_story_points,
            startDate: e.start_date ? new Date(e.start_date).getTime() : undefined,
            endDate: e.end_date ? new Date(e.end_date).getTime() : undefined,
            createdAt: new Date(e.created_at).getTime(),
            updatedAt: new Date(e.updated_at).getTime(),
            userId: e.user_id,
          }))
        );
      }

      if (ticketsRes.data) {
        setTickets(
          ticketsRes.data.map((t) => ({
            id: t.id,
            ticketId: t.ticket_id,
            epicId: t.epic_id,
            title: t.title,
            description: t.description || '',
            taskType: t.task_type,
            status: t.status,
            priority: t.priority,
            sprint: t.sprint,
            assignedAgentId: t.assigned_agent_id,
            tags: t.tags || [],
            estimatedHours: t.estimated_hours ? parseFloat(t.estimated_hours) : undefined,
            actualHours: t.actual_hours ? parseFloat(t.actual_hours) : undefined,
            definitionOfDone: t.definition_of_done || [],
            testNotes: t.test_notes || [],
            riskFlags: t.risk_flags || [],
            createdAt: new Date(t.created_at).getTime(),
            updatedAt: new Date(t.updated_at).getTime(),
            userId: t.user_id,
          }))
        );
      }

      if (subtasksRes.data) {
        setSubtasks(
          subtasksRes.data.map((s) => ({
            id: s.id,
            subtaskId: s.subtask_id,
            parentTicketId: s.parent_ticket_id,
            title: s.title,
            description: s.description || '',
            status: s.status,
            assignedAgentId: s.assigned_agent_id,
            estimatedMinutes: s.estimated_minutes,
            actualMinutes: s.actual_minutes,
            createdAt: new Date(s.created_at).getTime(),
            updatedAt: new Date(s.updated_at).getTime(),
            userId: s.user_id,
          }))
        );
      }

      if (depsRes.data) {
        setDependencies(
          depsRes.data.map((d) => ({
            id: d.id,
            sourceTaskId: d.source_task_id,
            targetTaskId: d.target_task_id,
            dependencyType: d.dependency_type,
            createdAt: new Date(d.created_at).getTime(),
          }))
        );
      }

      setIsLoaded(true);
    } catch (error) {
      console.error('Error loading breakdown data:', error);
    }
  };

  const createBreakdown = async (result: BreakdownResult) => {
    if (!user) return;

    try {
      // Insert epic if provided
      if (result.epic) {
        const { data: epicData } = await supabase
          .from('epics')
          .insert({
            user_id: user.id,
            epic_id: result.epic.epicId,
            title: result.epic.title,
            description: result.epic.description,
            status: result.epic.status,
            priority: result.epic.priority,
            sprint: result.epic.sprint,
            tags: result.epic.tags,
            estimated_story_points: result.epic.estimatedStoryPoints,
          })
          .select()
          .single();

        if (epicData) {
          setEpics((prev) => [
            {
              ...result.epic!,
              id: epicData.id,
              createdAt: new Date(epicData.created_at).getTime(),
              updatedAt: new Date(epicData.updated_at).getTime(),
            },
            ...prev,
          ]);
        }
      }

      // Insert tickets
      if (result.tickets.length > 0) {
        const ticketsToInsert = result.tickets.map((t) => ({
          user_id: user.id,
          ticket_id: t.ticketId,
          epic_id: t.epicId,
          title: t.title,
          description: t.description,
          task_type: t.taskType,
          status: t.status,
          priority: t.priority,
          sprint: t.sprint,
          assigned_agent_id: t.assignedAgentId,
          tags: t.tags,
          estimated_hours: t.estimatedHours,
          definition_of_done: t.definitionOfDone,
          test_notes: t.testNotes,
          risk_flags: t.riskFlags,
        }));

        const { data: ticketsData } = await supabase
          .from('tickets')
          .insert(ticketsToInsert)
          .select();

        if (ticketsData) {
          setTickets((prev) => [
            ...ticketsData.map((t, idx) => ({
              ...result.tickets[idx],
              id: t.id,
              createdAt: new Date(t.created_at).getTime(),
              updatedAt: new Date(t.updated_at).getTime(),
            })),
            ...prev,
          ]);
        }
      }

      // Insert subtasks
      if (result.subtasks.length > 0) {
        const subtasksToInsert = result.subtasks.map((s) => ({
          user_id: user.id,
          subtask_id: s.subtaskId,
          parent_ticket_id: s.parentTicketId,
          title: s.title,
          description: s.description,
          status: s.status,
          assigned_agent_id: s.assignedAgentId,
          estimated_minutes: s.estimatedMinutes,
        }));

        const { data: subtasksData } = await supabase
          .from('subtasks')
          .insert(subtasksToInsert)
          .select();

        if (subtasksData) {
          setSubtasks((prev) => [
            ...subtasksData.map((s, idx) => ({
              ...result.subtasks[idx],
              id: s.id,
              createdAt: new Date(s.created_at).getTime(),
              updatedAt: new Date(s.updated_at).getTime(),
            })),
            ...prev,
          ]);
        }
      }

      // Insert dependencies
      if (result.dependencies.length > 0) {
        const depsToInsert = result.dependencies.map((d) => ({
          user_id: user.id,
          source_task_id: d.sourceTaskId,
          target_task_id: d.targetTaskId,
          dependency_type: d.dependencyType,
        }));

        const { data: depsData } = await supabase
          .from('task_dependencies')
          .insert(depsToInsert)
          .select();

        if (depsData) {
          setDependencies((prev) => [
            ...depsData.map((d, idx) => ({
              ...result.dependencies[idx],
              id: d.id,
              createdAt: new Date(d.created_at).getTime(),
            })),
            ...prev,
          ]);
        }
      }
    } catch (error) {
      console.error('Error creating breakdown:', error);
      throw error;
    }
  };

  const updateTicket = async (ticket: Ticket) => {
    if (!user) return;

    try {
      const { error } = await supabase
        .from('tickets')
        .update({
          title: ticket.title,
          description: ticket.description,
          status: ticket.status,
          priority: ticket.priority,
          sprint: ticket.sprint,
          assigned_agent_id: ticket.assignedAgentId,
          tags: ticket.tags,
          estimated_hours: ticket.estimatedHours,
          actual_hours: ticket.actualHours,
          definition_of_done: ticket.definitionOfDone,
          test_notes: ticket.testNotes,
          risk_flags: ticket.riskFlags,
        })
        .eq('id', ticket.id);

      if (!error) {
        setTickets((prev) =>
          prev.map((t) => (t.id === ticket.id ? { ...ticket, updatedAt: Date.now() } : t))
        );
      }
    } catch (error) {
      console.error('Error updating ticket:', error);
    }
  };

  const deleteTicket = async (id: string) => {
    if (!user) return;

    try {
      const { error } = await supabase.from('tickets').delete().eq('id', id);

      if (!error) {
        setTickets((prev) => prev.filter((t) => t.id !== id));
      }
    } catch (error) {
      console.error('Error deleting ticket:', error);
    }
  };

  const addDependency = async (dependency: Omit<TaskDependency, 'id' | 'createdAt'>) => {
    if (!user) return;

    try {
      const { data, error } = await supabase
        .from('task_dependencies')
        .insert({
          user_id: user.id,
          source_task_id: dependency.sourceTaskId,
          target_task_id: dependency.targetTaskId,
          dependency_type: dependency.dependencyType,
        })
        .select()
        .single();

      if (data && !error) {
        setDependencies((prev) => [
          ...prev,
          {
            id: data.id,
            sourceTaskId: data.source_task_id,
            targetTaskId: data.target_task_id,
            dependencyType: data.dependency_type,
            createdAt: new Date(data.created_at).getTime(),
          },
        ]);
      }
    } catch (error) {
      console.error('Error adding dependency:', error);
    }
  };

  const removeDependency = async (id: string) => {
    if (!user) return;

    try {
      const { error } = await supabase.from('task_dependencies').delete().eq('id', id);

      if (!error) {
        setDependencies((prev) => prev.filter((d) => d.id !== id));
      }
    } catch (error) {
      console.error('Error removing dependency:', error);
    }
  };

  return {
    epics,
    tickets,
    subtasks,
    dependencies,
    isLoaded,
    createBreakdown,
    updateTicket,
    deleteTicket,
    addDependency,
    removeDependency,
    reload: loadBreakdown,
  };
}
