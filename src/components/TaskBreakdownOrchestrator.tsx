'use client';

import { useState } from 'react';
import { CodingAgent } from '@/types/agent';
import { BreakdownInput, BreakdownResult, TaskBreakdown } from '@/types/breakdown';
import { taskBreakdownService } from '@/lib/taskBreakdown';
import { agentAssignmentService } from '@/lib/agentAssignment';
import { DependencyGraph } from './DependencyGraph';
import { AgentRoster } from './AgentRoster';
import {
  Sparkles,
  Upload,
  FileText,
  Image,
  Loader2,
  CheckCircle2,
  AlertTriangle,
  Clock,
  Users,
  GitBranch,
  ChevronDown,
  ChevronRight,
  Play,
} from 'lucide-react';
import clsx from 'clsx';

interface TaskBreakdownOrchestratorProps {
  agents: CodingAgent[];
  onCreateTasks?: (tasks: TaskBreakdown[], assignments: Map<string, string>) => void;
  onAddAgent?: (agent: Partial<CodingAgent>) => void;
  onUpdateAgent?: (agent: CodingAgent) => void;
  onDeleteAgent?: (agentId: string) => void;
}

type InputType = 'issue' | 'prd' | 'screenshot' | 'text';

export const TaskBreakdownOrchestrator = ({
  agents,
  onCreateTasks,
  onAddAgent,
  onUpdateAgent,
  onDeleteAgent,
}: TaskBreakdownOrchestratorProps) => {
  const [inputType, setInputType] = useState<InputType>('text');
  const [inputContent, setInputContent] = useState('');
  const [context, setContext] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);
  const [result, setResult] = useState<BreakdownResult | null>(null);
  const [assignments, setAssignments] = useState<Map<string, string>>(new Map());
  const [expandedEpics, setExpandedEpics] = useState<Set<string>>(new Set());
  const [expandedStories, setExpandedStories] = useState<Set<string>>(new Set());

  const handleBreakdown = async () => {
    if (!inputContent.trim()) return;

    setIsProcessing(true);
    setResult(null);

    try {
      const input: BreakdownInput = {
        type: inputType,
        content: inputContent,
        context: context || undefined,
      };

      const breakdownResult = await taskBreakdownService.analyzeAndBreakdown(input);
      setResult(breakdownResult);

      // Auto-assign tasks
      if (agents.length > 0) {
        const taskAssignments = agentAssignmentService.batchAssign(breakdownResult.tasks, agents);
        setAssignments(taskAssignments);
      }
    } catch (error) {
      console.error('Breakdown error:', error);
      alert('Failed to break down the input. Please try again.');
    } finally {
      setIsProcessing(false);
    }
  };

  const handleCreateTasks = () => {
    if (!result) return;
    onCreateTasks?.(result.tasks, assignments);
  };

  const toggleEpic = (epicId: string) => {
    setExpandedEpics(prev => {
      const next = new Set(prev);
      if (next.has(epicId)) {
        next.delete(epicId);
      } else {
        next.add(epicId);
      }
      return next;
    });
  };

  const toggleStory = (storyId: string) => {
    setExpandedStories(prev => {
      const next = new Set(prev);
      if (next.has(storyId)) {
        next.delete(storyId);
      } else {
        next.add(storyId);
      }
      return next;
    });
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white flex items-center gap-2">
            <Sparkles size={24} className="text-blue-500" />
            Task Breakdown Orchestrator
          </h2>
          <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
            Analyze issues, PRDs, or screenshots to auto-generate tasks with dependencies
          </p>
        </div>
      </div>

      {/* Input Section */}
      {!result && (
        <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-6">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Input</h3>

          {/* Input Type Selector */}
          <div className="flex gap-2 mb-4">
            {[
              { type: 'text' as InputType, label: 'Text', icon: FileText },
              { type: 'issue' as InputType, label: 'GitHub Issue', icon: GitBranch },
              { type: 'prd' as InputType, label: 'PRD', icon: FileText },
              { type: 'screenshot' as InputType, label: 'Screenshot', icon: Image },
            ].map(({ type, label, icon: Icon }) => (
              <button
                key={type}
                onClick={() => setInputType(type)}
                className={clsx(
                  'px-4 py-2 rounded-lg text-sm font-medium flex items-center gap-2 transition-colors',
                  inputType === type
                    ? 'bg-blue-500 text-white'
                    : 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600'
                )}
              >
                <Icon size={16} />
                {label}
              </button>
            ))}
          </div>

          {/* Input Content */}
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                {inputType === 'issue'
                  ? 'GitHub Issue Content'
                  : inputType === 'prd'
                  ? 'Product Requirements Document'
                  : inputType === 'screenshot'
                  ? 'Screenshot Description'
                  : 'Feature Description'}
              </label>
              <textarea
                className="w-full border border-gray-200 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white p-3 rounded-lg h-40 focus:outline-none focus:ring-2 focus:ring-blue-500/20 resize-none"
                placeholder={
                  inputType === 'issue'
                    ? 'Paste the GitHub issue content here...\n\nExample:\n# Implement User Authentication\nWe need to add user authentication to the app with login, signup, and password reset functionality.'
                    : inputType === 'prd'
                    ? 'Paste the PRD content here...'
                    : inputType === 'screenshot'
                    ? 'Describe what you see in the screenshot...'
                    : 'Describe the feature or work to be done...\n\nExample:\nBuild a real-time dashboard that shows system metrics with charts and alerts.'
                }
                value={inputContent}
                onChange={e => setInputContent(e.target.value)}
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Additional Context (Optional)
              </label>
              <input
                type="text"
                className="w-full border border-gray-200 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white p-3 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500/20"
                placeholder="e.g., Tech stack: React, Node.js, PostgreSQL"
                value={context}
                onChange={e => setContext(e.target.value)}
              />
            </div>

            <button
              onClick={handleBreakdown}
              disabled={!inputContent.trim() || isProcessing}
              className="w-full bg-blue-500 hover:bg-blue-600 text-white px-4 py-3 rounded-lg font-medium flex items-center justify-center gap-2 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isProcessing ? (
                <>
                  <Loader2 size={20} className="animate-spin" />
                  Analyzing...
                </>
              ) : (
                <>
                  <Sparkles size={20} />
                  Break Down Into Tasks
                </>
              )}
            </button>
          </div>
        </div>
      )}

      {/* Results Section */}
      {result && (
        <div className="space-y-6">
          {/* Summary */}
          <div className="bg-gradient-to-r from-blue-50 to-purple-50 dark:from-blue-900/20 dark:to-purple-900/20 rounded-lg border border-blue-200 dark:border-blue-800 p-6">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
              <CheckCircle2 size={20} className="text-green-500" />
              Breakdown Complete
            </h3>

            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <SummaryStat label="Epics" value={result.summary.totalEpics} icon={GitBranch} />
              <SummaryStat label="Stories" value={result.summary.totalStories} icon={FileText} />
              <SummaryStat label="Tasks" value={result.summary.totalTasks} icon={CheckCircle2} />
              <SummaryStat
                label="Est. Hours"
                value={result.summary.estimatedHours}
                icon={Clock}
                suffix="h"
              />
            </div>

            {result.summary.highRiskTasks > 0 && (
              <div className="mt-4 flex items-start gap-2 bg-amber-50 dark:bg-amber-900/30 border border-amber-200 dark:border-amber-800 rounded p-3">
                <AlertTriangle size={16} className="text-amber-600 dark:text-amber-400 mt-0.5" />
                <div className="text-sm text-amber-700 dark:text-amber-300">
                  <strong>{result.summary.highRiskTasks}</strong> high-risk tasks identified. Review dependencies and allocate extra time.
                </div>
              </div>
            )}
          </div>

          {/* Task Tree */}
          <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-6">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Task Breakdown</h3>

            <div className="space-y-2">
              {result.epics.map(epic => (
                <div key={epic.id}>
                  <button
                    onClick={() => toggleEpic(epic.id)}
                    className="w-full flex items-center gap-2 p-3 bg-purple-50 dark:bg-purple-900/20 rounded-lg hover:bg-purple-100 dark:hover:bg-purple-900/30 transition-colors text-left"
                  >
                    {expandedEpics.has(epic.id) ? <ChevronDown size={16} /> : <ChevronRight size={16} />}
                    <GitBranch size={16} className="text-purple-600 dark:text-purple-400" />
                    <span className="font-semibold text-gray-900 dark:text-white">{epic.title}</span>
                    <span className="ml-auto text-xs text-gray-500 dark:text-gray-400">{epic.stories.length} stories</span>
                  </button>

                  {expandedEpics.has(epic.id) && (
                    <div className="ml-6 mt-2 space-y-2">
                      {result.stories
                        .filter(s => s.epicId === epic.id)
                        .map(story => (
                          <StoryItem
                            key={story.id}
                            story={story}
                            tasks={result.tasks.filter(t => t.storyId === story.id)}
                            agents={agents}
                            assignments={assignments}
                            isExpanded={expandedStories.has(story.id)}
                            onToggle={() => toggleStory(story.id)}
                          />
                        ))}
                    </div>
                  )}
                </div>
              ))}

              {result.stories.filter(s => !s.epicId).map(story => (
                <StoryItem
                  key={story.id}
                  story={story}
                  tasks={result.tasks.filter(t => t.storyId === story.id)}
                  agents={agents}
                  assignments={assignments}
                  isExpanded={expandedStories.has(story.id)}
                  onToggle={() => toggleStory(story.id)}
                />
              ))}
            </div>
          </div>

          {/* Dependency Graph */}
          <DependencyGraph tasks={result.tasks} dependencies={result.dependencies} />

          {/* Agent Assignments */}
          {agents.length > 0 && (
            <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-6">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
                <Users size={20} />
                Auto-Assignment Recommendations
              </h3>

              <div className="space-y-2">
                {result.tasks.map(task => {
                  const agentId = assignments.get(task.taskId);
                  const agent = agents.find(a => a.id === agentId);

                  return (
                    <div key={task.id} className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-700 rounded-lg">
                      <div>
                        <span className="text-sm font-medium text-gray-900 dark:text-white">{task.taskId}</span>
                        <span className="text-sm text-gray-600 dark:text-gray-400 ml-2">{task.title}</span>
                      </div>
                      {agent ? (
                        <span className="text-sm text-blue-600 dark:text-blue-400 font-medium">→ {agent.name}</span>
                      ) : (
                        <span className="text-sm text-gray-400">Unassigned</span>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* Actions */}
          <div className="flex items-center justify-between bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-6">
            <button
              onClick={() => setResult(null)}
              className="px-4 py-2 text-gray-600 dark:text-gray-400 hover:text-gray-800 dark:hover:text-gray-200 transition-colors"
            >
              Start Over
            </button>

            <button
              onClick={handleCreateTasks}
              className="bg-green-500 hover:bg-green-600 text-white px-6 py-2 rounded-lg font-medium flex items-center gap-2 transition-colors"
            >
              <Play size={18} />
              Create {result.tasks.length} Tasks
            </button>
          </div>
        </div>
      )}

      {/* Agent Roster */}
      <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-6">
        <AgentRoster
          agents={agents}
          onAddAgent={onAddAgent}
          onUpdateAgent={onUpdateAgent}
          onDeleteAgent={onDeleteAgent}
        />
      </div>
    </div>
  );
};

const SummaryStat = ({
  label,
  value,
  icon: Icon,
  suffix,
}: {
  label: string;
  value: number;
  icon: any;
  suffix?: string;
}) => (
  <div className="bg-white dark:bg-gray-800 rounded-lg p-4">
    <div className="flex items-center gap-2 mb-1">
      <Icon size={16} className="text-blue-500" />
      <span className="text-xs text-gray-500 dark:text-gray-400">{label}</span>
    </div>
    <p className="text-2xl font-bold text-gray-900 dark:text-white">
      {value}
      {suffix}
    </p>
  </div>
);

const StoryItem = ({
  story,
  tasks,
  agents,
  assignments,
  isExpanded,
  onToggle,
}: {
  story: any;
  tasks: TaskBreakdown[];
  agents: CodingAgent[];
  assignments: Map<string, string>;
  isExpanded: boolean;
  onToggle: () => void;
}) => (
  <div>
    <button
      onClick={onToggle}
      className="w-full flex items-center gap-2 p-3 bg-blue-50 dark:bg-blue-900/20 rounded-lg hover:bg-blue-100 dark:hover:bg-blue-900/30 transition-colors text-left"
    >
      {isExpanded ? <ChevronDown size={16} /> : <ChevronRight size={16} />}
      <FileText size={16} className="text-blue-600 dark:text-blue-400" />
      <span className="font-medium text-gray-900 dark:text-white">{story.title}</span>
      <span className="ml-auto text-xs text-gray-500 dark:text-gray-400">{tasks.length} tasks</span>
    </button>

    {isExpanded && (
      <div className="ml-6 mt-2 space-y-1">
        {tasks.map(task => (
          <TaskItem key={task.id} task={task} agents={agents} assignments={assignments} />
        ))}
      </div>
    )}
  </div>
);

const TaskItem = ({
  task,
  agents,
  assignments,
}: {
  task: TaskBreakdown;
  agents: CodingAgent[];
  assignments: Map<string, string>;
}) => {
  const agentId = assignments.get(task.taskId);
  const agent = agents.find(a => a.id === agentId);

  const riskColor = {
    low: 'text-green-600 dark:text-green-400',
    medium: 'text-blue-600 dark:text-blue-400',
    high: 'text-amber-600 dark:text-amber-400',
    critical: 'text-red-600 dark:text-red-400',
  }[task.riskLevel];

  return (
    <div className="flex items-center gap-2 p-2 bg-gray-50 dark:bg-gray-700 rounded text-sm">
      <CheckCircle2 size={14} className={riskColor} />
      <span className="font-mono text-xs text-gray-500 dark:text-gray-400">{task.taskId}</span>
      <span className="text-gray-900 dark:text-white flex-1">{task.title}</span>
      {task.estimatedHours && (
        <span className="text-xs text-gray-500 dark:text-gray-400">{task.estimatedHours}h</span>
      )}
      {agent && (
        <span className="text-xs text-blue-600 dark:text-blue-400 font-medium">{agent.name}</span>
      )}
    </div>
  );
};
