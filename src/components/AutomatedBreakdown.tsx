'use client';

import { useState } from 'react';
import { BreakdownInput, BreakdownResult, InputType, Epic, Ticket, Subtask, TaskDependency, DependencyGraph as DependencyGraphType } from '@/types/orchestration';
import { CodingAgent } from '@/types/agent';
import { breakdownRequirement, validateBreakdown } from '@/lib/taskBreakdown';
import { Sparkles, FileText, Image as ImageIcon, Github, AlertCircle, CheckCircle, Loader2, ChevronRight, GitBranch } from 'lucide-react';
import { TaskHierarchy } from './TaskHierarchy';
import { DependencyGraph } from './DependencyGraph';

interface AutomatedBreakdownProps {
  agents: CodingAgent[];
  onAccept?: (result: BreakdownResult) => Promise<void>;
  onCancel?: () => void;
}

/**
 * Automated Task Breakdown Component
 *
 * Main orchestration component that:
 * 1. Accepts input (issue/PRD/screenshot)
 * 2. Calls AI breakdown service
 * 3. Displays preview of generated tasks
 * 4. Allows user to review and accept
 * 5. Creates actual tasks in the system
 */
export const AutomatedBreakdown = ({ agents, onAccept, onCancel }: AutomatedBreakdownProps) => {
  const [step, setStep] = useState<'input' | 'processing' | 'review'>('input');
  const [inputType, setInputType] = useState<InputType>('text');
  const [inputContent, setInputContent] = useState('');
  const [imageUrl, setImageUrl] = useState('');
  const [result, setResult] = useState<BreakdownResult | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [viewMode, setViewMode] = useState<'hierarchy' | 'dependencies'>('hierarchy');

  const handleGenerate = async () => {
    if (!inputContent.trim()) {
      setError('Please provide input content');
      return;
    }

    setError(null);
    setStep('processing');

    try {
      const input: BreakdownInput = {
        type: inputType,
        content: inputContent,
        imageUrl: inputType === 'screenshot' ? imageUrl : undefined,
      };

      const breakdown = await breakdownRequirement(input);

      // Validate the breakdown
      const validation = validateBreakdown(breakdown);
      if (!validation.valid) {
        throw new Error(`Invalid breakdown: ${validation.errors.join(', ')}`);
      }

      setResult(breakdown);
      setStep('review');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to generate breakdown');
      setStep('input');
    }
  };

  const handleAccept = async () => {
    if (!result) return;

    try {
      await onAccept?.(result);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to create tasks');
    }
  };

  const handleReset = () => {
    setStep('input');
    setInputContent('');
    setImageUrl('');
    setResult(null);
    setError(null);
  };

  // Convert breakdown result to display format
  const getPreviewData = (): { epics: Epic[]; tickets: Ticket[]; subtasks: Subtask[]; dependencies: TaskDependency[] } => {
    if (!result) return { epics: [], tickets: [], subtasks: [], dependencies: [] };

    // Convert generated items to preview format
    const epics: Epic[] = result.epics.map((e, idx) => ({
      id: `preview-epic-${idx}`,
      epicId: `EPIC-${idx + 1}`,
      title: e.title,
      description: e.description,
      status: 'backlog' as const,
      priority: e.priority,
      tags: e.tags,
      createdAt: Date.now(),
      updatedAt: Date.now(),
    }));

    const tickets: Ticket[] = result.tickets.map((t, idx) => ({
      id: `preview-ticket-${idx}`,
      epicId: t.epicIndex !== undefined ? `preview-epic-${t.epicIndex}` : undefined,
      ticketId: `TICKET-${idx + 1}`,
      title: t.title,
      description: t.description,
      status: 'backlog' as const,
      priority: t.priority,
      tags: t.tags,
      definitionOfDone: t.definitionOfDone.map((dod, dodIdx) => ({
        id: `dod-${idx}-${dodIdx}`,
        description: dod,
        completed: false,
      })),
      testNotes: t.testNotes,
      riskLevel: t.riskLevel,
      riskDescription: t.riskDescription,
      storyPoints: t.storyPoints,
      estimatedHours: t.estimatedHours,
      suggestedSkills: t.suggestedSkills,
      createdAt: Date.now(),
      updatedAt: Date.now(),
    }));

    const subtasks: Subtask[] = result.subtasks.map((s, idx) => ({
      id: `preview-subtask-${idx}`,
      ticketId: `preview-ticket-${s.ticketIndex}`,
      subtaskId: `SUB-${idx + 1}`,
      title: s.title,
      description: s.description,
      status: 'backlog' as const,
      orderIndex: s.orderIndex,
      estimatedMinutes: s.estimatedMinutes,
      createdAt: Date.now(),
      updatedAt: Date.now(),
    }));

    const dependencies: TaskDependency[] = result.dependencies.map((d, idx) => ({
      id: `preview-dep-${idx}`,
      sourceType: d.sourceType,
      sourceId: d.sourceType === 'epic' ? `preview-epic-${d.sourceIndex}` :
                d.sourceType === 'ticket' ? `preview-ticket-${d.sourceIndex}` :
                `preview-subtask-${d.sourceIndex}`,
      targetType: d.targetType,
      targetId: d.targetType === 'epic' ? `preview-epic-${d.targetIndex}` :
                d.targetType === 'ticket' ? `preview-ticket-${d.targetIndex}` :
                `preview-subtask-${d.targetIndex}`,
      dependencyType: d.dependencyType,
      createdAt: Date.now(),
    }));

    return { epics, tickets, subtasks, dependencies };
  };

  const getDependencyGraph = (): DependencyGraphType => {
    const { epics, tickets, subtasks, dependencies } = getPreviewData();

    const nodes = [
      ...epics.map(e => ({
        id: e.id,
        type: 'epic' as const,
        displayId: e.epicId,
        title: e.title,
        status: e.status,
        priority: e.priority,
      })),
      ...tickets.map(t => ({
        id: t.id,
        type: 'ticket' as const,
        displayId: t.ticketId,
        title: t.title,
        status: t.status,
        priority: t.priority,
        assignedAgentId: t.assignedAgentId,
      })),
      ...subtasks.map(s => ({
        id: s.id,
        type: 'subtask' as const,
        displayId: s.subtaskId,
        title: s.title,
        status: s.status,
        assignedAgentId: s.assignedAgentId,
      })),
    ];

    const edges = dependencies.map(d => ({
      id: d.id,
      source: d.sourceId,
      target: d.targetId,
      type: d.dependencyType,
    }));

    return { nodes, edges };
  };

  const getInputIcon = () => {
    switch (inputType) {
      case 'issue':
        return <Github size={20} />;
      case 'prd':
        return <FileText size={20} />;
      case 'screenshot':
        return <ImageIcon size={20} />;
      default:
        return <FileText size={20} />;
    }
  };

  const preview = getPreviewData();
  const totalTasks = preview.epics.length + preview.tickets.length + preview.subtasks.length;

  return (
    <div className="h-full flex flex-col">
      {/* Header */}
      <div className="p-6 border-b border-gray-200 dark:border-gray-700">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-2xl font-bold text-gray-900 dark:text-white flex items-center gap-2">
              <Sparkles size={24} className="text-purple-500" />
              Automated Task Breakdown
            </h2>
            <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
              AI-powered breakdown of requirements into epics, tickets, and subtasks
            </p>
          </div>
          {onCancel && (
            <button
              onClick={onCancel}
              className="text-gray-500 hover:text-gray-700 dark:hover:text-gray-300"
            >
              Close
            </button>
          )}
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-auto">
        {step === 'input' && (
          <div className="max-w-3xl mx-auto p-6 space-y-6">
            {/* Input Type Selection */}
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Input Type
              </label>
              <div className="grid grid-cols-4 gap-2">
                {[
                  { type: 'text' as const, label: 'Text', icon: <FileText size={16} /> },
                  { type: 'issue' as const, label: 'GitHub Issue', icon: <Github size={16} /> },
                  { type: 'prd' as const, label: 'PRD', icon: <FileText size={16} /> },
                  { type: 'screenshot' as const, label: 'Screenshot', icon: <ImageIcon size={16} /> },
                ].map(({ type, label, icon }) => (
                  <button
                    key={type}
                    onClick={() => setInputType(type)}
                    className={`p-3 rounded-lg border-2 flex flex-col items-center gap-1 transition-colors ${
                      inputType === type
                        ? 'border-purple-500 bg-purple-50 dark:bg-purple-900/20 text-purple-700 dark:text-purple-400'
                        : 'border-gray-200 dark:border-gray-700 hover:border-gray-300 dark:hover:border-gray-600'
                    }`}
                  >
                    {icon}
                    <span className="text-xs font-medium">{label}</span>
                  </button>
                ))}
              </div>
            </div>

            {/* Input Content */}
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                {inputType === 'issue' ? 'GitHub Issue URL or Content' :
                 inputType === 'prd' ? 'Product Requirements Document' :
                 inputType === 'screenshot' ? 'Screenshot Description' :
                 'Requirement Description'}
              </label>
              <textarea
                value={inputContent}
                onChange={(e) => setInputContent(e.target.value)}
                className="w-full h-64 p-4 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-purple-500 focus:border-transparent resize-none"
                placeholder={
                  inputType === 'issue'
                    ? 'Paste GitHub issue URL or content...\n\nExample:\nImplement user authentication with OAuth2\n- Support Google and GitHub providers\n- Store user sessions securely\n- Add logout functionality'
                    : inputType === 'prd'
                    ? 'Paste your PRD content...\n\nExample:\nFeature: Real-time Chat\nGoal: Enable users to communicate in real-time\nRequirements:\n1. WebSocket connection\n2. Message history\n3. Typing indicators'
                    : inputType === 'screenshot'
                    ? 'Describe what you see in the screenshot...\n\nExample:\nA dashboard with three charts showing user analytics, a sidebar with navigation, and a header with user profile'
                    : 'Describe your requirement...\n\nExample:\nBuild a kanban board with drag-and-drop, task assignment, and filtering by status and sprint'
                }
              />
            </div>

            {/* Screenshot URL (if screenshot type) */}
            {inputType === 'screenshot' && (
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Screenshot URL (optional)
                </label>
                <input
                  type="url"
                  value={imageUrl}
                  onChange={(e) => setImageUrl(e.target.value)}
                  className="w-full p-3 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                  placeholder="https://example.com/screenshot.png"
                />
              </div>
            )}

            {/* Error Display */}
            {error && (
              <div className="p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg flex items-start gap-3">
                <AlertCircle size={20} className="text-red-500 mt-0.5" />
                <div className="flex-1">
                  <p className="text-sm font-medium text-red-800 dark:text-red-300">Error</p>
                  <p className="text-sm text-red-600 dark:text-red-400 mt-1">{error}</p>
                </div>
              </div>
            )}

            {/* Generate Button */}
            <button
              onClick={handleGenerate}
              disabled={!inputContent.trim()}
              className="w-full py-3 px-4 bg-purple-600 hover:bg-purple-700 disabled:bg-gray-300 dark:disabled:bg-gray-700 disabled:cursor-not-allowed text-white rounded-lg font-medium flex items-center justify-center gap-2 transition-colors"
            >
              <Sparkles size={20} />
              Generate Breakdown
            </button>
          </div>
        )}

        {step === 'processing' && (
          <div className="flex items-center justify-center h-full">
            <div className="text-center">
              <Loader2 size={48} className="animate-spin text-purple-500 mx-auto mb-4" />
              <p className="text-lg font-medium text-gray-900 dark:text-white">
                Analyzing requirement...
              </p>
              <p className="text-sm text-gray-600 dark:text-gray-400 mt-2">
                Breaking down into epics, tickets, and subtasks
              </p>
            </div>
          </div>
        )}

        {step === 'review' && result && (
          <div className="h-full flex flex-col">
            {/* Summary */}
            <div className="p-6 bg-purple-50 dark:bg-purple-900/20 border-b border-purple-200 dark:border-purple-800">
              <div className="flex items-start justify-between">
                <div className="flex items-start gap-3">
                  <CheckCircle size={24} className="text-purple-600 dark:text-purple-400 mt-1" />
                  <div>
                    <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                      Breakdown Complete
                    </h3>
                    <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                      Generated {preview.epics.length} {preview.epics.length === 1 ? 'epic' : 'epics'},{' '}
                      {preview.tickets.length} {preview.tickets.length === 1 ? 'ticket' : 'tickets'}, and{' '}
                      {preview.subtasks.length} {preview.subtasks.length === 1 ? 'subtask' : 'subtasks'}
                    </p>
                  </div>
                </div>
                <div className="flex gap-2">
                  <button
                    onClick={() => setViewMode(viewMode === 'hierarchy' ? 'dependencies' : 'hierarchy')}
                    className="px-4 py-2 text-sm border border-gray-300 dark:border-gray-600 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-800 flex items-center gap-2"
                  >
                    {viewMode === 'hierarchy' ? (
                      <>
                        <GitBranch size={16} />
                        View Dependencies
                      </>
                    ) : (
                      <>
                        <FileText size={16} />
                        View Hierarchy
                      </>
                    )}
                  </button>
                </div>
              </div>
            </div>

            {/* Preview */}
            <div className="flex-1 overflow-auto p-6">
              {viewMode === 'hierarchy' ? (
                <TaskHierarchy
                  epics={preview.epics}
                  tickets={preview.tickets}
                  subtasks={preview.subtasks}
                  agents={agents}
                />
              ) : (
                <DependencyGraph graph={getDependencyGraph()} />
              )}
            </div>

            {/* Actions */}
            <div className="p-6 border-t border-gray-200 dark:border-gray-700 flex justify-between">
              <button
                onClick={handleReset}
                className="px-6 py-2 border border-gray-300 dark:border-gray-600 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-800 text-gray-700 dark:text-gray-300"
              >
                Start Over
              </button>
              <button
                onClick={handleAccept}
                className="px-6 py-2 bg-purple-600 hover:bg-purple-700 text-white rounded-lg font-medium flex items-center gap-2"
              >
                Accept & Create Tasks
                <ChevronRight size={16} />
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
