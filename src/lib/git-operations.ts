/**
 * Git operations library
 * NOTE: This library provides interfaces and mock data for git operations.
 * Actual git commands should be executed by the orchestrator/backend.
 */

import {
  BranchInfo,
  PullRequest,
  CheckStatus,
  PRHealth,
  ConflictRisk,
  FileHotspot,
  BRANCH_CONVENTIONS,
  RebaseStatus,
  Mergeability,
} from '@/types/pr-orchestration';

/**
 * Generate a branch name following conventions
 */
export function generateBranchName(
  type: keyof typeof BRANCH_CONVENTIONS,
  description: string,
  issueNumber?: string
): string {
  const convention = BRANCH_CONVENTIONS[type];
  const cleanDescription = description
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');

  if (convention.includeIssueNumber && issueNumber) {
    return `${convention.prefix}${convention.separator}issue-${issueNumber}`;
  }

  return `${convention.prefix}${convention.separator}${cleanDescription}`;
}

/**
 * Validate branch name against conventions
 */
export function validateBranchName(branchName: string): {
  valid: boolean;
  errors: string[];
  suggestions: string[];
} {
  const errors: string[] = [];
  const suggestions: string[] = [];

  // Check if it matches any known pattern
  const knownPrefixes = Object.keys(BRANCH_CONVENTIONS);
  const hasKnownPrefix = knownPrefixes.some((prefix) =>
    branchName.startsWith(prefix + '/')
  );

  if (!hasKnownPrefix) {
    errors.push('Branch name should use a standard prefix (feature/, bugfix/, etc.)');
    suggestions.push(`Try: feature/${branchName}`);
  }

  // Check for special characters
  if (/[A-Z]/.test(branchName)) {
    errors.push('Branch name should be lowercase');
    suggestions.push(branchName.toLowerCase());
  }

  if (/\s/.test(branchName)) {
    errors.push('Branch name should not contain spaces');
    suggestions.push(branchName.replace(/\s+/g, '-'));
  }

  return {
    valid: errors.length === 0,
    errors,
    suggestions,
  };
}

/**
 * Get mock branch information
 * In production, this would call actual git commands via API
 */
export async function getBranches(): Promise<BranchInfo[]> {
  // Mock data - in production this would fetch from git
  return [
    {
      name: 'main',
      current: true,
      lastCommit: 'abc123',
      lastCommitDate: new Date().toISOString(),
      upstream: 'origin/main',
      ahead: 0,
      behind: 0,
    },
    {
      name: 'feature/issue-11',
      current: false,
      lastCommit: 'def456',
      lastCommitDate: new Date(Date.now() - 86400000).toISOString(),
      upstream: 'origin/feature/issue-11',
      ahead: 2,
      behind: 0,
    },
  ];
}

/**
 * Get mock pull requests
 * In production, this would fetch from GitHub API
 */
export async function getPullRequests(): Promise<PullRequest[]> {
  // Mock data
  return [
    {
      number: 15,
      title: 'Fix task not showing after add',
      description: 'Fixes issues with task creation and visibility',
      state: 'merged',
      branch: 'fix/task-not-showing-after-add',
      baseBranch: 'main',
      author: 'BrianTruong23',
      createdAt: new Date(Date.now() - 172800000).toISOString(),
      updatedAt: new Date(Date.now() - 86400000).toISOString(),
      checks: [
        {
          name: 'Build',
          status: 'success',
          description: 'Build completed successfully',
        },
        {
          name: 'Tests',
          status: 'success',
          description: 'All tests passed',
        },
      ],
      conflicts: false,
      reviewers: ['reviewer1'],
      approvals: 1,
      changedFiles: 3,
      additions: 45,
      deletions: 12,
    },
  ];
}

/**
 * Analyze PR health
 */
