'use client';

import { useState, useEffect } from 'react';
import {
  GitPullRequest,
  GitMerge,
  RefreshCw,
  ExternalLink,
  Users,
  Clock,
  CheckCircle,
  XCircle,
  AlertCircle,
} from 'lucide-react';
import { PullRequest, Mergeability } from '@/types/pr-orchestration';
import { getPullRequests, checkMergeability, generatePRMetadata } from '@/lib/git-operations';

interface PRManagerProps {
  onCreatePR?: (branch: string, title: string, description: string) => void;
  onMergePR?: (prNumber: number) => void;
  onRebase?: (branch: string, targetBranch: string) => void;
}

export function PRManager({ onCreatePR, onMergePR, onRebase }: PRManagerProps) {
  const [prs, setPRs] = useState<PullRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedPR, setSelectedPR] = useState<number | null>(null);
  const [mergeability, setMergeability] = useState<Mergeability | null>(null);
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [newPRBranch, setNewPRBranch] = useState('');
  const [newPRTitle, setNewPRTitle] = useState('');
  const [newPRDescription, setNewPRDescription] = useState('');

  useEffect(() => {
    loadPRs();
  }, []);

  useEffect(() => {
    if (selectedPR !== null) {
      loadMergeability(selectedPR);
    }
  }, [selectedPR]);

  const loadPRs = async () => {
    setLoading(true);
    try {
      const data = await getPullRequests();
      setPRs(data);
    } catch (error) {
      console.error('Failed to load PRs:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadMergeability = async (prNumber: number) => {
    try {
      const data = await checkMergeability(prNumber);
      setMergeability(data);
    } catch (error) {
      console.error('Failed to check mergeability:', error);
    }
  };

  const handleAutoFill = () => {
    const metadata = generatePRMetadata(newPRBranch);
    setNewPRTitle(metadata.title);
    setNewPRDescription(metadata.description);
  };

  const handleCreatePR = () => {
    if (newPRBranch && newPRTitle) {
      onCreatePR?.(newPRBranch, newPRTitle, newPRDescription);
      setShowCreateForm(false);
      setNewPRBranch('');
      setNewPRTitle('');
      setNewPRDescription('');
    }
  };

  const getStatusIcon = (state: PullRequest['state']) => {
    switch (state) {
      case 'open':
        return <GitPullRequest className="text-green-500" size={18} />;
      case 'merged':
        return <GitMerge className="text-purple-500" size={18} />;
      case 'closed':
        return <XCircle className="text-red-500" size={18} />;
    }
  };

  const getCheckStatusColor = (status: string) => {
    switch (status) {
      case 'success':
        return 'text-green-600 dark:text-green-400';
      case 'failure':
      case 'error':
        return 'text-red-600 dark:text-red-400';
      case 'pending':
        return 'text-yellow-600 dark:text-yellow-400';
      default:
        return 'text-gray-600 dark:text-gray-400';
    }
  };

  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700">
      {/* Header */}
      <div className="p-6 border-b border-gray-200 dark:border-gray-700">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <GitPullRequest className="text-green-500" size={20} />
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
              Pull Request Manager
            </h3>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={loadPRs}
              className="p-2 text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
              title="Refresh PRs"
            >
              <RefreshCw size={18} />
            </button>
            <button
              onClick={() => setShowCreateForm(!showCreateForm)}
              className="px-4 py-2 bg-green-500 text-white rounded-lg font-medium hover:bg-green-600 transition-colors text-sm"
            >
              Create PR
            </button>
          </div>
        </div>
      </div>

      {/* Create PR Form */}
      {showCreateForm && (
        <div className="p-6 border-b border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-900">
          <h4 className="font-semibold text-gray-900 dark:text-white mb-4">
            Create New Pull Request
          </h4>
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Branch Name
              </label>
              <div className="flex gap-2">
                <input
                  type="text"
                  value={newPRBranch}
                  onChange={(e) => setNewPRBranch(e.target.value)}
                  placeholder="feature/my-feature"
                  className="flex-1 px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-green-500"
                />
                <button
                  onClick={handleAutoFill}
                  disabled={!newPRBranch}
                  className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 disabled:bg-gray-300 dark:disabled:bg-gray-700 disabled:cursor-not-allowed transition-colors text-sm"
                >
                  Auto-fill
                </button>
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                PR Title
              </label>
              <input
                type="text"
                value={newPRTitle}
                onChange={(e) => setNewPRTitle(e.target.value)}
                placeholder="Add new feature"
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-green-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Description
              </label>
              <textarea
                value={newPRDescription}
                onChange={(e) => setNewPRDescription(e.target.value)}
                placeholder="Describe the changes..."
                rows={6}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-green-500 resize-none font-mono text-sm"
              />
            </div>
            <div className="flex justify-end gap-2">
              <button
                onClick={() => setShowCreateForm(false)}
                className="px-4 py-2 text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleCreatePR}
                disabled={!newPRBranch || !newPRTitle}
                className="px-4 py-2 bg-green-500 text-white rounded-lg hover:bg-green-600 disabled:bg-gray-300 dark:disabled:bg-gray-700 disabled:cursor-not-allowed transition-colors"
              >
                Create Pull Request
              </button>
            </div>
          </div>
        </div>
      )}

      {/* PR List */}
      <div className="divide-y divide-gray-200 dark:divide-gray-700">
        {loading ? (
          <div className="p-8 text-center text-gray-500 dark:text-gray-400">
            Loading pull requests...
          </div>
        ) : prs.length === 0 ? (
          <div className="p-8 text-center text-gray-500 dark:text-gray-400">
            No pull requests found
          </div>
        ) : (
          prs.map((pr) => (
            <div
              key={pr.number}
              className={`p-6 hover:bg-gray-50 dark:hover:bg-gray-900 transition-colors cursor-pointer ${
                selectedPR === pr.number ? 'bg-blue-50 dark:bg-blue-900/20' : ''
              }`}
              onClick={() => setSelectedPR(selectedPR === pr.number ? null : pr.number)}
            >
              {/* PR Header */}
              <div className="flex items-start gap-3">
                {getStatusIcon(pr.state)}
                <div className="flex-1 min-w-0">
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex-1">
                      <h4 className="font-semibold text-gray-900 dark:text-white">
                        #{pr.number}: {pr.title}
                      </h4>
                      <div className="flex items-center gap-3 mt-1 text-xs text-gray-600 dark:text-gray-400">
                        <span>{pr.branch} → {pr.baseBranch}</span>
                        <span>•</span>
                        <span>by {pr.author}</span>
                        <span>•</span>
                        <span className="flex items-center gap-1">
                          <Clock size={12} />
                          {new Date(pr.updatedAt).toLocaleDateString()}
                        </span>
                      </div>
                    </div>
                    <a
                      href={`https://github.com/repo/pull/${pr.number}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-blue-500 hover:text-blue-600"
                      onClick={(e) => e.stopPropagation()}
                    >
                      <ExternalLink size={16} />
                    </a>
                  </div>

                  {/* PR Stats */}
                  <div className="flex items-center gap-4 mt-3 text-sm">
                    {pr.checks && pr.checks.length > 0 && (
                      <div className="flex items-center gap-1">
                        {pr.checks.every((c) => c.status === 'success') ? (
                          <CheckCircle className="text-green-500" size={14} />
                        ) : pr.checks.some((c) => c.status === 'failure' || c.status === 'error') ? (
                          <XCircle className="text-red-500" size={14} />
                        ) : (
                          <Clock className="text-yellow-500" size={14} />
                        )}
                        <span className="text-gray-600 dark:text-gray-400">
                          {pr.checks.filter((c) => c.status === 'success').length}/{pr.checks.length} checks
                        </span>
                      </div>
                    )}
                    {pr.reviewers && pr.reviewers.length > 0 && (
                      <div className="flex items-center gap-1 text-gray-600 dark:text-gray-400">
                        <Users size={14} />
                        <span>{pr.approvals ?? 0}/{pr.reviewers.length} approved</span>
                      </div>
                    )}
                    {pr.changedFiles !== undefined && (
                      <span className="text-gray-600 dark:text-gray-400">
                        {pr.changedFiles} files
                      </span>
                    )}
                    {pr.additions !== undefined && pr.deletions !== undefined && (
                      <span className="text-gray-600 dark:text-gray-400">
                        <span className="text-green-600 dark:text-green-400">+{pr.additions}</span>
                        {' / '}
                        <span className="text-red-600 dark:text-red-400">-{pr.deletions}</span>
                      </span>
                    )}
                  </div>

                  {/* Expanded Details */}
                  {selectedPR === pr.number && mergeability && (
                    <div className="mt-4 pt-4 border-t border-gray-200 dark:border-gray-700">
                      {/* Mergeability Status */}
                      <div className="mb-4">
                        <h5 className="font-semibold text-gray-900 dark:text-white mb-2 text-sm">
                          Merge Status
                        </h5>
                        {mergeability.canMerge ? (
                          <div className="flex items-center gap-2 text-green-600 dark:text-green-400 bg-green-50 dark:bg-green-900/20 p-3 rounded-lg">
                            <CheckCircle size={16} />
                            <span className="text-sm font-medium">Ready to merge</span>
                          </div>
                        ) : (
                          <div className="space-y-2">
                            {mergeability.blockers.map((blocker, idx) => (
                              <div
                                key={idx}
                                className="flex items-center gap-2 text-red-600 dark:text-red-400 bg-red-50 dark:bg-red-900/20 p-3 rounded-lg"
                              >
                                <XCircle size={16} />
                                <span className="text-sm">{blocker}</span>
                              </div>
                            ))}
                            {mergeability.warnings.map((warning, idx) => (
                              <div
                                key={idx}
                                className="flex items-center gap-2 text-yellow-600 dark:text-yellow-400 bg-yellow-50 dark:bg-yellow-900/20 p-3 rounded-lg"
                              >
                                <AlertCircle size={16} />
                                <span className="text-sm">{warning}</span>
                              </div>
                            ))}
                          </div>
                        )}
                      </div>

                      {/* Action Buttons */}
                      <div className="flex gap-2">
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            onRebase?.(pr.branch, pr.baseBranch);
                          }}
                          className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors text-sm flex items-center gap-2"
                        >
                          <RefreshCw size={14} />
                          Rebase on {pr.baseBranch}
                        </button>
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            onMergePR?.(pr.number);
                          }}
                          disabled={!mergeability.canMerge}
                          className="px-4 py-2 bg-purple-500 text-white rounded-lg hover:bg-purple-600 disabled:bg-gray-300 dark:disabled:bg-gray-700 disabled:cursor-not-allowed transition-colors text-sm flex items-center gap-2"
                        >
                          <GitMerge size={14} />
                          Merge PR
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
