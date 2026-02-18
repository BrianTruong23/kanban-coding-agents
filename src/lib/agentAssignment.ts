import { Task } from '@/types/task';
import { AgentWithSkills, AgentSkill } from '@/types/agent';

export interface AssignmentScore {
  agentId: string;
  agentName: string;
  score: number;
  reasons: string[];
  skillMatch: number;
  availabilityScore: number;
  performanceScore: number;
}

/**
 * Calculates how well an agent's skills match task requirements
 */
export function calculateSkillMatch(
  requiredSkills: string[],
  agentSkills: AgentSkill[]
): { score: number; matchedSkills: string[] } {
  if (requiredSkills.length === 0) {
    return { score: 0.5, matchedSkills: [] }; // Neutral score if no requirements
  }

  const agentSkillMap = new Map(
    agentSkills.map(s => [s.skillName.toLowerCase(), s.skillLevel])
  );

  let totalScore = 0;
  const matchedSkills: string[] = [];

  for (const requiredSkill of requiredSkills) {
    const skillLevel = agentSkillMap.get(requiredSkill.toLowerCase());
    if (skillLevel) {
      // Convert skill level (1-5) to a score (0.2-1.0)
      totalScore += skillLevel / 5;
      matchedSkills.push(requiredSkill);
    }
  }

  // Normalize score to 0-1 range
  const score = requiredSkills.length > 0
    ? totalScore / requiredSkills.length
    : 0.5;

  return { score, matchedSkills };
}

/**
 * Calculates agent availability based on current workload
 */
export function calculateAvailability(
  agentId: string,
  allTasks: Task[]
): { score: number; activeTasksCount: number } {
  const activeTasks = allTasks.filter(
    t => t.assignedAgentId === agentId &&
    (t.status === 'in-progress' || t.status === 'review')
  );

  const activeTasksCount = activeTasks.length;

  // Score decreases as workload increases
  // 0 tasks = 1.0, 1 task = 0.8, 2 tasks = 0.6, 3+ tasks = 0.4
  let score = 1.0;
  if (activeTasksCount >= 3) score = 0.4;
  else if (activeTasksCount === 2) score = 0.6;
  else if (activeTasksCount === 1) score = 0.8;

  return { score, activeTasksCount };
}

/**
 * Calculates agent performance score based on historical data
 */
export function calculatePerformanceScore(
  agent: AgentWithSkills
): { score: number; avgQuality: number; avgSpeed: number } {
  if (!agent.performanceMetrics || agent.performanceMetrics.tasksCompleted === 0) {
    return { score: 0.7, avgQuality: 0, avgSpeed: 0 }; // Default neutral score
  }

  const { averageQualityScore = 3, averageCompletionTime = 0 } = agent.performanceMetrics;

  // Quality score (1-5) normalized to 0-1
  const qualityScore = averageQualityScore / 5;

  // Speed score (faster is better, but use reasonable thresholds)
  // Assume average task takes 8 hours, faster gets higher score
  let speedScore = 0.7;
  if (averageCompletionTime > 0) {
    if (averageCompletionTime <= 4) speedScore = 1.0;
    else if (averageCompletionTime <= 6) speedScore = 0.9;
    else if (averageCompletionTime <= 8) speedScore = 0.8;
    else if (averageCompletionTime <= 12) speedScore = 0.6;
    else speedScore = 0.5;
  }

  // Combined score (70% quality, 30% speed)
  const score = (qualityScore * 0.7) + (speedScore * 0.3);

  return {
    score,
    avgQuality: averageQualityScore,
    avgSpeed: averageCompletionTime,
  };
}

/**
 * Extracts required skills from task tags and description
 */
export function extractRequiredSkills(task: Task): string[] {
  const skills = new Set<string>();

  // Extract from tags
  task.tags.forEach(tag => {
    const normalized = tag.toLowerCase().trim();
    // Map common tags to skills
    const tagSkillMap: Record<string, string> = {
      'react': 'React',
      'nextjs': 'Next.js',
      'next.js': 'Next.js',
      'typescript': 'TypeScript',
      'javascript': 'JavaScript',
      'nodejs': 'Node.js',
      'node': 'Node.js',
      'api': 'API Design',
      'database': 'Database Design',
      'postgres': 'PostgreSQL',
      'postgresql': 'PostgreSQL',
      'css': 'CSS',
      'ui': 'UI/UX',
      'ux': 'UI/UX',
      'mobile': 'Mobile Development',
      'react-native': 'React Native',
      'ios': 'iOS',
      'android': 'Android',
      'docker': 'Docker',
      'kubernetes': 'Kubernetes',
      'devops': 'DevOps',
      'ci/cd': 'CI/CD',
      'aws': 'AWS',
      'testing': 'Testing',
    };

    if (tagSkillMap[normalized]) {
      skills.add(tagSkillMap[normalized]);
    }
  });

  // Extract from description
  const text = `${task.title} ${task.description}`.toLowerCase();
  const descriptionSkillMap: Record<string, string> = {
    'react': 'React',
    'next.js': 'Next.js',
    'typescript': 'TypeScript',
    'node.js': 'Node.js',
    'api': 'API Design',
    'database': 'Database Design',
    'postgres': 'PostgreSQL',
    'ui': 'UI/UX',
    'mobile': 'Mobile Development',
  };

  for (const [keyword, skill] of Object.entries(descriptionSkillMap)) {
    if (text.includes(keyword)) {
      skills.add(skill);
    }
  }

  return Array.from(skills);
}

