'use client';

import { useState } from 'react';
import { FileText, Image, Code, MessageSquare, Loader2, CheckCircle2, AlertTriangle } from 'lucide-react';
import { generateTaskBreakdown, BreakdownInput } from '@/lib/ai/taskBreakdown';
import { TaskBreakdownItem, RiskFlag } from '@/types/task';

interface TaskBreakdownWizardProps {
  onComplete: (breakdown: TaskBreakdownItem[]) => void;
  onCancel: () => void;
}

export default function TaskBreakdownWizard({ onComplete, onCancel }: TaskBreakdownWizardProps) {
  const [step, setStep] = useState<'input' | 'processing' | 'review'>('input');
  const [sourceType, setSourceType] = useState<'issue' | 'prd' | 'screenshot' | 'text'>('text');
  const [sourceContent, setSourceContent] = useState('');
  const [issueUrl, setIssueUrl] = useState('');
  const [imageUrl, setImageUrl] = useState('');
  const [breakdown, setBreakdown] = useState<TaskBreakdownItem[] | null>(null);
  const [summary, setSummary] = useState('');
  const [totalHours, setTotalHours] = useState(0);
  const [error, setError] = useState<string | null>(null);

  const handleGenerate = async () => {
    setError(null);
    setStep('processing');

    try {
      const input: BreakdownInput = {
        type: sourceType,
        content: sourceContent,
        metadata: {
          issueUrl: sourceType === 'issue' ? issueUrl : undefined,
          imageUrl: sourceType === 'screenshot' ? imageUrl : undefined
        }
      };

      const result = await generateTaskBreakdown(input);

      setBreakdown(result.epics);
      setSummary(result.summary);
      setTotalHours(result.totalEstimatedHours);
      setStep('review');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to generate breakdown');
      setStep('input');
    }
  };

  const handleConfirm = () => {
    if (breakdown) {
      onComplete(breakdown);
    }
  };

  const renderInputStep = () => (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
          Task Breakdown Wizard
        </h2>
        <p className="text-gray-600 dark:text-gray-400">
          Automatically break down requirements into epics, tickets, and subtasks
        </p>
      </div>

      {/* Source Type Selection */}
      <div>
        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">
          Source Type
        </label>
        <div className="grid grid-cols-2 gap-3">
          {[
            { type: 'text' as const, icon: MessageSquare, label: 'Text Description' },
            { type: 'issue' as const, icon: Code, label: 'GitHub Issue' },
            { type: 'prd' as const, icon: FileText, label: 'PRD Document' },
            { type: 'screenshot' as const, icon: Image, label: 'Screenshot' }
          ].map(({ type, icon: Icon, label }) => (
            <button
              key={type}
              onClick={() => setSourceType(type)}
              className={`p-4 rounded-lg border-2 transition-all ${
                sourceType === type
                  ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20'
                  : 'border-gray-200 dark:border-gray-700 hover:border-gray-300 dark:hover:border-gray-600'
              }`}
            >
              <Icon className="w-6 h-6 mb-2 mx-auto text-gray-700 dark:text-gray-300" />
              <div className="text-sm font-medium text-gray-900 dark:text-white">{label}</div>
            </button>
          ))}
        </div>
      </div>

      {/* Input Fields */}
      {sourceType === 'issue' && (
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
            GitHub Issue URL
          </label>
          <input
            type="url"
            value={issueUrl}
            onChange={(e) => setIssueUrl(e.target.value)}
            placeholder="https://github.com/owner/repo/issues/123"
            className="w-full px-4 py-2 rounded-lg border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
          />
        </div>
      )}

      {sourceType === 'screenshot' && (
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
            Screenshot URL or Upload
          </label>
          <input
            type="url"
            value={imageUrl}
            onChange={(e) => setImageUrl(e.target.value)}
            placeholder="https://example.com/image.png"
            className="w-full px-4 py-2 rounded-lg border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
          />
        </div>
      )}

      <div>
        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
          {sourceType === 'prd' ? 'PRD Content' : 'Description'}
        </label>
        <textarea
          value={sourceContent}
          onChange={(e) => setSourceContent(e.target.value)}
          placeholder={
            sourceType === 'issue'
              ? 'Paste the issue description or leave empty to fetch from URL...'
              : sourceType === 'prd'
              ? 'Paste the Product Requirements Document...'
              : sourceType === 'screenshot'
              ? 'Describe what you want to achieve with this screenshot...'
              : 'Describe the feature or project you want to break down...'
          }
          rows={8}
          className="w-full px-4 py-2 rounded-lg border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-900 dark:text-white resize-none"
        />
      </div>

      {error && (
        <div className="p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg">
          <p className="text-sm text-red-800 dark:text-red-200">{error}</p>
        </div>
      )}

      <div className="flex gap-3 justify-end">
        <button
          onClick={onCancel}
          className="px-6 py-2 rounded-lg border border-gray-300 dark:border-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800"
        >
          Cancel
        </button>
        <button
          onClick={handleGenerate}
          disabled={!sourceContent.trim()}
          className="px-6 py-2 rounded-lg bg-blue-500 text-white hover:bg-blue-600 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
        >
          Generate Breakdown
        </button>
      </div>
    </div>
  );

  const renderProcessingStep = () => (
    <div className="flex flex-col items-center justify-center py-12">
      <Loader2 className="w-12 h-12 text-blue-500 animate-spin mb-4" />
      <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
        Analyzing Requirements
      </h3>
      <p className="text-gray-600 dark:text-gray-400 text-center max-w-md">
        AI is breaking down your requirements into structured tasks with acceptance criteria,
        test notes, and risk assessment...
      </p>
    </div>
  );

  const renderReviewStep = () => {
    if (!breakdown) return null;

    const countTasks = (items: TaskBreakdownItem[]): number => {
      return items.reduce((sum, item) => {
        return sum + 1 + (item.children ? countTasks(item.children) : 0);
      }, 0);
    };

    const totalTasks = countTasks(breakdown);

    return (
      <div className="space-y-6">
        <div>
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
            Review Task Breakdown
          </h2>
          <p className="text-gray-600 dark:text-gray-400">{summary}</p>
        </div>

        {/* Summary Stats */}
        <div className="grid grid-cols-3 gap-4">
          <div className="p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
            <div className="text-2xl font-bold text-blue-600 dark:text-blue-400">{totalTasks}</div>
            <div className="text-sm text-gray-600 dark:text-gray-400">Total Tasks</div>
          </div>
          <div className="p-4 bg-green-50 dark:bg-green-900/20 rounded-lg">
            <div className="text-2xl font-bold text-green-600 dark:text-green-400">{totalHours}h</div>
            <div className="text-sm text-gray-600 dark:text-gray-400">Estimated Hours</div>
          </div>
          <div className="p-4 bg-amber-50 dark:bg-amber-900/20 rounded-lg">
            <div className="text-2xl font-bold text-amber-600 dark:text-amber-400">
              {breakdown.length}
            </div>
            <div className="text-sm text-gray-600 dark:text-gray-400">Epics</div>
          </div>
        </div>

        {/* Task Tree */}
        <div className="max-h-96 overflow-y-auto space-y-3">
          {breakdown.map((epic, epicIdx) => (
            <TaskBreakdownTree key={epicIdx} item={epic} level={0} />
          ))}
        </div>

        <div className="flex gap-3 justify-end pt-4 border-t border-gray-200 dark:border-gray-700">
          <button
            onClick={() => setStep('input')}
            className="px-6 py-2 rounded-lg border border-gray-300 dark:border-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800"
          >
            Back
          </button>
          <button
            onClick={handleConfirm}
            className="px-6 py-2 rounded-lg bg-green-500 text-white hover:bg-green-600 flex items-center gap-2"
          >
            <CheckCircle2 className="w-4 h-4" />
            Create Tasks
          </button>
        </div>
      </div>
    );
  };

  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-6 max-w-4xl mx-auto">
      {step === 'input' && renderInputStep()}
      {step === 'processing' && renderProcessingStep()}
      {step === 'review' && renderReviewStep()}
    </div>
  );
}

