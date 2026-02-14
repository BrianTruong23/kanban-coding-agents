'use client';

import { useState, useEffect, useCallback, useMemo } from 'react';
import { AgentRoster } from '@/types/agentSkills';
import { CodingAgent } from '@/types/agent';
import { AgentRosterService, DEFAULT_SKILLS } from '@/lib/agentRoster';
import { useAuth } from '@/contexts/AuthContext';

const STORAGE_KEY = 'agent-rosters';

export const useAgentRosters = (agents: CodingAgent[]) => {
  const [rosters, setRosters] = useState<AgentRoster[]>([]);
  const [isLoaded, setIsLoaded] = useState(false);
  const { user } = useAuth();

  // Initialize rosters from localStorage
  useEffect(() => {
    if (!user) {
      setRosters([]);
      setIsLoaded(true);
      return;
    }

    const stored = localStorage.getItem(`${STORAGE_KEY}-${user.id}`);
    if (stored) {
      try {
        const parsedRosters = JSON.parse(stored) as AgentRoster[];
        setRosters(parsedRosters);
      } catch (error) {
        console.error('Failed to parse agent rosters from localStorage:', error);
      }
    }

    setIsLoaded(true);
  }, [user]);

  // Create rosters for new agents
  useEffect(() => {
    if (!isLoaded || !user) return;

    const newAgents = agents.filter(
      (agent) => !rosters.find((roster) => roster.agentId === agent.id)
    );

    if (newAgents.length > 0) {
      const newRosters = newAgents.map((agent) => {
        // Assign default skills based on agent description
        let defaultSkills = DEFAULT_SKILLS.fullstack;

        if (agent.description) {
          const desc = agent.description.toLowerCase();
          if (desc.includes('frontend') || desc.includes('ui')) {
            defaultSkills = DEFAULT_SKILLS.frontend;
          } else if (desc.includes('backend') || desc.includes('api')) {
            defaultSkills = DEFAULT_SKILLS.backend;
          } else if (desc.includes('devops') || desc.includes('infrastructure')) {
            defaultSkills = DEFAULT_SKILLS.devops;
          } else if (desc.includes('mobile')) {
            defaultSkills = DEFAULT_SKILLS.mobile;
          }
        }

        return AgentRosterService.createAgentRoster(
          agent.id,
          agent.name,
          defaultSkills,
          agent.avatar,
          agent.avatarColor
        );
      });

      setRosters((prev) => [...prev, ...newRosters]);
    }
  }, [agents, rosters, isLoaded, user]);

  // Save to localStorage whenever rosters change
  useEffect(() => {
    if (!isLoaded || !user) return;
    localStorage.setItem(`${STORAGE_KEY}-${user.id}`, JSON.stringify(rosters));
  }, [rosters, isLoaded, user]);

  const updateRoster = useCallback((updatedRoster: AgentRoster) => {
    setRosters((prev) =>
      prev.map((roster) =>
        roster.agentId === updatedRoster.agentId ? updatedRoster : roster
      )
    );
  }, []);

  const updateWorkload = useCallback((agentId: string, workload: number) => {
    setRosters((prev) =>
      prev.map((roster) =>
        roster.agentId === agentId
          ? AgentRosterService.updateWorkload(roster, workload)
          : roster
      )
    );
  }, []);

  const updateAvailability = useCallback(
    (agentId: string, availability: 'available' | 'busy' | 'unavailable') => {
      setRosters((prev) =>
        prev.map((roster) =>
          roster.agentId === agentId
            ? AgentRosterService.updateAvailability(roster, availability)
            : roster
        )
      );
    },
    []
  );

  return {
    rosters,
    isLoaded,
    updateRoster,
    updateWorkload,
    updateAvailability,
  };
};
