import { Task } from '@/types/task';
import { AgentWithSkills, AgentAssignmentRecommendation } from '@/types/agent-skills';
import { TaskHierarchy, RiskFlag } from '@/types/task-breakdown';

interface AssignmentContext {
  task: Task;
  hierarchy?: TaskHierarchy;
  currentWorkload: Map<string, number>; // agentId -> number of active tasks
}

// Extract skill requirements from task content
function extractRequiredSkills(task: Task, hierarchy?: TaskHierarchy): string[] {
  const text = `${task.title} ${task.description || ''}`.toLowerCase();
  const skills: Set<string> = new Set();

  // Frontend skills
  if (/react|component|ui|ux|frontend|form|page|css|styling|tailwind/.test(text)) {
    skills.add('React');
    skills.add('UI/UX');
  }
  if (/next\.?js|nextjs/.test(text)) {
    skills.add('Next.js');
  }
  if (/typescript|ts/.test(text)) {
    skills.add('TypeScript');
  }

  // Backend skills
  if (/api|endpoint|server|backend|node\.?js|express/.test(text)) {
    skills.add('API Design');
    skills.add('Node.js');
  }
  if (/database|sql|postgres|query|migration/.test(text)) {
    skills.add('Database');
    skills.add('PostgreSQL');
  }

  // DevOps skills
  if (/docker|container|deploy|ci\/cd|pipeline|infrastructure|aws|cloud/.test(text)) {
    skills.add('Docker');
    skills.add('CI/CD');
    skills.add('Infrastructure');
  }

  // Mobile skills
  if (/mobile|ios|android|react native/.test(text)) {
    skills.add('React Native');
    skills.add('Mobile UI');
  }

  // Check risk flags for additional skill requirements
  if (hierarchy?.riskFlags) {
    if (hierarchy.riskFlags.includes('security')) {
      skills.add('Security');
    }
    if (hierarchy.riskFlags.includes('performance')) {
      skills.add('Performance');
    }
  }

  return Array.from(skills);
}

// Calculate skill match score
function calculateSkillScore(
  requiredSkills: string[],
  agentSkills: AgentWithSkills['skills']
): { score: number; matchedSkills: string[] } {
  if (requiredSkills.length === 0) {
    return { score: 50, matchedSkills: [] }; // Neutral score when no specific skills needed
  }

  const matchedSkills: string[] = [];
  let totalScore = 0;

  for (const required of requiredSkills) {
    const agentSkill = agentSkills.find(
      (s) => s.skillName.toLowerCase() === required.toLowerCase()
    );
    if (agentSkill) {
      matchedSkills.push(required);
      // Skill level contributes to score (20 points per level)
      totalScore += agentSkill.skillLevel * 20;
    }
  }

  // Calculate percentage of matched skills
  const matchPercentage = (matchedSkills.length / requiredSkills.length) * 100;

  // Average the match percentage and skill level scores
  const averageSkillLevel = matchedSkills.length > 0 ? totalScore / matchedSkills.length : 0;

  return {
    score: (matchPercentage + averageSkillLevel) / 2,
    matchedSkills,
  };
}

// Calculate availability score based on current workload
function calculateAvailabilityScore(
  agentId: string,
  workload: Map<string, number>
): number {
  const currentTasks = workload.get(agentId) || 0;

  // Score decreases as workload increases
  if (currentTasks === 0) return 100;
  if (currentTasks === 1) return 80;
  if (currentTasks === 2) return 60;
  if (currentTasks === 3) return 40;
  if (currentTasks === 4) return 20;
  return 10;
}

// Calculate performance score
function calculatePerformanceScore(agent: AgentWithSkills): number {
  if (!agent.performanceMetrics) {
    return 70; // Default score for agents without history
  }

  const metrics = agent.performanceMetrics;

  // Weight factors
  const qualityWeight = 0.5;
  const timeWeight = 0.3;
  const onTimeWeight = 0.2;

  // Normalize metrics to 0-100 scale
  const qualityScore = ((metrics.averageQualityScore || 3) / 5) * 100;
  const onTimeScore = metrics.onTimePercentage || 50;

  // Time score: inverse relationship (faster is better)
  // Assuming 40 hours is baseline, scale from there
  const baselineHours = 40;
  const timeScore = metrics.averageCompletionTime
    ? Math.max(0, 100 - ((metrics.averageCompletionTime - baselineHours) / baselineHours) * 50)
    : 70;

  return qualityWeight * qualityScore + timeWeight * timeScore + onTimeWeight * onTimeScore;
}

