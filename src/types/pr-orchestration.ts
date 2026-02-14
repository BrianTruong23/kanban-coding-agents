export interface BranchInfo {
  name: string;
  current: boolean;
  lastCommit?: string;
  lastCommitDate?: string;
  upstream?: string;
  ahead?: number;
  behind?: number;
}

export interface PullRequest {
  number: number;
  title: string;
  description?: string;
  state: 'open' | 'closed' | 'merged';
  branch: string;
  baseBranch: string;
  author: string;
  createdAt: string;
  updatedAt: string;
  checks?: CheckStatus[];
  conflicts?: boolean;
  reviewers?: string[];
  approvals?: number;
  changedFiles?: number;
  additions?: number;
  deletions?: number;
}

export interface CheckStatus {
  name: string;
  status: 'pending' | 'success' | 'failure' | 'error';
  description?: string;
  url?: string;
  startedAt?: string;
  completedAt?: string;
}

export interface PRHealth {
  prNumber: number;
  failingChecks: CheckStatus[];
  flakyTests: string[];
  conflictRisks: ConflictRisk[];
  fileHotspots: FileHotspot[];
  overallScore: number; // 0-100
}

export interface ConflictRisk {
  file: string;
  risk: 'low' | 'medium' | 'high';
  reason: string;
  affectedBranches?: string[];
}

export interface FileHotspot {
  file: string;
  changeFrequency: number;
  authors: string[];
  lastModified: string;
  linesChanged: number;
  complexity?: 'low' | 'medium' | 'high';
}

export interface BranchNamingConvention {
  prefix: string;
  separator: string;
  includeIssueNumber?: boolean;
  examples: string[];
}

export const BRANCH_CONVENTIONS: Record<string, BranchNamingConvention> = {
  feature: {
    prefix: 'feature',
    separator: '/',
    includeIssueNumber: true,
    examples: ['feature/issue-123', 'feature/user-authentication'],
  },
  bugfix: {
    prefix: 'bugfix',
    separator: '/',
    includeIssueNumber: true,
    examples: ['bugfix/issue-456', 'bugfix/login-error'],
  },
  hotfix: {
    prefix: 'hotfix',
    separator: '/',
    includeIssueNumber: false,
    examples: ['hotfix/critical-security-patch'],
  },
  release: {
    prefix: 'release',
    separator: '/',
    includeIssueNumber: false,
    examples: ['release/v1.2.0'],
  },
  chore: {
    prefix: 'chore',
    separator: '/',
    includeIssueNumber: false,
    examples: ['chore/update-dependencies'],
  },
};

export interface RebaseStatus {
  inProgress: boolean;
  conflicts?: string[];
  currentBranch?: string;
  targetBranch?: string;
}

export interface Mergeability {
  canMerge: boolean;
  blockers: string[];
  warnings: string[];
  checksComplete: boolean;
  conflictsResolved: boolean;
  reviewsApproved: boolean;
}
