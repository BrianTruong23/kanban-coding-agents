'use client';

import { useState, useCallback } from 'react';
import { BreakdownRequestType } from '@/types/breakdown';

export const useBreakdown = () => {
  const [isProcessing, setIsProcessing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const createBreakdown = useCallback(
    async (requestType: BreakdownRequestType, input: string) => {
      setIsProcessing(true);
      setError(null);

      try {
        const response = await fetch('/api/breakdown', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            requestType,
            inputText: input,
          }),
        });

        if (!response.ok) {
          const data = await response.json();
          throw new Error(data.error || 'Failed to create breakdown');
        }

        const result = await response.json();
        return result;
      } catch (err) {
        const message = err instanceof Error ? err.message : 'Failed to create breakdown';
        setError(message);
        throw err;
      } finally {
        setIsProcessing(false);
      }
    },
    []
  );

  return {
    createBreakdown,
    isProcessing,
    error,
  };
};
