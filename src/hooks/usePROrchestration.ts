'use client';

import { useState, useCallback } from 'react';
import {
  BranchInfo,
  PullRequest,
  PRHealth,
  RebaseStatus,
  Mergeability,
} from '@/types/pr-orchestration';
import {
  getBranches,
  getPullRequests,
  analyzePRHealth,
  checkMergeability,
  getRebaseStatus,
} from '@/lib/git-operations';

export function usePROrchestration() {
  const [branches, setBranches] = useState<BranchInfo[]>([]);
  const [pullRequests, setPullRequests] = useState<PullRequest[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const loadBranches = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await getBranches();
      setBranches(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load branches');
    } finally {
      setLoading(false);
    }
  }, []);

  const loadPullRequests = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await getPullRequests();
      setPullRequests(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load pull requests');
    } finally {
      setLoading(false);
    }
  }, []);

  const createBranch = useCallback(
    async (branchName: string, baseBranch: string = 'main') => {
      setLoading(true);
      setError(null);
      try {
        // In production, this would call an API endpoint
        console.log(`Creating branch ${branchName} from ${baseBranch}`);
        await loadBranches();
        return true;
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to create branch');
        return false;
      } finally {
        setLoading(false);
      }
    },
    [loadBranches]
  );

  const createPullRequest = useCallback(
    async (branch: string, title: string, description: string, baseBranch: string = 'main') => {
      setLoading(true);
      setError(null);
      try {
        // In production, this would call GitHub API
        console.log(`Creating PR: ${title} (${branch} -> ${baseBranch})`);
        await loadPullRequests();
        return true;
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to create pull request');
        return false;
      } finally {
        setLoading(false);
      }
    },
    [loadPullRequests]
  );

  const mergePullRequest = useCallback(
    async (prNumber: number) => {
      setLoading(true);
      setError(null);
      try {
        // In production, this would call GitHub API
        console.log(`Merging PR #${prNumber}`);
        await loadPullRequests();
        return true;
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to merge pull request');
        return false;
      } finally {
        setLoading(false);
      }
    },
    [loadPullRequests]
  );

  const rebaseBranch = useCallback(
    async (branch: string, targetBranch: string) => {
      setLoading(true);
      setError(null);
      try {
        // In production, this would call an API endpoint
        console.log(`Rebasing ${branch} onto ${targetBranch}`);
        await loadBranches();
        return true;
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to rebase branch');
        return false;
      } finally {
        setLoading(false);
      }
    },
    [loadBranches]
  );

  const getPRHealthAnalysis = useCallback(
    async (prNumber: number): Promise<PRHealth | null> => {
      setLoading(true);
      setError(null);
      try {
        const health = await analyzePRHealth(prNumber);
        return health;
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to analyze PR health');
        return null;
      } finally {
        setLoading(false);
      }
    },
    []
  );

  const checkPRMergeability = useCallback(
    async (prNumber: number): Promise<Mergeability | null> => {
      setLoading(true);
      setError(null);
      try {
        const mergeability = await checkMergeability(prNumber);
        return mergeability;
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to check mergeability');
        return null;
      } finally {
        setLoading(false);
      }
    },
    []
  );

  const getRebaseInfo = useCallback(async (): Promise<RebaseStatus | null> => {
    setLoading(true);
    setError(null);
    try {
      const status = await getRebaseStatus();
      return status;
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to get rebase status');
      return null;
    } finally {
      setLoading(false);
    }
  }, []);

  return {
    branches,
    pullRequests,
    loading,
    error,
    loadBranches,
    loadPullRequests,
    createBranch,
    createPullRequest,
    mergePullRequest,
    rebaseBranch,
    getPRHealthAnalysis,
    checkPRMergeability,
    getRebaseInfo,
  };
}
