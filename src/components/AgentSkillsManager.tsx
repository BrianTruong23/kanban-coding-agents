'use client';

import { useState } from 'react';
import { CodingAgent } from '@/types/agent';
import { AgentSkill, SkillCategory } from '@/types/agent-skills';
import { Plus, X, Star, TrendingUp } from 'lucide-react';

interface AgentSkillsManagerProps {
  agent: CodingAgent;
  skills: AgentSkill[];
  onAddSkill: (skill: Omit<AgentSkill, 'id' | 'createdAt' | 'updatedAt'>) => void;
  onRemoveSkill: (skillId: string) => void;
  onUpdateSkill: (skill: AgentSkill) => void;
}

const SKILL_CATEGORIES: SkillCategory[] = [
  'frontend',
  'backend',
  'database',
  'devops',
  'testing',
  'design',
  'mobile',
  'ai-ml',
  'security',
];

const COMMON_SKILLS: Record<SkillCategory, string[]> = {
  frontend: ['React', 'Vue', 'Angular', 'TypeScript', 'CSS', 'HTML', 'Next.js', 'Tailwind CSS'],
  backend: ['Node.js', 'Python', 'Java', 'Go', 'Ruby', 'PHP', 'Express', 'Django', 'Spring Boot'],
  database: ['PostgreSQL', 'MySQL', 'MongoDB', 'Redis', 'SQL', 'Database Design', 'Query Optimization'],
  devops: ['Docker', 'Kubernetes', 'CI/CD', 'AWS', 'Azure', 'GCP', 'Terraform', 'Jenkins'],
  testing: ['Jest', 'Cypress', 'Selenium', 'Unit Testing', 'Integration Testing', 'E2E Testing'],
  design: ['UI/UX', 'Figma', 'Sketch', 'Adobe XD', 'Prototyping', 'User Research'],
  mobile: ['React Native', 'Flutter', 'iOS', 'Android', 'Swift', 'Kotlin'],
  'ai-ml': ['Machine Learning', 'TensorFlow', 'PyTorch', 'NLP', 'Computer Vision', 'LLMs'],
  security: ['Authentication', 'Authorization', 'OWASP', 'Penetration Testing', 'Security Audits'],
};

