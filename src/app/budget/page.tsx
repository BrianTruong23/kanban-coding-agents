'use client';

import { useAuth } from '@/contexts/AuthContext';
import { useRouter } from 'next/navigation';
import { BudgetDashboard } from '@/components/BudgetDashboard';
import { ThemeToggle } from '@/components/ThemeToggle';
import { LogOut, ArrowLeft } from 'lucide-react';
import Link from 'next/link';

export default function BudgetPage() {
  const { user, signOut, isLoading: authLoading } = useAuth();
  const router = useRouter();

  const handleSignOut = async () => {
    await signOut();
    router.push('/login');
  };

  if (authLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen text-gray-400 dark:text-gray-500">
        Loading...
      </div>
    );
  }

  if (!user) {
    router.push('/login');
    return null;
  }

  return (
    <div className="flex flex-col h-screen bg-gray-50 dark:bg-gray-900 overflow-hidden transition-colors">
      {/* Header with user info and controls */}
      <header className="flex-none p-4 flex justify-between items-center z-10 bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700">
        <div className="flex items-center gap-4">
          <Link
            href="/"
            className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-300 hover:text-black dark:hover:text-white transition-colors"
          >
            <ArrowLeft size={16} />
            Back to Kanban
          </Link>
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

      <main className="flex-1 overflow-y-auto">
        <BudgetDashboard />
      </main>
    </div>
  );
}
