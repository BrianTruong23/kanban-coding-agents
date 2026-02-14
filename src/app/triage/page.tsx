'use client';

import { useAuth } from '@/contexts/AuthContext';
import { TriageInbox } from '@/components/TriageInbox';
import { useRouter } from 'next/navigation';
import { useEffect } from 'react';
import { ThemeToggle } from '@/components/ThemeToggle';
import { LogOut, Home } from 'lucide-react';
import Link from 'next/link';

export default function TriagePage() {
  const { user, signOut, isLoading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!isLoading && !user) {
      router.push('/login');
    }
  }, [user, isLoading, router]);

  const handleSignOut = async () => {
    await signOut();
    router.push('/login');
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen text-gray-400 dark:text-gray-500">
        Loading...
      </div>
    );
  }

  if (!user) {
    return null;
  }

  return (
    <div className="flex flex-col h-screen bg-gray-100 dark:bg-gray-900 overflow-hidden transition-colors">
      {/* Header */}
      <header className="flex-none p-4 flex justify-between items-center z-10 border-b border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800">
        <div className="flex items-center gap-4">
          <Link
            href="/"
            className="p-2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 transition-colors"
            title="Back to Kanban Board"
          >
            <Home size={20} />
          </Link>
          <h1 className="text-sm font-semibold text-gray-400 dark:text-gray-500 hidden md:block">
            Triage Inbox
          </h1>
        </div>
        <div className="flex items-center gap-3 ml-auto">
          {user && (
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
          )}
          <ThemeToggle />
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1 overflow-hidden">
        <TriageInbox />
      </main>
    </div>
  );
}
