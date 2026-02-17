'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { TaskBreakdownUI } from '@/components/TaskBreakdownUI';
import { TaskBreakdownResult } from '@/types/taskBreakdown';
import { ThemeToggle } from '@/components/ThemeToggle';
import { ArrowLeft, Save } from 'lucide-react';

export default function TaskBreakdownPage() {
  const router = useRouter();
  const [breakdownResult, setBreakdownResult] = useState<TaskBreakdownResult | null>(null);
  const [isSaving, setIsSaving] = useState(false);

  const handleBreakdownComplete = (result: TaskBreakdownResult) => {
    setBreakdownResult(result);
  };

  const handleSaveToKanban = async () => {
    if (!breakdownResult) return;

    setIsSaving(true);
    try {
      // In a real implementation, this would save to Supabase
      // For now, we'll just simulate the save
      await new Promise((resolve) => setTimeout(resolve, 1000));

      // Show success message
      alert(
        `Successfully created:\n- ${breakdownResult.epics.length} epics\n- ${breakdownResult.tickets.length} tickets\n- ${breakdownResult.subtasks.length} subtasks`
      );

      // Redirect to main board
      router.push('/');
    } catch (error) {
      console.error('Failed to save:', error);
      alert('Failed to save tasks. Please try again.');
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-100 dark:bg-gray-900 transition-colors">
      {/* Header */}
      <header className="bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 sticky top-0 z-10">
        <div className="max-w-7xl mx-auto px-4 py-4 flex justify-between items-center">
          <div className="flex items-center gap-4">
            <button
              onClick={() => router.push('/')}
              className="flex items-center gap-2 text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white transition-colors"
            >
              <ArrowLeft size={20} />
              Back to Board
            </button>
            <h1 className="text-xl font-bold text-gray-900 dark:text-white">
              Automated Task Breakdown
            </h1>
          </div>
          <div className="flex items-center gap-3">
            {breakdownResult && (
              <button
                onClick={handleSaveToKanban}
                disabled={isSaving}
                className="bg-black dark:bg-white text-white dark:text-black px-4 py-2 rounded-lg font-medium hover:bg-gray-800 dark:hover:bg-gray-200 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
              >
                <Save size={18} />
                {isSaving ? 'Saving...' : 'Save to Kanban'}
              </button>
            )}
            <ThemeToggle />
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 py-8">
        <TaskBreakdownUI onBreakdownComplete={handleBreakdownComplete} />
      </main>
    </div>
  );
}