function TaskBreakdownTree({ item, level }: { item: TaskBreakdownItem; level: number }) {
  const [isExpanded, setIsExpanded] = useState(level < 2);

  const typeColors = {
    epic: 'bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-300',
    ticket: 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300',
    subtask: 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300'
  };

  const priorityColors = {
    1: 'text-red-600 dark:text-red-400',
    2: 'text-orange-600 dark:text-orange-400',
    3: 'text-yellow-600 dark:text-yellow-400',
    4: 'text-blue-600 dark:text-blue-400',
    5: 'text-gray-600 dark:text-gray-400'
  };

  const riskSeverityColors = {
    critical: 'text-red-600 dark:text-red-400',
    high: 'text-orange-600 dark:text-orange-400',
    medium: 'text-yellow-600 dark:text-yellow-400',
    low: 'text-blue-600 dark:text-blue-400'
  };

  return (
    <div className={`${level > 0 ? 'ml-6 border-l-2 border-gray-200 dark:border-gray-700 pl-4' : ''}`}>
      <div className="bg-gray-50 dark:bg-gray-900 rounded-lg p-4 space-y-2">
        <div className="flex items-start justify-between">
          <div className="flex-1">
            <div className="flex items-center gap-2 mb-1">
              <span className={`text-xs px-2 py-1 rounded ${typeColors[item.type]}`}>
                {item.type}
              </span>
              <span className={`text-xs font-medium ${priorityColors[item.priority]}`}>
                P{item.priority}
              </span>
              {item.estimatedHours && (
                <span className="text-xs text-gray-500 dark:text-gray-400">
                  {item.estimatedHours}h
                </span>
              )}
            </div>
            <h4 className="font-medium text-gray-900 dark:text-white">{item.title}</h4>
            <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">{item.description}</p>
          </div>
          {item.children && item.children.length > 0 && (
            <button
              onClick={() => setIsExpanded(!isExpanded)}
              className="text-sm text-blue-600 dark:text-blue-400 hover:underline ml-4"
            >
              {isExpanded ? 'Collapse' : `Expand (${item.children.length})`}
            </button>
          )}
        </div>

        {/* Risk Flags */}
        {item.riskFlags && item.riskFlags.length > 0 && (
          <div className="flex gap-2 flex-wrap">
            {item.riskFlags.map((risk, idx) => (
              <div
                key={idx}
                className="flex items-center gap-1 text-xs px-2 py-1 bg-white dark:bg-gray-800 rounded border border-gray-200 dark:border-gray-700"
              >
                <AlertTriangle className={`w-3 h-3 ${riskSeverityColors[risk.severity]}`} />
                <span className={riskSeverityColors[risk.severity]}>
                  {risk.type}: {risk.description}
                </span>
              </div>
            ))}
          </div>
        )}

        {/* Tags */}
        {item.tags && item.tags.length > 0 && (
          <div className="flex gap-1 flex-wrap">
            {item.tags.map((tag, idx) => (
              <span
                key={idx}
                className="text-xs px-2 py-1 bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded"
              >
                {tag}
              </span>
            ))}
          </div>
        )}
      </div>

      {/* Children */}
      {isExpanded && item.children && item.children.length > 0 && (
        <div className="mt-3 space-y-3">
          {item.children.map((child, idx) => (
            <TaskBreakdownTree key={idx} item={child} level={level + 1} />
          ))}
        </div>
      )}
    </div>
  );
}
