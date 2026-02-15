'use client';

import { useState, useEffect, useCallback, useMemo } from 'react';
import { Epic, Ticket, Subtask, TaskDependency, AgentSkill, AgentPerformance } from '@/types/breakdown';
import { createClient } from '@/lib/supabase/client';
import { useAuth } from '@/contexts/AuthContext';

// Database type mappings
interface DbEpic {
  id: string;
  user_id: string;
  title: string;
  description: string;
  objectives: string[];
  acceptance_criteria: string[];
  risk_level: string;
  risk_notes: string | null;
  estimated_effort: number;
  status: string;
  created_at: string;
  updated_at: string;
}

interface DbTicket {
  id: string;
  epic_id: string | null;
  user_id: string;
  ticket_id: string;
  title: string;
  description: string;
  definition_of_done: string[];
  test_notes: string[];
  technical_notes: string | null;
  risk_level: string;
  risk_flags: string[];
  assigned_agent_id: string | null;
  estimated_effort: number;
  actual_effort: number | null;
  priority: number;
  required_skills: string[];
  status: string;
  tags: string[];
  created_at: string;
  updated_at: string;
}

interface DbSubtask {
  id: string;
  ticket_id: string;
  user_id: string;
  title: string;
  description: string | null;
  assigned_agent_id: string | null;
  estimated_effort: number;
  actual_effort: number | null;
  completed: boolean;
  created_at: string;
  updated_at: string;
}

interface DbDependency {
  id: string;
  user_id: string;
  source_id: string;
  source_type: string;
  target_id: string;
  target_type: string;
  dependency_type: string;
  created_at: string;
}

interface DbAgentSkill {
  id: string;
  agent_id: string;
  user_id: string;
  skill_category: string;
  proficiency_level: number;
  created_at: string;
  updated_at: string;
}

interface DbAgentPerformance {
  id: string;
  agent_id: string;
  user_id: string;
  tasks_completed: number;
  average_completion_time: number;
  quality_score: number;
  on_time_delivery: number;
  last_updated: string;
}

// Mappers
const mapDbEpic = (db: DbEpic): Epic => ({
  id: db.id,
  userId: db.user_id,
  title: db.title,
  description: db.description,
  objectives: db.objectives,
  acceptanceCriteria: db.acceptance_criteria,
  riskLevel: db.risk_level as Epic['riskLevel'],
  riskNotes: db.risk_notes || undefined,
  estimatedEffort: db.estimated_effort,
  status: db.status as Epic['status'],
  createdAt: new Date(db.created_at).getTime(),
  updatedAt: new Date(db.updated_at).getTime(),
});

const mapDbTicket = (db: DbTicket): Ticket => ({
  id: db.id,
  epicId: db.epic_id || undefined,
  userId: db.user_id,
  ticketId: db.ticket_id,
  title: db.title,
  description: db.description,
  definitionOfDone: db.definition_of_done,
  testNotes: db.test_notes,
  technicalNotes: db.technical_notes || undefined,
  riskLevel: db.risk_level as Ticket['riskLevel'],
  riskFlags: db.risk_flags,
  assignedAgentId: db.assigned_agent_id || undefined,
  estimatedEffort: db.estimated_effort,
  actualEffort: db.actual_effort || undefined,
  priority: db.priority as Ticket['priority'],
  requiredSkills: db.required_skills as Ticket['requiredSkills'],
  status: db.status as Ticket['status'],
  tags: db.tags,
  createdAt: new Date(db.created_at).getTime(),
  updatedAt: new Date(db.updated_at).getTime(),
});

const mapDbSubtask = (db: DbSubtask): Subtask => ({
  id: db.id,
  ticketId: db.ticket_id,
  userId: db.user_id,
  title: db.title,
  description: db.description || undefined,
  assignedAgentId: db.assigned_agent_id || undefined,
  estimatedEffort: db.estimated_effort,
  actualEffort: db.actual_effort || undefined,
  completed: db.completed,
  createdAt: new Date(db.created_at).getTime(),
  updatedAt: new Date(db.updated_at).getTime(),
});

const mapDbDependency = (db: DbDependency): TaskDependency => ({
  id: db.id,
  userId: db.user_id,
  sourceId: db.source_id,
  sourceType: db.source_type as TaskDependency['sourceType'],
  targetId: db.target_id,
  targetType: db.target_type as TaskDependency['targetType'],
  dependencyType: db.dependency_type as TaskDependency['dependencyType'],
  createdAt: new Date(db.created_at).getTime(),
});

