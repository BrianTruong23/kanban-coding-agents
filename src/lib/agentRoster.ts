import {
  AgentRoster,
  Skill,
  SkillCategory,
  PerformanceMetric,
  AssignmentScore,
} from '@/types/agentSkills';
import { BreakdownTask } from '@/types/breakdown';
import { generateId } from './utils';

export class AgentRosterService {
  static createAgentRoster(
    agentId: string,
    name: string,
    skills: Skill[],
    avatar?: string,
    avatarColor?: string
  ): AgentRoster {
    return {
      agentId,
      name,
      avatar,
      avatarColor,
      skills,
      performanceMetrics: [],
      availability: 'available',
      currentWorkload: 0,
      totalTasksCompleted: 0,
      createdAt: Date.now(),
      updatedAt: Date.now(),
    };
  }

  static addSkill(
    roster: AgentRoster,
    category: SkillCategory,
    name: string,
    proficiencyLevel: 1 | 2 | 3 | 4 | 5
  ): AgentRoster {
    const skill: Skill = {
      id: generateId(),
      category,
      name,
      proficiencyLevel,
    };

    return {
      ...roster,
      skills: [...roster.skills, skill],
      updatedAt: Date.now(),
    };
  }

  static updateSkillProficiency(
    roster: AgentRoster,
    skillId: string,
    proficiencyLevel: 1 | 2 | 3 | 4 | 5
  ): AgentRoster {
    return {
      ...roster,
      skills: roster.skills.map((skill) =>
        skill.id === skillId ? { ...skill, proficiencyLevel } : skill
      ),
      updatedAt: Date.now(),
    };
  }

  static addPerformanceMetric(
    roster: AgentRoster,
    metric: Omit<PerformanceMetric, 'completedAt'>
  ): AgentRoster {
    const performanceMetric: PerformanceMetric = {
      ...metric,
      completedAt: Date.now(),
    };

    const metrics = [...roster.performanceMetrics, performanceMetric];

    // Calculate updated statistics
    const averageQualityScore = this.calculateAverageQualityScore(metrics);
    const completionRate = this.calculateCompletionRate(metrics);

    return {
      ...roster,
      performanceMetrics: metrics,
      averageQualityScore,
      completionRate,
      totalTasksCompleted: roster.totalTasksCompleted + 1,
      updatedAt: Date.now(),
    };
  }

  static updateAvailability(
    roster: AgentRoster,
    availability: 'available' | 'busy' | 'unavailable'
  ): AgentRoster {
    return {
      ...roster,
      availability,
      updatedAt: Date.now(),
    };
  }

  static updateWorkload(roster: AgentRoster, workload: number): AgentRoster {
    let availability: 'available' | 'busy' | 'unavailable' = 'available';

    if (workload >= 5) {
      availability = 'busy';
    } else if (workload >= 10) {
      availability = 'unavailable';
    }

    return {
      ...roster,
      currentWorkload: workload,
      availability,
      updatedAt: Date.now(),
    };
  }

  private static calculateAverageQualityScore(metrics: PerformanceMetric[]): number {
    if (metrics.length === 0) return 0;

    const total = metrics.reduce((sum, metric) => sum + metric.qualityScore, 0);
    return Math.round((total / metrics.length) * 10) / 10;
  }

  private static calculateCompletionRate(metrics: PerformanceMetric[]): number {
    if (metrics.length === 0) return 0;

    const onTimeCount = metrics.filter((metric) => metric.onTime).length;
    return Math.round((onTimeCount / metrics.length) * 100);
  }

  static getSkillMatch(roster: AgentRoster, requiredTags: string[]): number {
    let matchScore = 0;

    for (const tag of requiredTags) {
      const matchingSkill = roster.skills.find(
        (skill) =>
          skill.category === tag ||
          skill.name.toLowerCase().includes(tag.toLowerCase())
      );

      if (matchingSkill) {
        matchScore += matchingSkill.proficiencyLevel;
      }
    }

    return matchScore;
  }

  static getPerformanceScore(roster: AgentRoster): number {
    const qualityWeight = 0.4;
    const completionWeight = 0.3;
    const experienceWeight = 0.3;

    const qualityScore = (roster.averageQualityScore || 0) / 5; // Normalize to 0-1
    const completionScore = (roster.completionRate || 0) / 100; // Normalize to 0-1
    const experienceScore = Math.min(roster.totalTasksCompleted / 50, 1); // Cap at 50 tasks

    return (
      qualityScore * qualityWeight +
      completionScore * completionWeight +
      experienceScore * experienceWeight
    );
  }

  static getAvailabilityScore(roster: AgentRoster): number {
    switch (roster.availability) {
      case 'available':
        return 1.0;
      case 'busy':
        return 0.5;
      case 'unavailable':
        return 0.0;
      default:
        return 0.0;
    }
  }

  static getWorkloadScore(roster: AgentRoster): number {
    // Prefer agents with less workload
    const maxWorkload = 10;
    return Math.max(0, (maxWorkload - roster.currentWorkload) / maxWorkload);
  }
}