/**
 * Recommends the best agent for a task based on skills, availability, and performance
 */
export function recommendAgent(
  task: Task,
  agents: AgentWithSkills[],
  allTasks: Task[]
): AssignmentScore[] {
  const requiredSkills = extractRequiredSkills(task);

  const scores: AssignmentScore[] = agents.map(agent => {
    const { score: skillScore, matchedSkills } = calculateSkillMatch(
      requiredSkills,
      agent.skills
    );

    const { score: availabilityScore, activeTasksCount } = calculateAvailability(
      agent.id,
      allTasks
    );

    const { score: performanceScore, avgQuality, avgSpeed } = calculatePerformanceScore(agent);

    // Weighted total score
    // Skills: 50%, Availability: 30%, Performance: 20%
    const totalScore = (
      (skillScore * 0.5) +
      (availabilityScore * 0.3) +
      (performanceScore * 0.2)
    );

    const reasons: string[] = [];

    // Add reasons for the score
    if (matchedSkills.length > 0) {
      reasons.push(`Has skills: ${matchedSkills.join(', ')}`);
    }
    if (matchedSkills.length < requiredSkills.length) {
      const missing = requiredSkills.filter(s =>
        !matchedSkills.some(ms => ms.toLowerCase() === s.toLowerCase())
      );
      reasons.push(`Missing skills: ${missing.join(', ')}`);
    }
    if (activeTasksCount === 0) {
      reasons.push('Currently available (no active tasks)');
    } else if (activeTasksCount === 1) {
      reasons.push('Has 1 active task');
    } else {
      reasons.push(`Busy with ${activeTasksCount} active tasks`);
    }
    if (agent.performanceMetrics && agent.performanceMetrics.tasksCompleted > 0) {
      reasons.push(`Avg quality: ${avgQuality.toFixed(1)}/5, Avg time: ${avgSpeed.toFixed(1)}h`);
    }

    return {
      agentId: agent.id,
      agentName: agent.name,
      score: totalScore,
      reasons,
      skillMatch: skillScore,
      availabilityScore,
      performanceScore,
    };
  });

  // Sort by score descending
  return scores.sort((a, b) => b.score - a.score);
}

/**
 * Auto-assigns tasks to agents based on recommendations
 */
export function autoAssignTasks(
  tasks: Task[],
  agents: AgentWithSkills[],
  allTasks: Task[],
  threshold: number = 0.6 // Only auto-assign if confidence > 60%
): Map<string, string> {
  const assignments = new Map<string, string>(); // taskId -> agentId

  // Filter unassigned tasks
  const unassignedTasks = tasks.filter(t => !t.assignedAgentId);

  // Sort tasks by priority (higher first)
  const sortedTasks = [...unassignedTasks].sort((a, b) => b.priority - a.priority);

  for (const task of sortedTasks) {
    const recommendations = recommendAgent(task, agents, allTasks);

    if (recommendations.length > 0 && recommendations[0].score >= threshold) {
      assignments.set(task.id, recommendations[0].agentId);
    }
  }

  return assignments;
}

/**
 * Detects potential skill gaps in the agent roster
 */
export function detectSkillGaps(
  tasks: Task[],
  agents: AgentWithSkills[]
): { skill: string; demand: number; supply: number }[] {
  const skillDemand = new Map<string, number>();
  const skillSupply = new Map<string, number>();

  // Count skill demand from tasks
  tasks.forEach(task => {
    const skills = extractRequiredSkills(task);
    skills.forEach(skill => {
      skillDemand.set(skill, (skillDemand.get(skill) || 0) + 1);
    });
  });

  // Count skill supply from agents
  agents.forEach(agent => {
    agent.skills.forEach(skill => {
      // Weight by skill level (higher level = more supply)
      skillSupply.set(
        skill.skillName,
        (skillSupply.get(skill.skillName) || 0) + (skill.skillLevel / 5)
      );
    });
  });

  // Find gaps
  const gaps: { skill: string; demand: number; supply: number }[] = [];

  skillDemand.forEach((demand, skill) => {
    const supply = skillSupply.get(skill) || 0;
    if (supply < demand * 0.5) { // Gap if supply < 50% of demand
      gaps.push({ skill, demand, supply });
    }
  });

  return gaps.sort((a, b) => (b.demand - b.supply) - (a.demand - a.supply));
}
