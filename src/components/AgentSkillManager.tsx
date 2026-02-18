'use client';

import { useState } from 'react';
import { X, Plus, Trash2, Star } from 'lucide-react';
import { CodingAgent } from '@/types/agent';
import { AgentSkill, SkillCategory } from '@/types/agentSkill';

interface AgentSkillManagerProps {
  isOpen: boolean;
  onClose: () => void;
  agents: CodingAgent[];
  skills: AgentSkill[];
  onAddSkill: (skill: Omit<AgentSkill, 'id' | 'createdAt' | 'updatedAt'>) => Promise<void>;
  onDeleteSkill: (id: string) => Promise<void>;
}

const SKILL_CATEGORIES: { value: SkillCategory; label: string }[] = [
  { value: 'frontend', label: 'Frontend' },
  { value: 'backend', label: 'Backend' },
  { value: 'devops', label: 'DevOps' },
  { value: 'testing', label: 'Testing' },
  { value: 'mobile', label: 'Mobile' },
  { value: 'database', label: 'Database' },
  { value: 'ai', label: 'AI/ML' },
  { value: 'design', label: 'Design' },
  { value: 'other', label: 'Other' },
];

const COMMON_SKILLS: Record<SkillCategory, string[]> = {
  frontend: ['React', 'Vue', 'Angular', 'TypeScript', 'CSS', 'HTML', 'Tailwind'],
  backend: ['Node.js', 'Python', 'Java', 'Go', 'Rust', 'PHP', 'Ruby'],
  devops: ['Docker', 'Kubernetes', 'AWS', 'Azure', 'CI/CD', 'Terraform'],
  testing: ['Jest', 'Cypress', 'Playwright', 'Unit Testing', 'E2E Testing'],
  mobile: ['React Native', 'iOS', 'Android', 'Flutter', 'Swift', 'Kotlin'],
  database: ['PostgreSQL', 'MongoDB', 'MySQL', 'Redis', 'GraphQL', 'SQL'],
  ai: ['Machine Learning', 'TensorFlow', 'PyTorch', 'NLP', 'Computer Vision'],
  design: ['UI/UX', 'Figma', 'Sketch', 'Adobe XD', 'Prototyping'],
  other: ['Git', 'Agile', 'Documentation', 'Architecture'],
};

