'use client';

import { useState, useEffect, useCallback, useRef, useMemo } from 'react';
import { CodingAgent } from '@/types/agent';
import { createClient } from '@/lib/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { getInitials, getAvatarColor } from '@/lib/utils';

interface DbAgent {
  id: string;
  user_id: string;
  name: string;
  description: string | null;
  avatar: string | null;
  avatar_color: string | null;
  created_at: string;
}

// Default skills, performance, and availability for agents
// In a real implementation, these would be fetched from the database
const getDefaultSkills = (agentName: string) => {
  // Assign different skills based on agent name patterns
  const skills = [];
  const nameLower = agentName.toLowerCase();

  if (nameLower.includes('frontend') || nameLower.includes('ui')) {
    skills.push(
      { name: 'React', level: 'expert' as const },
      { name: 'TypeScript', level: 'advanced' as const },
      { name: 'CSS', level: 'advanced' as const },
      { name: 'UI/UX', level: 'intermediate' as const }
    );
  } else if (nameLower.includes('backend') || nameLower.includes('api')) {
    skills.push(
      { name: 'Node.js', level: 'expert' as const },
      { name: 'TypeScript', level: 'advanced' as const },
      { name: 'SQL', level: 'advanced' as const },
      { name: 'API Design', level: 'expert' as const }
    );
  } else if (nameLower.includes('full') || nameLower.includes('stack')) {
    skills.push(
      { name: 'React', level: 'advanced' as const },
      { name: 'Node.js', level: 'advanced' as const },
      { name: 'TypeScript', level: 'expert' as const },
      { name: 'Database', level: 'intermediate' as const }
    );
  } else {
    // Default general skills
    skills.push(
      { name: 'TypeScript', level: 'intermediate' as const },
      { name: 'JavaScript', level: 'advanced' as const },
      { name: 'Testing', level: 'intermediate' as const }
    );
  }

  return skills;
};

const getDefaultPerformance = () => ({
  tasksCompleted: Math.floor(Math.random() * 50) + 10, // 10-60 tasks
  tasksInProgress: Math.floor(Math.random() * 3), // 0-2 tasks
  successRate: 0.85 + Math.random() * 0.15, // 0.85-1.0
  averageCompletionTime: 6 + Math.random() * 8, // 6-14 hours
  qualityScore: 70 + Math.floor(Math.random() * 30), // 70-100
  reliability: 75 + Math.floor(Math.random() * 25), // 75-100
  totalHoursWorked: Math.floor(Math.random() * 500) + 100, // 100-600 hours
  lastActiveAt: Date.now() - Math.floor(Math.random() * 86400000) // Last active within 24 hours
});

const getDefaultAvailability = () => ({
  status: (Math.random() > 0.3 ? 'available' : Math.random() > 0.5 ? 'busy' : 'offline') as 'available' | 'busy' | 'offline',
  currentWorkload: Math.floor(Math.random() * 80), // 0-80%
  maxCapacity: 5,
  timezone: 'UTC'
});

const getSpecializations = (agentName: string) => {
  const nameLower = agentName.toLowerCase();

  if (nameLower.includes('frontend') || nameLower.includes('ui')) {
    return ['Frontend Development', 'UI Design', 'Component Architecture'];
  } else if (nameLower.includes('backend') || nameLower.includes('api')) {
    return ['Backend Development', 'API Design', 'Database Optimization'];
  } else if (nameLower.includes('full') || nameLower.includes('stack')) {
    return ['Full-Stack Development', 'System Architecture', 'DevOps'];
  } else if (nameLower.includes('test')) {
    return ['Testing', 'QA', 'Test Automation'];
  } else if (nameLower.includes('devops')) {
    return ['DevOps', 'CI/CD', 'Infrastructure'];
  }

  return ['General Development', 'Code Review', 'Debugging'];
};

const mapDbAgentToAgent = (dbAgent: DbAgent): CodingAgent => ({
  id: dbAgent.id,
  name: dbAgent.name,
  description: dbAgent.description || undefined,
  avatar: dbAgent.avatar || getInitials(dbAgent.name),
  avatarColor: dbAgent.avatar_color || getAvatarColor(dbAgent.name),
  createdAt: new Date(dbAgent.created_at).getTime(),
  skills: getDefaultSkills(dbAgent.name),
  specializations: getSpecializations(dbAgent.name),
  performance: getDefaultPerformance(),
  availability: getDefaultAvailability(),
});

export const useAgents = () => {
  const [agents, setAgents] = useState<CodingAgent[]>([]);
  const [hasFetched, setHasFetched] = useState(false);
  const { user, isLoading: authLoading } = useAuth();
  // Memoize the Supabase client to avoid creating a new instance on every render
  const supabase = useMemo(() => createClient(), []);
  const fetchingRef = useRef(false);

  useEffect(() => {
    // Skip if auth is loading, already fetched, or currently fetching
    if (authLoading || hasFetched || fetchingRef.current || !user) return;

    fetchingRef.current = true;

    const fetchAgents = async () => {
      const { data, error } = await supabase
        .from('agents')
        .select('*')
        .order('created_at', { ascending: true });

      if (error) {
        console.error('Error fetching agents:', error);
      } else {
        setAgents((data || []).map(mapDbAgentToAgent));
      }
      setHasFetched(true);
      fetchingRef.current = false;
    };

    fetchAgents();
  }, [user, authLoading, hasFetched, supabase]);

  // Derived loading state
  const isLoaded = useMemo(() => {
    if (authLoading) return false;
    if (!user) return true; // No user = loaded with empty state
    return hasFetched;
  }, [authLoading, user, hasFetched]);

  const addAgent = useCallback(async (agent: CodingAgent) => {
    if (!user) return;

    const { data, error } = await supabase
      .from('agents')
      .insert({
        user_id: user.id,
        name: agent.name,
        description: agent.description || null,
        avatar: agent.avatar || null,
        avatar_color: agent.avatarColor || null,
      })
      .select()
      .single();

    if (error) {
      console.error('Error adding agent:', error);
      return;
    }

    if (data) {
      setAgents((prev) => [mapDbAgentToAgent(data), ...prev]);
    }
  }, [user, supabase]);

  const updateAgent = useCallback(async (updatedAgent: CodingAgent) => {
    if (!user) return;

    const { error } = await supabase
      .from('agents')
      .update({
        name: updatedAgent.name,
        description: updatedAgent.description || null,
        avatar: updatedAgent.avatar || null,
        avatar_color: updatedAgent.avatarColor || null,
      })
      .eq('id', updatedAgent.id);

    if (error) {
      console.error('Error updating agent:', error);
      return;
    }

    setAgents((prev) =>
      prev.map((a) => (a.id === updatedAgent.id ? updatedAgent : a))
    );
  }, [user, supabase]);

  const deleteAgent = useCallback(async (agentId: string) => {
    if (!user) return;

    const { error } = await supabase
      .from('agents')
      .delete()
      .eq('id', agentId);

    if (error) {
      console.error('Error deleting agent:', error);
      return;
    }

    setAgents((prev) => prev.filter((a) => a.id !== agentId));
  }, [user, supabase]);

  return {
    agents,
    addAgent,
    updateAgent,
    deleteAgent,
    isLoaded,
  };
};