export async function analyzePRHealth(prNumber: number): Promise<PRHealth> {
  const prs = await getPullRequests();
  const pr = prs.find((p) => p.number === prNumber);

  if (!pr) {
    throw new Error(`PR #${prNumber} not found`);
  }

  const failingChecks = pr.checks?.filter((c) => c.status === 'failure' || c.status === 'error') || [];

  // Mock flaky tests detection
  const flakyTests: string[] = [];
  if (failingChecks.some(c => c.name.includes('Tests'))) {
    flakyTests.push('test/components/TaskItem.test.tsx');
  }

  // Mock conflict risk analysis
  const conflictRisks: ConflictRisk[] = [];
  if (pr.conflicts) {
    conflictRisks.push({
      file: 'src/components/KanbanBoard.tsx',
      risk: 'high',
      reason: 'Multiple concurrent changes detected',
      affectedBranches: ['feature/issue-10', 'feature/issue-12'],
    });
  }

  // Mock file hotspots
  const fileHotspots: FileHotspot[] = [
    {
      file: 'src/components/KanbanBoard.tsx',
      changeFrequency: 15,
      authors: ['BrianTruong23', 'contributor1', 'contributor2'],
      lastModified: new Date().toISOString(),
      linesChanged: 234,
      complexity: 'high',
    },
    {
      file: 'src/types/task.ts',
      changeFrequency: 8,
      authors: ['BrianTruong23'],
      lastModified: new Date(Date.now() - 86400000).toISOString(),
      linesChanged: 45,
      complexity: 'low',
    },
  ];

  // Calculate overall score
  let score = 100;
  score -= failingChecks.length * 20;
  score -= flakyTests.length * 10;
  score -= conflictRisks.filter(r => r.risk === 'high').length * 15;
  score -= conflictRisks.filter(r => r.risk === 'medium').length * 10;
  score = Math.max(0, Math.min(100, score));

  return {
    prNumber,
    failingChecks,
    flakyTests,
    conflictRisks,
    fileHotspots,
    overallScore: score,
  };
}

/**
 * Check if PR can be merged
 */
export async function checkMergeability(prNumber: number): Promise<Mergeability> {
  const prs = await getPullRequests();
  const pr = prs.find((p) => p.number === prNumber);

  if (!pr) {
    return {
      canMerge: false,
      blockers: ['PR not found'],
      warnings: [],
      checksComplete: false,
      conflictsResolved: false,
      reviewsApproved: false,
    };
  }

  const blockers: string[] = [];
  const warnings: string[] = [];

  const checksComplete = pr.checks?.every((c) => c.status !== 'pending') ?? true;
  const checksPass = pr.checks?.every((c) => c.status === 'success') ?? false;
  const conflictsResolved = !pr.conflicts;
  const reviewsApproved = (pr.approvals ?? 0) > 0;

  if (!checksComplete) {
    blockers.push('Checks are still running');
  } else if (!checksPass) {
    blockers.push('Some checks are failing');
  }

  if (!conflictsResolved) {
    blockers.push('PR has merge conflicts');
  }

  if (!reviewsApproved) {
    warnings.push('No approvals yet');
  }

  const canMerge = blockers.length === 0 && checksComplete && checksPass && conflictsResolved;

  return {
    canMerge,
    blockers,
    warnings,
    checksComplete,
    conflictsResolved,
    reviewsApproved,
  };
}

/**
 * Get rebase status
 */
export async function getRebaseStatus(): Promise<RebaseStatus> {
  // Mock data - would check actual git status
  return {
    inProgress: false,
  };
}

/**
 * Generate PR title and description from branch and commits
 */
export function generatePRMetadata(branchName: string, commits?: string[]): {
  title: string;
  description: string;
} {
  // Extract meaningful title from branch name
  const parts = branchName.split('/');
  const description = parts[parts.length - 1]
    .split('-')
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(' ');

  const title = description;

  let prDescription = `## Changes\n\n`;

  if (commits && commits.length > 0) {
    prDescription += commits.map(c => `- ${c}`).join('\n');
  } else {
    prDescription += `This PR includes changes from the \`${branchName}\` branch.\n`;
  }

  prDescription += `\n\n## Testing\n\n- [ ] Manual testing completed\n- [ ] Unit tests added/updated\n- [ ] Integration tests pass\n`;

  return { title, description: prDescription };
}
