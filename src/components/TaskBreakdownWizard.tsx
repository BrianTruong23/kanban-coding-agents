'use client';

import { useState } from 'react';
import { Task } from '@/types/task';
import { CodingAgent } from '@/types/agent';
import { BreakdownInput, breakdownTask, BreakdownResult } from '@/lib/taskBreakdown';
import { batchAutoAssign, scoreAgentsForTask } from '@/lib/autoAssignment';
import { X, Wand2, Users, GitBranch, AlertTriangle, CheckCircle } from 'lucide-react';

interface TaskBreakdownWizardProps {
  agents: CodingAgent[];
  maxTaskNumber: number;
  onComplete: (result: BreakdownResult, assignments: Map<string, string>) => void;
  onClose: () => void;
}

export const TaskBreakdownWizard = ({
  agents,
  maxTaskNumber,
  onComplete,
  onClose,
}: TaskBreakdownWizardProps) => {
  const [step, setStep] = useState<'input' | 'preview' | 'assign'>('input');
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [content, setContent] = useState('');
  const [inputType, setInputType] = useState<'issue' | 'prd' | 'screenshot'>('issue');
  const [breakdown, setBreakdown] = useState<BreakdownResult | null>(null);
  const [assignments, setAssignments] = useState<Map<string, string>>(new Map());

  const handleBreakdown = () => {
    if (!title.trim() || !content.trim()) {
      alert('Please provide title and content');
      return;
    }

    const input: BreakdownInput = {
      title,
      description,
      type: inputType,
      content,
    };

    const result = breakdownTask(input, maxTaskNumber);
    setBreakdown(result);

    // Auto-assign agents
    const allTasks = [result.epic, ...result.stories, ...result.tasks];
    const autoAssignments = batchAutoAssign(allTasks, agents);
    setAssignments(autoAssignments);

    setStep('preview');
  };

  const handleComplete = () => {
    if (!breakdown) return;
    onComplete(breakdown, assignments);
  };

  const toggleAssignment = (taskId: string, agentId: string) => {
    const newAssignments = new Map(assignments);
    if (newAssignments.get(taskId) === agentId) {
      newAssignments.delete(taskId);
    } else {
      newAssignments.set(taskId, agentId);
    }
    setAssignments(newAssignments);
  };

  const renderInputStep = () => (
    <div className="space-y-4">
      <div>
        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
          Input Type
        </label>
        <div className="flex gap-2">
          {(['issue', 'prd', 'screenshot'] as const).map(type => (
            <button
              key={type}
              onClick={() => setInputType(type)}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                inputType === type
                  ? 'bg-black dark:bg-white text-white dark:text-black'
                  : 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600'
              }`}
            >
              {type.toUpperCase()}
            </button>
          ))}
        </div>
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
          Title *
        </label>
        <input
          type="text"
          value={title}
          onChange={e => setTitle(e.target.value)}
          placeholder="e.g., Implement user authentication system"
          className="w-full border border-gray-200 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white p-3 rounded-lg focus:outline-none focus:ring-2 focus:ring-black/10 dark:focus:ring-white/20"
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
          Description
        </label>
        <input
          type="text"
          value={description}
          onChange={e => setDescription(e.target.value)}
          placeholder="Brief description of the feature or issue"
          className="w-full border border-gray-200 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white p-3 rounded-lg focus:outline-none focus:ring-2 focus:ring-black/10 dark:focus:ring-white/20"
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
          Content / Requirements *
        </label>
        <textarea
          value={content}
          onChange={e => setContent(e.target.value)}
          placeholder={getPlaceholder()}
          className="w-full border border-gray-200 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white p-3 rounded-lg h-64 focus:outline-none focus:ring-2 focus:ring-black/10 dark:focus:ring-white/20 resize-none font-mono text-sm"
        />
        <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
          Pro tip: Include user stories, acceptance criteria, risks, and testing requirements for better breakdown
        </p>
      </div>

      <div className="flex justify-end gap-2 pt-4">
        <button
          onClick={onClose}
          className="px-4 py-2 text-gray-600 dark:text-gray-400 hover:text-gray-800 dark:hover:text-gray-200 transition-colors"
        >
          Cancel
        </button>
        <button
          onClick={handleBreakdown}
          className="px-4 py-2 bg-black dark:bg-white text-white dark:text-black rounded-lg hover:bg-gray-800 dark:hover:bg-gray-200 transition-colors font-medium flex items-center gap-2"
        >
          <Wand2 size={16} />
          Generate Breakdown
        </button>
      </div>
    </div>
  );

  const renderPreviewStep = () => {
    if (!breakdown) return null;

    const allTasks = [breakdown.epic, ...breakdown.stories, ...breakdown.tasks];
    const totalEstimatedHours = allTasks.reduce((sum, task) => sum + (task.estimatedHours || 0), 0);

    return (
      <div className="space-y-4">
        <div className="bg-blue-50 dark:bg-blue-900/30 border border-blue-200 dark:border-blue-800 rounded-lg p-4">
          <h4 className="font-bold text-blue-900 dark:text-blue-100 mb-2 flex items-center gap-2">
            <CheckCircle size={20} />
            Breakdown Complete
          </h4>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
            <div>
              <span className="text-blue-700 dark:text-blue-300 font-medium">Epic:</span>{' '}
              <span className="text-blue-900 dark:text-blue-100">1</span>
            </div>
            <div>
              <span className="text-blue-700 dark:text-blue-300 font-medium">Stories:</span>{' '}
              <span className="text-blue-900 dark:text-blue-100">{breakdown.stories.length}</span>
            </div>
            <div>
              <span className="text-blue-700 dark:text-blue-300 font-medium">Tasks:</span>{' '}
              <span className="text-blue-900 dark:text-blue-100">{breakdown.tasks.length}</span>
            </div>
            <div>
              <span className="text-blue-700 dark:text-blue-300 font-medium">Est. Hours:</span>{' '}
              <span className="text-blue-900 dark:text-blue-100">{totalEstimatedHours}h</span>
            </div>
          </div>
        </div>

        <div className="max-h-96 overflow-y-auto space-y-3">
          {/* Epic */}
          <div className="border-2 border-purple-300 dark:border-purple-700 rounded-lg p-3 bg-purple-50 dark:bg-purple-900/20">
            <div className="flex items-start justify-between mb-2">
              <div className="flex-1">
                <div className="flex items-center gap-2 mb-1">
                  <span className="text-xs font-bold px-2 py-0.5 bg-purple-200 dark:bg-purple-800 text-purple-800 dark:text-purple-200 rounded">
                    EPIC
                  </span>
                  <span className="text-xs text-gray-500 dark:text-gray-400">{breakdown.epic.taskId}</span>
                </div>
                <h5 className="font-bold text-gray-900 dark:text-white">{breakdown.epic.title}</h5>
                <p className="text-sm text-gray-600 dark:text-gray-400 mt-1 line-clamp-2">
                  {breakdown.epic.description}
                </p>
              </div>
              <div className="flex flex-col items-end gap-1 ml-3">
                {breakdown.epic.riskLevel && breakdown.epic.riskLevel !== 'low' && (
                  <span className={`text-xs px-2 py-0.5 rounded flex items-center gap-1 ${
                    breakdown.epic.riskLevel === 'critical' ? 'bg-red-100 dark:bg-red-900 text-red-700 dark:text-red-300' :
                    breakdown.epic.riskLevel === 'high' ? 'bg-orange-100 dark:bg-orange-900 text-orange-700 dark:text-orange-300' :
                    'bg-yellow-100 dark:bg-yellow-900 text-yellow-700 dark:text-yellow-300'
                  }`}>
                    <AlertTriangle size={12} />
                    {breakdown.epic.riskLevel}
                  </span>
                )}
                {breakdown.epic.estimatedHours && (
                  <span className="text-xs text-gray-500 dark:text-gray-400">
                    ~{breakdown.epic.estimatedHours}h
                  </span>
                )}
              </div>
            </div>
            {breakdown.epic.definitionOfDone && breakdown.epic.definitionOfDone.length > 0 && (
              <div className="mt-2 text-xs text-gray-600 dark:text-gray-400">
                <span className="font-medium">DoD:</span> {breakdown.epic.definitionOfDone.length} criteria
              </div>
            )}
          </div>

          {/* Stories */}
          {breakdown.stories.map((story, idx) => (
            <div key={idx} className="border border-blue-200 dark:border-blue-800 rounded-lg p-3 bg-blue-50 dark:bg-blue-900/10 ml-4">
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-1">
                    <span className="text-xs font-bold px-2 py-0.5 bg-blue-200 dark:bg-blue-800 text-blue-800 dark:text-blue-200 rounded">
                      STORY
                    </span>
                    <span className="text-xs text-gray-500 dark:text-gray-400">{story.taskId}</span>
                  </div>
                  <h6 className="font-medium text-gray-900 dark:text-white text-sm">{story.title}</h6>
                </div>
                {story.estimatedHours && (
                  <span className="text-xs text-gray-500 dark:text-gray-400 ml-2">
                    ~{story.estimatedHours}h
                  </span>
                )}
              </div>
            </div>
          ))}

          {/* Tasks */}
          {breakdown.tasks.map((task, idx) => (
            <div key={idx} className="border border-gray-200 dark:border-gray-700 rounded-lg p-2 bg-white dark:bg-gray-800 ml-8">
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-bold px-2 py-0.5 bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded">
                      TASK
                    </span>
                    <span className="text-xs text-gray-500 dark:text-gray-400">{task.taskId}</span>
                    <span className="text-xs text-gray-700 dark:text-gray-300">{task.title}</span>
                  </div>
                </div>
                {task.estimatedHours && (
                  <span className="text-xs text-gray-500 dark:text-gray-400">
                    ~{task.estimatedHours}h
                  </span>
                )}
              </div>
            </div>
          ))}
        </div>

        <div className="flex justify-between gap-2 pt-4 border-t border-gray-200 dark:border-gray-700">
          <button
            onClick={() => setStep('input')}
            className="px-4 py-2 text-gray-600 dark:text-gray-400 hover:text-gray-800 dark:hover:text-gray-200 transition-colors"
          >
            Back
          </button>
          <div className="flex gap-2">
            <button
              onClick={() => setStep('assign')}
              className="px-4 py-2 bg-gray-100 dark:bg-gray-700 text-gray-900 dark:text-white rounded-lg hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors font-medium flex items-center gap-2"
            >
              <Users size={16} />
              Review Assignments
            </button>
            <button
              onClick={handleComplete}
              className="px-4 py-2 bg-black dark:bg-white text-white dark:text-black rounded-lg hover:bg-gray-800 dark:hover:bg-gray-200 transition-colors font-medium"
            >
              Create All Tasks
            </button>
          </div>
        </div>
      </div>
    );
  };

  const renderAssignStep = () => {
    if (!breakdown) return null;

    const allTasks = [breakdown.epic, ...breakdown.stories, ...breakdown.tasks];

    return (
      <div className="space-y-4">
        <div className="bg-green-50 dark:bg-green-900/30 border border-green-200 dark:border-green-800 rounded-lg p-4">
          <h4 className="font-bold text-green-900 dark:text-green-100 mb-2 flex items-center gap-2">
            <Users size={20} />
            Agent Assignments
          </h4>
          <p className="text-sm text-green-700 dark:text-green-300">
            {assignments.size} of {allTasks.length} tasks have been auto-assigned based on agent skills and performance
          </p>
        </div>

        <div className="max-h-96 overflow-y-auto space-y-2">
          {allTasks.map(task => {
            if (!task.id) return null;

            const assignedAgentId = assignments.get(task.id);
            const scores = scoreAgentsForTask(task, agents);

            return (
              <div key={task.id} className="border border-gray-200 dark:border-gray-700 rounded-lg p-3 bg-white dark:bg-gray-800">
                <div className="flex items-start justify-between mb-2">
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-bold px-2 py-0.5 bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded">
                        {task.taskType?.toUpperCase() || 'TASK'}
                      </span>
                      <span className="text-xs text-gray-500 dark:text-gray-400">{task.taskId}</span>
                    </div>
                    <h6 className="text-sm font-medium text-gray-900 dark:text-white mt-1">{task.title}</h6>
                  </div>
                </div>

                <div className="grid grid-cols-2 md:grid-cols-3 gap-2 mt-2">
                  {agents.map(agent => {
                    const score = scores.find(s => s.agentId === agent.id);
                    const isAssigned = assignedAgentId === agent.id;

                    return (
                      <button
                        key={agent.id}
                        onClick={() => toggleAssignment(task.id!, agent.id)}
                        className={`text-left p-2 rounded border text-xs transition-colors ${
                          isAssigned
                            ? 'border-black dark:border-white bg-black dark:bg-white text-white dark:text-black'
                            : 'border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-900 text-gray-700 dark:text-gray-300 hover:border-gray-300 dark:hover:border-gray-600'
                        }`}
                      >
                        <div className="font-medium">{agent.name}</div>
                        {score && score.score > 0 && (
                          <div className="text-xs opacity-75 mt-1">
                            Match: {Math.round(score.score * 100)}%
                          </div>
                        )}
                      </button>
                    );
                  })}
                </div>
              </div>
            );
          })}
        </div>

        <div className="flex justify-between gap-2 pt-4 border-t border-gray-200 dark:border-gray-700">
          <button
            onClick={() => setStep('preview')}
            className="px-4 py-2 text-gray-600 dark:text-gray-400 hover:text-gray-800 dark:hover:text-gray-200 transition-colors"
          >
            Back
          </button>
          <button
            onClick={handleComplete}
            className="px-4 py-2 bg-black dark:bg-white text-white dark:text-black rounded-lg hover:bg-gray-800 dark:hover:bg-gray-200 transition-colors font-medium"
          >
            Create All Tasks
          </button>
        </div>
      </div>
    );
  };

  const getPlaceholder = () => {
    switch (inputType) {
      case 'issue':
        return `Example:
As a user, I want to be able to log in securely
- Implement email/password authentication
- Add "Remember me" functionality
- Include password reset flow
- Security: Use bcrypt for password hashing

Risks: Authentication vulnerabilities
Testing: Test login, logout, password reset flows`;
      case 'prd':
        return `Example:
Product Requirements Document

Goal: Implement comprehensive user authentication

Features:
- Email/password login
- OAuth integration (Google, GitHub)
- Two-factor authentication
- Session management

Acceptance Criteria:
- Users can register with email
- Users can log in securely
- Passwords are encrypted
...`;
      case 'screenshot':
        return 'Paste a description of the screenshot or wireframe here. Describe the UI elements, flows, and interactions shown in the image.';
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
      <div className="bg-white dark:bg-gray-800 rounded-xl w-full max-w-4xl max-h-[90vh] shadow-xl flex flex-col">
        <div className="flex items-center justify-between p-6 border-b border-gray-200 dark:border-gray-700">
          <div>
            <h3 className="text-xl font-bold text-gray-900 dark:text-white flex items-center gap-2">
              <GitBranch size={24} />
              Automated Task Breakdown
            </h3>
            <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
              {step === 'input' && 'Enter your requirements to generate epics, stories, and tasks'}
              {step === 'preview' && 'Review the generated breakdown'}
              {step === 'assign' && 'Assign agents to tasks'}
            </p>
          </div>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
          >
            <X size={24} />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-6">
          {step === 'input' && renderInputStep()}
          {step === 'preview' && renderPreviewStep()}
          {step === 'assign' && renderAssignStep()}
        </div>
      </div>
    </div>
  );
};
