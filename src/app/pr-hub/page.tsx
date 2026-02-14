'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import { ThemeToggle } from '@/components/ThemeToggle';
import { BranchCreator } from '@/components/BranchCreator';
import { PRManager } from '@/components/PRManager';
import { PRHealthPanel } from '@/components/PRHealthPanel';
import { LogOut, ArrowLeft, GitBranch } from 'lucide-react';

export default function PRHubPage() {
  const { user, signOut, isLoading: authLoading } = useAuth();
  const router = useRouter();
  const [selectedPRForHealth, setSelectedPRForHealth] = useState<number | null>(15);
  const [notification, setNotification] = useState<{
    type: 'success' | 'error' | 'info';
    message: string;
  } | null>(null);

  const handleSignOut = async () => {
    await signOut();
    router.push('/login');
  };

  const showNotification = (type: 'success' | 'error' | 'info', message: string) => {
    setNotification({ type, message });
    setTimeout(() => setNotification(null), 5000);
  };

  const handleBranchCreate = (branchName: string, type: string) => {
    // In production, this would call an API to create the branch
    console.log('Creating branch:', branchName, type);
    showNotification('success', `Branch "${branchName}" would be created. (Git operations handled by orchestrator)`);
  };

  const handleCreatePR = (branch: string, title: string, description: string) => {
    // In production, this would call GitHub API
    console.log('Creating PR:', { branch, title, description });
    showNotification('success', `PR would be created for branch "${branch}". (GitHub operations handled by orchestrator)`);
  };

  const handleMergePR = (prNumber: number) => {
    // In production, this would call GitHub API
    console.log('Merging PR:', prNumber);
    showNotification('success', `PR #${prNumber} would be merged. (GitHub operations handled by orchestrator)`);
  };

  const handleRebase = (branch: string, targetBranch: string) => {
    // In production, this would call an API to rebase
    console.log('Rebasing:', branch, 'onto', targetBranch);
    showNotification('info', `Branch "${branch}" would be rebased onto "${targetBranch}". (Git operations handled by orchestrator)`);
  };

  if (authLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gray-100 dark:bg-gray-900 text-gray-400 dark:text-gray-500">
        Loading...
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-100 dark:bg-gray-900 transition-colors">
      {/* Header */}
      <header className="bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 sticky top-0 z-10">
        <div className="max-w-[1600px] mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <button
                onClick={() => router.push('/')}
                className="p-2 text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
                title="Back to Kanban Board"
              >
                <ArrowLeft size={20} />
              </button>
              <div className="flex items-center gap-2">
                <GitBranch className="text-blue-500" size={24} />
                <h1 className="text-xl font-bold text-gray-900 dark:text-white">
                  PR & Branch Orchestration Hub
                </h1>
              </div>
            </div>

            <div className="flex items-center gap-3">
              {user ? (
                <div className="flex items-center gap-2 bg-gray-100 dark:bg-gray-700 px-3 py-1.5 rounded-lg">
                  <span className="text-sm text-gray-600 dark:text-gray-300 max-w-[150px] truncate">
                    {user.email}
                  </span>
                  <button
                    onClick={handleSignOut}
                    className="p-1.5 text-gray-400 hover:text-red-500 dark:hover:text-red-400 transition-colors"
                    title="Sign out"
                  >
                    <LogOut size={16} />
                  </button>
                </div>
              ) : (
                <button
                  onClick={handleSignOut}
                  className="px-3 py-1.5 text-blue-500 hover:text-blue-700 dark:text-blue-400 dark:hover:text-blue-300 transition-colors text-sm font-bold uppercase"
                >
                  Login
                </button>
              )}
              <ThemeToggle />
            </div>
          </div>
        </div>
      </header>

      {/* Notification */}
      {notification && (
        <div className="max-w-[1600px] mx-auto px-6 pt-4">
          <div
            className={`p-4 rounded-lg ${
              notification.type === 'success'
                ? 'bg-green-50 dark:bg-green-900/20 text-green-800 dark:text-green-300 border border-green-200 dark:border-green-800'
                : notification.type === 'error'
                ? 'bg-red-50 dark:bg-red-900/20 text-red-800 dark:text-red-300 border border-red-200 dark:border-red-800'
                : 'bg-blue-50 dark:bg-blue-900/20 text-blue-800 dark:text-blue-300 border border-blue-200 dark:border-blue-800'
            }`}
          >
            {notification.message}
          </div>
        </div>
      )}

      {/* Main Content */}
      <main className="max-w-[1600px] mx-auto px-6 py-6">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Left Column */}
          <div className="space-y-6">
            {/* Branch Creator */}
            <BranchCreator onBranchCreate={handleBranchCreate} />

            {/* PR Manager */}
            <PRManager
              onCreatePR={handleCreatePR}
              onMergePR={handleMergePR}
              onRebase={handleRebase}
            />
          </div>

          {/* Right Column - PR Health */}
          <div className="space-y-6">
            {/* PR Health Panel */}
            {selectedPRForHealth !== null && (
              <PRHealthPanel prNumber={selectedPRForHealth} />
            )}

            {/* Info Panel */}
            <div className="bg-blue-50 dark:bg-blue-900/20 rounded-lg border border-blue-200 dark:border-blue-800 p-6">
              <h3 className="font-semibold text-blue-900 dark:text-blue-300 mb-3">
                About This Hub
              </h3>
              <div className="space-y-2 text-sm text-blue-800 dark:text-blue-400">
                <p>
                  <strong>One-Click Branch Creation:</strong> Create branches following naming conventions with automatic validation.
                </p>
                <p>
                  <strong>PR Management:</strong> Open PRs, request reviews, and merge with confidence.
                </p>
                <p>
                  <strong>Rebase Support:</strong> Keep branches up-to-date with one click.
                </p>
                <p>
                  <strong>PR Health Monitoring:</strong> Track failing checks, flaky tests, conflict risks, and file hotspots.
                </p>
                <p className="mt-4 pt-3 border-t border-blue-200 dark:border-blue-700">
                  <strong>Note:</strong> Actual Git and GitHub operations are handled by the orchestrator. This UI provides a centralized interface for managing your development workflow.
                </p>
              </div>
            </div>

            {/* Quick Actions */}
            <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-6">
              <h3 className="font-semibold text-gray-900 dark:text-white mb-4">
                Quick Actions
              </h3>
              <div className="space-y-2">
                <button
                  onClick={() => showNotification('info', 'Fetching latest changes from remote...')}
                  className="w-full px-4 py-2 bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors text-left text-sm"
                >
                  🔄 Fetch Latest Changes
                </button>
                <button
                  onClick={() => showNotification('info', 'Checking for stale branches...')}
                  className="w-full px-4 py-2 bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors text-left text-sm"
                >
                  🗑️ Clean Up Stale Branches
                </button>
                <button
                  onClick={() => showNotification('info', 'Syncing with main branch...')}
                  className="w-full px-4 py-2 bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors text-left text-sm"
                >
                  ⚡ Sync All Branches
                </button>
                <button
                  onClick={() => router.push('/')}
                  className="w-full px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors text-left text-sm font-medium"
                >
                  📋 Back to Kanban Board
                </button>
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
