'use client';

import { useState, useEffect } from 'react';
import { X, Sparkles, Users, TrendingUp } from 'lucide-react';
import { Ticket } from '@/types/breakdown';
import { agentRosterService, AgentMatch } from '@/services/agentRoster';
import { useAuth } from '@/contexts/AuthContext';

interface AutoAssignmentProps {
  ticket: Ticket;
  onClose: () => void;
  onAssign: (agentId: string) => void;
}

export const AutoAssignment = ({ ticket, onClose, onAssign }: AutoAssignmentProps) => {
  const { user } = useAuth();
  const [matches, setMatches] = useState<AgentMatch[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedAgentId, setSelectedAgentId] = useState<string | null>(null);

  useEffect(() => {
    loadMatches();
  }, [ticket]);

  const loadMatches = async () => {
    if (!user) return;

    setIsLoading(true);
    try {
      const agents = await agentRosterService.getExtendedAgents(user.id);
      const agentMatches = await agentRosterService.findBestAgentMatch(ticket, agents);
      setMatches(agentMatches);

      // Pre-select the best match
      if (agentMatches.length > 0) {
        setSelectedAgentId(agentMatches[0].agent.id);
      }
    } catch (error) {
      console.error('Failed to find matches:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleAutoAssign = async () => {
    if (!user) return;

    try {
      const assignedAgentId = await agentRosterService.autoAssignTicket(ticket.id, user.id);
      if (assignedAgentId) {
        onAssign(assignedAgentId);
        onClose();
      }
    } catch (error) {
      console.error('Failed to auto-assign:', error);
    }
  };

  const handleManualAssign = () => {
    if (selectedAgentId) {
      onAssign(selectedAgentId);
      onClose();
    }
  };

  const getMatchScoreColor = (score: number) => {
    if (score >= 80) return 'text-green-600 dark:text-green-400';
    if (score >= 60) return 'text-yellow-600 dark:text-yellow-400';
    return 'text-orange-600 dark:text-orange-400';
  };

  const getMatchScoreBg = (score: number) => {
    if (score >= 80) return 'bg-green-100 dark:bg-green-900';
    if (score >= 60) return 'bg-yellow-100 dark:bg-yellow-900';
    return 'bg-orange-100 dark:bg-orange-900';
  };

  if (isLoading) {
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-xl p-8">
          <p className="text-gray-600 dark:text-gray-400">Finding best agent match...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-xl w-full max-w-2xl max-h-[90vh] flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200 dark:border-gray-700">
          <div>
            <h3 className="text-xl font-bold text-gray-900 dark:text-white flex items-center gap-2">
              <Sparkles size={20} />
              Smart Agent Assignment
            </h3>
            <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
              AI-powered agent matching for: {ticket.title}
            </p>
          </div>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
          >
            <X size={24} />
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6">
          {matches.length === 0 ? (
            <div className="text-center py-8">
              <Users size={48} className="mx-auto mb-4 text-gray-400" />
              <p className="text-gray-600 dark:text-gray-400">
                No agents available for assignment
              </p>
            </div>
          ) : (
            <div className="space-y-3">
              {matches.map((match, index) => (
                <button
                  key={match.agent.id}
                  onClick={() => setSelectedAgentId(match.agent.id)}
                  className={`w-full p-4 rounded-lg border-2 transition-all text-left ${
                    selectedAgentId === match.agent.id
                      ? 'border-black dark:border-white bg-gray-50 dark:bg-gray-700'
                      : 'border-gray-200 dark:border-gray-600 hover:border-gray-300 dark:hover:border-gray-500'
                  }`}
                >
                  <div className="flex items-start gap-4">
                    {/* Agent Avatar */}
                    <div
                      className={`w-12 h-12 rounded-full ${match.agent.avatarColor || 'bg-gray-400'} flex items-center justify-center text-white font-bold flex-shrink-0`}
                    >
                      {match.agent.name.charAt(0)}
                    </div>

                    {/* Agent Info */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <h4 className="font-semibold text-gray-900 dark:text-white">
                          {match.agent.name}
                        </h4>
                        {index === 0 && (
                          <span className="text-xs bg-purple-100 dark:bg-purple-900 text-purple-800 dark:text-purple-200 px-2 py-0.5 rounded-full font-medium">
                            Best Match
                          </span>
                        )}
                      </div>
                      <p className="text-sm text-gray-600 dark:text-gray-400 mb-2">
                        {match.agent.description}
                      </p>

                      {/* Match Score */}
                      <div className="flex items-center gap-3 mb-2">
                        <div className="flex items-center gap-2">
                          <TrendingUp size={14} className={getMatchScoreColor(match.matchScore)} />
                          <span className={`text-sm font-semibold ${getMatchScoreColor(match.matchScore)}`}>
                            {match.matchScore}% Match
                          </span>
                        </div>
                        <div className="flex-1 bg-gray-200 dark:bg-gray-700 rounded-full h-2">
                          <div
                            className={`h-2 rounded-full ${getMatchScoreBg(match.matchScore)}`}
                            style={{ width: `${match.matchScore}%` }}
                          />
                        </div>
                      </div>

                      {/* Reasons */}
                      <div className="space-y-1">
                        {match.reasons.map((reason, idx) => (
                          <div key={idx} className="text-xs text-gray-500 dark:text-gray-400 flex items-start gap-1">
                            <span className="text-gray-400">•</span>
                            <span>{reason}</span>
                          </div>
                        ))}
                      </div>

                      {/* Agent Stats */}
                      <div className="flex items-center gap-4 mt-3 pt-3 border-t border-gray-200 dark:border-gray-600">
                        <div className="text-xs">
                          <span className="text-gray-500 dark:text-gray-400">Load: </span>
                          <span className="font-semibold text-gray-900 dark:text-white">
                            {match.agent.currentLoad}%
                          </span>
                        </div>
                        <div className="text-xs">
                          <span className="text-gray-500 dark:text-gray-400">Completed: </span>
                          <span className="font-semibold text-gray-900 dark:text-white">
                            {match.agent.performance.tasksCompleted}
                          </span>
                        </div>
                        <div className="text-xs">
                          <span className="text-gray-500 dark:text-gray-400">Success: </span>
                          <span className="font-semibold text-gray-900 dark:text-white">
                            {Math.round(match.agent.performance.successRate * 100)}%
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="flex justify-between gap-3 p-6 border-t border-gray-200 dark:border-gray-700">
          <button
            onClick={onClose}
            className="px-4 py-2 text-gray-600 dark:text-gray-400 hover:text-gray-800 dark:hover:text-gray-200 transition-colors"
          >
            Cancel
          </button>
          <div className="flex gap-3">
            <button
              onClick={handleAutoAssign}
              disabled={matches.length === 0}
              className="px-4 py-2 bg-purple-600 dark:bg-purple-500 text-white rounded-lg hover:bg-purple-700 dark:hover:bg-purple-600 transition-colors font-medium disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
            >
              <Sparkles size={16} />
              Auto-Assign Best Match
            </button>
            <button
              onClick={handleManualAssign}
              disabled={!selectedAgentId}
              className="px-4 py-2 bg-black dark:bg-white text-white dark:text-black rounded-lg hover:bg-gray-800 dark:hover:bg-gray-200 transition-colors font-medium disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Assign Selected
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
