'use client';

import { useState } from 'react';
import { Users, Plus, X, TrendingUp, Clock, Award, Edit2, Save } from 'lucide-react';
import { AgentWithSkills } from '@/types/agent-skills';
import { Task } from '@/types/task';

interface AgentRosterPanelProps {
  agents: AgentWithSkills[];
  tasks: Task[];
  onUpdateSkills: (agentId: string, skills: { skillName: string; skillLevel: number }[]) => void;
}

function SkillBadge({
  skillName,
  skillLevel,
  editable,
  onUpdate,
  onRemove,
}: {
  skillName: string;
  skillLevel: number;
  editable: boolean;
  onUpdate?: (level: number) => void;
  onRemove?: () => void;
}) {
  const levelColors = {
    1: 'bg-gray-100 text-gray-700 border-gray-300',
    2: 'bg-blue-100 text-blue-700 border-blue-300',
    3: 'bg-green-100 text-green-700 border-green-300',
    4: 'bg-orange-100 text-orange-700 border-orange-300',
    5: 'bg-purple-100 text-purple-700 border-purple-300',
  };

  const levelLabels = {
    1: 'Beginner',
    2: 'Intermediate',
    3: 'Advanced',
    4: 'Expert',
    5: 'Master',
  };

  return (
    <div
      className={`inline-flex items-center gap-1 px-2 py-1 rounded-md text-xs font-medium border ${levelColors[skillLevel as keyof typeof levelColors]}`}
    >
      <span>{skillName}</span>
      {editable && onUpdate ? (
        <select
          value={skillLevel}
          onChange={(e) => onUpdate(parseInt(e.target.value))}
          className="bg-transparent border-none text-xs font-bold focus:outline-none cursor-pointer"
          onClick={(e) => e.stopPropagation()}
        >
          {[1, 2, 3, 4, 5].map((level) => (
            <option key={level} value={level}>
              {level}
            </option>
          ))}
        </select>
      ) : (
        <span className="font-bold">{skillLevel}</span>
      )}
      <span className="text-[10px] opacity-75">{levelLabels[skillLevel as keyof typeof levelLabels]}</span>
      {editable && onRemove && (
        <button
          onClick={(e) => {
            e.stopPropagation();
            onRemove();
          }}
          className="ml-1 hover:text-red-600"
        >
          <X className="w-3 h-3" />
        </button>
      )}
    </div>
  );
}

