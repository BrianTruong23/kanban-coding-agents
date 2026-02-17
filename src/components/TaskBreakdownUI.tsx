'use client';

import { useState } from 'react';
import {
  InputSource,
  TaskBreakdownResult,
  BreakdownConfig,
  Epic,
  Ticket,
  Subtask,
} from '@/types/taskBreakdown';
import { TaskBreakdownService } from '@/services/taskBreakdownService';
import { DependencyGraph } from './DependencyGraph';
import {
  FileText,
  Image as ImageIcon,
  Zap,
  ChevronDown,
  ChevronRight,
  CheckCircle2,
  Circle,
  AlertTriangle,
  Clock,
  Target,
} from 'lucide-react';

interface TaskBreakdownUIProps {
  onBreakdownComplete?: (result: TaskBreakdownResult) => void;
  config?: BreakdownConfig;
}

export const TaskBreakdownUI = ({ onBreakdownComplete, config }: TaskBreakdownUIProps) => {
  const [inputType, setInputType] = useState<'issue' | 'prd' | 'screenshot' | 'text'>('issue');
  const [inputContent, setInputContent] = useState('');
  const [imageUrl, setImageUrl] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);
  const [result, setResult] = useState<TaskBreakdownResult | null>(null);
  const [expandedEpics, setExpandedEpics] = useState<Set<string>>(new Set());
  const [expandedTickets, setExpandedTickets] = useState<Set<string>>(new Set());
  const [showDependencies, setShowDependencies] = useState(false);

  const handleBreakdown = async () => {
    if (!inputContent.trim()) return;

    setIsProcessing(true);
    try {
      const service = new TaskBreakdownService(config);
      const input: InputSource = {
        type: inputType,
        content: inputContent,
        imageUrl: inputType === 'screenshot' ? imageUrl : undefined,
      };

      const breakdownResult = await service.breakdownTasks(input);
      setResult(breakdownResult);

      // Auto-expand all epics
      setExpandedEpics(new Set(breakdownResult.epics.map((e) => e.id)));

      if (onBreakdownComplete) {
        onBreakdownComplete(breakdownResult);
      }
    } catch (error) {
      console.error('Breakdown failed:', error);
      alert('Failed to breakdown tasks. Please try again.');
    } finally {
      setIsProcessing(false);
    }
  };

  const toggleEpic = (epicId: string) => {
    const newExpanded = new Set(expandedEpics);
    if (newExpanded.has(epicId)) {
      newExpanded.delete(epicId);
    } else {
      newExpanded.add(epicId);
    }
    setExpandedEpics(newExpanded);
  };

  const toggleTicket = (ticketId: string) => {
    const newExpanded = new Set(expandedTickets);
    if (newExpanded.has(ticketId)) {
      newExpanded.delete(ticketId);
    } else {
      newExpanded.add(ticketId);
    }
    setExpandedTickets(newExpanded);
  };

  const getPriorityColor = (priority: number) => {
    if (priority >= 5) return 'text-red-600 dark:text-red-400';
    if (priority >= 4) return 'text-orange-600 dark:text-orange-400';
    if (priority >= 3) return 'text-yellow-600 dark:text-yellow-400';
    return 'text-green-600 dark:text-green-400';
  };

  const getStatusColor = (status: string) => {
    if (status.includes('done')) return 'text-green-600 dark:text-green-400';
    if (status.includes('progress')) return 'text-blue-600 dark:text-blue-400';
    if (status.includes('review')) return 'text-purple-600 dark:text-purple-400';
    return 'text-gray-600 dark:text-gray-400';
  };

  return (
    <div className="space-y-6">
      {/* Input Section */}
      <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-6">
        <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-4">
          Automated Task Breakdown
        </h2>

        <div className="space-y-4">
          {/* Input Type Selection */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Input Type
            </label>
            <div className="flex gap-2 flex-wrap">
              {(['issue', 'prd', 'screenshot', 'text'] as const).map((type) => (
                <button
                  key={type}
                  onClick={() => setInputType(type)}
                  className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                    inputType === type
                      ? 'bg-black dark:bg-white text-white dark:text-black'
                      : 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600'
                  }`}
                >
                  {type === 'issue' && <FileText size={16} className="inline mr-1" />}
                  {type === 'screenshot' && <ImageIcon size={16} className="inline mr-1" />}
                  {type.charAt(0).toUpperCase() + type.slice(1)}
                </button>
              ))}
            </div>
          </div>

          {/* Text Input */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              {inputType === 'issue' ? 'GitHub Issue' : inputType === 'prd' ? 'PRD Content' : inputType === 'screenshot' ? 'Screenshot Description' : 'Text Input'}
            </label>
            <textarea
              value={inputContent}
              onChange={(e) => setInputContent(e.target.value)}
              placeholder={`Paste your ${inputType} content here...`}
              className="w-full h-48 p-3 border border-gray-200 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white rounded-lg focus:outline-none focus:ring-2 focus:ring-black/10 dark:focus:ring-white/20 resize-none"
            />
          </div>

          {/* Screenshot URL (if applicable) */}
          {inputType === 'screenshot' && (
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Screenshot URL (optional)
              </label>
              <input
                type="url"
                value={imageUrl}
                onChange={(e) => setImageUrl(e.target.value)}
                placeholder="https://example.com/screenshot.png"
                className="w-full p-3 border border-gray-200 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white rounded-lg focus:outline-none focus:ring-2 focus:ring-black/10 dark:focus:ring-white/20"
              />
            </div>
          )}

          {/* Action Button */}
          <button
            onClick={handleBreakdown}
            disabled={isProcessing || !inputContent.trim()}
            className="w-full bg-black dark:bg-white text-white dark:text-black px-6 py-3 rounded-lg font-medium hover:bg-gray-800 dark:hover:bg-gray-200 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
          >
            <Zap size={20} />
            {isProcessing ? 'Processing...' : 'Generate Task Breakdown'}
          </button>
        </div>
      </div>

      {/* Results Section */}
      {result && (
        <div className="space-y-6">
          {/* Summary Card */}
          <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-6">
            <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-4">Summary</h3>
            <p className="text-gray-700 dark:text-gray-300 mb-4">{result.summary}</p>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="bg-purple-50 dark:bg-purple-900/20 p-4 rounded-lg">
                <div className="text-2xl font-bold text-purple-600 dark:text-purple-400">
                  {result.epics.length}
                </div>
                <div className="text-sm text-gray-600 dark:text-gray-400">Epics</div>
              </div>
              <div className="bg-blue-50 dark:bg-blue-900/20 p-4 rounded-lg">
                <div className="text-2xl font-bold text-blue-600 dark:text-blue-400">
                  {result.tickets.length}
                </div>
                <div className="text-sm text-gray-600 dark:text-gray-400">Tickets</div>
              </div>
              <div className="bg-green-50 dark:bg-green-900/20 p-4 rounded-lg">
                <div className="text-2xl font-bold text-green-600 dark:text-green-400">
                  {result.subtasks.length}
                </div>
                <div className="text-sm text-gray-600 dark:text-gray-400">Subtasks</div>
              </div>
              <div className="bg-orange-50 dark:bg-orange-900/20 p-4 rounded-lg">
                <div className="text-2xl font-bold text-orange-600 dark:text-orange-400">
                  {Math.round(result.confidence * 100)}%
                </div>
                <div className="text-sm text-gray-600 dark:text-gray-400">Confidence</div>
              </div>
            </div>
          </div>

          {/* Dependencies Toggle */}
          <div className="flex justify-end">
            <button
              onClick={() => setShowDependencies(!showDependencies)}
              className="px-4 py-2 bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors"
            >
              {showDependencies ? 'Hide' : 'Show'} Dependency Graph
            </button>
          </div>

          {/* Dependency Graph */}
          {showDependencies && (
            <DependencyGraph
              epics={result.epics}
              tickets={result.tickets}
              subtasks={result.subtasks}
              dependencies={result.dependencies}
            />
          )}

          {/* Task Hierarchy */}
          <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-6">
            <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-4">Task Hierarchy</h3>

            <div className="space-y-3">
              {result.epics.map((epic) => (
                <div key={epic.id} className="border border-gray-200 dark:border-gray-700 rounded-lg">
                  {/* Epic Header */}
                  <div
                    onClick={() => toggleEpic(epic.id)}
                    className="p-4 cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors flex items-start gap-3"
                  >
                    <button className="mt-1">
                      {expandedEpics.has(epic.id) ? (
                        <ChevronDown size={20} />
                      ) : (
                        <ChevronRight size={20} />
                      )}
                    </button>
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <span className="font-mono text-sm font-bold text-purple-600 dark:text-purple-400">
                          {epic.epicId}
                        </span>
                        <span className={`text-xs ${getStatusColor(epic.status)}`}>
                          {epic.status}
                        </span>
                        <span className={`text-xs ${getPriorityColor(epic.priority)}`}>
                          P{epic.priority}
                        </span>
                        {epic.riskFlags.length > 0 && (
                          <AlertTriangle size={16} className="text-orange-500" />
                        )}
                      </div>
                      <div className="text-gray-900 dark:text-white font-medium">{epic.title}</div>
                      <div className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                        {epic.description}
                      </div>
                    </div>
                  </div>

                  {/* Epic Details */}
                  {expandedEpics.has(epic.id) && (
                    <div className="px-4 pb-4 space-y-4 border-t border-gray-200 dark:border-gray-700 pt-4">
                      {/* DoD */}
                      {epic.definitionsOfDone.length > 0 && (
                        <div>
                          <div className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2 flex items-center gap-2">
                            <Target size={16} />
                            Definition of Done
                          </div>
                          <div className="space-y-1">
                            {epic.definitionsOfDone.map((dod) => (
                              <div key={dod.id} className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400">
                                {dod.completed ? (
                                  <CheckCircle2 size={16} className="text-green-500" />
                                ) : (
                                  <Circle size={16} />
                                )}
                                {dod.description}
                              </div>
                            ))}
                          </div>
                        </div>
                      )}

                      {/* Tickets */}
                      <div>
                        <div className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                          Tickets ({result.tickets.filter((t) => t.epicId === epic.id).length})
                        </div>
                        <div className="space-y-2 ml-6">
                          {result.tickets
                            .filter((t) => t.epicId === epic.id)
                            .map((ticket) => (
                              <TicketCard
                                key={ticket.id}
                                ticket={ticket}
                                subtasks={result.subtasks.filter((s) => s.ticketId === ticket.id)}
                                isExpanded={expandedTickets.has(ticket.id)}
                                onToggle={() => toggleTicket(ticket.id)}
                              />
                            ))}
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

// Ticket Card Component
const TicketCard = ({
  ticket,
  subtasks,
  isExpanded,
  onToggle,
}: {
  ticket: Ticket;
  subtasks: Subtask[];
  isExpanded: boolean;
  onToggle: () => void;
}) => {
  const getPriorityColor = (priority: number) => {
    if (priority >= 5) return 'text-red-600 dark:text-red-400';
    if (priority >= 4) return 'text-orange-600 dark:text-orange-400';
    if (priority >= 3) return 'text-yellow-600 dark:text-yellow-400';
    return 'text-green-600 dark:text-green-400';
  };

  const getStatusColor = (status: string) => {
    if (status.includes('done')) return 'text-green-600 dark:text-green-400';
    if (status.includes('progress')) return 'text-blue-600 dark:text-blue-400';
    if (status.includes('review')) return 'text-purple-600 dark:text-purple-400';
    return 'text-gray-600 dark:text-gray-400';
  };

  return (
    <div className="border border-gray-200 dark:border-gray-700 rounded-lg">
      <div
        onClick={onToggle}
        className="p-3 cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors flex items-start gap-2"
      >
        <button className="mt-1">
          {isExpanded ? <ChevronDown size={18} /> : <ChevronRight size={18} />}
        </button>
        <div className="flex-1">
          <div className="flex items-center gap-2 mb-1">
            <span className="font-mono text-xs font-bold text-blue-600 dark:text-blue-400">
              {ticket.ticketId}
            </span>
            <span className="text-xs px-2 py-0.5 bg-gray-100 dark:bg-gray-700 rounded">
              {ticket.type}
            </span>
            <span className={`text-xs ${getStatusColor(ticket.status)}`}>{ticket.status}</span>
            <span className={`text-xs ${getPriorityColor(ticket.priority)}`}>P{ticket.priority}</span>
            {ticket.estimatedEffort && (
              <span className="text-xs text-gray-500 dark:text-gray-400 flex items-center gap-1">
                <Clock size={12} />
                {ticket.estimatedEffort}pts
              </span>
            )}
          </div>
          <div className="text-sm text-gray-900 dark:text-white">{ticket.title}</div>
        </div>
      </div>

      {isExpanded && (
        <div className="px-3 pb-3 space-y-3 border-t border-gray-200 dark:border-gray-700 pt-3">
          <div className="text-sm text-gray-600 dark:text-gray-400">{ticket.description}</div>

          {/* Subtasks */}
          {subtasks.length > 0 && (
            <div>
              <div className="text-xs font-medium text-gray-700 dark:text-gray-300 mb-2">
                Subtasks ({subtasks.length})
              </div>
              <div className="space-y-1 ml-4">
                {subtasks.map((subtask) => (
                  <div
                    key={subtask.id}
                    className="text-xs text-gray-600 dark:text-gray-400 flex items-center gap-2"
                  >
                    <Circle size={12} className="text-green-500" />
                    <span className="font-mono text-green-600 dark:text-green-400">
                      {subtask.subtaskId}
                    </span>
                    {subtask.title}
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Risk Flags */}
          {ticket.riskFlags.length > 0 && (
            <div>
              <div className="text-xs font-medium text-gray-700 dark:text-gray-300 mb-2 flex items-center gap-1">
                <AlertTriangle size={14} />
                Risk Flags
              </div>
              <div className="space-y-1">
                {ticket.riskFlags.map((risk) => (
                  <div
                    key={risk.id}
                    className="text-xs p-2 bg-orange-50 dark:bg-orange-900/20 rounded border border-orange-200 dark:border-orange-800"
                  >
                    <div className="font-medium text-orange-700 dark:text-orange-400">
                      {risk.level.toUpperCase()}: {risk.description}
                    </div>
                    <div className="text-gray-600 dark:text-gray-400 mt-1">{risk.impact}</div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
};
