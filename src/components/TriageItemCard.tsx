'use client';

import { useState } from 'react';
import type { TriageItem, TriageCluster, TriageStatus, TriageSeverity } from '@/types/triage';
import type { CodingAgent } from '@/types/agent';
import {
  AlertCircle,
  AlertTriangle,
  Info,
  CheckCircle,
  Clock,
  User,
  Trash2,
  ExternalLink,
  ChevronDown,
  ChevronUp,
  Target,
} from 'lucide-react';

interface TriageItemCardProps {
  item: TriageItem;
  agents: CodingAgent[];
  cluster?: TriageCluster;
  onUpdateStatus: (itemId: string, status: TriageStatus) => Promise<void>;
  onUpdateSeverity: (itemId: string, severity: TriageSeverity) => Promise<void>;
  onAssign: (itemId: string, agentId: string) => Promise<void>;
  onConvertToTask: (itemId: string) => Promise<void>;
  onDelete: (itemId: string) => Promise<void>;
}

const severityConfig = {
  critical: { icon: AlertCircle, color: 'text-red-500', bg: 'bg-red-50 dark:bg-red-950', label: 'Critical' },
  high: { icon: AlertTriangle, color: 'text-orange-500', bg: 'bg-orange-50 dark:bg-orange-950', label: 'High' },
  medium: { icon: AlertTriangle, color: 'text-yellow-500', bg: 'bg-yellow-50 dark:bg-yellow-950', label: 'Medium' },
  low: { icon: Info, color: 'text-blue-500', bg: 'bg-blue-50 dark:bg-blue-950', label: 'Low' },
  info: { icon: Info, color: 'text-gray-500', bg: 'bg-gray-50 dark:bg-gray-800', label: 'Info' },
};

const sourceLabels = {
  github_issue: 'GitHub',
  ci_failure: 'CI/CD',
  error_log: 'Error Log',
  user_feedback: 'Feedback',
  sentry: 'Sentry',
  manual: 'Manual',
};

