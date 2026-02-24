'use client';

import { Sparkles, Users, GitBranch, Target, CheckCircle, TrendingUp } from 'lucide-react';

/**
 * Feature Overview Component
 * Displays information about the task breakdown and agent orchestration features
 */
export function FeatureOverview() {
  return (
    <div className="max-w-6xl mx-auto p-6 space-y-8">
      {/* Header */}
      <div className="text-center">
        <h1 className="text-4xl font-bold mb-3">
          Automated Task Breakdown & Agent Orchestration
        </h1>
        <p className="text-lg text-gray-600 dark:text-gray-400">
          AI-powered task management and intelligent agent assignment
        </p>
      </div>

      {/* Main Features Grid */}
      <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
        {/* Task Breakdown */}
        <div className="border border-gray-200 dark:border-gray-700 rounded-lg p-6 bg-gradient-to-br from-purple-50 to-white dark:from-purple-900/20 dark:to-gray-800">
          <div className="flex items-center gap-3 mb-4">
            <div className="p-3 bg-purple-600 rounded-lg">
              <Sparkles className="w-6 h-6 text-white" />
            </div>
            <h3 className="text-xl font-bold">Task Breakdown</h3>
          </div>
          <ul className="space-y-2 text-sm text-gray-600 dark:text-gray-400">
            <li className="flex items-start gap-2">
              <CheckCircle className="w-4 h-4 mt-0.5 text-green-600 flex-shrink-0" />
              <span>Break down issues/PRDs into epics and tasks</span>
            </li>
            <li className="flex items-start gap-2">
              <CheckCircle className="w-4 h-4 mt-0.5 text-green-600 flex-shrink-0" />
              <span>Auto-generate subtasks with DoD and test notes</span>
            </li>
            <li className="flex items-start gap-2">
              <CheckCircle className="w-4 h-4 mt-0.5 text-green-600 flex-shrink-0" />
              <span>Identify risks and mitigation strategies</span>
            </li>
            <li className="flex items-start gap-2">
              <CheckCircle className="w-4 h-4 mt-0.5 text-green-600 flex-shrink-0" />
              <span>Detect technologies and auto-tag</span>
            </li>
          </ul>
        </div>

        {/* Agent Orchestration */}
        <div className="border border-gray-200 dark:border-gray-700 rounded-lg p-6 bg-gradient-to-br from-blue-50 to-white dark:from-blue-900/20 dark:to-gray-800">
          <div className="flex items-center gap-3 mb-4">
            <div className="p-3 bg-blue-600 rounded-lg">
              <Users className="w-6 h-6 text-white" />
            </div>
            <h3 className="text-xl font-bold">Agent Roster</h3>
          </div>
          <ul className="space-y-2 text-sm text-gray-600 dark:text-gray-400">
            <li className="flex items-start gap-2">
              <CheckCircle className="w-4 h-4 mt-0.5 text-green-600 flex-shrink-0" />
              <span>Track agent skills and proficiency levels</span>
            </li>
            <li className="flex items-start gap-2">
              <CheckCircle className="w-4 h-4 mt-0.5 text-green-600 flex-shrink-0" />
              <span>Monitor performance metrics and success rates</span>
            </li>
            <li className="flex items-start gap-2">
              <CheckCircle className="w-4 h-4 mt-0.5 text-green-600 flex-shrink-0" />
              <span>Manage availability and workload</span>
            </li>
            <li className="flex items-start gap-2">
              <CheckCircle className="w-4 h-4 mt-0.5 text-green-600 flex-shrink-0" />
              <span>Suggest skills based on task history</span>
            </li>
          </ul>
        </div>

        {/* Auto-Assignment */}
        <div className="border border-gray-200 dark:border-gray-700 rounded-lg p-6 bg-gradient-to-br from-green-50 to-white dark:from-green-900/20 dark:to-gray-800">
          <div className="flex items-center gap-3 mb-4">
            <div className="p-3 bg-green-600 rounded-lg">
              <TrendingUp className="w-6 h-6 text-white" />
            </div>
            <h3 className="text-xl font-bold">Auto-Assignment</h3>
          </div>
          <ul className="space-y-2 text-sm text-gray-600 dark:text-gray-400">
            <li className="flex items-start gap-2">
              <CheckCircle className="w-4 h-4 mt-0.5 text-green-600 flex-shrink-0" />
              <span>Multi-factor scoring algorithm</span>
            </li>
            <li className="flex items-start gap-2">
              <CheckCircle className="w-4 h-4 mt-0.5 text-green-600 flex-shrink-0" />
              <span>Skill and performance-based matching</span>
            </li>
            <li className="flex items-start gap-2">
              <CheckCircle className="w-4 h-4 mt-0.5 text-green-600 flex-shrink-0" />
              <span>Workload balancing across agents</span>
            </li>
            <li className="flex items-start gap-2">
              <CheckCircle className="w-4 h-4 mt-0.5 text-green-600 flex-shrink-0" />
              <span>Availability and capacity checking</span>
            </li>
          </ul>
        </div>

        {/* Dependencies */}
        <div className="border border-gray-200 dark:border-gray-700 rounded-lg p-6 bg-gradient-to-br from-orange-50 to-white dark:from-orange-900/20 dark:to-gray-800">
          <div className="flex items-center gap-3 mb-4">
            <div className="p-3 bg-orange-600 rounded-lg">
              <GitBranch className="w-6 h-6 text-white" />
            </div>
            <h3 className="text-xl font-bold">Dependencies</h3>
          </div>
          <ul className="space-y-2 text-sm text-gray-600 dark:text-gray-400">
            <li className="flex items-start gap-2">
              <CheckCircle className="w-4 h-4 mt-0.5 text-green-600 flex-shrink-0" />
              <span>Visual dependency graph with topological layout</span>
            </li>
            <li className="flex items-start gap-2">
              <CheckCircle className="w-4 h-4 mt-0.5 text-green-600 flex-shrink-0" />
              <span>Three types: blocks, requires, related</span>
            </li>
            <li className="flex items-start gap-2">
              <CheckCircle className="w-4 h-4 mt-0.5 text-green-600 flex-shrink-0" />
              <span>Auto-detect logical dependencies</span>
            </li>
            <li className="flex items-start gap-2">
              <CheckCircle className="w-4 h-4 mt-0.5 text-green-600 flex-shrink-0" />
              <span>Prevent circular dependencies</span>
            </li>
          </ul>
        </div>

        {/* Subtasks */}
        <div className="border border-gray-200 dark:border-gray-700 rounded-lg p-6 bg-gradient-to-br from-pink-50 to-white dark:from-pink-900/20 dark:to-gray-800">
          <div className="flex items-center gap-3 mb-4">
            <div className="p-3 bg-pink-600 rounded-lg">
              <Target className="w-6 h-6 text-white" />
            </div>
            <h3 className="text-xl font-bold">Subtasks & DoD</h3>
          </div>
          <ul className="space-y-2 text-sm text-gray-600 dark:text-gray-400">
            <li className="flex items-start gap-2">
              <CheckCircle className="w-4 h-4 mt-0.5 text-green-600 flex-shrink-0" />
              <span>Definition of Done criteria</span>
            </li>
            <li className="flex items-start gap-2">
              <CheckCircle className="w-4 h-4 mt-0.5 text-green-600 flex-shrink-0" />
              <span>Testing notes and strategies</span>
            </li>
            <li className="flex items-start gap-2">
              <CheckCircle className="w-4 h-4 mt-0.5 text-green-600 flex-shrink-0" />
              <span>Risk flags with severity levels</span>
            </li>
            <li className="flex items-start gap-2">
              <CheckCircle className="w-4 h-4 mt-0.5 text-green-600 flex-shrink-0" />
              <span>Time estimation and tracking</span>
            </li>
          </ul>
        </div>

        {/* Epics */}
        <div className="border border-gray-200 dark:border-gray-700 rounded-lg p-6 bg-gradient-to-br from-indigo-50 to-white dark:from-indigo-900/20 dark:to-gray-800">
          <div className="flex items-center gap-3 mb-4">
            <div className="p-3 bg-indigo-600 rounded-lg">
              <Target className="w-6 h-6 text-white" />
            </div>
            <h3 className="text-xl font-bold">Epic Management</h3>
          </div>
          <ul className="space-y-2 text-sm text-gray-600 dark:text-gray-400">
            <li className="flex items-start gap-2">
              <CheckCircle className="w-4 h-4 mt-0.5 text-green-600 flex-shrink-0" />
              <span>High-level project tracking</span>
            </li>
            <li className="flex items-start gap-2">
              <CheckCircle className="w-4 h-4 mt-0.5 text-green-600 flex-shrink-0" />
              <span>Link multiple tasks to epics</span>
            </li>
            <li className="flex items-start gap-2">
              <CheckCircle className="w-4 h-4 mt-0.5 text-green-600 flex-shrink-0" />
              <span>Target dates and sprint planning</span>
            </li>
            <li className="flex items-start gap-2">
              <CheckCircle className="w-4 h-4 mt-0.5 text-green-600 flex-shrink-0" />
              <span>Progress tracking and status</span>
            </li>
          </ul>
        </div>
      </div>

      {/* How It Works */}
      <div className="border border-gray-200 dark:border-gray-700 rounded-lg p-6">
        <h2 className="text-2xl font-bold mb-4">How It Works</h2>
        <div className="grid md:grid-cols-4 gap-6">
          <div className="text-center">
            <div className="w-12 h-12 bg-purple-600 rounded-full flex items-center justify-center text-white font-bold text-xl mx-auto mb-3">
              1
            </div>
            <h4 className="font-semibold mb-2">Input</h4>
            <p className="text-sm text-gray-600 dark:text-gray-400">
              Paste an issue, PRD, or describe a screenshot
            </p>
          </div>
          <div className="text-center">
            <div className="w-12 h-12 bg-blue-600 rounded-full flex items-center justify-center text-white font-bold text-xl mx-auto mb-3">
              2
            </div>
            <h4 className="font-semibold mb-2">Analyze</h4>
            <p className="text-sm text-gray-600 dark:text-gray-400">
              AI analyzes content and generates breakdown
            </p>
          </div>
          <div className="text-center">
            <div className="w-12 h-12 bg-green-600 rounded-full flex items-center justify-center text-white font-bold text-xl mx-auto mb-3">
              3
            </div>
            <h4 className="font-semibold mb-2">Review</h4>
            <p className="text-sm text-gray-600 dark:text-gray-400">
              Preview tasks, subtasks, and dependencies
            </p>
          </div>
          <div className="text-center">
            <div className="w-12 h-12 bg-orange-600 rounded-full flex items-center justify-center text-white font-bold text-xl mx-auto mb-3">
              4
            </div>
            <h4 className="font-semibold mb-2">Create</h4>
            <p className="text-sm text-gray-600 dark:text-gray-400">
              Auto-assign to agents and start tracking
            </p>
          </div>
        </div>
      </div>

      {/* Benefits */}
      <div className="bg-gradient-to-r from-purple-600 to-blue-600 rounded-lg p-8 text-white">
        <h2 className="text-2xl font-bold mb-6 text-center">Key Benefits</h2>
        <div className="grid md:grid-cols-3 gap-6">
          <div>
            <h4 className="font-semibold mb-2">⚡ Save Time</h4>
            <p className="text-sm opacity-90">
              Automate task breakdown and assignment, reducing planning time by 80%
            </p>
          </div>
          <div>
            <h4 className="font-semibold mb-2">🎯 Better Planning</h4>
            <p className="text-sm opacity-90">
              Comprehensive breakdown with DoD, test notes, and risk analysis
            </p>
          </div>
          <div>
            <h4 className="font-semibold mb-2">🤖 Smart Assignment</h4>
            <p className="text-sm opacity-90">
              Match tasks to agents based on skills, performance, and availability
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
