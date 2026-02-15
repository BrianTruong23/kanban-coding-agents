'use client';

import React, { useState } from 'react';
import { Task } from '@/types/task';
import {
  TaskBreakdown,
  TaskDependency,
  ParsedTaskInput,
  BreakdownResult,
  DefinitionOfDone,
  TestNote,
  RiskFlag
} from '@/types/taskBreakdown';
import { TaskBreakdownService } from '@/lib/taskBreakdownService';
import {
  FileText,
  Image,
  Sparkles,
  ChevronDown,
  ChevronRight,
  CheckCircle2,
  Circle,
  AlertTriangle,
  Clock,
  Target,
  ListChecks,
  FlaskConical,
  Network
} from 'lucide-react';

interface TaskBreakdownPanelProps {
  onBreakdownComplete: (result: BreakdownResult) => void;
}

export function TaskBreakdownPanel({ onBreakdownComplete }: TaskBreakdownPanelProps) {
  const [inputType, setInputType] = useState<'issue' | 'prd' | 'screenshot'>('issue');
  const [inputContent, setInputContent] = useState('');
  const [imageUrl, setImageUrl] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);
  const [result, setResult] = useState<BreakdownResult | null>(null);
  const [expandedSections, setExpandedSections] = useState<Set<string>>(new Set(['epic']));

  const handleBreakdown = async () => {
    if (!inputContent.trim()) return;

    setIsProcessing(true);

    try {
      const input: ParsedTaskInput = {
        type: inputType,
        content: inputContent,
        imageUrl: imageUrl || undefined
      };

      const breakdown = await TaskBreakdownService.parseAndBreakdown(input);
      setResult(breakdown);
    } catch (error) {
      console.error('Error breaking down task:', error);
    } finally {
      setIsProcessing(false);
    }
  };

  const handleApply = () => {
    if (result) {
      onBreakdownComplete(result);
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

  const getRiskColor = (level: string) => {
    const colors = {
      low: 'text-blue-600 bg-blue-50 dark:text-blue-400 dark:bg-blue-900/30',
      medium: 'text-yellow-600 bg-yellow-50 dark:text-yellow-400 dark:bg-yellow-900/30',
      high: 'text-orange-600 bg-orange-50 dark:text-orange-400 dark:bg-orange-900/30',
      critical: 'text-red-600 bg-red-50 dark:text-red-400 dark:bg-red-900/30'
    };
    return colors[level as keyof typeof colors] || colors.medium;
  };

  const getTestStatusColor = (status: string) => {
    const colors = {
      pending: 'text-gray-600 dark:text-gray-400',
      passed: 'text-green-600 dark:text-green-400',
      failed: 'text-red-600 dark:text-red-400',
      skipped: 'text-yellow-600 dark:text-yellow-400'
    };
    return colors[status as keyof typeof colors] || colors.pending;
  };

  return (
    <div className="flex flex-col h-full bg-white dark:bg-gray-800">
      {/* Input Section */}
      <div className="p-6 border-b border-gray-200 dark:border-gray-700">
        <h2 className="text-xl font-semibold text-gray-800 dark:text-gray-200 mb-4">
          Automated Task Breakdown
        </h2>

        {/* Input Type Selector */}
        <div className="flex gap-2 mb-4">
          <button
            onClick={() => setInputType('issue')}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg transition-colors ${
              inputType === 'issue'
                ? 'bg-blue-500 text-white'
                : 'bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-400'
            }`}
          >
            <FileText size={16} />
            Issue
          </button>
          <button
            onClick={() => setInputType('prd')}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg transition-colors ${
              inputType === 'prd'
                ? 'bg-blue-500 text-white'
                : 'bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-400'
            }`}
          >
            <FileText size={16} />
            PRD
          </button>
          <button
            onClick={() => setInputType('screenshot')}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg transition-colors ${
              inputType === 'screenshot'
                ? 'bg-blue-500 text-white'
                : 'bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-400'
            }`}
          >
            <Image size={16} />
            Screenshot
          </button>
        </div>

        {/* Input Content */}
        <textarea
          value={inputContent}
          onChange={(e) => setInputContent(e.target.value)}
          placeholder={`Paste your ${inputType} content here...\n\nExample:\n## Epic: User Authentication\n\n### Ticket 1: Login Page\n- Create login form\n- Add validation\n- Implement OAuth\n\n### Ticket 2: Registration\n- Create signup form\n- Email verification`}
          className="w-full h-64 p-3 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-900 text-gray-800 dark:text-gray-200 resize-none mb-3"
        />

        {inputType === 'screenshot' && (
          <input
            type="text"
            value={imageUrl}
            onChange={(e) => setImageUrl(e.target.value)}
            placeholder="Screenshot URL (optional)"
            className="w-full p-3 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-900 text-gray-800 dark:text-gray-200 mb-3"
          />
        )}

        <button
          onClick={handleBreakdown}
          disabled={isProcessing || !inputContent.trim()}
          className="w-full flex items-center justify-center gap-2 px-4 py-3 bg-gradient-to-r from-purple-500 to-blue-500 text-white rounded-lg hover:from-purple-600 hover:to-blue-600 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
        >
          <Sparkles size={18} />
          {isProcessing ? 'Processing...' : 'Generate Breakdown'}
        </button>
      </div>

      {/* Results Section */}
      {result && (
        <div className="flex-1 overflow-y-auto p-6">
          <div className="space-y-4">
            {/* Epic */}
            {result.hierarchy.epic && (
              <div className="border border-purple-200 dark:border-purple-800 rounded-lg">
                <div
                  className="flex items-center justify-between p-4 cursor-pointer bg-purple-50 dark:bg-purple-900/20"
                  onClick={() => toggleSection('epic')}
                >
                  <div className="flex items-center gap-2">
                    {expandedSections.has('epic') ? <ChevronDown size={20} /> : <ChevronRight size={20} />}
                    <span className="font-semibold text-purple-700 dark:text-purple-300">
                      Epic
                    </span>
                  </div>
                  <span className="text-sm text-purple-600 dark:text-purple-400">
                    {result.hierarchy.epic.estimatedHours}h estimated
                  </span>
                </div>
                {expandedSections.has('epic') && (
                  <div className="p-4 space-y-3">
                    <TaskBreakdownDetails breakdown={result.hierarchy.epic} />
                  </div>
                )}
              </div>
            )}

            {/* Tickets */}
            {result.hierarchy.tickets.map((ticket, index) => (
              <div key={ticket.id} className="border border-blue-200 dark:border-blue-800 rounded-lg">
                <div
                  className="flex items-center justify-between p-4 cursor-pointer bg-blue-50 dark:bg-blue-900/20"
                  onClick={() => toggleSection(ticket.id)}
                >
                  <div className="flex items-center gap-2">
                    {expandedSections.has(ticket.id) ? <ChevronDown size={20} /> : <ChevronRight size={20} />}
                    <span className="font-semibold text-blue-700 dark:text-blue-300">
                      Ticket {index + 1}
                    </span>
                  </div>
                  <span className="text-sm text-blue-600 dark:text-blue-400">
                    {ticket.estimatedHours}h estimated
                  </span>
                </div>
                {expandedSections.has(ticket.id) && (
                  <div className="p-4 space-y-3">
                    <TaskBreakdownDetails breakdown={ticket} />
                  </div>
                )}
              </div>
            ))}

            {/* Subtasks */}
            {result.hierarchy.subtasks.length > 0 && (
              <div className="border border-green-200 dark:border-green-800 rounded-lg">
                <div
                  className="flex items-center justify-between p-4 cursor-pointer bg-green-50 dark:bg-green-900/20"
                  onClick={() => toggleSection('subtasks')}
                >
                  <div className="flex items-center gap-2">
                    {expandedSections.has('subtasks') ? <ChevronDown size={20} /> : <ChevronRight size={20} />}
                    <span className="font-semibold text-green-700 dark:text-green-300">
                      Subtasks ({result.hierarchy.subtasks.length})
                    </span>
                  </div>
                </div>
                {expandedSections.has('subtasks') && (
                  <div className="p-4 space-y-3">
                    {result.hierarchy.subtasks.map((subtask, index) => (
                      <div key={subtask.id} className="pl-4 border-l-2 border-green-300 dark:border-green-700">
                        <div className="font-medium text-sm text-gray-700 dark:text-gray-300 mb-2">
                          Subtask {index + 1} ({subtask.estimatedHours}h)
                        </div>
                        <TaskBreakdownDetails breakdown={subtask} compact />
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}

            {/* Dependencies */}
            {result.dependencies.length > 0 && (
              <div className="border border-gray-200 dark:border-gray-700 rounded-lg p-4">
                <div className="flex items-center gap-2 mb-3">
                  <Network size={18} className="text-gray-600 dark:text-gray-400" />
                  <span className="font-semibold text-gray-700 dark:text-gray-300">
                    Dependencies ({result.dependencies.length})
                  </span>
                </div>
                <div className="space-y-2 text-sm">
                  {result.dependencies.map(dep => (
                    <div key={dep.id} className="flex items-center gap-2 text-gray-600 dark:text-gray-400">
                      <span className={`px-2 py-0.5 rounded text-xs ${
                        dep.type === 'blocks' ? 'bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-400' :
                        dep.type === 'depends-on' ? 'bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-400' :
                        'bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-400'
                      }`}>
                        {dep.type}
                      </span>
                      Task relationship
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Apply Button */}
          <button
            onClick={handleApply}
            className="w-full mt-6 px-4 py-3 bg-green-500 text-white rounded-lg hover:bg-green-600 transition-colors"
          >
            Apply Breakdown to Board
          </button>
        </div>
      )}
    </div>
  );
}

function TaskBreakdownDetails({ breakdown, compact = false }: { breakdown: TaskBreakdown; compact?: boolean }) {
  const getRiskColor = (level: string) => {
    const colors = {
      low: 'text-blue-600 bg-blue-50 dark:text-blue-400 dark:bg-blue-900/30',
      medium: 'text-yellow-600 bg-yellow-50 dark:text-yellow-400 dark:bg-yellow-900/30',
      high: 'text-orange-600 bg-orange-50 dark:text-orange-400 dark:bg-orange-900/30',
      critical: 'text-red-600 bg-red-50 dark:text-red-400 dark:bg-red-900/30'
    };
    return colors[level as keyof typeof colors] || colors.medium;
  };

  return (
    <div className="space-y-3">
      {/* Definition of Done */}
      {breakdown.definitionOfDone.length > 0 && (
        <div>
          <div className="flex items-center gap-2 mb-2">
            <ListChecks size={16} className="text-gray-600 dark:text-gray-400" />
            <span className="text-sm font-medium text-gray-700 dark:text-gray-300">Definition of Done</span>
          </div>
          <div className="space-y-1 ml-6">
            {breakdown.definitionOfDone.map(dod => (
              <div key={dod.id} className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400">
                {dod.completed ? <CheckCircle2 size={14} className="text-green-500" /> : <Circle size={14} />}
                {dod.description}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Test Notes */}
      {breakdown.testNotes.length > 0 && !compact && (
        <div>
          <div className="flex items-center gap-2 mb-2">
            <FlaskConical size={16} className="text-gray-600 dark:text-gray-400" />
            <span className="text-sm font-medium text-gray-700 dark:text-gray-300">Test Notes</span>
          </div>
          <div className="space-y-1 ml-6">
            {breakdown.testNotes.map(test => (
              <div key={test.id} className="flex items-center gap-2 text-sm">
                <span className="px-2 py-0.5 rounded text-xs bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-400">
                  {test.type}
                </span>
                <span className="text-gray-600 dark:text-gray-400">{test.description}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Risk Flags */}
      {breakdown.riskFlags.length > 0 && (
        <div>
          <div className="flex items-center gap-2 mb-2">
            <AlertTriangle size={16} className="text-gray-600 dark:text-gray-400" />
            <span className="text-sm font-medium text-gray-700 dark:text-gray-300">Risk Flags</span>
          </div>
          <div className="space-y-1 ml-6">
            {breakdown.riskFlags.map(risk => (
              <div key={risk.id} className="flex items-start gap-2 text-sm">
                <span className={`px-2 py-0.5 rounded text-xs ${getRiskColor(risk.level)}`}>
                  {risk.level}
                </span>
                <span className="text-gray-600 dark:text-gray-400">{risk.description}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Acceptance Criteria */}
      {breakdown.acceptanceCriteria.length > 0 && !compact && (
        <div>
          <div className="flex items-center gap-2 mb-2">
            <Target size={16} className="text-gray-600 dark:text-gray-400" />
            <span className="text-sm font-medium text-gray-700 dark:text-gray-300">Acceptance Criteria</span>
          </div>
          <div className="space-y-1 ml-6">
            {breakdown.acceptanceCriteria.map((criteria, index) => (
              <div key={index} className="flex items-start gap-2 text-sm text-gray-600 dark:text-gray-400">
                <span>•</span>
                {criteria}
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