function AgentCard({
  agent,
  tasks,
  isEditing,
  onStartEdit,
  onSaveEdit,
  editingSkills,
  onSkillUpdate,
  onSkillRemove,
  onSkillAdd,
}: {
  agent: AgentWithSkills;
  tasks: Task[];
  isEditing: boolean;
  onStartEdit: () => void;
  onSaveEdit: () => void;
  editingSkills: { skillName: string; skillLevel: number }[];
  onSkillUpdate: (index: number, level: number) => void;
  onSkillRemove: (index: number) => void;
  onSkillAdd: (skillName: string) => void;
}) {
  const [newSkillName, setNewSkillName] = useState('');
  const assignedTasks = tasks.filter((t) => t.assignedAgentId === agent.id);
  const activeTasks = assignedTasks.filter((t) => t.status === 'in-progress');
  const completedTasks = assignedTasks.filter((t) => t.status === 'done');

  const metrics = agent.performanceMetrics;

  const handleAddSkill = () => {
    if (newSkillName.trim()) {
      onSkillAdd(newSkillName.trim());
      setNewSkillName('');
    }
  };

  return (
    <div className="bg-white border border-gray-200 rounded-lg p-4 hover:shadow-lg transition-shadow">
      {/* Header */}
      <div className="flex items-start justify-between mb-3">
        <div className="flex items-center gap-3">
          <div className={`w-12 h-12 rounded-full ${agent.avatarColor || 'bg-gray-400'} flex items-center justify-center text-white font-bold text-lg`}>
            {agent.name.charAt(0)}
          </div>
          <div>
            <h3 className="font-semibold text-gray-900">{agent.name}</h3>
            <p className="text-sm text-gray-600">{agent.description}</p>
          </div>
        </div>
        <button
          onClick={isEditing ? onSaveEdit : onStartEdit}
          className={`p-2 rounded-lg transition-colors ${
            isEditing
              ? 'bg-green-100 text-green-600 hover:bg-green-200'
              : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
          }`}
        >
          {isEditing ? <Save className="w-4 h-4" /> : <Edit2 className="w-4 h-4" />}
        </button>
      </div>

      {/* Skills */}
      <div className="mb-4">
        <div className="text-xs font-medium text-gray-700 mb-2">Skills:</div>
        <div className="flex flex-wrap gap-2">
          {isEditing
            ? editingSkills.map((skill, index) => (
                <SkillBadge
                  key={`${skill.skillName}-${index}`}
                  skillName={skill.skillName}
                  skillLevel={skill.skillLevel}
                  editable={true}
                  onUpdate={(level) => onSkillUpdate(index, level)}
                  onRemove={() => onSkillRemove(index)}
                />
              ))
            : agent.skills.map((skill) => (
                <SkillBadge
                  key={skill.id}
                  skillName={skill.skillName}
                  skillLevel={skill.skillLevel}
                  editable={false}
                />
              ))}
        </div>
        {isEditing && (
          <div className="flex gap-2 mt-2">
            <input
              type="text"
              value={newSkillName}
              onChange={(e) => setNewSkillName(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleAddSkill()}
              placeholder="Add skill..."
              className="flex-1 px-2 py-1 text-sm border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
            <button
              onClick={handleAddSkill}
              className="px-3 py-1 bg-blue-600 text-white rounded text-sm hover:bg-blue-700"
            >
              <Plus className="w-4 h-4" />
            </button>
          </div>
        )}
      </div>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-3 mb-3">
        <div className="text-center p-2 bg-blue-50 rounded">
          <div className="text-xs text-gray-600">Active</div>
          <div className="text-lg font-bold text-blue-600">{activeTasks.length}</div>
        </div>
        <div className="text-center p-2 bg-green-50 rounded">
          <div className="text-xs text-gray-600">Done</div>
          <div className="text-lg font-bold text-green-600">{completedTasks.length}</div>
        </div>
        <div className="text-center p-2 bg-purple-50 rounded">
          <div className="text-xs text-gray-600">Total</div>
          <div className="text-lg font-bold text-purple-600">{assignedTasks.length}</div>
        </div>
      </div>

      {/* Performance Metrics */}
      {metrics && (
        <div className="pt-3 border-t border-gray-200">
          <div className="text-xs font-medium text-gray-700 mb-2">Performance:</div>
          <div className="space-y-2">
            <div className="flex items-center gap-2 text-xs">
              <Award className="w-4 h-4 text-yellow-500" />
              <span className="text-gray-600">Quality:</span>
              <span className="font-medium">{metrics.averageQualityScore.toFixed(1)}/5</span>
            </div>
            <div className="flex items-center gap-2 text-xs">
              <Clock className="w-4 h-4 text-blue-500" />
              <span className="text-gray-600">Avg Time:</span>
              <span className="font-medium">{metrics.averageCompletionTime.toFixed(1)}h</span>
            </div>
            <div className="flex items-center gap-2 text-xs">
              <TrendingUp className="w-4 h-4 text-green-500" />
              <span className="text-gray-600">On-time:</span>
              <span className="font-medium">{metrics.onTimePercentage.toFixed(0)}%</span>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export function AgentRosterPanel({ agents, tasks, onUpdateSkills }: AgentRosterPanelProps) {
  const [editingAgentId, setEditingAgentId] = useState<string | null>(null);
  const [editingSkills, setEditingSkills] = useState<{ skillName: string; skillLevel: number }[]>(
    []
  );

  const handleStartEdit = (agent: AgentWithSkills) => {
    setEditingAgentId(agent.id);
    setEditingSkills(
      agent.skills.map((s) => ({ skillName: s.skillName, skillLevel: s.skillLevel }))
    );
  };

  const handleSaveEdit = () => {
    if (editingAgentId) {
      onUpdateSkills(editingAgentId, editingSkills);
      setEditingAgentId(null);
      setEditingSkills([]);
    }
  };

  const handleSkillUpdate = (index: number, level: number) => {
    const updated = [...editingSkills];
    updated[index].skillLevel = level;
    setEditingSkills(updated);
  };

  const handleSkillRemove = (index: number) => {
    setEditingSkills(editingSkills.filter((_, i) => i !== index));
  };

  const handleSkillAdd = (skillName: string) => {
    setEditingSkills([...editingSkills, { skillName, skillLevel: 3 }]);
  };

  return (
    <div className="bg-gray-50 border-l border-gray-200 w-96 overflow-y-auto">
      <div className="sticky top-0 bg-white border-b border-gray-200 p-4 z-10">
        <div className="flex items-center gap-2 mb-2">
          <Users className="w-5 h-5 text-gray-700" />
          <h2 className="text-lg font-bold text-gray-900">Agent Roster</h2>
        </div>
        <p className="text-sm text-gray-600">
          Manage agent skills and view performance metrics
        </p>
      </div>

      <div className="p-4 space-y-4">
        {agents.map((agent) => (
          <AgentCard
            key={agent.id}
            agent={agent}
            tasks={tasks}
            isEditing={editingAgentId === agent.id}
            onStartEdit={() => handleStartEdit(agent)}
            onSaveEdit={handleSaveEdit}
            editingSkills={editingSkills}
            onSkillUpdate={handleSkillUpdate}
            onSkillRemove={handleSkillRemove}
            onSkillAdd={handleSkillAdd}
          />
        ))}
      </div>
    </div>
  );
}
