'use client';

import { useState } from 'react';
import { FileText, Image, AlertCircle, CheckCircle, TestTube, Flag, Users, Sparkles } from 'lucide-react';
import { TaskBreakdownResult } from '@/types/taskBreakdown';
import { generateTaskBreakdown } from '@/lib/taskBreakdownService';
import { findBestAgent, autoAssignTasks } from '@/lib/autoAssignmentService';
import { CodingAgent } from '@/types/agent';
import { AgentSkill, AgentPerformanceMetrics } from '@/types/agentSkills';
import { Task } from '@/types/task';

interface TaskBreakdownProps {
  agents: CodingAgent[];
  agentSkills: AgentSkill[];
  agentMetrics: AgentPerformanceMetrics[];
  existingTasks: Task[];
  onTasksCreated: (tasks: Task[]) => void;
  onClose: () => void;
}

export const TaskBreakdown = ({
  agents,
  agentSkills,
  agentMetrics,
  existingTasks,
  onTasksCreated,
  onClose,
}: TaskBreakdownProps) => {
  const [inputType, setInputType] = useState<'issue' | 'prd' | 'screenshot'>('issue');
  const [inputText, setInputText] = useState('');
  const [breakdown, setBreakdown] = useState<TaskBreakdownResult | null>(null);
  const [autoAssign, setAutoAssign] = useState(true);
  const [isProcessing, setIsProcessing] = useState(false);
  const [selectedTasks, setSelectedTasks] = useState<Set<number>>(new Set());

  const handleBreakdown = () => {
    if (!inputText.trim()) return;

    setIsProcessing(true);
    try {
      const result = generateTaskBreakdown({
        text: inputText,
        type: inputType,
      });
      setBreakdown(result);
      // Select all tasks by default
      setSelectedTasks(new Set(result.tasks.map((_, i) => i)));
    } catch (error) {
      console.error('Error breaking down task:', error);
    } finally {
      setIsProcessing(false);
    }
  };

  const handleCreateTasks = () => {
    if (!breakdown) return;

    const tasksToCreate: Task[] = [];
    const selectedTasksArray = Array.from(selectedTasks)
      .map(i => breakdown.tasks[i])
      .filter(Boolean);

    selectedTasksArray.forEach((task, index) => {
      const taskId = `TASK-${existingTasks.length + tasksToCreate.length + 1}`;

      const newTask: Task = {
        id: crypto.randomUUID(),
        taskId,
        title: task.title,
        description: task.description || '',
        status: 'backlog',
        priority: task.priority,
        tags: task.tags,
        commentsCount: 0,
        attachmentsCount: 0,
        createdAt: Date.now(),
        updatedAt: Date.now(),
      };

      // Auto-assign if enabled
      if (autoAssign && task.suggestedAgentSkills && task.suggestedAgentSkills.length > 0) {
        const matches = findBestAgent(
          task.suggestedAgentSkills,
          agents,
          agentSkills,
          agentMetrics,
          existingTasks
        );
        if (matches.length > 0 && matches[0].recommended) {
          newTask.assignedAgentId = matches[0].agentId;
        }
      }

      tasksToCreate.push(newTask);
    });

    onTasksCreated(tasksToCreate);
    onClose();
  };

  const toggleTaskSelection = (index: number) => {
    const newSelected = new Set(selectedTasks);
    if (newSelected.has(index)) {
      newSelected.delete(index);
    } else {
      newSelected.add(index);
    }
    setSelectedTasks(newSelected);
  };

  const getSuggestedAgent = (suggestedSkills?: string[]) => {
    if (!suggestedSkills || suggestedSkills.length === 0) return null;
    const matches = findBestAgent(suggestedSkills, agents, agentSkills, agentMetrics, existingTasks);
    return matches.length > 0 && matches[0].recommended ? matches[0] : null;
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4" onClick={onClose}>
      <div
        className="bg-white dark:bg-gray-800 rounded-xl w-full max-w-4xl max-h-[90vh] overflow-hidden shadow-xl flex flex-col"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="p-6 border-b border-gray-200 dark:border-gray-700">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <Sparkles className="text-yellow-500" size={24} />
              <h2 className="text-2xl font-bold text-gray-900 dark:text-white">AI Task Breakdown</h2>
            </div>
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 text-2xl"
            >
              ×
            </button>
          </div>
          <p className="text-sm text-gray-600 dark:text-gray-400">
            Paste an issue, PRD, or describe a screenshot to automatically break it down into tasks with DoD, test notes, and risk flags.
          </p>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6">
          {!breakdown ? (
            <div className="space-y-4">
              {/* Input Type Selection */}
              <div className="flex gap-2">
                <button
                  onClick={() => setInputType('issue')}
                  className={`flex-1 p-3 rounded-lg border-2 transition-colors ${
                    inputType === 'issue'
                      ? 'border-black dark:border-white bg-black dark:bg-white text-white dark:text-black'
                      : 'border-gray-200 dark:border-gray-700 hover:border-gray-300 dark:hover:border-gray-600'
                  }`}
                >
                  <FileText size={20} className="mx-auto mb-1" />
                  <span className="text-sm font-medium">Issue/Bug</span>
                </button>
                <button
                  onClick={() => setInputType('prd')}
                  className={`flex-1 p-3 rounded-lg border-2 transition-colors ${
                    inputType === 'prd'
                      ? 'border-black dark:border-white bg-black dark:bg-white text-white dark:text-black'
                      : 'border-gray-200 dark:border-gray-700 hover:border-gray-300 dark:hover:border-gray-600'
                  }`}
                >
                  <FileText size={20} className="mx-auto mb-1" />
                  <span className="text-sm font-medium">PRD/Spec</span>
                </button>
                <button
                  onClick={() => setInputType('screenshot')}
                  className={`flex-1 p-3 rounded-lg border-2 transition-colors ${
                    inputType === 'screenshot'
                      ? 'border-black dark:border-white bg-black dark:bg-white text-white dark:text-black'
                      : 'border-gray-200 dark:border-gray-700 hover:border-gray-300 dark:hover:border-gray-600'
                  }`}
                >
                  <Image size={20} className="mx-auto mb-1" />
                  <span className="text-sm font-medium">Screenshot</span>
                </button>
              </div>

              {/* Input Text */}
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  {inputType === 'screenshot' ? 'Describe the screenshot' : 'Paste your content'}
                </label>
                <textarea
                  className="w-full border border-gray-200 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white p-4 rounded-lg h-64 focus:outline-none focus:ring-2 focus:ring-black/10 dark:focus:ring-white/20 resize-none font-mono text-sm"
                  placeholder={
                    inputType === 'screenshot'
                      ? 'Example: Screenshot shows a login page with username, password fields, and a "Remember me" checkbox...'
                      : 'Example:\nEpic: User Authentication\n\n1. Implement login page with email/password\n  - Add form validation\n  - Create API endpoint\n  DoD: User can successfully log in\n  Test: Unit tests for validation logic\n  Risk: Security concerns with password storage\n\n2. Add social login (Google, GitHub)\n...'
                  }
                  value={inputText}
                  onChange={(e) => setInputText(e.target.value)}
                  autoFocus
                />
              </div>

              {/* Auto-assign Option */}
              <div className="flex items-center gap-2">
                <input
                  type="checkbox"
                  id="auto-assign"
                  checked={autoAssign}
                  onChange={(e) => setAutoAssign(e.target.checked)}
                  className="w-4 h-4"
                />
                <label htmlFor="auto-assign" className="text-sm text-gray-700 dark:text-gray-300">
                  Automatically assign tasks to best-matched agents
                </label>
              </div>

              {/* Action Button */}
              <button
                onClick={handleBreakdown}
                disabled={!inputText.trim() || isProcessing}
                className="w-full bg-black dark:bg-white text-white dark:text-black py-3 rounded-lg font-medium hover:bg-gray-800 dark:hover:bg-gray-200 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
              >
                <Sparkles size={18} />
                {isProcessing ? 'Processing...' : 'Break Down into Tasks'}
              </button>
            </div>
          ) : (
            <div className="space-y-6">
              {/* Epic Info */}
              {breakdown.epic && (
                <div className="p-4 bg-purple-50 dark:bg-purple-900/20 border border-purple-200 dark:border-purple-800 rounded-lg">
                  <h3 className="font-bold text-lg text-purple-900 dark:text-purple-100 mb-2">
                    Epic: {breakdown.epic.title}
                  </h3>
                  <p className="text-sm text-purple-700 dark:text-purple-300">{breakdown.epic.description}</p>
                </div>
              )}

              {/* Tasks */}
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <h3 className="font-bold text-lg text-gray-900 dark:text-white">
                    Generated Tasks ({breakdown.tasks.length})
                  </h3>
                  <button
                    onClick={() => {
                      if (selectedTasks.size === breakdown.tasks.length) {
                        setSelectedTasks(new Set());
                      } else {
                        setSelectedTasks(new Set(breakdown.tasks.map((_, i) => i)));
                      }
                    }}
                    className="text-sm text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white"
                  >
                    {selectedTasks.size === breakdown.tasks.length ? 'Deselect All' : 'Select All'}
                  </button>
                </div>

                {breakdown.tasks.map((task, index) => {
                  const suggestedAgent = getSuggestedAgent(task.suggestedAgentSkills);
                  const isSelected = selectedTasks.has(index);

                  return (
                    <div
                      key={index}
                      className={`border-2 rounded-lg p-4 transition-all ${
                        isSelected
                          ? 'border-black dark:border-white bg-gray-50 dark:bg-gray-700'
                          : 'border-gray-200 dark:border-gray-700'
                      }`}
                    >
                      <div className="flex items-start gap-3">
                        <input
                          type="checkbox"
                          checked={isSelected}
                          onChange={() => toggleTaskSelection(index)}
                          className="mt-1 w-5 h-5"
                        />
                        <div className="flex-1">
                          <div className="flex items-start justify-between gap-2 mb-2">
                            <h4 className="font-bold text-gray-900 dark:text-white">{task.title}</h4>
                            <span className={`px-2 py-1 rounded text-xs font-semibold ${
                              task.priority === 5 ? 'bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-300' :
                              task.priority === 4 ? 'bg-orange-100 dark:bg-orange-900/30 text-orange-700 dark:text-orange-300' :
                              task.priority === 2 ? 'bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300' :
                              task.priority === 1 ? 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300' :
                              'bg-yellow-100 dark:bg-yellow-900/30 text-yellow-700 dark:text-yellow-300'
                            }`}>
                              P{task.priority}
                            </span>
                          </div>

                          {task.description && (
                            <p className="text-sm text-gray-600 dark:text-gray-400 mb-3">{task.description}</p>
                          )}

                          {/* Tags */}
                          {task.tags && task.tags.length > 0 && (
                            <div className="flex flex-wrap gap-1 mb-3">
                              {task.tags.map((tag, i) => (
                                <span key={i} className="px-2 py-1 bg-gray-200 dark:bg-gray-600 text-gray-700 dark:text-gray-300 text-xs rounded">
                                  {tag}
                                </span>
                              ))}
                            </div>
                          )}

                          {/* Suggested Agent */}
                          {autoAssign && suggestedAgent && (
                            <div className="flex items-center gap-2 mb-3 p-2 bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded">
                              <Users size={14} className="text-green-600 dark:text-green-400" />
                              <span className="text-xs text-green-700 dark:text-green-300">
                                Suggested: <strong>{suggestedAgent.agentName}</strong> ({suggestedAgent.matchScore}% match)
                              </span>
                            </div>
                          )}

                          {/* DoD */}
                          {task.definitionsOfDone && task.definitionsOfDone.length > 0 && (
                            <div className="mb-3">
                              <div className="flex items-center gap-1 text-xs font-semibold text-gray-700 dark:text-gray-300 mb-1">
                                <CheckCircle size={14} />
                                Definition of Done
                              </div>
                              <ul className="text-xs text-gray-600 dark:text-gray-400 space-y-1 ml-5">
                                {task.definitionsOfDone.map((dod, i) => (
                                  <li key={i}>• {dod.description}</li>
                                ))}
                              </ul>
                            </div>
                          )}

                          {/* Test Notes */}
                          {task.testNotes && task.testNotes.length > 0 && (
                            <div className="mb-3">
                              <div className="flex items-center gap-1 text-xs font-semibold text-gray-700 dark:text-gray-300 mb-1">
                                <TestTube size={14} />
                                Test Notes
                              </div>
                              <ul className="text-xs text-gray-600 dark:text-gray-400 space-y-1 ml-5">
                                {task.testNotes.map((test, i) => (
                                  <li key={i}>• [{test.testType}] {test.description}</li>
                                ))}
                              </ul>
                            </div>
                          )}

                          {/* Risk Flags */}
                          {task.riskFlags && task.riskFlags.length > 0 && (
                            <div>
                              <div className="flex items-center gap-1 text-xs font-semibold text-gray-700 dark:text-gray-300 mb-1">
                                <Flag size={14} />
                                Risk Flags
                              </div>
                              <ul className="text-xs space-y-1 ml-5">
                                {task.riskFlags.map((risk, i) => (
                                  <li key={i} className={`${
                                    risk.severity === 'critical' ? 'text-red-600 dark:text-red-400' :
                                    risk.severity === 'high' ? 'text-orange-600 dark:text-orange-400' :
                                    risk.severity === 'medium' ? 'text-yellow-600 dark:text-yellow-400' :
                                    'text-gray-600 dark:text-gray-400'
                                  }`}>
                                    • [{risk.severity.toUpperCase()}] {risk.description}
                                  </li>
                                ))}
                              </ul>
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-6 border-t border-gray-200 dark:border-gray-700 flex justify-between items-center">
          {breakdown ? (
            <>
              <button
                onClick={() => {
                  setBreakdown(null);
                  setSelectedTasks(new Set());
                }}
                className="px-4 py-2 text-gray-600 dark:text-gray-400 hover:text-gray-800 dark:hover:text-gray-200 transition-colors"
              >
                ← Back
              </button>
              <div className="flex gap-2">
                <button
                  onClick={onClose}
                  className="px-4 py-2 text-gray-600 dark:text-gray-400 hover:text-gray-800 dark:hover:text-gray-200 transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={handleCreateTasks}
                  disabled={selectedTasks.size === 0}
                  className="px-6 py-2 bg-black dark:bg-white text-white dark:text-black rounded-lg hover:bg-gray-800 dark:hover:bg-gray-200 transition-colors font-medium disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Create {selectedTasks.size} Task{selectedTasks.size !== 1 ? 's' : ''}
                </button>
              </div>
            </>
          ) : (
            <div className="w-full flex justify-end">
              <button
                onClick={onClose}
                className="px-4 py-2 text-gray-600 dark:text-gray-400 hover:text-gray-800 dark:hover:text-gray-200 transition-colors"
              >
                Cancel
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
