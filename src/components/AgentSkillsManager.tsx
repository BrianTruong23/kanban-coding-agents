'use client';

import { useState } from 'react';
import { CodingAgent, AgentSkill, SkillCategory } from '@/types/agent';
import { Plus, X, Edit2, Trash2, Star } from 'lucide-react';

interface AgentSkillsManagerProps {
  agent: CodingAgent;
  skills: AgentSkill[];
  onAddSkill: (skill: Omit<AgentSkill, 'id' | 'createdAt' | 'updatedAt'>) => Promise<void>;
  onUpdateSkill: (skillId: string, updates: Partial<AgentSkill>) => Promise<void>;
  onDeleteSkill: (skillId: string) => Promise<void>;
}

const SKILL_CATEGORIES: { value: SkillCategory; label: string }[] = [
  { value: 'frontend', label: 'Frontend' },
  { value: 'backend', label: 'Backend' },
  { value: 'database', label: 'Database' },
  { value: 'devops', label: 'DevOps' },
  { value: 'mobile', label: 'Mobile' },
  { value: 'testing', label: 'Testing' },
  { value: 'design', label: 'Design' },
  { value: 'other', label: 'Other' },
];

export const AgentSkillsManager = ({
  agent,
  skills,
  onAddSkill,
  onUpdateSkill,
  onDeleteSkill,
}: AgentSkillsManagerProps) => {
  const [isAdding, setIsAdding] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [newSkill, setNewSkill] = useState({
    skillName: '',
    skillCategory: 'other' as SkillCategory,
    proficiencyLevel: 3 as 1 | 2 | 3 | 4 | 5,
    yearsExperience: undefined as number | undefined,
  });

  const handleAdd = async () => {
    if (!newSkill.skillName.trim()) return;

    try {
      await onAddSkill({
        agentId: agent.id,
        skillName: newSkill.skillName.trim(),
        skillCategory: newSkill.skillCategory,
        proficiencyLevel: newSkill.proficiencyLevel,
        yearsExperience: newSkill.yearsExperience,
      });

      setNewSkill({
        skillName: '',
        skillCategory: 'other',
        proficiencyLevel: 3,
        yearsExperience: undefined,
      });
      setIsAdding(false);
    } catch (err) {
      console.error('Failed to add skill:', err);
    }
  };

  const handleDelete = async (skillId: string) => {
    if (confirm('Are you sure you want to delete this skill?')) {
      try {
        await onDeleteSkill(skillId);
      } catch (err) {
        console.error('Failed to delete skill:', err);
      }
    }
  };

  const renderProficiency = (level: number) => {
    return (
      <div className="flex items-center gap-0.5">
        {[1, 2, 3, 4, 5].map(i => (
          <Star
            key={i}
            size={14}
            className={i <= level ? 'fill-yellow-400 text-yellow-400' : 'text-gray-300 dark:text-gray-600'}
          />
        ))}
      </div>
    );
  };

  const getCategoryColor = (category: SkillCategory) => {
    const colors: Record<SkillCategory, string> = {
      frontend: 'bg-blue-100 dark:bg-blue-900 text-blue-700 dark:text-blue-300',
      backend: 'bg-green-100 dark:bg-green-900 text-green-700 dark:text-green-300',
      database: 'bg-purple-100 dark:bg-purple-900 text-purple-700 dark:text-purple-300',
      devops: 'bg-orange-100 dark:bg-orange-900 text-orange-700 dark:text-orange-300',
      mobile: 'bg-pink-100 dark:bg-pink-900 text-pink-700 dark:text-pink-300',
      testing: 'bg-yellow-100 dark:bg-yellow-900 text-yellow-700 dark:text-yellow-300',
      design: 'bg-indigo-100 dark:bg-indigo-900 text-indigo-700 dark:text-indigo-300',
      other: 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300',
    };
    return colors[category];
  };

  // Group skills by category
  const skillsByCategory = skills.reduce((acc, skill) => {
    if (!acc[skill.skillCategory]) {
      acc[skill.skillCategory] = [];
    }
    acc[skill.skillCategory].push(skill);
    return acc;
  }, {} as Record<SkillCategory, AgentSkill[]>);

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
          Skills for {agent.name}
        </h3>
        <button
          onClick={() => setIsAdding(true)}
          className="flex items-center gap-2 px-3 py-1.5 bg-black dark:bg-white text-white dark:text-black rounded-lg text-sm font-medium hover:bg-gray-800 dark:hover:bg-gray-200 transition-colors"
        >
          <Plus size={16} />
          Add Skill
        </button>
      </div>

      {/* Add Skill Form */}
      {isAdding && (
        <div className="bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg p-4">
          <div className="grid grid-cols-2 gap-3 mb-3">
            <div>
              <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">
                Skill Name
              </label>
              <input
                type="text"
                value={newSkill.skillName}
                onChange={e => setNewSkill({ ...newSkill, skillName: e.target.value })}
                placeholder="e.g., React, Node.js"
                className="w-full border border-gray-200 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white p-2 rounded text-sm focus:outline-none focus:ring-2 focus:ring-black/10 dark:focus:ring-white/20"
                autoFocus
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">
                Category
              </label>
              <select
                value={newSkill.skillCategory}
                onChange={e => setNewSkill({ ...newSkill, skillCategory: e.target.value as SkillCategory })}
                className="w-full border border-gray-200 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white p-2 rounded text-sm focus:outline-none focus:ring-2 focus:ring-black/10 dark:focus:ring-white/20"
              >
                {SKILL_CATEGORIES.map(cat => (
                  <option key={cat.value} value={cat.value}>
                    {cat.label}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">
                Proficiency (1-5)
              </label>
              <select
                value={newSkill.proficiencyLevel}
                onChange={e => setNewSkill({ ...newSkill, proficiencyLevel: Number(e.target.value) as 1 | 2 | 3 | 4 | 5 })}
                className="w-full border border-gray-200 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white p-2 rounded text-sm focus:outline-none focus:ring-2 focus:ring-black/10 dark:focus:ring-white/20"
              >
                {[1, 2, 3, 4, 5].map(level => (
                  <option key={level} value={level}>
                    {level} - {['Beginner', 'Intermediate', 'Proficient', 'Advanced', 'Expert'][level - 1]}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">
                Years Experience (optional)
              </label>
              <input
                type="number"
                min="0"
                step="0.5"
                value={newSkill.yearsExperience || ''}
                onChange={e => setNewSkill({ ...newSkill, yearsExperience: e.target.value ? parseFloat(e.target.value) : undefined })}
                placeholder="e.g., 2.5"
                className="w-full border border-gray-200 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white p-2 rounded text-sm focus:outline-none focus:ring-2 focus:ring-black/10 dark:focus:ring-white/20"
              />
            </div>
          </div>
          <div className="flex justify-end gap-2">
            <button
              onClick={() => {
                setIsAdding(false);
                setNewSkill({
                  skillName: '',
                  skillCategory: 'other',
                  proficiencyLevel: 3,
                  yearsExperience: undefined,
                });
              }}
              className="px-3 py-1.5 text-sm text-gray-600 dark:text-gray-400 hover:text-gray-800 dark:hover:text-gray-200"
            >
              Cancel
            </button>
            <button
              onClick={handleAdd}
              disabled={!newSkill.skillName.trim()}
              className="px-3 py-1.5 bg-black dark:bg-white text-white dark:text-black rounded text-sm font-medium hover:bg-gray-800 dark:hover:bg-gray-200 disabled:opacity-50"
            >
              Add
            </button>
          </div>
        </div>
      )}

      {/* Skills List */}
      {skills.length === 0 ? (
        <div className="text-center py-8 text-gray-400 dark:text-gray-500 text-sm">
          No skills added yet. Click &quot;Add Skill&quot; to get started.
        </div>
      ) : (
        <div className="space-y-4">
          {SKILL_CATEGORIES.map(({ value: category, label }) => {
            const categorySkills = skillsByCategory[category] || [];
            if (categorySkills.length === 0) return null;

            return (
              <div key={category}>
                <h4 className={`text-xs font-semibold uppercase tracking-wide mb-2 ${getCategoryColor(category)} inline-block px-2 py-1 rounded`}>
                  {label}
                </h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                  {categorySkills.map(skill => (
                    <div
                      key={skill.id}
                      className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg p-3 flex items-center justify-between"
                    >
                      <div className="flex-1">
                        <div className="font-medium text-gray-900 dark:text-white text-sm">
                          {skill.skillName}
                        </div>
                        <div className="flex items-center gap-2 mt-1">
                          {renderProficiency(skill.proficiencyLevel)}
                          {skill.yearsExperience && (
                            <span className="text-xs text-gray-500 dark:text-gray-400">
                              {skill.yearsExperience} years
                            </span>
                          )}
                        </div>
                      </div>
                      <button
                        onClick={() => handleDelete(skill.id)}
                        className="text-gray-400 hover:text-red-600 dark:hover:text-red-400 p-1"
                      >
                        <Trash2 size={16} />
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};
