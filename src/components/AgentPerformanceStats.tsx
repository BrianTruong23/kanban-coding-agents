'use client';

import { CodingAgent, AgentPerformanceStats } from '@/types/agent';
import { TrendingUp, Clock, Star, CheckCircle, Activity } from 'lucide-react';

interface AgentPerformanceStatsProps {
  agent: CodingAgent;
  stats: AgentPerformanceStats;
}

export const AgentPerformanceStatsComponent = ({ agent, stats }: AgentPerformanceStatsProps) => {
  const renderStars = (score: number) => {
    const fullStars = Math.floor(score);
    const hasHalfStar = score % 1 >= 0.5;

    return (
      <div className="flex items-center gap-0.5">
        {[1, 2, 3, 4, 5].map(i => (
          <Star
            key={i}
            size={16}
            className={
              i <= fullStars
                ? 'fill-yellow-400 text-yellow-400'
                : i === fullStars + 1 && hasHalfStar
                ? 'fill-yellow-400/50 text-yellow-400'
                : 'text-gray-300 dark:text-gray-600'
            }
          />
        ))}
        <span className="ml-1 text-sm font-medium text-gray-700 dark:text-gray-300">
          {score.toFixed(1)}
        </span>
      </div>
    );
  };

  if (stats.totalTasksCompleted === 0) {
    return (
      <div className="bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg p-6">
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
          Performance for {agent.name}
        </h3>
        <div className="text-center py-8 text-gray-400 dark:text-gray-500 text-sm">
          No completed tasks yet. Performance statistics will appear here once tasks are completed.
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg p-6">
      <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
        Performance for {agent.name}
      </h3>

      <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
        {/* Total Tasks */}
        <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-4">
          <div className="flex items-center gap-2 mb-2">
            <CheckCircle size={18} className="text-blue-600 dark:text-blue-400" />
            <span className="text-xs font-medium text-blue-600 dark:text-blue-400 uppercase tracking-wide">
              Tasks Completed
            </span>
          </div>
          <div className="text-2xl font-bold text-blue-900 dark:text-blue-300">
            {stats.totalTasksCompleted}
          </div>
        </div>

        {/* Quality Score */}
        <div className="bg-purple-50 dark:bg-purple-900/20 border border-purple-200 dark:border-purple-800 rounded-lg p-4">
          <div className="flex items-center gap-2 mb-2">
            <Star size={18} className="text-purple-600 dark:text-purple-400" />
            <span className="text-xs font-medium text-purple-600 dark:text-purple-400 uppercase tracking-wide">
              Quality Score
            </span>
          </div>
          <div className="mt-1">
            {renderStars(stats.averageQualityScore)}
          </div>
        </div>

        {/* Efficiency Score */}
        <div className="bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg p-4">
          <div className="flex items-center gap-2 mb-2">
            <Activity size={18} className="text-green-600 dark:text-green-400" />
            <span className="text-xs font-medium text-green-600 dark:text-green-400 uppercase tracking-wide">
              Efficiency Score
            </span>
          </div>
          <div className="mt-1">
            {renderStars(stats.averageEfficiencyScore)}
          </div>
        </div>

        {/* On-Time Delivery */}
        <div className="bg-orange-50 dark:bg-orange-900/20 border border-orange-200 dark:border-orange-800 rounded-lg p-4">
          <div className="flex items-center gap-2 mb-2">
            <TrendingUp size={18} className="text-orange-600 dark:text-orange-400" />
            <span className="text-xs font-medium text-orange-600 dark:text-orange-400 uppercase tracking-wide">
              On-Time Rate
            </span>
          </div>
          <div className="text-2xl font-bold text-orange-900 dark:text-orange-300">
            {stats.onTimePercentage.toFixed(0)}%
          </div>
        </div>

        {/* Average Hours */}
        <div className="bg-indigo-50 dark:bg-indigo-900/20 border border-indigo-200 dark:border-indigo-800 rounded-lg p-4">
          <div className="flex items-center gap-2 mb-2">
            <Clock size={18} className="text-indigo-600 dark:text-indigo-400" />
            <span className="text-xs font-medium text-indigo-600 dark:text-indigo-400 uppercase tracking-wide">
              Avg Hours/Task
            </span>
          </div>
          <div className="text-2xl font-bold text-indigo-900 dark:text-indigo-300">
            {stats.averageHoursPerTask.toFixed(1)}h
          </div>
        </div>

        {/* Total Hours */}
        <div className="bg-pink-50 dark:bg-pink-900/20 border border-pink-200 dark:border-pink-800 rounded-lg p-4">
          <div className="flex items-center gap-2 mb-2">
            <Clock size={18} className="text-pink-600 dark:text-pink-400" />
            <span className="text-xs font-medium text-pink-600 dark:text-pink-400 uppercase tracking-wide">
              Total Hours
            </span>
          </div>
          <div className="text-2xl font-bold text-pink-900 dark:text-pink-300">
            {stats.totalHours.toFixed(0)}h
          </div>
        </div>
      </div>

      {/* Performance Summary */}
      <div className="mt-4 p-3 bg-gray-50 dark:bg-gray-900 rounded-lg">
        <div className="text-xs text-gray-600 dark:text-gray-400">
          <strong>{agent.name}</strong> has completed <strong>{stats.totalTasksCompleted}</strong> tasks
          with an average quality score of <strong>{stats.averageQualityScore.toFixed(1)}/5</strong>
          {' '}and <strong>{stats.onTimePercentage.toFixed(0)}%</strong> on-time delivery rate.
        </div>
      </div>
    </div>
  );
};