export const AgentSkillManager = ({ isOpen, onClose, agents, skills, onAddSkill, onDeleteSkill }: AgentSkillManagerProps) => {
  const [selectedAgent, setSelectedAgent] = useState<string>('');
  const [skillName, setSkillName] = useState('');
  const [skillCategory, setSkillCategory] = useState<SkillCategory>('frontend');
  const [proficiency, setProficiency] = useState<1 | 2 | 3 | 4 | 5>(3);
  const [isAdding, setIsAdding] = useState(false);

  if (!isOpen) return null;

  const handleAddSkill = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedAgent || !skillName.trim()) return;

    setIsAdding(true);
    try {
      await onAddSkill({
        agentId: selectedAgent,
        skillName: skillName.trim(),
        skillCategory,
        proficiencyLevel: proficiency,
      });
      setSkillName('');
      setProficiency(3);
    } catch (error) {
      console.error('Error adding skill:', error);
      alert('Failed to add skill. Please try again.');
    } finally {
      setIsAdding(false);
    }
  };

  const handleDeleteSkill = async (skillId: string) => {
    if (!confirm('Are you sure you want to delete this skill?')) return;

    try {
      await onDeleteSkill(skillId);
    } catch (error) {
      console.error('Error deleting skill:', error);
      alert('Failed to delete skill. Please try again.');
    }
  };

  const getAgentSkills = (agentId: string) => {
    return skills.filter(s => s.agentId === agentId);
  };

  const renderStars = (level: number) => {
    return (
      <div className="flex items-center gap-0.5">
        {[1, 2, 3, 4, 5].map(i => (
          <Star
            key={i}
            size={12}
            className={i <= level ? 'fill-yellow-400 text-yellow-400' : 'text-gray-300 dark:text-gray-600'}
          />
        ))}
      </div>
    );
  };

  const getCategoryColor = (category: SkillCategory) => {
    const colors: Record<SkillCategory, string> = {
      frontend: 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300',
      backend: 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-300',
      devops: 'bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-300',
      testing: 'bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-300',
      mobile: 'bg-pink-100 text-pink-700 dark:bg-pink-900/30 dark:text-pink-300',
      database: 'bg-indigo-100 text-indigo-700 dark:bg-indigo-900/30 dark:text-indigo-300',
      ai: 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-300',
      design: 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-300',
      other: 'bg-gray-100 text-gray-700 dark:bg-gray-700 dark:text-gray-300',
    };
    return colors[category];
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4" onClick={onClose}>
      <div className="bg-white dark:bg-gray-800 rounded-xl w-full max-w-4xl max-h-[90vh] shadow-xl flex flex-col" onClick={(e) => e.stopPropagation()}>
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200 dark:border-gray-700">
          <h2 className="text-xl font-bold text-gray-900 dark:text-white">Agent Skill Management</h2>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300">
            <X size={24} />
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Add Skill Form */}
            <div className="bg-gray-50 dark:bg-gray-900/50 rounded-lg p-4">
              <h3 className="font-semibold text-gray-900 dark:text-white mb-4">Add New Skill</h3>
              <form onSubmit={handleAddSkill} className="space-y-4">
                <div>
                  <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">Agent</label>
                  <select
                    value={selectedAgent}
                    onChange={(e) => setSelectedAgent(e.target.value)}
                    className="w-full border border-gray-200 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white p-2 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    required
                  >
                    <option value="">Select an agent...</option>
                    {agents.map(agent => (
                      <option key={agent.id} value={agent.id}>{agent.name}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">Category</label>
                  <select
                    value={skillCategory}
                    onChange={(e) => setSkillCategory(e.target.value as SkillCategory)}
                    className="w-full border border-gray-200 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white p-2 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    {SKILL_CATEGORIES.map(cat => (
                      <option key={cat.value} value={cat.value}>{cat.label}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">Skill Name</label>
                  <input
                    type="text"
                    value={skillName}
                    onChange={(e) => setSkillName(e.target.value)}
                    placeholder="e.g., React, TypeScript, Docker"
                    className="w-full border border-gray-200 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white p-2 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    required
                  />
                  <div className="mt-2 flex flex-wrap gap-1">
                    {COMMON_SKILLS[skillCategory].map(skill => (
                      <button
                        key={skill}
                        type="button"
                        onClick={() => setSkillName(skill)}
                        className="text-xs px-2 py-1 bg-white dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded hover:bg-gray-50 dark:hover:bg-gray-600 text-gray-700 dark:text-gray-300"
                      >
                        {skill}
                      </button>
                    ))}
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Proficiency Level: {proficiency}/5
                  </label>
                  <input
                    type="range"
                    min="1"
                    max="5"
                    value={proficiency}
                    onChange={(e) => setProficiency(Number(e.target.value) as 1 | 2 | 3 | 4 | 5)}
                    className="w-full"
                  />
                  <div className="flex justify-between text-xs text-gray-500 dark:text-gray-400 mt-1">
                    <span>Beginner</span>
                    <span>Expert</span>
                  </div>
                  <div className="flex justify-center mt-2">
                    {renderStars(proficiency)}
                  </div>
                </div>

                <button
                  type="submit"
                  className="w-full flex items-center justify-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors disabled:opacity-50"
                  disabled={isAdding || !selectedAgent || !skillName.trim()}
                >
                  <Plus size={16} />
                  {isAdding ? 'Adding...' : 'Add Skill'}
                </button>
              </form>
            </div>

            {/* Agent Skills List */}
            <div className="space-y-4">
              <h3 className="font-semibold text-gray-900 dark:text-white">Current Skills</h3>
              {agents.map(agent => {
                const agentSkills = getAgentSkills(agent.id);
                if (agentSkills.length === 0) return null;

                return (
                  <div key={agent.id} className="border border-gray-200 dark:border-gray-700 rounded-lg p-4">
                    <h4 className="font-medium text-gray-900 dark:text-white mb-3">{agent.name}</h4>
                    <div className="space-y-2">
                      {agentSkills.map(skill => (
                        <div key={skill.id} className="flex items-center justify-between p-2 bg-gray-50 dark:bg-gray-900/50 rounded">
                          <div className="flex items-center gap-2">
                            <span className={`text-xs px-2 py-0.5 rounded ${getCategoryColor(skill.skillCategory)}`}>
                              {skill.skillCategory}
                            </span>
                            <span className="text-sm text-gray-900 dark:text-white">{skill.skillName}</span>
                          </div>
                          <div className="flex items-center gap-2">
                            {renderStars(skill.proficiencyLevel)}
                            <button
                              onClick={() => handleDeleteSkill(skill.id)}
                              className="text-red-500 hover:text-red-700 dark:hover:text-red-400 p-1"
                              title="Delete skill"
                            >
                              <Trash2 size={14} />
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                );
              })}
              {agents.every(agent => getAgentSkills(agent.id).length === 0) && (
                <div className="text-center py-8 text-gray-400 dark:text-gray-500 text-sm">
                  No skills added yet. Add skills to enable smart auto-assignment.
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