const mapDbAgentSkill = (db: DbAgentSkill): AgentSkill => ({
  id: db.id,
  agentId: db.agent_id,
  userId: db.user_id,
  skillCategory: db.skill_category as AgentSkill['skillCategory'],
  proficiencyLevel: db.proficiency_level as AgentSkill['proficiencyLevel'],
  createdAt: new Date(db.created_at).getTime(),
  updatedAt: new Date(db.updated_at).getTime(),
});

const mapDbAgentPerformance = (db: DbAgentPerformance): AgentPerformance => ({
  id: db.id,
  agentId: db.agent_id,
  userId: db.user_id,
  tasksCompleted: db.tasks_completed,
  averageCompletionTime: db.average_completion_time,
  qualityScore: db.quality_score,
  onTimeDelivery: db.on_time_delivery,
  lastUpdated: new Date(db.last_updated).getTime(),
});

export const useBreakdown = () => {
  const [epics, setEpics] = useState<Epic[]>([]);
  const [tickets, setTickets] = useState<Ticket[]>([]);
  const [subtasks, setSubtasks] = useState<Subtask[]>([]);
  const [dependencies, setDependencies] = useState<TaskDependency[]>([]);
  const [agentSkills, setAgentSkills] = useState<AgentSkill[]>([]);
  const [agentPerformance, setAgentPerformance] = useState<AgentPerformance[]>([]);
  const [hasFetched, setHasFetched] = useState(false);
  const { user, isLoading: authLoading } = useAuth();
  const supabase = useMemo(() => createClient(), []);

  useEffect(() => {
    if (authLoading || hasFetched || !user) return;

    const fetchData = async () => {
      // Fetch all data in parallel
      const [
        epicsResult,
        ticketsResult,
        subtasksResult,
        depsResult,
        skillsResult,
        perfResult,
      ] = await Promise.all([
        supabase.from('epics').select('*').order('created_at', { ascending: false }),
        supabase.from('tickets').select('*').order('created_at', { ascending: false }),
        supabase.from('subtasks').select('*').order('created_at', { ascending: false }),
        supabase.from('task_dependencies').select('*').order('created_at', { ascending: false }),
        supabase.from('agent_skills').select('*'),
        supabase.from('agent_performance').select('*'),
      ]);

      if (epicsResult.data) setEpics(epicsResult.data.map(mapDbEpic));
      if (ticketsResult.data) setTickets(ticketsResult.data.map(mapDbTicket));
      if (subtasksResult.data) setSubtasks(subtasksResult.data.map(mapDbSubtask));
      if (depsResult.data) setDependencies(depsResult.data.map(mapDbDependency));
      if (skillsResult.data) setAgentSkills(skillsResult.data.map(mapDbAgentSkill));
      if (perfResult.data) setAgentPerformance(perfResult.data.map(mapDbAgentPerformance));

      setHasFetched(true);
    };

    fetchData();
  }, [user, authLoading, hasFetched, supabase]);

  // Epic operations
  const addEpic = useCallback(async (epic: Epic) => {
    if (!user) throw new Error('Must be logged in');

    const { data, error } = await supabase
      .from('epics')
      .insert({
        user_id: user.id,
        title: epic.title,
        description: epic.description,
        objectives: epic.objectives,
        acceptance_criteria: epic.acceptanceCriteria,
        risk_level: epic.riskLevel,
        risk_notes: epic.riskNotes || null,
        estimated_effort: epic.estimatedEffort,
        status: epic.status,
      })
      .select()
      .single();

    if (error) throw error;
    if (data) setEpics(prev => [mapDbEpic(data), ...prev]);
  }, [user, supabase]);

  const updateEpic = useCallback(async (epic: Epic) => {
    if (!user) return;

    const { error } = await supabase
      .from('epics')
      .update({
        title: epic.title,
        description: epic.description,
        objectives: epic.objectives,
        acceptance_criteria: epic.acceptanceCriteria,
        risk_level: epic.riskLevel,
        risk_notes: epic.riskNotes || null,
        estimated_effort: epic.estimatedEffort,
        status: epic.status,
      })
      .eq('id', epic.id);

    if (error) throw error;
    setEpics(prev => prev.map(e => e.id === epic.id ? { ...epic, updatedAt: Date.now() } : e));
  }, [user, supabase]);

  // Ticket operations
  const addTicket = useCallback(async (ticket: Ticket) => {
    if (!user) throw new Error('Must be logged in');

    const { data, error } = await supabase
      .from('tickets')
      .insert({
        user_id: user.id,
        epic_id: ticket.epicId || null,
        ticket_id: ticket.ticketId,
        title: ticket.title,
        description: ticket.description,
        definition_of_done: ticket.definitionOfDone,
        test_notes: ticket.testNotes,
        technical_notes: ticket.technicalNotes || null,
        risk_level: ticket.riskLevel,
        risk_flags: ticket.riskFlags,
        assigned_agent_id: ticket.assignedAgentId || null,
        estimated_effort: ticket.estimatedEffort,
        actual_effort: ticket.actualEffort || null,
        priority: ticket.priority,
        required_skills: ticket.requiredSkills,
        status: ticket.status,
        tags: ticket.tags,
      })
      .select()
      .single();

    if (error) throw error;
    if (data) setTickets(prev => [mapDbTicket(data), ...prev]);
  }, [user, supabase]);

  const updateTicket = useCallback(async (ticket: Ticket) => {
    if (!user) return;

    const { error } = await supabase
      .from('tickets')
      .update({
        epic_id: ticket.epicId || null,
        title: ticket.title,
        description: ticket.description,
        definition_of_done: ticket.definitionOfDone,
        test_notes: ticket.testNotes,
        technical_notes: ticket.technicalNotes || null,
        risk_level: ticket.riskLevel,
        risk_flags: ticket.riskFlags,
        assigned_agent_id: ticket.assignedAgentId || null,
        estimated_effort: ticket.estimatedEffort,
        actual_effort: ticket.actualEffort || null,
        priority: ticket.priority,
        required_skills: ticket.requiredSkills,
        status: ticket.status,
        tags: ticket.tags,
      })
      .eq('id', ticket.id);

    if (error) throw error;
    setTickets(prev => prev.map(t => t.id === ticket.id ? { ...ticket, updatedAt: Date.now() } : t));
  }, [user, supabase]);

  // Subtask operations
  const addSubtask = useCallback(async (subtask: Subtask) => {
    if (!user) throw new Error('Must be logged in');

    const { data, error } = await supabase
      .from('subtasks')
      .insert({
        user_id: user.id,
        ticket_id: subtask.ticketId,
        title: subtask.title,
        description: subtask.description || null,
        assigned_agent_id: subtask.assignedAgentId || null,
        estimated_effort: subtask.estimatedEffort,
        actual_effort: subtask.actualEffort || null,
        completed: subtask.completed,
      })
      .select()
      .single();

    if (error) throw error;
    if (data) setSubtasks(prev => [mapDbSubtask(data), ...prev]);
  }, [user, supabase]);

  const updateSubtask = useCallback(async (subtask: Subtask) => {
    if (!user) return;

    const { error } = await supabase
      .from('subtasks')
      .update({
        title: subtask.title,
        description: subtask.description || null,
        assigned_agent_id: subtask.assignedAgentId || null,
        estimated_effort: subtask.estimatedEffort,
        actual_effort: subtask.actualEffort || null,
        completed: subtask.completed,
      })
      .eq('id', subtask.id);

    if (error) throw error;
    setSubtasks(prev => prev.map(s => s.id === subtask.id ? { ...subtask, updatedAt: Date.now() } : s));
  }, [user, supabase]);

  // Dependency operations
  const addDependency = useCallback(async (dep: TaskDependency) => {
    if (!user) throw new Error('Must be logged in');

    const { data, error } = await supabase
      .from('task_dependencies')
      .insert({
        user_id: user.id,
        source_id: dep.sourceId,
        source_type: dep.sourceType,
        target_id: dep.targetId,
        target_type: dep.targetType,
        dependency_type: dep.dependencyType,
      })
      .select()
      .single();

    if (error) throw error;
    if (data) setDependencies(prev => [...prev, mapDbDependency(data)]);
  }, [user, supabase]);

  // Agent skill operations
  const updateAgentSkills = useCallback(async (agentId: string, skills: AgentSkill[]) => {
    if (!user) throw new Error('Must be logged in');

    // Delete existing skills
    await supabase.from('agent_skills').delete().eq('agent_id', agentId);

    // Insert new skills
    if (skills.length > 0) {
      const { data, error } = await supabase
        .from('agent_skills')
        .insert(skills.map(skill => ({
          agent_id: agentId,
          user_id: user.id,
          skill_category: skill.skillCategory,
          proficiency_level: skill.proficiencyLevel,
        })))
        .select();

      if (error) throw error;
      if (data) {
        setAgentSkills(prev => [
          ...prev.filter(s => s.agentId !== agentId),
          ...data.map(mapDbAgentSkill),
        ]);
      }
    }
  }, [user, supabase]);

  const isLoaded = useMemo(() => {
    if (authLoading) return false;
    if (!user) return true;
    return hasFetched;
  }, [authLoading, user, hasFetched]);

  return {
    epics,
    tickets,
    subtasks,
    dependencies,
    agentSkills,
    agentPerformance,
    isLoaded,
    addEpic,
    updateEpic,
    addTicket,
    updateTicket,
    addSubtask,
    updateSubtask,
    addDependency,
    updateAgentSkills,
  };
};