export function TriageItemCard({
  item,
  agents,
  cluster,
  onUpdateStatus,
  onUpdateSeverity,
  onAssign,
  onConvertToTask,
  onDelete,
}: TriageItemCardProps) {
  const [expanded, setExpanded] = useState(false);
  const [isUpdating, setIsUpdating] = useState(false);

  const severityInfo = severityConfig[item.severity];
  const SeverityIcon = severityInfo.icon;

  const handleStatusChange = async (status: TriageStatus) => {
    setIsUpdating(true);
    try {
      await onUpdateStatus(item.id, status);
    } finally {
      setIsUpdating(false);
    }
  };

  const handleSeverityChange = async (severity: TriageSeverity) => {
    setIsUpdating(true);
    try {
      await onUpdateSeverity(item.id, severity);
    } finally {
      setIsUpdating(false);
    }
  };

  const handleAssign = async (agentId: string) => {
    setIsUpdating(true);
    try {
      await onAssign(item.id, agentId);
    } finally {
      setIsUpdating(false);
    }
  };

  const handleConvertToTask = async () => {
    setIsUpdating(true);
    try {
      await onConvertToTask(item.id);
    } finally {
      setIsUpdating(false);
    }
  };

  const handleDelete = async () => {
    if (confirm('Are you sure you want to delete this triage item?')) {
      setIsUpdating(true);
      try {
        await onDelete(item.id);
      } finally {
        setIsUpdating(false);
      }
    }
  };

  const assignedAgent = agents.find(a => a.id === item.suggestedOwner);

  return (
    <div className={`rounded-lg border ${severityInfo.bg} border-gray-200 dark:border-gray-700 overflow-hidden transition-all ${isUpdating ? 'opacity-50' : ''}`}>
      <div className="p-4">
        {/* Header */}
        <div className="flex items-start justify-between gap-3">
          <div className="flex items-start gap-3 flex-1">
            <SeverityIcon className={`${severityInfo.color} flex-shrink-0 mt-1`} size={20} />
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 mb-1">
                <span className="text-xs font-medium px-2 py-0.5 rounded bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300">
                  {sourceLabels[item.source]}
                </span>
                {cluster && (
                  <span className="text-xs font-medium px-2 py-0.5 rounded bg-purple-100 dark:bg-purple-900 text-purple-700 dark:text-purple-300">
                    Clustered
                  </span>
                )}
                {item.status === 'duplicate' && (
                  <span className="text-xs font-medium px-2 py-0.5 rounded bg-yellow-100 dark:bg-yellow-900 text-yellow-700 dark:text-yellow-300">
                    Duplicate
                  </span>
                )}
              </div>
              <h3 className="text-sm font-semibold text-gray-900 dark:text-white mb-1">
                {item.title}
              </h3>
              <p className="text-xs text-gray-600 dark:text-gray-400 line-clamp-2">
                {item.description}
              </p>

              {/* Tags */}
              {item.tags.length > 0 && (
                <div className="flex flex-wrap gap-1 mt-2">
                  {item.tags.map(tag => (
                    <span
                      key={tag}
                      className="text-xs px-2 py-0.5 rounded bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300"
                    >
                      {tag}
                    </span>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Actions */}
          <div className="flex items-center gap-1">
            <button
              onClick={() => setExpanded(!expanded)}
              className="p-1 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 transition-colors"
            >
              {expanded ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
            </button>
            <button
              onClick={handleDelete}
              disabled={isUpdating}
              className="p-1 text-gray-400 hover:text-red-500 transition-colors disabled:opacity-50"
            >
              <Trash2 size={16} />
            </button>
          </div>
        </div>

        {/* Expanded Details */}
        {expanded && (
          <div className="mt-4 pt-4 border-t border-gray-200 dark:border-gray-700 space-y-3">
            {/* Severity Selector */}
            <div>
              <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">
                Severity
              </label>
              <div className="flex gap-1">
                {(['critical', 'high', 'medium', 'low', 'info'] as TriageSeverity[]).map(severity => (
                  <button
                    key={severity}
                    onClick={() => handleSeverityChange(severity)}
                    disabled={isUpdating}
                    className={`px-2 py-1 text-xs rounded transition-colors ${
                      item.severity === severity
                        ? 'bg-blue-500 text-white'
                        : 'bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600'
                    }`}
                  >
                    {severityConfig[severity].label}
                  </button>
                ))}
              </div>
            </div>

            {/* Status Selector */}
            <div>
              <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">
                Status
              </label>
              <div className="flex flex-wrap gap-1">
                {(['pending', 'triaged', 'assigned', 'resolved', 'ignored'] as TriageStatus[]).map(status => (
                  <button
                    key={status}
                    onClick={() => handleStatusChange(status)}
                    disabled={isUpdating}
                    className={`px-2 py-1 text-xs rounded capitalize transition-colors ${
                      item.status === status
                        ? 'bg-blue-500 text-white'
                        : 'bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600'
                    }`}
                  >
                    {status}
                  </button>
                ))}
              </div>
            </div>

            {/* Agent Selector */}
            <div>
              <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">
                Assign to Agent
              </label>
              <div className="flex items-center gap-2">
                <select
                  value={item.suggestedOwner || ''}
                  onChange={(e) => handleAssign(e.target.value)}
                  disabled={isUpdating}
                  className="flex-1 px-2 py-1 text-xs rounded bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 text-gray-900 dark:text-white"
                >
                  <option value="">Select agent...</option>
                  {agents.map(agent => (
                    <option key={agent.id} value={agent.id}>
                      {agent.name}
                    </option>
                  ))}
                </select>
                {assignedAgent && (
                  <div className="flex items-center gap-1 text-xs text-gray-600 dark:text-gray-400">
                    <User size={12} />
                    {assignedAgent.name}
                  </div>
                )}
              </div>
            </div>

            {/* Reproduction Steps */}
            {item.reproductionSteps && item.reproductionSteps.length > 0 && (
              <div>
                <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Reproduction Steps
                </label>
                <ul className="list-none space-y-1 text-xs text-gray-600 dark:text-gray-400">
                  {item.reproductionSteps.map((step, idx) => (
                    <li key={idx}>{step}</li>
                  ))}
                </ul>
              </div>
            )}

            {/* Metadata */}
            {item.metadata.sourceUrl && (
              <div>
                <a
                  href={item.metadata.sourceUrl as string}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1 text-xs text-blue-500 hover:text-blue-600"
                >
                  View Source <ExternalLink size={12} />
                </a>
              </div>
            )}

            {/* Actions */}
            <div className="flex gap-2 pt-2">
              <button
                onClick={handleConvertToTask}
                disabled={isUpdating || !!item.assignedTaskId}
                className="flex-1 px-3 py-2 bg-blue-500 text-white rounded text-xs font-medium hover:bg-blue-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-1"
              >
                <Target size={14} />
                {item.assignedTaskId ? 'Converted to Task' : 'Convert to Task'}
              </button>
            </div>

            {/* Timestamps */}
            <div className="flex items-center gap-3 text-xs text-gray-500 dark:text-gray-400 pt-2 border-t border-gray-200 dark:border-gray-700">
              <span className="flex items-center gap-1">
                <Clock size={12} />
                Created {new Date(item.createdAt).toLocaleDateString()}
              </span>
              {item.triagedAt && (
                <span className="flex items-center gap-1">
                  <CheckCircle size={12} />
                  Triaged {new Date(item.triagedAt).toLocaleDateString()}
                </span>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
