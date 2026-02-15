import {
  BreakdownRequest,
  BreakdownResult,
  Epic,
  Ticket,
  Subtask,
  TaskDependency,
  RiskLevel,
  SkillCategory,
} from '@/types/breakdown';
import { CodingAgent } from '@/types/agent';
import { AgentSkill, AgentPerformance } from '@/types/breakdown';

/**
 * Analyzes text content to identify task breakdown structure
 * This is a rule-based approach that can be enhanced with actual AI/LLM integration
 */
export function analyzeTaskStructure(content: string): {
  hasEpics: boolean;
  hasTickets: boolean;
  hasSubtasks: boolean;
  estimatedComplexity: 'low' | 'medium' | 'high';
} {
  const lines = content.split('\n').filter(line => line.trim());

  // Simple heuristics
  const hasEpics = /epic|milestone|phase|initiative/i.test(content);
  const hasTickets = /ticket|story|feature|task/i.test(content);
  const hasSubtasks = /subtask|step|action item|checklist/i.test(content);

  const wordCount = content.split(/\s+/).length;
  const estimatedComplexity = wordCount > 500 ? 'high' : wordCount > 200 ? 'medium' : 'low';

  return { hasEpics, hasTickets, hasSubtasks, estimatedComplexity };
}

/**
 * Extracts risk indicators from text
 */
export function extractRiskLevel(text: string): RiskLevel {
  const lowerText = text.toLowerCase();

  if (lowerText.includes('critical') || lowerText.includes('urgent') ||
      lowerText.includes('security') || lowerText.includes('data loss')) {
    return 'critical';
  }

  if (lowerText.includes('high risk') || lowerText.includes('breaking change') ||
      lowerText.includes('migration') || lowerText.includes('refactor')) {
    return 'high';
  }

  if (lowerText.includes('medium risk') || lowerText.includes('complex') ||
      lowerText.includes('integration')) {
    return 'medium';
  }

  return 'low';
}

/**
 * Identifies required skills from task description
 */
export function identifyRequiredSkills(text: string): SkillCategory[] {
  const skills: SkillCategory[] = [];
  const lowerText = text.toLowerCase();

  if (/react|vue|angular|frontend|ui|ux|css|html/.test(lowerText)) {
    skills.push('frontend');
  }

  if (/api|backend|server|node|python|java|go/.test(lowerText)) {
    skills.push('backend');
  }

  if (/database|sql|postgresql|mysql|mongodb|redis/.test(lowerText)) {
    skills.push('database');
  }

  if (/devops|docker|kubernetes|ci\/cd|deployment|infrastructure/.test(lowerText)) {
    skills.push('devops');
  }

  if (/mobile|ios|android|react native|flutter/.test(lowerText)) {
    skills.push('mobile');
  }

  if (/test|testing|qa|quality/.test(lowerText)) {
    skills.push('testing');
  }

  if (/design|figma|sketch|wireframe/.test(lowerText)) {
    skills.push('design');
  }

  if (/ai|ml|machine learning|nlp|llm/.test(lowerText)) {
    skills.push('ai-ml');
  }

  return skills.length > 0 ? skills : ['backend']; // Default to backend
}

/**
 * Estimates effort in hours based on complexity and scope
 */
export function estimateEffort(text: string, type: 'epic' | 'ticket' | 'subtask'): number {
  const wordCount = text.split(/\s+/).length;
  const complexity = extractRiskLevel(text);

  let baseHours = 0;

  // Base hours by type
  switch (type) {
    case 'epic':
      baseHours = 40; // ~1 week
      break;
    case 'ticket':
      baseHours = 8; // ~1 day
      break;
    case 'subtask':
      baseHours = 2; // ~2 hours
      break;
  }

  // Adjust by complexity
  const multiplier = complexity === 'critical' ? 2 : complexity === 'high' ? 1.5 :
                    complexity === 'medium' ? 1 : 0.75;

  // Adjust by word count (more description = more work)
  const wordMultiplier = Math.max(0.5, Math.min(2, wordCount / 100));

  return Math.round(baseHours * multiplier * wordMultiplier);
}