export const AgentSkillsManager = ({
  agent,
  skills,
  onAddSkill,
  onRemoveSkill,
  onUpdateSkill,
}: AgentSkillsManagerProps) => {
  const [isAdding, setIsAdding] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState<SkillCategory>('frontend');
  const [skillName, setSkillName] = useState('');
  const [proficiency, setProficiency] = useState<1 | 2 | 3 | 4 | 5>(3);
  const [yearsOfExperience, setYearsOfExperience] = useState<number>(0);

  const handleAddSkill = () => {
    if (!skillName.trim()) return;

    onAddSkill({
      agentId: agent.id,
      category: selectedCategory,
      name: skillName.trim(),
      proficiency,
      yearsOfExperience: yearsOfExperience > 0 ? yearsOfExperience : undefined,
    });

    // Reset form
    setSkillName('');
    setProficiency(3);
    setYearsOfExperience(0);
    setIsAdding(false);
  };

  const handleQuickAdd = (category: SkillCategory, name: string) => {
    onAddSkill({
      agentId: agent.id,
      category,
      name,
      proficiency: 3,
    });
  };

  const getProficiencyLabel = (level: number): string => {
    switch (level) {
      case 1: return 'Beginner';
      case 2: return 'Intermediate';
      case 3: return 'Proficient';
      case 4: return 'Advanced';
      case 5: return 'Expert';
      default: return 'Unknown';
    }
  };

  const getCategoryColor = (category: SkillCategory): string => {
    const colors: Record<SkillCategory, string> = {
      frontend: 'bg-blue-100 dark:bg-blue-900 text-blue-800 dark:text-blue-200',
      backend: 'bg-green-100 dark:bg-green-900 text-green-800 dark:text-green-200',
      database: 'bg-purple-100 dark:bg-purple-900 text-purple-800 dark:text-purple-200',
      devops: 'bg-orange-100 dark:bg-orange-900 text-orange-800 dark:text-orange-200',
      testing: 'bg-pink-100 dark:bg-pink-900 text-pink-800 dark:text-pink-200',
      design: 'bg-indigo-100 dark:bg-indigo-900 text-indigo-800 dark:text-indigo-200',
      mobile: 'bg-cyan-100 dark:bg-cyan-900 text-cyan-800 dark:text-cyan-200',
      'ai-ml': 'bg-violet-100 dark:bg-violet-900 text-violet-800 dark:text-violet-200',
      security: 'bg-red-100 dark:bg-red-900 text-red-800 dark:text-red-200',
    };
    return colors[category];
  };

  const skillsByCategory = skills.reduce((acc, skill) => {
    if (!acc[skill.category]) acc[skill.category] = [];
    acc[skill.category].push(skill);
    return acc;
  }, {} as Record<SkillCategory, AgentSkill[]>);

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-semibold flex items-center gap-2">
            <Star className="w-5 h-5 text-yellow-500" />
            Skills & Expertise
          </h3>
          <p className="text-sm text-gray-600 dark:text-gray-400">
            Manage {agent.name}'s skills for better task assignment
          </p>
        </div>
        <button
          onClick={() => setIsAdding(!isAdding)}
          className="px-3 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 flex items-center gap-2"
        >
          <Plus className="w-4 h-4" />
          Add Skill
        </button>
      </div>

      {/* Add Skill Form */}
      {isAdding && (
        <div className="p-4 border dark:border-gray-700 rounded-lg bg-gray-50 dark:bg-gray-750 space-y-3">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-sm font-medium mb-1">Category</label>
              <select
                value={selectedCategory}
                onChange={(e) => setSelectedCategory(e.target.value as SkillCategory)}
                className="w-full px-3 py-2 border dark:border-gray-600 rounded bg-white dark:bg-gray-900"
              >
                {SKILL_CATEGORIES.map((cat) => (
                  <option key={cat} value={cat}>
                    {cat.charAt(0).toUpperCase() + cat.slice(1).replace('-', ' ')}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium mb-1">Skill Name</label>
              <input
                type="text"
                value={skillName}
                onChange={(e) => setSkillName(e.target.value)}
                className="w-full px-3 py-2 border dark:border-gray-600 rounded bg-white dark:bg-gray-900"
                placeholder="e.g., React, Node.js"
                list="common-skills"
              />
              <datalist id="common-skills">
                {COMMON_SKILLS[selectedCategory].map((skill) => (
                  <option key={skill} value={skill} />
                ))}
              </datalist>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-sm font-medium mb-1">
                Proficiency Level ({getProficiencyLabel(proficiency)})
              </label>
              <input
                type="range"
                min="1"
                max="5"
                value={proficiency}
                onChange={(e) => setProficiency(parseInt(e.target.value) as 1 | 2 | 3 | 4 | 5)}
                className="w-full"
              />
              <div className="flex justify-between text-xs text-gray-500 mt-1">
                <span>Beginner</span>
                <span>Expert</span>
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium mb-1">Years of Experience</label>
              <input
                type="number"
                min="0"
                max="50"
                value={yearsOfExperience}
                onChange={(e) => setYearsOfExperience(parseInt(e.target.value) || 0)}
                className="w-full px-3 py-2 border dark:border-gray-600 rounded bg-white dark:bg-gray-900"
                placeholder="Optional"
              />
            </div>
          </div>

          <div className="flex gap-2">
            <button
              onClick={handleAddSkill}
              className="flex-1 px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
            >
              Add Skill
            </button>
            <button
              onClick={() => setIsAdding(false)}
              className="px-4 py-2 bg-gray-300 dark:bg-gray-700 rounded hover:bg-gray-400 dark:hover:bg-gray-600"
            >
              Cancel
            </button>
          </div>

          {/* Quick Add Suggestions */}
          <div>
            <p className="text-xs text-gray-600 dark:text-gray-400 mb-2">Quick add common skills:</p>
            <div className="flex flex-wrap gap-1">
              {COMMON_SKILLS[selectedCategory]
                .filter(skill => !skills.some(s => s.name === skill && s.category === selectedCategory))
                .slice(0, 5)
                .map((skill) => (
                  <button
                    key={skill}
                    onClick={() => handleQuickAdd(selectedCategory, skill)}
                    className="text-xs px-2 py-1 bg-gray-200 dark:bg-gray-700 rounded hover:bg-gray-300 dark:hover:bg-gray-600"
                  >
                    + {skill}
                  </button>
                ))}
            </div>
          </div>
        </div>
      )}

      {/* Skills Display by Category */}
      <div className="space-y-3">
        {SKILL_CATEGORIES.map((category) => {
          const categorySkills = skillsByCategory[category] || [];
          if (categorySkills.length === 0) return null;

          return (
            <div key={category} className="border dark:border-gray-700 rounded-lg p-3">
              <h4 className="text-sm font-semibold mb-2 capitalize">
                {category.replace('-', ' ')}
              </h4>
              <div className="flex flex-wrap gap-2">
                {categorySkills.map((skill) => (
                  <div
                    key={skill.id}
                    className={`px-3 py-1.5 rounded-lg flex items-center gap-2 ${getCategoryColor(category)}`}
                  >
                    <span className="text-sm font-medium">{skill.name}</span>
                    <div className="flex items-center gap-1">
                      {Array.from({ length: skill.proficiency }).map((_, i) => (
                        <Star key={i} className="w-3 h-3 fill-current" />
                      ))}
                    </div>
                    {skill.yearsOfExperience && (
                      <span className="text-xs opacity-75 flex items-center gap-0.5">
                        <TrendingUp className="w-3 h-3" />
                        {skill.yearsOfExperience}y
                      </span>
                    )}
                    <button
                      onClick={() => onRemoveSkill(skill.id)}
                      className="ml-1 hover:bg-black/10 dark:hover:bg-white/10 rounded p-0.5"
                    >
                      <X className="w-3 h-3" />
                    </button>
                  </div>
                ))}
              </div>
            </div>
          );
        })}

        {skills.length === 0 && (
          <div className="text-center py-8 text-gray-500 dark:text-gray-400">
            No skills added yet. Click "Add Skill" to get started.
          </div>
        )}
      </div>
    </div>
  );
};
