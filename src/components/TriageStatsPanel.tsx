'use client';

import type { TriageStats } from '@/types/triage';
import { BarChart3, AlertCircle, Clock } from 'lucide-react';

interface TriageStatsPanelProps {
  stats: TriageStats;
}

export function TriageStatsPanel({ stats }: TriageStatsPanelProps) {
  const formatTime = (ms: number) => {
    if (ms < 1000) return `${Math.round(ms)}ms`;
    if (ms < 60000) return `${Math.round(ms / 1000)}s`;
    if (ms < 3600000) return `${Math.round(ms / 60000)}m`;
    return `${Math.round(ms / 3600000)}h`;
  };

  return (
    <div className="p-4 space-y-4 bg-white dark:bg-gray-800">
      <div className="flex items-center gap-2 text-gray-900 dark:text-white font-semibold">
        <BarChart3 size={18} />
        <h3 className="text-sm">Statistics</h3>
      </div>

      {/* Total */}
      <div className="p-3 rounded-lg bg-gray-50 dark:bg-gray-900">
        <div className="text-2xl font-bold text-gray-900 dark:text-white">{stats.total}</div>
        <div className="text-xs text-gray-500 dark:text-gray-400">Total Items</div>
      </div>

      {/* By Status */}
      <div>
        <h4 className="text-xs font-semibold text-gray-700 dark:text-gray-300 mb-2">By Status</h4>
        <div className="space-y-2">
          <StatItem label="Pending" value={stats.byStatus.pending} color="bg-yellow-500" />
          <StatItem label="Triaged" value={stats.byStatus.triaged} color="bg-blue-500" />
          <StatItem label="Assigned" value={stats.byStatus.assigned} color="bg-green-500" />
          <StatItem label="Duplicate" value={stats.byStatus.duplicate} color="bg-gray-500" />
          <StatItem label="Resolved" value={stats.byStatus.resolved} color="bg-purple-500" />
          <StatItem label="Ignored" value={stats.byStatus.ignored} color="bg-gray-400" />
        </div>
      </div>

      {/* By Severity */}
      <div>
        <h4 className="text-xs font-semibold text-gray-700 dark:text-gray-300 mb-2">By Severity</h4>
        <div className="space-y-2">
          <StatItem label="Critical" value={stats.bySeverity.critical} color="bg-red-500" />
          <StatItem label="High" value={stats.bySeverity.high} color="bg-orange-500" />
          <StatItem label="Medium" value={stats.bySeverity.medium} color="bg-yellow-500" />
          <StatItem label="Low" value={stats.bySeverity.low} color="bg-blue-500" />
          <StatItem label="Info" value={stats.bySeverity.info} color="bg-gray-500" />
        </div>
      </div>

      {/* By Source */}
      <div>
        <h4 className="text-xs font-semibold text-gray-700 dark:text-gray-300 mb-2">By Source</h4>
        <div className="space-y-2">
          <StatItem label="GitHub" value={stats.bySource.github_issue} />
          <StatItem label="CI/CD" value={stats.bySource.ci_failure} />
          <StatItem label="Error Log" value={stats.bySource.error_log} />
          <StatItem label="Feedback" value={stats.bySource.user_feedback} />
          <StatItem label="Sentry" value={stats.bySource.sentry} />
          <StatItem label="Manual" value={stats.bySource.manual} />
        </div>
      </div>

      {/* Clusters */}
      <div className="p-3 rounded-lg bg-purple-50 dark:bg-purple-950">
        <div className="flex items-center gap-2 mb-1">
          <AlertCircle size={14} className="text-purple-500" />
          <div className="text-sm font-bold text-purple-900 dark:text-purple-100">
            {stats.clustersCount}
          </div>
        </div>
        <div className="text-xs text-purple-700 dark:text-purple-300">Clusters</div>
      </div>

      {/* Avg Triage Time */}
      {stats.avgTriageTime > 0 && (
        <div className="p-3 rounded-lg bg-blue-50 dark:bg-blue-950">
          <div className="flex items-center gap-2 mb-1">
            <Clock size={14} className="text-blue-500" />
            <div className="text-sm font-bold text-blue-900 dark:text-blue-100">
              {formatTime(stats.avgTriageTime)}
            </div>
          </div>
          <div className="text-xs text-blue-700 dark:text-blue-300">Avg Triage Time</div>
        </div>
      )}
    </div>
  );
}

function StatItem({ label, value, color }: { label: string; value: number; color?: string }) {
  return (
    <div className="flex items-center justify-between text-xs">
      <div className="flex items-center gap-2">
        {color && <div className={`w-2 h-2 rounded-full ${color}`} />}
        <span className="text-gray-600 dark:text-gray-400">{label}</span>
      </div>
      <span className="font-semibold text-gray-900 dark:text-white">{value}</span>
    </div>
  );
}
