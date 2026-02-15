'use client';

import { useState } from 'react';
import { FileText, AlertTriangle, CheckCircle, Clock, Users } from 'lucide-react';
import { TaskBreakdownEngine } from '@/lib/taskBreakdown';
import { InputSource, BreakdownResult } from '@/types/taskBreakdown';

export function TaskBreakdownPanel() {
  const [inputText, setInputText] = useState('');
  const [inputType, setInputType] = useState<'issue' | 'prd' | 'text'>('text');
  const [breakdown, setBreakdown] = useState<BreakdownResult | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);

  const handleBreakdown = async () => {
    if (!inputText.trim()) return;

    setIsProcessing(true);

    const source: InputSource = {
      type: inputType,
      content: inputText,
    };

    try {
      const result = await TaskBreakdownEngine.breakdown(source, {
        autoAssignAgents: true,
        generateTestNotes: true,
        identifyRisks: true,
        estimateEffort: true,
      });

      setBreakdown(result);
    } catch (error) {
      console.error('Breakdown failed:', error);
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <div className="flex flex-col h-full bg-white dark:bg-gray-800 rounded-lg shadow-lg overflow-hidden">
      {/* Header */}
      <div className="p-4 border-b border-gray-200 dark:border-gray-700">
        <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-100">
          Task Breakdown Engine
        </h2>
        <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
          Paste an issue, PRD, or description to automatically break it down into epics, tickets, and subtasks
        </p>
      </div>

      {/* Input Section */}
      <div className="p-4 border-b border-gray-200 dark:border-gray-700">
        <div className="flex gap-2 mb-3">
          <button
            onClick={() => setInputType('text')}
            className={`px-3 py-1.5 text-sm rounded ${
              inputType === 'text'
                ? 'bg-blue-500 text-white'
                : 'bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300'
            }`}
          >
            Text
          </button>
          <button
            onClick={() => setInputType('issue')}
            className={`px-3 py-1.5 text-sm rounded ${
              inputType === 'issue'
                ? 'bg-blue-500 text-white'
                : 'bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300'
            }`}
          >
            GitHub Issue
          </button>
          <button
            onClick={() => setInputType('prd')}
            className={`px-3 py-1.5 text-sm rounded ${
              inputType === 'prd'
                ? 'bg-blue-500 text-white'
                : 'bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300'
            }`}
          >
            PRD
          </button>
        </div>

        <textarea
          value={inputText}
          onChange={(e) => setInputText(e.target.value)}
          placeholder={`Paste your ${inputType} here...`}
          className="w-full h-32 p-3 border border-gray-300 dark:border-gray-600 rounded bg-white dark:bg-gray-900 text-gray-900 dark:text-gray-100 resize-none"
        />

        <button
          onClick={handleBreakdown}
          disabled={!inputText.trim() || isProcessing}
          className="mt-3 px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {isProcessing ? 'Processing...' : 'Break Down Tasks'}
        </button>
      </div>

      {/* Results Section */}
      {breakdown && (
        <div className="flex-1 overflow-auto p-4">
          {/* Summary */}
          <div className="mb-4 p-3 bg-blue-50 dark:bg-blue-900/20 rounded">
            <p className="text-sm text-gray-900 dark:text-gray-100">{breakdown.summary}</p>
            <div className="flex gap-4 mt-2 text-xs text-gray-600 dark:text-gray-400">
              <span>
                <Clock className="inline w-3 h-3 mr-1" />
                {breakdown.totalEstimatedHours}h total
              </span>
              <span>{breakdown.suggestedSprint}</span>
            </div>
          </div>

          {/* Epics */}
          {breakdown.epics.map((epic) => (
            <div key={epic.id} className="mb-4 border border-purple-300 dark:border-purple-700 rounded-lg">
              <div className="p-3 bg-purple-50 dark:bg-purple-900/20 border-b border-purple-300 dark:border-purple-700">
                <div className="flex items-center gap-2">
                  <FileText className="w-4 h-4 text-purple-600 dark:text-purple-400" />
                  <h3 className="font-semibold text-purple-900 dark:text-purple-100">
                    Epic: {epic.title}
                  </h3>
                </div>
                <p className="text-xs text-purple-700 dark:text-purple-300 mt-1">
                  {epic.description}
                </p>
              </div>

              {/* Tickets */}
              {breakdown.tickets
                .filter((ticket) => ticket.epicId === epic.id)
                .map((ticket) => (
                  <div key={ticket.id} className="p-3 border-b border-gray-200 dark:border-gray-700 last:border-b-0">
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <h4 className="font-medium text-gray-900 dark:text-gray-100">
                          {ticket.title}
                        </h4>
                        <p className="text-xs text-gray-600 dark:text-gray-400 mt-1">
                          {ticket.description}
                        </p>

                        {/* Tags */}
                        {ticket.tags.length > 0 && (
                          <div className="flex gap-1 mt-2">
                            {ticket.tags.map((tag) => (
                              <span
                                key={tag}
                                className="px-2 py-0.5 text-xs bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded"
                              >
                                {tag}
                              </span>
                            ))}
                          </div>
                        )}

                        {/* Definition of Done */}
                        {ticket.definitionOfDone.length > 0 && (
                          <div className="mt-2">
                            <p className="text-xs font-medium text-gray-700 dark:text-gray-300">
                              Definition of Done:
                            </p>
                            {ticket.definitionOfDone.slice(0, 2).map((dod) => (
                              <div key={dod.id} className="flex items-center gap-1 text-xs text-gray-600 dark:text-gray-400">
                                <CheckCircle className="w-3 h-3" />
                                {dod.description}
                              </div>
                            ))}
                          </div>
                        )}

                        {/* Risk Flags */}
                        {ticket.riskFlags.length > 0 && (
                          <div className="mt-2">
                            {ticket.riskFlags.map((risk) => (
                              <div
                                key={risk.id}
                                className={`flex items-center gap-1 text-xs ${
                                  risk.level === 'critical'
                                    ? 'text-red-600 dark:text-red-400'
                                    : risk.level === 'high'
                                    ? 'text-orange-600 dark:text-orange-400'
                                    : 'text-yellow-600 dark:text-yellow-400'
                                }`}
                              >
                                <AlertTriangle className="w-3 h-3" />
                                {risk.description}
                              </div>
                            ))}
                          </div>
                        )}

                        {/* Subtasks */}
                        {breakdown.subtasks.filter((st) => st.ticketId === ticket.id).length > 0 && (
                          <div className="mt-2">
                            <p className="text-xs font-medium text-gray-700 dark:text-gray-300">
                              Subtasks ({breakdown.subtasks.filter((st) => st.ticketId === ticket.id).length}):
                            </p>
                            {breakdown.subtasks
                              .filter((st) => st.ticketId === ticket.id)
                              .slice(0, 3)
                              .map((subtask) => (
                                <div key={subtask.id} className="text-xs text-gray-600 dark:text-gray-400 ml-3">
                                  • {subtask.title}
                                </div>
                              ))}
                          </div>
                        )}
                      </div>

                      <div className="text-right ml-4">
                        <div className="text-xs text-gray-500 dark:text-gray-400">
                          <Clock className="inline w-3 h-3 mr-1" />
                          {ticket.estimatedHours}h
                        </div>
                        <div className="text-xs text-gray-500 dark:text-gray-400">
                          Priority: {ticket.priority}
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
