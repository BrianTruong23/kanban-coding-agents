export type TriageSource =
  | 'github_issue'
  | 'ci_failure'
  | 'error_log'
  | 'user_feedback'
  | 'sentry'
  | 'manual';

export type TriageSeverity =
  | 'critical'
  | 'high'
  | 'medium'
  | 'low'
  | 'info';

export type TriageStatus =
  | 'pending'
  | 'triaged'
  | 'assigned'
  | 'duplicate'
  | 'resolved'
  | 'ignored';

export interface TriageItem {
  id: string;
  userId: string;
  source: TriageSource;
  title: string;
  description: string;
  rawData: Record<string, unknown>; // Original data from source
  severity: TriageSeverity;
  status: TriageStatus;
  clusterId?: string; // ID of the cluster this item belongs to
  duplicateOfId?: string; // Reference to the original issue if this is a duplicate
  suggestedOwner?: string; // Agent ID
  reproductionSteps?: string[]; // Auto-generated minimal reproduction steps
  tags: string[];
  metadata: {
    sourceUrl?: string;
    stackTrace?: string;
    errorCode?: string;
    ciJobId?: string;
    branch?: string;
    commit?: string;
    environment?: string;
    userAgent?: string;
    ipAddress?: string;
    [key: string]: unknown;
  };
  assignedTaskId?: string; // If converted to a task
  createdAt: number;
  updatedAt: number;
  triagedAt?: number;
}

export interface TriageCluster {
  id: string;
  userId: string;
  title: string;
  description: string;
  itemIds: string[]; // IDs of triage items in this cluster
  severity: TriageSeverity;
  suggestedOwner?: string;
  commonPatterns: string[]; // Common patterns found across items
  reproductionSteps?: string[]; // Merged reproduction steps
  tags: string[];
  createdAt: number;
  updatedAt: number;
}

export interface GitHubIssueData {
  number: number;
  title: string;
  body: string;
  state: 'open' | 'closed';
  labels: string[];
  assignees: string[];
  createdAt: string;
  updatedAt: string;
  url: string;
  user: {
    login: string;
    avatar_url: string;
  };
}

export interface CIFailureData {
  jobId: string;
  jobName: string;
  branch: string;
  commit: string;
  status: 'failed' | 'error';
  errorMessage: string;
  logs: string;
  startTime: string;
  endTime: string;
  url: string;
}

export interface ErrorLogData {
  message: string;
  stackTrace: string;
  errorCode?: string;
  severity: string;
  timestamp: string;
  context?: Record<string, unknown>;
  environment?: string;
}

export interface UserFeedbackData {
  subject: string;
  message: string;
  userEmail?: string;
  userAgent?: string;
  url?: string;
  timestamp: string;
  category?: string;
  sentiment?: 'positive' | 'neutral' | 'negative';
}

export interface TriageStats {
  total: number;
  byStatus: Record<TriageStatus, number>;
  bySource: Record<TriageSource, number>;
  bySeverity: Record<TriageSeverity, number>;
  clustersCount: number;
  duplicatesCount: number;
  avgTriageTime: number; // In milliseconds
}

export interface TriageFilters {
  status?: TriageStatus[];
  source?: TriageSource[];
  severity?: TriageSeverity[];
  clusterId?: string;
  search?: string;
  dateFrom?: Date;
  dateTo?: Date;
}