// Generate reasons for recommendation
function generateReasons(
  skillScore: number,
  matchedSkills: string[],
  availabilityScore: number,
  performanceScore: number,
  agent: AgentWithSkills
): string[] {
  const reasons: string[] = [];

  if (matchedSkills.length > 0) {
    reasons.push(`Strong match: ${matchedSkills.slice(0, 3).join(', ')}`);
  }

  if (availabilityScore >= 80) {
    reasons.push('High availability (low workload)');
  } else if (availabilityScore < 40) {
    reasons.push('Currently at capacity');
  }

  if (agent.performanceMetrics) {
    if (agent.performanceMetrics.averageQualityScore >= 4) {
      reasons.push('Consistently high quality work');
    }
    if (agent.performanceMetrics.onTimePercentage >= 90) {
      reasons.push('Excellent on-time delivery record');
    }
  }

  if (skillScore >= 80) {
    reasons.push('Expert-level skills in required areas');
  } else if (skillScore < 30) {
    reasons.push('Limited experience in required skills');
  }

  return reasons;
}

export function recommendAgentAssignment(
  context: AssignmentContext,
  agents: AgentWithSkills[]
): AgentAssignmentRecommendation[] {
  const requiredSkills = extractRequiredSkills(context.task, context.hierarchy);

  const recommendations: AgentAssignmentRecommendation[] = agents.map((agent) => {
    const { score: skillScore, matchedSkills } = calculateSkillScore(
      requiredSkills,
      agent.skills
    );
    const availabilityScore = calculateAvailabilityScore(agent.id, context.currentWorkload);
    const performanceScore = calculatePerformanceScore(agent);

    // Weighted total score
    const totalScore =
      skillScore * 0.5 + // Skills are most important
      availabilityScore * 0.3 + // Availability is important
      performanceScore * 0.2; // Performance history

    const reasons = generateReasons(
      skillScore,
      matchedSkills,
      availabilityScore,
      performanceScore,
      agent
    );

    return {
      agentId: agent.id,
      agentName: agent.name,
      score: Math.round(totalScore),
      reasons,
      matchedSkills,
      availabilityScore: Math.round(availabilityScore),
      performanceScore: Math.round(performanceScore),
    };
  });

  // Sort by score descending
  return recommendations.sort((a, b) => b.score - a.score);
}

export function autoAssignAgent(
  context: AssignmentContext,
  agents: AgentWithSkills[],
  threshold: number = 70
): string | null {
  const recommendations = recommendAgentAssignment(context, agents);

  if (recommendations.length === 0) {
    return null;
  }

  const topRecommendation = recommendations[0];

  // Only auto-assign if confidence is above threshold
  if (topRecommendation.score >= threshold) {
    return topRecommendation.agentId;
  }

  return null;
}

// Batch assignment for multiple tasks
export function batchAssignAgents(
  tasks: { task: Task; hierarchy?: TaskHierarchy }[],
  agents: AgentWithSkills[]
): Map<string, string> {
  const assignments = new Map<string, string>();
  const workload = new Map<string, number>();

  // Initialize workload
  agents.forEach((agent) => {
    workload.set(agent.id, 0);
  });

  // Sort tasks by priority and estimated effort
  const sortedTasks = [...tasks].sort((a, b) => {
    // Higher priority first
    if (a.task.priority !== b.task.priority) {
      return a.task.priority - b.task.priority;
    }
    // Then by estimated effort (larger tasks first)
    const effortA = a.hierarchy?.estimatedEffort || 0;
    const effortB = b.hierarchy?.estimatedEffort || 0;
    return effortB - effortA;
  });

  // Assign each task
  for (const { task, hierarchy } of sortedTasks) {
    const context: AssignmentContext = {
      task,
      hierarchy,
      currentWorkload: workload,
    };

    const agentId = autoAssignAgent(context, agents, 60); // Lower threshold for batch

    if (agentId) {
      assignments.set(task.id, agentId);
      workload.set(agentId, (workload.get(agentId) || 0) + 1);
    }
  }

  return assignments;
}
