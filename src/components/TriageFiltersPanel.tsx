'use client';

import { useState } from 'react';
import type { TriageFilters, TriageStatus, TriageSource, TriageSeverity } from '@/types/triage';
import { Search, X } from 'lucide-react';

interface TriageFiltersPanelProps {
  filters: TriageFilters;
  onApplyFilters: (filters: TriageFilters) => void;
}

export function TriageFiltersPanel({ filters, onApplyFilters }: TriageFiltersPanelProps) {
  const [localFilters, setLocalFilters] = useState<TriageFilters>(filters);

  const handleStatusToggle = (status: TriageStatus) => {
    const current = localFilters.status || [];
    const updated = current.includes(status)
      ? current.filter(s => s !== status)
      : [...current, status];
    setLocalFilters({ ...localFilters, status: updated });
  };

  const handleSourceToggle = (source: TriageSource) => {
    const current = localFilters.source || [];
    const updated = current.includes(source)
      ? current.filter(s => s !== source)
      : [...current, source];
    setLocalFilters({ ...localFilters, source: updated });
  };

  const handleSeverityToggle = (severity: TriageSeverity) => {
    const current = localFilters.severity || [];
    const updated = current.includes(severity)
      ? current.filter(s => s !== severity)
      : [...current, severity];
    setLocalFilters({ ...localFilters, severity: updated });
  };

  const handleSearchChange = (search: string) => {
    setLocalFilters({ ...localFilters, search: search || undefined });
  };

  const handleClearFilters = () => {
    const cleared: TriageFilters = {};
    setLocalFilters(cleared);
    onApplyFilters(cleared);
  };

  const handleApply = () => {
    onApplyFilters(localFilters);
  };

  const hasActiveFilters =
    (localFilters.status && localFilters.status.length > 0) ||
    (localFilters.source && localFilters.source.length > 0) ||
    (localFilters.severity && localFilters.severity.length > 0) ||
    !!localFilters.search;

  return (
    <div className="p-4 rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 space-y-4">
      {/* Search */}
      <div>
        <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-2">
          Search
        </label>
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={16} />
          <input
            type="text"
            value={localFilters.search || ''}
            onChange={(e) => handleSearchChange(e.target.value)}
            placeholder="Search title or description..."
            className="w-full pl-9 pr-3 py-2 text-sm rounded-lg bg-gray-50 dark:bg-gray-900 border border-gray-300 dark:border-gray-600 text-gray-900 dark:text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>
      </div>

      {/* Status */}
      <div>
        <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-2">
          Status
        </label>
        <div className="flex flex-wrap gap-2">
          {(['pending', 'triaged', 'assigned', 'duplicate', 'resolved', 'ignored'] as TriageStatus[]).map(status => (
            <button
              key={status}
              onClick={() => handleStatusToggle(status)}
              className={`px-3 py-1.5 text-xs rounded-lg capitalize transition-colors ${
                localFilters.status?.includes(status)
                  ? 'bg-blue-500 text-white'
                  : 'bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600'
              }`}
            >
              {status}
            </button>
          ))}
        </div>
      </div>

      {/* Source */}
      <div>
        <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-2">
          Source
        </label>
        <div className="flex flex-wrap gap-2">
          {(['github_issue', 'ci_failure', 'error_log', 'user_feedback', 'sentry', 'manual'] as TriageSource[]).map(source => (
            <button
              key={source}
              onClick={() => handleSourceToggle(source)}
              className={`px-3 py-1.5 text-xs rounded-lg transition-colors ${
                localFilters.source?.includes(source)
                  ? 'bg-blue-500 text-white'
                  : 'bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600'
              }`}
            >
              {source.replace('_', ' ')}
            </button>
          ))}
        </div>
      </div>

      {/* Severity */}
      <div>
        <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-2">
          Severity
        </label>
        <div className="flex flex-wrap gap-2">
          {(['critical', 'high', 'medium', 'low', 'info'] as TriageSeverity[]).map(severity => (
            <button
              key={severity}
              onClick={() => handleSeverityToggle(severity)}
              className={`px-3 py-1.5 text-xs rounded-lg capitalize transition-colors ${
                localFilters.severity?.includes(severity)
                  ? 'bg-blue-500 text-white'
                  : 'bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600'
              }`}
            >
              {severity}
            </button>
          ))}
        </div>
      </div>

      {/* Actions */}
      <div className="flex gap-2 pt-2">
        <button
          onClick={handleApply}
          className="flex-1 px-4 py-2 bg-blue-500 text-white rounded-lg text-sm font-medium hover:bg-blue-600 transition-colors"
        >
          Apply Filters
        </button>
        {hasActiveFilters && (
          <button
            onClick={handleClearFilters}
            className="px-4 py-2 bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded-lg text-sm font-medium hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors flex items-center gap-2"
          >
            <X size={16} />
            Clear
          </button>
        )}
      </div>
    </div>
  );
}
