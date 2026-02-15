'use client';

import { useState, useEffect, useMemo, useCallback } from 'react';
import { createClient } from '@/lib/supabase/client';
import { AgentRoster, PerformanceMetrics, Availability, Skill } from '@/types/agentRoster';
import { CodingAgent } from '@/types/agent';

export function useAgentRoster() {
  const [agents, setAgents] = useState<AgentRoster[]>([]);
  const [isLoaded, setIsLoaded] = useState(false);
  const supabase = useMemo(() => createClient(), []);

  const loadAgents = useCallback(async () => {
    const { data, error } = await supabase
      .from('agents')
      .select('*')
      .order('created_at', { ascending: true });

    if (error) {
      console.error('Error loading agents:', error);
      setIsLoaded(true);
      return;
    }

    if (data) {
      // Convert CodingAgent to AgentRoster with default values
      const rosterAgents: AgentRoster[] = data.map(convertToAgentRoster);
      setAgents(rosterAgents);
    }

    setIsLoaded(true);
  }, [supabase]);

  useEffect(() => {
    // Initial load and real-time subscription
    // eslint-disable-next-line react-hooks/set-state-in-effect
    loadAgents();

    // Subscribe to real-time changes
    const channel = supabase
      .channel('agents-roster-changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'agents',
        },
        () => {
          loadAgents();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [supabase, loadAgents]);

  const updateAgentRoster = async (agent: AgentRoster) => {
    // Update in database (store extended data in a JSON column if needed)
    const { error } = await supabase
      .from('agents')
      .update({
        name: agent.name,
        description: agent.description,
        avatar: agent.avatar,
        avatar_color: agent.avatarColor,
      })
      .eq('id', agent.id);

    if (error) {
      console.error('Error updating agent:', error);
      return;
    }

    // Update local state
    setAgents((prev) => prev.map((a) => (a.id === agent.id ? agent : a)));
  };

  return {
    agents,
    isLoaded,
    updateAgentRoster,
  };
}

/**
 * Convert CodingAgent to AgentRoster with sensible defaults
 */
function convertToAgentRoster(agent: CodingAgent): AgentRoster {
  // Infer skills from description
  const skills = inferSkillsFromDescription(agent.description || '');

  const performanceMetrics: PerformanceMetrics = {
    tasksCompleted: 0,
    tasksInProgress: 0,
    averageCompletionTime: 0,
    onTimeDeliveryRate: 100,
    qualityScore: 75,
    collaborationScore: 80,
    lastUpdated: Date.now(),
  };

  const availability: Availability = {
    status: 'available',
    currentWorkload: 0,
    maxCapacity: 5,
    hoursPerWeek: 40,
  };

  return {
    id: agent.id,
    userId: '', // Will be filled from database user_id
    name: agent.name,
    description: agent.description,
    avatar: agent.avatar,
    avatarColor: agent.avatarColor,
    skills,
    specializations: extractSpecializations(agent.description || ''),
    performanceMetrics,
    availability,
    assignmentHistory: [],
    createdAt: agent.createdAt,
    updatedAt: agent.createdAt,
  };
}

/**
 * Infer skills from agent description
 */
function inferSkillsFromDescription(description: string): Skill[] {
  const skills: Skill[] = [];
  const lower = description.toLowerCase();

  const skillMap: Record<string, { category: string; level: string }> = {
    react: { category: 'frontend', level: 'advanced' },
    'next.js': { category: 'frontend', level: 'advanced' },
    nextjs: { category: 'frontend', level: 'advanced' },
    ui: { category: 'frontend', level: 'intermediate' },
    api: { category: 'backend', level: 'advanced' },
    database: { category: 'database', level: 'advanced' },
    sql: { category: 'database', level: 'advanced' },
    devops: { category: 'devops', level: 'advanced' },
    docker: { category: 'devops', level: 'intermediate' },
    kubernetes: { category: 'devops', level: 'intermediate' },
    testing: { category: 'testing', level: 'intermediate' },
    mobile: { category: 'mobile', level: 'advanced' },
    security: { category: 'security', level: 'intermediate' },
  };

  for (const [keyword, config] of Object.entries(skillMap)) {
    if (lower.includes(keyword)) {
      skills.push({
        name: keyword.charAt(0).toUpperCase() + keyword.slice(1),
        category: config.category as any,
        level: config.level as any,
      });
    }
  }

  // Add default general skill if no specific skills found
  if (skills.length === 0) {
    skills.push({
      name: 'Full-stack Development',
      category: 'backend',
      level: 'intermediate',
    });
  }

  return skills;
}

/**
 * Extract specializations from description
 */
function extractSpecializations(description: string): string[] {
  const specializations: string[] = [];
  const lower = description.toLowerCase();

  if (lower.includes('frontend') || lower.includes('ui') || lower.includes('react')) {
    specializations.push('Frontend Development');
  }
  if (lower.includes('backend') || lower.includes('api') || lower.includes('server')) {
    specializations.push('Backend Development');
  }
  if (lower.includes('database') || lower.includes('sql')) {
    specializations.push('Database Management');
  }
  if (lower.includes('devops') || lower.includes('infrastructure')) {
    specializations.push('DevOps & Infrastructure');
  }
  if (lower.includes('mobile')) {
    specializations.push('Mobile Development');
  }
  if (lower.includes('full') || lower.includes('fullstack')) {
    specializations.push('Full-stack Development');
  }

  return specializations.length > 0 ? specializations : ['General Development'];
}
