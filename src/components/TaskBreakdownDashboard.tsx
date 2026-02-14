'use client';

import { useState } from 'react';
import { BreakdownTask, TaskBreakdownRequest, TaskBreakdownResult } from '@/types/breakdown';
import { AgentRoster } from '@/types/agentSkills';
import { TaskBreakdownService } from '@/lib/taskBreakdown';
import { AutoAssignmentService } from '@/lib/agentRoster';
import { DependencyGraph } from './DependencyGraph';
import {
  FileText,
  Image,
  FileCode,
  Upload,
  Loader2,
  CheckCircle2,
  AlertCircle,
  ChevronDown,
  ChevronRight,
  Target,
  TestTube,
  AlertTriangle,
  Zap,
} from 'lucide-react';
import { generateId } from '@/lib/utils';

interface TaskBreakdownDashboardProps {
  agentRosters: AgentRoster[];
  onTasksGenerated: (tasks: BreakdownTask[]) => void;
}

export const TaskBreakdownDashboard = ({ agentRosters, onTasksGenerated }: TaskBreakdownDashboardProps) => {
  const [inputType, setInputType] = useState<'issue' | 'prd' | 'screenshot'>('issue');
  const [content, setContent] = useState('');
  const [imageUrl, setImageUrl] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);
  const [result, setResult] = useState<TaskBreakdownResult | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [expandedTasks, setExpandedTasks] = useState<Set<string>>(new Set());
  const [selectedTasks, setSelectedTasks] = useState<Set<string>>(new Set());

  const handleBreakdown = async () => {
    if (!content.trim() && inputType !== 'screenshot') {
      setError('Please provide content to analyze');
      return;
    }

    setIsProcessing(true);
    setError(null);

    try {
      const request: TaskBreakdownRequest = {
        id: generateId(),
        type: inputType,
        content,
        imageUrl: inputType === 'screenshot' ? imageUrl : undefined,
        createdAt: Date.now(),
        status: 'processing',
      };

      const breakdownResult = await TaskBreakdownService.breakdownTask(request);

      // Auto-assign tasks
      const allTasks = [...breakdownResult.epics, ...breakdownResult.tickets, ...breakdownResult.subtasks];
      const assignments = AutoAssignmentService.autoAssignBatch(agentRosters, allTasks);

      // Apply assignments
      allTasks.forEach((task) => {
        const agentId = assignments.get(task.id);
        if (agentId) {
          task.assignedAgentId = agentId;
        }
      });

      setResult(breakdownResult);
      setSelectedTasks(new Set(allTasks.map(t => t.id)));
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to process input');
    } finally {
      setIsProcessing(false);
    }
  };

  const toggleTaskExpanded = (taskId: string) => {
    const newExpanded = new Set(expandedTasks);
    if (newExpanded.has(taskId)) {
      newExpanded.delete(taskId);
    } else {
      newExpanded.add(taskId);
    }
    setExpandedTasks(newExpanded);
  };

  const toggleTaskSelected = (taskId: string) => {
    const newSelected = new Set(selectedTasks);
    if (newSelected.has(taskId)) {
      newSelected.delete(taskId);
    } else {
      newSelected.add(taskId);
    }
    setSelectedTasks(newSelected);
  };

  const handleGenerateTasks = () => {
    if (!result) return;

    const allTasks = [...result.epics, ...result.tickets, ...result.subtasks];
    const tasksToGenerate = allTasks.filter(task => selectedTasks.has(task.id));

    onTasksGenerated(tasksToGenerate);
  };

  const renderTask = (task: BreakdownTask) => {
    const isExpanded = expandedTasks.has(task.id);
    const isSelected = selectedTasks.has(task.id);
    const assignedAgent = agentRosters.find(r => r.agentId === task.assignedAgentId);

    const typeColors = {
      epic: 'bg-purple-100 dark:bg-purple-900 border-purple-300 dark:border-purple-700',
      ticket: 'bg-blue-100 dark:bg-blue-900 border-blue-300 dark:border-blue-700',
      subtask: 'bg-green-100 dark:bg-green-900 border-green-300 dark:border-green-700',
    };

    const riskColors = {
      low: 'text-green-600 dark:text-green-400',
      medium: 'text-yellow-600 dark:text-yellow-400',
      high: 'text-orange-600 dark:text-orange-400',
      critical: 'text-red-600 dark:text-red-400',
    };

    return (
      <div
        key={task.id}
        className={`border-2 rounded-lg p-4 mb-3 ${typeColors[task.type]} ${
          isSelected ? 'ring-2 ring-blue-500' : ''
        }`}
      >
        <div className="flex items-start justify-between mb-2">
          <div className="flex items-start gap-3 flex-1">
            <input
              type="checkbox"
              checked={isSelected}
              onChange={() => toggleTaskSelected(task.id)}
              className="mt-1 w-4 h-4"
            />
            <button
              onClick={() => toggleTaskExpanded(task.id)}
              className="mt-0.5 text-gray-600 dark:text-gray-400"
            >
              {isExpanded ? <ChevronDown size={20} /> : <ChevronRight size={20} />}
            </button>
            <div className="flex-1">
              <div className="flex items-center gap-2 mb-1">
                <span className="font-bold text-sm text-gray-700 dark:text-gray-300">
                  {task.taskId}
                </span>
                <span className="text-xs px-2 py-0.5 bg-white dark:bg-gray-800 rounded">
                  {task.type.toUpperCase()}
                </span>
                <span className="text-lg">
                  {'!'.repeat(Math.min(task.priority, 3))}
                </span>
              </div>
              <h4 className="font-semibold text-gray-900 dark:text-white">{task.title}</h4>
              <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">{task.description}</p>

              <div className="flex flex-wrap gap-2 mt-2">
                {task.tags.map((tag) => (
                  <span
                    key={tag}
                    className="text-xs px-2 py-1 bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-300 rounded-full"
                  >
                    {tag}
                  </span>
                ))}
                {task.estimatedHours && (
                  <span className="text-xs px-2 py-1 bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-300 rounded-full">
                    ~{task.estimatedHours}h
                  </span>
                )}
              </div>

              {assignedAgent && (
                <div className="mt-2 flex items-center gap-2 text-sm">
                  <Zap size={14} className="text-yellow-500" />
                  <span className="text-gray-700 dark:text-gray-300">Auto-assigned to:</span>
                  <span className="font-semibold text-gray-900 dark:text-white">{assignedAgent.name}</span>
                </div>
              )}
            </div>
          </div>
        </div>

        {isExpanded && (
          <div className="ml-10 mt-4 space-y-4 border-l-2 border-gray-300 dark:border-gray-600 pl-4">
            {task.definitionOfDone.length > 0 && (
              <div>
                <h5 className="font-semibold text-sm flex items-center gap-2 mb-2 text-gray-900 dark:text-white">
                  <Target size={16} />
                  Definition of Done
                </h5>
                <ul className="space-y-1">
                  {task.definitionOfDone.map((dod) => (
                    <li key={dod.id} className="flex items-start gap-2 text-sm text-gray-700 dark:text-gray-300">
                      <CheckCircle2 size={16} className="mt-0.5 text-green-500" />
                      {dod.description}
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {task.testNotes.length > 0 && (
              <div>
                <h5 className="font-semibold text-sm flex items-center gap-2 mb-2 text-gray-900 dark:text-white">
                  <TestTube size={16} />
                  Test Notes
                </h5>
                <ul className="space-y-1">
                  {task.testNotes.map((note) => (
                    <li key={note.id} className="flex items-start gap-2 text-sm text-gray-700 dark:text-gray-300">
                      <span className="text-xs px-1.5 py-0.5 bg-white dark:bg-gray-800 rounded font-mono">
                        {note.type}
                      </span>
                      {note.description}
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {task.riskFlags.length > 0 && (
              <div>
                <h5 className="font-semibold text-sm flex items-center gap-2 mb-2 text-gray-900 dark:text-white">
                  <AlertTriangle size={16} />
                  Risk Flags
                </h5>
                <ul className="space-y-2">
                  {task.riskFlags.map((risk) => (
                    <li key={risk.id} className="text-sm">
                      <div className="flex items-start gap-2">
                        <span className={`font-semibold uppercase text-xs ${riskColors[risk.level]}`}>
                          {risk.level}
                        </span>
                        <div>
                          <p className="text-gray-900 dark:text-white">{risk.description}</p>
                          {risk.mitigation && (
                            <p className="text-gray-600 dark:text-gray-400 mt-1">
                              <strong>Mitigation:</strong> {risk.mitigation}
                            </p>
                          )}
                        </div>
                      </div>
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        )}
      </div>
    );
  };

  return (
    <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-6">
      <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-6">
        Automated Task Breakdown
      </h2>

      {!result && (
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Input Type
            </label>
            <div className="grid grid-cols-3 gap-3">
              <button
                onClick={() => setInputType('issue')}
                className={`p-4 rounded-lg border-2 transition-all ${
                  inputType === 'issue'
                    ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/30'
                    : 'border-gray-200 dark:border-gray-700'
                }`}
              >
                <FileText size={24} className="mx-auto mb-2" />
                <span className="block text-sm font-medium">GitHub Issue</span>
              </button>
              <button
                onClick={() => setInputType('prd')}
                className={`p-4 rounded-lg border-2 transition-all ${
                  inputType === 'prd'
                    ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/30'
                    : 'border-gray-200 dark:border-gray-700'
                }`}
              >
                <FileCode size={24} className="mx-auto mb-2" />
                <span className="block text-sm font-medium">PRD Document</span>
              </button>
              <button
                onClick={() => setInputType('screenshot')}
                className={`p-4 rounded-lg border-2 transition-all ${
                  inputType === 'screenshot'
                    ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/30'
                    : 'border-gray-200 dark:border-gray-700'
                }`}
              >
                <Image size={24} className="mx-auto mb-2" />
                <span className="block text-sm font-medium">Screenshot</span>
              </button>
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Content
            </label>
            <textarea
              className="w-full border border-gray-200 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white p-3 rounded-lg h-48 focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder={
                inputType === 'issue'
                  ? 'Paste GitHub issue content here...\n\nExample:\n- Implement user authentication\n- Add login page\n- Create API endpoints'
                  : inputType === 'prd'
                  ? 'Paste PRD content here...\n\n## Requirements\n- User should be able to...\n\n## User Stories\n- As a user, I want to...'
                  : 'Describe what the screenshot shows...'
              }
              value={content}
              onChange={(e) => setContent(e.target.value)}
            />
          </div>

          {inputType === 'screenshot' && (
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Image URL (optional)
              </label>
              <input
                type="text"
                className="w-full border border-gray-200 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white p-3 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="https://example.com/screenshot.png"
                value={imageUrl}
                onChange={(e) => setImageUrl(e.target.value)}
              />
            </div>
          )}

          {error && (
            <div className="p-3 bg-red-50 dark:bg-red-900/30 border border-red-200 dark:border-red-800 rounded-lg flex items-start gap-2">
              <AlertCircle size={20} className="text-red-600 dark:text-red-400 flex-shrink-0 mt-0.5" />
              <span className="text-sm text-red-600 dark:text-red-400">{error}</span>
            </div>
          )}

          <button
            onClick={handleBreakdown}
            disabled={isProcessing}
            className="w-full bg-blue-600 text-white px-4 py-3 rounded-lg hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors flex items-center justify-center gap-2 font-medium"
          >
            {isProcessing ? (
              <>
                <Loader2 size={20} className="animate-spin" />
                Processing...
              </>
            ) : (
              <>
                <Upload size={20} />
                Break Down Tasks
              </>
            )}
          </button>
        </div>
      )}

      {result && (
        <div className="space-y-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2 text-green-600 dark:text-green-400">
              <CheckCircle2 size={20} />
              <span className="font-medium">Breakdown Complete</span>
            </div>
            <button
              onClick={() => {
                setResult(null);
                setContent('');
                setImageUrl('');
                setExpandedTasks(new Set());
                setSelectedTasks(new Set());
              }}
              className="text-sm text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white"
            >
              Start New
            </button>
          </div>

          <div className="grid grid-cols-3 gap-4">
            <div className="bg-purple-50 dark:bg-purple-900/30 p-4 rounded-lg">
              <div className="text-3xl font-bold text-purple-600 dark:text-purple-400">
                {result.epics.length}
              </div>
              <div className="text-sm text-gray-600 dark:text-gray-400">Epics</div>
            </div>
            <div className="bg-blue-50 dark:bg-blue-900/30 p-4 rounded-lg">
              <div className="text-3xl font-bold text-blue-600 dark:text-blue-400">
                {result.tickets.length}
              </div>
              <div className="text-sm text-gray-600 dark:text-gray-400">Tickets</div>
            </div>
            <div className="bg-green-50 dark:bg-green-900/30 p-4 rounded-lg">
              <div className="text-3xl font-bold text-green-600 dark:text-green-400">
                {result.subtasks.length}
              </div>
              <div className="text-sm text-gray-600 dark:text-gray-400">Subtasks</div>
            </div>
          </div>

          <DependencyGraph
            tasks={[...result.epics, ...result.tickets, ...result.subtasks]}
            dependencies={result.dependencies}
          />

          <div>
            <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-4">Generated Tasks</h3>

            {result.epics.length > 0 && (
              <div className="mb-6">
                <h4 className="text-md font-semibold text-gray-700 dark:text-gray-300 mb-3">Epics</h4>
                {result.epics.map(renderTask)}
              </div>
            )}

            {result.tickets.length > 0 && (
              <div className="mb-6">
                <h4 className="text-md font-semibold text-gray-700 dark:text-gray-300 mb-3">Tickets</h4>
                {result.tickets.map(renderTask)}
              </div>
            )}

            {result.subtasks.length > 0 && (
              <div className="mb-6">
                <h4 className="text-md font-semibold text-gray-700 dark:text-gray-300 mb-3">Subtasks</h4>
                {result.subtasks.map(renderTask)}
              </div>
            )}
          </div>

          <div className="flex items-center justify-between pt-4 border-t border-gray-200 dark:border-gray-700">
            <span className="text-sm text-gray-600 dark:text-gray-400">
              {selectedTasks.size} task{selectedTasks.size !== 1 ? 's' : ''} selected
            </span>
            <button
              onClick={handleGenerateTasks}
              disabled={selectedTasks.size === 0}
              className="bg-green-600 text-white px-6 py-2 rounded-lg hover:bg-green-700 disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors font-medium"
            >
              Add to Kanban Board
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
