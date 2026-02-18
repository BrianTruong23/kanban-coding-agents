'use client';

import { useState } from 'react';
import { Sparkles, Network, Users, Settings } from 'lucide-react';
import { TaskBreakdownModal } from './TaskBreakdownModal';
import { BreakdownResultsModal } from './BreakdownResultsModal';
import { DependencyGraph } from './DependencyGraph';
import { BreakdownResult } from '@/types/breakdown';
import { Task } from '@/types/task';
import { Subtask } from '@/types/subtask';
import { CodingAgent } from '@/types/agent';
import { AgentSkill, AgentWorkload } from '@/types/agentSkill';
import { autoAssignMultipleTasks, extractSkillsFromTask } from '@/lib/autoAssignment';
import { generateId, generateTaskId } from '@/lib/utils';

interface TaskOrchestratorProps {
  tasks: Task[];
  agents: CodingAgent[];
  agentSkills: AgentSkill[];
  onAddTask: (task: Task) => Promise<void>;
  onUpdateTask: (task: Task) => void;
}

export const TaskOrchestrator = ({ tasks, agents, agentSkills, onAddTask, onUpdateTask }: TaskOrchestratorProps) => {
  const [showBreakdown, setShowBreakdown] = useState(false);
  const [showResults, setShowResults] = useState(false);
  const [showDependencies, setShowDependencies] = useState(false);
  const [breakdownResult, setBreakdownResult] = useState<BreakdownResult | null>(null);

  const handleBreakdownComplete = (result: BreakdownResult) => {
    setBreakdownResult(result);
    setShowBreakdown(false);
    setShowResults(true);
  };

  const handleImportBreakdown = async (result: BreakdownResult) => {
    try {
      const newTasks: Task[] = [];
      let taskCounter = tasks.length;

      // Import standalone tasks
      for (const breakdownTask of result.standaloneTasks) {
        taskCounter++;
        const task: Task = {
          id: generateId(),
          taskId: generateTaskId(taskCounter),
          title: breakdownTask.title,
          description: breakdownTask.description,
          status: 'backlog',
          priority: breakdownTask.priority,
          tags: breakdownTask.tags,
          definitionOfDone: breakdownTask.definitionOfDone,
          testNotes: breakdownTask.testNotes,
          riskLevel: breakdownTask.riskLevel,
          riskDescription: breakdownTask.riskDescription,
          sprint: result.suggestedSprint,
          commentsCount: 0,
          attachmentsCount: 0,
          createdAt: Date.now(),
          updatedAt: Date.now(),
        };
        newTasks.push(task);
        await onAddTask(task);
      }

      // Import epics and their tasks
      for (const epic of result.epics) {
        for (const breakdownTask of epic.tasks) {
          taskCounter++;
          const task: Task = {
            id: generateId(),
            taskId: generateTaskId(taskCounter),
            title: breakdownTask.title,
            description: breakdownTask.description,
            status: 'backlog',
            priority: breakdownTask.priority,
            tags: [...breakdownTask.tags, ...epic.tags],
            definitionOfDone: breakdownTask.definitionOfDone,
            testNotes: breakdownTask.testNotes,
            riskLevel: breakdownTask.riskLevel,
            riskDescription: breakdownTask.riskDescription,
            sprint: result.suggestedSprint,
            commentsCount: 0,
            attachmentsCount: 0,
            createdAt: Date.now(),
            updatedAt: Date.now(),
          };
          newTasks.push(task);
          await onAddTask(task);
        }
      }

      // Auto-assign tasks if agents are available
      if (agents.length > 0) {
        await autoAssignImportedTasks(newTasks);
      }

      alert(`Successfully imported ${newTasks.length} tasks!`);
    } catch (error) {
      console.error('Error importing breakdown:', error);
      throw error;
    }
  };

  const autoAssignImportedTasks = async (newTasks: Task[]) => {
    try {
      // Calculate agent workloads
      const workloads = new Map<string, AgentWorkload>();
      agents.forEach(agent => {
        const agentTasks = tasks.filter(t => t.assignedAgentId === agent.id);
        const inProgressTasks = agentTasks.filter(t => t.status === 'in-progress');

        workloads.set(agent.id, {
          totalTasks: agentTasks.length,
          inProgressTasks: inProgressTasks.length,
          avgQualityScore: 4, // Default quality score
        });
      });

      // Extract required skills from tasks
      const taskSkills = new Map<string, string[]>();
      newTasks.forEach(task => {
        taskSkills.set(task.id, extractSkillsFromTask(task));
      });

      // Auto-assign
      const assignments = autoAssignMultipleTasks(
        newTasks,
        agents,
        agentSkills,
        workloads,
        taskSkills
      );

      // Apply assignments
      assignments.forEach((agentId, taskId) => {
        const task = newTasks.find(t => t.id === taskId);
        if (task) {
          onUpdateTask({ ...task, assignedAgentId: agentId });
        }
      });

      console.log(`Auto-assigned ${assignments.size} tasks`);
    } catch (error) {
      console.error('Error auto-assigning tasks:', error);
      // Don't fail the import if auto-assignment fails
    }
  };

  return (
    <div className="flex items-center gap-2">
      {/* AI Breakdown Button */}
      <button
        onClick={() => setShowBreakdown(true)}
        className="flex items-center gap-2 px-3 py-1.5 bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-700 hover:to-indigo-700 text-white rounded-lg text-sm font-medium transition-all shadow-md hover:shadow-lg"
        title="AI-powered task breakdown"
      >
        <Sparkles size={16} />
        <span className="hidden sm:inline">AI Breakdown</span>
      </button>

      {/* Dependencies Button */}
      <button
        onClick={() => setShowDependencies(true)}
        className="flex items-center gap-2 px-3 py-1.5 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-sm font-medium transition-colors"
        title="View task dependencies"
      >
        <Network size={16} />
        <span className="hidden sm:inline">Dependencies</span>
      </button>

      {/* Modals */}
      <TaskBreakdownModal
        isOpen={showBreakdown}
        onClose={() => setShowBreakdown(false)}
        onBreakdownComplete={handleBreakdownComplete}
      />

      {breakdownResult && (
        <BreakdownResultsModal
          result={breakdownResult}
          onClose={() => {
            setShowResults(false);
            setBreakdownResult(null);
          }}
          onImport={handleImportBreakdown}
        />
      )}

      {showDependencies && (
        <DependencyGraph
          tasks={tasks}
          subtasks={[]}
          dependencies={new Map()}
          onClose={() => setShowDependencies(false)}
        />
      )}
    </div>
  );
};
