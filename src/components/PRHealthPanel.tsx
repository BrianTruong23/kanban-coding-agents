'use client';

import { useEffect, useState } from 'react';
import {
  Activity,
  AlertTriangle,
  CheckCircle,
  XCircle,
  Clock,
  FileWarning,
  Users,
  TrendingUp
} from 'lucide-react';
import { PRHealth } from '@/types/pr-orchestration';
import { analyzePRHealth } from '@/lib/git-operations';

interface PRHealthPanelProps {
  prNumber: number;
}

export function PRHealthPanel({ prNumber }: PRHealthPanelProps) {
  const [health, setHealth] = useState<PRHealth | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadHealth();
  }, [prNumber]);

  const loadHealth = async () => {
    setLoading(true);
    try {
      const data = await analyzePRHealth(prNumber);
      setHealth(data);
    } catch (error) {
      console.error('Failed to load PR health:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-6">
        <div className="flex items-center justify-center py-8">
          <Clock className="animate-spin text-gray-400" size={24} />
        </div>
      </div>
    );
  }

  if (!health) {
    return (
      <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-6">
        <p className="text-center text-gray-500 dark:text-gray-400">
          No health data available
        </p>
      </div>
    );
  }

  const getScoreColor = (score: number) => {
    if (score >= 80) return 'text-green-600 dark:text-green-400';
    if (score >= 60) return 'text-yellow-600 dark:text-yellow-400';
    return 'text-red-600 dark:text-red-400';
  };

  const getScoreBgColor = (score: number) => {
    if (score >= 80) return 'bg-green-100 dark:bg-green-900/30';
    if (score >= 60) return 'bg-yellow-100 dark:bg-yellow-900/30';
    return 'bg-red-100 dark:bg-red-900/30';
  };

  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700">
      {/* Header with Score */}
      <div className="p-6 border-b border-gray-200 dark:border-gray-700">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Activity className="text-blue-500" size={20} />
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
              PR Health - #{prNumber}
            </h3>
          </div>
          <div className={`${getScoreBgColor(health.overallScore)} px-4 py-2 rounded-lg`}>
            <span className={`text-2xl font-bold ${getScoreColor(health.overallScore)}`}>
              {health.overallScore}
            </span>
            <span className="text-sm text-gray-600 dark:text-gray-400 ml-1">/100</span>
          </div>
        </div>
      </div>

      <div className="p-6 space-y-6">
        {/* Failing Checks */}
        <div>
          <div className="flex items-center gap-2 mb-3">
            <XCircle className="text-red-500" size={18} />
            <h4 className="font-semibold text-gray-900 dark:text-white">
              Failing Checks ({health.failingChecks.length})
            </h4>
          </div>
          {health.failingChecks.length === 0 ? (
            <div className="flex items-center gap-2 text-green-600 dark:text-green-400 text-sm bg-green-50 dark:bg-green-900/20 p-3 rounded-lg">
              <CheckCircle size={16} />
              <span>All checks passing</span>
            </div>
          ) : (
            <div className="space-y-2">
              {health.failingChecks.map((check, idx) => (
                <div
                  key={idx}
                  className="bg-red-50 dark:bg-red-900/20 p-3 rounded-lg border border-red-200 dark:border-red-800"
                >
                  <div className="flex items-start justify-between">
                    <div>
                      <p className="font-medium text-red-900 dark:text-red-300">
                        {check.name}
                      </p>
                      {check.description && (
                        <p className="text-sm text-red-700 dark:text-red-400 mt-1">
                          {check.description}
                        </p>
                      )}
                    </div>
                    <span className="text-xs px-2 py-1 bg-red-200 dark:bg-red-800 text-red-900 dark:text-red-200 rounded-full">
                      {check.status}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Flaky Tests */}
        <div>
          <div className="flex items-center gap-2 mb-3">
            <AlertTriangle className="text-yellow-500" size={18} />
            <h4 className="font-semibold text-gray-900 dark:text-white">
              Flaky Tests ({health.flakyTests.length})
            </h4>
          </div>
          {health.flakyTests.length === 0 ? (
            <div className="text-sm text-gray-600 dark:text-gray-400 bg-gray-50 dark:bg-gray-900 p-3 rounded-lg">
              No flaky tests detected
            </div>
          ) : (
            <div className="space-y-2">
              {health.flakyTests.map((test, idx) => (
                <div
                  key={idx}
                  className="bg-yellow-50 dark:bg-yellow-900/20 p-3 rounded-lg border border-yellow-200 dark:border-yellow-800"
                >
                  <code className="text-sm text-yellow-900 dark:text-yellow-300">
                    {test}
                  </code>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Conflict Risks */}
        <div>
          <div className="flex items-center gap-2 mb-3">
            <FileWarning className="text-orange-500" size={18} />
            <h4 className="font-semibold text-gray-900 dark:text-white">
              Conflict Risks ({health.conflictRisks.length})
            </h4>
          </div>
          {health.conflictRisks.length === 0 ? (
            <div className="flex items-center gap-2 text-green-600 dark:text-green-400 text-sm bg-green-50 dark:bg-green-900/20 p-3 rounded-lg">
              <CheckCircle size={16} />
              <span>No conflict risks detected</span>
            </div>
          ) : (
            <div className="space-y-2">
              {health.conflictRisks.map((risk, idx) => {
                const riskColors = {
                  high: 'border-red-200 dark:border-red-800 bg-red-50 dark:bg-red-900/20',
                  medium: 'border-orange-200 dark:border-orange-800 bg-orange-50 dark:bg-orange-900/20',
                  low: 'border-yellow-200 dark:border-yellow-800 bg-yellow-50 dark:bg-yellow-900/20',
                };
                return (
                  <div
                    key={idx}
                    className={`p-3 rounded-lg border ${riskColors[risk.risk]}`}
                  >
                    <div className="flex items-start justify-between mb-2">
                      <code className="text-sm text-gray-900 dark:text-gray-100 font-mono">
                        {risk.file}
                      </code>
                      <span
                        className={`text-xs px-2 py-1 rounded-full uppercase font-semibold ${
                          risk.risk === 'high'
                            ? 'bg-red-200 dark:bg-red-800 text-red-900 dark:text-red-200'
                            : risk.risk === 'medium'
                            ? 'bg-orange-200 dark:bg-orange-800 text-orange-900 dark:text-orange-200'
                            : 'bg-yellow-200 dark:bg-yellow-800 text-yellow-900 dark:text-yellow-200'
                        }`}
                      >
                        {risk.risk}
                      </span>
                    </div>
                    <p className="text-sm text-gray-700 dark:text-gray-300">{risk.reason}</p>
                    {risk.affectedBranches && risk.affectedBranches.length > 0 && (
                      <div className="mt-2">
                        <p className="text-xs text-gray-600 dark:text-gray-400 mb-1">
                          Affected branches:
                        </p>
                        <div className="flex flex-wrap gap-1">
                          {risk.affectedBranches.map((branch, bIdx) => (
                            <code
                              key={bIdx}
                              className="text-xs bg-white dark:bg-gray-800 px-2 py-1 rounded"
                            >
                              {branch}
                            </code>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* File Hotspots */}
        <div>
          <div className="flex items-center gap-2 mb-3">
            <TrendingUp className="text-purple-500" size={18} />
            <h4 className="font-semibold text-gray-900 dark:text-white">
              File Hotspots ({health.fileHotspots.length})
            </h4>
          </div>
          <div className="space-y-2">
            {health.fileHotspots.slice(0, 5).map((hotspot, idx) => (
              <div
                key={idx}
                className="bg-purple-50 dark:bg-purple-900/20 p-3 rounded-lg border border-purple-200 dark:border-purple-800"
              >
                <div className="flex items-start justify-between mb-2">
                  <code className="text-sm text-gray-900 dark:text-gray-100 font-mono">
                    {hotspot.file}
                  </code>
                  <span
                    className={`text-xs px-2 py-1 rounded-full ${
                      hotspot.complexity === 'high'
                        ? 'bg-red-200 dark:bg-red-800 text-red-900 dark:text-red-200'
                        : hotspot.complexity === 'medium'
                        ? 'bg-yellow-200 dark:bg-yellow-800 text-yellow-900 dark:text-yellow-200'
                        : 'bg-green-200 dark:bg-green-800 text-green-900 dark:text-green-200'
                    }`}
                  >
                    {hotspot.complexity}
                  </span>
                </div>
                <div className="grid grid-cols-3 gap-4 text-xs">
                  <div>
                    <p className="text-gray-600 dark:text-gray-400">Changes</p>
                    <p className="font-semibold text-gray-900 dark:text-white">
                      {hotspot.changeFrequency}
                    </p>
                  </div>
                  <div>
                    <p className="text-gray-600 dark:text-gray-400">Lines</p>
                    <p className="font-semibold text-gray-900 dark:text-white">
                      {hotspot.linesChanged}
                    </p>
                  </div>
                  <div>
                    <p className="text-gray-600 dark:text-gray-400">Authors</p>
                    <div className="flex items-center gap-1">
                      <Users size={12} />
                      <p className="font-semibold text-gray-900 dark:text-white">
                        {hotspot.authors.length}
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Refresh Button */}
        <button
          onClick={loadHealth}
          className="w-full px-4 py-2 bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded-lg font-medium hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors"
        >
          Refresh Health Check
        </button>
      </div>
    </div>
  );
}
