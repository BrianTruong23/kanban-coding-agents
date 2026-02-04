import { useState, useCallback, useSyncExternalStore } from 'react';
import { CodingAgent } from '@/types/agent';
import { loadAgents, saveAgents } from '@/lib/storage';
import { getInitials, getAvatarColor } from '@/lib/utils';

const createDefaultAgents = (): CodingAgent[] => [
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

// Simple store for agents with subscription support
let agentsCache: CodingAgent[] | null = null;
const listeners = new Set<() => void>();

const getSnapshot = (): CodingAgent[] => {
  if (agentsCache === null) {
    const stored = loadAgents();
    if (stored.length === 0) {
      agentsCache = createDefaultAgents();
      saveAgents(agentsCache);
    } else {
      agentsCache = stored;
    }
  }
  return agentsCache;
};

const getServerSnapshot = (): CodingAgent[] => [];

const subscribe = (callback: () => void): (() => void) => {
  listeners.add(callback);
  return () => listeners.delete(callback);
};

const updateAgentsStore = (newAgents: CodingAgent[]) => {
  agentsCache = newAgents;
  saveAgents(newAgents);
  listeners.forEach((listener) => listener());
};

export const useAgents = () => {
  const agents = useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot);
  const [isLoaded] = useState(true);

  const addAgent = useCallback((agent: CodingAgent) => {
    updateAgentsStore([agent, ...getSnapshot()]);
  }, []);

  const updateAgent = useCallback((updatedAgent: CodingAgent) => {
    updateAgentsStore(
      getSnapshot().map((a) => (a.id === updatedAgent.id ? updatedAgent : a))
    );
  }, []);

  const deleteAgent = useCallback((agentId: string) => {
    updateAgentsStore(getSnapshot().filter((a) => a.id !== agentId));
  }, []);

  return {
    agents,
    addAgent,
    updateAgent,
    deleteAgent,
    isLoaded,
  };
};
