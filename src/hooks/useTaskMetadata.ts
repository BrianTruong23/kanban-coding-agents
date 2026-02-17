'use client';

import { useState, useEffect, useCallback, useMemo } from 'react';
import { DefinitionOfDone, TestNote, RiskFlag } from '@/types/breakdown';
import { createClient } from '@/lib/supabase/client';
import { useAuth } from '@/contexts/AuthContext';

interface TaskMetadata {
  taskId: string;
  definitionOfDone: DefinitionOfDone;
  testNotes: TestNote[];
  riskFlags: RiskFlag[];
}

interface DbTaskMetadata {
  task_id: string;
  definition_of_done: {
    criteria: string[];
  };
  test_notes: TestNote[];
  risk_flags: RiskFlag[];
}

const mapDbMetadataToMetadata = (dbMeta: DbTaskMetadata): TaskMetadata => ({
  taskId: dbMeta.task_id,
  definitionOfDone: dbMeta.definition_of_done,
  testNotes: dbMeta.test_notes || [],
  riskFlags: dbMeta.risk_flags || [],
});

export const useTaskMetadata = (taskId?: string) => {
  const [metadata, setMetadata] = useState<TaskMetadata | null>(null);
  const [isLoaded, setIsLoaded] = useState(false);
  const { user, isLoading: authLoading } = useAuth();
  const supabase = useMemo(() => createClient(), []);

  useEffect(() => {
    if (authLoading || !user || !taskId) return;

    const fetchMetadata = async () => {
      const { data, error } = await supabase
        .from('task_metadata')
        .select('*')
        .eq('task_id', taskId)
        .single();

      if (error && error.code !== 'PGRST116') {
        // PGRST116 = not found, which is okay
        console.error('Error fetching task metadata:', error);
      } else if (data) {
        setMetadata(mapDbMetadataToMetadata(data));
      }
      setIsLoaded(true);
    };

    fetchMetadata();
  }, [user, authLoading, taskId, supabase]);

  const updateMetadata = useCallback(
    async (
      taskId: string,
      updates: {
        definitionOfDone?: DefinitionOfDone;
        testNotes?: TestNote[];
        riskFlags?: RiskFlag[];
      }
    ) => {
      if (!user) return;

      const payload: Record<string, unknown> = {
        task_id: taskId,
      };

      if (updates.definitionOfDone) {
        payload.definition_of_done = updates.definitionOfDone;
      }
      if (updates.testNotes) {
        payload.test_notes = updates.testNotes;
      }
      if (updates.riskFlags) {
        payload.risk_flags = updates.riskFlags;
      }

      const { data, error } = await supabase
        .from('task_metadata')
        .upsert(payload)
        .select()
        .single();

      if (error) {
        console.error('Error updating task metadata:', error);
        return;
      }

      if (data) {
        setMetadata(mapDbMetadataToMetadata(data));
      }
    },
    [user, supabase]
  );

  return {
    metadata,
    updateMetadata,
    isLoaded,
  };
};