/**
 * Breaks down a request into structured tasks
 * This is a simplified version - in production, this would use an LLM API
 */
export function breakdownTask(request: BreakdownRequest): BreakdownResult {
  const structure = analyzeTaskStructure(request.content);
  const epics: Epic[] = [];
  const tickets: Ticket[] = [];
  const subtasks: Subtask[] = [];
  const dependencies: TaskDependency[] = [];

  // Parse the content to extract structured information
  const lines = request.content.split('\n').filter(line => line.trim());

  let currentEpic: Epic | null = null;
  let currentTicket: Ticket | null = null;
  let ticketCounter = 1;

  // Simple parsing logic (would be replaced with LLM in production)
  lines.forEach((line, index) => {
    const trimmed = line.trim();

    // Identify epics (headers like ## or starting with Epic:)
    if (trimmed.match(/^#{1,2}\s+/) || trimmed.toLowerCase().startsWith('epic:')) {
      const title = trimmed.replace(/^#{1,2}\s+/, '').replace(/^epic:\s*/i, '');
      const epicId = `epic-${Date.now()}-${index}`;

      currentEpic = {
        id: epicId,
        userId: '', // Will be set when saving
        title,
        description: request.content.substring(0, 200),
        objectives: [],
        acceptanceCriteria: [],
        riskLevel: extractRiskLevel(trimmed),
        estimatedEffort: estimateEffort(trimmed, 'epic'),
        status: 'planning',
        createdAt: Date.now(),
        updatedAt: Date.now(),
      };
      epics.push(currentEpic);
    }

    // Identify tickets (starting with - or * or numbered)
    if (trimmed.match(/^[-*\d]+\.\s+/) && !trimmed.toLowerCase().includes('subtask')) {
      const title = trimmed.replace(/^[-*\d]+\.\s+/, '');
      const ticketId = `TKT-${ticketCounter++}`;

      currentTicket = {
        id: `ticket-${Date.now()}-${index}`,
        epicId: currentEpic?.id,
        userId: '', // Will be set when saving
        ticketId,
        title,
        description: title,
        definitionOfDone: [],
        testNotes: [],
        riskLevel: extractRiskLevel(title),
        riskFlags: [],
        estimatedEffort: estimateEffort(title, 'ticket'),
        priority: 3,
        requiredSkills: identifyRequiredSkills(title),
        status: 'backlog',
        tags: [],
        createdAt: Date.now(),
        updatedAt: Date.now(),
      };
      tickets.push(currentTicket);
    }

    // Identify subtasks (indented or starting with subtask)
    if (currentTicket && (trimmed.match(/^\s{2,}[-*]\s+/) || trimmed.toLowerCase().includes('subtask'))) {
      const title = trimmed.replace(/^\s{2,}[-*]\s+/, '').replace(/^subtask:\s*/i, '');

      subtasks.push({
        id: `subtask-${Date.now()}-${index}`,
        ticketId: currentTicket.id,
        userId: '', // Will be set when saving
        title,
        estimatedEffort: estimateEffort(title, 'subtask'),
        completed: false,
        createdAt: Date.now(),
        updatedAt: Date.now(),
      });
    }
  });

  // If no structured content found, create a single ticket
  if (tickets.length === 0) {
    const title = request.content.substring(0, 100);
    tickets.push({
      id: `ticket-${Date.now()}`,
      userId: '',
      ticketId: 'TKT-1',
      title,
      description: request.content,
      definitionOfDone: [],
      testNotes: [],
      riskLevel: extractRiskLevel(request.content),
      riskFlags: [],
      estimatedEffort: estimateEffort(request.content, 'ticket'),
      priority: 3,
      requiredSkills: identifyRequiredSkills(request.content),
      status: 'backlog',
      tags: [],
      createdAt: Date.now(),
      updatedAt: Date.now(),
    });
  }

  return {
    epics,
    tickets,
    subtasks,
    dependencies,
    suggestions: {
      agentAssignments: [],
      riskMitigation: [],
    },
  };
}

/**
 * Calculates agent match score for a task based on skills and performance
 */
export function calculateAgentMatchScore(
  agent: CodingAgent,
  agentSkills: AgentSkill[],
  agentPerformance: AgentPerformance | null,
  requiredSkills: SkillCategory[],
  taskPriority: number
): { score: number; reason: string } {
  let score = 0;
  const reasons: string[] = [];

  // Skills match (0-50 points)
  const relevantSkills = agentSkills.filter(skill =>
    requiredSkills.includes(skill.skillCategory)
  );

  if (relevantSkills.length > 0) {
    const avgProficiency = relevantSkills.reduce((sum, skill) =>
      sum + skill.proficiencyLevel, 0) / relevantSkills.length;
    score += (avgProficiency / 5) * 50;
    reasons.push(`Has ${relevantSkills.length} matching skill(s) with avg proficiency ${avgProficiency.toFixed(1)}/5`);
  } else {
    reasons.push('No direct skill match');
  }

  // Performance metrics (0-30 points)
  if (agentPerformance) {
    const qualityScore = (agentPerformance.qualityScore / 100) * 15;
    const deliveryScore = (agentPerformance.onTimeDelivery / 100) * 15;
    score += qualityScore + deliveryScore;
    reasons.push(`Quality: ${agentPerformance.qualityScore}%, On-time: ${agentPerformance.onTimeDelivery}%`);
  }

  // Availability (0-20 points) - simplified, would check current workload in production
  score += 20;
  reasons.push('Available for assignment');

  const reason = reasons.join('; ');
  return { score: Math.round(score), reason };
}

/**
 * Auto-assigns tasks to agents based on skills and performance
 */
export function autoAssignTasks(
  tickets: Ticket[],
  agents: CodingAgent[],
  agentSkills: Map<string, AgentSkill[]>,
  agentPerformance: Map<string, AgentPerformance | null>
): Array<{
  taskId: string;
  recommendedAgentId: string;
  reason: string;
  confidence: number;
}> {
  const assignments: Array<{
    taskId: string;
    recommendedAgentId: string;
    reason: string;
    confidence: number;
  }> = [];

  for (const ticket of tickets) {
    let bestAgent: CodingAgent | undefined = undefined;
    let bestScore = 0;
    let bestReason = '';

    for (const agent of agents) {
      const skills = agentSkills.get(agent.id) || [];
      const performance = agentPerformance.get(agent.id) || null;

      const { score, reason } = calculateAgentMatchScore(
        agent,
        skills,
        performance,
        ticket.requiredSkills,
        ticket.priority
      );

      if (score > bestScore) {
        bestScore = score;
        bestAgent = agent;
        bestReason = reason;
      }
    }

    if (bestAgent) {
      assignments.push({
        taskId: ticket.id,
        recommendedAgentId: bestAgent.id,
        reason: bestReason,
        confidence: bestScore,
      });
    }
  }

  return assignments;
}

/**
 * Generates risk mitigation suggestions
 */
export function generateRiskMitigation(tickets: Ticket[]): Array<{
  taskId: string;
  risk: string;
  mitigation: string;
}> {
  const suggestions: Array<{ taskId: string; risk: string; mitigation: string }> = [];

  tickets.forEach(ticket => {
    if (ticket.riskLevel === 'critical' || ticket.riskLevel === 'high') {
      suggestions.push({
        taskId: ticket.id,
        risk: `${ticket.riskLevel} risk task: ${ticket.title}`,
        mitigation: 'Consider: (1) Breaking into smaller tasks, (2) Adding more test coverage, (3) Conducting code review with senior developer',
      });
    }

    if (ticket.requiredSkills.length > 3) {
      suggestions.push({
        taskId: ticket.id,
        risk: 'Task requires multiple skill sets',
        mitigation: 'Consider: (1) Splitting into focused tasks, (2) Assigning to pair of agents with complementary skills',
      });
    }

    if (ticket.estimatedEffort > 40) {
      suggestions.push({
        taskId: ticket.id,
        risk: 'Large estimated effort (>40 hours)',
        mitigation: 'Consider: Breaking down into multiple smaller tickets with clear milestones',
      });
    }
  });

  return suggestions;
}
