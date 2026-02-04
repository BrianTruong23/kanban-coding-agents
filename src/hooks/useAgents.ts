import { useState, useEffect } from 'react';
import { CodingAgent } from '@/types/agent';
import { loadAgents, saveAgents } from '@/lib/storage';
import { getInitials, getAvatarColor } from '@/lib/utils';

export const useAgents = () => {
  const [agents, setAgents] = useState<CodingAgent[]>([]);
  const [isLoaded, setIsLoaded] = useState(false);

  useEffect(() => {
    const stored = loadAgents();
    // If no agents exist, create some default ones
    if (stored.length === 0) {
      const defaultAgents: CodingAgent[] = [
        {
          id: 'agent-1',
          name: 'Alex Chen',
          description: 'Specializes in React, Next.js, and UI development',
          avatar: getInitials('Alex Chen'),
          avatarColor: getAvatarColor('Alex Chen'),
          createdAt: Date.now(),
        },
        {
          id: 'agent-2',
          name: 'Sarah Johnson',
          description: 'Handles API, database, and server-side logic',
          avatar: getInitials('Sarah Johnson'),
          avatarColor: getAvatarColor('Sarah Johnson'),
          createdAt: Date.now(),
        },
        {
          id: 'agent-3',
          name: 'Mike Rodriguez',
          description: 'Works on both frontend and backend tasks',
          avatar: getInitials('Mike Rodriguez'),
          avatarColor: getAvatarColor('Mike Rodriguez'),
          createdAt: Date.now(),
        },
        {
          id: 'agent-4',
          name: 'Emma Wilson',
          description: 'DevOps and infrastructure specialist',
          avatar: getInitials('Emma Wilson'),
          avatarColor: getAvatarColor('Emma Wilson'),
          createdAt: Date.now(),
        },
        {
          id: 'agent-5',
          name: 'David Kim',
          description: 'Mobile app development expert',
          avatar: getInitials('David Kim'),
          avatarColor: getAvatarColor('David Kim'),
          createdAt: Date.now(),
        },
      ];
      setAgents(defaultAgents);
      saveAgents(defaultAgents);
    } else {
      setAgents(stored);
    }
    setIsLoaded(true);
  }, []);

  useEffect(() => {
    if (isLoaded) {
      saveAgents(agents);
    }
  }, [agents, isLoaded]);

  const addAgent = (agent: CodingAgent) => {
    setAgents((prev) => [agent, ...prev]);
  };

  const updateAgent = (updatedAgent: CodingAgent) => {
    setAgents((prev) =>
      prev.map((a) => (a.id === updatedAgent.id ? updatedAgent : a))
    );
  };

  const deleteAgent = (agentId: string) => {
    setAgents((prev) => prev.filter((a) => a.id !== agentId));
  };

  return {
    agents,
    addAgent,
    updateAgent,
    deleteAgent,
    isLoaded,
  };
};
