'use client';

import { useState } from 'react';
import { X, AlertTriangle, CheckCircle, Clock, Users, GitBranch, Zap } from 'lucide-react';
import { Task } from '@/types/task';
import { TaskBreakdownResult, TaskBreakdownNode, RiskFlag } from '@/types/task-breakdown';
import { AgentWithSkills } from '@/types/agent-skills';

interface TaskBreakdownModalProps {
  breakdown: TaskBreakdownResult;
  agents: AgentWithSkills[];
  onClose: () => void;
  onApprove: (tasks: Task[], assignments: Map<string, string>) => Promise<void>;
}

const riskFlagColors: Record<RiskFlag, string> = {
  'high-complexity': 'bg-orange-100 text-orange-800 border-orange-300',
  'external-dependency': 'bg-purple-100 text-purple-800 border-purple-300',
  'security': 'bg-red-100 text-red-800 border-red-300',
  'performance': 'bg-yellow-100 text-yellow-800 border-yellow-300',
  'data-migration': 'bg-blue-100 text-blue-800 border-blue-300',
  'breaking-change': 'bg-pink-100 text-pink-800 border-pink-300',
  'technical-debt': 'bg-gray-100 text-gray-800 border-gray-300',
};

function RiskFlagBadge({ flag }: { flag: RiskFlag }) {
  return (
    <span
      className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium border ${riskFlagColors[flag]}`}
    >
      <AlertTriangle className="w-3 h-3 mr-1" />
      {flag.replace(/-/g, ' ')}
    </span>
  );
}

function TaskNodeCard({
  node,
  level,
  agents,
  selectedAssignments,
  onAssignmentChange,
}: {
  node: TaskBreakdownNode;
  level: number;
  agents: AgentWithSkills[];
  selectedAssignments: Map<string, string>;
  onAssignmentChange: (taskId: string, agentId: string) => void;
}) {
  const paddingLeft = level * 24;
  const { task, hierarchy, dependencies } = node;

  const typeColors = {
    epic: 'border-purple-500 bg-purple-50',
    ticket: 'border-blue-500 bg-blue-50',
    subtask: 'border-green-500 bg-green-50',
  };

  const typeBadges = {
    epic: 'bg-purple-600 text-white',
    ticket: 'bg-blue-600 text-white',
    subtask: 'bg-green-600 text-white',
  };

  return (
    <div style={{ paddingLeft: `${paddingLeft}px` }} className="mb-3">
      <div
        className={`border-l-4 rounded-lg p-4 shadow-sm ${typeColors[hierarchy.hierarchyType]}`}
      >
        {/* Header */}
        <div className="flex items-start justify-between mb-2">
          <div className="flex-1">
            <div className="flex items-center gap-2 mb-1">
              <span className={`px-2 py-0.5 rounded text-xs font-bold ${typeBadges[hierarchy.hierarchyType]}`}>
                {hierarchy.hierarchyType.toUpperCase()}
              </span>
              <span className="text-xs font-mono text-gray-600">{task.taskId}</span>
              {dependencies.length > 0 && (
                <span className="inline-flex items-center px-2 py-0.5 rounded text-xs bg-gray-200 text-gray-700">
                  <GitBranch className="w-3 h-3 mr-1" />
                  {dependencies.length} dep
                </span>
              )}
            </div>
            <h3 className="font-semibold text-gray-900">{task.title}</h3>
            {task.description && (
              <p className="text-sm text-gray-600 mt-1">{task.description}</p>
            )}
          </div>

          {/* Effort estimation */}
          {hierarchy.estimatedEffort && (
            <div className="flex items-center gap-1 text-sm text-gray-600 ml-4">
              <Clock className="w-4 h-4" />
              <span>{hierarchy.estimatedEffort}pt</span>
            </div>
          )}
        </div>

        {/* Risk flags */}
        {hierarchy.riskFlags && hierarchy.riskFlags.length > 0 && (
          <div className="flex flex-wrap gap-2 mb-2">
            {hierarchy.riskFlags.map((flag) => (
              <RiskFlagBadge key={flag} flag={flag} />
            ))}
          </div>
        )}

        {/* Definition of Done */}
        {hierarchy.definitionOfDone && (
          <div className="mt-3 p-3 bg-white rounded border border-gray-200">
            <div className="flex items-center gap-1 text-sm font-medium text-gray-700 mb-2">
              <CheckCircle className="w-4 h-4" />
              Definition of Done:
            </div>
            <div className="text-sm text-gray-600 whitespace-pre-line">
              {hierarchy.definitionOfDone}
            </div>
          </div>
        )}

        {/* Test notes */}
        {hierarchy.testNotes && (
          <div className="mt-2 p-3 bg-white rounded border border-gray-200">
            <div className="flex items-center gap-1 text-sm font-medium text-gray-700 mb-1">
              <Zap className="w-4 h-4" />
              Test Notes:
            </div>
            <div className="text-sm text-gray-600">{hierarchy.testNotes}</div>
          </div>
        )}

        {/* Agent assignment */}
        {hierarchy.hierarchyType !== 'epic' && (
          <div className="mt-3 flex items-center gap-2">
            <Users className="w-4 h-4 text-gray-600" />
            <select
              value={selectedAssignments.get(task.id) || ''}
              onChange={(e) => onAssignmentChange(task.id, e.target.value)}
              className="flex-1 px-3 py-1.5 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="">Assign to agent...</option>
              {agents.map((agent) => (
                <option key={agent.id} value={agent.id}>
                  {agent.name} - {agent.description}
                </option>
              ))}
            </select>
          </div>
        )}
      </div>

      {/* Render children */}
      {node.children.map((child) => (
        <TaskNodeCard
          key={child.task.id}
          node={child}
          level={level + 1}
          agents={agents}
          selectedAssignments={selectedAssignments}
          onAssignmentChange={onAssignmentChange}
        />
      ))}
    </div>
  );
}

export function TaskBreakdownModal({
  breakdown,
  agents,
  onClose,
  onApprove,
}: TaskBreakdownModalProps) {
  const [selectedAssignments, setSelectedAssignments] = useState<Map<string, string>>(new Map());
  const [isApproving, setIsApproving] = useState(false);

  const handleAssignmentChange = (taskId: string, agentId: string) => {
    const newAssignments = new Map(selectedAssignments);
    if (agentId) {
      newAssignments.set(taskId, agentId);
    } else {
      newAssignments.delete(taskId);
    }
    setSelectedAssignments(newAssignments);
  };

  const handleApprove = async () => {
    setIsApproving(true);
    try {
      await onApprove(breakdown.allTasks, selectedAssignments);
      onClose();
    } catch (error) {
      console.error('Error approving breakdown:', error);
      alert('Failed to create tasks. Please try again.');
    } finally {
      setIsApproving(false);
    }
  };

  const totalEstimatedEffort = breakdown.allHierarchies.reduce(
    (sum, h) => sum + (h.estimatedEffort || 0),
    0
  );

  const riskFlagsCount = breakdown.allHierarchies.reduce(
    (count, h) => count + (h.riskFlags?.length || 0),
    0
  );

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-xl max-w-5xl w-full max-h-[90vh] flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <div>
            <h2 className="text-2xl font-bold text-gray-900">Task Breakdown Preview</h2>
            <div className="flex items-center gap-4 mt-2 text-sm text-gray-600">
              <span>{breakdown.allTasks.length} tasks</span>
              <span>•</span>
              <span>{totalEstimatedEffort} story points</span>
              <span>•</span>
              <span>{breakdown.allDependencies.length} dependencies</span>
              {riskFlagsCount > 0 && (
                <>
                  <span>•</span>
                  <span className="text-orange-600 font-medium">
                    {riskFlagsCount} risk flags
                  </span>
                </>
              )}
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6">
          {breakdown.epic && (
            <TaskNodeCard
              node={breakdown.epic}
              level={0}
              agents={agents}
              selectedAssignments={selectedAssignments}
              onAssignmentChange={handleAssignmentChange}
            />
          )}

          {!breakdown.epic &&
            breakdown.tickets.map((ticket) => (
              <TaskNodeCard
                key={ticket.task.id}
                node={ticket}
                level={0}
                agents={agents}
                selectedAssignments={selectedAssignments}
                onAssignmentChange={handleAssignmentChange}
              />
            ))}
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between p-6 border-t border-gray-200 bg-gray-50">
          <div className="text-sm text-gray-600">
            {selectedAssignments.size} of {breakdown.allTasks.length - (breakdown.epic ? 1 : 0)}{' '}
            tasks assigned
          </div>
          <div className="flex gap-3">
            <button
              onClick={onClose}
              disabled={isApproving}
              className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-100 transition-colors disabled:opacity-50"
            >
              Cancel
            </button>
            <button
              onClick={handleApprove}
              disabled={isApproving}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 flex items-center gap-2"
            >
              {isApproving ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent" />
                  Creating Tasks...
                </>
              ) : (
                <>
                  <CheckCircle className="w-4 h-4" />
                  Approve & Create Tasks
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
