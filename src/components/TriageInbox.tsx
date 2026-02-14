'use client';

import { useState } from 'react';
import { useTriageInbox } from '@/hooks/useTriageInbox';
import { useAgents } from '@/hooks/useAgents';
import { useTasks } from '@/hooks/useTasks';
import { TriageItemCard } from './TriageItemCard';
import { TriageFiltersPanel } from './TriageFiltersPanel';
import { TriageStatsPanel } from './TriageStatsPanel';
import type { TriageFilters } from '@/types/triage';
import { RefreshCw, Filter, BarChart3 } from 'lucide-react';

export function TriageInbox() {
  const {
    items,
    clusters,
    stats,
    isLoaded,
    isLoading,
    updateItemStatus,
    updateItemSeverity,
    assignItem,
    convertToTask,
    deleteItem,
    triggerClustering,
    fetchItems,
  } = useTriageInbox();

  const { agents } = useAgents();
  const { addTask, tasks } = useTasks();

  const [showFilters, setShowFilters] = useState(false);
  const [showStats, setShowStats] = useState(true);
  const [filters, setFilters] = useState<TriageFilters>({});

  const handleApplyFilters = (newFilters: TriageFilters) => {
    setFilters(newFilters);
    fetchItems(newFilters);
  };

  const handleConvertToTask = async (itemId: string) => {
    const item = items.find(i => i.id === itemId);
    if (!item) return;

    try {
      // Generate a unique task ID
      const taskNumber = tasks.length + 1;
      const newTaskId = `TASK-${taskNumber}`;

      // Create a new task from the triage item
      const newTask = {
        id: `task-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
        taskId: newTaskId,
        title: item.title,
        description: item.description,
        status: 'backlog' as const,
        priority: (item.severity === 'critical' ? 5 : item.severity === 'high' ? 4 : item.severity === 'medium' ? 3 : 2) as 1 | 2 | 3 | 4 | 5,
        tags: item.tags,
        assignedAgentId: item.suggestedOwner,
        createdAt: Date.now(),
        updatedAt: Date.now(),
      };

      await addTask(newTask);

      // Update the triage item with the task reference
      await convertToTask(itemId, newTask.id);
    } catch (error) {
      console.error('Failed to convert to task:', error);
    }
  };

  const handleCluster = async () => {
    try {
      await triggerClustering(0.3);
    } catch (error) {
      console.error('Failed to cluster items:', error);
    }
  };

  if (!isLoaded) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-gray-400 dark:text-gray-500">Loading triage inbox...</div>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="flex-none p-4 border-b border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-2xl font-bold text-gray-900 dark:text-white">Triage Inbox</h2>
            <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
              Auto-triage issues, logs, and feedback
            </p>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={() => setShowStats(!showStats)}
              className={`px-3 py-2 rounded-lg flex items-center gap-2 text-sm font-medium transition-colors ${
                showStats
                  ? 'bg-blue-500 text-white'
                  : 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600'
              }`}
            >
              <BarChart3 size={16} />
              Stats
            </button>
            <button
              onClick={() => setShowFilters(!showFilters)}
              className={`px-3 py-2 rounded-lg flex items-center gap-2 text-sm font-medium transition-colors ${
                showFilters
                  ? 'bg-blue-500 text-white'
                  : 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600'
              }`}
            >
              <Filter size={16} />
              Filters
            </button>
            <button
              onClick={handleCluster}
              disabled={isLoading}
              className="px-3 py-2 bg-purple-500 text-white rounded-lg flex items-center gap-2 text-sm font-medium hover:bg-purple-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <RefreshCw size={16} className={isLoading ? 'animate-spin' : ''} />
              Cluster
            </button>
          </div>
        </div>
      </div>

      <div className="flex flex-1 overflow-hidden">
        {/* Stats Panel */}
        {showStats && stats && (
          <div className="flex-none w-64 border-r border-gray-200 dark:border-gray-700 overflow-y-auto">
            <TriageStatsPanel stats={stats} />
          </div>
        )}

        {/* Main Content */}
        <div className="flex-1 overflow-y-auto p-4">
          {/* Filters Panel */}
          {showFilters && (
            <div className="mb-4">
              <TriageFiltersPanel
                filters={filters}
                onApplyFilters={handleApplyFilters}
              />
            </div>
          )}

          {/* Items List */}
          {items.length === 0 ? (
            <div className="flex items-center justify-center h-64">
              <div className="text-center">
                <p className="text-gray-400 dark:text-gray-500">No triage items found</p>
                <p className="text-sm text-gray-400 dark:text-gray-600 mt-2">
                  Items will appear here when ingested from various sources
                </p>
              </div>
            </div>
          ) : (
            <div className="space-y-3">
              {items.map(item => (
                <TriageItemCard
                  key={item.id}
                  item={item}
                  agents={agents}
                  cluster={clusters.find(c => c.id === item.clusterId)}
                  onUpdateStatus={updateItemStatus}
                  onUpdateSeverity={updateItemSeverity}
                  onAssign={assignItem}
                  onConvertToTask={handleConvertToTask}
                  onDelete={deleteItem}
                />
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
