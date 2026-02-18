'use client';

import { useState, useRef } from 'react';
import { X, FileText, Image as ImageIcon, Upload, Loader2, ChevronDown, ChevronRight } from 'lucide-react';
import { Task, TaskBreakdownRequest, TaskBreakdownResult } from '@/types/task';
import { CodingAgent } from '@/types/agent';
import { breakdownTask } from '@/lib/taskBreakdown';
import { autoAssignTasks } from '@/lib/agentOrchestration';

interface TaskBreakdownModalProps {
  agents: CodingAgent[];
  onClose: () => void;
  onImport: (result: TaskBreakdownResult, assignments: Map<string, string>) => Promise<void>;
}

export const TaskBreakdownModal = ({ agents, onClose, onImport }: TaskBreakdownModalProps) => {
  const [sourceType, setSourceType] = useState<'issue' | 'prd' | 'screenshot' | 'text'>('text');
  const [content, setContent] = useState('');
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [result, setResult] = useState<TaskBreakdownResult | null>(null);
  const [assignments, setAssignments] = useState<Map<string, string>>(new Map());
  const [expandedSections, setExpandedSections] = useState<Set<string>>(new Set(['epic', 'stories', 'tasks']));
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setImageFile(file);

    // Create preview
    const reader = new FileReader();
    reader.onload = (event) => {
      setImagePreview(event.target?.result as string);
    };
    reader.readAsDataURL(file);
  };

  const handleBreakdown = async () => {
    if (!content.trim() && !imageFile) {
      alert('Please enter content or upload an image');
      return;
    }

    setIsProcessing(true);
    try {
      const request: TaskBreakdownRequest = {
        source: sourceType,
        content: content,
        imageData: imagePreview || undefined,
      };

      const breakdownResult = await breakdownTask(request);
      setResult(breakdownResult);

      // Auto-assign agents
      const allTasks = [
        ...(breakdownResult.epic.taskId ? [breakdownResult.epic] : []),
        ...breakdownResult.stories,
        ...breakdownResult.tasks,
      ];

      const autoAssignments = autoAssignTasks(allTasks, agents);
      setAssignments(autoAssignments);

      // Expand all sections to show results
      setExpandedSections(new Set(['epic', 'stories', 'tasks', 'dependencies']));
    } catch (error) {
      console.error('Breakdown error:', error);
      alert(error instanceof Error ? error.message : 'Failed to breakdown task');
    } finally {
      setIsProcessing(false);
    }
  };

  const handleImport = async () => {
    if (!result) return;

    setIsProcessing(true);
    try {
      await onImport(result, assignments);
      onClose();
    } catch (error) {
      console.error('Import error:', error);
      alert('Failed to import tasks');
    } finally {
      setIsProcessing(false);
    }
  };

  const toggleSection = (section: string) => {
    const newExpanded = new Set(expandedSections);
    if (newExpanded.has(section)) {
      newExpanded.delete(section);
    } else {
      newExpanded.add(section);
    }
    setExpandedSections(newExpanded);
  };

  const getAgentName = (agentId: string) => {
    return agents.find(a => a.id === agentId)?.name || 'Unassigned';
  };

  const renderTaskItem = (task: Partial<Task>, level: number = 0) => {
    const agentId = task.taskId ? assignments.get(task.taskId) : undefined;
    const agent = agentId ? agents.find(a => a.id === agentId) : undefined;

    return (
      <div
        key={task.taskId}
        className="p-3 bg-white dark:bg-gray-700 rounded-lg border border-gray-200 dark:border-gray-600"
        style={{ marginLeft: `${level * 20}px` }}
      >
        <div className="flex items-start justify-between gap-3">
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-1">
              <span className="text-xs font-mono text-gray-500 dark:text-gray-400">
                {task.taskId}
              </span>
              <span className="px-2 py-0.5 bg-gray-100 dark:bg-gray-600 text-gray-700 dark:text-gray-300 rounded text-xs capitalize">
                {task.taskType}
              </span>
              <span className="px-2 py-0.5 bg-blue-100 dark:bg-blue-900 text-blue-700 dark:text-blue-300 rounded text-xs">
                P{task.priority}
              </span>
            </div>
            <h4 className="font-medium text-gray-900 dark:text-white text-sm mb-1">
              {task.title}
            </h4>
            {task.description && (
              <p className="text-xs text-gray-600 dark:text-gray-400 line-clamp-2">
                {task.description}
              </p>
            )}
            {task.estimatedHours && (
              <div className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                Est: {task.estimatedHours}h
              </div>
            )}
            {task.tags && task.tags.length > 0 && (
              <div className="flex flex-wrap gap-1 mt-2">
                {task.tags.map(tag => (
                  <span
                    key={tag}
                    className="px-1.5 py-0.5 bg-gray-100 dark:bg-gray-600 text-gray-600 dark:text-gray-300 rounded text-xs"
                  >
                    {tag}
                  </span>
                ))}
              </div>
            )}
          </div>
          <div className="flex flex-col items-end gap-2">
            {agent && (
              <div className="flex items-center gap-2">
                <div
                  className={`w-6 h-6 rounded-full ${agent.avatarColor || 'bg-gray-400'} flex items-center justify-center text-white text-xs font-bold`}
                >
                  {agent.name.charAt(0)}
                </div>
                <span className="text-xs text-gray-600 dark:text-gray-400">
                  {agent.name}
                </span>
              </div>
            )}
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-2xl w-full max-w-4xl max-h-[90vh] flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-gray-200 dark:border-gray-700">
          <div>
            <h2 className="text-xl font-bold text-gray-900 dark:text-white">
              Automated Task Breakdown
            </h2>
            <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
              Break down issues, PRDs, or screenshots into epics, stories, and tasks
            </p>
          </div>
          <button
            onClick={onClose}
            className="p-2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700"
          >
            <X size={20} />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-4 space-y-4">
          {!result ? (
            <>
              {/* Source Type Selection */}
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Source Type
                </label>
                <div className="grid grid-cols-4 gap-2">
                  {(['text', 'issue', 'prd', 'screenshot'] as const).map(type => (
                    <button
                      key={type}
                      onClick={() => setSourceType(type)}
                      className={`p-3 rounded-lg border-2 transition-colors ${
                        sourceType === type
                          ? 'border-black dark:border-white bg-black/5 dark:bg-white/5'
                          : 'border-gray-200 dark:border-gray-600 hover:border-gray-300 dark:hover:border-gray-500'
                      }`}
                    >
                      <div className="flex flex-col items-center gap-1">
                        {type === 'screenshot' ? (
                          <ImageIcon size={20} className="text-gray-600 dark:text-gray-400" />
                        ) : (
                          <FileText size={20} className="text-gray-600 dark:text-gray-400" />
                        )}
                        <span className="text-xs font-medium text-gray-700 dark:text-gray-300 capitalize">
                          {type}
                        </span>
                      </div>
                    </button>
                  ))}
                </div>
              </div>

              {/* Content Input */}
              {sourceType !== 'screenshot' ? (
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    {sourceType === 'issue' ? 'Issue Description' :
                     sourceType === 'prd' ? 'PRD Content' : 'Requirements'}
                  </label>
                  <textarea
                    value={content}
                    onChange={(e) => setContent(e.target.value)}
                    placeholder={`Paste your ${sourceType} here...\n\nExample:\n# Feature: User Authentication\n\nImplement user login and signup\n\nAcceptance Criteria:\n- Users can sign up with email\n- Users can log in\n- Sessions are persistent\n\nPriority: 4\nEstimate: 20 hours\n\nRisk: Security vulnerabilities\nTest: End-to-end auth flow testing`}
                    className="w-full h-64 px-3 py-2 border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white rounded-lg focus:outline-none focus:ring-2 focus:ring-black/10 dark:focus:ring-white/20 font-mono text-sm resize-none"
                  />
                </div>
              ) : (
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Upload Screenshot
                  </label>
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept="image/*"
                    onChange={handleImageUpload}
                    className="hidden"
                  />
                  {!imagePreview ? (
                    <button
                      onClick={() => fileInputRef.current?.click()}
                      className="w-full h-64 border-2 border-dashed border-gray-300 dark:border-gray-600 rounded-lg hover:border-gray-400 dark:hover:border-gray-500 transition-colors flex flex-col items-center justify-center gap-3 text-gray-500 dark:text-gray-400"
                    >
                      <Upload size={32} />
                      <span className="text-sm font-medium">Click to upload screenshot</span>
                    </button>
                  ) : (
                    <div className="relative">
                      <img
                        src={imagePreview}
                        alt="Preview"
                        className="w-full h-64 object-contain rounded-lg border border-gray-300 dark:border-gray-600"
                      />
                      <button
                        onClick={() => {
                          setImageFile(null);
                          setImagePreview(null);
                        }}
                        className="absolute top-2 right-2 p-1 bg-red-500 text-white rounded-full hover:bg-red-600"
                      >
                        <X size={16} />
                      </button>
                    </div>
                  )}
                  <textarea
                    value={content}
                    onChange={(e) => setContent(e.target.value)}
                    placeholder="Add additional context or requirements (optional)..."
                    className="w-full h-24 px-3 py-2 mt-2 border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white rounded-lg focus:outline-none focus:ring-2 focus:ring-black/10 dark:focus:ring-white/20 text-sm resize-none"
                  />
                </div>
              )}
            </>
          ) : (
            <>
              {/* Results */}
              <div className="space-y-3">
                {/* Epic */}
                {result.epic.taskId && (
                  <div>
                    <button
                      onClick={() => toggleSection('epic')}
                      className="w-full flex items-center justify-between p-2 hover:bg-gray-50 dark:hover:bg-gray-700 rounded-lg"
                    >
                      <div className="flex items-center gap-2">
                        {expandedSections.has('epic') ? (
                          <ChevronDown size={16} />
                        ) : (
                          <ChevronRight size={16} />
                        )}
                        <h3 className="font-semibold text-gray-900 dark:text-white">
                          Epic (1)
                        </h3>
                      </div>
                    </button>
                    {expandedSections.has('epic') && (
                      <div className="mt-2 space-y-2">
                        {renderTaskItem(result.epic)}
                      </div>
                    )}
                  </div>
                )}

                {/* Stories */}
                {result.stories.length > 0 && (
                  <div>
                    <button
                      onClick={() => toggleSection('stories')}
                      className="w-full flex items-center justify-between p-2 hover:bg-gray-50 dark:hover:bg-gray-700 rounded-lg"
                    >
                      <div className="flex items-center gap-2">
                        {expandedSections.has('stories') ? (
                          <ChevronDown size={16} />
                        ) : (
                          <ChevronRight size={16} />
                        )}
                        <h3 className="font-semibold text-gray-900 dark:text-white">
                          Stories ({result.stories.length})
                        </h3>
                      </div>
                    </button>
                    {expandedSections.has('stories') && (
                      <div className="mt-2 space-y-2">
                        {result.stories.map(story => renderTaskItem(story, 1))}
                      </div>
                    )}
                  </div>
                )}

                {/* Tasks */}
                {result.tasks.length > 0 && (
                  <div>
                    <button
                      onClick={() => toggleSection('tasks')}
                      className="w-full flex items-center justify-between p-2 hover:bg-gray-50 dark:hover:bg-gray-700 rounded-lg"
                    >
                      <div className="flex items-center gap-2">
                        {expandedSections.has('tasks') ? (
                          <ChevronDown size={16} />
                        ) : (
                          <ChevronRight size={16} />
                        )}
                        <h3 className="font-semibold text-gray-900 dark:text-white">
                          Tasks ({result.tasks.length})
                        </h3>
                      </div>
                    </button>
                    {expandedSections.has('tasks') && (
                      <div className="mt-2 space-y-2">
                        {result.tasks.map(task => renderTaskItem(task, 2))}
                      </div>
                    )}
                  </div>
                )}

                {/* Dependencies */}
                {result.dependencies.length > 0 && (
                  <div>
                    <button
                      onClick={() => toggleSection('dependencies')}
                      className="w-full flex items-center justify-between p-2 hover:bg-gray-50 dark:hover:bg-gray-700 rounded-lg"
                    >
                      <div className="flex items-center gap-2">
                        {expandedSections.has('dependencies') ? (
                          <ChevronDown size={16} />
                        ) : (
                          <ChevronRight size={16} />
                        )}
                        <h3 className="font-semibold text-gray-900 dark:text-white">
                          Dependencies ({result.dependencies.length})
                        </h3>
                      </div>
                    </button>
                    {expandedSections.has('dependencies') && (
                      <div className="mt-2 p-3 bg-gray-50 dark:bg-gray-700 rounded-lg">
                        <ul className="space-y-1 text-xs text-gray-600 dark:text-gray-400">
                          {result.dependencies.map((dep, i) => (
                            <li key={i}>
                              <span className="font-mono">{dep.from}</span>
                              <span className="mx-2">→</span>
                              <span className="font-mono">{dep.to}</span>
                              <span className="ml-2 text-gray-500">({dep.type})</span>
                            </li>
                          ))}
                        </ul>
                      </div>
                    )}
                  </div>
                )}
              </div>
            </>
          )}
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between p-4 border-t border-gray-200 dark:border-gray-700">
          <button
            onClick={onClose}
            className="px-4 py-2 text-gray-600 dark:text-gray-400 hover:text-gray-800 dark:hover:text-gray-200"
          >
            Cancel
          </button>
          {!result ? (
            <button
              onClick={handleBreakdown}
              disabled={isProcessing || (!content.trim() && !imageFile)}
              className="px-4 py-2 bg-black dark:bg-white text-white dark:text-black rounded-lg hover:bg-gray-800 dark:hover:bg-gray-200 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
            >
              {isProcessing && <Loader2 size={16} className="animate-spin" />}
              {isProcessing ? 'Analyzing...' : 'Breakdown Tasks'}
            </button>
          ) : (
            <div className="flex gap-2">
              <button
                onClick={() => setResult(null)}
                className="px-4 py-2 text-gray-600 dark:text-gray-400 hover:text-gray-800 dark:hover:text-gray-200"
              >
                Start Over
              </button>
              <button
                onClick={handleImport}
                disabled={isProcessing}
                className="px-4 py-2 bg-black dark:bg-white text-white dark:text-black rounded-lg hover:bg-gray-800 dark:hover:bg-gray-200 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
              >
                {isProcessing && <Loader2 size={16} className="animate-spin" />}
                {isProcessing ? 'Importing...' : 'Import All Tasks'}
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
