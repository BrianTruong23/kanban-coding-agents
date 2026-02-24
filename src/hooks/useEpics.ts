'use client';

import { useState, useEffect, useCallback, useMemo } from 'react';
import { Epic } from '@/types/epic';
import { createClient } from '@/lib/supabase/client';
import { useAuth } from '@/contexts/AuthContext';

interface DbEpic {
  id: string;
  user_id: string;
  epic_id: string;
  title: string;
  description: string | null;
  status: string;
  priority: number;
  tags: string[];
  sprint: string | null;
  target_date: string | null;
  created_at: string;
  updated_at: string;
}

const mapDbEpicToEpic = (dbEpic: DbEpic): Epic => ({
  id: dbEpic.id,
  epicId: dbEpic.epic_id,
  title: dbEpic.title,
  description: dbEpic.description || '',
  status: dbEpic.status as Epic['status'],
  priority: dbEpic.priority as Epic['priority'],
  tags: dbEpic.tags || [],
  sprint: dbEpic.sprint || undefined,
  targetDate: dbEpic.target_date ? new Date(dbEpic.target_date).getTime() : undefined,
  createdAt: new Date(dbEpic.created_at).getTime(),
  updatedAt: new Date(dbEpic.updated_at).getTime(),
  taskIds: [], // This would be populated separately if needed
});

export const useEpics = () => {
  const [epics, setEpics] = useState<Epic[]>([]);
  const [hasFetched, setHasFetched] = useState(false);
  const { user, isLoading: authLoading } = useAuth();
  const supabase = useMemo(() => createClient(), []);

  useEffect(() => {
    if (authLoading || hasFetched || !user) return;

    const fetchEpics = async () => {
      const { data, error } = await supabase
        .from('epics')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) {
        console.error('Error fetching epics:', error);
      } else {
        setEpics((data || []).map(mapDbEpicToEpic));
      }
      setHasFetched(true);
    };

    fetchEpics();
  }, [user, authLoading, hasFetched, supabase]);

  const isLoaded = useMemo(() => {
    if (authLoading) return false;
    if (!user) return true;
    return hasFetched;
  }, [authLoading, user, hasFetched]);

  const addEpic = useCallback(async (epic: Epic) => {
    if (!user) {
      throw new Error('You must be logged in to add epics');
    }

    const { data, error } = await supabase
      .from('epics')
      .insert({
        user_id: user.id,
        epic_id: epic.epicId,
        title: epic.title,
        description: epic.description || null,
        status: epic.status,
        priority: epic.priority,
        tags: epic.tags,
        sprint: epic.sprint || null,
        target_date: epic.targetDate ? new Date(epic.targetDate).toISOString() : null,
      })
      .select()
      .single();

    if (error) {
      console.error('Error adding epic:', error);
      throw new Error(error.message);
    }

    if (data) {
      setEpics((prev) => [mapDbEpicToEpic(data), ...prev]);
    }
  }, [user, supabase]);

  const updateEpic = useCallback(async (updatedEpic: Epic) => {
    if (!user) return;

    const { error } = await supabase
      .from('epics')
      .update({
        title: updatedEpic.title,
        description: updatedEpic.description || null,
        status: updatedEpic.status,
        priority: updatedEpic.priority,
        tags: updatedEpic.tags,
        sprint: updatedEpic.sprint || null,
        target_date: updatedEpic.targetDate ? new Date(updatedEpic.targetDate).toISOString() : null,
      })
      .eq('id', updatedEpic.id);

    if (error) {
      console.error('Error updating epic:', error);
      return;
    }

    setEpics((prev) =>
      prev.map((e) => (e.id === updatedEpic.id ? { ...updatedEpic, updatedAt: Date.now() } : e))
    );
  }, [user, supabase]);

  const deleteEpic = useCallback(async (epicId: string) => {
    if (!user) return;

    const { error } = await supabase
      .from('epics')
      .delete()
      .eq('id', epicId);

    if (error) {
      console.error('Error deleting epic:', error);
      return;
    }

    setEpics((prev) => prev.filter((e) => e.id !== epicId));
  }, [user, supabase]);

  return {
    epics,
    addEpic,
    updateEpic,
    deleteEpic,
    isLoaded,
  };
};
