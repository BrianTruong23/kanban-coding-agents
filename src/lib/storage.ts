import { Task } from '@/types/task';
import { CodingAgent } from '@/types/agent';

const TASKS_STORAGE_KEY = 'kanban_coding_agents_tasks';
const AGENTS_STORAGE_KEY = 'kanban_coding_agents_agents';

export const saveTasks = (tasks: Task[]): void => {
  if (typeof window === 'undefined') return;
  try {
    localStorage.setItem(TASKS_STORAGE_KEY, JSON.stringify(tasks));
  } catch (error) {
    console.error('Failed to save tasks to localStorage:', error);
  }
};

export const loadTasks = (): Task[] => {
  if (typeof window === 'undefined') return [];
  try {
    const raw = localStorage.getItem(TASKS_STORAGE_KEY);
    if (!raw) return [];
    return JSON.parse(raw) as Task[];
  } catch (error) {
    console.error('Failed to load tasks from localStorage:', error);
    return [];
  }
};

export const saveAgents = (agents: CodingAgent[]): void => {
  if (typeof window === 'undefined') return;
  try {
    localStorage.setItem(AGENTS_STORAGE_KEY, JSON.stringify(agents));
  } catch (error) {
    console.error('Failed to save agents to localStorage:', error);
  }
};

export const loadAgents = (): CodingAgent[] => {
  if (typeof window === 'undefined') return [];
  try {
    const raw = localStorage.getItem(AGENTS_STORAGE_KEY);
    if (!raw) return [];
    return JSON.parse(raw) as CodingAgent[];
  } catch (error) {
    console.error('Failed to load agents from localStorage:', error);
    return [];
  }
};
