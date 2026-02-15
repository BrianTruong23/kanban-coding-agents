'use client';

import { Ticket } from '@/types/breakdown';
import { CodingAgent } from '@/types/agent';
import { AgentSkill, AgentPerformance } from '@/types/breakdown';
import { autoAssignTasks } from '@/lib/taskBreakdown';
import { useState } from 'react';
import { Sparkles, CheckCircle2, AlertCircle } from 'lucide-react';

interface AutoAssignmentProps {
  tickets: Ticket[];
  agents: CodingAgent[];
  agentSkills: AgentSkill[];
  agentPerformance: AgentPerformance[];
  onAssign: (assignments: Array<{ ticketId: string; agentId: string }>) => void;
}

export default function AutoAssignment({
  tickets,
  agents,
  agentSkills,
  agentPerformance,
  onAssign,
}: AutoAssignmentProps) {
  const [suggestions, setSuggestions] = useState<Array<{
    taskId: string;
    recommendedAgentId: string;
    reason: string;
    confidence: number;
  }>>([]);
  const [selectedAssignments, setSelectedAssignments] = useState<Set<string>>(new Set());
  const [isAnalyzing, setIsAnalyzing] = useState(false);

  const handleAnalyze = () => {
    setIsAnalyzing(true);

    // Build skill and performance maps
    const skillsMap = new Map<string, AgentSkill[]>();
    agentSkills.forEach(skill => {
      const existing = skillsMap.get(skill.agentId) || [];
      skillsMap.set(skill.agentId, [...existing, skill]);
    });

    const perfMap = new Map<string, AgentPerformance | null>();
    agentPerformance.forEach(perf => {
      perfMap.set(perf.agentId, perf);
    });

    // Only analyze unassigned tickets
    const unassignedTickets = tickets.filter(t => !t.assignedAgentId);

    // Get suggestions
    const result = autoAssignTasks(unassignedTickets, agents, skillsMap, perfMap);
    setSuggestions(result);

    // Auto-select high-confidence suggestions
    const autoSelected = new Set(
      result.filter(s => s.confidence >= 70).map(s => s.taskId)
    );
    setSelectedAssignments(autoSelected);

    setIsAnalyzing(false);
  };

  const handleToggleAssignment = (taskId: string) => {
    setSelectedAssignments(prev => {
      const next = new Set(prev);
      if (next.has(taskId)) {
        next.delete(taskId);
      } else {
        next.add(taskId);
      }
      return next;
    });
  };

  const handleApplyAssignments = () => {
    const assignments = suggestions
      .filter(s => selectedAssignments.has(s.taskId))
      .map(s => ({ ticketId: s.taskId, agentId: s.recommendedAgentId }));

    onAssign(assignments);
    setSuggestions([]);
    setSelectedAssignments(new Set());
  };

  const getTicket = (taskId: string) => {
    return tickets.find(t => t.id === taskId);
  };

  const getAgent = (agentId: string) => {
    return agents.find(a => a.id === agentId);
  };

  const getConfidenceColor = (confidence: number) => {
    if (confidence >= 80) return 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300';
    if (confidence >= 60) return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-300';
    return 'bg-orange-100 text-orange-800 dark:bg-orange-900/30 dark:text-orange-300';
  };

  const unassignedCount = tickets.filter(t => !t.assignedAgentId).length;

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between p-4 bg-gradient-to-r from-blue-50 to-purple-50 dark:from-blue-900/20 dark:to-purple-900/20 rounded-lg">
        <div>
          <h3 className="text-lg font-semibold flex items-center gap-2">
            <Sparkles className="w-5 h-5 text-purple-600" />
            Auto-Assignment
          </h3>
          <p className="text-sm text-gray-600 dark:text-gray-400">
            Automatically assign tasks to agents based on skills and performance
          </p>
          <p className="text-xs text-gray-500 mt-1">
            {unassignedCount} unassigned ticket{unassignedCount !== 1 ? 's' : ''}
          </p>
        </div>
        <button
          onClick={handleAnalyze}
          disabled={isAnalyzing || unassignedCount === 0}
          className="px-4 py-2 bg-purple-600 text-white rounded hover:bg-purple-700 disabled:bg-gray-400 disabled:cursor-not-allowed flex items-center gap-2"
        >
          {isAnalyzing ? (
            <>
              <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
              Analyzing...
            </>
          ) : (
            <>
              <Sparkles className="w-4 h-4" />
              Analyze & Suggest
            </>
          )}
        </button>
      </div>

      {/* Suggestions */}
      {suggestions.length > 0 && (
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <h4 className="font-semibold">
              Assignment Suggestions ({suggestions.length})
            </h4>
            <div className="flex gap-2">
              <button
                onClick={() => setSelectedAssignments(new Set(suggestions.map(s => s.taskId)))}
                className="text-sm text-blue-600 hover:text-blue-700"
              >
                Select All
              </button>
              <button
                onClick={() => setSelectedAssignments(new Set())}
                className="text-sm text-gray-600 hover:text-gray-700"
              >
                Clear
              </button>
              <button
                onClick={handleApplyAssignments}
                disabled={selectedAssignments.size === 0}
                className="px-4 py-1 bg-green-600 text-white rounded hover:bg-green-700 disabled:bg-gray-400 disabled:cursor-not-allowed text-sm"
              >
                Apply Selected ({selectedAssignments.size})
              </button>
            </div>
          </div>

          <div className="space-y-2">
            {suggestions.map(suggestion => {
              const ticket = getTicket(suggestion.taskId);
              const agent = getAgent(suggestion.recommendedAgentId);
              const isSelected = selectedAssignments.has(suggestion.taskId);

              if (!ticket || !agent) return null;

              return (
                <div
                  key={suggestion.taskId}
                  className={`border rounded-lg p-4 cursor-pointer transition-all ${
                    isSelected
                      ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20'
                      : 'border-gray-200 dark:border-gray-700 hover:border-gray-300'
                  }`}
                  onClick={() => handleToggleAssignment(suggestion.taskId)}
                >
                  <div className="flex items-start gap-3">
                    {/* Checkbox */}
                    <div className="mt-1">
                      <input
                        type="checkbox"
                        checked={isSelected}
                        onChange={() => handleToggleAssignment(suggestion.taskId)}
                        className="w-5 h-5 rounded"
                      />
                    </div>

                    {/* Ticket Info */}
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <span className="font-mono text-sm font-semibold text-blue-600 dark:text-blue-400">
                          {ticket.ticketId}
                        </span>
                        <span className="font-medium">{ticket.title}</span>
                      </div>
                      <div className="text-xs text-gray-600 dark:text-gray-400 space-y-1">
                        <div>Required skills: {ticket.requiredSkills.join(', ')}</div>
                      </div>
                    </div>

                    {/* Assignment Arrow */}
                    <div className="flex items-center">
                      <div className="text-2xl text-gray-400">→</div>
                    </div>

                    {/* Agent Info */}
                    <div className="flex items-center gap-2">
                      <div
                        className={`w-10 h-10 rounded-full flex items-center justify-center text-white font-bold ${agent.avatarColor || 'bg-gray-500'}`}
                      >
                        {agent.avatar}
                      </div>
                      <div>
                        <div className="font-medium">{agent.name}</div>
                        <div className={`px-2 py-0.5 rounded text-xs font-medium ${getConfidenceColor(suggestion.confidence)}`}>
                          {suggestion.confidence}% match
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Reason */}
                  <div className="mt-3 ml-8 text-xs text-gray-600 dark:text-gray-400 bg-white dark:bg-gray-800 p-2 rounded">
                    <strong>Reasoning:</strong> {suggestion.reason}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Empty State */}
      {suggestions.length === 0 && !isAnalyzing && (
        <div className="text-center py-12 text-gray-500">
          <Sparkles className="w-12 h-12 mx-auto mb-3 text-gray-400" />
          <p>Click "Analyze & Suggest" to get AI-powered assignment recommendations</p>
          <p className="text-sm mt-2">Based on agent skills, performance, and task requirements</p>
        </div>
      )}

      {/* Info Box */}
      <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-4">
        <h4 className="font-semibold text-sm mb-2 flex items-center gap-2">
          <AlertCircle className="w-4 h-4" />
          How Auto-Assignment Works
        </h4>
        <ul className="text-xs text-gray-700 dark:text-gray-300 space-y-1">
          <li>• Matches required task skills with agent proficiency levels</li>
          <li>• Considers agent performance metrics (quality score, on-time delivery)</li>
          <li>• Evaluates agent availability based on current workload</li>
          <li>• Provides confidence score for each recommendation (higher is better)</li>
          <li>• You can review and select which assignments to apply</li>
        </ul>
      </div>
    </div>
  );
}