export class AutoAssignmentService {
  static calculateAssignmentScores(
    rosters: AgentRoster[],
    task: BreakdownTask
  ): AssignmentScore[] {
    const scores: AssignmentScore[] = [];

    for (const roster of rosters) {
      const reasons: string[] = [];
      let score = 0;

      // Skill matching (40% weight)
      const skillMatch = AgentRosterService.getSkillMatch(roster, task.tags);
      const skillScore = skillMatch * 0.4;
      score += skillScore;
      if (skillMatch > 0) {
        reasons.push(`Skills match (${skillMatch} skill points)`);
      }

      // Performance history (30% weight)
      const performanceScore = AgentRosterService.getPerformanceScore(roster) * 30;
      score += performanceScore;
      if (roster.averageQualityScore) {
        reasons.push(`Quality score: ${roster.averageQualityScore}/5`);
      }
      if (roster.completionRate) {
        reasons.push(`${roster.completionRate}% on-time completion`);
      }

      // Availability (20% weight)
      const availabilityScore = AgentRosterService.getAvailabilityScore(roster) * 20;
      score += availabilityScore;
      reasons.push(`Status: ${roster.availability}`);

      // Workload balance (10% weight)
      const workloadScore = AgentRosterService.getWorkloadScore(roster) * 10;
      score += workloadScore;
      reasons.push(`Current workload: ${roster.currentWorkload} tasks`);

      // Priority bonus for high priority tasks
      if (task.priority >= 4) {
        const priorityBonus = performanceScore * 0.2;
        score += priorityBonus;
        reasons.push(`High priority task - performance bonus applied`);
      }

      scores.push({
        agentId: roster.agentId,
        score: Math.round(score * 100) / 100,
        reasons,
      });
    }

    // Sort by score descending
    return scores.sort((a, b) => b.score - a.score);
  }

  static autoAssign(
    rosters: AgentRoster[],
    task: BreakdownTask
  ): { agentId: string; score: number; reasons: string[] } | null {
    const scores = this.calculateAssignmentScores(rosters, task);

    if (scores.length === 0) return null;

    // Return the best match
    return scores[0];
  }

  static autoAssignBatch(
    rosters: AgentRoster[],
    tasks: BreakdownTask[]
  ): Map<string, string> {
    const assignments = new Map<string, string>(); // taskId -> agentId
    const workloadTracker = new Map<string, number>();

    // Initialize workload tracker
    rosters.forEach((roster) => {
      workloadTracker.set(roster.agentId, roster.currentWorkload);
    });

    // Sort tasks by priority (highest first)
    const sortedTasks = [...tasks].sort((a, b) => b.priority - a.priority);

    for (const task of sortedTasks) {
      // Create temporary rosters with updated workload
      const tempRosters = rosters.map((roster) => ({
        ...roster,
        currentWorkload: workloadTracker.get(roster.agentId) || 0,
      }));

      const assignment = this.autoAssign(tempRosters, task);

      if (assignment) {
        assignments.set(task.id, assignment.agentId);
        // Update workload tracker
        const currentWorkload = workloadTracker.get(assignment.agentId) || 0;
        workloadTracker.set(assignment.agentId, currentWorkload + 1);
      }
    }

    return assignments;
  }
}

export const DEFAULT_SKILLS: { [key: string]: Skill[] } = {
  fullstack: [
    { id: generateId(), category: 'frontend', name: 'React', proficiencyLevel: 4 },
    { id: generateId(), category: 'frontend', name: 'TypeScript', proficiencyLevel: 4 },
    { id: generateId(), category: 'backend', name: 'Node.js', proficiencyLevel: 4 },
    { id: generateId(), category: 'database', name: 'SQL', proficiencyLevel: 3 },
  ],
  frontend: [
    { id: generateId(), category: 'frontend', name: 'React', proficiencyLevel: 5 },
    { id: generateId(), category: 'frontend', name: 'CSS', proficiencyLevel: 5 },
    { id: generateId(), category: 'frontend', name: 'TypeScript', proficiencyLevel: 4 },
    { id: generateId(), category: 'design', name: 'UI/UX', proficiencyLevel: 4 },
  ],
  backend: [
    { id: generateId(), category: 'backend', name: 'Node.js', proficiencyLevel: 5 },
    { id: generateId(), category: 'backend', name: 'API Design', proficiencyLevel: 5 },
    { id: generateId(), category: 'database', name: 'PostgreSQL', proficiencyLevel: 4 },
    { id: generateId(), category: 'database', name: 'MongoDB', proficiencyLevel: 4 },
  ],
  devops: [
    { id: generateId(), category: 'devops', name: 'Docker', proficiencyLevel: 5 },
    { id: generateId(), category: 'devops', name: 'Kubernetes', proficiencyLevel: 4 },
    { id: generateId(), category: 'devops', name: 'CI/CD', proficiencyLevel: 5 },
    { id: generateId(), category: 'devops', name: 'AWS', proficiencyLevel: 4 },
  ],
  mobile: [
    { id: generateId(), category: 'mobile', name: 'React Native', proficiencyLevel: 5 },
    { id: generateId(), category: 'mobile', name: 'iOS', proficiencyLevel: 4 },
    { id: generateId(), category: 'mobile', name: 'Android', proficiencyLevel: 4 },
    { id: generateId(), category: 'frontend', name: 'TypeScript', proficiencyLevel: 4 },
  ],
};
