'use client';

import { useState } from 'react';
import { TaskBreakdownWizard } from '@/components/TaskBreakdownWizard';
import { AgentRosterManager } from '@/components/AgentRosterManager';
import { TaskDependencyGraph } from '@/components/TaskDependencyGraph';
import { mockExtendedAgents, samplePRD, sampleGitHubIssue } from '@/lib/mockData';
import { TaskBreakdownResult, ExtendedTask } from '@/types/taskHierarchy';
import { Wand2, Users, Network, FileText, Hash } from 'lucide-react';

export default function DemoPage() {
  const [showBreakdownWizard, setShowBreakdownWizard] = useState(false);
  const [showRosterManager, setShowRosterManager] = useState(false);
  const [breakdownResult, setBreakdownResult] = useState<TaskBreakdownResult | null>(null);
  const [demoContent, setDemoContent] = useState<string>('');

  const handleApplyBreakdown = (result: TaskBreakdownResult) => {
    setBreakdownResult(result);
    console.log('Task breakdown applied:', result);
  };

  const loadSamplePRD = () => {
    setDemoContent(samplePRD);
    setShowBreakdownWizard(true);
  };

  const loadSampleIssue = () => {
    setDemoContent(sampleGitHubIssue);
    setShowBreakdownWizard(true);
  };

  const allTasks = breakdownResult
    ? [...breakdownResult.epics, ...breakdownResult.tickets, ...breakdownResult.subtasks]
    : [];

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 p-8">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-4xl font-bold text-gray-900 dark:text-white mb-2">
            Task Orchestration System Demo
          </h1>
          <p className="text-lg text-gray-600 dark:text-gray-400">
            Automated task breakdown and agent orchestration powered by AI
          </p>
        </div>

        {/* Feature Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <button
            onClick={() => setShowBreakdownWizard(true)}
            className="bg-white dark:bg-gray-800 p-6 rounded-xl border-2 border-gray-200 dark:border-gray-700 hover:border-black dark:hover:border-white transition-all text-left group"
          >
            <div className="flex items-center gap-3 mb-3">
              <div className="w-12 h-12 bg-purple-100 dark:bg-purple-900/30 rounded-lg flex items-center justify-center group-hover:scale-110 transition-transform">
                <Wand2 className="text-purple-600 dark:text-purple-400" size={24} />
              </div>
            </div>
            <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-2">
              Task Breakdown
            </h3>
            <p className="text-sm text-gray-600 dark:text-gray-400">
              AI-powered breakdown of issues and PRDs into structured tasks
            </p>
          </button>

          <button
            onClick={() => setShowRosterManager(true)}
            className="bg-white dark:bg-gray-800 p-6 rounded-xl border-2 border-gray-200 dark:border-gray-700 hover:border-black dark:hover:border-white transition-all text-left group"
          >
            <div className="flex items-center gap-3 mb-3">
              <div className="w-12 h-12 bg-blue-100 dark:bg-blue-900/30 rounded-lg flex items-center justify-center group-hover:scale-110 transition-transform">
                <Users className="text-blue-600 dark:text-blue-400" size={24} />
              </div>
            </div>
            <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-2">
              Agent Roster
            </h3>
            <p className="text-sm text-gray-600 dark:text-gray-400">
              Manage agent skills, performance metrics, and workload
            </p>
          </button>

          <button
            onClick={loadSamplePRD}
            className="bg-white dark:bg-gray-800 p-6 rounded-xl border-2 border-gray-200 dark:border-gray-700 hover:border-black dark:hover:border-white transition-all text-left group"
          >
            <div className="flex items-center gap-3 mb-3">
              <div className="w-12 h-12 bg-green-100 dark:bg-green-900/30 rounded-lg flex items-center justify-center group-hover:scale-110 transition-transform">
                <FileText className="text-green-600 dark:text-green-400" size={24} />
              </div>
            </div>
            <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-2">
              Sample PRD
            </h3>
            <p className="text-sm text-gray-600 dark:text-gray-400">
              Load a sample Product Requirements Document
            </p>
          </button>

          <button
            onClick={loadSampleIssue}
            className="bg-white dark:bg-gray-800 p-6 rounded-xl border-2 border-gray-200 dark:border-gray-700 hover:border-black dark:hover:border-white transition-all text-left group"
          >
            <div className="flex items-center gap-3 mb-3">
              <div className="w-12 h-12 bg-orange-100 dark:bg-orange-900/30 rounded-lg flex items-center justify-center group-hover:scale-110 transition-transform">
                <Hash className="text-orange-600 dark:text-orange-400" size={24} />
              </div>
            </div>
            <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-2">
              Sample Issue
            </h3>
            <p className="text-sm text-gray-600 dark:text-gray-400">
              Load a sample GitHub issue for breakdown
            </p>
          </button>
        </div>

        {/* Agent Stats */}
        <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-6 mb-8">
          <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-4">Team Overview</h2>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div>
              <p className="text-sm text-gray-600 dark:text-gray-400">Total Agents</p>
              <p className="text-3xl font-bold text-gray-900 dark:text-white mt-1">
                {mockExtendedAgents.length}
              </p>
            </div>
            <div>
              <p className="text-sm text-gray-600 dark:text-gray-400">Active Agents</p>
              <p className="text-3xl font-bold text-gray-900 dark:text-white mt-1">
                {mockExtendedAgents.filter((a) => a.status === 'active').length}
              </p>
            </div>
            <div>
              <p className="text-sm text-gray-600 dark:text-gray-400">Total Skills</p>
              <p className="text-3xl font-bold text-gray-900 dark:text-white mt-1">
                {mockExtendedAgents.reduce((sum, agent) => sum + agent.skills.length, 0)}
              </p>
            </div>
            <div>
              <p className="text-sm text-gray-600 dark:text-gray-400">Avg Quality Score</p>
              <p className="text-3xl font-bold text-gray-900 dark:text-white mt-1">
                {Math.round(
                  mockExtendedAgents.reduce((sum, agent) => sum + agent.performance.qualityScore, 0) /
                    mockExtendedAgents.length
                )}
                %
              </p>
            </div>
          </div>
        </div>

        {/* Breakdown Result */}
        {breakdownResult && (
          <div className="space-y-6">
            {/* Summary */}
            <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-6">
              <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-4">
                Breakdown Summary
              </h2>
              <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
                <div className="bg-purple-50 dark:bg-purple-900/20 border border-purple-200 dark:border-purple-800 rounded-lg p-4">
                  <p className="text-sm text-purple-600 dark:text-purple-400 font-medium">Epics</p>
                  <p className="text-3xl font-bold text-purple-900 dark:text-purple-100 mt-1">
                    {breakdownResult.epics.length}
                  </p>
                </div>
                <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-4">
                  <p className="text-sm text-blue-600 dark:text-blue-400 font-medium">Tickets</p>
                  <p className="text-3xl font-bold text-blue-900 dark:text-blue-100 mt-1">
                    {breakdownResult.tickets.length}
                  </p>
                </div>
                <div className="bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg p-4">
                  <p className="text-sm text-green-600 dark:text-green-400 font-medium">Subtasks</p>
                  <p className="text-3xl font-bold text-green-900 dark:text-green-100 mt-1">
                    {breakdownResult.subtasks.length}
                  </p>
                </div>
                <div className="bg-orange-50 dark:bg-orange-900/20 border border-orange-200 dark:border-orange-800 rounded-lg p-4">
                  <p className="text-sm text-orange-600 dark:text-orange-400 font-medium">Est. Hours</p>
                  <p className="text-3xl font-bold text-orange-900 dark:text-orange-100 mt-1">
                    {breakdownResult.estimatedTotalHours}
                  </p>
                </div>
                <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-4">
                  <p className="text-sm text-red-600 dark:text-red-400 font-medium">Dependencies</p>
                  <p className="text-3xl font-bold text-red-900 dark:text-red-100 mt-1">
                    {breakdownResult.dependencies.length}
                  </p>
                </div>
              </div>
            </div>

            {/* Dependency Graph */}
            {allTasks.length > 0 && (
              <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-6">
                <TaskDependencyGraph
                  tasks={allTasks}
                  dependencies={breakdownResult.dependencies}
                  onTaskClick={(task) => console.log('Task clicked:', task)}
                />
              </div>
            )}

            {/* Task List */}
            <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-6">
              <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-4">Generated Tasks</h2>
              <div className="space-y-4">
                {allTasks.slice(0, 10).map((task) => (
                  <div
                    key={task.id}
                    className="p-4 bg-gray-50 dark:bg-gray-900/50 rounded-lg border border-gray-200 dark:border-gray-700"
                  >
                    <div className="flex items-start justify-between mb-2">
                      <div>
                        <div className="flex items-center gap-2 mb-1">
                          <span className="font-mono text-xs font-bold text-gray-500 dark:text-gray-400">
                            {task.taskId}
                          </span>
                          <span
                            className={`px-2 py-0.5 rounded text-xs font-medium ${
                              task.taskType === 'epic'
                                ? 'bg-purple-100 dark:bg-purple-900/30 text-purple-700 dark:text-purple-400'
                                : task.taskType === 'ticket'
                                ? 'bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-400'
                                : 'bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400'
                            }`}
                          >
                            {task.taskType}
                          </span>
                        </div>
                        <h4 className="font-semibold text-gray-900 dark:text-white">{task.title}</h4>
                        <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                          {task.description}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2 mt-3">
                      <span className="px-2 py-0.5 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded text-xs">
                        P{task.priority}
                      </span>
                      <span className="px-2 py-0.5 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded text-xs capitalize">
                        {task.complexity}
                      </span>
                      <span className="px-2 py-0.5 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded text-xs">
                        {task.estimatedHours}h
                      </span>
                      {task.riskFlags.length > 0 && (
                        <span className="px-2 py-0.5 bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-400 rounded text-xs">
                          {task.riskFlags.length} risk(s)
                        </span>
                      )}
                    </div>
                  </div>
                ))}
                {allTasks.length > 10 && (
                  <p className="text-center text-sm text-gray-500 dark:text-gray-400">
                    ... and {allTasks.length - 10} more tasks
                  </p>
                )}
              </div>
            </div>
          </div>
        )}

        {/* Info Section */}
        {!breakdownResult && (
          <div className="bg-gradient-to-r from-purple-50 to-blue-50 dark:from-purple-900/20 dark:to-blue-900/20 rounded-xl border border-purple-200 dark:border-purple-800 p-8 text-center">
            <Network className="mx-auto mb-4 text-purple-600 dark:text-purple-400" size={48} />
            <h3 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
              Start by Breaking Down a Task
            </h3>
            <p className="text-gray-600 dark:text-gray-400 mb-6 max-w-2xl mx-auto">
              Use the Task Breakdown wizard to automatically analyze issues, PRDs, or requirements and
              generate structured tasks with dependencies, risk flags, and auto-assigned agents.
            </p>
            <div className="flex gap-3 justify-center">
              <button
                onClick={loadSamplePRD}
                className="px-6 py-3 bg-purple-600 hover:bg-purple-700 text-white rounded-lg font-medium transition-colors"
              >
                Try Sample PRD
              </button>
              <button
                onClick={loadSampleIssue}
                className="px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-medium transition-colors"
              >
                Try Sample Issue
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Modals */}
      {showBreakdownWizard && (
        <TaskBreakdownWizard
          agents={mockExtendedAgents}
          onClose={() => setShowBreakdownWizard(false)}
          onApply={handleApplyBreakdown}
        />
      )}

      {showRosterManager && (
        <AgentRosterManager
          agents={mockExtendedAgents}
          onClose={() => setShowRosterManager(false)}
        />
      )}
    </div>
  );
}
